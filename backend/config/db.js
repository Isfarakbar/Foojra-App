const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Mock data directory path
const mockDataPath = path.join(__dirname, '../data');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Create mock data directory if it doesn't exist (fallback)
    if (!fs.existsSync(mockDataPath)) {
      fs.mkdirSync(mockDataPath, { recursive: true });
      console.log('Mock data directory created as fallback');
    }
    
  } catch (error) {
    console.error(`Error: ${error.message}`);
    console.log('Failed to connect to MongoDB. Please ensure MongoDB is running.');
    process.exit(1);
  }
};

module.exports = connectDB;