const express = require('express');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Check if extended columns exist
let hasExtendedColumns = null;
async function checkExtendedColumns() {
  if (hasExtendedColumns !== null) return hasExtendedColumns;
  try {
    const result = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'products' AND column_name = 'template_type'
    `);
    hasExtendedColumns = result.rows.length > 0;
    return hasExtendedColumns;
  } catch (e) {
    hasExtendedColumns = false;
    return false;
  }
}

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
// CREATE PRODUCT
// =============================================
router.post('/', authMiddleware, async (req, res) => {
  try {
    const extended = await checkExtendedColumns();
    const { 
      name, description, price, imageUrl, stockQuantity, isActive,
      additionalImages, storyMedia, storyTitle, privacyPolicy, termsOfService, refundPolicy,
      templateType, richDescription, specifications, videoUrl, galleryImages,
      servicePackages, availabilityNotes, dietaryTags, prepTime, calories, ingredients,
      trustBadges, warrantyInfo, returnPolicyDays, category, testimonials
    } = req.body;
    
    const formatJson = (data) => data ? (typeof data === 'string' ? data : JSON.stringify(data)) : null;
    const formatArray = (data) => Array.isArray(data) ? data : null;
    
    let result;
    
    if (extended) {
      result = await pool.query(
        `INSERT INTO products (
          user_id, name, description, price, image_url, stock_quantity, is_active,
          additional_images, story_media, story_title, privacy_policy, terms_of_service, refund_policy,
          template_type, rich_description, specifications, video_url, gallery_images,
          service_packages, availability_notes, dietary_tags, prep_time, calories, ingredients,
          trust_badges, warranty_info, return_policy_days, category, testimonials
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29) 
        RETURNING *`,
        [
          req.user.userId, name, description, price, imageUrl, stockQuantity || 1000, isActive !== false,
          formatJson(additionalImages), formatJson(storyMedia), storyTitle || 'See it in Action',
          privacyPolicy || '', termsOfService || '', refundPolicy || '',
          templateType || 'quick-decision', richDescription, formatJson(specifications), videoUrl, formatArray(galleryImages),
          formatJson(servicePackages), availabilityNotes, formatArray(dietaryTags), prepTime, calories, ingredients,
          formatJson(trustBadges), warrantyInfo, returnPolicyDays || 30, category, formatJson(testimonials)
        ]
      );
    } else {
      // Fallback to basic columns only
      result = await pool.query(
        `INSERT INTO products (user_id, name, description, price, image_url, stock_quantity, is_active) 
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [req.user.userId, name, description, price, imageUrl, stockQuantity || 1000, isActive !== false]
      );
    }
    
    res.json({ success: true, product: result.rows[0] });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ success: false, error: 'Failed to create product: ' + error.message });
  }
});

// =============================================
// UPDATE PRODUCT
// =============================================
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const extended = await checkExtendedColumns();
    const { 
      name, description, price, imageUrl, stockQuantity, isActive,
      additionalImages, storyMedia, storyTitle, privacyPolicy, termsOfService, refundPolicy,
      templateType, richDescription, specifications, videoUrl, galleryImages,
      servicePackages, availabilityNotes, dietaryTags, prepTime, calories, ingredients,
      trustBadges, warrantyInfo, returnPolicyDays, category, testimonials
    } = req.body;
    
    const formatJson = (data) => data ? (typeof data === 'string' ? data : JSON.stringify(data)) : null;
    const formatArray = (data) => Array.isArray(data) ? data : null;
    
    let result;
    
    if (extended) {
      result = await pool.query(
        `UPDATE products SET 
          name=$1, description=$2, price=$3, image_url=$4, stock_quantity=$5, is_active=$6,
          additional_images=$7, story_media=$8, story_title=$9, privacy_policy=$10, terms_of_service=$11, refund_policy=$12,
          template_type=$13, rich_description=$14, specifications=$15, video_url=$16, gallery_images=$17,
          service_packages=$18, availability_notes=$19, dietary_tags=$20, prep_time=$21, calories=$22, ingredients=$23,
          trust_badges=$24, warranty_info=$25, return_policy_days=$26, category=$27, testimonials=$28, updated_at=NOW()
        WHERE id=$29 AND user_id=$30 RETURNING *`,
        [
          name, description, price, imageUrl, stockQuantity, isActive,
          formatJson(additionalImages), formatJson(storyMedia), storyTitle || 'See it in Action',
          privacyPolicy || '', termsOfService || '', refundPolicy || '',
          templateType || 'quick-decision', richDescription, formatJson(specifications), videoUrl, formatArray(galleryImages),
          formatJson(servicePackages), availabilityNotes, formatArray(dietaryTags), prepTime, calories, ingredients,
          formatJson(trustBadges), warrantyInfo, returnPolicyDays || 30, category, formatJson(testimonials),
          id, req.user.userId
        ]
      );
    } else {
      // Fallback to basic columns only
      result = await pool.query(
        `UPDATE products SET name=$1, description=$2, price=$3, image_url=$4, stock_quantity=$5, is_active=$6, updated_at=NOW()
         WHERE id=$7 AND user_id=$8 RETURNING *`,
        [name, description, price, imageUrl, stockQuantity, isActive, id, req.user.userId]
      );
    }
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    res.json({ success: true, product: result.rows[0] });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ success: false, error: 'Failed to update product: ' + error.message });
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
// MIGRATE - Add extended columns if missing
// =============================================
router.post('/migrate', authMiddleware, async (req, res) => {
  try {
    await pool.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS template_type VARCHAR(50) DEFAULT 'quick-decision',
      ADD COLUMN IF NOT EXISTS additional_images JSONB,
      ADD COLUMN IF NOT EXISTS story_media JSONB,
      ADD COLUMN IF NOT EXISTS story_title VARCHAR(100) DEFAULT 'See it in Action',
      ADD COLUMN IF NOT EXISTS privacy_policy TEXT DEFAULT '',
      ADD COLUMN IF NOT EXISTS terms_of_service TEXT DEFAULT '',
      ADD COLUMN IF NOT EXISTS refund_policy TEXT DEFAULT '',
      ADD COLUMN IF NOT EXISTS rich_description TEXT,
      ADD COLUMN IF NOT EXISTS specifications JSONB,
      ADD COLUMN IF NOT EXISTS video_url VARCHAR(500),
      ADD COLUMN IF NOT EXISTS gallery_images TEXT[],
      ADD COLUMN IF NOT EXISTS service_packages JSONB,
      ADD COLUMN IF NOT EXISTS availability_notes TEXT,
      ADD COLUMN IF NOT EXISTS dietary_tags TEXT[],
      ADD COLUMN IF NOT EXISTS prep_time VARCHAR(50),
      ADD COLUMN IF NOT EXISTS calories INTEGER,
      ADD COLUMN IF NOT EXISTS ingredients TEXT,
      ADD COLUMN IF NOT EXISTS trust_badges JSONB,
      ADD COLUMN IF NOT EXISTS warranty_info TEXT,
      ADD COLUMN IF NOT EXISTS return_policy_days INTEGER DEFAULT 30,
      ADD COLUMN IF NOT EXISTS category VARCHAR(100),
      ADD COLUMN IF NOT EXISTS testimonials JSONB
    `);
    hasExtendedColumns = true;
    res.json({ success: true, message: 'Products table migrated successfully' });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({ success: false, error: 'Migration failed: ' + error.message });
  }
});

module.exports = router;
