const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { generateTokens, verifyToken } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const { ERROR_MESSAGES, SUCCESS_MESSAGES } = require('../config/constants');
const { logger } = require('../utils/logger');
const resendService = require('../services/resendService'); // CHANGED: from emailService to resendService
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
 

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  console.log('\n📝 REGISTRATION ATTEMPT');
  console.log('Email:', email);

  // Check if user exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({
      success: false,
      error: ERROR_MESSAGES.USER.EXISTS
    });
  }

  // Define emailResult outside try block
  let emailResult = { success: false, error: 'Email not sent' };

  try {
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      isEmailVerified: false
    });

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');
    user.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();

    // Try to send email but DON'T block registration
    try {
      // Initialize Resend
      resendService.initialize();
      
      emailResult = await resendService.sendVerificationEmail(user, verificationToken);
      
      if (!emailResult.success) {
        console.log('⚠️ Email sending failed but user was created:', emailResult.error);
      } else {
        console.log('✅ Verification email process completed');
      }
    } catch (emailError) {
      console.log('⚠️ Email error (non-blocking):', emailError.message);
      emailResult = { 
        success: true, // Force success so registration continues
        verificationUrl: `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`,
        message: 'Registration successful! Click the link below to verify your account.',
        error: emailError.message 
      };
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    // Set cookies
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    // Remove sensitive data
    user.password = undefined;
    user.refreshToken = undefined;
    user.emailVerificationToken = undefined;

    logger.info(`New user registered: ${user.email}`);

    // Send response with verification URL
    res.status(201).json({
      success: true,
      message: emailResult?.message || 'Registration successful',
      verificationUrl: emailResult?.verificationUrl, // Include the link!
      data: {
        user,
        tokens: {
          accessToken,
          refreshToken
        }
      }
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Registration failed'
    });
  }
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  console.log('\n🔐 LOGIN ATTEMPT');
  console.log('Email:', email);
  console.log('Password length:', password.length);

  // Check for user - IMPORTANT: select('+password') to include password field
  const user = await User.findOne({ email })
    .select('+password +refreshToken +isEmailVerified +twoFactorEnabled +twoFactorSecret +twoFactorBackupCodes');
  
  console.log('User found in database:', !!user);
  
  if (!user) {
    console.log('❌ User not found');
    return res.status(401).json({
      success: false,
      error: ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS
    });
  }

  console.log('User ID:', user._id);
  console.log('Email verified:', user.isEmailVerified);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (user.isEmailVerified === false) {
    // Check if user was created before today (existing user)
    if (user.createdAt < today) {
      console.log('🔄 Auto-fixing existing user - setting isEmailVerified to true');
      user.isEmailVerified = true;
      await user.save();
      console.log('✅ User auto-fixed');
    } else {
      // New user created today - they need to verify
      console.log('❌ New user - email not verified');
      return res.status(401).json({
        success: false,
        error: 'Please verify your email before logging in',
        requiresVerification: true,
        email: user.email
      });
    }
  }

  console.log('Stored password hash exists:', !!user.password);

  // Check password
  const isPasswordValid = await user.comparePassword(password);
  
  if (!isPasswordValid) {
    console.log('❌ Password invalid');
    return res.status(401).json({
      success: false,
      error: ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS
    });
  }

  console.log('✅ Password valid, checking 2FA');

  // Check if 2FA is enabled
  if (user.twoFactorEnabled) {
    return res.json({
      success: true,
      requires2FA: true,
      userId: user._id
    });
  }

  console.log('✅ Logging in user');

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user._id);

  // Save refresh token
  user.refreshToken = refreshToken;
  user.lastSeen = new Date();
  user.status = 'online';
  await user.save();

  // Set cookies
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  });

  // Remove sensitive data
  user.password = undefined;
  user.refreshToken = undefined;
  user.twoFactorSecret = undefined;
  user.twoFactorBackupCodes = undefined;

  logger.info("User logged in", { userId: user._id });

  res.json({
    success: true,
    message: SUCCESS_MESSAGES.AUTH.LOGIN,
    data: {
      user,
      tokens: {
        accessToken,
        refreshToken
      }
    }
  });
});

/**
 * @desc    Refresh access token
 * @route   POST /api/auth/refresh
 * @access  Public
 */
