const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const userSchema = new mongoose.Schema({
  userId: { type: String,  index: true },
  subscriberId: { type: String, index: true }, // will auto-generate if not provided

  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['owner', 'barber', 'client'], required: true, index: true },
  fullName: { type: String, required: true },
  phone: { type: String },
  profilePhoto: { type: String },
  stripeCustomerId: { type: String },
  stripeAccountId: { type: String },
  preferences: {
    emailNotifications: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: true },
  },
}, { timestamps: true });

// Automatically hash password and generate IDs
userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }

  // Auto-generate userId if not set
  if (!this.userId) {
    this.userId = uuidv4();
  }

  // Auto-generate subscriberId if not set
  // For now, this makes every new user their own subscriber group.
  if (!this.subscriberId) {
    this.subscriberId = uuidv4();
  }

  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

const getUserModel = (db) => db.model('User', userSchema);

module.exports = getUserModel;
