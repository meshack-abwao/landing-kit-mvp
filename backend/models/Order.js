const pool = require('../config/database');

class Order {
  static async create(orderData) {
    const result = await pool.query(
      `INSERT INTO orders (user_id, product_id, order_number, customer_name, customer_phone, 
       customer_location, quantity, unit_price, total_amount, payment_method, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        orderData.userId,
        orderData.productId,
        orderData.orderNumber,
        orderData.customerName,
        orderData.customerPhone,
        orderData.customerLocation,
        orderData.quantity,
        orderData.unitPrice,
        orderData.totalAmount,
        orderData.paymentMethod,
        'pending'
      ]
    );
    return result.rows[0];
  }

  static async findByUserId(userId, limit = 50) {
    const result = await pool.query(
      `SELECT o.*, p.name as product_name, p.image_url as product_image
       FROM orders o
       LEFT JOIN products p ON o.product_id = p.id
       WHERE o.user_id = $1
       ORDER BY o.created_at DESC
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  }

  static async updateStatus(id, userId, status) {
    const result = await pool.query(
      'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING *',
      [status, id, userId]
    );
    return result.rows[0];
  }

  static async getStats(userId) {
    const result = await pool.query(
      `SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN total_amount ELSE 0 END), 0) as pending_revenue,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END), 0) as completed_revenue
       FROM orders 
       WHERE user_id = $1`,
      [userId]
    );
    return result.rows[0];
  }
}

module.exports = Order;
