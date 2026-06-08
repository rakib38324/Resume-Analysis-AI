const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');

const PREMIUM_PRICE_ID = process.env.STRIPE_PREMIUM_PRICE_ID;

// POST /api/subscriptions/create-checkout
exports.createCheckoutSession = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    let customerId = user.subscription.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: user._id.toString() },
      });
      customerId = customer.id;
      user.subscription.stripeCustomerId = customerId;
      await user.save({ validateBeforeSave: false });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: PREMIUM_PRICE_ID, quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL}/dashboard?upgraded=true`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing`,
      metadata: { userId: user._id.toString() },
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (err) {
    next(err);
  }
};

// POST /api/subscriptions/cancel
exports.cancelSubscription = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.subscription.stripeSubscriptionId) {
      return res.status(400).json({ error: 'No active subscription found.' });
    }

    await stripe.subscriptions.update(user.subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    user.subscription.status = 'cancelled';
    await user.save({ validateBeforeSave: false });

    res.json({ message: 'Subscription will be cancelled at the end of the current billing period.' });
  } catch (err) {
    next(err);
  }
};

// GET /api/subscriptions/status
exports.getStatus = async (req, res) => {
  const user = req.user;
  res.json({
    plan: user.subscription.plan,
    status: user.subscription.status,
    currentPeriodEnd: user.subscription.currentPeriodEnd,
    usageThisMonth: user.usageThisMonth,
    limits: {
      analyses: user.subscription.plan === 'premium' ? 'unlimited' : 3,
      jobMatches: user.subscription.plan === 'premium' ? 'unlimited' : 0,
    },
  });
};

// POST /api/subscriptions/portal
exports.createPortalSession = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.subscription.stripeCustomerId) {
      return res.status(400).json({ error: 'No Stripe customer found.' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.subscription.stripeCustomerId,
      return_url: `${process.env.FRONTEND_URL}/dashboard/settings`,
    });

    res.json({ url: session.url });
  } catch (err) {
    next(err);
  }
};
