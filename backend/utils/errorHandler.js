// Centralized error handling utility for backend
const createError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const handleValidationError = (res, message, statusCode = 400) => {
  res.status(statusCode);
  throw new Error(message);
};

const handleNotFoundError = (res, message = 'Resource not found') => {
  res.status(404);
  throw new Error(message);
};

const handleUnauthorizedError = (res, message = 'Not authorized') => {
  res.status(401);
  throw new Error(message);
};

const handleServerError = (res, message = 'Internal server error') => {
  res.status(500);
  throw new Error(message);
};

const validateRequiredFields = (fields, res) => {
  const missingFields = [];
  
  Object.entries(fields).forEach(([key, value]) => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      missingFields.push(key);
    }
  });
  
  if (missingFields.length > 0) {
    handleValidationError(res, `Missing required fields: ${missingFields.join(', ')}`);
  }
};

const validateOwnership = (resourceOwnerId, userId, res, message = 'Not authorized to access this resource') => {
  if (resourceOwnerId.toString() !== userId.toString()) {
    handleUnauthorizedError(res, message);
  }
};

const validateResourceExists = (resource, res, message = 'Resource not found') => {
  if (!resource) {
    handleNotFoundError(res, message);
  }
};

module.exports = {
  createError,
  handleValidationError,
  handleNotFoundError,
  handleUnauthorizedError,
  handleServerError,
  validateRequiredFields,
  validateOwnership,
  validateResourceExists
};