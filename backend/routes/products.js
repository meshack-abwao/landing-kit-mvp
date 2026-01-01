const express = require('express');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM products WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.userId]
    );
    res.json({ success: true, products: result.rows });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ success: false, error: 'Failed to get products' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, price, imageUrl, additionalImages, stockQuantity, isActive } = req.body;
    
    // Validate and format additionalImages as JSON string
    let imagesJson = '[]';
    if (additionalImages && Array.isArray(additionalImages)) {
      imagesJson = JSON.stringify(additionalImages.filter(url => url && url.trim()));
    }
    
    const result = await pool.query(
      'INSERT INTO products (user_id, name, description, price, image_url, additional_images, stock_quantity, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [req.user.userId, name, description, price, imageUrl, imagesJson, stockQuantity || 1000, isActive !== false]
    );
    res.json({ success: true, product: result.rows[0] });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ success: false, error: 'Failed to create product' });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, imageUrl, additionalImages, stockQuantity, isActive } = req.body;
    
    // Validate and format additionalImages as JSON string
    let imagesJson = '[]';
    if (additionalImages && Array.isArray(additionalImages)) {
      imagesJson = JSON.stringify(additionalImages.filter(url => url && url.trim()));
    }
    
    const result = await pool.query(
      'UPDATE products SET name = $1, description = $2, price = $3, image_url = $4, additional_images = $5, stock_quantity = $6, is_active = $7, updated_at = NOW() WHERE id = $8 AND user_id = $9 RETURNING *',
      [name, description, price, imageUrl, imagesJson, stockQuantity, isActive, id, req.user.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    res.json({ success: true, product: result.rows[0] });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ success: false, error: 'Failed to update product' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM products WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.user.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete product' });
  }
});

module.exports = router;
