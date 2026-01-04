require('dotenv').config();
const pool = require('./database');

async function addTemplates() {
  try {
    console.log('🎨 Adding JTBD Template System...');

    // Create product_templates table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS product_templates (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        display_name VARCHAR(100),
        description TEXT,
        job_statement TEXT,
        recommended_for TEXT,
        price DECIMAL(10,2) DEFAULT 0,
        is_premium BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Product templates table created');

    // Insert 3 JTBD templates
    await pool.query(`
      INSERT INTO product_templates (name, display_name, description, job_statement, recommended_for, price, is_premium) 
      VALUES 
        (
          'quick-decision',
          'Quick Decision (Default)',
          'Single product focus, minimal friction, thumb-optimized for Instagram traffic',
          'Help me decide if I want this ONE thing, fast',
          'Impulse purchases, viral drops, single-SKU businesses',
          0,
          false
        ),
        (
          'trust-builder',
          'Trust Builder',
          'Social proof first, seller credentials, quality guarantees. Builds credibility fast.',
          'Help me feel confident buying from someone I don''t know yet',
          'New sellers, high-value items (KES 2,000+), first-time customers',
          500,
          true
        ),
        (
          'comparison-killer',
          'Comparison Killer',
          'All variants visible, smart filters, stock indicators. Simplifies complex choices.',
          'Help me choose the right variant without endless scrolling',
          'Products with sizes/colors, technical specs, gift shopping',
          800,
          true
        ),
        (
          'story-seller',
          'Story Seller',
          'Problem→Solution flow, maker stories, transformation testimonials.',
          'Help me understand why THIS product solves MY specific problem',
          'Handmade items, artisan products, lifestyle/transformation goods',
          600,
          true
        )
      ON CONFLICT (name) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        description = EXCLUDED.description,
        job_statement = EXCLUDED.job_statement,
        recommended_for = EXCLUDED.recommended_for,
        price = EXCLUDED.price,
        is_premium = EXCLUDED.is_premium
    `);
    console.log('✅ JTBD templates inserted');

    // Add template_id to products table
    await pool.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS template_id INTEGER REFERENCES product_templates(id) DEFAULT 1,
      ADD COLUMN IF NOT EXISTS template_data JSONB DEFAULT '{}'::jsonb
    `);
    console.log('✅ Products table updated with template support');

    // Add barrier_type column to help with template recommendations
    await pool.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS customer_barrier VARCHAR(100) DEFAULT 'quick-purchase'
    `);
    console.log('✅ Customer barrier column added');

    console.log('🎉 JTBD Template System ready!');
    console.log('');
    console.log('Templates available:');
    console.log('  1. Quick Decision (Default) - FREE');
    console.log('  2. Trust Builder - KES 500');
    console.log('  3. Comparison Killer - KES 800');
    console.log('  4. Story Seller - KES 600');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Template setup failed:', error);
    process.exit(1);
  }
}

addTemplates();
