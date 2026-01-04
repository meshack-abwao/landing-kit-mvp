const express = require('express');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// =============================================
// GET ALL TEMPLATE DEFINITIONS
// =============================================
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM template_definitions 
      WHERE is_active = true 
      ORDER BY display_order
    `);

    res.json({
      success: true,
      templates: result.rows
    });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ success: false, error: 'Failed to get templates' });
  }
});

// =============================================
// GET SINGLE TEMPLATE BY SLUG
// =============================================
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM template_definitions WHERE slug = $1',
      [slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }

    res.json({
      success: true,
      template: result.rows[0]
    });
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({ success: false, error: 'Failed to get template' });
  }
});

// =============================================
// RECOMMEND TEMPLATE BASED ON QUESTIONNAIRE
// =============================================
router.post('/recommend', async (req, res) => {
  try {
    const { industry, challenge, productCount } = req.body;
    
    let recommendedSlug = 'quick-decision';
    let reasoning = '';
    
    // Decision logic based on JTBD
    if (industry === 'services') {
      recommendedSlug = 'portfolio-booking';
      reasoning = 'Service providers need to showcase their expertise and portfolio';
    } else if (industry === 'food') {
      recommendedSlug = 'visual-menu';
      reasoning = 'Food businesses need visual menus that help customers order quickly';
    } else if (industry === 'events') {
      recommendedSlug = 'event-landing';
      reasoning = 'Events need dedicated landing pages to drive RSVPs';
    } else if (challenge === 'trust') {
      recommendedSlug = 'deep-dive';
      reasoning = 'Building trust requires detailed product information and guarantees';
    } else if (challenge === 'catalog-confusion' || productCount > 10) {
      recommendedSlug = 'catalog-nav';
      reasoning = 'Large catalogs need organized navigation to help customers find products';
    } else if (challenge === 'value-communication') {
      recommendedSlug = 'deep-dive';
      reasoning = 'High-value items need detailed specs and trust signals';
    } else if (challenge === 'decision-paralysis') {
      recommendedSlug = 'quick-decision';
      reasoning = 'Simple, focused pages help customers decide quickly';
    }
    
    // Get the recommended template
    const result = await pool.query(
      'SELECT * FROM template_definitions WHERE slug = $1',
      [recommendedSlug]
    );

    res.json({
      success: true,
      recommended: result.rows[0],
      reasoning,
      alternatives: await getAlternativeTemplates(recommendedSlug)
    });
  } catch (error) {
    console.error('Template recommendation error:', error);
    res.status(500).json({ success: false, error: 'Failed to get recommendation' });
  }
});

// Helper function to get alternative templates
async function getAlternativeTemplates(excludeSlug) {
  const result = await pool.query(`
    SELECT slug, name, price, best_for 
    FROM template_definitions 
    WHERE slug != $1 AND is_active = true 
    ORDER BY display_order 
    LIMIT 3
  `, [excludeSlug]);
  
  return result.rows;
}

// =============================================
// CHECK IF USER CAN ACCESS HOMEPAGE (4+ products)
// =============================================
router.get('/eligibility/homepage', authMiddleware, async (req, res) => {
  try {
    const productCount = await pool.query(
      'SELECT COUNT(*) FROM products WHERE user_id = $1',
      [req.user.userId]
    );
    
    const count = parseInt(productCount.rows[0].count);
    const eligible = count >= 4;
    
    res.json({
      success: true,
      eligible,
      productCount: count,
      message: eligible 
        ? 'You can unlock the Homepage addon!' 
        : `Add ${4 - count} more products to unlock Homepage`,
      price: 800
    });
  } catch (error) {
    console.error('Homepage eligibility error:', error);
    res.status(500).json({ success: false, error: 'Failed to check eligibility' });
  }
});

module.exports = router;
