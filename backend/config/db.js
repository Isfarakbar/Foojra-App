const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Mock data directory path
const mockDataPath = path.join(__dirname, '../data');

const connectDB = async () => {
  try {
    // Check if MONGO_URI is provided
    if (!process.env.MONGO_URI) {
      console.error('MONGO_URI environment variable is not set');
      process.exit(1);
    }

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Create mock data directory if it doesn't exist (fallback)
    if (!fs.existsSync(mockDataPath)) {
      fs.mkdirSync(mockDataPath, { recursive: true });
      console.log('Mock data directory created as fallback');
    }
    
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    console.log('Failed to connect to MongoDB. Please check your MONGO_URI and network connection.');
    process.exit(1);
  }
};

module.exports = connectDB;