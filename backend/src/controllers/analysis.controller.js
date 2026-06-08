const axios = require('axios');
const Resume = require('../models/Resume');
const Analysis = require('../models/Analysis');
const User = require('../models/User');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

// POST /api/analysis/analyze
exports.analyzeResume = async (req, res, next) => {
  const startTime = Date.now();
  let analysis = null;

  try {
    const { resumeId } = req.body;

    // Validate resume ownership
    const resume = await Resume.findOne({ _id: resumeId, user: req.user._id, isActive: true });
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found.' });
    }

    if (!resume.extractedText || resume.extractedText.trim().length < 50) {
      return res.status(422).json({ error: 'Could not extract enough text from this resume.' });
    }

    // Check usage limits
    const user = await User.findById(req.user._id);
    user.resetUsageIfNeeded();

    if (!user.canAnalyze()) {
      return res.status(403).json({
        error: 'Monthly analysis limit reached. Upgrade to Premium for unlimited analyses.',
        upgradeRequired: true,
      });
    }

    // Create pending analysis record
    analysis = await Analysis.create({
      user: req.user._id,
      resume: resume._id,
      status: 'processing',
    });

    // Call ML service
    const mlResponse = await axios.post(
      `${ML_SERVICE_URL}/analyze`,
      { text: resume.extractedText, resume_id: resume._id.toString() },
      { timeout: 60000 }
    );

    const mlData = mlResponse.data;

    // Update analysis with ML results
    const updated = await Analysis.findByIdAndUpdate(
      analysis._id,
      {
        overallScore: mlData.overall_score,
        atsScore: mlData.ats_score,
        contentScore: mlData.content_score,
        formattingScore: mlData.formatting_score,
        predictedRole: mlData.predicted_role,
        roleConfidence: mlData.role_confidence,
        alternativeRoles: mlData.alternative_roles || [],
        extractedSkills: mlData.skills || { technical: [], soft: [], tools: [] },
        missingSkills: mlData.missing_skills || [],
        strengths: mlData.strengths || [],
        weaknesses: mlData.weaknesses || [],
        recommendations: mlData.recommendations || [],
        sections: mlData.sections || {},
        atsDetails: mlData.ats_details || {},
        status: 'completed',
        processingTimeMs: Date.now() - startTime,
      },
      { new: true }
    );

    // Increment usage
    user.usageThisMonth.analyses += 1;
    await user.save({ validateBeforeSave: false });

    res.status(201).json({ message: 'Analysis complete.', analysis: updated });
  } catch (err) {
    // Mark analysis as failed
    if (analysis) {
      await Analysis.findByIdAndUpdate(analysis._id, {
        status: 'failed',
        errorMessage: err.message,
      });
    }

    if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
      return res.status(503).json({ error: 'ML service unavailable. Please try again later.' });
    }
    next(err);
  }
};

// GET /api/analysis
exports.getMyAnalyses = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [analyses, total] = await Promise.all([
      Analysis.find({ user: req.user._id, status: 'completed' })
        .populate('resume', 'originalName label fileType')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Analysis.countDocuments({ user: req.user._id, status: 'completed' }),
    ]);

    res.json({ analyses, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) {
    next(err);
  }
};

// GET /api/analysis/:id
exports.getAnalysis = async (req, res, next) => {
  try {
    const analysis = await Analysis.findOne({ _id: req.params.id, user: req.user._id })
      .populate('resume', 'originalName label fileType fileUrl');
    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found.' });
    }
    res.json({ analysis });
  } catch (err) {
    next(err);
  }
};

// GET /api/analysis/stats
exports.getStats = async (req, res, next) => {
  try {
    const analyses = await Analysis.find({ user: req.user._id, status: 'completed' })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('overallScore atsScore predictedRole createdAt');

    const avgScore = analyses.length
      ? (analyses.reduce((s, a) => s + (a.overallScore || 0), 0) / analyses.length).toFixed(1)
      : 0;

    res.json({
      totalAnalyses: analyses.length,
      averageScore: parseFloat(avgScore),
      recentTrend: analyses.map((a) => ({
        date: a.createdAt,
        overallScore: a.overallScore,
        atsScore: a.atsScore,
        role: a.predictedRole,
      })),
    });
  } catch (err) {
    next(err);
  }
};
