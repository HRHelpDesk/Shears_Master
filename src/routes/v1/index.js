// src/routes/v1/index.js
const express = require('express');
const router = express.Router();
const authRouter = require('./auth');
const dataRecordsRouter = require('./dataRecords');
const { connectDB } = require('../../config/db');


console.log('🧭 v1 router loaded');

// ✅ Middleware: attach database connection based on x-app-name header
router.use(async (req, res, next) => {
  const appName = 'shears';
  console.log('🌐 Incoming request:', req.method, req.originalUrl, 'App name:', appName);

  try {
    req.db = await connectDB(appName);
    next();
  } catch (err) {
    console.error('DB connection error:', err.message);
    res.status(403).json({ error: 'Invalid app name' });
  }
});


// Test route
router.get('/', (req, res) => {
  console.log('GET /v1/ hit');
  res.json({ message: 'Welcome to API v1!' });
});

router.get('/health', (req, res) => {
  console.log('GET /v1/health hit');
  res.json({ status: 'API v1 is healthy' });
});

// Mount /auth routes
router.use('/auth', authRouter);

router.use('/data-records', dataRecordsRouter);

module.exports = router;
