const { Resend } = require('resend');

class ResendService {
  constructor() {
    this.resend = null;
  }


  initialize() {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is not configured');
    }
    
    this.resend = new Resend(process.env.RESEND_API_KEY);
    console.log('✅ Resend client initialized');
  }

  /**
   * Send verification email - RETURNS THE LINK for frontend display
   */
  async sendVerificationEmail(user, verificationToken) {
    try {
      if (!this.resend) this.initialize();

      const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
      
      // ALWAYS log the link to console for easy access
      console.log('\n🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗');
      console.log('🔗 VERIFICATION LINK (click to verify):');
      console.log(verificationUrl);
      console.log('🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗\n');
      
      // Try to send email but don't fail if it doesn't work
      try {
        const { data, error } = await this.resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'Daily-Debrief <onboarding@resend.dev>',
          to: [user.email],
          subject: 'Verify Your Email - Daily-Debrief',
          html: this.getVerificationEmailTemplate(user.name, verificationUrl)
        });

        if (error) {
          console.log('⚠️ Resend email failed (but link is available):', error.message);
        } else {
          console.log(`✅ Email sent to ${user.email} (ID: ${data.id})`);
        }
      } catch (emailError) {
        console.log('⚠️ Email sending error (but link is available):', emailError.message);
      }

      // ALWAYS return success with the verification URL
      return { 
        success: true, 
        verificationUrl,
        message: 'Registration successful! Click the link below to verify your account.'
      };
      
    } catch (error) {
      console.error('❌ Failed in verification process:', error);
      // Even on error, try to generate the URL
      const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
      return { 
        success: true, // Return true so registration continues
        verificationUrl,
        message: 'Registration successful! Click the link below to verify your account.',
        error: error.message 
      };
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(user, resetToken) {
    try {
      if (!this.resend) this.initialize();

      const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
      
      console.log('\n🔗🔗🔗 PASSWORD RESET LINK:');
      console.log(resetUrl);
      console.log('🔗🔗🔗\n');
      
      const { data, error } = await this.resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'Daily-Debrief <onboarding@resend.dev>',
        to: [user.email],
        subject: 'Reset Your Password - Daily-Debrief',
        html: this.getPasswordResetTemplate(user.name, resetUrl)
      });

      if (error) {
        console.error('❌ Resend error:', error);
        return { success: false, error: error.message, resetUrl };
      }

      console.log(`✅ Password reset email sent to ${user.email}`);
      return { success: true, messageId: data.id, resetUrl };
    } catch (error) {
      console.error('❌ Failed to send password reset email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send 2FA backup codes
   */
  async send2FABackupCodes(user, backupCodes) {
    try {
      if (!this.resend) this.initialize();

      const { data, error } = await this.resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'Daily-Debrief <onboarding@resend.dev>',
        to: [user.email],
        subject: 'Your 2FA Backup Codes - Daily-Debrief',
        html: this.getBackupCodesTemplate(user.name, backupCodes)
      });

      if (error) {
        console.error('❌ Resend error:', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ 2FA backup codes sent to ${user.email}`);
      return { success: true, messageId: data.id };
    } catch (error) {
      console.error('❌ Failed to send 2FA backup codes:', error);
      return { success: false, error: error.message };
    }
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
          <!-- Header with gradient -->
          <div style="background: linear-gradient(to right, #EF4444, #1E40AF); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Daily-Debrief</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">Email Verification</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px;">
            <h2 style="color: #333; margin-top: 0;">Welcome, ${name}!</h2>
            <p style="color: #666;">Thank you for registering with Daily-Debrief. Please verify your email address to start using all features.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${url}" 
                 style="display: inline-block; padding: 14px 40px; background: linear-gradient(to right, #EF4444, #1E40AF); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">
                Verify Email Address
              </a>
            </div>
            
            <p style="color: #666;">This link will expire in <strong>24 hours</strong>.</p>
            <p style="color: #666;">If you didn't create an account, you can safely ignore this email.</p>
            
            <div style="border-top: 1px solid #eee; margin-top: 30px; padding-top: 20px;">
              <p style="color: #999; font-size: 14px; text-align: center;">
                Or copy this link:<br>
                <span style="color: #666; word-break: break-all;">${url}</span>
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
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">Password Reset</p>
          </div>
          <div style="padding: 40px 30px;">
            <h2 style="color: #333;">Hello, ${name}!</h2>
            <p style="color: #666;">Click the button below to reset your password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${url}" style="display: inline-block; padding: 14px 40px; background: linear-gradient(to right, #EF4444, #1E40AF); color: white; text-decoration: none; border-radius: 8px;">
                Reset Password
              </a>
            </div>
            <p style="color: #666;">This link expires in 1 hour.</p>
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
      <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(to right, #EF4444, #1E40AF); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">Daily-Debrief</h1>
          </div>
          <div style="padding: 40px 30px;">
            <h2>Your 2FA Backup Codes</h2>
            <p>Store these safely. Each code can only be used once.</p>
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px;">
              ${codes.map(code => `<div style="font-family: monospace; padding: 5px;">${code}</div>`).join('')}
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

// Create singleton instance
const resendService = new ResendService();

module.exports = resendService;