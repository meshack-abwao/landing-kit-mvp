-- =============================================
-- JARI.ECOM DATABASE MIGRATION SCRIPT
-- Run this in Railway PostgreSQL console
-- =============================================

-- 1. Add template columns to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS template_type VARCHAR(50) DEFAULT 'quick-decision',
ADD COLUMN IF NOT EXISTS rich_description TEXT,
ADD COLUMN IF NOT EXISTS specifications JSONB,
ADD COLUMN IF NOT EXISTS video_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS gallery_images TEXT[],
ADD COLUMN IF NOT EXISTS additional_images JSONB,
ADD COLUMN IF NOT EXISTS story_title VARCHAR(100) DEFAULT 'See it in Action',
ADD COLUMN IF NOT EXISTS story_media JSONB,
ADD COLUMN IF NOT EXISTS privacy_policy TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS terms_of_service TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS refund_policy TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS service_packages JSONB,
ADD COLUMN IF NOT EXISTS availability_notes TEXT,
ADD COLUMN IF NOT EXISTS dietary_tags TEXT[],
ADD COLUMN IF NOT EXISTS prep_time VARCHAR(50),
ADD COLUMN IF NOT EXISTS calories INTEGER,
ADD COLUMN IF NOT EXISTS ingredients TEXT,
ADD COLUMN IF NOT EXISTS trust_badges JSONB,
ADD COLUMN IF NOT EXISTS warranty_info TEXT,
ADD COLUMN IF NOT EXISTS return_policy_days INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS category VARCHAR(100);

-- 2. Create template_definitions table
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
);

-- 3. Insert the 6 templates
INSERT INTO template_definitions (slug, name, description, price, best_for, features, display_order)
VALUES 
  ('quick-decision', 'Quick Decision', 'Perfect for single products and impulse buys', 250, 
   'Fashion, accessories, beauty products', 
   '["Story circles", "Quick checkout", "Social proof", "Mobile-first"]'::jsonb, 1),
  
  ('portfolio-booking', 'Portfolio + Booking', 'Showcase your work and let clients book', 500, 
   'Photographers, consultants, coaches, salons', 
   '["Gallery showcase", "Service packages", "Booking calendar", "Testimonials"]'::jsonb, 2),
  
  ('visual-menu', 'Visual Menu', 'Beautiful food displays that drive orders', 600, 
   'Restaurants, cafes, food delivery, catering', 
   '["Photo gallery", "Dietary tags", "Prep time", "Categories", "Add-ons"]'::jsonb, 3),
  
  ('event-landing', 'Event Landing', 'Fill seats with urgency and social proof', 700, 
   'Events, workshops, webinars, concerts', 
   '["Countdown timer", "Speaker bios", "Agenda", "RSVP tracking", "Early bird pricing"]'::jsonb, 4),
  
  ('deep-dive', 'Deep Dive Evaluator', 'Build trust for expensive purchases', 800, 
   'Electronics, furniture, jewelry, vehicles', 
   '["Specification tables", "Trust badges", "Video demos", "Warranty info", "Comparison"]'::jsonb, 5),
  
  ('catalog-nav', 'Catalog Navigator', 'Organize large product catalogs', 400, 
   'Multi-category stores, boutiques, wholesalers', 
   '["Category filters", "Search", "Featured products", "Collections"]'::jsonb, 6)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  best_for = EXCLUDED.best_for,
  features = EXCLUDED.features,
  display_order = EXCLUDED.display_order;

-- 4. Create homepages table (for catalog-nav)
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
  social_tiktok VARCHAR(200),
  footer_text TEXT,
  is_active BOOLEAN DEFAULT false,
  categories JSONB,
  testimonials JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 5. Add branding fields to store_settings
ALTER TABLE store_settings 
ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS header_bg_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS header_bg_type VARCHAR(20) DEFAULT 'gradient',
ADD COLUMN IF NOT EXISTS light_mode_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS brand_color_primary VARCHAR(20),
ADD COLUMN IF NOT EXISTS brand_color_secondary VARCHAR(20);

-- 6. Add user verification fields
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS selected_industry VARCHAR(100),
ADD COLUMN IF NOT EXISTS biggest_challenge VARCHAR(100);

-- 7. Create email_verifications table
CREATE TABLE IF NOT EXISTS email_verifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  verification_code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 8. Create password_resets table
CREATE TABLE IF NOT EXISTS password_resets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  reset_token VARCHAR(64) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Verify templates were inserted
SELECT slug, name, price, best_for FROM template_definitions ORDER BY display_order;
