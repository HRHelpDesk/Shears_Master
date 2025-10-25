const express = require('express');
const { connectDB } = require('./src/config/db'); // ✅ must be here
require('dotenv').config();
const cors = require('cors');

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;
const ALLOWED_APPS = process.env.ALLOWED_APPS
  ? process.env.ALLOWED_APPS.split(',')
  : ['shears'];

app.use(express.json());

// ✅ Global database connection middleware
// app.use(async (req, res, next) => {
//   // Prefer header, fallback to default
//   const appName = req.headers['x-app-name'] || 'shears';
//   console.log('🌐 Incoming request:', req.method, req.originalUrl, 'App name:', appName);

//   // Optionally enforce allowed list
//   // if (!ALLOWED_APPS.includes(appName.toLowerCase())) {
//   //   return res.status(403).json({ error: 'Invalid app name' });
//   // }

//   try {
//     req.db = await connectDB(appName);
//     console.log(`✅ Connected to MongoDB for ${appName}`);
//     next();
//   } catch (error) {
//     console.error(`DB connection error for ${appName}:`, error.message);
//     res.status(500).json({ error: 'Failed to connect to database' });
//   }
// });

// ✅ Mount routers
const v1Router = require('./src/routes/v1');
app.use('/v1', v1Router);

// ✅ Global error handler
app.use((err, req, res, next) => {
  console.error('🔥 Global error handler:', err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
