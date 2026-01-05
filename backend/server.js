require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS - Allow all for now
app.use(cors());
app.use(express.json());

// ===========================================
// SAFE ROUTE LOADING - Won't crash if a route has issues
// ===========================================
function safeRequire(path, name) {
  try {
    return require(path);
  } catch (error) {
    console.error(`❌ Failed to load route: ${name}`, error.message);
    // Return a dummy router that returns an error
    const router = express.Router();
    router.all('*', (req, res) => {
      res.status(500).json({ error: `Route ${name} failed to load: ${error.message}` });
    });
    return router;
  }
}

// Load routes safely
const authRoutes = safeRequire('./routes/auth', 'auth');
const productsRoutes = safeRequire('./routes/products', 'products');
const ordersRoutes = safeRequire('./routes/orders', 'orders');
const settingsRoutes = safeRequire('./routes/settings', 'settings');
const publicRoutes = safeRequire('./routes/public', 'public');
const templatesRoutes = safeRequire('./routes/templates', 'templates');
const initRoutes = safeRequire('./routes/init', 'init');

// Try to load verification, but don't fail if it doesn't work
let verificationRoutes;
try {
  verificationRoutes = require('./routes/verification');
} catch (e) {
  console.log('⚠️ Verification routes not loaded:', e.message);
  verificationRoutes = express.Router();
}

// Mount routes
app.use('/api/init', initRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/templates', templatesRoutes);
app.use('/api/verification', verificationRoutes);

// ===========================================
// HEALTH CHECK
// ===========================================
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Jari.Ecom API is running',
    timestamp: new Date().toISOString()
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'Jari.Ecom API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      init: '/api/init (creates all tables)',
      templates: '/api/templates',
      products: '/api/products',
      auth: '/api/auth'
    }
  });
});

// ===========================================
// QUICK DB MIGRATION ENDPOINT (backup)
// ===========================================
const pool = require('./config/database');

app.get('/api/setup-db', async (req, res) => {
  try {
    // Create template_definitions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS template_definitions (
        id SERIAL PRIMARY KEY,
        slug VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        best_for TEXT,
        features JSONB,
        is_active BOOLEAN DEFAULT true,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Insert templates
    await pool.query(`
      INSERT INTO template_definitions (slug, name, description, price, best_for, features, display_order)
      VALUES 
        ('quick-decision', 'Quick Decision', 'Single product impulse buy pages', 250, 'Fashion, accessories, beauty', '["Story circles", "Quick checkout", "Social proof"]'::jsonb, 1),
        ('portfolio-booking', 'Portfolio + Booking', 'Showcase work and get bookings', 500, 'Photographers, consultants, salons', '["Gallery", "Service packages", "Booking"]'::jsonb, 2),
        ('visual-menu', 'Visual Menu', 'Food ordering with photos', 600, 'Restaurants, cafes, food delivery', '["Photo menu", "Dietary tags", "Categories"]'::jsonb, 3),
        ('event-landing', 'Event Landing', 'Event ticket sales pages', 700, 'Events, workshops, concerts', '["Countdown", "Speaker bios", "RSVP"]'::jsonb, 4),
        ('deep-dive', 'Deep Dive', 'Detailed product pages for expensive items', 800, 'Electronics, furniture, jewelry', '["Specs table", "Trust badges", "Video", "Warranty"]'::jsonb, 5),
        ('catalog-nav', 'Catalog Navigator', 'Homepage for multi-product stores', 400, 'Stores with 4+ products', '["Categories", "Search", "Featured"]'::jsonb, 6)
      ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        price = EXCLUDED.price,
        best_for = EXCLUDED.best_for,
        features = EXCLUDED.features
    `);

    // Add template columns to products if missing
    await pool.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS template_type VARCHAR(50) DEFAULT 'quick-decision',
      ADD COLUMN IF NOT EXISTS gallery_images TEXT[],
      ADD COLUMN IF NOT EXISTS story_media JSONB,
      ADD COLUMN IF NOT EXISTS story_title VARCHAR(100),
      ADD COLUMN IF NOT EXISTS specifications JSONB,
      ADD COLUMN IF NOT EXISTS video_url VARCHAR(500),
      ADD COLUMN IF NOT EXISTS trust_badges JSONB,
      ADD COLUMN IF NOT EXISTS category VARCHAR(100)
    `);

    // Create homepages table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS homepages (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        hero_title VARCHAR(200),
        hero_subtitle TEXT,
        hero_image VARCHAR(500),
        categories JSONB,
        is_active BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Verify
    const templates = await pool.query('SELECT slug, name, price FROM template_definitions ORDER BY display_order');

    res.json({
      success: true,
      message: '🎉 Database setup complete!',
      templates: templates.rows
    });

  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ===========================================
// START SERVER
// ===========================================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Jari.Ecom API running on port ${PORT}`);
});
