const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { ERROR_MESSAGES } = require('../config/constants');
const { logger } = require('../utils/logger');



const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '15m' }
  );
  
  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d' }
  );
  
  return { accessToken, refreshToken };
};


// Token verification function
// const verifyToken = (token, secret) => {
//  try {
//    return jwt.verify(token, secret);
//  } catch (error) {
//    logger.error('Token verification failed:', error.message);
//    return null;
//  }
// };

// Token verification function
const verifyToken = (token, secret) => {
  try {
    console.log('🔍 verifyToken called');
    console.log('   Token length:', token?.length);
    console.log('   Secret length:', secret?.length);
    console.log('   Secret prefix:', secret?.substring(0, 10) + '...');
    
    const decoded = jwt.verify(token, secret);
    console.log('✅ Token verified successfully');
    console.log('   Decoded userId:', decoded.userId);
    return decoded;
  } catch (error) {
    console.error('❌ Token verification failed:');
    console.error('   Error name:', error.name);
    console.error('   Error message:', error.message);
    if (error.name === 'JsonWebTokenError') {
      console.error('   This usually means the secret is wrong');
    } else if (error.name === 'TokenExpiredError') {
      console.error('   Token has expired');
    }
    return null;
  }
};

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from cookies or Authorization header
    let token = req.cookies.accessToken;
    
    if (!token && req.headers.authorization) {
      token = req.headers.authorization.replace('Bearer ', '');
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: ERROR_MESSAGES.AUTH.UNAUTHORIZED
      });
    }

    // Verify token
    const decoded = verifyToken(token, process.env.JWT_ACCESS_SECRET);
    
    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: ERROR_MESSAGES.AUTH.TOKEN_INVALID
      });
    }

    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: ERROR_MESSAGES.USER.NOT_FOUND
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Account is deactivated'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      error: ERROR_MESSAGES.AUTH.UNAUTHORIZED
    });
  }
};


// middleware/auth.js - Fix socketAuthMiddleware

const socketAuthMiddleware = async (socket, next) => {
  try {
    console.log('🔐 Socket auth attempt');
    
    // Get token from socket handshake
    const token = socket.handshake.auth.token;
    
    if (!token) {
      console.log('❌ No token provided');
      return next(new Error('Authentication required'));
    }

    // Verify token
    const decoded = verifyToken(token, process.env.JWT_ACCESS_SECRET);
    
    if (!decoded || !decoded.userId) {
      console.log('❌ Invalid token');
      return next(new Error('Invalid token'));
    }

    // Get user from database
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      console.log('❌ User not found');
      return next(new Error('User not found'));
    }

    if (!user.isActive) {
      console.log('❌ User is inactive');
      return next(new Error('Account is deactivated'));
    }

    // Attach user to socket
    socket.userId = user._id;
    socket.user = user;
    
    console.log('✅ Socket authenticated for user:', user.email);
    next();

  } catch (error) {
    console.error('❌ Socket auth error:', error);
    next(new Error('Authentication failed'));
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: ERROR_MESSAGES.AUTH.ACCESS_DENIED
    });
  }
  next();
};

module.exports = {
  authMiddleware,
  socketAuthMiddleware,
  adminMiddleware,
  generateTokens,
  verifyToken
};