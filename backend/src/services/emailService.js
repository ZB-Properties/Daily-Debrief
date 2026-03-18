
const nodemailer = require('nodemailer');


let cachedTestAccount = null;

const getTransporter = async () => {
  
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
        port: process.env.EMAIL_PORT || 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
      
      // Verify the connection works
      await transporter.verify();
      console.log('✅ Using static Ethereal credentials from .env');
      return transporter;
    } catch (error) {
      console.log('⚠️ Static credentials failed, falling back to auto-generated...');
      // Fall through to auto-generate
    }
  }

  // OPTION 2: Auto-generate fresh credentials (always works!)
  if (!cachedTestAccount) {
    console.log('📧 Generating fresh Ethereal test account...');
    cachedTestAccount = await nodemailer.createTestAccount();
    console.log('✅ New test account created:');
    console.log('  - Email:', cachedTestAccount.user);
    console.log('  - Password:', cachedTestAccount.pass);
    console.log('  - SMTP:', cachedTestAccount.smtp.host);
  }

  return nodemailer.createTransport({
    host: cachedTestAccount.smtp.host,
    port: cachedTestAccount.smtp.port,
    secure: cachedTestAccount.smtp.secure,
    auth: {
      user: cachedTestAccount.user,
      pass: cachedTestAccount.pass,
    },
  });
};

const emailService = {
  sendVerificationEmail: async (user, verificationToken) => {
    try {
      const transporter = await getTransporter();
      
      const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
      
      const info = await transporter.sendMail({
        from: `"Daily-Debrief" <${transporter.options.auth.user}>`,
        to: user.email,
        subject: 'Verify Your Email - Daily-Debrief',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Verify Your Email</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f4;">
            <div style="max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <!-- Header with gradient -->
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
      });

      // Get preview URL
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log('✅ Verification email sent!');
      console.log('🔍 Preview URL:', previewUrl);
      
      return true;
    } catch (error) {
      console.error('❌ Failed to send verification email:', error);
      return false;
    }
  },

  sendPasswordResetEmail: async (user, resetToken) => {
    try {
      const transporter = await getTransporter();
      
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
      
      const info = await transporter.sendMail({
        from: `"Daily-Debrief" <${transporter.options.auth.user}>`,
        to: user.email,
        subject: 'Password Reset - Daily-Debrief',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
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
      });

      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log('✅ Password reset email sent!');
      console.log('🔍 Preview URL:', previewUrl);
      
      return true;
    } catch (error) {
      console.error('❌ Failed to send password reset email:', error);
      return false;
    }
  },

  send2FABackupCodes: async (user, backupCodes) => {
    try {
      const transporter = await getTransporter();
      
      const info = await transporter.sendMail({
        from: `"Daily-Debrief" <${transporter.options.auth.user}>`,
        to: user.email,
        subject: 'Your 2FA Backup Codes - Daily-Debrief',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
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
                
                <div style="background: #f8f8f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p style="font-family: monospace; font-size: 18px; text-align: center; letter-spacing: 2px; margin: 0;">
                    ${backupCodes.map(code => `<span style="display: inline-block; padding: 5px 10px; margin: 5px; background: #333; color: #0f0; border-radius: 4px;">${code}</span>`).join('')}
                  </p>
                </div>
                
                <div style="background: #fff3cd; border: 1px solid #ffeeba; color: #856404; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0; font-weight: bold;">⚠️ Important:</p>
                  <ul style="margin: 10px 0 0; padding-left: 20px;">
                    <li>Each code can only be used once</li>
                    <li>Keep these codes in a safe place</li>
                    <li>You'll need them if you lose access to your authenticator app</li>
                  </ul>
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
      });

      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log('✅ 2FA backup codes email sent!');
      console.log('🔍 Preview URL:', previewUrl);
      
      return true;
    } catch (error) {
      console.error('❌ Failed to send 2FA backup codes:', error);
      return false;
    }
  }
};

module.exports = emailService;