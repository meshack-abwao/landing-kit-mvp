import { useState, useEffect } from 'react';
import { productsAPI, settingsAPI } from '../../services/api.jsx';
import { Plus, Edit, Trash2, X, Eye, EyeOff, ExternalLink, Image } from 'lucide-react';

const getStoreBaseUrl = () => {
  return import.meta.env.VITE_STORE_URL || 'http://localhost:5177';
};

const parseStoryMedia = (storyJson) => {
  const defaultStories = [{ url: '', type: 'image' }, { url: '', type: 'image' }, { url: '', type: 'image' }, { url: '', type: 'image' }];
  try {
    const parsed = JSON.parse(storyJson || '[]');
    if (Array.isArray(parsed)) {
      return [...parsed, ...defaultStories].slice(0, 4).map(s => ({
        url: s?.url || '',
        type: s?.type || 'image'
      }));
    }
  } catch (e) {}
  return defaultStories;
};

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [storeUrl, setStoreUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    imageUrl: '',
    additionalImages: ['', '', ''],
    stockQuantity: 1000,
    isActive: true,
    storyMedia: [{ url: '', type: 'image' }, { url: '', type: 'image' }, { url: '', type: 'image' }, { url: '', type: 'image' }],
    storyTitle: 'See it in Action',
    privacyPolicy: '',
    termsOfService: '',
    refundPolicy: '',
  });

  useEffect(() => {
    loadProducts();
    loadStoreUrl();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await productsAPI.getAll();
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Failed to load products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStoreUrl = async () => {
    try {
      const response = await settingsAPI.getAll();
      const subdomain = response.data.settings.subdomain;
      if (subdomain) {
        const baseUrl = getStoreBaseUrl();
        setStoreUrl(`${baseUrl}?subdomain=${subdomain}`);
      }
    } catch (error) {
      console.error('Failed to load store URL:', error);
    }
  };

  const viewProduct = (productId) => {
    if (storeUrl) window.open(`${storeUrl}&product=${productId}`, '_blank');
  };

  const viewCollections = () => {
    if (storeUrl) window.open(storeUrl, '_blank');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        additionalImages: formData.additionalImages.filter(url => url && url.trim())
      };
      if (editingProduct) {
        await productsAPI.update(editingProduct.id, submitData);
      } else {
        await productsAPI.create(submitData);
      }
      resetForm();
      loadProducts();
    } catch (error) {
      console.error('Failed to save product:', error);
      alert('Failed to save product. Please try again.');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    let additionalImgs = ['', '', ''];
    try {
      const parsed = JSON.parse(product.additional_images || '[]');
      if (Array.isArray(parsed)) {
        additionalImgs = [...parsed, '', '', ''].slice(0, 3);
      }
    } catch (e) {}
    
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price,
      imageUrl: product.image_url || '',
      additionalImages: additionalImgs,
      stockQuantity: product.stock_quantity,
      isActive: product.is_active,
      storyMedia: parseStoryMedia(product.story_media),
      storyTitle: product.story_title || 'See it in Action',
      privacyPolicy: product.privacy_policy || '',
      termsOfService: product.terms_of_service || '',
      refundPolicy: product.refund_policy || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await productsAPI.delete(id);
      setProducts(products.filter(p => p.id !== id));
    } catch (error) {
      console.error('Failed to delete product:', error);
      alert('Failed to delete product. Please try again.');
      loadProducts();
    }
  };

  const toggleActive = async (product) => {
    try {
      let additionalImgs = [];
      try { additionalImgs = JSON.parse(product.additional_images || '[]'); } catch (e) {}
      
      await productsAPI.update(product.id, {
        name: product.name,
        description: product.description,
        price: product.price,
        imageUrl: product.image_url,
        additionalImages: additionalImgs,
        stockQuantity: product.stock_quantity,
        isActive: !product.is_active,
      });
      setProducts(products.map(p => 
        p.id === product.id ? { ...p, is_active: !p.is_active } : p
      ));
    } catch (error) {
      console.error('Failed to toggle product:', error);
      alert('Failed to update product. Please try again.');
    }
  };

  const updateAdditionalImage = (index, value) => {
    const newImages = [...formData.additionalImages];
    newImages[index] = value;
    setFormData({ ...formData, additionalImages: newImages });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      imageUrl: '',
      additionalImages: ['', '', ''],
      stockQuantity: 1000,
      isActive: true,
      storyMedia: [{ url: '', type: 'image' }, { url: '', type: 'image' }, { url: '', type: 'image' }, { url: '', type: 'image' }],
      storyTitle: 'See it in Action',
      privacyPolicy: '',
      termsOfService: '',
      refundPolicy: '',
    });
    setEditingProduct(null);
    setShowModal(false);
  };

  const getImageCount = (product) => {
    let count = product.image_url ? 1 : 0;
    try {
      const additional = JSON.parse(product.additional_images || '[]');
      count += additional.filter(url => url && url.trim()).length;
    } catch (e) {}
    return count;
  };

  return (
    <div style={styles.container} className="fade-in">
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Products</h1>
          <p style={styles.subtitle}>Manage your product catalog</p>
        </div>
        <div style={styles.headerActions}>
          {products.length > 0 && storeUrl && (
            <button onClick={viewCollections} style={styles.viewCollectionsBtn}>
              <Eye size={18} />
              View Collections
            </button>
          )}
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            <Plus size={20} />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {showModal && (
        <div style={styles.modalOverlay} onClick={resetForm}>
          <div style={styles.modal} className="glass-card" onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
              <button onClick={resetForm} style={styles.closeBtn}><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>PRODUCT NAME</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Premium Ankara Dress"
                  required
                  className="dashboard-input"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>DESCRIPTION</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Beautiful handcrafted dress..."
                  rows="3"
                  className="dashboard-input"
                />
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>PRICE (KES)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="2500"
                    required
                    className="dashboard-input"
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>STOCK QUANTITY</label>
                  <input
                    type="number"
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                    placeholder="1000"
                    className="dashboard-input"
                  />
                </div>
              </div>

              <div style={styles.imagesSection}>
                <label style={styles.label}>PRODUCT IMAGES (Up to 4)</label>
                <p style={styles.hint}>First image is the main display image</p>
                
                <div style={styles.imageInputs}>
                  <div style={styles.mainImageInput}>
                    <span style={styles.imageLabel}>Main Image</span>
                    <input
                      type="url"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      placeholder="https://example.com/main-image.jpg"
                      className="dashboard-input"
                    />
                    {formData.imageUrl && (
                      <div style={styles.imagePreview}>
                        <img src={formData.imageUrl} alt="Main" style={styles.previewImg} />
                      </div>
                    )}
                  </div>

                  <div style={styles.additionalImagesGrid}>
                    {formData.additionalImages.map((img, idx) => (
                      <div key={idx} style={styles.additionalImageInput}>
                        <span style={styles.imageLabel}>Image {idx + 2}</span>
                        <input
                          type="url"
                          value={img}
                          onChange={(e) => updateAdditionalImage(idx, e.target.value)}
                          placeholder={`https://example.com/image-${idx + 2}.jpg`}
                          className="dashboard-input"
                        />
                        {img && (
                          <div style={styles.smallPreview}>
                            <img src={img} alt={`Additional ${idx + 1}`} style={styles.previewImg} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Story Media Section */}
              <div style={styles.storySection}>
                <label style={styles.label}>STORY MEDIA - Testimonials/Videos (Up to 4)</label>
                <p style={styles.hint}>Instagram-style story circles for social proof</p>
                
                <div style={styles.formGroup}>
                  <label style={styles.smallLabel}>Story Section Title</label>
                  <input
                    type="text"
                    value={formData.storyTitle}
                    onChange={(e) => setFormData({ ...formData, storyTitle: e.target.value })}
                    placeholder="See it in Action"
                    className="dashboard-input"
                  />
                </div>

                <div style={styles.storyGrid}>
                  {formData.storyMedia.map((story, idx) => (
                    <div key={idx} style={styles.storyInput}>
                      <span style={styles.imageLabel}>Story {idx + 1}</span>
                      <input
                        type="url"
                        value={story.url}
                        onChange={(e) => {
                          const newStories = [...formData.storyMedia];
                          newStories[idx] = { ...newStories[idx], url: e.target.value };
                          setFormData({ ...formData, storyMedia: newStories });
                        }}
                        placeholder="https://example.com/video-or-image.mp4"
                        className="dashboard-input"
                      />
                      <select
                        value={story.type}
                        onChange={(e) => {
                          const newStories = [...formData.storyMedia];
                          newStories[idx] = { ...newStories[idx], type: e.target.value };
                          setFormData({ ...formData, storyMedia: newStories });
                        }}
                        className="dashboard-input"
                        style={styles.typeSelect}
                      >
                        <option value="image">Image</option>
                        <option value="video">Video</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Policies Section */}
              <div style={styles.policiesSection}>
                <label style={styles.label}>STORE POLICIES (Optional)</label>
                <p style={styles.hint}>Appears in footer, popup on click</p>
                
                <div style={styles.formGroup}>
                  <label style={styles.smallLabel}>Privacy Policy</label>
                  <textarea
                    value={formData.privacyPolicy}
                    onChange={(e) => setFormData({ ...formData, privacyPolicy: e.target.value })}
                    placeholder="We respect your privacy..."
                    rows="2"
                    className="dashboard-input"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.smallLabel}>Terms of Service</label>
                  <textarea
                    value={formData.termsOfService}
                    onChange={(e) => setFormData({ ...formData, termsOfService: e.target.value })}
                    placeholder="By using our service..."
                    rows="2"
                    className="dashboard-input"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.smallLabel}>Refund Policy</label>
                  <textarea
                    value={formData.refundPolicy}
                    onChange={(e) => setFormData({ ...formData, refundPolicy: e.target.value })}
                    placeholder="Refunds within 7 days..."
                    rows="2"
                    className="dashboard-input"
                  />
                </div>
              </div>

              <div style={styles.formActions}>
                <button type="button" onClick={resetForm} style={styles.cancelBtn}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  {editingProduct ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div style={styles.loadingState}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Loading products...</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {products.map((product) => (
            <div key={product.id} style={styles.card} className="glass-card">
              <div style={styles.productImage}>
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} style={styles.image} />
                ) : (
                  <div style={styles.placeholder}>📸</div>
                )}
                <div style={{
                  ...styles.badge,
                  background: product.is_active ? 'rgba(48, 209, 88, 0.2)' : 'rgba(255, 55, 95, 0.2)',
                  color: product.is_active ? '#30d158' : '#ff375f',
                }}>
                  {product.is_active ? '● Active' : '● Inactive'}
                </div>
                {getImageCount(product) > 1 && (
                  <div style={styles.imageCountBadge}>
                    <Image size={14} />
                    {getImageCount(product)}
                  </div>
                )}
              </div>

              <div style={styles.cardContent}>
                <h3 style={styles.productName}>{product.name}</h3>
                <p style={styles.productDesc}>{product.description || 'No description'}</p>
                
                <div style={styles.productFooter}>
                  <div>
                    <p style={styles.price}>KES {parseInt(product.price).toLocaleString()}</p>
                    <p style={styles.stock}>Stock: {product.stock_quantity}</p>
                  </div>

                  <div style={styles.actions}>
                    <button 
                      onClick={() => toggleActive(product)} 
                      style={{
                        ...styles.iconBtn,
                        background: product.is_active ? 'rgba(48, 209, 88, 0.1)' : 'rgba(255, 55, 95, 0.1)',
                        borderColor: product.is_active ? 'rgba(48, 209, 88, 0.2)' : 'rgba(255, 55, 95, 0.2)',
                        color: product.is_active ? '#30d158' : '#ff375f',
                      }}
                      title={product.is_active ? 'Hide from store' : 'Show in store'}
                    >
                      {product.is_active ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>

                    {storeUrl && (
                      <button onClick={() => viewProduct(product.id)} style={styles.iconBtn} title="View on store">
                        <ExternalLink size={18} />
                      </button>
                    )}

                    <button onClick={() => handleEdit(product)} style={styles.iconBtn} title="Edit">
                      <Edit size={18} />
                    </button>

                    <button onClick={() => handleDelete(product.id)} style={styles.deleteBtn} title="Delete">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && products.length === 0 && !showModal && (
        <div style={styles.empty}>
          <div style={styles.emptyIcon}>📦</div>
          <h3 style={styles.emptyTitle}>No products yet</h3>
          <p style={styles.emptyDesc}>Click "Add Product" to create your first product</p>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { maxWidth: '1400px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' },
  title: { fontSize: '36px', fontWeight: '800', marginBottom: '8px' },
  subtitle: { fontSize: '16px', color: 'rgba(255, 255, 255, 0.5)' },
  headerActions: { display: 'flex', gap: '12px', alignItems: 'center' },
  viewCollectionsBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: 'rgba(255, 159, 10, 0.1)', border: '1px solid rgba(255, 159, 10, 0.3)', borderRadius: '12px', color: '#ff9f0a', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s' },
  loadingState: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 20px' },
  spinner: { width: '40px', height: '40px', border: '3px solid rgba(255, 255, 255, 0.1)', borderTop: '3px solid #ff9f0a', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  loadingText: { marginTop: '16px', color: 'rgba(255, 255, 255, 0.5)' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
  modal: { width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', padding: '32px' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' },
  modalTitle: { fontSize: '28px', fontWeight: '800' },
  closeBtn: { background: 'transparent', border: 'none', color: 'rgba(255, 255, 255, 0.6)', cursor: 'pointer', padding: '8px', borderRadius: '8px' },
  form: { display: 'flex', flexDirection: 'column', gap: '24px' },
  formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '10px' },
  label: { fontSize: '12px', fontWeight: '700', color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase', letterSpacing: '1px' },
  hint: { fontSize: '12px', color: 'rgba(255, 255, 255, 0.4)', marginTop: '-4px' },
  imagesSection: { display: 'flex', flexDirection: 'column', gap: '12px' },
  imageInputs: { display: 'flex', flexDirection: 'column', gap: '16px' },
  mainImageInput: { display: 'flex', flexDirection: 'column', gap: '8px' },
  imageLabel: { fontSize: '11px', fontWeight: '600', color: 'rgba(255, 159, 10, 0.8)', textTransform: 'uppercase' },
  additionalImagesGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' },
  additionalImageInput: { display: 'flex', flexDirection: 'column', gap: '6px' },
  imagePreview: { width: '100%', height: '120px', borderRadius: '8px', overflow: 'hidden', background: 'rgba(255,255,255,0.05)' },
  smallPreview: { width: '100%', height: '60px', borderRadius: '6px', overflow: 'hidden', background: 'rgba(255,255,255,0.05)' },
  previewImg: { width: '100%', height: '100%', objectFit: 'cover' },
  storySection: { display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px', background: 'rgba(139, 92, 246, 0.05)', borderRadius: '12px', border: '1px solid rgba(139, 92, 246, 0.15)' },
  storyGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' },
  storyInput: { display: 'flex', flexDirection: 'column', gap: '6px' },
  typeSelect: { padding: '8px', fontSize: '12px', marginTop: '4px' },
  policiesSection: { display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' },
  smallLabel: { fontSize: '11px', fontWeight: '600', color: 'rgba(255, 255, 255, 0.5)' },
  formActions: { display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' },
  cancelBtn: { padding: '14px 28px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: 'rgba(255, 255, 255, 0.7)', fontWeight: '600', fontSize: '15px', cursor: 'pointer' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' },
  card: { overflow: 'hidden' },
  productImage: { position: 'relative', height: '200px', background: 'rgba(255, 255, 255, 0.03)' },
  image: { width: '100%', height: '100%', objectFit: 'cover' },
  placeholder: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '64px', background: 'linear-gradient(135deg, #667eea 0%, #bf5af2 100%)' },
  badge: { position: 'absolute', top: '12px', right: '12px', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
  imageCountBadge: { position: 'absolute', bottom: '12px', left: '12px', padding: '4px 10px', borderRadius: '16px', fontSize: '12px', fontWeight: '600', background: 'rgba(0,0,0,0.6)', color: 'white', display: 'flex', alignItems: 'center', gap: '4px' },
  cardContent: { padding: '20px' },
  productName: { fontSize: '18px', fontWeight: '700', marginBottom: '8px' },
  productDesc: { fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '16px', lineHeight: '1.5' },
  productFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' },
  price: { fontSize: '24px', fontWeight: '800', color: '#ff9f0a', marginBottom: '4px' },
  stock: { fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)' },
  actions: { display: 'flex', gap: '8px' },
  iconBtn: { padding: '10px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: 'rgba(255, 255, 255, 0.7)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  deleteBtn: { padding: '10px', borderRadius: '10px', background: 'rgba(255, 55, 95, 0.1)', border: '1px solid rgba(255, 55, 95, 0.2)', color: '#ff375f', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  empty: { textAlign: 'center', padding: '80px 20px' },
  emptyIcon: { fontSize: '80px', marginBottom: '20px' },
  emptyTitle: { fontSize: '24px', fontWeight: '700', marginBottom: '8px' },
  emptyDesc: { fontSize: '16px', color: 'rgba(255, 255, 255, 0.5)' },
};
