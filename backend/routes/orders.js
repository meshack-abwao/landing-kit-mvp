const express = require('express');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');
const { appendToSheet } = require('../config/googleSheets');
const { sendWhatsAppNotification } = require('../config/whatsapp');

const router = express.Router();

// Get order statistics (protected)
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN total_amount ELSE 0 END), 0) as pending_revenue
      FROM orders 
      WHERE user_id = $1
    `, [req.user.userId]);

    res.json({
      success: true,
      stats: {
        total_orders: parseInt(result.rows[0].total_orders),
        total_revenue: parseFloat(result.rows[0].total_revenue),
        pending_revenue: parseFloat(result.rows[0].pending_revenue),
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to get stats' });
  }
});

// Get all orders for user (protected)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.*, p.name as product_name 
       FROM orders o 
       LEFT JOIN products p ON o.product_id = p.id 
       WHERE o.user_id = $1 
       ORDER BY o.created_at DESC`,
      [req.user.userId]
    );

    res.json({
      success: true,
      orders: result.rows
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ success: false, error: 'Failed to get orders' });
  }
});

// Create new order (public or authenticated)
router.post('/', async (req, res) => {
  try {
    const { subdomain, productId, product, quantity, price, total, customer, paymentMethod } = req.body;

    let userId = null;

    // If subdomain provided, look up user_id
    if (subdomain) {
      const userResult = await pool.query(
        'SELECT user_id FROM store_settings WHERE subdomain = $1',
        [subdomain]
      );
      if (userResult.rows.length > 0) {
        userId = userResult.rows[0].user_id;
      }
    }

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Save to database if we have user_id
    if (userId) {
      await pool.query(
        `INSERT INTO orders (user_id, product_id, order_number, customer_name, customer_phone, customer_location, quantity, unit_price, total_amount, payment_method, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [userId, productId, orderNumber, customer.name, customer.phone, customer.location, quantity, price, total, paymentMethod, 'pending']
      );
    }

    // Always save to Google Sheets as backup
    await appendToSheet([
      orderNumber,
      new Date().toISOString(),
      product,
      quantity,
      `KES ${total}`,
      customer.name,
      customer.phone,
      customer.location,
      paymentMethod,
      'pending'
    ]);

    // Send WhatsApp notification
    await sendWhatsAppNotification(customer.phone, {
      orderNumber,
      product,
      quantity,
      total,
      paymentMethod
    });

    res.json({
      success: true,
      orderNumber,
      message: 'Order created successfully'
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ success: false, error: 'Failed to create order' });
  }
});

// Update order status (protected)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await pool.query(
      'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING *',
      [status, id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    res.json({
      success: true,
      order: result.rows[0]
    });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ success: false, error: 'Failed to update order' });
  }
});

module.exports = router;
