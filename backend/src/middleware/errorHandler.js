// /middleware/errorhandler.js
const { logger } = require('../utils/logger'); // Destructure the logger
const { ERROR_MESSAGES } = require('../config/constants');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error - Use the destructured logger
  logger.error(`${err.name}: ${err.message}`);
  logger.error(`Stack: ${err.stack}`);
  logger.error(`Path: ${req.path}`);
  logger.error(`Method: ${req.method}`);
  
  if (req.body && Object.keys(req.body).length > 0) {
    logger.error(`Body: ${JSON.stringify(req.body)}`);
  }
  
  if (req.query && Object.keys(req.query).length > 0) {
    logger.error(`Query: ${JSON.stringify(req.query)}`);
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} already exists`;
    error = { message, statusCode: 400 };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, statusCode: 400 };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = { message: ERROR_MESSAGES.AUTH.TOKEN_INVALID, statusCode: 401 };
  }

  if (err.name === 'TokenExpiredError') {
    error = { message: ERROR_MESSAGES.AUTH.TOKEN_EXPIRED, statusCode: 401 };
  }

  // Multer errors
  if (err.name === 'MulterError') {
    let message = ERROR_MESSAGES.FILE.UPLOAD_FAILED;
    
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File size exceeds limit';
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      message = 'Too many files';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Invalid file type';
    }
    
    error = { message, statusCode: 400 };
  }

  // Default error
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

module.exports = { errorHandler, notFound };