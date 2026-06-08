const mongoose = require('mongoose');

const analysisSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  resume: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume', required: true },

  // Scores
  overallScore: { type: Number, min: 0, max: 100 },
  atsScore: { type: Number, min: 0, max: 100 },
  contentScore: { type: Number, min: 0, max: 100 },
  formattingScore: { type: Number, min: 0, max: 100 },

  // ML outputs
  predictedRole: { type: String, default: null },
  roleConfidence: { type: Number, default: null },
  alternativeRoles: [{ role: String, confidence: Number }],

  // Skills
  extractedSkills: {
    technical: [String],
    soft: [String],
    tools: [String],
  },
  missingSkills: [String],

  // Detailed feedback
  strengths: [String],
  weaknesses: [String],
  recommendations: [{ priority: String, category: String, suggestion: String }],

  // Section scores
  sections: {
    contactInfo: { present: Boolean, score: Number },
    summary: { present: Boolean, score: Number },
    experience: { present: Boolean, score: Number },
    education: { present: Boolean, score: Number },
    skills: { present: Boolean, score: Number },
    projects: { present: Boolean, score: Number },
    certifications: { present: Boolean, score: Number },
  },

  // ATS details
  atsDetails: {
    keywordDensity: Number,
    formattingIssues: [String],
    fontIssues: Boolean,
    tableIssues: Boolean,
    imageIssues: Boolean,
  },

  status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
  errorMessage: { type: String, default: null },
  processingTimeMs: { type: Number, default: null },
}, { timestamps: true });

analysisSchema.index({ user: 1, createdAt: -1 });
analysisSchema.index({ resume: 1 });

module.exports = mongoose.model('Analysis', analysisSchema);
