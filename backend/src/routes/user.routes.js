const express = require('express');
const { authenticate } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// GET /api/users/profile
router.get('/profile', authenticate, async (req, res) => {
  res.json({ user: req.user });
});

// PATCH /api/users/profile
router.patch('/profile', authenticate, async (req, res, next) => {
  try {
    const allowed = ['name'];
    const updates = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ message: 'Profile updated.', user });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/users/change-password
router.patch('/change-password', authenticate, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect.' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
