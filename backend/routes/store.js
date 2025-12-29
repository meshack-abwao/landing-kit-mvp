const express = require('express');
const pool = require('../config/database');
const router = express.Router();

// Get store by subdomain (public - no auth required)
router.get('/:subdomain', async (req, res) => {
  try {
    const { subdomain } = req.params;

    // Get user and store settings
    const storeResult = await pool.query(`
      SELECT 
        u.id as user_id,
        u.business_name,
        u.instagram_handle,
        u.phone,
        u.subscription_tier,
        ss.logo_text,
        ss.tagline,
        ss.theme_color,
        ss.font_family,
        ss.primary_color,
        ss.gradient_style,
        ss.animation_style
      FROM users u
      LEFT JOIN store_settings ss ON u.id = ss.user_id
      WHERE ss.subdomain = $1
    `, [subdomain]);

    if (storeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const store = storeResult.rows[0];

    // Get active products (limit based on tier)
    const productLimit = store.subscription_tier === 'tier1' ? 1 : 10;
    const productsResult = await pool.query(`
      SELECT id, name, description, price, image_url, stock_quantity
      FROM products
      WHERE user_id = $1 AND is_active = true
      ORDER BY display_order, created_at DESC
      LIMIT $2
    `, [store.user_id, productLimit]);

    // Get theme details
    const themeResult = await pool.query(`
      SELECT * FROM themes WHERE name = $1
    `, [store.theme_color || 'warm-sunset']);

    res.json({
      success: true,
      store: {
        businessName: store.business_name,
        instagramHandle: store.instagram_handle,
        phone: store.phone,
        logoText: store.logo_text,
        tagline: store.tagline,
        tier: store.subscription_tier,
      },
      theme: themeResult.rows[0] || null,
      products: productsResult.rows,
    });

  } catch (error) {
    console.error('Get store error:', error);
    res.status(500).json({ error: 'Failed to fetch store' });
  }
});

// Get single product (public)
router.get('/:subdomain/product/:productId', async (req, res) => {
  try {
    const { subdomain, productId } = req.params;

    // Verify store exists and get user_id
    const storeResult = await pool.query(`
      SELECT u.id as user_id
      FROM users u
      LEFT JOIN store_settings ss ON u.id = ss.user_id
      WHERE ss.subdomain = $1
    `, [subdomain]);

    if (storeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Store not found' });
    }

    // Get product
    const productResult = await pool.query(`
      SELECT * FROM products
      WHERE id = $1 AND user_id = $2 AND is_active = true
    `, [productId, storeResult.rows[0].user_id]);

    if (productResult.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({
      success: true,
      product: productResult.rows[0],
    });

  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

module.exports = router;
