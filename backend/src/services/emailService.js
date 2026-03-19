const nodemailer = require('nodemailer');
const dns = require('dns').promises;

const emailService = {
  getTransporter: async () => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error('Email credentials not configured');
    }

    console.log('🔧 Attempting to create Gmail transporter...');
    
    // List of connection methods to try in order
    const connectionMethods = [
      // Method 1: IPv4 forced via lookup
      async () => {
        console.log('📡 Trying Method 1: IPv4 forced lookup...');
        return nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
          tls: { rejectUnauthorized: false },
          lookup: (hostname, options, callback) => {
            options.family = 4;
            require('dns').lookup(hostname, options, callback);
          }
        });
      },
      
      // Method 2: Port 465 with SSL
      async () => {
        console.log('📡 Trying Method 2: Port 465 with SSL...');
        return nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
          tls: { rejectUnauthorized: false }
        });
      },
      
      // Method 3: Direct IPv4 address
      async () => {
        console.log('📡 Trying Method 3: Direct IPv4 address...');
        return nodemailer.createTransport({
          host: '64.233.171.108', // Gmail IPv4
          port: 587,
          secure: false,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
          tls: { rejectUnauthorized: false }
        });
      },
      
      // Method 4: Alternative SMTP (if all else fails)
      async () => {
        console.log('📡 Trying Method 4: SMTP-relay...');
        return nodemailer.createTransport({
          host: 'smtp-relay.gmail.com',
          port: 587,
          secure: false,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
          tls: { rejectUnauthorized: false }
        });
      }
    ];

    // Try each method until one works
    for (let i = 0; i < connectionMethods.length; i++) {
      try {
        const transporter = await connectionMethods[i]();
        await transporter.verify();
        console.log(`✅ Method ${i + 1} successful!`);
        return transporter;
      } catch (error) {
        console.log(`❌ Method ${i + 1} failed:`, error.message);
        // Continue to next method
      }
    }

    throw new Error('All email connection methods failed. Please check your network and credentials.');
  },

  sendVerificationEmail: async (user, verificationToken) => {
    try {
      const transporter = await emailService.getTransporter();
      
      const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
      
      const mailOptions = {
        from: `"Daily-Debrief" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: 'Verify Your Email - Daily-Debrief',
        html: `<!-- Your existing HTML template -->`
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`✅ Verification email sent to: ${user.email}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      // Return success false but DON'T throw - allow registration to complete
      return { 
        success: false, 
        error: error.message,
        // Don't block registration
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