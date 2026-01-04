const express = require('express');
const crypto = require('crypto');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// =============================================
// EMAIL SERVICE - RESEND
// =============================================
const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_RDCENxkv_PZX2YppsjP9FPUuCy1VDbNty';
const EMAIL_FROM = process.env.EMAIL_FROM || 'Jari.Ecom <onboarding@resend.dev>';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5176';

async function sendEmail(to, subject, html) {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [to],
        subject: subject,
        html: html,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Resend API error:', data);
      return { success: false, error: data.message || 'Failed to send email' };
    }

    console.log('📧 Email sent successfully:', data.id);
    return { success: true, id: data.id };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
}

// Email Templates
function getVerificationEmailHTML(code) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f7;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; margin-top: 40px; margin-bottom: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
    <tr>
      <td style="background: linear-gradient(135deg, #ff9f0a 0%, #ff375f 100%); padding: 40px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 800;">Jari.Ecom</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 16px;">Verify Your Email</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px;">
        <p style="color: #1d1d1f; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
          Here's your verification code. Enter this code to verify your email address:
        </p>
        <div style="background: linear-gradient(135deg, #f5f5f7 0%, #e8e8ed 100%); border-radius: 12px; padding: 24px; text-align: center; margin: 0 0 24px;">
          <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #1d1d1f; font-family: monospace;">${code}</span>
        </div>
        <p style="color: #6e6e73; font-size: 14px; line-height: 1.6; margin: 0;">
          This code expires in <strong>10 minutes</strong>. If you didn't request this code, you can safely ignore this email.
        </p>
      </td>
    </tr>
    <tr>
      <td style="background: #f5f5f7; padding: 24px; text-align: center;">
        <p style="color: #6e6e73; font-size: 12px; margin: 0;">
          © ${new Date().getFullYear()} Jari.Ecom. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function getPasswordResetEmailHTML(resetLink) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f7;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; margin-top: 40px; margin-bottom: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
    <tr>
      <td style="background: linear-gradient(135deg, #ff9f0a 0%, #ff375f 100%); padding: 40px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 800;">Jari.Ecom</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 16px;">Reset Your Password</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px;">
        <p style="color: #1d1d1f; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
          We received a request to reset your password. Click the button below to create a new password:
        </p>
        <div style="text-align: center; margin: 0 0 24px;">
          <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #ff9f0a 0%, #ff375f 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 700; font-size: 16px;">
            Reset Password
          </a>
        </div>
        <p style="color: #6e6e73; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
          Or copy and paste this link into your browser:
        </p>
        <div style="background: #f5f5f7; border-radius: 8px; padding: 12px; word-break: break-all; margin: 0 0 24px;">
          <a href="${resetLink}" style="color: #ff9f0a; font-size: 13px; text-decoration: none;">${resetLink}</a>
        </div>
        <p style="color: #6e6e73; font-size: 14px; line-height: 1.6; margin: 0;">
          This link expires in <strong>1 hour</strong>. If you didn't request a password reset, you can safely ignore this email.
        </p>
      </td>
    </tr>
    <tr>
      <td style="background: #f5f5f7; padding: 24px; text-align: center;">
        <p style="color: #6e6e73; font-size: 12px; margin: 0;">
          © ${new Date().getFullYear()} Jari.Ecom. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// =============================================
