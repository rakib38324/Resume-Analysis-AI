const mongoose = require('mongoose');

const jobMatchSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  resume: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume', required: true },

  jobTitle: { type: String, required: true },
  jobDescription: { type: String, required: true },
  companyName: { type: String, default: '' },

  // Match results
  overallMatch: { type: Number, min: 0, max: 100 },
  skillsMatch: { type: Number, min: 0, max: 100 },
  experienceMatch: { type: Number, min: 0, max: 100 },
  educationMatch: { type: Number, min: 0, max: 100 },
  keywordsMatch: { type: Number, min: 0, max: 100 },

  matchedSkills: [String],
  missingSkills: [String],
  matchedKeywords: [String],
  missingKeywords: [String],

  recommendations: [String],
  summary: { type: String, default: '' },

  status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
}, { timestamps: true });

jobMatchSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('JobMatch', jobMatchSchema);
