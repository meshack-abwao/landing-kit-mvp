const express = require('express');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// =============================================
// GET ALL PRODUCTS
// =============================================
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

// =============================================
// CREATE PRODUCT WITH TEMPLATE SUPPORT
// =============================================
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { 
      // Basic fields
      name, description, price, imageUrl, additionalImages, stockQuantity, isActive, 
      storyMedia, storyTitle, privacyPolicy, termsOfService, refundPolicy,
      // Template fields
      templateType,
      richDescription,
      specifications,
      videoUrl,
      galleryImages,
      // Service template fields
      servicePackages,
      availabilityNotes,
      // Food template fields
      dietaryTags,
      prepTime,
      calories,
      ingredients,
      // High-ticket template fields
      trustBadges,
      warrantyInfo,
      returnPolicyDays,
      // Category
      category
    } = req.body;
    
    // Format arrays as JSON
    const formatJson = (data) => {
      if (!data) return null;
      if (typeof data === 'string') return data;
      return JSON.stringify(data);
    };
    
    const formatArray = (data) => {
      if (!data) return null;
      if (Array.isArray(data)) return data;
      return null;
    };
    
    const result = await pool.query(
      `INSERT INTO products (
        user_id, name, description, price, image_url, additional_images, 
        stock_quantity, is_active, story_media, story_title, 
        privacy_policy, terms_of_service, refund_policy,
        template_type, rich_description, specifications, video_url, gallery_images,
        service_packages, availability_notes,
        dietary_tags, prep_time, calories, ingredients,
        trust_badges, warranty_info, return_policy_days, category
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28) 
      RETURNING *`,
      [
        req.user.userId, name, description, price, imageUrl, 
        formatJson(additionalImages), 
        stockQuantity || 1000, isActive !== false, 
        formatJson(storyMedia), storyTitle || 'See it in Action',
        privacyPolicy || '', termsOfService || '', refundPolicy || '',
        templateType || 'quick-decision',
        richDescription || null,
        formatJson(specifications),
        videoUrl || null,
        formatArray(galleryImages),
        formatJson(servicePackages),
        availabilityNotes || null,
        formatArray(dietaryTags),
        prepTime || null,
        calories || null,
        ingredients || null,
        formatJson(trustBadges),
        warrantyInfo || null,
        returnPolicyDays || 30,
        category || null
      ]
    );
    res.json({ success: true, product: result.rows[0] });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ success: false, error: 'Failed to create product' });
  }
});

// =============================================
// UPDATE PRODUCT WITH TEMPLATE SUPPORT
// =============================================
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      // Basic fields
      name, description, price, imageUrl, additionalImages, stockQuantity, isActive, 
      storyMedia, storyTitle, privacyPolicy, termsOfService, refundPolicy,
      // Template fields
      templateType,
      richDescription,
      specifications,
      videoUrl,
      galleryImages,
      // Service template fields
      servicePackages,
      availabilityNotes,
      // Food template fields
      dietaryTags,
      prepTime,
      calories,
      ingredients,
      // High-ticket template fields
      trustBadges,
      warrantyInfo,
      returnPolicyDays,
      // Category
      category
    } = req.body;
    
    // Format arrays as JSON
    const formatJson = (data) => {
      if (!data) return null;
      if (typeof data === 'string') return data;
      return JSON.stringify(data);
    };
    
    const formatArray = (data) => {
      if (!data) return null;
      if (Array.isArray(data)) return data;
      return null;
    };
    
    const result = await pool.query(
      `UPDATE products SET 
        name = $1, description = $2, price = $3, image_url = $4, 
        additional_images = $5, stock_quantity = $6, is_active = $7, 
        story_media = $8, story_title = $9, 
        privacy_policy = $10, terms_of_service = $11, refund_policy = $12,
        template_type = $13, rich_description = $14, specifications = $15,
        video_url = $16, gallery_images = $17,
        service_packages = $18, availability_notes = $19,
        dietary_tags = $20, prep_time = $21, calories = $22, ingredients = $23,
        trust_badges = $24, warranty_info = $25, return_policy_days = $26,
        category = $27, updated_at = NOW()
      WHERE id = $28 AND user_id = $29 
      RETURNING *`,
      [
        name, description, price, imageUrl, 
        formatJson(additionalImages),
        stockQuantity, isActive, 
        formatJson(storyMedia), storyTitle || 'See it in Action',
        privacyPolicy || '', termsOfService || '', refundPolicy || '',
        templateType || 'quick-decision',
        richDescription || null,
        formatJson(specifications),
        videoUrl || null,
        formatArray(galleryImages),
        formatJson(servicePackages),
        availabilityNotes || null,
        formatArray(dietaryTags),
        prepTime || null,
        calories || null,
        ingredients || null,
        formatJson(trustBadges),
        warrantyInfo || null,
        returnPolicyDays || 30,
        category || null,
        id, req.user.userId
      ]
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

// =============================================
// DELETE PRODUCT
// =============================================
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

// =============================================
// GET PRODUCTS BY TEMPLATE TYPE
// =============================================
router.get('/by-template/:templateType', authMiddleware, async (req, res) => {
  try {
    const { templateType } = req.params;
    const result = await pool.query(
      'SELECT * FROM products WHERE user_id = $1 AND template_type = $2 ORDER BY created_at DESC',
      [req.user.userId, templateType]
    );
    res.json({ success: true, products: result.rows });
  } catch (error) {
    console.error('Get products by template error:', error);
    res.status(500).json({ success: false, error: 'Failed to get products' });
  }
});

module.exports = router;
