require('dotenv').config();
const pool = require('./database');

async function expandDatabase() {
  try {
    console.log('🔧 Expanding database schema...');

    // Add theme columns to store_settings
    await pool.query(`
      ALTER TABLE store_settings 
      ADD COLUMN IF NOT EXISTS font_family VARCHAR(100) DEFAULT 'Inter',
      ADD COLUMN IF NOT EXISTS primary_color VARCHAR(50) DEFAULT 'mint-purple',
      ADD COLUMN IF NOT EXISTS gradient_style VARCHAR(100) DEFAULT 'warm',
      ADD COLUMN IF NOT EXISTS animation_style VARCHAR(50) DEFAULT 'smooth'
    `);
    console.log('✅ Store settings expanded');

    // Create pages table for multi-page support
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pages (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        page_type VARCHAR(50) NOT NULL,
        title VARCHAR(255),
        slug VARCHAR(255),
        content JSONB,
        display_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, slug)
      )
    `);
    console.log('✅ Pages table created');

    // Create themes table (pre-defined themes)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS themes (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        display_name VARCHAR(100),
        gradient VARCHAR(255),
        primary_color VARCHAR(50),
        font_family VARCHAR(100),
        animation_style VARCHAR(50),
        is_premium BOOLEAN DEFAULT false,
        preview_image VARCHAR(500)
      )
    `);
    console.log('✅ Themes table created');

    // Insert default themes
    await pool.query(`
      INSERT INTO themes (name, display_name, gradient, primary_color, font_family, animation_style, is_premium) 
      VALUES 
        ('warm-sunset', 'Warm Sunset', 'linear-gradient(135deg, #ff9f0a 0%, #ff375f 100%)', '#ff9f0a', 'Inter', 'smooth', false),
        ('cool-ocean', 'Cool Ocean', 'linear-gradient(135deg, #0a84ff 0%, #00d4ff 100%)', '#0a84ff', 'Inter', 'smooth', false),
        ('royal-purple', 'Royal Purple', 'linear-gradient(135deg, #667eea 0%, #bf5af2 100%)', '#bf5af2', 'Inter', 'smooth', false),
        ('fresh-mint', 'Fresh Mint', 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', '#11998e', 'Inter', 'smooth', false),
        ('midnight-dark', 'Midnight Dark', 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)', '#34495e', 'Inter', 'smooth', false),
        ('rose-gold', 'Rose Gold', 'linear-gradient(135deg, #ed6ea0 0%, #ec8c69 100%)', '#ed6ea0', 'Playfair Display', 'elegant', true),
        ('cosmic-purple', 'Cosmic Purple', 'linear-gradient(135deg, #4158D0 0%, #C850C0 100%)', '#C850C0', 'Space Grotesk', 'dynamic', true)
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
        ('homepage', 'Homepage/Central Hub', 'Create a central homepage linking to all your collections', 800),
        ('ad-management', 'Ad Management', 'Manage promotional banners and ads', 500),
        ('video-creator', 'Video Ad Creator', 'Create video ads from your products', 400),
        ('mpesa-stk', 'M-Pesa STK Push', 'Automatic M-Pesa payment prompts', 200),
        ('whatsapp-ai', 'WhatsApp AI Chatbot', 'Automated customer support', 500),
        ('sms-notifications', 'SMS Notifications', 'Send order confirmations via SMS', 150),
        ('email-marketing', 'Email Marketing', 'Send newsletters to customers', 250),
        ('instagram-shopping', 'Instagram Shopping', 'Tag products in IG posts', 400)
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

    console.log('🎉 Database expansion completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database expansion failed:', error);
    process.exit(1);
  }
}

expandDatabase();
