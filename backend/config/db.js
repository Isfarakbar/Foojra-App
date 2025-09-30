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

    console.log('Attempting to connect to MongoDB...');
    console.log('MONGO_URI (first 50 chars):', process.env.MONGO_URI.substring(0, 50) + '...');

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // 10 seconds
      socketTimeoutMS: 45000, // 45 seconds
      family: 4 // Use IPv4, skip trying IPv6
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
    
    // Don't exit immediately in production, let the app continue with fallback
    if (process.env.NODE_ENV === 'production') {
      console.log('Running in production mode - continuing without database connection');
      console.log('API will use fallback mock data');
      
      // Create mock data directory for fallback
      if (!fs.existsSync(mockDataPath)) {
        fs.mkdirSync(mockDataPath, { recursive: true });
        console.log('Mock data directory created for fallback');
      }
    } else {
      process.exit(1);
    }
  }
};

module.exports = connectDB;