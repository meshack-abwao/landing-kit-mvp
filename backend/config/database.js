const { Pool } = require('pg');

// Railway and other cloud DBs need SSL
// Detect if we're connecting to a cloud database by checking the URL
const isCloudDB = process.env.DATABASE_URL && 
  (process.env.DATABASE_URL.includes('railway') || 
   process.env.DATABASE_URL.includes('neon') ||
   process.env.DATABASE_URL.includes('supabase') ||
   !process.env.DATABASE_URL.includes('localhost'));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isCloudDB ? { rejectUnauthorized: false } : false
});

// Test connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err);
  process.exit(-1);
});

module.exports = pool;
