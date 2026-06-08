const axios = require('axios');
const Resume = require('../models/Resume');
const JobMatch = require('../models/JobMatch');
const User = require('../models/User');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

// POST /api/job-match
exports.matchJob = async (req, res, next) => {
  let jobMatch = null;
  try {
    const { resumeId, jobTitle, jobDescription, companyName } = req.body;

    if (!jobDescription || jobDescription.trim().length < 50) {
      return res.status(400).json({ error: 'Please provide a detailed job description (at least 50 characters).' });
    }

    const resume = await Resume.findOne({ _id: resumeId, user: req.user._id, isActive: true });
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found.' });
    }

    const user = await User.findById(req.user._id);
    if (user.subscription.plan !== 'premium') {
      return res.status(403).json({
        error: 'Job matching is a Premium feature. Please upgrade your plan.',
        upgradeRequired: true,
      });
    }

    jobMatch = await JobMatch.create({
      user: req.user._id,
      resume: resume._id,
      jobTitle,
      jobDescription,
      companyName: companyName || '',
      status: 'processing',
    });

    const mlResponse = await axios.post(
      `${ML_SERVICE_URL}/job-match`,
      {
        resume_text: resume.extractedText,
        job_description: jobDescription,
        job_title: jobTitle,
      },
      { timeout: 60000 }
    );

    const mlData = mlResponse.data;

    const updated = await JobMatch.findByIdAndUpdate(
      jobMatch._id,
      {
        overallMatch: mlData.overall_match,
        skillsMatch: mlData.skills_match,
        experienceMatch: mlData.experience_match,
        educationMatch: mlData.education_match,
        keywordsMatch: mlData.keywords_match,
        matchedSkills: mlData.matched_skills || [],
        missingSkills: mlData.missing_skills || [],
        matchedKeywords: mlData.matched_keywords || [],
        missingKeywords: mlData.missing_keywords || [],
        recommendations: mlData.recommendations || [],
        summary: mlData.summary || '',
        status: 'completed',
      },
      { new: true }
    );

    user.usageThisMonth.jobMatches += 1;
    await user.save({ validateBeforeSave: false });

    res.status(201).json({ message: 'Job match complete.', jobMatch: updated });
  } catch (err) {
    if (jobMatch) {
      await JobMatch.findByIdAndUpdate(jobMatch._id, { status: 'failed' });
    }
    if (err.code === 'ECONNREFUSED') {
      return res.status(503).json({ error: 'ML service unavailable.' });
    }
    next(err);
  }
};

// GET /api/job-match
exports.getMyMatches = async (req, res, next) => {
  try {
    const matches = await JobMatch.find({ user: req.user._id, status: 'completed' })
      .populate('resume', 'originalName label')
      .sort({ createdAt: -1 })
      .limit(20);
    res.json({ matches });
  } catch (err) {
    next(err);
  }
};

// GET /api/job-match/:id
exports.getMatch = async (req, res, next) => {
  try {
    const match = await JobMatch.findOne({ _id: req.params.id, user: req.user._id })
      .populate('resume', 'originalName label fileType');
    if (!match) return res.status(404).json({ error: 'Job match not found.' });
    res.json({ match });
  } catch (err) {
    next(err);
  }
};
