const mongoose = require('mongoose');

const connections = {}; // Cache connections by database name

const connectDB = async (appName) => {
  if (!appName) throw new Error('App name is required for database connection');

  const dbName = appName.toLowerCase().replace(/[^a-z0-9_-]/g, '');
  if (!dbName) throw new Error('Invalid app name');

  if (connections[dbName]) {
    console.log(`Using cached MongoDB connection for ${dbName}`);
    return connections[dbName];
  }

  try {
    // Correctly insert dbName before query params
    const baseUri = process.env.MONGO_URI.split('?')[0];
    const queryParams = process.env.MONGO_URI.includes('?')
      ? '?' + process.env.MONGO_URI.split('?')[1]
      : '';

    const connectionUri = `${baseUri}${dbName}${queryParams}`;

    const conn = await mongoose.createConnection(connectionUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.host} for database ${dbName}`);
    connections[dbName] = conn;
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB for ${dbName}: ${error.message}`);
    throw error;
  }
};


module.exports = { connectDB, connections };