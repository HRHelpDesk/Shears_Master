const express = require('express');
const { connectDB } = require('./src/config/db');
require('dotenv').config();
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// ✅ Connect to MongoDB once before starting the server
(async () => {
  try {
    await connectDB('shears'); // or 'default' if you prefer
    console.log('✅ Initial MongoDB connection established');

    // Mount routers only after connection succeeds
    const v1Router = require('./src/routes/v1');
    app.use('/v1', v1Router);

    // Global error handler
    app.use((err, req, res, next) => {
      console.error('🔥 Global error handler:', err.stack);
      res.status(500).json({ error: 'Something went wrong!' });
    });

    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB on startup:', error);
    process.exit(1);
  }
})();
