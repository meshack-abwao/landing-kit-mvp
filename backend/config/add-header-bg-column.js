require('dotenv').config();
const { Pool } = require('pg');

// Create pool with SSL for Railway
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function addHeaderBgColumn() {
  try {
    console.log('🔧 Connecting to Railway database...');
    
    const client = await pool.connect();
    console.log('✅ Connected!');
    
    console.log('🔧 Adding header_bg_url column if not exists...');
    
    await client.query(`
      ALTER TABLE store_settings 
      ADD COLUMN IF NOT EXISTS header_bg_url VARCHAR(500)
    `);
    
    console.log('✅ header_bg_url column added');
    
    // Verify by checking column exists
    const result = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'store_settings' AND column_name = 'header_bg_url'
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Verified: header_bg_url column exists');
    } else {
      console.log('❌ Column was not created');
    }
    
    client.release();
    await pool.end();
    
    console.log('🎉 Migration complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

addHeaderBgColumn();
