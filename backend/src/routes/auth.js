const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validation');
const { authMiddleware } = require('../middleware/auth');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const {
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
} = require('../controllers/authController');

// TEMPORARY - Reset password for existing users
router.post('/reset-password-test', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    
    console.log('🔧 RESET PASSWORD ENDPOINT HIT');
    console.log('Email:', email);
    
    if (!email || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email and newPassword are required' 
      });
    }
    
    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update user
    const user = await User.findOneAndUpdate(
      { email },
      { password: hashedPassword },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }
    
    console.log('✅ Password reset successful for:', email);
    
    res.json({ 
      success: true, 
      message: 'Password reset successfully' 
    });
  } catch (error) {
    console.error('❌ Password reset error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// TEMPORARY ENDPOINT - REMOVE AFTER USE
router.post('/fix-all-users', async (req, res) => {
  try {
    const result = await User.updateMany(
      { isEmailVerified: false },
      { $set: { isEmailVerified: true } }
    );
    
    res.json({
      success: true,
      message: `Fixed ${result.modifiedCount} users`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Validation rules
const registerValidation = [
  body('name').trim().notEmpty().isLength({ max: 50 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
];

const changePasswordValidation = [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 })
];

const forgotPasswordValidation = [
  body('email').isEmail().normalizeEmail()
];

const resetPasswordValidation = [
  body('password').isLength({ min: 6 })
];
 
// Routes
router.post('/register', validate(registerValidation), register);
router.post('/login', validate(loginValidation), login);
router.post('/refresh', refreshToken);
router.post('/logout', authMiddleware, logout);
router.get('/me', authMiddleware, getMe);
router.post('/change-password', authMiddleware, validate(changePasswordValidation), changePassword);
router.post('/forgot-password', validate(forgotPasswordValidation), forgotPassword);
router.put('/reset-password/:resetToken', validate(resetPasswordValidation), resetPassword);

// Email verification routes
router.post('/send-verification', authMiddleware, sendVerificationEmail);
router.get('/verify-email/:token', authMiddleware, verifyEmail);

// 2FA routes
router.get('/2fa/status', authMiddleware, get2FAStatus);
router.post('/2fa/setup', authMiddleware, setup2FA);
router.post('/2fa/verify', authMiddleware, verifyAndEnable2FA);
router.post('/2fa/verify-login', authMiddleware, verify2FALogin); // Make sure this line is correct
router.post('/2fa/disable', authMiddleware, disable2FA);

module.exports = router;