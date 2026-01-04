const express = require('express');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Fallback templates when DB table doesn't exist
const FALLBACK_TEMPLATES = [
  { slug: 'quick-decision', name: 'Quick Decision', description: 'Convert browsers into buyers fast', price: 250, best_for: 'Fashion, accessories, beauty', features: ['Story circles', 'Quick checkout', 'Social proof'], display_order: 1 },
  { slug: 'portfolio-booking', name: 'Portfolio + Booking', description: 'Showcase work and book clients', price: 500, best_for: 'Photographers, consultants', features: ['Gallery showcase', 'Service packages', 'Booking'], display_order: 2 },
  { slug: 'visual-menu', name: 'Visual Menu', description: 'Beautiful food displays that sell', price: 600, best_for: 'Restaurants, food delivery', features: ['Photo gallery', 'Dietary tags', 'Categories'], display_order: 3 },
  { slug: 'deep-dive', name: 'Deep Dive Evaluator', description: 'Build trust for big purchases', price: 800, best_for: 'Electronics, furniture, luxury', features: ['Spec tables', 'Trust badges', 'Video', 'Warranties'], display_order: 4 },
  { slug: 'event-landing', name: 'Event Landing', description: 'Drive registrations for events', price: 700, best_for: 'Events, webinars, courses', features: ['Countdown timer', 'Speaker bios', 'RSVP'], display_order: 5 },
  { slug: 'catalog-nav', name: 'Catalog Navigator', description: 'Organize large product catalogs', price: 400, best_for: 'Large catalogs, multi-category', features: ['Category filters', 'Search', 'Featured'], display_order: 6 },
];

// =============================================
// GET ALL TEMPLATE DEFINITIONS
// =============================================
router.get('/', async (req, res) => {
  try {
    // Check if table exists first
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'template_definitions'
      )
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('⚠️ template_definitions table not found, using fallback');
      return res.json({ success: true, templates: FALLBACK_TEMPLATES });
    }

    const result = await pool.query(`
      SELECT * FROM template_definitions 
      WHERE is_active = true 
      ORDER BY display_order
    `);

    // If table exists but is empty, return fallback
    if (result.rows.length === 0) {
      return res.json({ success: true, templates: FALLBACK_TEMPLATES });
    }

    res.json({ success: true, templates: result.rows });
  } catch (error) {
    console.error('Get templates error:', error);
    // Return fallback on any error
    res.json({ success: true, templates: FALLBACK_TEMPLATES });
  }
});

// =============================================
// GET SINGLE TEMPLATE BY SLUG
// =============================================
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    // Try database first
    try {
      const result = await pool.query(
        'SELECT * FROM template_definitions WHERE slug = $1',
        [slug]
      );
      if (result.rows.length > 0) {
        return res.json({ success: true, template: result.rows[0] });
      }
    } catch (e) {
      // Table doesn't exist, use fallback
    }
    
    // Fallback
    const template = FALLBACK_TEMPLATES.find(t => t.slug === slug);
    if (template) {
      return res.json({ success: true, template });
    }

    res.status(404).json({ success: false, error: 'Template not found' });
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
    let reasoning = 'Perfect for fast-converting product pages';
    
    if (industry === 'services') {
      recommendedSlug = 'portfolio-booking';
      reasoning = 'Showcase your expertise and let clients book directly';
    } else if (industry === 'food') {
      recommendedSlug = 'visual-menu';
      reasoning = 'Beautiful food displays that make ordering easy';
    } else if (industry === 'events') {
      recommendedSlug = 'event-landing';
      reasoning = 'Drive registrations with urgency and social proof';
    } else if (challenge === 'trust') {
      recommendedSlug = 'deep-dive';
      reasoning = 'Build confidence with detailed specs and guarantees';
    } else if (challenge === 'catalog-confusion' || productCount > 10) {
      recommendedSlug = 'catalog-nav';
      reasoning = 'Help customers navigate your full catalog easily';
    }
    
    const recommended = FALLBACK_TEMPLATES.find(t => t.slug === recommendedSlug);
    const alternatives = FALLBACK_TEMPLATES.filter(t => t.slug !== recommendedSlug).slice(0, 3);

    res.json({ success: true, recommended, reasoning, alternatives });
  } catch (error) {
    console.error('Template recommendation error:', error);
    res.status(500).json({ success: false, error: 'Failed to get recommendation' });
  }
});

// =============================================
// CHECK HOMEPAGE ELIGIBILITY
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
      message: eligible ? 'You can unlock the Homepage addon!' : `Add ${4 - count} more products to unlock Homepage`,
      price: 800
    });
  } catch (error) {
    console.error('Homepage eligibility error:', error);
    res.status(500).json({ success: false, error: 'Failed to check eligibility' });
  }
});

module.exports = router;
