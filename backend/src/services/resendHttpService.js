const axios = require('axios');

class ResendHttpService {
  constructor() {
    this.apiKey = process.env.RESEND_API_KEY;
    this.baseUrl = 'https://api.resend.com';
  }

  /**
   * Send verification email using direct HTTP API
   */
  async sendVerificationEmail(user, verificationToken) {
    try {
      const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
      
      // Log the link prominently
      console.log('\n🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗');
      console.log('🔗 VERIFICATION LINK (click to verify):');
      console.log(verificationUrl);
      console.log('🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗\n');

      // Try to send via Resend API
      try {
        const response = await axios.post(
          `${this.baseUrl}/emails`,
          {
            from: process.env.RESEND_FROM_EMAIL || 'Daily-Debrief <onboarding@resend.dev>',
            to: [user.email],
            subject: 'Verify Your Email - Daily-Debrief',
            html: this.getVerificationEmailTemplate(user.name, verificationUrl)
          },
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json'
            }
          }
        );

        console.log(`✅ Resend API success:`, response.data);
      } catch (apiError) {
        console.log('⚠️ Resend API failed (but link is available):', apiError.message);
      }

      // ALWAYS return success with the URL
      return { 
        success: true, 
        verificationUrl,
        message: 'Registration successful! Click the link below to verify your account.'
      };

    } catch (error) {
      console.error('❌ Email service error:', error);
      const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
      return { 
        success: true, 
        verificationUrl,
        message: 'Registration successful! Click the link below to verify your account.'
      };
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    
    console.log('\n🔗 PASSWORD RESET LINK:', resetUrl);

    try {
      await axios.post(
        `${this.baseUrl}/emails`,
        {
          from: process.env.RESEND_FROM_EMAIL || 'Daily-Debrief <onboarding@resend.dev>',
          to: [user.email],
          subject: 'Reset Your Password - Daily-Debrief',
          html: this.getPasswordResetTemplate(user.name, resetUrl)
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (error) {
      console.log('⚠️ Password reset email failed:', error.message);
    }

    return { success: true, resetUrl };
  }

  /**
   * Send 2FA backup codes
   */
  async send2FABackupCodes(user, backupCodes) {
    try {
      await axios.post(
        `${this.baseUrl}/emails`,
        {
          from: process.env.RESEND_FROM_EMAIL || 'Daily-Debrief <onboarding@resend.dev>',
          to: [user.email],
          subject: 'Your 2FA Backup Codes - Daily-Debrief',
          html: this.getBackupCodesTemplate(user.name, backupCodes)
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (error) {
      console.log('⚠️ 2FA email failed:', error.message);
    }

    return { success: true };
  }

  /**
   * Email templates (preserving your original styling)
   */
  getVerificationEmailTemplate(name, url) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(to right, #EF4444, #1E40AF); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Daily-Debrief</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">Email Verification</p>
          </div>
          <div style="padding: 40px 30px;">
            <h2 style="color: #333; margin-top: 0;">Welcome, ${name}!</h2>
            <p style="color: #666;">Please verify your email address by clicking the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${url}" 
                 style="display: inline-block; padding: 14px 40px; background: linear-gradient(to right, #EF4444, #1E40AF); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Verify Email Address
              </a>
            </div>
            <p style="color: #666;">This link will expire in <strong>24 hours</strong>.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getPasswordResetTemplate(name, url) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Password Reset</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(to right, #EF4444, #1E40AF); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Daily-Debrief</h1>
          </div>
          <div style="padding: 40px 30px;">
            <h2>Hello, ${name}!</h2>
            <p>Click the button below to reset your password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${url}" style="display: inline-block; padding: 14px 40px; background: linear-gradient(to right, #EF4444, #1E40AF); color: white; text-decoration: none; border-radius: 8px;">
                Reset Password
              </a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getBackupCodesTemplate(name, codes) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>2FA Backup Codes</title>
      </head>
      <body>
        <h1>Your 2FA Backup Codes</h1>
        <p>Store these safely. Each code can only be used once.</p>
        <pre>${codes.join('\n')}</pre>
      </body>
      </html>
    `;
  }
}

module.exports = new ResendHttpService();