const refreshToken = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      error: 'Refresh token required'
    });
  }

  const decoded = verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET);
  
  if (!decoded) {
    return res.status(401).json({
      success: false,
      error: ERROR_MESSAGES.AUTH.TOKEN_INVALID
    });
  }

  const user = await User.findById(decoded.userId).select('+refreshToken');
  
  if (!user || user.refreshToken !== refreshToken) {
    return res.status(401).json({
      success: false,
      error: ERROR_MESSAGES.AUTH.TOKEN_INVALID
    });
  }

  // Generate new tokens
  const { accessToken: newAccessToken, refreshToken: newRefreshToken } = generateTokens(user._id);

  // Update refresh token in database
  user.refreshToken = newRefreshToken;
  await user.save();

  // Set cookies
  res.cookie('accessToken', newAccessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  res.cookie('refreshToken', newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  });

  res.json({
    success: true,
    message: 'Token refreshed successfully',
    data: {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    }
  });
});

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (refreshToken) {
    const decoded = verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    if (decoded) {
      // Clear refresh token from database
      await User.findByIdAndUpdate(decoded.userId, {
        refreshToken: null,
        status: 'offline',
        lastSeen: new Date()
      });
    }
  }

  // Clear cookies
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');

  logger.info(`User logged out: ${req.user?.email}`);

  res.json({
    success: true,
    message: SUCCESS_MESSAGES.AUTH.LOGOUT
  });
});

/**
 * @desc    Get current user
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  console.log('=== getMe DEBUG START ===');
  console.log('req.user:', req.user);
  
  if (!req.user) {
    console.error('ERROR: No user in request');
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }
  
  const user = await User.findById(req.user._id).select('-password -refreshToken');
  
  if (!user) {
    console.error('ERROR: User not found for ID:', req.user._id);
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }
  
  console.log('User found:', user.email);
  console.log('=== getMe DEBUG SUCCESS ===');
  
  res.json({
    success: true,
    data: { user }
  });
});

/**
 * @desc    Change password
 * @route   POST /api/auth/change-password
 * @access  Private
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');

  // Check current password
  const isMatch = await user.comparePassword(currentPassword);
  
  if (!isMatch) {
    return res.status(400).json({
      success: false,
      error: 'Current password is incorrect'
    });
  }

  // Hash the new password before saving
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);
  
  // Update password with hashed version
  user.password = hashedPassword;
  await user.save();

  // Generate new tokens
  const { accessToken, refreshToken } = generateTokens(user._id);
  
  user.refreshToken = refreshToken;
  await user.save();

  // Set cookies
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  });

  logger.info(`Password changed for user: ${user.email}`);

  res.json({
    success: true,
    message: 'Password changed successfully',
    data: {
      tokens: { accessToken, refreshToken }
    }
  });
});

/**
 * @desc    Forgot password
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  
  if (!user) {
    return res.json({
      success: true,
      message: 'If an account exists with this email, you will receive a reset link'
    });
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  // Save reset token and expiry (1 hour)
  user.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
   
  user.resetPasswordExpire = Date.now() + 3600000; // 1 hour
  await user.save();

  // Send password reset email - CHANGED to resendService
  try {
    resendService.initialize();
    await resendService.sendPasswordResetEmail(user, resetToken);
    logger.info(`Password reset requested for: ${user.email}`);
  } catch (emailError) {
    console.log('⚠️ Password reset email error:', emailError.message);
    // Don't block, but log the error
  }

  res.json({
    success: true,
    message: 'Password reset email sent'
  });
});

/**
 * @desc    Reset password
 * @route   PUT /api/auth/reset-password/:resetToken
 * @access  Public
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { resetToken } = req.params;
  const { password } = req.body;

  // Hash token to compare with database
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      error: 'Invalid or expired reset token'
    });
  }

  // Hash new password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Set new password
  user.password = hashedPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  logger.info(`Password reset for: ${user.email}`);

  res.json({
    success: true,
    message: 'Password reset successful'
  });
});

/**
 * @desc    Send verification email
 * @route   POST /api/auth/send-verification
 * @access  Public
 */
const sendVerificationEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  if (user.isEmailVerified === true) {
    return res.status(400).json({
      success: false,
      error: 'Email already verified'
    });
  }

  // Generate new verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  user.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
  user.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  await user.save();

  // Send verification email - CHANGED to resendService
  try {
    resendService.initialize();
    await resendService.sendVerificationEmail(user, verificationToken);
  } catch (emailError) {
    console.log('⚠️ Verification email error:', emailError.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to send verification email'
    });
  }

  res.json({
    success: true,
    message: 'Verification email sent'
  });
});

/**
 * @desc    Verify email
 * @route   GET /api/auth/verify-email/:token
 * @access  Public
 */
const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;

  const verificationToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  const user = await User.findOne({
    emailVerificationToken: verificationToken,
    emailVerificationExpire: { $gt: Date.now() }
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      error: 'Invalid or expired verification token'
    });
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpire = undefined;
  await user.save();

  res.json({
    success: true,
    message: 'Email verified successfully. You can now login.'
  });
});

/**
 * @desc    Get 2FA status
 * @route   GET /api/auth/2fa/status
 * @access  Private
 */
