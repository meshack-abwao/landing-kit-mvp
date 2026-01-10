require('dotenv').config();
const pool = require('./database');

async function addHeaderBgColumn() {
  try {
    console.log('🔧 Adding header_bg_url column if not exists...');
    
    await pool.query(`
      ALTER TABLE store_settings 
      ADD COLUMN IF NOT EXISTS header_bg_url VARCHAR(500)
    `);
    
    console.log('✅ header_bg_url column ready');
    
    // Verify by checking column exists
    const result = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'store_settings' AND column_name = 'header_bg_url'
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Verified: header_bg_url column exists');
    } else {
      console.log('❌ Column was not created');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

addHeaderBgColumn();
