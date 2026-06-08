const express = require('express');
const { authenticate } = require('../middleware/auth');
const {
  createCheckoutSession,
  cancelSubscription,
  getStatus,
  createPortalSession,
} = require('../controllers/subscription.controller');

const router = express.Router();

router.use(authenticate);

router.get('/status', getStatus);
router.post('/checkout', createCheckoutSession);
router.post('/cancel', cancelSubscription);
router.post('/portal', createPortalSession);

module.exports = router;
