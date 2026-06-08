const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const axios = require('axios');
const Resume = require('../models/Resume');
const cloudinary = require('../config/cloudinary');

// Helper: extract text from uploaded file
// const extractText = async (fileUrl, fileType) => {
//   try {
//     const response = await axios.get(fileUrl, { responseType: 'arraybuffer', timeout: 15000 });
//     const buffer = Buffer.from(response.data);

//     if (fileType === 'pdf') {
//       const parsed = await pdfParse(buffer);
//       return parsed.text || '';
//     } else if (fileType === 'docx') {
//       const result = await mammoth.extractRawText({ buffer });
//       return result.value || '';
//     }
//     return '';
//   } catch (err) {
//     console.error('Text extraction error:', err.message);
//     return '';
//   }
// };

// // POST /api/resumes/upload
// exports.uploadResume = async (req, res, next) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ error: 'No file uploaded.' });
//     }

//     const ext = req.file.originalname.split('.').pop().toLowerCase();
//     const fileType = ext === 'pdf' ? 'pdf' : 'docx';

//     const extractedText = await extractText(req.file.path, fileType);

//     const resume = await Resume.create({
//       user: req.user._id,
//       originalName: req.file.originalname,
//       fileUrl: req.file.path,
//       cloudinaryPublicId: req.file.filename,
//       fileType,
//       fileSize: req.file.size || 0,
//       extractedText,
//       label: req.body.label || req.file.originalname,
//     });

//     res.status(201).json({
//       message: 'Resume uploaded successfully.',
//       resume: {
//         id: resume._id,
//         originalName: resume.originalName,
//         fileType: resume.fileType,
//         fileSize: resume.fileSize,
//         label: resume.label,
//         fileUrl: resume.fileUrl,
//         createdAt: resume.createdAt,
//       },
//     });
//   } catch (err) {
//     next(err);
//   }
// };


// const axios = require('axios');
// const mammoth = require('mammoth');

const pdfjsLib = require('pdfjs-dist');

// Extract text from PDF
const extractPDF = async (buffer) => {
  try {
    const uint8Array = new Uint8Array(buffer);

    const loadingTask = pdfjsLib.getDocument({
      data: uint8Array,
    });

    const pdf = await loadingTask.promise;

    let text = '';

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();

      text +=
        content.items
          .map((item) => item.str)
          .join(' ') + '\n';
    }

    return text.trim();
  } catch (error) {
    console.error('PDF extraction error:', error.message);
    return '';
  }
};

// Extract text from DOCX
const extractDOCX = async (buffer) => {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value?.trim() || '';
  } catch (error) {
    console.error('DOCX extraction error:', error.message);
    return '';
  }
};

exports.uploadResume = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded.',
      });
    }

    const ext = req.file.originalname
      .split('.')
      .pop()
      .toLowerCase();

    if (!['pdf', 'docx'].includes(ext)) {
      return res.status(400).json({
        error: 'Only PDF and DOCX files are supported.',
      });
    }

    const fileType = ext;
    const fileUrl = req.file.path;

    // Download file from Cloudinary
    const response = await axios.get(fileUrl, {
      responseType: 'arraybuffer',
      timeout: 20000,
    });

    const buffer = Buffer.from(response.data);

    let extractedText = '';

    if (fileType === 'pdf') {
      extractedText = await extractPDF(buffer);
    } else {
      extractedText = await extractDOCX(buffer);
    }

    console.log(
      `Extracted ${extractedText.length} characters from ${req.file.originalname}`
    );

    const resume = await Resume.create({
      user: req.user._id,
      originalName: req.file.originalname,
      fileUrl,
      cloudinaryPublicId: req.file.filename,
      fileType,
      fileSize: req.file.size || 0,
      extractedText,
      label: req.body.label || req.file.originalname,
    });

    return res.status(201).json({
      message: 'Resume uploaded successfully.',
      resume: {
        id: resume._id,
        originalName: resume.originalName,
        fileType: resume.fileType,
        fileSize: resume.fileSize,
        label: resume.label,
        fileUrl: resume.fileUrl,
        extractedCharacters: extractedText.length,
        createdAt: resume.createdAt,
      },
    });
  } catch (err) {
    console.error('Upload resume error:', err);
    next(err);
  }
};



// GET /api/resumes
exports.getMyResumes = async (req, res, next) => {
  try {
    const resumes = await Resume.find({ user: req.user._id, isActive: true })
      .select('-extractedText')
      .sort({ createdAt: -1 });
    res.json({ resumes });
  } catch (err) {
    next(err);
  }
};

// GET /api/resumes/:id
exports.getResume = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id, isActive: true });
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found.' });
    }
    res.json({ resume });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/resumes/:id
exports.deleteResume = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found.' });
    }

    // Delete from Cloudinary
    try {
      await cloudinary.uploader.destroy(resume.cloudinaryPublicId, { resource_type: 'raw' });
    } catch (cloudErr) {
      console.warn('Cloudinary deletion warning:', cloudErr.message);
    }

    resume.isActive = false;
    await resume.save();

    res.json({ message: 'Resume deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/resumes/:id/label
exports.updateLabel = async (req, res, next) => {
  try {
    const resume = await Resume.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id, isActive: true },
      { label: req.body.label },
      { new: true, select: '-extractedText' }
    );
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found.' });
    }
    res.json({ message: 'Label updated.', resume });
  } catch (err) {
    next(err);
  }
};
