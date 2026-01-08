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
  res.json({ status: 'ok', message: 'Jari.Ecom API v3', time: new Date().toISOString() });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
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

    // Add all product columns for templates
    await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS template_type VARCHAR(50) DEFAULT 'quick-decision'`);
    await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS story_media JSONB DEFAULT '[]'`);
    await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS story_title VARCHAR(200)`);
    await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS additional_images JSONB DEFAULT '[]'`);
    await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS service_packages JSONB DEFAULT '[]'`);
    await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS dietary_tags JSONB DEFAULT '[]'`);
    await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS prep_time VARCHAR(50)`);
    await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS calories VARCHAR(50)`);
    await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS ingredients TEXT`);
    await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS specifications JSONB DEFAULT '{}'`);
    await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS trust_badges JSONB DEFAULT '[]'`);
    await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS warranty_info TEXT`);
    await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS return_policy_days INTEGER`);
    await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS rich_description TEXT`);
    await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS privacy_policy TEXT`);
    await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS terms_of_service TEXT`);
    await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS refund_policy TEXT`);
    await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS availability_notes TEXT`);

    // Create homepages
    await pool.query(`
      CREATE TABLE IF NOT EXISTS homepages (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE,
        hero_title VARCHAR(200),
        hero_subtitle TEXT,
        categories JSONB,
        is_active BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

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
    res.json({ success: true, message: 'Setup complete!', templates: result.rows });
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

// ============ PRODUCTS ============
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

app.post('/api/products', auth, async (req, res) => {
  try {
    const { name, description, price, imageUrl, stockQuantity, isActive, templateType } = req.body;
    const result = await pool.query(
      `INSERT INTO products (user_id, name, description, price, image_url, stock_quantity, is_active, template_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [req.user.userId, name, description, price, imageUrl, stockQuantity || 1000, isActive !== false, templateType || 'quick-decision']
    );
    res.json({ success: true, product: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/products/:id', auth, async (req, res) => {
  try {
    const { 
      name, description, price, imageUrl, stockQuantity, isActive, templateType,
      storyMedia, storyTitle, additionalImages, servicePackages, dietaryTags,
      prepTime, calories, ingredients, specifications, trustBadges,
      warrantyInfo, returnPolicyDays, richDescription, privacyPolicy, 
      termsOfService, refundPolicy, availabilityNotes
    } = req.body;
    
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
        availability_notes = COALESCE($24, availability_notes)
       WHERE id = $25 AND user_id = $26 RETURNING *`,
      [name, description, price, imageUrl, stockQuantity, isActive, templateType,
       storyMedia ? JSON.stringify(storyMedia) : null, storyTitle, 
       additionalImages ? JSON.stringify(additionalImages) : null,
       servicePackages ? JSON.stringify(servicePackages) : null,
       dietaryTags ? JSON.stringify(dietaryTags) : null,
       prepTime, calories, ingredients,
       specifications ? JSON.stringify(specifications) : null,
       trustBadges ? JSON.stringify(trustBadges) : null,
       warrantyInfo, returnPolicyDays, richDescription, privacyPolicy,
       termsOfService, refundPolicy, availabilityNotes,
       req.params.id, req.user.userId]
    );
    res.json({ success: true, product: result.rows[0] });
  } catch (err) {
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

// PUBLIC ORDER CREATION - This was missing!
app.post('/api/orders', async (req, res) => {
  try {
    const { subdomain, productId, product, quantity, price, total, customer, paymentMethod } = req.body;
    
    console.log('📦 New order received:', { subdomain, productId, customer: customer?.name });
    
    // Get user_id from subdomain
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
    
    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    
    // Insert order
    const result = await pool.query(
      `INSERT INTO orders (user_id, product_id, order_number, customer_name, customer_phone, customer_location, quantity, unit_price, total_amount, payment_method, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending') RETURNING *`,
      [userId, productId, orderNumber, customer.name, customer.phone, customer.location, quantity, price, total, paymentMethod]
    );
    
    console.log('✅ Order created:', orderNumber);
    
    res.json({ success: true, orderNumber, order: result.rows[0] });
  } catch (err) {
    console.error('❌ Order creation failed:', err);
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
    const { logo_text, tagline, theme_color, font_family, theme_id } = req.body;
    const result = await pool.query(
      `UPDATE store_settings SET 
        logo_text = COALESCE($1, logo_text), 
        tagline = COALESCE($2, tagline),
        theme_color = COALESCE($3, theme_color), 
        font_family = COALESCE($4, font_family),
        theme_id = COALESCE($5, theme_id)
       WHERE user_id = $6 RETURNING *`,
      [logo_text, tagline, theme_color, font_family, theme_id, req.user.userId]
    );
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
    // Return hardcoded themes as fallback
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

// ============ PUBLIC STORE - FIXED! ============
app.get('/api/public/store/:subdomain', async (req, res) => {
  try {
    const { subdomain } = req.params;
    console.log('🏪 Loading store:', subdomain);
    
    const storeResult = await pool.query('SELECT * FROM store_settings WHERE subdomain = $1', [subdomain]);
    
    if (storeResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Store not found' });
    }
    
    const store = storeResult.rows[0];
    
    // Get products - use SELECT * to avoid column existence issues
    const productsResult = await pool.query(
      `SELECT * FROM products WHERE user_id = $1 AND is_active = true ORDER BY created_at DESC`,
      [store.user_id]
    );
    
    // Get theme by name (theme_color stores the theme name)
    let theme = null;
    if (store.theme_color) {
      try {
        const themeResult = await pool.query('SELECT * FROM themes WHERE name = $1', [store.theme_color]);
        if (themeResult.rows.length > 0) {
          theme = themeResult.rows[0];
        }
      } catch (e) {
        console.log('Theme query failed, using default');
      }
    }
    
    // Fallback theme if none found
    if (!theme) {
      theme = {
        name: 'warm-sunset',
        display_name: 'Warm Sunset',
        gradient: 'linear-gradient(135deg, #ff9f0a 0%, #ff375f 100%)',
        primary_color: '#ff9f0a'
      };
    }
    
    console.log('✅ Store loaded:', store.logo_text, '| Products:', productsResult.rows.length, '| Theme:', theme.name);
    
    res.json({
      success: true,
      store: { 
        subdomain: store.subdomain, 
        logoText: store.logo_text, 
        tagline: store.tagline,
        fontFamily: store.font_family,
        theme: theme
      },
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

// ============ START ============
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Jari.Ecom API v3 running on port ${PORT}`);
});
