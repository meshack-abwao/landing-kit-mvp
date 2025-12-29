const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, businessName, instagramHandle, affiliateCode } = req.body;

    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.json({ success: false, error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (email, password_hash, business_name, instagram_handle, affiliate_code, subscription_tier)
       VALUES ($1, $2, $3, $4, $5, 'tier2') RETURNING *`,
      [email, hashedPassword, businessName, instagramHandle, affiliateCode || null]
    );

    const user = result.rows[0];

    await pool.query(
      `INSERT INTO store_settings (user_id, logo_text, subdomain)
       VALUES ($1, $2, $3)`,
      [user.id, businessName, instagramHandle.replace('@', '')]
    );

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'your-secret-key', {
      expiresIn: '7d',
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        business_name: user.business_name,
        instagram_handle: user.instagram_handle,
        subscription_tier: user.subscription_tier,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.json({ success: false, error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.json({ success: false, error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'your-secret-key', {
      expiresIn: '7d',
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        business_name: user.business_name,
        instagram_handle: user.instagram_handle,
        subscription_tier: user.subscription_tier,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Login failed' });
  }
});

// Get current user (THIS WAS MISSING!)
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, business_name, instagram_handle, subscription_tier FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({
      success: true,
      user: result.rows[0],
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, error: 'Failed to get user' });
  }
});

module.exports = router;
