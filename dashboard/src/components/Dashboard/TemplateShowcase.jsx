import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api.jsx';
import { Eye, Check, ArrowRight, Sparkles, Users, ShoppingBag, Utensils, Calendar, Grid } from 'lucide-react';

const TEMPLATE_ICONS = {
  'quick-decision': ShoppingBag,
  'portfolio-booking': Users,
  'visual-menu': Utensils,
  'deep-dive': Sparkles,
  'event-landing': Calendar,
  'catalog-nav': Grid,
};

const TEMPLATE_DEMOS = {
  'quick-decision': {
    title: 'Premium Ankara Dress',
    price: 'KES 3,500',
    image: 'https://images.unsplash.com/photo-1590735213920-68192a487bc2?w=400',
    stories: ['Customer Review', 'Try-On Video', 'Styling Tips'],
  },
  'portfolio-booking': {
    title: 'Photography Session',
    price: 'From KES 15,000',
    image: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=400',
    packages: ['Basic', 'Premium', 'Exclusive'],
  },
  'visual-menu': {
    title: 'Signature Burger',
    price: 'KES 850',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
    tags: ['🌿 Vegan Option', '🔥 Spicy', '⭐ Bestseller'],
  },
  'deep-dive': {
    title: 'Smart TV 55"',
    price: 'KES 75,000',
    image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400',
    badges: ['2 Year Warranty', 'Free Delivery', 'Easy Returns'],
  },
  'event-landing': {
    title: 'Business Masterclass',
    price: 'KES 5,000',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400',
    details: ['March 15, 2026', 'Nairobi', '200 Seats'],
  },
  'catalog-nav': {
    title: 'Store Homepage',
    price: 'KES 800',
    image: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400',
    features: ['Category Filters', 'Search', 'Featured'],
  },
};

// Convert JTBD copy to customer-friendly language
const CUSTOMER_COPY = {
  'quick-decision': {
    headline: 'Turn browsers into buyers in seconds',
    subtext: 'Clean, fast pages that convert impulse shoppers',
  },
  'portfolio-booking': {
    headline: 'Showcase your work, book clients directly',
    subtext: 'Professional service pages with easy scheduling',
  },
  'visual-menu': {
    headline: 'Make mouths water, orders flow',
    subtext: 'Beautiful food displays that drive hungry customers to buy',
  },
  'deep-dive': {
    headline: 'Build trust for big purchases',
    subtext: 'Detailed specs and guarantees for high-value items',
  },
  'event-landing': {
    headline: 'Fill seats, not spreadsheets',
    subtext: 'Event pages that drive registrations effortlessly',
  },
  'catalog-nav': {
    headline: 'Help shoppers find exactly what they want',
    subtext: 'Organized homepage for stores with many products',
  },
};

