// ADD THIS TO YOUR backend/routes/ folder as init.js
// Then add to server.js: app.use('/api/init', require('./routes/init'));
// After tables are created, REMOVE this file for security!

const express = require('express');
const pool = require('../config/database');

const router = express.Router();

// GET /api/init - Creates all tables
router.get('/', async (req, res) => {
  try {
    console.log('🔧 Initializing database schema...');

    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        business_name VARCHAR(255),
        instagram_handle VARCHAR(100),
        phone VARCHAR(20),
        affiliate_code VARCHAR(50),
        subscription_tier VARCHAR(50) DEFAULT 'tier2',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Users table created');

    // Create products table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        image_url VARCHAR(500),
        stock_quantity INTEGER DEFAULT 1000,
        is_active BOOLEAN DEFAULT true,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Products table created');

    // Create orders table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        product_id INTEGER REFERENCES products(id),
        order_number VARCHAR(50) UNIQUE NOT NULL,
        customer_name VARCHAR(255),
        customer_phone VARCHAR(20),
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
    console.log('✅ Orders table created');

    // Create store_settings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS store_settings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        logo_text VARCHAR(100),
        tagline VARCHAR(255),
        subdomain VARCHAR(100) UNIQUE,
        theme_color VARCHAR(50) DEFAULT 'warm-sunset',
        font_family VARCHAR(100) DEFAULT 'Inter',
        mpesa_number VARCHAR(20),
        custom_domain VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Store settings table created');

    // Create themes table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS themes (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        display_name VARCHAR(100),
        gradient VARCHAR(255),
        primary_color VARCHAR(50),
        heading_font VARCHAR(100),
        body_font VARCHAR(100),
        animation_style VARCHAR(50),
        is_premium BOOLEAN DEFAULT false,
        preview_image VARCHAR(500)
      )
    `);
    console.log('✅ Themes table created');

    // Insert default themes
    await pool.query(`
      INSERT INTO themes (name, display_name, gradient, primary_color, heading_font, body_font, animation_style, is_premium) 
      VALUES 
        ('warm-sunset', 'Warm Sunset', 'linear-gradient(135deg, #ff9f0a 0%, #ff375f 100%)', '#ff9f0a', 'Inter', 'Inter', 'smooth', false),
        ('cool-ocean', 'Cool Ocean', 'linear-gradient(135deg, #0a84ff 0%, #00d4ff 100%)', '#0a84ff', 'Inter', 'Inter', 'smooth', false),
        ('royal-purple', 'Royal Purple', 'linear-gradient(135deg, #667eea 0%, #bf5af2 100%)', '#bf5af2', 'Inter', 'Inter', 'smooth', false),
        ('fresh-mint', 'Fresh Mint', 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', '#11998e', 'Inter', 'Inter', 'smooth', false),
        ('midnight-dark', 'Midnight Dark', 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)', '#34495e', 'Inter', 'Inter', 'smooth', false),
        ('rose-gold', 'Rose Gold', 'linear-gradient(135deg, #ed6ea0 0%, #ec8c69 100%)', '#ed6ea0', 'Playfair Display', 'Inter', 'elegant', true),
        ('cosmic-purple', 'Cosmic Purple', 'linear-gradient(135deg, #4158D0 0%, #C850C0 100%)', '#C850C0', 'Space Grotesk', 'Inter', 'dynamic', true)
      ON CONFLICT (name) DO NOTHING
    `);
    console.log('✅ Default themes inserted');

    // Create add_ons table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS add_ons (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        display_name VARCHAR(100),
        description TEXT,
        price DECIMAL(10,2),
        is_active BOOLEAN DEFAULT true
      )
    `);
    console.log('✅ Add-ons table created');

    // Insert default add-ons
    await pool.query(`
      INSERT INTO add_ons (name, display_name, description, price) 
      VALUES 
        ('homepage', 'Central Hub Page', 'Create a central homepage linking to all your collections', 800),
        ('mpesa-stk', 'Instant Payment Prompt', 'Automatic M-Pesa payment prompts', 200),
        ('whatsapp-ai', 'Smart Customer Support', 'AI-powered WhatsApp bot for customer queries', 500),
        ('sms-notifications', 'Order Updates via SMS', 'Send order confirmations via SMS', 150)
      ON CONFLICT (name) DO NOTHING
    `);
    console.log('✅ Default add-ons inserted');

    // Create user_add_ons junction table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_add_ons (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        add_on_id INTEGER REFERENCES add_ons(id) ON DELETE CASCADE,
        activated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, add_on_id)
      )
    `);
    console.log('✅ User add-ons table created');

    res.json({
      success: true,
      message: '🎉 Database initialized successfully!',
      tables: ['users', 'products', 'orders', 'store_settings', 'themes', 'add_ons', 'user_add_ons']
    });

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      hint: 'Check DATABASE_URL environment variable'
    });
  }
});

// GET /api/init/status - Check what tables exist
router.get('/status', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    res.json({
      success: true,
      tables: result.rows.map(r => r.table_name),
      count: result.rows.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;
