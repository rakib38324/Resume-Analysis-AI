const express = require('express');
const { authenticate } = require('../middleware/auth');
const { matchJob, getMyMatches, getMatch } = require('../controllers/jobmatch.controller');

const router = express.Router();

router.use(authenticate);

router.post('/', matchJob);
router.get('/', getMyMatches);
router.get('/:id', getMatch);

module.exports = router;
