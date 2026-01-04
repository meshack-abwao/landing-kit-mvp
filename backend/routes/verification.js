const express = require('express');
const crypto = require('crypto');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

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
    
    // TODO: Send actual email using Resend/SendGrid/etc.
    // For now, log to console (replace with actual email service)
    console.log('📧 VERIFICATION CODE:', verificationCode, 'for', email);
    
    // In production, you'd call your email service here:
    // await sendVerificationEmail(email, verificationCode);
    
    res.json({
      success: true,
      message: 'Verification code sent to your email',
      // Remove this in production - only for testing
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
    
    // Don't reveal if email exists or not
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
    
    // TODO: Send actual email with reset link
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5176'}/reset-password?token=${resetToken}`;
    console.log('🔑 PASSWORD RESET LINK:', resetLink);
    
    res.json({
      success: true,
      message: 'If an account exists with this email, you will receive a reset link',
      // Remove this in production - only for testing
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
