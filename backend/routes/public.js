const express = require('express');
const pool = require('../config/database');

const router = express.Router();

// Get store by subdomain (no auth needed)
router.get('/store/:subdomain', async (req, res) => {
  try {
    const { subdomain } = req.params;
    
    // Add cache control headers to prevent stale theme data
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store'
    });
    
    // Get store settings
    const storeResult = await pool.query(
      'SELECT * FROM store_settings WHERE subdomain = $1',
      [subdomain]
    );
    
    if (storeResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Store not found' });
    }
    
    const store = storeResult.rows[0];
    
    // Debug: log what's actually in store_settings
    console.log('📦 Store settings from DB:', {
      subdomain: store.subdomain,
      show_testimonials: store.show_testimonials,
      collection_testimonials: store.collection_testimonials,
      collection_testimonials_type: typeof store.collection_testimonials
    });
    
    // Get products for this store
    const productsResult = await pool.query(
      'SELECT * FROM products WHERE user_id = $1 AND is_active = true ORDER BY created_at DESC',
      [store.user_id]
    );
    
    // Get theme details
    const themeResult = await pool.query(
      'SELECT * FROM themes WHERE name = $1',
      [store.theme_color]
    );
    
    res.json({
      success: true,
      store: {
        subdomain: store.subdomain,
        logoText: store.logo_text,
        tagline: store.tagline,
        theme: themeResult.rows[0] || null,
        fontFamily: store.font_family,
        logoUrl: store.logo_url || '',
        headerBgUrl: store.header_bg_url || '',
        showTestimonials: store.show_testimonials !== false,
        collectionTestimonials: store.collection_testimonials || [],
      },
      products: productsResult.rows,
      // Add timestamp for debugging
      _timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get store error:', error);
    res.status(500).json({ success: false, error: 'Failed to load store' });
  }
});

module.exports = router;
