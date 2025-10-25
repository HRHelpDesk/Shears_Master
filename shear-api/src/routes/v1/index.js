const express = require('express');
const router = express.Router();
const authRouter = require('./auth');
const dataRecordsRouter = require('./dataRecords');
const { connections, connectDB } = require('../../config/db');


router.use(express.json());
router.use(express.urlencoded({ extended: true }));

console.log('🧭 v1 router loaded');

// Middleware: attach existing DB connection
router.use(async (req, res, next) => {
  const appName = 'shears';
  console.log('🌐 Incoming request:', req.method, req.originalUrl, 'App name:', appName);

  try {
    if (!connections[appName]) {
      console.log(`🔄 No cached connection for ${appName}, connecting...`);
      await connectDB(appName);
    }
    req.db = connections[appName];
    next();
  } catch (err) {
    console.error('DB connection error:', err.message);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

router.get('/health', (req, res) => {
  res.json({ status: 'API v1 healthy', dbConnected: !!req.db });
});

router.use('/auth', authRouter);
router.use('/data-records', dataRecordsRouter);

module.exports = router;
