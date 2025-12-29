const pool = require('../config/database');

class Product {
  static async create({ userId, name, description, price, imageUrl, stockQuantity }) {
    const result = await pool.query(
      `INSERT INTO products (user_id, name, description, price, image_url, stock_quantity, is_active, display_order)
       VALUES ($1, $2, $3, $4, $5, $6, true, 0)
       RETURNING *`,
      [userId, name, description, price, imageUrl, stockQuantity || 0]
    );
    return result.rows[0];
  }

  static async findByUserId(userId) {
    const result = await pool.query(
      'SELECT * FROM products WHERE user_id = $1 ORDER BY display_order, created_at DESC',
      [userId]
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query(
      'SELECT * FROM products WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async update(id, userId, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(updates[key]);
        paramCount++;
      }
    });

    values.push(id, userId);
    
    const result = await pool.query(
      `UPDATE products SET ${fields.join(', ')}, updated_at = NOW() 
       WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
       RETURNING *`,
      values
    );
    return result.rows[0];
  }

  static async delete(id, userId) {
    const result = await pool.query(
      'DELETE FROM products WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );
    return result.rows[0];
  }

  static async toggleActive(id, userId) {
    const result = await pool.query(
      'UPDATE products SET is_active = NOT is_active WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );
    return result.rows[0];
  }
}

module.exports = Product;
