const express = require('express');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get user settings
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM store_settings WHERE user_id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.json({ success: false, error: 'Settings not found' });
    }

    res.json({
      success: true,
      settings: result.rows[0]
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ success: false, error: 'Failed to get settings' });
  }
});

// Update settings
router.put('/', authMiddleware, async (req, res) => {
  try {
    const { 
      logoText, logo_text,
      tagline, 
      subdomain, 
      themeColor, theme_color,
      themeId, theme_id,
      fontFamily, font_family,
      mpesaNumber, mpesa_number,
      logoUrl, logo_url,
      headerBgUrl, header_bg_url
    } = req.body;

    // Build update query dynamically based on provided fields
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (logoText || logo_text) {
      updates.push(`logo_text = $${paramCount}`);
      values.push(logoText || logo_text);
      paramCount++;
    }

    if (tagline !== undefined) {
      updates.push(`tagline = $${paramCount}`);
      values.push(tagline);
      paramCount++;
    }

    if (subdomain) {
      updates.push(`subdomain = $${paramCount}`);
      values.push(subdomain);
      paramCount++;
    }

    if (themeColor || theme_color) {
      updates.push(`theme_color = $${paramCount}`);
      values.push(themeColor || theme_color);
      paramCount++;
    }

    if (themeId || theme_id) {
      updates.push(`theme_id = $${paramCount}`);
      values.push(themeId || theme_id);
      paramCount++;
    }

    if (fontFamily || font_family) {
      updates.push(`font_family = $${paramCount}`);
      values.push(fontFamily || font_family);
      paramCount++;
    }

    if (mpesaNumber || mpesa_number) {
      updates.push(`mpesa_number = $${paramCount}`);
      values.push(mpesaNumber || mpesa_number);
      paramCount++;
    }

    if (logoUrl !== undefined || logo_url !== undefined) {
      updates.push(`logo_url = $${paramCount}`);
      values.push(logoUrl || logo_url || '');
      paramCount++;
    }

    if (headerBgUrl !== undefined || header_bg_url !== undefined) {
      updates.push(`header_bg_url = $${paramCount}`);
      values.push(headerBgUrl || header_bg_url || '');
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }

    // Add user_id for WHERE clause
    values.push(req.user.userId);

    const query = `
      UPDATE store_settings
      SET ${updates.join(', ')}
      WHERE user_id = $${paramCount}
      RETURNING *
    `;

    console.log('Update query:', query);
    console.log('Update values:', values);

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Settings not found' });
    }

    res.json({
      success: true,
      settings: result.rows[0]
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ success: false, error: 'Failed to update settings' });
  }
});

// Get available themes
router.get('/themes', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM themes ORDER BY is_premium, name');

    res.json({
      success: true,
      themes: result.rows
    });
  } catch (error) {
    console.error('Get themes error:', error);
    res.status(500).json({ success: false, error: 'Failed to get themes' });
  }
});

// Get add-ons with user activation status
router.get('/add-ons', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*,
        CASE WHEN ua.id IS NOT NULL THEN true ELSE false END as "isActive"
      FROM add_ons a
      LEFT JOIN user_add_ons ua ON a.id = ua.add_on_id AND ua.user_id = $1
      WHERE a.is_active = true
      ORDER BY a.price
    `, [req.user.userId]);

    res.json({
      success: true,
      addOns: result.rows
    });
  } catch (error) {
    console.error('Get add-ons error:', error);
    res.status(500).json({ success: false, error: 'Failed to get add-ons' });
  }
});

// Activate add-on
router.post('/add-ons/:id/activate', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if already activated
    const existing = await pool.query(
      'SELECT id FROM user_add_ons WHERE user_id = $1 AND add_on_id = $2',
      [req.user.userId, id]
    );

    if (existing.rows.length > 0) {
      return res.json({ success: false, error: 'Add-on already activated' });
    }

    // Activate add-on
    await pool.query(
      'INSERT INTO user_add_ons (user_id, add_on_id) VALUES ($1, $2)',
      [req.user.userId, id]
    );

    res.json({
      success: true,
      message: 'Add-on activated successfully'
    });
  } catch (error) {
    console.error('Activate add-on error:', error);
    res.status(500).json({ success: false, error: 'Failed to activate add-on' });
  }
});

module.exports = router;
