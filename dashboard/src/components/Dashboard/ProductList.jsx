import { useState, useEffect } from 'react';
import { productsAPI, settingsAPI } from '../../services/api.jsx';
import api from '../../services/api.jsx';
import { Plus, Edit, Trash2, X, Eye, EyeOff, ExternalLink, Image, ChevronDown } from 'lucide-react';

// ===========================================
// STORE URL CONFIGURATION
// ===========================================
const getStoreBaseUrl = () => {
  // Check environment variable first (production)
  if (import.meta.env.VITE_STORE_URL) {
    return import.meta.env.VITE_STORE_URL;
  }
  // Check if running on Netlify
  if (window.location.hostname.includes('netlify.app') || window.location.hostname.includes('jarisolutions')) {
    return 'https://jariecomstore.netlify.app';
  }
  // Fallback for local development
  return 'http://localhost:5177';
};

// ===========================================
// TEMPLATE DEFINITIONS
// ===========================================
const TEMPLATE_CONFIG = {
  'quick-decision': {
    name: 'Quick Decision (Single Product)',
    price: 250,
    description: 'Perfect for single products or quick impulse buys',
    fields: ['name', 'description', 'price', 'imageUrl', 'additionalImages', 'stockQuantity', 'storyMedia', 'storyTitle', 'testimonials']
  },
  'portfolio-booking': {
    name: 'Portfolio + Booking',
    price: 500,
    description: 'For service providers with packages and booking',
    fields: ['name', 'richDescription', 'price', 'imageUrl', 'galleryImages', 'storyMedia', 'storyTitle', 'servicePackages', 'availability', 'testimonials']
  },
  'visual-menu': {
    name: 'Visual Menu',
    price: 600,
    description: 'For restaurants and food businesses',
    fields: ['name', 'description', 'price', 'imageUrl', 'galleryImages', 'storyMedia', 'storyTitle', 'dietaryTags', 'ingredients', 'prepTime', 'calories', 'testimonials']
  },
  'deep-dive': {
    name: 'Deep Dive Evaluator',
    price: 800,
    description: 'For high-ticket items needing detailed specs',
    fields: ['name', 'richDescription', 'price', 'imageUrl', 'galleryImages', 'storyMedia', 'storyTitle', 'specifications', 'trustBadges', 'warranty', 'returnPolicy', 'testimonials']
  },
  'event-landing': {
    name: 'Event Landing',
    price: 700,
    description: 'For events, workshops, and courses',
    fields: ['name', 'richDescription', 'price', 'imageUrl', 'galleryImages', 'storyMedia', 'storyTitle', 'eventDate', 'eventLocation', 'speakers', 'testimonials']
  }
};

const parseStoryMedia = (storyJson) => {
  const defaultStories = [{ url: '', type: 'image' }, { url: '', type: 'image' }, { url: '', type: 'image' }, { url: '', type: 'image' }];
  try {
    // Handle already-parsed array (from JSONB column)
    let parsed = storyJson;
    if (typeof storyJson === 'string') {
      parsed = JSON.parse(storyJson || '[]');
    }
    if (Array.isArray(parsed)) {
      return [...parsed, ...defaultStories].slice(0, 4).map(s => ({
        url: s?.url || '',
        type: s?.type || 'image'
      }));
    }
  } catch (e) {
    console.log('parseStoryMedia error:', e, storyJson);
  }
  return defaultStories;
};

const parseGalleryImages = (galleryJson) => {
  try {
    // Handle already-parsed array (from JSONB column)
    if (Array.isArray(galleryJson)) {
      return [...galleryJson, '', '', '', '', '', ''].slice(0, 6);
    }
    // Handle JSON string
    const parsed = JSON.parse(galleryJson || '[]');
    if (Array.isArray(parsed)) {
      return [...parsed, '', '', '', '', '', ''].slice(0, 6);
    }
  } catch (e) {
    console.log('parseGalleryImages error:', e, galleryJson);
  }
  return ['', '', '', '', '', ''];
};

const parseSpecifications = (specsJson) => {
  try {
    const parsed = JSON.parse(specsJson || '{}');
    if (typeof parsed === 'object') return parsed;
  } catch (e) {}
  return {};
};

