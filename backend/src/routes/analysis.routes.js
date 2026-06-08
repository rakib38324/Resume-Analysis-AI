const express = require('express');
const { authenticate } = require('../middleware/auth');
const { analyzeResume, getMyAnalyses, getAnalysis, getStats } = require('../controllers/analysis.controller');

const router = express.Router();

router.use(authenticate);

router.post('/analyze', analyzeResume);
router.get('/', getMyAnalyses);
router.get('/stats', getStats);
router.get('/:id', getAnalysis);

module.exports = router;
