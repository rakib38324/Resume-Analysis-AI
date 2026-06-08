const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');

const router = express.Router();

// Must use raw body for Stripe signature verification
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  console.log('Webhook received');
  
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        if (session.mode === 'subscription') {
          await User.findOneAndUpdate(
            { 'subscription.stripeCustomerId': session.customer },
            {
              'subscription.plan': 'premium',
              'subscription.stripeSubscriptionId': session.subscription,
              'subscription.status': 'active',
            }
          );
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const user = await User.findOne({ 'subscription.stripeCustomerId': subscription.customer });
        if (user) {
          user.subscription.status = subscription.status;
          user.subscription.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
          if (subscription.status === 'active') {
            user.subscription.plan = 'premium';
          }
          await user.save({ validateBeforeSave: false });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        await User.findOneAndUpdate(
          { 'subscription.stripeCustomerId': subscription.customer },
          {
            'subscription.plan': 'free',
            'subscription.status': 'inactive',
            'subscription.stripeSubscriptionId': null,
            'subscription.currentPeriodEnd': null,
          }
        );
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        await User.findOneAndUpdate(
          { 'subscription.stripeCustomerId': invoice.customer },
          { 'subscription.status': 'past_due' }
        );
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err.message);
    res.status(500).json({ error: 'Webhook handler failed.' });
  }
});

module.exports = router;
