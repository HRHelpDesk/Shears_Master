const express = require('express');
const router = express.Router();
const getUserModel = require('../../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Health check
router.get('/health', (req, res) => {
  console.log('GET /v1/users/health hit');
  res.json({ status: 'Users API is healthy' });
});

// Utility function to clean password
const cleanPassword = (password) => {
  if (!password) return '';
  return password.toString().trim().replace(/^"(.*)"$/, '$1');
};

// Register route
router.post('/register', async (req, res) => {
  console.log('POST /v1/users/register hit');
  try {
    let { email, password, role, fullName, phone } = req.body;
    const User = getUserModel(req.db);

    console.log('Password received:', `"${password}"`);
    password = cleanPassword(password);
    console.log('Cleaned password:', `"${password}"`);

    if (!email || !password || !role || !fullName) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      console.log('Duplicate email found:', email);
      return res.status(409).json({ message: 'Email already registered.' });
    }

    const newUser = new User({
      email,
      password,
      role,
      fullName,
      phone,
      preferences: { emailNotifications: true, pushNotifications: true },
    });

    console.log('Password to be hashed:', newUser.password);
    await newUser.save();
    console.log('Stored password hash:', newUser.password);

    const userResponse = newUser.toObject();
    delete userResponse.password;

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    console.log('User registered:', userResponse);
    res.status(201).json({ message: 'User registered successfully!', user: userResponse, token });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error during registration.' });
  }
});

// Login route
router.post('/login', async (req, res) => {
  console.log('POST /v1/users/login hit');
  try {
    let { email, password } = req.body;
    const User = getUserModel(req.db);

    console.log('Password received:', `"${password}"`);
    password = cleanPassword(password);
    console.log('Cleaned password:', `"${password}"`);

    if (!email || !password) {
      return res.status(400).json({ message: 'Missing email or password.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    console.log('User found:', user.email);
    console.log('Stored password hash:', user.password);

    const isMatch = await user.comparePassword(password);
    console.log('Password match result:', isMatch);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const userResponse = user.toObject();
    delete userResponse.password;

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({ message: 'Login successful!', user: userResponse, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

module.exports = router;