const parseTrustBadges = (badgesJson) => {
  try {
    const parsed = JSON.parse(badgesJson || '[]');
    if (Array.isArray(parsed)) return parsed;
  } catch (e) {}
  return [];
};

const parseServicePackages = (packagesJson) => {
  try {
    // Handle already-parsed array (from JSONB column)
    if (Array.isArray(packagesJson)) {
      return packagesJson.length > 0 ? packagesJson : [{ name: '', price: '', description: '', features: [] }];
    }
    // Handle JSON string
    const parsed = JSON.parse(packagesJson || '[]');
    if (Array.isArray(parsed)) {
      return parsed.length > 0 ? parsed : [{ name: '', price: '', description: '', features: [] }];
    }
  } catch (e) {
    console.log('parseServicePackages error:', e, packagesJson);
  }
  return [{ name: '', price: '', description: '', features: [] }];
};

const parseTestimonials = (testimonialsJson) => {
  try {
    if (Array.isArray(testimonialsJson)) {
      return testimonialsJson.length > 0 ? testimonialsJson : [{ name: '', role: '', quote: '', avatar: '' }];
    }
    const parsed = JSON.parse(testimonialsJson || '[]');
    if (Array.isArray(parsed)) {
      return parsed.length > 0 ? parsed : [{ name: '', role: '', quote: '', avatar: '' }];
    }
  } catch (e) {
    console.log('parseTestimonials error:', e, testimonialsJson);
  }
  return [{ name: '', role: '', quote: '', avatar: '' }];
};

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [storeUrl, setStoreUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState('quick-decision');
  
  // Form data with all possible fields
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    richDescription: '',
    price: '',
    imageUrl: '',
    additionalImages: ['', '', ''],
    galleryImages: ['', '', '', '', '', ''],
    stockQuantity: 1000,
    isActive: true,
    templateType: 'quick-decision',
    // Story media for quick-decision
    storyMedia: [{ url: '', type: 'image' }, { url: '', type: 'image' }, { url: '', type: 'image' }, { url: '', type: 'image' }],
    storyTitle: 'See it in Action',
    // Video for portfolio/deep-dive
    videoUrl: '',
    // Service packages for portfolio-booking
    servicePackages: [{ name: '', price: '', description: '', features: [] }],
    availability: '',
    // Menu fields for visual-menu
    dietaryTags: [],
    ingredients: '',
    prepTime: '',
    calories: '',
    // Deep-dive fields
    specifications: {},
    trustBadges: [],
    warranty: '',
    returnPolicy: '',
    // Event fields
    eventDate: '',
    eventLocation: '',
    speakers: '',
    // Policies
    privacyPolicy: '',
    termsOfService: '',
    refundPolicy: '',
    // Testimonials for landing pages
    testimonials: [{ name: '', role: '', quote: '', avatar: '' }],
  });

  useEffect(() => {
    loadProducts();
    loadStoreUrl();
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    // Hardcoded templates - backend API may not be deployed
    const HARDCODED_TEMPLATES = [
      { slug: 'quick-decision', name: 'Quick Decision', price: 250 },
      { slug: 'portfolio-booking', name: 'Portfolio + Booking', price: 500 },
      { slug: 'visual-menu', name: 'Visual Menu', price: 600 },
      { slug: 'deep-dive', name: 'Deep Dive', price: 800 },
      { slug: 'event-landing', name: 'Event Landing', price: 700 },
      { slug: 'catalog-nav', name: 'Catalog Navigator', price: 400 },
    ];
    
    try {
      const response = await api.get('/templates');
      if (response.data.success && response.data.templates?.length > 0) {
        setTemplates(response.data.templates);
      } else {
        setTemplates(HARDCODED_TEMPLATES);
      }
    } catch (error) {
      // API not available, use hardcoded
      setTemplates(HARDCODED_TEMPLATES);
    }
  };

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
        templateType: selectedTemplate,
        additionalImages: formData.additionalImages.filter(url => url && url.trim()),
        galleryImages: formData.galleryImages.filter(url => url && url.trim()),
        storyMedia: formData.storyMedia.filter(s => s.url && s.url.trim()),
        servicePackages: formData.servicePackages.filter(p => p.name && p.name.trim()),
        testimonials: formData.testimonials.filter(t => t.name && t.quote && t.name.trim() && t.quote.trim()),
      };
      
      // DEBUG: Log what we're sending
      console.log('🚀 SUBMITTING DATA:', JSON.stringify(submitData, null, 2));
      console.log('📸 storyMedia:', submitData.storyMedia);
      console.log('🖼️ galleryImages:', submitData.galleryImages);
      console.log('📦 servicePackages:', submitData.servicePackages);
      
      let response;
      if (editingProduct) {
        response = await productsAPI.update(editingProduct.id, submitData);
      } else {
        response = await productsAPI.create(submitData);
      }
      
      // DEBUG: Log response
      console.log('✅ RESPONSE:', response);
      
      resetForm();
      loadProducts();
    } catch (error) {
      console.error('Failed to save product:', error);
      console.error('Error details:', error.response?.data);
      alert('Failed to save product. Please try again.');
    }
  };

  const handleEdit = (product) => {
    // DEBUG: Log raw product data from database
    console.log('📥 RAW PRODUCT FROM DB:', product);
    console.log('📸 raw story_media:', product.story_media);
    console.log('🖼️ raw gallery_images:', product.gallery_images);
    console.log('📦 raw service_packages:', product.service_packages);
    console.log('🎬 raw video_url:', product.video_url);
    
    setEditingProduct(product);
    setSelectedTemplate(product.template_type || 'quick-decision');
    
    let additionalImgs = ['', '', ''];
    try {
      const parsed = JSON.parse(product.additional_images || '[]');
      if (Array.isArray(parsed)) {
        additionalImgs = [...parsed, '', '', ''].slice(0, 3);
      }
    } catch (e) {}
    
    const parsedFormData = {
      name: product.name || '',
      description: product.description || '',
      richDescription: product.rich_description || '',
      price: product.price || '',
      imageUrl: product.image_url || '',
      additionalImages: additionalImgs,
      galleryImages: parseGalleryImages(product.gallery_images),
      stockQuantity: product.stock_quantity || 1000,
      isActive: product.is_active !== false,
      templateType: product.template_type || 'quick-decision',
      storyMedia: parseStoryMedia(product.story_media),
      storyTitle: product.story_title || 'See it in Action',
      videoUrl: product.video_url || '',
      servicePackages: parseServicePackages(product.service_packages),
      availability: product.availability_notes || product.availability || '',
      dietaryTags: product.dietary_tags || [],
      ingredients: product.ingredients || '',
      prepTime: product.prep_time || '',
      calories: product.calories || '',
      specifications: parseSpecifications(product.specifications),
      trustBadges: parseTrustBadges(product.trust_badges),
      warranty: product.warranty_info || product.warranty || '',
      returnPolicy: product.return_policy_days || product.return_policy || '',
      eventDate: product.event_date || '',
      eventLocation: product.event_location || '',
      speakers: product.speakers || '',
      privacyPolicy: product.privacy_policy || '',
      termsOfService: product.terms_of_service || '',
      refundPolicy: product.refund_policy || '',
      testimonials: parseTestimonials(product.testimonials),
    };
    
    // DEBUG: Log parsed form data
    console.log('📤 PARSED FORM DATA:', parsedFormData);
    
    setFormData(parsedFormData);
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
      await productsAPI.update(product.id, {
        ...product,
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

  const updateGalleryImage = (index, value) => {
    const newImages = [...formData.galleryImages];
    newImages[index] = value;
    setFormData({ ...formData, galleryImages: newImages });
  };

  const updateAdditionalImage = (index, value) => {
    const newImages = [...formData.additionalImages];
    newImages[index] = value;
    setFormData({ ...formData, additionalImages: newImages });
  };

  const updateServicePackage = (index, field, value) => {
    const newPackages = [...formData.servicePackages];
    newPackages[index] = { ...newPackages[index], [field]: value };
    setFormData({ ...formData, servicePackages: newPackages });
  };

  const addServicePackage = () => {
    setFormData({
      ...formData,
      servicePackages: [...formData.servicePackages, { name: '', price: '', description: '', features: [] }]
    });
  };

  const updateSpecification = (key, value) => {
    setFormData({
      ...formData,
      specifications: { ...formData.specifications, [key]: value }
    });
  };

  const addSpecification = () => {
    const key = prompt('Enter specification name (e.g., "Weight", "Material"):');
    if (key) {
      updateSpecification(key, '');
    }
  };

  const toggleDietaryTag = (tag) => {
    const current = formData.dietaryTags || [];
    if (current.includes(tag)) {
      setFormData({ ...formData, dietaryTags: current.filter(t => t !== tag) });
    } else {
      setFormData({ ...formData, dietaryTags: [...current, tag] });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      richDescription: '',
      price: '',
      imageUrl: '',
      additionalImages: ['', '', ''],
      galleryImages: ['', '', '', '', '', ''],
      stockQuantity: 1000,
      isActive: true,
      templateType: 'quick-decision',
      storyMedia: [{ url: '', type: 'image' }, { url: '', type: 'image' }, { url: '', type: 'image' }, { url: '', type: 'image' }],
      storyTitle: 'See it in Action',
      videoUrl: '',
      servicePackages: [{ name: '', price: '', description: '', features: [] }],
      availability: '',
      dietaryTags: [],
      ingredients: '',
      prepTime: '',
      calories: '',
      specifications: {},
      trustBadges: [],
      warranty: '',
      returnPolicy: '',
      eventDate: '',
      eventLocation: '',
      speakers: '',
      privacyPolicy: '',
      termsOfService: '',
      refundPolicy: '',
      testimonials: [{ name: '', role: '', quote: '', avatar: '' }],
    });
    setEditingProduct(null);
    setSelectedTemplate('quick-decision');
    setShowModal(false);
  };

  const getImageCount = (product) => {
    let count = product.image_url ? 1 : 0;
    try {
      const additional = JSON.parse(product.additional_images || '[]');
      count += additional.filter(url => url && url.trim()).length;
    } catch (e) {}
    try {
      const gallery = JSON.parse(product.gallery_images || '[]');
      count += gallery.filter(url => url && url.trim()).length;
    } catch (e) {}
    return count;
  };

  const getTemplateName = (templateType) => {
    return TEMPLATE_CONFIG[templateType]?.name || 'Quick Decision';
  };

  const currentTemplateConfig = TEMPLATE_CONFIG[selectedTemplate] || TEMPLATE_CONFIG['quick-decision'];
  const hasField = (field) => currentTemplateConfig.fields.includes(field);

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
              {/* Template Selector */}
              <div style={styles.templateSelector}>
                <label style={styles.label}>CHOOSE TEMPLATE</label>
                <p style={styles.hint}>Template determines which fields are available and how the product displays</p>
                <div style={styles.templateGrid}>
                  {Object.entries(TEMPLATE_CONFIG).map(([key, config]) => (
                    <div
                      key={key}
                      onClick={() => setSelectedTemplate(key)}
                      style={{
                        ...styles.templateCard,
                        border: selectedTemplate === key ? '2px solid #ff9f0a' : '1px solid rgba(255,255,255,0.1)',
                        background: selectedTemplate === key ? 'rgba(255, 159, 10, 0.1)' : 'rgba(255,255,255,0.03)',
                      }}
                    >
                      <div style={styles.templateCardHeader}>
                        <span style={styles.templateName}>{config.name}</span>
                        <span style={styles.templatePrice}>KES {config.price}</span>
                      </div>
                      <p style={styles.templateDesc}>{config.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Basic Fields - All Templates */}
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

              {/* Description - Quick Decision */}
              {hasField('description') && (
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
              )}

              {/* Rich Description - Portfolio, Deep-Dive, Event */}
              {hasField('richDescription') && (
                <div style={styles.formGroup}>
                  <label style={styles.label}>DETAILED DESCRIPTION (Rich Text)</label>
                  <textarea
                    value={formData.richDescription}
                    onChange={(e) => setFormData({ ...formData, richDescription: e.target.value })}
                    placeholder="Full detailed description with formatting..."
                    rows="5"
                    className="dashboard-input"
                  />
                  <p style={styles.hint}>Use line breaks for paragraphs. Supports basic formatting.</p>
                </div>
              )}

              {/* Price & Stock */}
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

              {/* Main Image - All Templates */}
              <div style={styles.formGroup}>
                <label style={styles.label}>MAIN IMAGE URL</label>
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

              {/* Additional Images - Quick Decision */}
              {hasField('additionalImages') && (
                <div style={styles.imagesSection}>
                  <label style={styles.label}>ADDITIONAL IMAGES (Up to 3)</label>
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
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Gallery Images - Portfolio, Menu, Deep-Dive, Event */}
              {hasField('galleryImages') && (
                <div style={styles.imagesSection}>
                  <label style={styles.label}>GALLERY IMAGES (Up to 6)</label>
                  <p style={styles.hint}>Create a scrollable gallery for your product</p>
                  <div style={styles.galleryGrid}>
                    {formData.galleryImages.map((img, idx) => (
                      <div key={idx} style={styles.additionalImageInput}>
                        <span style={styles.imageLabel}>Gallery {idx + 1}</span>
                        <input
                          type="url"
                          value={img}
                          onChange={(e) => updateGalleryImage(idx, e.target.value)}
                          placeholder={`https://example.com/gallery-${idx + 1}.jpg`}
                          className="dashboard-input"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Story Media - Quick Decision */}
              {hasField('storyMedia') && (
                <div style={styles.storySection}>
                  <label style={styles.label}>STORY MEDIA - Testimonials/Videos</label>
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
              )}

              {/* Video URL - Portfolio, Deep-Dive */}
              {hasField('videoUrl') && (
                <div style={styles.formGroup}>
                  <label style={styles.label}>VIDEO URL</label>
                  <input
                    type="url"
                    value={formData.videoUrl}
                    onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                    placeholder="https://youtube.com/watch?v=..."
                    className="dashboard-input"
                  />
                  <p style={styles.hint}>YouTube, Vimeo, or direct video URL</p>
                </div>
              )}

              {/* Service Packages - Portfolio */}
              {hasField('servicePackages') && (
                <div style={styles.packagesSection}>
                  <label style={styles.label}>SERVICE PACKAGES</label>
                  <p style={styles.hint}>Define different pricing tiers for your service</p>
                  
                  {formData.servicePackages.map((pkg, idx) => (
                    <div key={idx} style={styles.packageCard}>
                      <div style={styles.formRow}>
                        <input
                          type="text"
                          value={pkg.name}
                          onChange={(e) => updateServicePackage(idx, 'name', e.target.value)}
                          placeholder="Package Name (e.g., Basic)"
                          className="dashboard-input"
                        />
                        <input
                          type="number"
                          value={pkg.price}
                          onChange={(e) => updateServicePackage(idx, 'price', e.target.value)}
                          placeholder="Price (KES)"
                          className="dashboard-input"
                        />
                      </div>
                      <textarea
                        value={pkg.description}
                        onChange={(e) => updateServicePackage(idx, 'description', e.target.value)}
                        placeholder="What's included..."
                        rows="2"
                        className="dashboard-input"
                      />
                    </div>
                  ))}
                  <button type="button" onClick={addServicePackage} style={styles.addBtn}>
                    + Add Package
                  </button>
                </div>
              )}

              {/* Availability - Portfolio */}
              {hasField('availability') && (
                <div style={styles.formGroup}>
                  <label style={styles.label}>AVAILABILITY</label>
                  <input
                    type="text"
                    value={formData.availability}
                    onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                    placeholder="Mon-Fri 9am-5pm"
                    className="dashboard-input"
                  />
                </div>
              )}

              {/* Dietary Tags - Visual Menu */}
              {hasField('dietaryTags') && (
                <div style={styles.formGroup}>
                  <label style={styles.label}>DIETARY TAGS</label>
                  <div style={styles.tagsContainer}>
                    {['Vegetarian', 'Vegan', 'Gluten-Free', 'Halal', 'Spicy', 'Dairy-Free', 'Nut-Free', 'Organic'].map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleDietaryTag(tag)}
                        style={{
                          ...styles.tagBtn,
                          background: (formData.dietaryTags || []).includes(tag) ? 'rgba(48, 209, 88, 0.2)' : 'rgba(255,255,255,0.05)',
                          borderColor: (formData.dietaryTags || []).includes(tag) ? '#30d158' : 'rgba(255,255,255,0.1)',
                          color: (formData.dietaryTags || []).includes(tag) ? '#30d158' : 'rgba(255,255,255,0.7)',
                        }}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Menu-specific fields */}
              {hasField('ingredients') && (
                <div style={styles.formGroup}>
                  <label style={styles.label}>INGREDIENTS</label>
                  <textarea
                    value={formData.ingredients}
                    onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                    placeholder="List ingredients..."
                    rows="2"
                    className="dashboard-input"
                  />
                </div>
              )}

              {hasField('prepTime') && (
                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>PREP TIME</label>
                    <input
                      type="text"
                      value={formData.prepTime}
                      onChange={(e) => setFormData({ ...formData, prepTime: e.target.value })}
                      placeholder="15-20 mins"
                      className="dashboard-input"
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>CALORIES</label>
                    <input
                      type="text"
                      value={formData.calories}
                      onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                      placeholder="450 cal"
                      className="dashboard-input"
                    />
                  </div>
                </div>
              )}

              {/* Specifications - Deep-Dive */}
              {hasField('specifications') && (
                <div style={styles.specsSection}>
                  <label style={styles.label}>SPECIFICATIONS</label>
                  <p style={styles.hint}>Add technical details for informed buyers</p>
                  
                  {Object.entries(formData.specifications || {}).map(([key, value]) => (
                    <div key={key} style={styles.specRow}>
                      <span style={styles.specKey}>{key}</span>
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => updateSpecification(key, e.target.value)}
                        placeholder="Value"
                        className="dashboard-input"
                      />
                    </div>
                  ))}
                  <button type="button" onClick={addSpecification} style={styles.addBtn}>
                    + Add Specification
                  </button>
                </div>
              )}

              {/* Warranty & Return - Deep-Dive */}
              {hasField('warranty') && (
                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>WARRANTY</label>
                    <input
                      type="text"
                      value={formData.warranty}
                      onChange={(e) => setFormData({ ...formData, warranty: e.target.value })}
                      placeholder="1 Year Manufacturer Warranty"
                      className="dashboard-input"
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>RETURN POLICY</label>
                    <input
                      type="text"
                      value={formData.returnPolicy}
                      onChange={(e) => setFormData({ ...formData, returnPolicy: e.target.value })}
                      placeholder="30-day returns"
                      className="dashboard-input"
                    />
                  </div>
                </div>
              )}

              {/* Event Fields */}
              {hasField('eventDate') && (
                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>EVENT DATE</label>
                    <input
                      type="datetime-local"
                      value={formData.eventDate}
                      onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                      className="dashboard-input"
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>LOCATION</label>
                    <input
                      type="text"
                      value={formData.eventLocation}
                      onChange={(e) => setFormData({ ...formData, eventLocation: e.target.value })}
                      placeholder="Venue name, City"
                      className="dashboard-input"
                    />
                  </div>
                </div>
              )}

              {hasField('speakers') && (
                <div style={styles.formGroup}>
                  <label style={styles.label}>SPEAKERS/HOSTS</label>
                  <textarea
                    value={formData.speakers}
                    onChange={(e) => setFormData({ ...formData, speakers: e.target.value })}
                    placeholder="List speakers or hosts..."
                    rows="2"
                    className="dashboard-input"
                  />
                </div>
              )}

              {/* Testimonials - All Templates */}
              {hasField('testimonials') && (
                <div style={styles.testimonialsSection}>
                  <label style={styles.label}>CUSTOMER TESTIMONIALS</label>
                  <p style={styles.hint}>Add testimonials to build trust (displayed before footer)</p>
                  
                  {formData.testimonials.map((testimonial, idx) => (
                    <div key={idx} style={styles.testimonialCard}>
                      <div style={styles.testimonialHeader}>
                        <span style={styles.testimonialNum}>Testimonial {idx + 1}</span>
                        {formData.testimonials.length > 1 && (
                          <button 
                            type="button" 
                            onClick={() => {
                              const newTestimonials = formData.testimonials.filter((_, i) => i !== idx);
                              setFormData({ ...formData, testimonials: newTestimonials });
                            }}
                            style={styles.removeBtn}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <div style={styles.formRow}>
                        <input
                          type="text"
                          value={testimonial.name}
                          onChange={(e) => {
                            const newTestimonials = [...formData.testimonials];
                            newTestimonials[idx] = { ...newTestimonials[idx], name: e.target.value };
                            setFormData({ ...formData, testimonials: newTestimonials });
                          }}
                          placeholder="Customer Name"
                          className="dashboard-input"
                        />
                        <input
                          type="text"
                          value={testimonial.role}
                          onChange={(e) => {
                            const newTestimonials = [...formData.testimonials];
                            newTestimonials[idx] = { ...newTestimonials[idx], role: e.target.value };
                            setFormData({ ...formData, testimonials: newTestimonials });
                          }}
                          placeholder="Role/Title (optional)"
                          className="dashboard-input"
                        />
                      </div>
                      <textarea
                        value={testimonial.quote}
                        onChange={(e) => {
                          const newTestimonials = [...formData.testimonials];
                          newTestimonials[idx] = { ...newTestimonials[idx], quote: e.target.value };
                          setFormData({ ...formData, testimonials: newTestimonials });
                        }}
                        placeholder="What did they say about your product/service?"
                        rows="2"
                        className="dashboard-input"
                        style={{ marginTop: '8px' }}
                      />
                      <input
                        type="url"
                        value={testimonial.avatar}
                        onChange={(e) => {
                          const newTestimonials = [...formData.testimonials];
                          newTestimonials[idx] = { ...newTestimonials[idx], avatar: e.target.value };
                          setFormData({ ...formData, testimonials: newTestimonials });
                        }}
                        placeholder="Avatar image URL (optional)"
                        className="dashboard-input"
                        style={{ marginTop: '8px' }}
                      />
                    </div>
                  ))}
                  <button 
                    type="button" 
                    onClick={() => {
                      setFormData({
                        ...formData,
                        testimonials: [...formData.testimonials, { name: '', role: '', quote: '', avatar: '' }]
                      });
                    }}
                    style={styles.addBtn}
                  >
                    + Add Another Testimonial
                  </button>
                </div>
              )}

              {/* Preview Button */}
              {storeUrl && (
                <div style={styles.previewSection}>
                  <button
                    type="button"
                    onClick={() => {
                      if (editingProduct) {
                        viewProduct(editingProduct.id);
                      } else {
                        alert('Save the product first to preview it');
                      }
                    }}
                    style={styles.previewBtn}
                  >
                    <Eye size={18} />
                    {editingProduct ? 'Preview on Store' : 'Save first to preview'}
                  </button>
                </div>
              )}

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
                {product.template_type && product.template_type !== 'quick-decision' && (
                  <div style={styles.templateBadge}>
                    {getTemplateName(product.template_type).split(' ')[0]}
                  </div>
                )}
              </div>

              <div style={styles.cardContent}>
                <h3 style={styles.productName}>{product.name}</h3>
                <p style={styles.productDesc}>{product.description || product.rich_description || 'No description'}</p>
                
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
  modal: { width: '100%', maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto', padding: '32px' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' },
  modalTitle: { fontSize: '28px', fontWeight: '800' },
  closeBtn: { background: 'transparent', border: 'none', color: 'rgba(255, 255, 255, 0.6)', cursor: 'pointer', padding: '8px', borderRadius: '8px' },
  form: { display: 'flex', flexDirection: 'column', gap: '24px' },
  templateSelector: { padding: '20px', background: 'rgba(255, 159, 10, 0.05)', borderRadius: '16px', border: '1px solid rgba(255, 159, 10, 0.15)' },
  templateGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginTop: '12px' },
  templateCard: { padding: '16px', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s' },
  templateCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  templateName: { fontSize: '14px', fontWeight: '700', color: 'white' },
  templatePrice: { fontSize: '12px', fontWeight: '600', color: '#ff9f0a' },
  templateDesc: { fontSize: '12px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.4' },
  formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '10px' },
  label: { fontSize: '12px', fontWeight: '700', color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase', letterSpacing: '1px' },
  smallLabel: { fontSize: '11px', fontWeight: '600', color: 'rgba(255, 255, 255, 0.5)' },
  hint: { fontSize: '12px', color: 'rgba(255, 255, 255, 0.4)', marginTop: '-4px' },
  imagesSection: { display: 'flex', flexDirection: 'column', gap: '12px' },
  additionalImagesGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' },
  galleryGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' },
  additionalImageInput: { display: 'flex', flexDirection: 'column', gap: '6px' },
  imageLabel: { fontSize: '11px', fontWeight: '600', color: 'rgba(255, 159, 10, 0.8)', textTransform: 'uppercase' },
  imagePreview: { width: '100%', height: '120px', borderRadius: '8px', overflow: 'hidden', background: 'rgba(255,255,255,0.05)' },
  previewImg: { width: '100%', height: '100%', objectFit: 'cover' },
  storySection: { display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px', background: 'rgba(139, 92, 246, 0.05)', borderRadius: '12px', border: '1px solid rgba(139, 92, 246, 0.15)' },
  storyGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' },
  storyInput: { display: 'flex', flexDirection: 'column', gap: '6px' },
  typeSelect: { padding: '8px', fontSize: '12px', marginTop: '4px' },
  packagesSection: { display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px', background: 'rgba(48, 209, 88, 0.05)', borderRadius: '12px', border: '1px solid rgba(48, 209, 88, 0.15)' },
  packageCard: { padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px' },
  specsSection: { display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px', background: 'rgba(10, 132, 255, 0.05)', borderRadius: '12px', border: '1px solid rgba(10, 132, 255, 0.15)' },
  specRow: { display: 'flex', gap: '12px', alignItems: 'center' },
  specKey: { minWidth: '120px', fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
  tagsContainer: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  tagBtn: { padding: '8px 16px', borderRadius: '20px', border: '1px solid', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' },
  addBtn: { padding: '10px 20px', background: 'rgba(255,255,255,0.05)', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '8px', color: 'rgba(255,255,255,0.6)', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s' },
  testimonialsSection: { display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px', background: 'rgba(255, 159, 10, 0.05)', borderRadius: '12px', border: '1px solid rgba(255, 159, 10, 0.15)' },
  testimonialCard: { padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', marginBottom: '12px' },
  testimonialHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  testimonialNum: { fontSize: '13px', fontWeight: '600', color: '#ff9f0a' },
  removeBtn: { padding: '4px 12px', background: 'rgba(255,55,95,0.1)', border: '1px solid rgba(255,55,95,0.2)', borderRadius: '6px', color: '#ff375f', fontSize: '12px', cursor: 'pointer' },
  previewSection: { padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', textAlign: 'center' },
  previewBtn: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: 'rgba(10, 132, 255, 0.1)', border: '1px solid rgba(10, 132, 255, 0.3)', borderRadius: '10px', color: '#0a84ff', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  formActions: { display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' },
  cancelBtn: { padding: '14px 28px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: 'rgba(255, 255, 255, 0.7)', fontWeight: '600', fontSize: '15px', cursor: 'pointer' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' },
  card: { overflow: 'hidden' },
  productImage: { position: 'relative', height: '200px', background: 'rgba(255, 255, 255, 0.03)' },
  image: { width: '100%', height: '100%', objectFit: 'cover' },
  placeholder: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '64px', background: 'linear-gradient(135deg, #667eea 0%, #bf5af2 100%)' },
  badge: { position: 'absolute', top: '12px', right: '12px', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
  imageCountBadge: { position: 'absolute', bottom: '12px', left: '12px', padding: '4px 10px', borderRadius: '16px', fontSize: '12px', fontWeight: '600', background: 'rgba(0,0,0,0.6)', color: 'white', display: 'flex', alignItems: 'center', gap: '4px' },
  templateBadge: { position: 'absolute', top: '12px', left: '12px', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '600', background: 'rgba(139, 92, 246, 0.9)', color: 'white' },
  cardContent: { padding: '20px' },
  productName: { fontSize: '18px', fontWeight: '700', marginBottom: '8px' },
  productDesc: { fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '16px', lineHeight: '1.5', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' },
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
