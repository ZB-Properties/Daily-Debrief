const nodemailer = require('nodemailer');
const dns = require('dns');


const emailService = {
  

  getTransporter: async () => {
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error('Email credentials not configured. Please set EMAIL_USER and EMAIL_PASS in environment variables.');
    }

    
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: false, // true for 465, false for 587
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false 
      },
        lookup: (hostname, options, callback) => {
        options.family = 4; // Force IPv4
        dns.lookup(hostname, options, callback);
      }
    });

    // Verify connection configuration
    try {
      await transporter.verify();
      console.log('✅ Gmail transporter ready - real emails will be sent to users');
      console.log(`📧 Sending from: ${process.env.EMAIL_USER}`);
      return transporter;
    } catch (error) {
      console.error('❌ Gmail transporter verification failed:', error);
      throw new Error('Email service configuration error. Check your Gmail app password.');
    }
  },

  /**
   * Send verification email to new users
   */
  sendVerificationEmail: async (user, verificationToken) => {
    try {
      const transporter = await emailService.getTransporter();
      
      const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
      
      const mailOptions = {
        from: `"Daily-Debrief" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: 'Verify Your Email - Daily-Debrief',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify Your Email</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f4;">
            <div style="max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <!-- Header with gradient - Your original styling preserved -->
              <div style="background: linear-gradient(to right, #EF4444, #1E40AF); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">Daily-Debrief</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">Email Verification</p>
              </div>
              
              <!-- Content -->
              <div style="padding: 40px 30px;">
                <h2 style="color: #333; margin-top: 0;">Welcome, ${user.name}!</h2>
                <p style="color: #666;">Thank you for registering with Daily-Debrief. Please verify your email address to start using all features.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${verificationUrl}" 
                     style="display: inline-block; padding: 14px 40px; background: linear-gradient(to right, #EF4444, #1E40AF); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">
                    Verify Email Address
                  </a>
                </div>
                
                <p style="color: #666;">This link will expire in <strong>24 hours</strong>.</p>
                <p style="color: #666;">If you didn't create an account, you can safely ignore this email.</p>
                
                <div style="border-top: 1px solid #eee; margin-top: 30px; padding-top: 20px;">
                  <p style="color: #999; font-size: 14px; text-align: center;">
                    Or copy this link:<br>
                    <span style="color: #666; word-break: break-all;">${verificationUrl}</span>
                  </p>
                </div>
              </div>
              
              <!-- Footer -->
              <div style="background: #f8f8f8; padding: 20px; text-align: center; border-top: 1px solid #eee;">
                <p style="color: #999; font-size: 12px; margin: 0;">
                  &copy; ${new Date().getFullYear()} Daily-Debrief. All rights reserved.
                </p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`✅ Verification email sent successfully to: ${user.email}`);
      console.log(`📧 Message ID: ${info.messageId}`);
      
      return {
        success: true,
        messageId: info.messageId
      };
    } catch (error) {
      console.error('❌ Failed to send verification email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Send password reset email
   */
  sendPasswordResetEmail: async (user, resetToken) => {
    try {
      const transporter = await emailService.getTransporter();
      
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
      
      const mailOptions = {
        from: `"Daily-Debrief" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: 'Password Reset - Daily-Debrief',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Reset</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f4;">
            <div style="max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <!-- Header with gradient -->
              <div style="background: linear-gradient(to right, #EF4444, #1E40AF); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">Daily-Debrief</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">Password Reset Request</p>
              </div>
              
              <!-- Content -->
              <div style="padding: 40px 30px;">
                <h2 style="color: #333; margin-top: 0;">Hello, ${user.name}!</h2>
                <p style="color: #666;">We received a request to reset your password. Click the button below to create a new password:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${resetUrl}" 
                     style="display: inline-block; padding: 14px 40px; background: linear-gradient(to right, #EF4444, #1E40AF); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">
                    Reset Password
                  </a>
                </div>
                
                <p style="color: #666;">This link will expire in <strong>1 hour</strong>.</p>
                <p style="color: #666;">If you didn't request this, please ignore this email.</p>
                
                <div style="border-top: 1px solid #eee; margin-top: 30px; padding-top: 20px;">
                  <p style="color: #999; font-size: 14px; text-align: center;">
                    Or copy this link:<br>
                    <span style="color: #666; word-break: break-all;">${resetUrl}</span>
                  </p>
                </div>
              </div>
              
              <!-- Footer -->
              <div style="background: #f8f8f8; padding: 20px; text-align: center; border-top: 1px solid #eee;">
                <p style="color: #999; font-size: 12px; margin: 0;">
                  &copy; ${new Date().getFullYear()} Daily-Debrief. All rights reserved.
                </p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`✅ Password reset email sent to: ${user.email}`);
      console.log(`📧 Message ID: ${info.messageId}`);
      
      return {
        success: true,
        messageId: info.messageId
      };
    } catch (error) {
      console.error('❌ Failed to send password reset email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Send 2FA backup codes email
   */
  send2FABackupCodes: async (user, backupCodes) => {
    try {
      const transporter = await emailService.getTransporter();
      
      const mailOptions = {
        from: `"Daily-Debrief" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: 'Your 2FA Backup Codes - Daily-Debrief',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>2FA Backup Codes</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f4;">
            <div style="max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <!-- Header with gradient -->
              <div style="background: linear-gradient(to right, #EF4444, #1E40AF); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">Daily-Debrief</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">2FA Backup Codes</p>
              </div>
              
              <!-- Content -->
              <div style="padding: 40px 30px;">
                <h2 style="color: #333; margin-top: 0;">Two-Factor Authentication Enabled</h2>
                <p style="color: #666;">Your account is now more secure! Here are your backup codes. Store them safely:</p>
                
                <div style="background: #f8f8f8; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                  ${backupCodes.map(code => `
                    <span style="display: inline-block; padding: 8px 12px; margin: 5px; background: #333; color: #0f0; font-family: monospace; font-size: 16px; border-radius: 4px; letter-spacing: 1px;">${code}</span>
                  `).join('')}
                </div>
                
                <div style="background: #fff3cd; border: 1px solid #ffeeba; color: #856404; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0; font-weight: bold;">⚠️ Important:</p>
                  <ul style="margin: 10px 0 0; padding-left: 20px;">
                    <li>Each code can only be used once</li>
                    <li>Keep these codes in a safe place</li>
                    <li>You'll need them if you lose access to your authenticator app</li>
                  </ul>
                </div>
                
                <p style="color: #666;">If you didn't enable 2FA, please secure your account immediately.</p>
              </div>
              
              <!-- Footer -->
              <div style="background: #f8f8f8; padding: 20px; text-align: center; border-top: 1px solid #eee;">
                <p style="color: #999; font-size: 12px; margin: 0;">
                  &copy; ${new Date().getFullYear()} Daily-Debrief. All rights reserved.
                </p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`✅ 2FA backup codes email sent to: ${user.email}`);
      console.log(`📧 Message ID: ${info.messageId}`);
      
      return {
        success: true,
        messageId: info.messageId
      };
    } catch (error) {
      console.error('❌ Failed to send 2FA backup codes email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

module.exports = emailService;