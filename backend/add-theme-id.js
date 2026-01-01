require('dotenv').config();
const pool = require('./config/database');

async function addThemeId() {
  console.log('Adding theme_id column...\n');
  
  try {
    // Add theme_id column
    await pool.query(`
      ALTER TABLE store_settings 
      ADD COLUMN IF NOT EXISTS theme_id INTEGER;
    `);
    console.log('✅ theme_id column added');
    
    // Migrate existing theme_color to theme_id
    console.log('\nMigrating existing theme colors to IDs...');
    
    const themes = await pool.query('SELECT id, name FROM themes');
    
    for (const theme of themes.rows) {
      await pool.query(`
        UPDATE store_settings 
        SET theme_id = $1 
        WHERE theme_color = $2 AND theme_id IS NULL
      `, [theme.id, theme.name]);
      console.log(`  Migrated '${theme.name}' → ID ${theme.id}`);
    }
    
    console.log('\n🎉 Migration complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

addThemeId();
