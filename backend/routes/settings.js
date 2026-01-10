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

// Update settings - handles ALL fields dynamically
router.put('/', authMiddleware, async (req, res) => {
  try {
    console.log('📝 Settings update request:', JSON.stringify(req.body, null, 2));
    
    // Map of camelCase to snake_case field names
    const fieldMap = {
      // Basic
      logoText: 'logo_text',
      logo_text: 'logo_text',
      tagline: 'tagline',
      subdomain: 'subdomain',
      themeColor: 'theme_color',
      theme_color: 'theme_color',
      themeId: 'theme_id',
      theme_id: 'theme_id',
      fontFamily: 'font_family',
      font_family: 'font_family',
      mpesaNumber: 'mpesa_number',
      mpesa_number: 'mpesa_number',
      logoUrl: 'logo_url',
      logo_url: 'logo_url',
      // Header Background
      headerBgUrl: 'header_bg_url',
      header_bg_url: 'header_bg_url',
      headerBgType: 'header_bg_type',
      header_bg_type: 'header_bg_type',
      // Hero Section
      heroBgType: 'hero_bg_type',
      hero_bg_type: 'hero_bg_type',
      heroBgImage: 'hero_bg_image',
      hero_bg_image: 'hero_bg_image',
      heroBgGradient: 'hero_bg_gradient',
      hero_bg_gradient: 'hero_bg_gradient',
      heroPhotoUrl: 'hero_photo_url',
      hero_photo_url: 'hero_photo_url',
      heroTitle: 'hero_title',
      hero_title: 'hero_title',
      heroSubtitle: 'hero_subtitle',
      hero_subtitle: 'hero_subtitle',
      heroCtaPrimaryText: 'hero_cta_primary_text',
      hero_cta_primary_text: 'hero_cta_primary_text',
      heroCtaPrimaryLink: 'hero_cta_primary_link',
      hero_cta_primary_link: 'hero_cta_primary_link',
      heroCtaSecondaryText: 'hero_cta_secondary_text',
      hero_cta_secondary_text: 'hero_cta_secondary_text',
      heroCtaSecondaryLink: 'hero_cta_secondary_link',
      hero_cta_secondary_link: 'hero_cta_secondary_link',
      // Testimonial
      showFeaturedTestimonial: 'show_featured_testimonial',
      show_featured_testimonial: 'show_featured_testimonial',
      featuredTestimonialText: 'featured_testimonial_text',
      featured_testimonial_text: 'featured_testimonial_text',
      featuredTestimonialAuthor: 'featured_testimonial_author',
      featured_testimonial_author: 'featured_testimonial_author',
      featuredTestimonialDetail: 'featured_testimonial_detail',
      featured_testimonial_detail: 'featured_testimonial_detail',
      // Policies
      privacyPolicy: 'privacy_policy',
      privacy_policy: 'privacy_policy',
      termsOfService: 'terms_of_service',
      terms_of_service: 'terms_of_service',
      refundPolicy: 'refund_policy',
      refund_policy: 'refund_policy',
      // Light mode
      lightModeEnabled: 'light_mode_enabled',
      light_mode_enabled: 'light_mode_enabled',
      brandColorPrimary: 'brand_color_primary',
      brand_color_primary: 'brand_color_primary',
      brandColorSecondary: 'brand_color_secondary',
      brand_color_secondary: 'brand_color_secondary',
    };

    const updates = [];
    const values = [];
    let paramCount = 1;
    const processedFields = new Set();

    // Process each field in the request body
    for (const [key, value] of Object.entries(req.body)) {
      const dbField = fieldMap[key];
      if (dbField && !processedFields.has(dbField)) {
        updates.push(`${dbField} = $${paramCount}`);
        values.push(value === undefined ? null : value);
        paramCount++;
        processedFields.add(dbField);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid fields to update' });
    }

    values.push(req.user.userId);

    const query = `
      UPDATE store_settings
      SET ${updates.join(', ')}
      WHERE user_id = $${paramCount}
      RETURNING *
    `;

    console.log('📝 Update query:', query);
    console.log('📝 Values:', values);

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Settings not found' });
    }

    console.log('✅ Settings updated successfully');

    res.json({
      success: true,
      settings: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Update settings error:', error);
    res.status(500).json({ success: false, error: 'Failed to update settings: ' + error.message });
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

    const existing = await pool.query(
      'SELECT id FROM user_add_ons WHERE user_id = $1 AND add_on_id = $2',
      [req.user.userId, id]
    );

    if (existing.rows.length > 0) {
      return res.json({ success: false, error: 'Add-on already activated' });
    }

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
