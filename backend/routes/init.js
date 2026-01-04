// Database initialization routes
// After tables are created, consider removing for security

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
        email_verified BOOLEAN DEFAULT false,
        onboarding_completed BOOLEAN DEFAULT false,
        selected_industry VARCHAR(100),
        biggest_challenge VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Users table created');

    // Create products table with template fields
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
        template_type VARCHAR(50) DEFAULT 'quick-decision',
        gallery_images TEXT[],
        rich_description TEXT,
        specifications JSONB,
        video_url VARCHAR(500),
        story_title VARCHAR(100),
        story_media JSONB,
        additional_images TEXT[],
        privacy_policy TEXT,
        terms_of_service TEXT,
        refund_policy TEXT,
        service_packages JSONB,
        availability_notes TEXT,
        dietary_tags TEXT[],
        prep_time VARCHAR(50),
        calories INTEGER,
        ingredients TEXT,
        trust_badges JSONB,
        warranty_info TEXT,
        return_policy_days INTEGER DEFAULT 30,
        category VARCHAR(100),
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
        logo_url VARCHAR(500),
        header_bg_url VARCHAR(500),
        header_bg_type VARCHAR(20) DEFAULT 'gradient',
        light_mode_enabled BOOLEAN DEFAULT false,
        brand_color_primary VARCHAR(20),
        brand_color_secondary VARCHAR(20),
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
        preview_image VARCHAR(500),
        light_gradient VARCHAR(255),
        light_primary_color VARCHAR(50),
        light_text_color VARCHAR(50) DEFAULT '#1a1a1a',
        light_bg_color VARCHAR(50) DEFAULT '#f5f5f7'
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

    // Create template_definitions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS template_definitions (
        id SERIAL PRIMARY KEY,
        slug VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        job_statement TEXT,
        industries TEXT[],
        key_outcomes TEXT[],
        features JSONB,
        best_for TEXT,
        is_active BOOLEAN DEFAULT true,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Template definitions table created');

    // Insert template definitions
    await pool.query(`
      INSERT INTO template_definitions (slug, name, description, price, job_statement, industries, key_outcomes, best_for, display_order)
      VALUES 
        (
          'quick-decision',
          'Quick Decision Single',
          'Help me convert scrolling followers into paying customers with minimal friction',
          250,
          'Help me decide if I want this ONE thing, fast',
          ARRAY['Instagram drop shippers', 'Fashion resellers', 'Viral product drops', 'Single-SKU businesses'],
          ARRAY['Minimize time from scroll to sold', 'Minimize checkout steps', 'Minimize distractions'],
          'Instagram sellers, drop shippers, single products',
          1
        ),
        (
          'portfolio-booking',
          'Portfolio + Booking',
          'Help me demonstrate my expertise and get qualified client inquiries',
          500,
          'Show my work and get bookings',
          ARRAY['Photographers', 'Coaches', 'Consultants', 'Event planners', 'Hair/beauty salons'],
          ARRAY['Minimize skepticism about service quality', 'Increase perception of professionalism', 'Minimize friction in booking'],
          'Service providers, photographers, consultants',
          2
        ),
        (
          'visual-menu',
          'Visual Menu',
          'Help hungry customers order quickly without confusion or regret',
          600,
          'Order food fast without decision paralysis',
          ARRAY['Restaurants', 'Food vendors', 'Catering', 'Cloud kitchens'],
          ARRAY['Minimize decision paralysis', 'Minimize order regret', 'Increase order value with add-ons'],
          'Restaurants, food vendors, catering',
          3
        ),
        (
          'event-landing',
          'Event Landing',
          'Help me drive RSVP/ticket sales for my event',
          700,
          'Get people to show up to my event',
          ARRAY['Event organizers', 'Workshops', 'Concerts', 'Classes'],
          ARRAY['Minimize uncertainty about event value', 'Increase urgency to buy tickets', 'Maximize RSVP conversion'],
          'Event organizers, workshops, concerts',
          4
        ),
        (
          'deep-dive',
          'Deep Dive Evaluator',
          'Help me evaluate if this expensive item is worth the investment',
          800,
          'Justify expensive purchases with confidence',
          ARRAY['Electronics', 'Furniture', 'Jewelry', 'Cars', 'Real Estate'],
          ARRAY['Minimize anxiety about expensive purchase', 'Increase confidence in product quality', 'Reduce return likelihood'],
          'High-ticket items, electronics, furniture',
          5
        ),
        (
          'catalog-nav',
          'Catalog Navigator',
          'Help me quickly find the type of product I am looking for across your catalog',
          800,
          'Browse and find products across a large catalog',
          ARRAY['Multi-product stores', 'Fashion boutiques', 'Home goods', 'General retail'],
          ARRAY['Minimize time to find products', 'Enable category browsing', 'Reduce bounce from overwhelm'],
          'Stores with 4+ products (Homepage addon)',
          6
        )
      ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        price = EXCLUDED.price,
        job_statement = EXCLUDED.job_statement,
        industries = EXCLUDED.industries,
        key_outcomes = EXCLUDED.key_outcomes,
        best_for = EXCLUDED.best_for,
        display_order = EXCLUDED.display_order
    `);
    console.log('✅ Template definitions inserted');

    // Create homepages table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS homepages (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        style VARCHAR(50) DEFAULT 'default',
        hero_title VARCHAR(200),
        hero_subtitle TEXT,
        hero_image VARCHAR(500),
        hero_cta_text VARCHAR(100) DEFAULT 'Browse Products',
        about_title VARCHAR(100),
        about_text TEXT,
        about_image VARCHAR(500),
        contact_email VARCHAR(100),
        contact_phone VARCHAR(20),
        contact_whatsapp VARCHAR(20),
        social_instagram VARCHAR(200),
        social_facebook VARCHAR(200),
        social_twitter VARCHAR(200),
        social_tiktok VARCHAR(200),
        footer_text TEXT,
        is_active BOOLEAN DEFAULT false,
        categories JSONB,
        testimonials JSONB,
        stats JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Homepages table created');

    // Create email verifications table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS email_verifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        email VARCHAR(255) NOT NULL,
        verification_code VARCHAR(6) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Email verifications table created');

    // Create password resets table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        email VARCHAR(255) NOT NULL,
        reset_token VARCHAR(64) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Password resets table created');

    res.json({
      success: true,
      message: '🎉 Database initialized successfully!',
      tables: [
        'users', 'products', 'orders', 'store_settings', 
        'themes', 'add_ons', 'user_add_ons', 'template_definitions',
        'homepages', 'email_verifications', 'password_resets'
      ]
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

// GET /api/init/migrate-templates - Run template schema migration on existing DB
router.get('/migrate-templates', async (req, res) => {
  try {
    console.log('🔧 Running template migrations...');
    const changes = [];

    // Add template columns to products
    await pool.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS template_type VARCHAR(50) DEFAULT 'quick-decision',
      ADD COLUMN IF NOT EXISTS gallery_images TEXT[],
      ADD COLUMN IF NOT EXISTS rich_description TEXT,
      ADD COLUMN IF NOT EXISTS specifications JSONB,
      ADD COLUMN IF NOT EXISTS video_url VARCHAR(500),
      ADD COLUMN IF NOT EXISTS story_title VARCHAR(100),
      ADD COLUMN IF NOT EXISTS story_media JSONB,
      ADD COLUMN IF NOT EXISTS additional_images TEXT[],
      ADD COLUMN IF NOT EXISTS privacy_policy TEXT,
      ADD COLUMN IF NOT EXISTS terms_of_service TEXT,
      ADD COLUMN IF NOT EXISTS refund_policy TEXT,
      ADD COLUMN IF NOT EXISTS service_packages JSONB,
      ADD COLUMN IF NOT EXISTS availability_notes TEXT,
      ADD COLUMN IF NOT EXISTS dietary_tags TEXT[],
      ADD COLUMN IF NOT EXISTS prep_time VARCHAR(50),
      ADD COLUMN IF NOT EXISTS calories INTEGER,
      ADD COLUMN IF NOT EXISTS ingredients TEXT,
      ADD COLUMN IF NOT EXISTS trust_badges JSONB,
      ADD COLUMN IF NOT EXISTS warranty_info TEXT,
      ADD COLUMN IF NOT EXISTS return_policy_days INTEGER DEFAULT 30,
      ADD COLUMN IF NOT EXISTS category VARCHAR(100)
    `);
    changes.push('Added template fields to products table');

    // Add verification fields to users
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS selected_industry VARCHAR(100),
      ADD COLUMN IF NOT EXISTS biggest_challenge VARCHAR(100)
    `);
    changes.push('Added verification fields to users');

    // Add branding fields to store_settings
    await pool.query(`
      ALTER TABLE store_settings 
      ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500),
      ADD COLUMN IF NOT EXISTS header_bg_url VARCHAR(500),
      ADD COLUMN IF NOT EXISTS header_bg_type VARCHAR(20) DEFAULT 'gradient',
      ADD COLUMN IF NOT EXISTS light_mode_enabled BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS brand_color_primary VARCHAR(20),
      ADD COLUMN IF NOT EXISTS brand_color_secondary VARCHAR(20)
    `);
    changes.push('Added branding fields to store_settings');

    // Add light mode fields to themes
    await pool.query(`
      ALTER TABLE themes 
      ADD COLUMN IF NOT EXISTS light_gradient VARCHAR(255),
      ADD COLUMN IF NOT EXISTS light_primary_color VARCHAR(50),
      ADD COLUMN IF NOT EXISTS light_text_color VARCHAR(50) DEFAULT '#1a1a1a',
      ADD COLUMN IF NOT EXISTS light_bg_color VARCHAR(50) DEFAULT '#f5f5f7'
    `);
    changes.push('Added light mode fields to themes');

    // Create template_definitions if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS template_definitions (
        id SERIAL PRIMARY KEY,
        slug VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        job_statement TEXT,
        industries TEXT[],
        key_outcomes TEXT[],
        features JSONB,
        best_for TEXT,
        is_active BOOLEAN DEFAULT true,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    changes.push('Created template_definitions table');

    // Insert/Update template definitions
    await pool.query(`
      INSERT INTO template_definitions (slug, name, description, price, job_statement, industries, key_outcomes, best_for, display_order)
      VALUES 
        ('quick-decision', 'Quick Decision Single', 'Convert scrolling followers into paying customers with minimal friction', 250, 'Help me decide if I want this ONE thing, fast', ARRAY['Instagram drop shippers', 'Fashion resellers', 'Viral product drops'], ARRAY['Minimize time from scroll to sold', 'Minimize checkout steps'], 'Instagram sellers, single products', 1),
        ('portfolio-booking', 'Portfolio + Booking', 'Demonstrate expertise and get qualified client inquiries', 500, 'Show my work and get bookings', ARRAY['Photographers', 'Coaches', 'Consultants', 'Event planners'], ARRAY['Minimize skepticism about quality', 'Minimize friction in booking'], 'Service providers, photographers', 2),
        ('visual-menu', 'Visual Menu', 'Help hungry customers order quickly without confusion', 600, 'Order food fast without decision paralysis', ARRAY['Restaurants', 'Food vendors', 'Catering'], ARRAY['Minimize decision paralysis', 'Increase order value'], 'Restaurants, food vendors', 3),
        ('event-landing', 'Event Landing', 'Drive RSVP/ticket sales for events', 700, 'Get people to show up to my event', ARRAY['Event organizers', 'Workshops', 'Concerts'], ARRAY['Increase urgency to buy tickets', 'Maximize RSVP conversion'], 'Event organizers, workshops', 4),
        ('deep-dive', 'Deep Dive Evaluator', 'Help evaluate if expensive items are worth the investment', 800, 'Justify expensive purchases with confidence', ARRAY['Electronics', 'Furniture', 'Jewelry'], ARRAY['Minimize purchase anxiety', 'Reduce return likelihood'], 'High-ticket items, electronics', 5),
        ('catalog-nav', 'Catalog Navigator', 'Help find products across a large catalog', 800, 'Browse and find products easily', ARRAY['Multi-product stores', 'Fashion boutiques'], ARRAY['Minimize time to find products', 'Reduce bounce from overwhelm'], 'Stores with 4+ products', 6)
      ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        price = EXCLUDED.price,
        job_statement = EXCLUDED.job_statement
    `);
    changes.push('Inserted/Updated template definitions');

    // Create homepages table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS homepages (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        style VARCHAR(50) DEFAULT 'default',
        hero_title VARCHAR(200),
        hero_subtitle TEXT,
        hero_image VARCHAR(500),
        hero_cta_text VARCHAR(100) DEFAULT 'Browse Products',
        about_title VARCHAR(100),
        about_text TEXT,
        about_image VARCHAR(500),
        contact_email VARCHAR(100),
        contact_phone VARCHAR(20),
        contact_whatsapp VARCHAR(20),
        social_instagram VARCHAR(200),
        social_facebook VARCHAR(200),
        social_twitter VARCHAR(200),
        social_tiktok VARCHAR(200),
        footer_text TEXT,
        is_active BOOLEAN DEFAULT false,
        categories JSONB,
        testimonials JSONB,
        stats JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    changes.push('Created homepages table');

    // Create email_verifications table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS email_verifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        email VARCHAR(255) NOT NULL,
        verification_code VARCHAR(6) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    changes.push('Created email_verifications table');

    // Create password_resets table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        email VARCHAR(255) NOT NULL,
        reset_token VARCHAR(64) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    changes.push('Created password_resets table');

    res.json({
      success: true,
      message: '🎉 Template migrations completed!',
      changes
    });

  } catch (error) {
    console.error('❌ Migration failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;
