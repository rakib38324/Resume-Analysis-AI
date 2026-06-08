const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  originalName: { type: String, required: true },
  fileUrl: { type: String, required: true },
  cloudinaryPublicId: { type: String, required: true },
  fileType: { type: String, enum: ['pdf', 'docx'], required: true },
  fileSize: { type: Number, required: true }, // bytes
  extractedText: { type: String, default: '' },
  isActive: { type: Boolean, default: true }, // soft delete
  label: { type: String, default: 'Resume' }, // user-defined label
}, { timestamps: true });

resumeSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Resume', resumeSchema);
