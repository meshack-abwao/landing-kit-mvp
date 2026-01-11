import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { settingsAPI } from '../../services/api.jsx';
import { Home, Package, ShoppingCart, Settings, Zap, LogOut, Sun, Moon, Menu, X, CreditCard, User, Store, Crown, ArrowUpRight, LayoutGrid } from 'lucide-react';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [accountData, setAccountData] = useState({
    businessName: user?.business_name || '',
    instagramHandle: user?.instagram_handle || '',
    mpesaNumber: '',
  });
  const [saving, setSaving] = useState(false);

  // Auto-close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Safety reset on mount
  useEffect(() => {
    setShowAccountModal(false);
    setMobileMenuOpen(false);
    document.body.style.overflow = '';
  }, []);

  // ESC key handler
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setShowAccountModal(false);
        setMobileMenuOpen(false);
        document.body.style.overflow = '';
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = (showAccountModal || mobileMenuOpen) ? 'hidden' : '';
  }, [showAccountModal, mobileMenuOpen]);

  const loadMpesaNumber = async () => {
    try {
      const response = await settingsAPI.getAll();
      setAccountData(prev => ({
        ...prev,
        mpesaNumber: response.data.settings.mpesa_number || '',
      }));
    } catch (error) {
      console.error('Failed to load M-Pesa number:', error);
    }
  };

  const handleShowAccount = () => {
    loadMpesaNumber();
    setShowAccountModal(true);
    setMobileMenuOpen(false);
  };

  const handleSaveAccount = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await settingsAPI.update({ mpesa_number: accountData.mpesaNumber });
      alert('Account settings saved successfully!');
      setShowAccountModal(false);
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Dynamic, friendly greetings like Claude
  const getGreeting = () => {
    const hour = new Date().getHours();
    const greetings = {
      morning: [
        "Good morning! Ready to grow?",
        "Rise and shine! Let's sell.",
        "Morning! Your store awaits.",
      ],
      afternoon: [
        "Good afternoon! How's business?",
        "Afternoon check-in time!",
        "Hey there! Sales looking good?",
      ],
      evening: [
        "Good evening! Nice work today.",
        "Evening! Let's review the day.",
        "Winding down? Great progress!",
      ]
    };
    
    const period = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
    const options = greetings[period];
    return options[Math.floor(Math.random() * options.length)];
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    document.body.style.overflow = '';
  };
  
  const closeAccountModal = () => {
    setShowAccountModal(false);
    document.body.style.overflow = '';
  };

  // Navigation handler that closes mobile menu immediately
  const handleNavClick = (e) => {
    // Close menu immediately on tap
    setMobileMenuOpen(false);
    document.body.style.overflow = '';
  };

  return (
    <div className="dashboard-container">
      {/* Account Modal */}
      {showAccountModal && (
        <div style={styles.modalOverlay} onClick={closeAccountModal}>
          <div style={styles.modal} className="glass-card" onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Account & Billing</h2>
              <button onClick={closeAccountModal} style={styles.closeBtn}><X size={24} /></button>
            </div>
            <div style={styles.modalContent}>
              <div style={styles.infoBox}>
                <User size={20} style={{ color: 'var(--accent-color)' }} />
                <div>
                  <p style={styles.infoLabel}>Business Name</p>
                  <p style={styles.infoValue}>{accountData.businessName}</p>
                </div>
              </div>
              <div style={styles.infoBox}>
                <Store size={20} style={{ color: 'var(--accent-color)' }} />
                <div>
                  <p style={styles.infoLabel}>Instagram Handle</p>
                  <p style={styles.infoValue}>{accountData.instagramHandle}</p>
                </div>
              </div>
              <form onSubmit={handleSaveAccount} style={styles.modalForm}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>M-PESA NUMBER</label>
                  <input
                    type="tel"
                    value={accountData.mpesaNumber}
                    onChange={(e) => setAccountData({ ...accountData, mpesaNumber: e.target.value })}
                    placeholder="254712345678"
                    pattern="254[0-9]{9}"
                    className="dashboard-input"
                  />
                  <p style={styles.hint}>Pre-filled when purchasing add-ons</p>
                </div>
                <div style={styles.modalActions}>
                  <button type="button" onClick={closeAccountModal} style={styles.cancelBtn}>Cancel</button>
                  <button type="submit" disabled={saving} className="btn btn-primary">
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
              <div style={styles.subscriptionCard}>
                <div style={styles.subscriptionHeader}>
                  <div style={styles.crownIcon}><Crown size={24} /></div>
                  <div style={{ flex: 1 }}>
                    <h3 style={styles.subscriptionTitle}>Current Plan</h3>
                    <p style={styles.subscriptionTier}>Pro Dashboard</p>
                  </div>
                  <div style={styles.priceBox}>
                    <span style={styles.priceAmount}>KES 1,200</span>
                    <span style={styles.pricePeriod}>/month</span>
                  </div>
                </div>
                <div style={styles.subscriptionFeatures}>
                  <div style={styles.feature}><span style={styles.checkmark}>✓</span><span>Unlimited products</span></div>
                  <div style={styles.feature}><span style={styles.checkmark}>✓</span><span>Full dashboard access</span></div>
                  <div style={styles.feature}><span style={styles.checkmark}>✓</span><span>Order management</span></div>
                  <div style={styles.feature}><span style={styles.checkmark}>✓</span><span>Premium themes</span></div>
                </div>
                <button style={styles.upgradeBtn} onClick={() => { closeAccountModal(); navigate('/dashboard/marketplace'); }}>
                  <Zap size={18} /> Browse Add-Ons <ArrowUpRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Header */}
      <div className="mobile-header glass-card">
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="hamburger-btn">
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <h2 className="mobile-logo">Jari.Ecom</h2>
        <div style={{ width: '40px' }}></div>
      </div>

      {/* Mobile Overlay */}
      {mobileMenuOpen && <div className="mobile-overlay" onClick={closeMobileMenu}></div>}

      {/* Sidebar */}
      <aside className={`dashboard-sidebar glass-card ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div style={styles.logo}>
          <img src="http://jarisolutions.com/wp-content/uploads/2025/11/cropped-Jari-Business-Solutions-1.png" alt="Jari" style={styles.logoImg} />
          <div>
            <h2 style={styles.logoText}>Jari.Ecom</h2>
            <p style={styles.logoSub}>Dashboard</p>
          </div>
        </div>

        <div style={styles.userCard} className="glass-card">
          <div style={styles.avatar}>{user?.business_name?.charAt(0) || 'U'}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={styles.userName}>{user?.business_name || 'User'}</p>
            <p style={styles.userEmail}>{user?.instagram_handle || user?.email}</p>
          </div>
        </div>

        <div style={styles.greeting}>{getGreeting()}</div>

        {/* Theme Toggle with Animation */}
        <button onClick={toggleTheme} style={styles.themeToggle} className="glass-card theme-toggle-btn">
          <div className={`toggle-track ${theme === 'dark' ? 'dark' : 'light'}`}>
            <div className="toggle-thumb">
              {theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
            </div>
          </div>
          <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
        </button>

        <nav style={styles.nav}>
          <NavLink to="/dashboard" end className={({ isActive }) => isActive ? 'nav-link active-nav' : 'nav-link'} onClick={handleNavClick} onTouchStart={handleNavClick}>
            <Home size={20} /><span>Overview</span>
          </NavLink>
          <NavLink to="/dashboard/products" className={({ isActive }) => isActive ? 'nav-link active-nav' : 'nav-link'} onClick={handleNavClick} onTouchStart={handleNavClick}>
            <Package size={20} /><span>My Products</span>
          </NavLink>
          <NavLink to="/dashboard/templates" className={({ isActive }) => isActive ? 'nav-link active-nav' : 'nav-link'} onClick={handleNavClick} onTouchStart={handleNavClick}>
            <LayoutGrid size={20} /><span>Templates</span>
          </NavLink>
          <NavLink to="/dashboard/orders" className={({ isActive }) => isActive ? 'nav-link active-nav' : 'nav-link'} onClick={handleNavClick} onTouchStart={handleNavClick}>
            <ShoppingCart size={20} /><span>Orders</span>
          </NavLink>
          <NavLink to="/dashboard/marketplace" className={({ isActive }) => isActive ? 'nav-link active-nav' : 'nav-link'} onClick={handleNavClick} onTouchStart={handleNavClick}>
            <Zap size={20} /><span>Add-Ons</span>
          </NavLink>
          <button onClick={handleShowAccount} onTouchStart={handleShowAccount} className="nav-link">
            <CreditCard size={20} /><span>Account & Billing</span>
          </button>
          <NavLink to="/dashboard/settings" className={({ isActive }) => isActive ? 'nav-link active-nav' : 'nav-link'} onClick={handleNavClick} onTouchStart={handleNavClick}>
            <Settings size={20} /><span>Settings</span>
          </NavLink>
        </nav>

        <button onClick={handleLogout} style={styles.logoutBtn}>
          <LogOut size={20} /><span>Logout</span>
        </button>
      </aside>

      <main className="dashboard-main"><Outlet /></main>
      <div style={styles.bgGlow}></div>
    </div>
  );
}

const styles = {
  logo: { display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '20px', borderBottom: '1px solid var(--border-color)' },
  logoImg: { width: '48px', height: '48px', objectFit: 'contain', borderRadius: '10px' },
  logoText: { fontSize: '20px', fontWeight: '800', background: 'var(--logo-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  logoSub: { fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' },
  userCard: { display: 'flex', alignItems: 'center', gap: '12px', padding: '16px' },
  avatar: { width: '48px', height: '48px', borderRadius: '50%', background: 'var(--avatar-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '700', color: 'white', flexShrink: 0 },
  userName: { fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  userEmail: { fontSize: '13px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  greeting: { padding: '16px', background: 'var(--greeting-bg)', border: '1px solid var(--greeting-border)', borderRadius: '12px', fontSize: '13px', lineHeight: '1.5', color: 'var(--text-secondary)', fontWeight: '500' },
  themeToggle: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)', transition: 'all 0.3s', border: 'none' },
  nav: { display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 },
  logoutBtn: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '12px', background: 'rgba(220, 38, 38, 0.1)', border: '1px solid rgba(220, 38, 38, 0.2)', color: '#dc2626', fontSize: '15px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s' },
  bgGlow: { position: 'fixed', width: '800px', height: '800px', background: 'var(--glow-gradient)', top: '50%', right: '-400px', transform: 'translateY(-50%)', borderRadius: '50%', filter: 'blur(120px)', pointerEvents: 'none', zIndex: -1 },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
  modal: { width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', padding: '32px' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' },
  modalTitle: { fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)' },
  closeBtn: { background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '8px', borderRadius: '8px' },
  modalContent: { display: 'flex', flexDirection: 'column', gap: '24px' },
  modalForm: { display: 'flex', flexDirection: 'column', gap: '24px' },
  infoBox: { display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'var(--info-box-bg)', border: '1px solid var(--info-box-border)', borderRadius: '12px' },
  infoLabel: { fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  infoValue: { fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '10px' },
  label: { fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' },
  hint: { fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '-4px' },
  modalActions: { display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' },
  cancelBtn: { padding: '14px 28px', borderRadius: '12px', background: 'var(--glass-bg)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '15px', cursor: 'pointer' },
  subscriptionCard: { padding: '24px', background: 'var(--subscription-bg)', border: '2px solid var(--subscription-border)', borderRadius: '16px', marginTop: '8px' },
  subscriptionHeader: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' },
  crownIcon: { width: '56px', height: '56px', borderRadius: '16px', background: 'var(--crown-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-color)', flexShrink: 0 },
  subscriptionTitle: { fontSize: '14px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' },
  subscriptionTier: { fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' },
  priceBox: { textAlign: 'right' },
  priceAmount: { fontSize: '28px', fontWeight: '800', color: 'var(--accent-color)', display: 'block', lineHeight: '1' },
  pricePeriod: { fontSize: '14px', color: 'var(--text-muted)' },
  subscriptionFeatures: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' },
  feature: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--text-secondary)' },
  checkmark: { width: '20px', height: '20px', borderRadius: '50%', background: 'var(--checkmark-bg)', color: 'var(--checkmark-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', flexShrink: 0 },
  upgradeBtn: { width: '100%', padding: '14px 20px', borderRadius: '12px', background: 'var(--upgrade-btn-gradient)', border: 'none', color: 'white', fontSize: '15px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
};
