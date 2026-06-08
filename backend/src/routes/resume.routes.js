const express = require('express');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  uploadResume,
  getMyResumes,
  getResume,
  deleteResume,
  updateLabel,
} = require('../controllers/resume.controller');

const router = express.Router();

router.use(authenticate);

router.post('/upload', upload.single('resume'), uploadResume);
router.get('/', getMyResumes);
router.get('/:id', getResume);
router.delete('/:id', deleteResume);
router.patch('/:id/label', updateLabel);

module.exports = router;
