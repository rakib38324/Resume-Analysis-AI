const User = require('../models/User');
const Resume = require('../models/Resume');
const Analysis = require('../models/Analysis');
const JobMatch = require('../models/JobMatch');

// GET /api/admin/stats
exports.getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      premiumUsers,
      totalResumes,
      totalAnalyses,
      totalJobMatches,
      recentUsers,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ 'subscription.plan': 'premium' }),
      Resume.countDocuments({ isActive: true }),
      Analysis.countDocuments({ status: 'completed' }),
      JobMatch.countDocuments({ status: 'completed' }),
      User.find().sort({ createdAt: -1 }).limit(10).select('name email subscription.plan createdAt lastLogin'),
    ]);

    res.json({
      stats: {
        totalUsers,
        premiumUsers,
        freeUsers: totalUsers - premiumUsers,
        totalResumes,
        totalAnalyses,
        totalJobMatches,
        conversionRate: totalUsers ? ((premiumUsers / totalUsers) * 100).toFixed(1) : 0,
      },
      recentUsers,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/users
exports.getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';

    const query = search
      ? { $or: [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }] }
      : {};

    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      User.countDocuments(query),
    ]);

    res.json({ users, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/users/:id
exports.updateUser = async (req, res, next) => {
  try {
    const { role, 'subscription.plan': plan } = req.body;
    const update = {};
    if (role) update.role = role;
    if (plan) update['subscription.plan'] = plan;

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    res.json({ message: 'User updated.', user });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/admin/users/:id
exports.deleteUser = async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted.' });
  } catch (err) {
    next(err);
  }
};
