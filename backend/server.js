require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'jari-secret-key-2026';

// Database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.use(cors());
app.use(express.json());

// ============ HEALTH CHECK ============
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Jari.Ecom API v4 - FULL TEMPLATES', time: new Date().toISOString() });
});

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', version: 'v4', db: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', version: 'v4', db: 'disconnected', error: err.message });
  }
});

// ============ AUTH MIDDLEWARE ============
const auth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// ============ DATABASE SETUP ============
app.get('/api/setup', async (req, res) => {
  try {
    // Create template_definitions
    await pool.query(`
      CREATE TABLE IF NOT EXISTS template_definitions (
        id SERIAL PRIMARY KEY,
        slug VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) DEFAULT 500,
        best_for TEXT,
        features JSONB,
        is_active BOOLEAN DEFAULT true,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Insert 6 templates
    await pool.query(`
      INSERT INTO template_definitions (slug, name, description, price, best_for, display_order)
      VALUES 
        ('quick-decision', 'Quick Decision', 'Single product impulse buy', 250, 'Fashion, beauty', 1),
        ('portfolio-booking', 'Portfolio + Booking', 'Showcase work, get bookings', 500, 'Photographers, salons', 2),
        ('visual-menu', 'Visual Menu', 'Food ordering with photos', 600, 'Restaurants, cafes', 3),
        ('event-landing', 'Event Landing', 'Event ticket sales', 700, 'Events, workshops', 4),
        ('deep-dive', 'Deep Dive', 'Detailed product pages', 800, 'Electronics, jewelry', 5),
        ('catalog-nav', 'Catalog Navigator', 'Multi-product homepage', 400, 'Stores with 4+ products', 6)
      ON CONFLICT (slug) DO NOTHING
    `);

    // Add ALL product columns for templates
    const columns = [
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS template_type VARCHAR(50) DEFAULT 'quick-decision'`,
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS story_media JSONB DEFAULT '[]'`,
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS story_title VARCHAR(200) DEFAULT 'See it in Action'`,
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS additional_images JSONB DEFAULT '[]'`,
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS service_packages JSONB DEFAULT '[]'`,
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS dietary_tags JSONB DEFAULT '[]'`,
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS prep_time VARCHAR(50)`,
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS calories VARCHAR(50)`,
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS ingredients TEXT`,
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS specifications JSONB DEFAULT '{}'`,
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS trust_badges JSONB DEFAULT '[]'`,
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS warranty_info TEXT`,
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS return_policy_days INTEGER`,
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS rich_description TEXT`,
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS privacy_policy TEXT DEFAULT ''`,
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS terms_of_service TEXT DEFAULT ''`,
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS refund_policy TEXT DEFAULT ''`,
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS availability_notes TEXT`,
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS video_url TEXT`,
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS event_date TIMESTAMP`,
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS event_location TEXT`
    ];
    
    for (const col of columns) {
      try { await pool.query(col); } catch (e) { /* ignore */ }
    }

    // Create orders table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        product_id INTEGER,
        order_number VARCHAR(50) UNIQUE NOT NULL,
        customer_name VARCHAR(255),
        customer_phone VARCHAR(50),
        customer_location TEXT,
        quantity INTEGER DEFAULT 1,
        unit_price DECIMAL(10,2),
        total_amount DECIMAL(10,2),
        payment_method VARCHAR(50),
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    const result = await pool.query('SELECT * FROM template_definitions ORDER BY display_order');
    res.json({ success: true, message: 'Setup complete! All columns added.', templates: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ AUTH ROUTES ============
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, businessName, instagramHandle } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, business_name, instagram_handle, subscription_tier)
       VALUES ($1, $2, $3, $4, 'tier2') RETURNING id, email, business_name`,
      [email, hashedPassword, businessName, instagramHandle]
    );
    
    const user = result.rows[0];
    const subdomain = instagramHandle?.replace('@', '') || businessName.toLowerCase().replace(/\s+/g, '');
    
    await pool.query(
      `INSERT INTO store_settings (user_id, logo_text, subdomain) VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO NOTHING`,
      [user.id, businessName, subdomain]
    );
    
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.json({ success: false, error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    
    if (!valid) {
      return res.json({ success: false, error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ 
      success: true, 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        business_name: user.business_name,
        instagram_handle: user.instagram_handle 
      } 
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/auth/me', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, business_name, instagram_handle, subscription_tier FROM users WHERE id = $1',
      [req.user.userId]
    );
    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============ PRODUCTS - FULL TEMPLATE SUPPORT ============
app.get('/api/products', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM products WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.userId]
    );
    res.json({ success: true, products: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// CREATE PRODUCT - ALL FIELDS
app.post('/api/products', auth, async (req, res) => {
  try {
    const {
      name, description, price, imageUrl, stockQuantity, isActive, templateType,
      storyMedia, storyTitle, additionalImages, galleryImages, servicePackages,
      dietaryTags, prepTime, calories, ingredients, specifications,
      trustBadges, warranty, returnPolicy, richDescription,
      privacyPolicy, termsOfService, refundPolicy, videoUrl,
      eventDate, eventLocation, availability, testimonials
    } = req.body;
    
    const result = await pool.query(
      `INSERT INTO products (
        user_id, name, description, price, image_url, stock_quantity, is_active,
        template_type, story_media, story_title, additional_images, gallery_images, service_packages,
        dietary_tags, prep_time, calories, ingredients, specifications,
        trust_badges, warranty_info, return_policy_days, rich_description,
        privacy_policy, terms_of_service, refund_policy, video_url,
        event_date, event_location, availability_notes, testimonials
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12, $13,
        $14, $15, $16, $17, $18,
        $19, $20, $21, $22,
        $23, $24, $25, $26,
        $27, $28, $29, $30
      ) RETURNING *`,
      [
        req.user.userId,
        name,
        description || '',
        price,
        imageUrl || '',
        stockQuantity || 1000,
        isActive !== false,
        templateType || 'quick-decision',
        JSON.stringify(storyMedia || []),
        storyTitle || 'See it in Action',
        JSON.stringify(additionalImages || []),
        JSON.stringify(galleryImages || []),
        JSON.stringify(servicePackages || []),
        JSON.stringify(dietaryTags || []),
        prepTime || null,
        calories || null,
        ingredients || null,
        JSON.stringify(specifications || {}),
        JSON.stringify(trustBadges || []),
        warranty || null,
        returnPolicy ? parseInt(returnPolicy) : null,
        richDescription || null,
        privacyPolicy || '',
        termsOfService || '',
        refundPolicy || '',
        videoUrl || null,
        eventDate || null,
        eventLocation || null,
        availability || null,
        JSON.stringify(testimonials || [])
      ]
    );
    
    res.json({ success: true, product: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// UPDATE PRODUCT - ALL FIELDS (with safe type handling)
app.put('/api/products/:id', auth, async (req, res) => {
  try {
    const body = req.body;
    
    // Helper to safely stringify JSON
    const safeJson = (val) => {
      if (val === null || val === undefined) return null;
      if (typeof val === 'string') {
        // Already a string - check if valid JSON or return as array
        try { JSON.parse(val); return val; } catch (e) { return JSON.stringify([val]); }
      }
      return JSON.stringify(val);
    };
    
    // Helper to safely parse int
    const safeInt = (val) => {
      if (val === null || val === undefined || val === '') return null;
      const parsed = parseInt(val, 10);
      return Number.isNaN(parsed) ? null : parsed;
    };
    
    // Extract with BOTH camelCase and snake_case fallbacks (dashboard sends mixed!)
    const name = body.name;
    const description = body.description;
    const price = body.price;
    const imageUrl = body.imageUrl || body.image_url;
    const stockQuantity = safeInt(body.stockQuantity || body.stock_quantity);
    const isActive = body.isActive !== undefined ? body.isActive : body.is_active;
    const templateType = body.templateType || body.template_type;
    const storyMedia = body.storyMedia || body.story_media;
    const storyTitle = body.storyTitle || body.story_title;
    const additionalImages = body.additionalImages || body.additional_images;
    const galleryImages = body.galleryImages || body.gallery_images; // GALLERY 1-6
    const servicePackages = body.servicePackages || body.service_packages;
    const dietaryTags = body.dietaryTags || body.dietary_tags;
    const prepTime = body.prepTime || body.prep_time || null;
    const calories = body.calories || null;
    const ingredients = body.ingredients || null;
    const specifications = body.specifications;
    const trustBadges = body.trustBadges || body.trust_badges;
    const warranty = body.warranty || body.warranty_info || null;
    const returnPolicy = safeInt(body.returnPolicy || body.return_policy_days);
    const richDescription = body.richDescription || body.rich_description || null;
    const privacyPolicy = body.privacyPolicy || body.privacy_policy;
    const termsOfService = body.termsOfService || body.terms_of_service;
    const refundPolicy = body.refundPolicy || body.refund_policy;
    const videoUrl = body.videoUrl || body.video_url || null;
    const eventDate = body.eventDate || body.event_date || null;
    const eventLocation = body.eventLocation || body.event_location || null;
    const availability = body.availability || body.availability_notes || null;
    const testimonials = body.testimonials || null;
    
    const result = await pool.query(
      `UPDATE products SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        price = COALESCE($3, price),
        image_url = COALESCE($4, image_url),
        stock_quantity = COALESCE($5, stock_quantity),
        is_active = COALESCE($6, is_active),
        template_type = COALESCE($7, template_type),
        story_media = COALESCE($8, story_media),
        story_title = COALESCE($9, story_title),
        additional_images = COALESCE($10, additional_images),
        service_packages = COALESCE($11, service_packages),
        dietary_tags = COALESCE($12, dietary_tags),
        prep_time = COALESCE($13, prep_time),
        calories = COALESCE($14, calories),
        ingredients = COALESCE($15, ingredients),
        specifications = COALESCE($16, specifications),
        trust_badges = COALESCE($17, trust_badges),
        warranty_info = COALESCE($18, warranty_info),
        return_policy_days = COALESCE($19, return_policy_days),
        rich_description = COALESCE($20, rich_description),
        privacy_policy = COALESCE($21, privacy_policy),
        terms_of_service = COALESCE($22, terms_of_service),
        refund_policy = COALESCE($23, refund_policy),
        video_url = COALESCE($24, video_url),
        event_date = COALESCE($25, event_date),
        event_location = COALESCE($26, event_location),
        availability_notes = COALESCE($27, availability_notes),
        gallery_images = COALESCE($28, gallery_images),
        testimonials = COALESCE($29, testimonials),
        updated_at = NOW()
      WHERE id = $30 AND user_id = $31
      RETURNING *`,
      [
        name || null,
        description || null,
        price || null,
        imageUrl || null,
        stockQuantity,
        isActive,
        templateType || null,
        safeJson(storyMedia),
        storyTitle || null,
        safeJson(additionalImages),
        safeJson(servicePackages),
        safeJson(dietaryTags),
        prepTime,
        calories,
        ingredients,
        safeJson(specifications),
        safeJson(trustBadges),
        warranty,
        returnPolicy,
        richDescription,
        privacyPolicy || null,
        termsOfService || null,
        refundPolicy || null,
        videoUrl,
        eventDate,
        eventLocation,
        availability,
        safeJson(galleryImages),
        safeJson(testimonials),
        req.params.id,
        req.user.userId
      ]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    
    res.json({ success: true, product: result.rows[0] });
  } catch (err) {
    console.error('❌ Update product error:', err.message);
    console.error('❌ Stack:', err.stack);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/products/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM products WHERE id = $1 AND user_id = $2', [req.params.id, req.user.userId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============ ORDERS ============
app.get('/api/orders', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.*, p.name as product_name, p.image_url as product_image FROM orders o 
       LEFT JOIN products p ON o.product_id = p.id 
       WHERE o.user_id = $1 ORDER BY o.created_at DESC`,
      [req.user.userId]
    );
    res.json({ success: true, orders: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const { subdomain, productId, product, quantity, price, total, customer, paymentMethod } = req.body;
    
    let userId = null;
    if (subdomain) {
      const storeResult = await pool.query('SELECT user_id FROM store_settings WHERE subdomain = $1', [subdomain]);
      if (storeResult.rows.length > 0) {
        userId = storeResult.rows[0].user_id;
      }
    }
    
    if (!userId) {
      return res.status(400).json({ success: false, error: 'Store not found' });
    }
    
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    
    const result = await pool.query(
      `INSERT INTO orders (user_id, product_id, order_number, customer_name, customer_phone, customer_location, quantity, unit_price, total_amount, payment_method, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending') RETURNING *`,
      [userId, productId, orderNumber, customer.name, customer.phone, customer.location, quantity, price, total, paymentMethod]
    );
    
    res.json({ success: true, orderNumber, order: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/orders/:id', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const result = await pool.query(
      'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING *',
      [status, req.params.id, req.user.userId]
    );
    res.json({ success: true, order: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============ SETTINGS ============
app.get('/api/settings', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM store_settings WHERE user_id = $1', [req.user.userId]);
    res.json({ success: true, settings: result.rows[0] || {} });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/settings', auth, async (req, res) => {
  try {
    const b = req.body;
    
    // Build dynamic update query
    const updates = [];
    const values = [];
    let idx = 1;
    
    // Basic settings
    if (b.logo_text !== undefined) { updates.push(`logo_text = $${idx++}`); values.push(b.logo_text); }
    if (b.logo_url !== undefined) { updates.push(`logo_url = $${idx++}`); values.push(b.logo_url); }
    if (b.tagline !== undefined) { updates.push(`tagline = $${idx++}`); values.push(b.tagline); }
    if (b.theme_color !== undefined) { updates.push(`theme_color = $${idx++}`); values.push(b.theme_color); }
    if (b.font_family !== undefined) { updates.push(`font_family = $${idx++}`); values.push(b.font_family); }
    if (b.header_bg_url !== undefined) { updates.push(`header_bg_url = $${idx++}`); values.push(b.header_bg_url); }
    
    // Hero settings
    if (b.hero_bg_type !== undefined) { updates.push(`hero_bg_type = $${idx++}`); values.push(b.hero_bg_type); }
    if (b.hero_bg_image !== undefined) { updates.push(`hero_bg_image = $${idx++}`); values.push(b.hero_bg_image); }
    if (b.hero_bg_gradient !== undefined) { updates.push(`hero_bg_gradient = $${idx++}`); values.push(b.hero_bg_gradient); }
    if (b.hero_photo_url !== undefined) { updates.push(`hero_photo_url = $${idx++}`); values.push(b.hero_photo_url); }
    if (b.hero_title !== undefined) { updates.push(`hero_title = $${idx++}`); values.push(b.hero_title); }
    if (b.hero_subtitle !== undefined) { updates.push(`hero_subtitle = $${idx++}`); values.push(b.hero_subtitle); }
    if (b.hero_cta_primary_text !== undefined) { updates.push(`hero_cta_primary_text = $${idx++}`); values.push(b.hero_cta_primary_text); }
    if (b.hero_cta_primary_link !== undefined) { updates.push(`hero_cta_primary_link = $${idx++}`); values.push(b.hero_cta_primary_link); }
    if (b.hero_cta_secondary_text !== undefined) { updates.push(`hero_cta_secondary_text = $${idx++}`); values.push(b.hero_cta_secondary_text); }
    if (b.hero_cta_secondary_link !== undefined) { updates.push(`hero_cta_secondary_link = $${idx++}`); values.push(b.hero_cta_secondary_link); }
    
    // Store mode (dark/light)
    if (b.store_mode !== undefined) { updates.push(`store_mode = $${idx++}`); values.push(b.store_mode); }
    
    // Testimonial settings
    if (b.show_featured_testimonial !== undefined) { updates.push(`show_featured_testimonial = $${idx++}`); values.push(b.show_featured_testimonial); }
    if (b.featured_testimonial_text !== undefined) { updates.push(`featured_testimonial_text = $${idx++}`); values.push(b.featured_testimonial_text); }
    if (b.featured_testimonial_author !== undefined) { updates.push(`featured_testimonial_author = $${idx++}`); values.push(b.featured_testimonial_author); }
    if (b.featured_testimonial_detail !== undefined) { updates.push(`featured_testimonial_detail = $${idx++}`); values.push(b.featured_testimonial_detail); }
    
    // Footer settings
    if (b.footer_powered_by !== undefined) { updates.push(`footer_powered_by = $${idx++}`); values.push(b.footer_powered_by); }
    if (b.footer_privacy_url !== undefined) { updates.push(`footer_privacy_url = $${idx++}`); values.push(b.footer_privacy_url); }
    if (b.footer_terms_url !== undefined) { updates.push(`footer_terms_url = $${idx++}`); values.push(b.footer_terms_url); }
    if (b.footer_refund_url !== undefined) { updates.push(`footer_refund_url = $${idx++}`); values.push(b.footer_refund_url); }
    
    // Policy content
    if (b.privacy_policy !== undefined) { updates.push(`privacy_policy = $${idx++}`); values.push(b.privacy_policy); }
    if (b.terms_of_service !== undefined) { updates.push(`terms_of_service = $${idx++}`); values.push(b.terms_of_service); }
    if (b.refund_policy !== undefined) { updates.push(`refund_policy = $${idx++}`); values.push(b.refund_policy); }
    
    // Collection testimonials (JSONB)
    if (b.show_testimonials !== undefined) { updates.push(`show_testimonials = $${idx++}`); values.push(b.show_testimonials); }
    if (b.collection_testimonials !== undefined) { 
      updates.push(`collection_testimonials = $${idx++}`); 
      // Handle both array and string input
      const testimonials = Array.isArray(b.collection_testimonials) 
        ? b.collection_testimonials 
        : (typeof b.collection_testimonials === 'string' ? JSON.parse(b.collection_testimonials) : []);
      values.push(JSON.stringify(testimonials)); 
    }
    
    if (updates.length === 0) {
      return res.json({ success: true, settings: {} });
    }
    
    values.push(req.user.userId);
    const query = `UPDATE store_settings SET ${updates.join(', ')} WHERE user_id = $${idx} RETURNING *`;
    
    const result = await pool.query(query, values);
    res.json({ success: true, settings: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/settings/themes', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM themes ORDER BY is_premium, name');
    res.json({ success: true, themes: result.rows });
  } catch (err) {
    res.json({ 
      success: true, 
      themes: [
        { id: 1, name: 'warm-sunset', display_name: 'Warm Sunset', gradient: 'linear-gradient(135deg, #ff9f0a 0%, #ff375f 100%)', primary_color: '#ff9f0a', is_premium: false },
        { id: 2, name: 'cool-ocean', display_name: 'Cool Ocean', gradient: 'linear-gradient(135deg, #0a84ff 0%, #00d4ff 100%)', primary_color: '#0a84ff', is_premium: false },
        { id: 3, name: 'royal-purple', display_name: 'Royal Purple', gradient: 'linear-gradient(135deg, #667eea 0%, #bf5af2 100%)', primary_color: '#bf5af2', is_premium: false },
        { id: 4, name: 'fresh-mint', display_name: 'Fresh Mint', gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', primary_color: '#11998e', is_premium: false },
        { id: 5, name: 'midnight-dark', display_name: 'Midnight Dark', gradient: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)', primary_color: '#34495e', is_premium: false },
        { id: 6, name: 'rose-gold', display_name: 'Rose Gold', gradient: 'linear-gradient(135deg, #ed6ea0 0%, #ec8c69 100%)', primary_color: '#ed6ea0', is_premium: true },
        { id: 7, name: 'cosmic-purple', display_name: 'Cosmic Purple', gradient: 'linear-gradient(135deg, #4158D0 0%, #C850C0 100%)', primary_color: '#C850C0', is_premium: true }
      ]
    });
  }
});

app.get('/api/settings/add-ons', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*, CASE WHEN ua.id IS NOT NULL THEN true ELSE false END as "isActive"
      FROM add_ons a LEFT JOIN user_add_ons ua ON a.id = ua.add_on_id AND ua.user_id = $1
      WHERE a.is_active = true ORDER BY a.price
    `, [req.user.userId]);
    res.json({ success: true, addOns: result.rows });
  } catch (err) {
    res.json({ success: true, addOns: [] });
  }
});

app.post('/api/settings/add-ons/:id/activate', auth, async (req, res) => {
  try {
    await pool.query(
      'INSERT INTO user_add_ons (user_id, add_on_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.user.userId, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============ PUBLIC STORE ============
app.get('/api/public/store/:subdomain', async (req, res) => {
  try {
    const { subdomain } = req.params;
    
    const storeResult = await pool.query('SELECT * FROM store_settings WHERE subdomain = $1', [subdomain]);
    
    if (storeResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Store not found' });
    }
    
    const store = storeResult.rows[0];
    
    const productsResult = await pool.query(
      `SELECT * FROM products WHERE user_id = $1 AND is_active = true ORDER BY created_at DESC`,
      [store.user_id]
    );
    
    let theme = null;
    if (store.theme_color) {
      try {
        const themeResult = await pool.query('SELECT * FROM themes WHERE name = $1', [store.theme_color]);
        if (themeResult.rows.length > 0) {
          theme = themeResult.rows[0];
        }
      } catch (e) { }
    }
    
    if (!theme) {
      theme = {
        name: 'warm-sunset',
        display_name: 'Warm Sunset',
        gradient: 'linear-gradient(135deg, #ff9f0a 0%, #ff375f 100%)',
        primary_color: '#ff9f0a'
      };
    }
    
    // Build hero configuration
    const hero = {
      bgType: store.hero_bg_type || 'gradient',
      bgImage: store.hero_bg_image || '',
      bgGradient: store.hero_bg_gradient || 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
      photoUrl: store.hero_photo_url || '',
      title: store.hero_title || store.logo_text || 'Welcome',
      subtitle: store.hero_subtitle || store.tagline || '',
      ctaPrimaryText: store.hero_cta_primary_text || 'Shop Now',
      ctaPrimaryLink: store.hero_cta_primary_link || '',
      ctaSecondaryText: store.hero_cta_secondary_text || 'Learn More',
      ctaSecondaryLink: store.hero_cta_secondary_link || ''
    };
    
    // Build testimonial if enabled
    const testimonial = store.show_featured_testimonial ? {
      text: store.featured_testimonial_text || '',
      author: store.featured_testimonial_author || '',
      detail: store.featured_testimonial_detail || ''
    } : null;
    
    // Build footer config
    const footer = {
      poweredBy: store.footer_powered_by !== false,
      privacyUrl: store.footer_privacy_url || '',
      termsUrl: store.footer_terms_url || '',
      refundUrl: store.footer_refund_url || ''
    };
    
    res.json({
      success: true,
      store: { 
        subdomain: store.subdomain, 
        logoText: store.logo_text, 
        logoImageUrl: store.logo_url || '',
        tagline: store.tagline,
        fontFamily: store.font_family,
        headerBgUrl: store.header_bg_url || '',
        theme: theme,
        mode: store.store_mode || 'dark',
        // Store-level policies
        privacy_policy: store.privacy_policy || '',
        terms_of_service: store.terms_of_service || '',
        refund_policy: store.refund_policy || '',
        // Collection testimonials
        showTestimonials: store.show_testimonials !== false,
        collectionTestimonials: store.collection_testimonials || []
      },
      hero: hero,
      testimonial: testimonial,
      footer: footer,
      products: productsResult.rows,
      theme: theme
    });
  } catch (err) {
    console.error('❌ Store load error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============ TEMPLATES ============
app.get('/api/templates', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM template_definitions WHERE is_active = true ORDER BY display_order');
    res.json({ success: true, templates: result.rows });
  } catch (err) {
    res.json({
      success: true,
      templates: [
        { slug: 'quick-decision', name: 'Quick Decision', price: 250, best_for: 'Fashion, beauty' },
        { slug: 'portfolio-booking', name: 'Portfolio + Booking', price: 500, best_for: 'Photographers' },
        { slug: 'visual-menu', name: 'Visual Menu', price: 600, best_for: 'Restaurants' },
        { slug: 'event-landing', name: 'Event Landing', price: 700, best_for: 'Events' },
        { slug: 'deep-dive', name: 'Deep Dive', price: 800, best_for: 'Electronics' },
        { slug: 'catalog-nav', name: 'Catalog Navigator', price: 400, best_for: 'Multi-product' }
      ]
    });
  }
});

// ============ BLOCK SYSTEM MIGRATION (runs on startup) ============
async function migrateBlockSystem() {
  try {
    // Products table - block system columns
    const productColumns = [
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS blocks JSONB DEFAULT '[]'`,
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'`,
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS checkout_type VARCHAR(20) DEFAULT 'buy_now'`,
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS price_note VARCHAR(100)`,
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS customization_options JSONB DEFAULT '[]'`,
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS booking_config JSONB DEFAULT '{}'`,
      // Gallery images for portfolio-booking and other templates
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS gallery_images JSONB DEFAULT '[]'`
    ];
    
    for (const sql of productColumns) {
      try { await pool.query(sql); } catch (e) { /* column exists */ }
    }
    
    // Orders table - booking/customization columns
    const orderColumns = [
      `ALTER TABLE orders ADD COLUMN IF NOT EXISTS customizations JSONB DEFAULT '{}'`,
      `ALTER TABLE orders ADD COLUMN IF NOT EXISTS booking_date DATE`,
      `ALTER TABLE orders ADD COLUMN IF NOT EXISTS booking_time TIME`
    ];
    
    for (const sql of orderColumns) {
      try { await pool.query(sql); } catch (e) { /* column exists */ }
    }
    
    // Migrate existing image_url to images array (only if images is empty)
    await pool.query(`
      UPDATE products 
      SET images = jsonb_build_array(jsonb_build_object('url', image_url, 'alt', name))
      WHERE image_url IS NOT NULL 
        AND image_url != '' 
        AND (images IS NULL OR images = '[]'::jsonb)
    `);
  } catch (err) {
    // Silent migration - columns already exist
  }
}

// ============ PHASE 2: COLLECTION PAGE MIGRATION ============
async function migratePhase2Collection() {
  try {
    // Hero customization columns for store_settings
    const heroColumns = [
      `ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500)`,
      `ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS header_bg_url VARCHAR(500)`,
      `ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS hero_bg_type VARCHAR(20) DEFAULT 'gradient'`,
      `ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS hero_bg_image VARCHAR(500)`,
      `ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS hero_bg_gradient VARCHAR(255) DEFAULT 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'`,
      `ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS hero_photo_url VARCHAR(500)`,
      `ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS hero_title VARCHAR(255)`,
      `ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS hero_subtitle TEXT`,
      `ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS hero_cta_primary_text VARCHAR(100) DEFAULT 'Shop Now'`,
      `ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS hero_cta_primary_link VARCHAR(255)`,
      `ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS hero_cta_secondary_text VARCHAR(100) DEFAULT 'Learn More'`,
      `ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS hero_cta_secondary_link VARCHAR(255)`,
      `ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS store_mode VARCHAR(10) DEFAULT 'dark'`,
      `ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS show_featured_testimonial BOOLEAN DEFAULT false`,
      `ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS featured_testimonial_text TEXT`,
      `ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS featured_testimonial_author VARCHAR(100)`,
      `ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS featured_testimonial_detail VARCHAR(100)`,
      `ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS show_testimonials BOOLEAN DEFAULT true`,
      `ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS collection_testimonials JSONB DEFAULT '[]'`,
      `ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS footer_powered_by BOOLEAN DEFAULT true`,
      `ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS footer_privacy_url VARCHAR(255)`,
      `ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS footer_terms_url VARCHAR(255)`,
      `ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS footer_refund_url VARCHAR(255)`,
      `ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS privacy_policy TEXT DEFAULT ''`,
      `ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS terms_of_service TEXT DEFAULT ''`,
      `ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS refund_policy TEXT DEFAULT ''`,
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS testimonials JSONB DEFAULT '[]'`
    ];
    
    for (const sql of heroColumns) {
      try { await pool.query(sql); } catch (e) { /* column exists */ }
    }
    
    // Set default hero values for existing stores
    await pool.query(`
      UPDATE store_settings 
      SET 
        hero_title = COALESCE(hero_title, logo_text),
        hero_subtitle = COALESCE(hero_subtitle, tagline)
      WHERE hero_title IS NULL OR hero_title = ''
    `);
  } catch (err) {
    // Silent migration - columns already exist
  }
}

// ============ START ============
async function startServer() {
  try {
    // 1. Test database connection first
    console.log('🔌 Connecting to database...');
    await pool.query('SELECT 1');
    console.log('✅ Database connected!');
    
    // 2. Run ALL migrations BEFORE accepting requests
    console.log('🔧 Running database migrations...');
    await migrateBlockSystem();
    await migratePhase2Collection();
    console.log('✅ All migrations complete!');
    
    // 3. NOW start accepting requests (only after DB is ready)
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Jari.Ecom API v4 ready on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
    });
    
  } catch (err) {
    console.error('❌ FATAL: Server failed to start:', err.message);
    process.exit(1); // Exit with error code so Railway knows to restart
  }
}

// Start the server
startServer();