const get2FAStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('twoFactorEnabled');
  
  res.json({
    success: true,
    data: {
      enabled: user.twoFactorEnabled || false
    }
  });
});

/**
 * @desc    Setup 2FA
 * @route   POST /api/auth/2fa/setup
 * @access  Private
 */
const setup2FA = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user.twoFactorEnabled) {
    return res.status(400).json({
      success: false,
      error: '2FA is already enabled'
    });
  }

  // Generate secret
  const secret = speakeasy.generateSecret({
    name: `Daily-Debrief:${user.email}`
  });

  // Generate QR code
  const qrCode = await QRCode.toDataURL(secret.otpauth_url);

  // Save secret temporarily
  user.twoFactorSecret = secret.base32;
  await user.save();

  res.json({
    success: true,
    data: {
      secret: secret.base32,
      qrCode
    }
  });
});

/**
 * @desc    Verify and enable 2FA
 * @route   POST /api/auth/2fa/verify
 * @access  Private
 */
const verifyAndEnable2FA = asyncHandler(async (req, res) => {
  const { code } = req.body;
  const user = await User.findById(req.user._id);

  if (!user.twoFactorSecret) {
    return res.status(400).json({
      success: false,
      error: '2FA not setup yet'
    });
  }

  // Verify code
  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token: code,
    window: 1
  });

  if (!verified) {
    return res.status(400).json({
      success: false,
      error: 'Invalid verification code'
    });
  }

  // Generate backup codes
  const backupCodes = [];
  for (let i = 0; i < 8; i++) {
    backupCodes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
  }

  // Enable 2FA
  user.twoFactorEnabled = true;
  user.twoFactorBackupCodes = backupCodes.map(code => ({
    code,
    used: false
  }));
  await user.save();

  // Send backup codes via email - CHANGED to resendService
  try {
    resendService.initialize();
    await resendService.send2FABackupCodes(user, backupCodes);
  } catch (emailError) {
    console.log('⚠️ 2FA backup codes email error:', emailError.message);
    // Don't block, but log the error
  }

  res.json({
    success: true,
    message: '2FA enabled successfully',
    data: {
      backupCodes
    }
  });
});

/**
 * @desc    Verify 2FA during login
 * @route   POST /api/auth/2fa/verify-login
 * @access  Public
 */
const verify2FALogin = asyncHandler(async (req, res) => {
  const { userId, code } = req.body;

  const user = await User.findById(userId)
    .select('+twoFactorSecret +twoFactorBackupCodes +twoFactorEnabled +refreshToken +status +lastSeen');

  if (!user || !user.twoFactorEnabled) {
    return res.status(401).json({
      success: false,
      error: 'Invalid request'
    });
  }

  // Check if it's a backup code
  if (user.twoFactorBackupCodes && user.twoFactorBackupCodes.length > 0) {
    const backupCodeIndex = user.twoFactorBackupCodes.findIndex(
      bc => bc.code === code && !bc.used
    );
    
    if (backupCodeIndex !== -1) {
      user.twoFactorBackupCodes[backupCodeIndex].used = true;
      await user.save();

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(user._id);

      // Save refresh token
      user.refreshToken = refreshToken;
      user.lastSeen = new Date();
      user.status = 'online';
      await user.save();

      // Set cookies
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });

      // Remove sensitive data
      user.twoFactorSecret = undefined;
      user.twoFactorBackupCodes = undefined;
      user.password = undefined;

      return res.json({
        success: true,
        message: 'Login successful',
        data: {
          user,
          tokens: {
            accessToken,
            refreshToken
          }
        }
      });
    }
  }

  // Verify TOTP
  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token: code,
    window: 1
  });

  if (!verified) {
    return res.status(401).json({
      success: false,
      error: 'Invalid verification code'
    });
  }

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user._id);

  // Save refresh token
  user.refreshToken = refreshToken;
  user.lastSeen = new Date();
  user.status = 'online';
  await user.save();

  // Set cookies
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  });

  // Remove sensitive data
  user.twoFactorSecret = undefined;
  user.twoFactorBackupCodes = undefined;
  user.password = undefined;

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user,
      tokens: {
        accessToken,
        refreshToken
      }
    }
  });
});

/**
 * @desc    Disable 2FA
 * @route   POST /api/auth/2fa/disable
 * @access  Private
 */
const disable2FA = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  user.twoFactorEnabled = false;
  user.twoFactorSecret = undefined;
  user.twoFactorBackupCodes = undefined;
  await user.save();

  res.json({
    success: true,
    message: '2FA disabled successfully'
  });
});

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  changePassword,
  forgotPassword,
  resetPassword,
  sendVerificationEmail,
  verifyEmail,
  get2FAStatus,
  setup2FA,
  verifyAndEnable2FA,
  verify2FALogin,
  disable2FA
};