export default function TemplateShowcase() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showDemo, setShowDemo] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    // Use hardcoded templates directly (backend route may not be deployed yet)
    const HARDCODED_TEMPLATES = [
      { slug: 'quick-decision', name: 'Quick Decision', price: 250, best_for: 'Fashion, accessories, beauty', features: ['Story circles', 'Quick checkout', 'Social proof'] },
      { slug: 'portfolio-booking', name: 'Portfolio + Booking', price: 500, best_for: 'Photographers, consultants', features: ['Gallery showcase', 'Service packages', 'Booking'] },
      { slug: 'visual-menu', name: 'Visual Menu', price: 600, best_for: 'Restaurants, food delivery', features: ['Dietary tags', 'Categories', 'Photo gallery'] },
      { slug: 'deep-dive', name: 'Deep Dive', price: 800, best_for: 'Electronics, luxury items', features: ['Spec tables', 'Trust badges', 'Video', 'Warranty'] },
      { slug: 'event-landing', name: 'Event Landing', price: 700, best_for: 'Events, workshops', features: ['Countdown timer', 'Speaker bios', 'RSVP'] },
      { slug: 'catalog-nav', name: 'Catalog Navigator', price: 400, best_for: 'Large catalogs', features: ['Category filters', 'Search', 'Featured'] },
    ];
    
    // Try to load from API first, fall back to hardcoded
    try {
      const response = await api.get('/templates');
      if (response.data.success && response.data.templates?.length > 0) {
        setTemplates(response.data.templates);
      } else {
        setTemplates(HARDCODED_TEMPLATES);
      }
    } catch (error) {
      // API not available, use hardcoded templates
      setTemplates(HARDCODED_TEMPLATES);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    setShowDemo(true);
  };

  const handleBuildWithTemplate = () => {
    navigate('/dashboard/products', { state: { templateType: selectedTemplate.slug } });
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading templates...</div>;
  }

  return (
    <div style={{ maxWidth: '1200px' }} className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px', color: 'var(--text-primary)' }}>
          Choose Your Template
        </h1>
        <p style={{ fontSize: '16px', color: 'var(--text-muted)', maxWidth: '500px', margin: '0 auto' }}>
          Each template is designed to turn visitors into customers. Pick the one that fits your business.
        </p>
      </div>

      {/* Demo Modal */}
      {showDemo && selectedTemplate && (
        <div style={styles.modalOverlay} onClick={() => setShowDemo(false)}>
          <div style={styles.demoModal} className="glass-card" onClick={(e) => e.stopPropagation()}>
            <div style={styles.demoHeader}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)' }}>{selectedTemplate.name}</h2>
              <button onClick={() => setShowDemo(false)} style={styles.closeBtn}>×</button>
            </div>
            
            <div style={styles.demoContent}>
              {/* Demo Preview */}
              <div style={styles.demoPreview}>
                <img 
                  src={TEMPLATE_DEMOS[selectedTemplate.slug]?.image} 
                  alt="Demo" 
                  style={styles.demoImage}
                />
                <div style={styles.demoOverlay}>
                  <p style={styles.demoTitle}>{TEMPLATE_DEMOS[selectedTemplate.slug]?.title}</p>
                  <p style={styles.demoPrice}>{TEMPLATE_DEMOS[selectedTemplate.slug]?.price}</p>
                </div>
              </div>

              {/* Template Info */}
              <div style={styles.demoInfo}>
                <p style={styles.demoHeadline}>{CUSTOMER_COPY[selectedTemplate.slug]?.headline}</p>
                <p style={styles.demoSubtext}>{CUSTOMER_COPY[selectedTemplate.slug]?.subtext}</p>
                
                <div style={styles.demoBestFor}>
                  <span style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>Perfect for:</span>
                  <span style={{ color: 'var(--text-muted)' }}>{selectedTemplate.best_for}</span>
                </div>

                <div style={styles.demoFeatures}>
                  {(selectedTemplate.features || []).map((feature, i) => (
                    <span key={i} style={styles.featureTag}>
                      <Check size={14} /> {feature}
                    </span>
                  ))}
                </div>

                <div style={styles.demoPricing}>
                  <span style={styles.demoAmount}>KES {selectedTemplate.price}</span>
                  <span style={styles.demoPeriod}>one-time</span>
                </div>

                <button onClick={handleBuildWithTemplate} className="btn btn-primary" style={styles.buildBtn}>
                  Build with this template <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Templates Grid */}
      <div style={styles.templatesGrid}>
        {templates.map((template) => {
          const Icon = TEMPLATE_ICONS[template.slug] || ShoppingBag;
          const copy = CUSTOMER_COPY[template.slug] || { headline: 'Boost your sales', subtext: 'Professional template' };
          
          return (
            <div 
              key={template.slug}
              className="template-card glass-card"
              onClick={() => handleSelectTemplate(template)}
              style={styles.templateCard}
            >
              <div style={styles.cardIcon}>
                <Icon size={28} />
              </div>
              
              <h3 style={styles.cardTitle}>{template.name}</h3>
              <p style={styles.cardHeadline}>{copy.headline}</p>
              <p style={styles.cardSubtext}>{copy.subtext}</p>
              
              <div style={styles.cardFooter}>
                <span style={styles.cardPrice}>KES {template.price}</span>
                <button style={styles.previewBtn}>
                  <Eye size={16} /> Preview
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom CTA */}
      <div style={styles.bottomCta}>
        <p style={{ color: 'var(--text-muted)', marginBottom: '12px' }}>
          Not sure which template? Start with Quick Decision - it works for most businesses.
        </p>
        <button 
          onClick={() => navigate('/dashboard/products', { state: { templateType: 'quick-decision' } })}
          className="btn btn-primary"
        >
          Start with Quick Decision <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}

const styles = {
  templatesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
    marginBottom: '40px',
  },
  templateCard: {
    padding: '28px',
    cursor: 'pointer',
    transition: 'all 0.3s',
  },
  cardIcon: {
    width: '56px',
    height: '56px',
    borderRadius: '14px',
    background: 'var(--nav-active-bg)',
    color: 'var(--accent-color)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px',
  },
  cardTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: 'var(--text-primary)',
    marginBottom: '8px',
  },
  cardHeadline: {
    fontSize: '15px',
    fontWeight: '600',
    color: 'var(--text-secondary)',
    marginBottom: '4px',
  },
  cardSubtext: {
    fontSize: '14px',
    color: 'var(--text-muted)',
    marginBottom: '16px',
    lineHeight: '1.5',
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '16px',
    borderTop: '1px solid var(--border-color)',
  },
  cardPrice: {
    fontSize: '18px',
    fontWeight: '800',
    color: 'var(--accent-color)',
  },
  previewBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    background: 'var(--glass-bg)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    color: 'var(--text-secondary)',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  bottomCta: {
    textAlign: 'center',
    padding: '32px',
    background: 'var(--glass-bg)',
    borderRadius: '16px',
    border: '1px solid var(--border-color)',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  demoModal: {
    width: '100%',
    maxWidth: '700px',
    maxHeight: '90vh',
    overflow: 'auto',
    padding: '0',
  },
  demoHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid var(--border-color)',
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    fontSize: '28px',
    color: 'var(--text-muted)',
    cursor: 'pointer',
  },
  demoContent: {
    padding: '24px',
  },
  demoPreview: {
    position: 'relative',
    borderRadius: '12px',
    overflow: 'hidden',
    marginBottom: '24px',
  },
  demoImage: {
    width: '100%',
    height: '200px',
    objectFit: 'cover',
  },
  demoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: '20px',
    background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
    color: 'white',
  },
  demoTitle: {
    fontSize: '18px',
    fontWeight: '700',
    marginBottom: '4px',
  },
  demoPrice: {
    fontSize: '22px',
    fontWeight: '800',
  },
  demoInfo: {},
  demoHeadline: {
    fontSize: '20px',
    fontWeight: '700',
    color: 'var(--text-primary)',
    marginBottom: '8px',
  },
  demoSubtext: {
    fontSize: '15px',
    color: 'var(--text-muted)',
    marginBottom: '16px',
  },
  demoBestFor: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
    fontSize: '14px',
  },
  demoFeatures: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '20px',
  },
  featureTag: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 12px',
    background: 'var(--nav-active-bg)',
    color: 'var(--accent-color)',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '600',
  },
  demoPricing: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '8px',
    marginBottom: '20px',
  },
  demoAmount: {
    fontSize: '32px',
    fontWeight: '800',
    color: 'var(--accent-color)',
  },
  demoPeriod: {
    fontSize: '14px',
    color: 'var(--text-muted)',
  },
  buildBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '16px',
    fontSize: '16px',
  },
};
