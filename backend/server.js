require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.use(cors());
app.use(express.json());

// ============ HEALTH CHECK ============
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Jari.Ecom API v2', time: new Date().toISOString() });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

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

    // Add template columns to products
    await pool.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS template_type VARCHAR(50) DEFAULT 'quick-decision'
    `);

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

    const result = await pool.query('SELECT * FROM template_definitions ORDER BY display_order');
    res.json({ success: true, message: 'Setup complete!', templates: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ AUTH ROUTES ============
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'jari-secret-key-2026';

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
    res.json({ success: true, token, user: { id: user.id, email: user.email, business_name: user.business_name } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Auth middleware
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
    const { name, description, price, imageUrl, stockQuantity, isActive } = req.body;
    const result = await pool.query(
      `INSERT INTO products (user_id, name, description, price, image_url, stock_quantity, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.user.userId, name, description, price, imageUrl, stockQuantity || 1000, isActive !== false]
    );
    res.json({ success: true, product: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/products/:id', auth, async (req, res) => {
  try {
    const { name, description, price, imageUrl, stockQuantity, isActive } = req.body;
    const result = await pool.query(
      `UPDATE products SET name=$1, description=$2, price=$3, image_url=$4, stock_quantity=$5, is_active=$6
       WHERE id=$7 AND user_id=$8 RETURNING *`,
      [name, description, price, imageUrl, stockQuantity, isActive, req.params.id, req.user.userId]
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
      `SELECT o.*, p.name as product_name FROM orders o 
       LEFT JOIN products p ON o.product_id = p.id 
       WHERE o.user_id = $1 ORDER BY o.created_at DESC`,
      [req.user.userId]
    );
    res.json({ success: true, orders: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/orders/:id', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const result = await pool.query(
      'UPDATE orders SET status = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
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
    const { logo_text, tagline, theme_color, font_family } = req.body;
    const result = await pool.query(
      `UPDATE store_settings SET logo_text = COALESCE($1, logo_text), tagline = COALESCE($2, tagline),
       theme_color = COALESCE($3, theme_color), font_family = COALESCE($4, font_family)
       WHERE user_id = $5 RETURNING *`,
      [logo_text, tagline, theme_color, font_family, req.user.userId]
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
    res.status(500).json({ success: false, error: err.message });
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
      'SELECT * FROM products WHERE user_id = $1 AND is_active = true ORDER BY created_at DESC',
      [store.user_id]
    );
    
    const themeResult = await pool.query('SELECT * FROM themes WHERE name = $1', [store.theme_color || 'warm-sunset']);
    
    res.json({
      success: true,
      store: { subdomain: store.subdomain, logoText: store.logo_text, tagline: store.tagline },
      products: productsResult.rows,
      theme: themeResult.rows[0] || null
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============ TEMPLATES ============
app.get('/api/templates', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM template_definitions WHERE is_active = true ORDER BY display_order');
    res.json({ success: true, templates: result.rows });
  } catch (err) {
    // Return hardcoded if table doesn't exist
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
  console.log(`🚀 Jari.Ecom API running on port ${PORT}`);
});
