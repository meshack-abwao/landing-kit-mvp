const express = require('express');
const pool = require('../config/database');
const router = express.Router();

/**
 * Migration endpoint - run once to migrate to JSONB config
 * POST /api/migrate/to-jsonb
 * 
 * This is a one-time migration that:
 * 1. Adds a 'config' JSONB column to store_settings
 * 2. Copies existing column data into config
 * 3. Keeps old columns for safety
 */
router.post('/to-jsonb', async (req, res) => {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Starting JSONB migration...');
    
    await client.query('BEGIN');
    
    // Step 1: Check if config column exists
    const columnsResult = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'store_settings' AND column_name = 'config'
    `);
    
    // Step 2: Add config column if needed
    if (columnsResult.rows.length === 0) {
      await client.query(`
        ALTER TABLE store_settings 
        ADD COLUMN config JSONB DEFAULT '{}'::jsonb
      `);
      console.log('✅ Config column added');
    }
    
    // Step 3: Get all stores and migrate
    const settingsResult = await client.query('SELECT * FROM store_settings');
    const migrated = [];
    
    for (const row of settingsResult.rows) {
      // Build config from existing columns
      const config = {
        branding: {
          logoText: row.logo_text || '',
          tagline: row.tagline || '',
          logoUrl: row.logo_url || '',
        },
        theme: {
          color: row.theme_color || 'warm-sunset',
          fontFamily: row.font_family || 'Inter',
          themeId: row.theme_id || null,
        },
        hero: {
          bgType: row.hero_bg_type || 'gradient',
          bgImage: row.hero_bg_image || '',
          bgGradient: row.hero_bg_gradient || '',
          photoUrl: row.hero_photo_url || '',
          title: row.hero_title || '',
          subtitle: row.hero_subtitle || '',
          ctaPrimaryText: row.hero_cta_primary_text || '',
          ctaPrimaryLink: row.hero_cta_primary_link || '',
          ctaSecondaryText: row.hero_cta_secondary_text || '',
          ctaSecondaryLink: row.hero_cta_secondary_link || '',
        },
        header: {
          bgUrl: row.header_bg_url || '',
          bgType: row.header_bg_type || 'gradient',
        },
        testimonials: {
          show: row.show_testimonials !== false,
          collection: Array.isArray(row.collection_testimonials) ? row.collection_testimonials : [],
          showFeatured: row.show_featured_testimonial || false,
          featuredText: row.featured_testimonial_text || '',
          featuredAuthor: row.featured_testimonial_author || '',
          featuredDetail: row.featured_testimonial_detail || '',
        },
        policies: {
          privacy: row.privacy_policy || '',
          terms: row.terms_of_service || '',
          refund: row.refund_policy || '',
        },
        payment: {
          mpesaNumber: row.mpesa_number || '',
        },
        display: {
          lightModeEnabled: row.light_mode_enabled || false,
          brandColorPrimary: row.brand_color_primary || '',
          brandColorSecondary: row.brand_color_secondary || '',
        },
      };
      
      await client.query(
        'UPDATE store_settings SET config = $1 WHERE id = $2',
        [config, row.id]
      );
      
      migrated.push({ id: row.id, subdomain: row.subdomain });
    }
    
    await client.query('COMMIT');
    
    console.log('🎉 Migration completed!');
    
    res.json({
      success: true,
      message: 'Migration completed successfully',
      migrated: migrated
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    client.release();
  }
});

/**
 * Check migration status
 * GET /api/migrate/status
 */
router.get('/status', async (req, res) => {
  try {
    // Check if config column exists
    const columnsResult = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'store_settings' AND column_name = 'config'
    `);
    
    const hasConfigColumn = columnsResult.rows.length > 0;
    
    // Check if any stores have config data
    let configStatus = [];
    if (hasConfigColumn) {
      const storesResult = await pool.query(`
        SELECT id, subdomain, 
               config IS NOT NULL AND config != '{}'::jsonb as has_config_data
        FROM store_settings
      `);
      configStatus = storesResult.rows;
    }
    
    res.json({
      success: true,
      hasConfigColumn,
      stores: configStatus
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
