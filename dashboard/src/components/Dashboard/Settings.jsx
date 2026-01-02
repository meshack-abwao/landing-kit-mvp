import { useState, useEffect } from 'react';
import { settingsAPI } from '../../services/api.jsx';
import { Save, Check, Crown, ExternalLink } from 'lucide-react';

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [storeSettings, setStoreSettings] = useState({
    logoText: '',
    tagline: '',
    subdomain: '',
    themeColor: '',
    fontFamily: '',
    logoUrl: '',
    headerBgUrl: '',
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
      const settings = response.data.settings;
      
      console.log('Loaded settings:', settings);
      
      setStoreSettings({
        logoText: settings.logo_text || '',
        tagline: settings.tagline || '',
        subdomain: settings.subdomain || '',
        themeColor: settings.theme_color || '',
        fontFamily: settings.font_family || 'Inter',
        logoUrl: settings.logo_url || '',
        headerBgUrl: settings.header_bg_url || '',
      });

      // Set store URL for preview link
      if (settings.subdomain) {
        setStoreUrl(`http://localhost:5177?subdomain=${settings.subdomain}`);
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
      };

      console.log('Saving:', updateData);
      
      const response = await settingsAPI.update(updateData);
      console.log('Save response:', response);
      
      // Show success message with instructions
      alert('✅ Store settings saved successfully!\n\n💡 To see theme changes on your live store:\n1. Open your store in a new tab\n2. Refresh the page (Ctrl+R or Cmd+R)\n\nYour dashboard will now reload to show the changes here.');
      
      window.location.reload();
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save store settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const openStorePreview = () => {
    if (storeUrl) {
      window.open(storeUrl, '_blank');
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading settings...</div>;
  }

  return (
    <div style={styles.container} className="fade-in">
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Store Appearance</h1>
          <p style={styles.subtitle}>Customize how your store looks to customers</p>
        </div>
        {storeUrl && (
          <button onClick={openStorePreview} style={styles.previewBtn} className="btn btn-secondary">
            <ExternalLink size={18} />
            Preview Store
          </button>
        )}
      </div>

      <div style={styles.infoCard} className="glass-card">
        <div style={styles.infoIcon}>💡</div>
        <div style={styles.infoContent}>
          <h4 style={styles.infoTitle}>How Theme Changes Work</h4>
          <p style={styles.infoText}>
            After saving your theme changes, refresh your live store page to see the updates. 
            Your dashboard will reload automatically.
          </p>
        </div>
      </div>

      <form onSubmit={handleSaveStore}>
        <div style={styles.card} className="glass-card">
          <h3 style={styles.cardTitle}>Basic Information</h3>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>STORE NAME</label>
            <input
              type="text"
              value={storeSettings.logoText}
              onChange={(e) => setStoreSettings({ ...storeSettings, logoText: e.target.value })}
              placeholder="My Fashion Store"
              className="dashboard-input"
              style={styles.input}
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
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>STORE URL</label>
            <input
              type="text"
              value={storeSettings.subdomain}
              className="dashboard-input"
              disabled
              style={styles.inputDisabled}
            />
            <p style={styles.hint}>jari.ecom/{storeSettings.subdomain}</p>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>LOGO IMAGE URL <span style={styles.optional}>(Optional)</span></label>
            <input
              type="url"
              value={storeSettings.logoUrl}
              onChange={(e) => setStoreSettings({ ...storeSettings, logoUrl: e.target.value })}
              placeholder="https://example.com/your-logo.png"
              className="dashboard-input"
              style={styles.input}
            />
            <p style={styles.hint}>If provided, displays instead of store name text</p>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>HEADER BACKGROUND IMAGE <span style={styles.optional}>(Optional)</span></label>
            <input
              type="url"
              value={storeSettings.headerBgUrl}
              onChange={(e) => setStoreSettings({ ...storeSettings, headerBgUrl: e.target.value })}
              placeholder="https://example.com/header-bg.jpg"
              className="dashboard-input"
              style={styles.input}
            />
            <p style={styles.hint}>Displays behind your header with a slight blur for legibility</p>
          </div>
        </div>

        <div style={styles.card} className="glass-card">
          <h3 style={styles.cardTitle}>Choose Your Theme</h3>
          <p style={styles.cardDesc}>Select a color theme that matches your brand</p>
          
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
                <div style={{
                  ...styles.themePreview,
                  background: theme.gradient,
                }}>
                  {storeSettings.themeColor === theme.name && (
                    <div style={styles.themeCheck}>
                      <Check size={24} />
                    </div>
                  )}
                </div>
                <p style={styles.themeName}>{theme.display_name}</p>
                {theme.is_premium && (
                  <div style={styles.premiumBadge}>
                    <Crown size={12} />
                    Premium
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={styles.card} className="glass-card">
          <h3 style={styles.cardTitle}>Choose Your Font</h3>
          <p style={styles.cardDesc}>Select a font that represents your brand personality</p>
          
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
                <div style={styles.fontPreview}>
                  <p style={{ ...styles.fontSample, fontFamily: font.value }}>Aa</p>
                  {storeSettings.fontFamily === font.value && (
                    <div style={styles.fontCheck}>
                      <Check size={20} />
                    </div>
                  )}
                </div>
                <p style={styles.fontName}>{font.name}</p>
                <p style={styles.fontDesc}>{font.preview}</p>
              </div>
            ))}
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn btn-primary" style={styles.saveBtn}>
          <Save size={18} />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: { maxWidth: '1200px' },
  loading: { textAlign: 'center', padding: '40px', color: 'rgba(255, 255, 255, 0.5)' },
  header: { marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' },
  title: { fontSize: '36px', fontWeight: '800', marginBottom: '8px' },
  subtitle: { fontSize: '16px', color: 'rgba(255, 255, 255, 0.5)' },
  previewBtn: { display: 'flex', alignItems: 'center', gap: '8px' },
  infoCard: { padding: '20px', marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'flex-start', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)' },
  infoIcon: { fontSize: '32px', flexShrink: 0 },
  infoContent: { flex: 1 },
  infoTitle: { fontSize: '16px', fontWeight: '700', marginBottom: '8px', color: 'white' },
  infoText: { fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)', lineHeight: '1.5' },
  card: { padding: '32px', marginBottom: '24px' },
  cardTitle: { fontSize: '24px', fontWeight: '700', marginBottom: '8px' },
  cardDesc: { fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '24px' },
  formGroup: { marginBottom: '24px' },
  label: { fontSize: '12px', fontWeight: '700', color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px', display: 'block' },
  optional: { fontSize: '10px', fontWeight: '400', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'none' },
  input: { background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', width: '100%' },
  inputDisabled: { background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', color: 'rgba(255, 255, 255, 0.4)', cursor: 'not-allowed', width: '100%' },
  hint: { fontSize: '12px', color: 'rgba(255, 255, 255, 0.4)', fontStyle: 'italic', marginTop: '8px' },
  themesGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '20px' },
  themeCard: { padding: '20px', cursor: 'pointer', transition: 'all 0.3s', textAlign: 'center' },
  themePreview: { height: '120px', borderRadius: '16px', marginBottom: '16px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  themeCheck: { width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.95)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  themeName: { fontSize: '16px', fontWeight: '700', marginBottom: '8px' },
  premiumBadge: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'rgba(255, 159, 10, 0.2)', color: '#ff9f0a', borderRadius: '12px', fontSize: '12px', fontWeight: '700', marginTop: '8px' },
  fontsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px' },
  fontCard: { padding: '20px', cursor: 'pointer', transition: 'all 0.3s', textAlign: 'center' },
  fontPreview: { height: '100px', borderRadius: '12px', marginBottom: '12px', background: 'rgba(255, 255, 255, 0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  fontSample: { fontSize: '48px', fontWeight: '700', margin: 0, color: 'white' },
  fontCheck: { position: 'absolute', top: '8px', right: '8px', width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.9)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  fontName: { fontSize: '14px', fontWeight: '700', marginBottom: '4px' },
  fontDesc: { fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' },
  saveBtn: { display: 'flex', alignItems: 'center', gap: '8px' },
};
