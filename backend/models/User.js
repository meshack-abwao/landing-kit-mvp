const pool = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async create({ email, password, businessName, instagramHandle, phone }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, business_name, instagram_handle, phone, subscription_tier)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, business_name, instagram_handle, phone, subscription_tier, created_at`,
      [email, hashedPassword, businessName, instagramHandle, phone, 'tier1']
    );
    
    return result.rows[0];
  }

  static async findByEmail(email) {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await pool.query(
      'SELECT id, email, business_name, instagram_handle, phone, subscription_tier, created_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  static async updateSubscription(userId, tier) {
    const result = await pool.query(
      'UPDATE users SET subscription_tier = $1 WHERE id = $2 RETURNING *',
      [tier, userId]
    );
    return result.rows[0];
  }
}

module.exports = User;
