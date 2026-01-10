import { useState, useEffect } from 'react';
import { settingsAPI } from '../../services/api.jsx';
import { Save, Check, Crown, ExternalLink, ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';

// Parse testimonials from database
const parseTestimonials = (data) => {
  const defaultTestimonials = [{ quote: '', name: '', role: '', avatar: '' }];
  try {
    if (Array.isArray(data)) return data.length > 0 ? data : defaultTestimonials;
    if (typeof data === 'string') {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultTestimonials;
    }
  } catch (e) {
    console.log('parseTestimonials error:', e);
  }
  return defaultTestimonials;
};

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    hero: false,
    testimonials: false,
    policies: false,
    theme: true,
  });
  
  const [storeSettings, setStoreSettings] = useState({
    // Basic
    logoText: '',
    tagline: '',
    subdomain: '',
    themeColor: '',
    fontFamily: '',
    logoUrl: '',
    headerBgUrl: '',
    // Hero
    heroBgType: 'gradient',
    heroBgImage: '',
    heroBgGradient: '',
    heroPhotoUrl: '',
    heroTitle: '',
    heroSubtitle: '',
    heroCtaPrimaryText: '',
    heroCtaPrimaryLink: '',
    heroCtaSecondaryText: '',
    heroCtaSecondaryLink: '',
    // Testimonials (array for multiple)
    showTestimonials: true,
    collectionTestimonials: [{ quote: '', name: '', role: '', avatar: '' }],
    // Policies
    privacyPolicy: '',
    termsOfService: '',
    refundPolicy: '',
  });
  const [themes, setThemes] = useState([]);
  const [storeUrl, setStoreUrl] = useState('');

  const fontOptions = [
    { value: 'Inter', name: 'Inter', preview: 'Modern & Clean' },
    { value: 'Poppins', name: 'Poppins', preview: 'Bold & Friendly' },
    { value: 'Roboto', name: 'Roboto', preview: 'Classic' },
    { value: 'Montserrat', name: 'Montserrat', preview: 'Elegant' },
    { value: 'Playfair Display', name: 'Playfair', preview: 'Luxury Serif' },
    { value: 'Space Grotesk', name: 'Space Grotesk', preview: 'Tech Modern' },
  ];

  useEffect(() => {
    loadSettings();
    loadThemes();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await settingsAPI.getAll();
      const s = response.data.settings;
      
      console.log('Loaded settings:', s);
      
      setStoreSettings({
        logoText: s.logo_text || '',
        tagline: s.tagline || '',
        subdomain: s.subdomain || '',
        themeColor: s.theme_color || '',
        fontFamily: s.font_family || 'Inter',
        logoUrl: s.logo_url || '',
        headerBgUrl: s.header_bg_url || '',
        // Hero
        heroBgType: s.hero_bg_type || 'gradient',
        heroBgImage: s.hero_bg_image || '',
        heroBgGradient: s.hero_bg_gradient || '',
        heroPhotoUrl: s.hero_photo_url || '',
        heroTitle: s.hero_title || '',
        heroSubtitle: s.hero_subtitle || '',
        heroCtaPrimaryText: s.hero_cta_primary_text || '',
        heroCtaPrimaryLink: s.hero_cta_primary_link || '',
        heroCtaSecondaryText: s.hero_cta_secondary_text || '',
        heroCtaSecondaryLink: s.hero_cta_secondary_link || '',
        // Testimonials (array)
        showTestimonials: s.show_testimonials !== false,
        collectionTestimonials: parseTestimonials(s.collection_testimonials),
        // Policies
        privacyPolicy: s.privacy_policy || '',
        termsOfService: s.terms_of_service || '',
        refundPolicy: s.refund_policy || '',
      });

      if (s.subdomain) {
        const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:5177' : 'https://jariecomstore.netlify.app';
        setStoreUrl(`${baseUrl}?subdomain=${s.subdomain}`);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadThemes = async () => {
    try {
      const response = await settingsAPI.getThemes();
      setThemes(response.data.themes);
    } catch (error) {
      console.error('Failed to load themes:', error);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleSaveStore = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updateData = {
        logo_text: storeSettings.logoText,
        tagline: storeSettings.tagline,
        theme_color: storeSettings.themeColor,
        font_family: storeSettings.fontFamily,
        logo_url: storeSettings.logoUrl,
        header_bg_url: storeSettings.headerBgUrl,
        // Hero
        hero_bg_type: storeSettings.heroBgType,
        hero_bg_image: storeSettings.heroBgImage,
        hero_bg_gradient: storeSettings.heroBgGradient,
        hero_photo_url: storeSettings.heroPhotoUrl,
        hero_title: storeSettings.heroTitle,
        hero_subtitle: storeSettings.heroSubtitle,
        hero_cta_primary_text: storeSettings.heroCtaPrimaryText,
        hero_cta_primary_link: storeSettings.heroCtaPrimaryLink,
        hero_cta_secondary_text: storeSettings.heroCtaSecondaryText,
        hero_cta_secondary_link: storeSettings.heroCtaSecondaryLink,
        // Testimonials (array) - filter empty ones but keep at least one if any have data
        show_testimonials: storeSettings.showTestimonials,
        collection_testimonials: storeSettings.collectionTestimonials.filter(t => t.quote?.trim() || t.name?.trim()),
        // Policies
        privacy_policy: storeSettings.privacyPolicy,
        terms_of_service: storeSettings.termsOfService,
        refund_policy: storeSettings.refundPolicy,
      };

      console.log('Saving:', updateData);
      await settingsAPI.update(updateData);
      
      alert('✅ Settings saved! Refresh your store to see changes.');
      window.location.reload();
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading settings...</div>;
  }

  return (
    <div style={styles.container} className="fade-in">
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Store Settings</h1>
          <p style={styles.subtitle}>Customize your store appearance and content</p>
        </div>
        {storeUrl && (
          <button onClick={() => window.open(storeUrl, '_blank')} style={styles.previewBtn} className="btn btn-secondary">
            <ExternalLink size={18} />
            Preview Store
          </button>
        )}
      </div>

      <form onSubmit={handleSaveStore}>
        {/* BASIC INFORMATION */}
        <div style={styles.card} className="glass-card">
          <div style={styles.sectionHeader} onClick={() => toggleSection('basic')}>
            <h3 style={styles.cardTitle}>📝 Basic Information</h3>
            {expandedSections.basic ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
          
          {expandedSections.basic && (
            <div style={styles.sectionContent}>
              <div style={styles.formGroup}>
                <label style={styles.label}>STORE NAME</label>
                <input
                  type="text"
                  value={storeSettings.logoText}
                  onChange={(e) => setStoreSettings({ ...storeSettings, logoText: e.target.value })}
                  placeholder="My Fashion Store"
                  className="dashboard-input"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>TAGLINE</label>
                <input
                  type="text"
                  value={storeSettings.tagline}
                  onChange={(e) => setStoreSettings({ ...storeSettings, tagline: e.target.value })}
                  placeholder="Premium fashion for everyone"
                  className="dashboard-input"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>STORE URL</label>
                <input type="text" value={storeSettings.subdomain} disabled className="dashboard-input" style={styles.inputDisabled} />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>LOGO IMAGE URL <span style={styles.optional}>(Optional)</span></label>
                <input
                  type="url"
                  value={storeSettings.logoUrl}
                  onChange={(e) => setStoreSettings({ ...storeSettings, logoUrl: e.target.value })}
                  placeholder="https://example.com/logo.png"
                  className="dashboard-input"
                />
              </div>
            </div>
          )}
        </div>

        {/* HERO SECTION */}
        <div style={styles.card} className="glass-card">
          <div style={styles.sectionHeader} onClick={() => toggleSection('hero')}>
            <h3 style={styles.cardTitle}>🎨 Hero Section</h3>
            {expandedSections.hero ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
          
          {expandedSections.hero && (
            <div style={styles.sectionContent}>
              <div style={styles.formGroup}>
                <label style={styles.label}>HERO TITLE</label>
                <input
                  type="text"
                  value={storeSettings.heroTitle}
                  onChange={(e) => setStoreSettings({ ...storeSettings, heroTitle: e.target.value })}
                  placeholder="Your main headline"
                  className="dashboard-input"
                />
                <p style={styles.hint}>Defaults to store name if empty</p>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>HERO SUBTITLE</label>
                <input
                  type="text"
                  value={storeSettings.heroSubtitle}
                  onChange={(e) => setStoreSettings({ ...storeSettings, heroSubtitle: e.target.value })}
                  placeholder="Your tagline or description"
                  className="dashboard-input"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>PROFILE PHOTO URL</label>
                <input
                  type="url"
                  value={storeSettings.heroPhotoUrl}
                  onChange={(e) => setStoreSettings({ ...storeSettings, heroPhotoUrl: e.target.value })}
                  placeholder="https://example.com/photo.jpg"
                  className="dashboard-input"
                />
                <p style={styles.hint}>Circular photo displayed in hero section</p>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>HERO BACKGROUND IMAGE URL</label>
                <input
                  type="url"
                  value={storeSettings.headerBgUrl}
                  onChange={(e) => setStoreSettings({ ...storeSettings, headerBgUrl: e.target.value })}
                  placeholder="https://example.com/background.jpg"
                  className="dashboard-input"
                />
                <p style={styles.hint}>Full-width background image for header (with blur overlay)</p>
                {storeSettings.headerBgUrl && (
                  <div style={{ marginTop: '12px', borderRadius: '8px', overflow: 'hidden', height: '100px' }}>
                    <img 
                      src={storeSettings.headerBgUrl} 
                      alt="Preview" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.7) blur(1px)' }}
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  </div>
                )}
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>PRIMARY CTA TEXT</label>
                  <input
                    type="text"
                    value={storeSettings.heroCtaPrimaryText}
                    onChange={(e) => setStoreSettings({ ...storeSettings, heroCtaPrimaryText: e.target.value })}
                    placeholder="Shop Now"
                    className="dashboard-input"
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>PRIMARY CTA LINK</label>
                  <input
                    type="text"
                    value={storeSettings.heroCtaPrimaryLink}
                    onChange={(e) => setStoreSettings({ ...storeSettings, heroCtaPrimaryLink: e.target.value })}
                    placeholder="#products or URL"
                    className="dashboard-input"
                  />
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>SECONDARY CTA TEXT</label>
                  <input
                    type="text"
                    value={storeSettings.heroCtaSecondaryText}
                    onChange={(e) => setStoreSettings({ ...storeSettings, heroCtaSecondaryText: e.target.value })}
                    placeholder="Contact Me"
                    className="dashboard-input"
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>SECONDARY CTA LINK</label>
                  <input
                    type="text"
                    value={storeSettings.heroCtaSecondaryLink}
                    onChange={(e) => setStoreSettings({ ...storeSettings, heroCtaSecondaryLink: e.target.value })}
                    placeholder="https://wa.me/254..."
                    className="dashboard-input"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* TESTIMONIALS - Multiple */}
        <div style={styles.card} className="glass-card">
          <div style={styles.sectionHeader} onClick={() => toggleSection('testimonials')}>
            <h3 style={styles.cardTitle}>⭐ Collection Testimonials</h3>
            {expandedSections.testimonials ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
          
          {expandedSections.testimonials && (
            <div style={styles.sectionContent}>
              <p style={styles.hint}>These testimonials appear on your collection page (before footer)</p>
              
              <div style={styles.formGroup}>
                <label style={styles.toggleLabel}>
                  <input
                    type="checkbox"
                    checked={storeSettings.showTestimonials}
                    onChange={(e) => setStoreSettings({ ...storeSettings, showTestimonials: e.target.checked })}
                    style={styles.checkbox}
                  />
                  <span>Show testimonials section</span>
                </label>
              </div>

              {storeSettings.showTestimonials && (
                <>
                  {storeSettings.collectionTestimonials.map((testimonial, idx) => (
                    <div key={idx} style={styles.testimonialCard}>
                      <div style={styles.testimonialHeader}>
                        <span style={styles.testimonialNum}>Testimonial {idx + 1}</span>
                        {storeSettings.collectionTestimonials.length > 1 && (
                          <button 
                            type="button" 
                            onClick={() => {
                              const newTestimonials = storeSettings.collectionTestimonials.filter((_, i) => i !== idx);
                              setStoreSettings({ ...storeSettings, collectionTestimonials: newTestimonials });
                            }}
                            style={styles.removeBtn}
                          >
                            <Trash2 size={16} /> Remove
                          </button>
                        )}
                      </div>
                      
                      <div style={styles.formGroup}>
                        <label style={styles.label}>TESTIMONIAL TEXT</label>
                        <textarea
                          value={testimonial.quote}
                          onChange={(e) => {
                            const newTestimonials = [...storeSettings.collectionTestimonials];
                            newTestimonials[idx] = { ...newTestimonials[idx], quote: e.target.value };
                            setStoreSettings({ ...storeSettings, collectionTestimonials: newTestimonials });
                          }}
                          placeholder="Amazing products! Fast delivery and great quality..."
                          rows={2}
                          className="dashboard-input"
                          style={styles.textarea}
                        />
                      </div>

                      <div style={styles.formRow}>
                        <div style={styles.formGroup}>
                          <label style={styles.label}>CUSTOMER NAME</label>
                          <input
                            type="text"
                            value={testimonial.name}
                            onChange={(e) => {
                              const newTestimonials = [...storeSettings.collectionTestimonials];
                              newTestimonials[idx] = { ...newTestimonials[idx], name: e.target.value };
                              setStoreSettings({ ...storeSettings, collectionTestimonials: newTestimonials });
                            }}
                            placeholder="Sarah M."
                            className="dashboard-input"
                          />
                        </div>
                        <div style={styles.formGroup}>
                          <label style={styles.label}>ROLE/DETAIL</label>
                          <input
                            type="text"
                            value={testimonial.role}
                            onChange={(e) => {
                              const newTestimonials = [...storeSettings.collectionTestimonials];
                              newTestimonials[idx] = { ...newTestimonials[idx], role: e.target.value };
                              setStoreSettings({ ...storeSettings, collectionTestimonials: newTestimonials });
                            }}
                            placeholder="Verified Buyer"
                            className="dashboard-input"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <button 
                    type="button" 
                    onClick={() => {
                      setStoreSettings({
                        ...storeSettings,
                        collectionTestimonials: [...storeSettings.collectionTestimonials, { quote: '', name: '', role: '', avatar: '' }]
                      });
                    }}
                    style={styles.addBtn}
                  >
                    <Plus size={16} /> Add Another Testimonial
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* POLICIES */}
        <div style={styles.card} className="glass-card">
          <div style={styles.sectionHeader} onClick={() => toggleSection('policies')}>
            <h3 style={styles.cardTitle}>📋 Store Policies</h3>
            {expandedSections.policies ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
          
          {expandedSections.policies && (
            <div style={styles.sectionContent}>
              <div style={styles.formGroup}>
                <label style={styles.label}>PRIVACY POLICY</label>
                <textarea
                  value={storeSettings.privacyPolicy}
                  onChange={(e) => setStoreSettings({ ...storeSettings, privacyPolicy: e.target.value })}
                  placeholder="Your privacy policy text..."
                  rows={5}
                  className="dashboard-input"
                  style={styles.textarea}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>TERMS OF SERVICE</label>
                <textarea
                  value={storeSettings.termsOfService}
                  onChange={(e) => setStoreSettings({ ...storeSettings, termsOfService: e.target.value })}
                  placeholder="Your terms of service..."
                  rows={5}
                  className="dashboard-input"
                  style={styles.textarea}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>REFUND POLICY</label>
                <textarea
                  value={storeSettings.refundPolicy}
                  onChange={(e) => setStoreSettings({ ...storeSettings, refundPolicy: e.target.value })}
                  placeholder="Your refund and return policy..."
                  rows={5}
                  className="dashboard-input"
                  style={styles.textarea}
                />
              </div>
            </div>
          )}
        </div>

        {/* THEME SELECTION */}
        <div style={styles.card} className="glass-card">
          <div style={styles.sectionHeader} onClick={() => toggleSection('theme')}>
            <h3 style={styles.cardTitle}>🎨 Theme & Font</h3>
            {expandedSections.theme ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
          
          {expandedSections.theme && (
            <div style={styles.sectionContent}>
              <p style={styles.cardDesc}>Select a color theme for your store</p>
              
              <div style={styles.themesGrid}>
                {themes.map((theme) => (
                  <div
                    key={theme.id}
                    onClick={() => setStoreSettings({ ...storeSettings, themeColor: theme.name })}
                    style={{
                      ...styles.themeCard,
                      border: storeSettings.themeColor === theme.name ? '2px solid #8b5cf6' : '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                    className="glass-card"
                  >
                    <div style={{ ...styles.themePreview, background: theme.gradient }}>
                      {storeSettings.themeColor === theme.name && (
                        <div style={styles.themeCheck}><Check size={24} /></div>
                      )}
                    </div>
                    <p style={styles.themeName}>{theme.display_name}</p>
                    {theme.is_premium && (
                      <div style={styles.premiumBadge}><Crown size={12} /> Premium</div>
                    )}
                  </div>
                ))}
              </div>

              <h4 style={{ ...styles.cardTitle, marginTop: '24px', fontSize: '18px' }}>Choose Font</h4>
              <div style={styles.fontsGrid}>
                {fontOptions.map((font) => (
                  <div
                    key={font.value}
                    onClick={() => setStoreSettings({ ...storeSettings, fontFamily: font.value })}
                    style={{
                      ...styles.fontCard,
                      border: storeSettings.fontFamily === font.value ? '2px solid #8b5cf6' : '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                    className="glass-card"
                  >
                    <p style={{ ...styles.fontSample, fontFamily: font.value }}>Aa</p>
                    <p style={styles.fontName}>{font.name}</p>
                    <p style={styles.fontDesc}>{font.preview}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <button type="submit" disabled={saving} className="btn btn-primary" style={styles.saveBtn}>
          <Save size={18} />
          {saving ? 'Saving...' : 'Save All Settings'}
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: { maxWidth: '1200px' },
  loading: { textAlign: 'center', padding: '40px', color: 'rgba(255, 255, 255, 0.5)' },
  header: { marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' },
  title: { fontSize: '36px', fontWeight: '800', marginBottom: '8px' },
  subtitle: { fontSize: '16px', color: 'rgba(255, 255, 255, 0.5)' },
  previewBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: 'rgba(255, 159, 10, 0.1)', border: '1px solid rgba(255, 159, 10, 0.3)', borderRadius: '12px', color: '#ff9f0a', cursor: 'pointer' },
  card: { padding: '24px', marginBottom: '20px' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: '8px' },
  sectionContent: { paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', marginTop: '16px' },
  cardTitle: { fontSize: '20px', fontWeight: '700', margin: 0 },
  cardDesc: { fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '20px' },
  formGroup: { marginBottom: '20px' },
  formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  label: { fontSize: '12px', fontWeight: '700', color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px', display: 'block' },
  optional: { fontSize: '10px', fontWeight: '400', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'none' },
  inputDisabled: { background: 'rgba(255, 255, 255, 0.03)', color: 'rgba(255, 255, 255, 0.4)', cursor: 'not-allowed' },
  hint: { fontSize: '12px', color: 'rgba(255, 255, 255, 0.4)', fontStyle: 'italic', marginTop: '6px' },
  textarea: { resize: 'vertical', minHeight: '80px' },
  toggleLabel: { display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '15px' },
  checkbox: { width: '20px', height: '20px', cursor: 'pointer' },
  themesGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px' },
  themeCard: { padding: '16px', cursor: 'pointer', transition: 'all 0.3s', textAlign: 'center' },
  themePreview: { height: '80px', borderRadius: '12px', marginBottom: '12px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  themeCheck: { width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.95)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  themeName: { fontSize: '14px', fontWeight: '600', marginBottom: '4px' },
  premiumBadge: { display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', background: 'rgba(255, 159, 10, 0.2)', color: '#ff9f0a', borderRadius: '8px', fontSize: '11px', fontWeight: '600' },
  fontsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px' },
  fontCard: { padding: '16px', cursor: 'pointer', transition: 'all 0.3s', textAlign: 'center' },
  fontSample: { fontSize: '32px', fontWeight: '700', marginBottom: '8px' },
  fontName: { fontSize: '13px', fontWeight: '600', marginBottom: '2px' },
  fontDesc: { fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' },
  saveBtn: { display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' },
  // Testimonial styles
  testimonialCard: { padding: '16px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', marginBottom: '16px' },
  testimonialHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  testimonialNum: { fontSize: '14px', fontWeight: '600', color: 'rgba(255, 255, 255, 0.7)' },
  removeBtn: { display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'rgba(255, 55, 95, 0.1)', border: '1px solid rgba(255, 55, 95, 0.2)', borderRadius: '8px', color: '#ff375f', fontSize: '13px', cursor: 'pointer' },
  addBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '12px', background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)', borderRadius: '10px', color: '#8b5cf6', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
};
