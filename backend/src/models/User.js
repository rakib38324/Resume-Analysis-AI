const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false,
  },
  avatar: { type: String, default: null },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  subscription: {
    plan: { type: String, enum: ['free', 'premium'], default: 'free' },
    stripeCustomerId: { type: String, default: null },
    stripeSubscriptionId: { type: String, default: null },
    currentPeriodEnd: { type: Date, default: null },
    status: { type: String, enum: ['active', 'inactive', 'cancelled', 'past_due'], default: 'active' },
  },
  usageThisMonth: {
    analyses: { type: Number, default: 0 },
    jobMatches: { type: Number, default: 0 },
    resetDate: { type: Date, default: () => new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1) },
  },
  isVerified: { type: Boolean, default: false },
  lastLogin: { type: Date, default: null },
}, { timestamps: true });

// Hash password before save
// userSchema.pre('save', async function (next) {
//   if (!this.isModified('password')) return next();
//   const salt = await bcrypt.genSalt(12);
//   this.password = await bcrypt.hash(this.password, salt);
//   next();
// });
userSchema.pre('save', async function () {
  console.log("PRE SAVE HOOK RUNNING");

  if (!this.isModified('password')) {
    console.log("PASSWORD NOT MODIFIED");
    return;
  }

  console.log("BEFORE HASH:", this.password);

  this.password = await bcrypt.hash(this.password, 10);

  console.log("AFTER HASH:", this.password);
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Check if user can perform analysis
userSchema.methods.canAnalyze = function () {
  const FREE_LIMIT = 3;
  if (this.subscription.plan === 'premium') return true;
  return this.usageThisMonth.analyses < FREE_LIMIT;
};

// Reset monthly usage if needed
userSchema.methods.resetUsageIfNeeded = function () {
  const now = new Date();
  if (now >= this.usageThisMonth.resetDate) {
    this.usageThisMonth.analyses = 0;
    this.usageThisMonth.jobMatches = 0;
    this.usageThisMonth.resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  }
};

// Remove sensitive fields from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
