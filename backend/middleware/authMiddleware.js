const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const { handleNotFoundError, handleValidationError } = require('../utils/errorHandler');

// Protect routes
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        handleValidationError(res, 'User not found');
        return;
      }

      next();
    } catch (error) {
      handleValidationError(res, 'Not authorized, token failed');
    }
  }

  if (!token) {
    handleValidationError(res, 'Not authorized, no token');
  }
});

// Check if user is shop owner
const shopOwner = (req, res, next) => {
  if (req.user && req.user.role === 'shopOwner') {
    next();
  } else {
    handleValidationError(res, 'Not authorized as shop owner');
  }
};

// Check if user is customer
const customer = (req, res, next) => {
  if (req.user && req.user.role === 'customer') {
    next();
  } else {
    handleValidationError(res, 'Not authorized as customer');
  }
};

// Check if user is admin
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    handleValidationError(res, 'Not authorized as admin');
  }
};

module.exports = { protect, shopOwner, customer, admin };