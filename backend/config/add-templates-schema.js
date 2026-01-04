require('dotenv').config();
const pool = require('./database');

async function addTemplatesSchema() {
  try {
    console.log('🔧 Adding template system schema...');

    // =============================================
    // 1. ADD TEMPLATE COLUMNS TO PRODUCTS TABLE
    // =============================================
    console.log('📦 Updating products table...');
    
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
    console.log('✅ Products table updated with template fields');

    // =============================================
    // 2. CREATE HOMEPAGES TABLE
    // =============================================
    console.log('🏠 Creating homepages table...');
    
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

    // =============================================
    // 3. CREATE EMAIL VERIFICATION TABLE (2FA)
    // =============================================
    console.log('🔐 Creating email verification table...');
    
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

    // =============================================
    // 4. CREATE PASSWORD RESET TABLE
    // =============================================
    console.log('🔑 Creating password reset table...');
    
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

    // =============================================
    // 5. ADD EMAIL VERIFIED FLAG TO USERS
    // =============================================
    console.log('👤 Updating users table...');
    
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS selected_industry VARCHAR(100),
      ADD COLUMN IF NOT EXISTS biggest_challenge VARCHAR(100)
    `);
    console.log('✅ Users table updated');

    // =============================================
    // 6. UPDATE STORE_SETTINGS WITH BRANDING
    // =============================================
    console.log('🎨 Updating store_settings for branding...');
    
    await pool.query(`
      ALTER TABLE store_settings 
      ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500),
      ADD COLUMN IF NOT EXISTS header_bg_url VARCHAR(500),
      ADD COLUMN IF NOT EXISTS header_bg_type VARCHAR(20) DEFAULT 'gradient',
      ADD COLUMN IF NOT EXISTS light_mode_enabled BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS brand_color_primary VARCHAR(20),
      ADD COLUMN IF NOT EXISTS brand_color_secondary VARCHAR(20)
    `);
    console.log('✅ Store settings updated for branding');

    // =============================================
    // 7. UPDATE THEMES WITH LIGHT MODE COLORS
    // =============================================
    console.log('🌓 Adding light mode colors to themes...');
    
    await pool.query(`
      ALTER TABLE themes 
      ADD COLUMN IF NOT EXISTS light_gradient VARCHAR(255),
      ADD COLUMN IF NOT EXISTS light_primary_color VARCHAR(50),
      ADD COLUMN IF NOT EXISTS light_text_color VARCHAR(50) DEFAULT '#1a1a1a',
      ADD COLUMN IF NOT EXISTS light_bg_color VARCHAR(50) DEFAULT '#f5f5f7'
    `);
    console.log('✅ Themes table updated for light mode');

    // =============================================
    // 8. CREATE TEMPLATE DEFINITIONS TABLE
    // =============================================
    console.log('📋 Creating template definitions table...');
    
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
    
    // Insert the 6 JTBD templates
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

    console.log('');
    console.log('🎉 =============================================');
    console.log('   TEMPLATE SYSTEM SCHEMA COMPLETE!');
    console.log('   =============================================');
    console.log('');
    console.log('   Tables created/updated:');
    console.log('   • products (template fields)');
    console.log('   • homepages');
    console.log('   • email_verifications');
    console.log('   • password_resets');
    console.log('   • users (verification fields)');
    console.log('   • store_settings (branding fields)');
    console.log('   • themes (light mode fields)');
    console.log('   • template_definitions');
    console.log('');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Schema update failed:', error);
    process.exit(1);
  }
}

addTemplatesSchema();