// SEND VERIFICATION EMAIL
// =============================================
router.post('/send-verification', authMiddleware, async (req, res) => {
  try {
    const { email } = req.body;
    const userId = req.user.userId;
    
    // Generate 6-digit code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Code expires in 10 minutes
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    
    // Delete any existing codes for this user
    await pool.query(
      'DELETE FROM email_verifications WHERE user_id = $1',
      [userId]
    );
    
    // Insert new verification code
    await pool.query(
      `INSERT INTO email_verifications (user_id, email, verification_code, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [userId, email, verificationCode, expiresAt]
    );
    
    // Send verification email via Resend
    const emailResult = await sendEmail(
      email,
      'Verify Your Email - Jari.Ecom',
      getVerificationEmailHTML(verificationCode)
    );
    
    if (!emailResult.success) {
      console.error('Failed to send verification email:', emailResult.error);
      // Still return success to not reveal email issues, but log it
    }
    
    res.json({
      success: true,
      message: 'Verification code sent to your email',
      // Only for development testing
      ...(process.env.NODE_ENV === 'development' && { debug_code: verificationCode })
    });
  } catch (error) {
    console.error('Send verification error:', error);
    res.status(500).json({ success: false, error: 'Failed to send verification code' });
  }
});

// =============================================
// VERIFY EMAIL CODE
// =============================================
router.post('/verify-code', authMiddleware, async (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.user.userId;
    
    // Find valid verification code
    const result = await pool.query(
      `SELECT * FROM email_verifications 
       WHERE user_id = $1 AND verification_code = $2 AND expires_at > NOW() AND verified = false`,
      [userId, code]
    );
    
    if (result.rows.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid or expired verification code' 
      });
    }
    
    // Mark as verified
    await pool.query(
      'UPDATE email_verifications SET verified = true WHERE id = $1',
      [result.rows[0].id]
    );
    
    // Update user as verified
    await pool.query(
      'UPDATE users SET email_verified = true WHERE id = $1',
      [userId]
    );
    
    res.json({
      success: true,
      message: 'Email verified successfully!'
    });
  } catch (error) {
    console.error('Verify code error:', error);
    res.status(500).json({ success: false, error: 'Failed to verify code' });
  }
});

// =============================================
// REQUEST PASSWORD RESET
// =============================================
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Check if user exists
    const userResult = await pool.query(
      'SELECT id, email FROM users WHERE email = $1',
      [email]
    );
    
    // Don't reveal if email exists or not (security)
    if (userResult.rows.length === 0) {
      return res.json({
        success: true,
        message: 'If an account exists with this email, you will receive a reset link'
      });
    }
    
    const user = userResult.rows[0];
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Token expires in 1 hour
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    
    // Delete any existing tokens for this user
    await pool.query(
      'DELETE FROM password_resets WHERE user_id = $1',
      [user.id]
    );
    
    // Insert new reset token
    await pool.query(
      `INSERT INTO password_resets (user_id, email, reset_token, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [user.id, email, resetToken, expiresAt]
    );
    
    // Build reset link
    const resetLink = `${FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    // Send password reset email via Resend
    const emailResult = await sendEmail(
      email,
      'Reset Your Password - Jari.Ecom',
      getPasswordResetEmailHTML(resetLink)
    );
    
    if (!emailResult.success) {
      console.error('Failed to send reset email:', emailResult.error);
    }
    
    console.log('🔑 PASSWORD RESET LINK:', resetLink);
    
    res.json({
      success: true,
      message: 'If an account exists with this email, you will receive a reset link',
      // Only for development testing
      ...(process.env.NODE_ENV === 'development' && { debug_link: resetLink })
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, error: 'Failed to process request' });
  }
});

// =============================================
// VERIFY RESET TOKEN
// =============================================
router.get('/verify-reset-token/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    const result = await pool.query(
      `SELECT * FROM password_resets 
       WHERE reset_token = $1 AND expires_at > NOW() AND used = false`,
      [token]
    );
    
    if (result.rows.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid or expired reset token' 
      });
    }
    
    res.json({
      success: true,
      email: result.rows[0].email
    });
  } catch (error) {
    console.error('Verify token error:', error);
    res.status(500).json({ success: false, error: 'Failed to verify token' });
  }
});

// =============================================
// RESET PASSWORD
// =============================================
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const bcrypt = require('bcryptjs');
    
    // Find valid reset token
    const result = await pool.query(
      `SELECT * FROM password_resets 
       WHERE reset_token = $1 AND expires_at > NOW() AND used = false`,
      [token]
    );
    
    if (result.rows.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid or expired reset token' 
      });
    }
    
    const resetRecord = result.rows[0];
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update user password
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [hashedPassword, resetRecord.user_id]
    );
    
    // Mark token as used
    await pool.query(
      'UPDATE password_resets SET used = true WHERE id = $1',
      [resetRecord.id]
    );
    
    res.json({
      success: true,
      message: 'Password reset successfully! You can now login with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, error: 'Failed to reset password' });
  }
});

// =============================================
// CHECK VERIFICATION STATUS
// =============================================
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT email_verified, onboarding_completed FROM users WHERE id = $1',
      [req.user.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    res.json({
      success: true,
      emailVerified: result.rows[0].email_verified,
      onboardingCompleted: result.rows[0].onboarding_completed
    });
  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({ success: false, error: 'Failed to get status' });
  }
});

module.exports = router;
