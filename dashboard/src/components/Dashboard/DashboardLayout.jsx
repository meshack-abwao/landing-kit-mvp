import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { settingsAPI } from '../../services/api.jsx';
import { Home, Package, ShoppingCart, Settings, Zap, LogOut, Sun, Moon, Menu, X, CreditCard, User, Store, Crown, ArrowUpRight } from 'lucide-react';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [accountData, setAccountData] = useState({
    businessName: user?.business_name || '',
    instagramHandle: user?.instagram_handle || '',
    mpesaNumber: '',
  });
  const [saving, setSaving] = useState(false);

  // **FIX: Safety reset on mount to prevent stuck overlay**
  useEffect(() => {
    // Force close any stuck modals on component mount
    setShowAccountModal(false);
    setMobileMenuOpen(false);
    document.body.style.overflow = ''; // Reset body scroll
  }, []);

  // **FIX: ESC key handler to close modals**
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

  // **FIX: Lock body scroll when modal is open**
  useEffect(() => {
    if (showAccountModal || mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
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
      await settingsAPI.update({
        mpesa_number: accountData.mpesaNumber,
      });
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    
    if (hour < 12) {
      return "Let's review what's working!";
    } else if (hour < 17) {
      return "Time to boost conversion rates.";
    } else {
      return "Let's see today's progress.";
    }
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // **FIX: Force close modal handler with safety checks**
  const closeAccountModal = () => {
    setShowAccountModal(false);
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
              <button onClick={closeAccountModal} style={styles.closeBtn}>
                <X size={24} />
              </button>
            </div>

            <div style={styles.modalContent}>
              {/* Business Info */}
              <div style={styles.infoBox}>
                <User size={20} style={{ color: '#8b5cf6' }} />
                <div>
                  <p style={styles.infoLabel}>Business Name</p>
                  <p style={styles.infoValue}>{accountData.businessName}</p>
                </div>
              </div>

              <div style={styles.infoBox}>
                <Store size={20} style={{ color: '#8b5cf6' }} />
                <div>
                  <p style={styles.infoLabel}>Instagram Handle</p>
                  <p style={styles.infoValue}>{accountData.instagramHandle}</p>
                </div>
              </div>

              {/* M-Pesa Form */}
              <form onSubmit={handleSaveAccount} style={styles.modalForm}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>M-PESA NUMBER (FOR ADD-ON PAYMENTS)</label>
                  <input
                    type="tel"
                    value={accountData.mpesaNumber}
                    onChange={(e) => setAccountData({ ...accountData, mpesaNumber: e.target.value })}
                    placeholder="254712345678"
                    pattern="254[0-9]{9}"
                    className="dashboard-input"
                    style={styles.input}
                  />
                  <p style={styles.hint}>Pre-filled when purchasing add-ons</p>
                </div>

                <div style={styles.modalActions}>
                  <button type="button" onClick={closeAccountModal} style={styles.cancelBtn}>
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className="btn btn-primary">
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>

              {/* Subscription Card */}
              <div style={styles.subscriptionCard}>
                <div style={styles.subscriptionHeader}>
                  <div style={styles.crownIcon}>
                    <Crown size={24} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={styles.subscriptionTitle}>Current Plan</h3>
                    <p style={styles.subscriptionTier}>Tier 2 - Dashboard</p>
                  </div>
                  <div style={styles.priceBox}>
                    <span style={styles.priceAmount}>KES 1,200</span>
                    <span style={styles.pricePeriod}>/month</span>
                  </div>
                </div>

                <div style={styles.subscriptionFeatures}>
                  <div style={styles.feature}>
                    <span style={styles.checkmark}>✓</span>
                    <span>Unlimited products</span>
                  </div>
                  <div style={styles.feature}>
                    <span style={styles.checkmark}>✓</span>
                    <span>Full dashboard access</span>
                  </div>
                  <div style={styles.feature}>
                    <span style={styles.checkmark}>✓</span>
                    <span>Order management</span>
                  </div>
                  <div style={styles.feature}>
                    <span style={styles.checkmark}>✓</span>
                    <span>Premium themes available</span>
                  </div>
                </div>

                <button style={styles.upgradeBtn} onClick={() => navigate('/dashboard/marketplace')}>
                  <Zap size={18} />
                  Browse Add-Ons
                  <ArrowUpRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mobile-header glass-card">
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="hamburger-btn">
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <h2 className="mobile-logo">Jari.Ecom</h2>
        <div style={{ width: '40px' }}></div>
      </div>

      {mobileMenuOpen && (
        <div className="mobile-overlay" onClick={closeMobileMenu}></div>
      )}

      <aside className={`dashboard-sidebar glass-card ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>🛍️</div>
          <div>
            <h2 style={styles.logoText}>Jari.Ecom</h2>
            <p style={styles.logoSub}>Dashboard</p>
          </div>
        </div>

        <div style={styles.userCard} className="glass-card">
          <div style={styles.avatar}>
            {user?.business_name?.charAt(0) || 'U'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={styles.userName}>{user?.business_name || 'User'}</p>
            <p style={styles.userEmail}>{user?.instagram_handle || user?.email}</p>
          </div>
        </div>

        <div style={styles.greeting}>
          {getGreeting()}
        </div>

        <button onClick={toggleTheme} style={styles.themeToggle} className="glass-card">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>

        <nav style={styles.nav}>
          <NavLink to="/dashboard" end style={styles.navLink} className={({ isActive }) => isActive ? 'active-nav' : ''} onClick={closeMobileMenu}>
            <Home size={20} />
            <span>Overview</span>
          </NavLink>

          <NavLink to="/dashboard/products" style={styles.navLink} className={({ isActive }) => isActive ? 'active-nav' : ''} onClick={closeMobileMenu}>
            <Package size={20} />
            <span>My Pages</span>
          </NavLink>

          <NavLink to="/dashboard/orders" style={styles.navLink} className={({ isActive }) => isActive ? 'active-nav' : ''} onClick={closeMobileMenu}>
            <ShoppingCart size={20} />
            <span>Orders</span>
          </NavLink>

          <NavLink to="/dashboard/marketplace" style={styles.navLink} className={({ isActive }) => isActive ? 'active-nav' : ''} onClick={closeMobileMenu}>
            <Zap size={20} />
            <span>Add-Ons</span>
          </NavLink>

          <button onClick={handleShowAccount} style={styles.navLink}>
            <CreditCard size={20} />
            <span>Account & Billing</span>
          </button>

          <NavLink to="/dashboard/settings" style={styles.navLink} className={({ isActive }) => isActive ? 'active-nav' : ''} onClick={closeMobileMenu}>
            <Settings size={20} />
            <span>Settings</span>
          </NavLink>
        </nav>

        <button onClick={handleLogout} style={styles.logoutBtn}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </aside>

      <main className="dashboard-main">
        <Outlet />
      </main>

      <div style={styles.bgGlow}></div>
    </div>
  );
}

const styles = {
  logo: { display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '20px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' },
  logoIcon: { fontSize: '32px' },
  logoText: { fontSize: '20px', fontWeight: '800', background: 'linear-gradient(135deg, #ff9f0a 0%, #ff375f 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  logoSub: { fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' },
  userCard: { display: 'flex', alignItems: 'center', gap: '12px', padding: '16px' },
  avatar: { width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #ff9f0a 0%, #bf5af2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '700', color: 'white', flexShrink: 0 },
  userName: { fontSize: '15px', fontWeight: '600', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  userEmail: { fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  greeting: { padding: '16px', background: 'rgba(255, 159, 10, 0.1)', border: '1px solid rgba(255, 159, 10, 0.2)', borderRadius: '12px', fontSize: '13px', lineHeight: '1.5', color: 'rgba(255, 255, 255, 0.8)', fontWeight: '500' },
  themeToggle: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '12px', borderRadius: '12px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: 'white', transition: 'all 0.3s', border: 'none' },
  nav: { display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 },
  navLink: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '12px', color: 'rgba(255, 255, 255, 0.6)', textDecoration: 'none', fontSize: '15px', fontWeight: '600', transition: 'all 0.3s', background: 'transparent', border: 'none', width: '100%', cursor: 'pointer' },
  logoutBtn: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '12px', background: 'rgba(255, 55, 95, 0.1)', border: '1px solid rgba(255, 55, 95, 0.2)', color: '#ff375f', fontSize: '15px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s' },
  bgGlow: { position: 'fixed', width: '800px', height: '800px', background: 'radial-gradient(circle, rgba(255, 159, 10, 0.08) 0%, transparent 70%)', top: '50%', right: '-400px', transform: 'translateY(-50%)', borderRadius: '50%', filter: 'blur(120px)', pointerEvents: 'none' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
  modal: { width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', padding: '32px' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' },
  modalTitle: { fontSize: '28px', fontWeight: '800' },
  closeBtn: { background: 'transparent', border: 'none', color: 'rgba(255, 255, 255, 0.6)', cursor: 'pointer', padding: '8px', borderRadius: '8px', transition: 'all 0.3s' },
  modalContent: { display: 'flex', flexDirection: 'column', gap: '24px' },
  modalForm: { display: 'flex', flexDirection: 'column', gap: '24px' },
  infoBox: { display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.15)', borderRadius: '12px' },
  infoLabel: { fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  infoValue: { fontSize: '16px', fontWeight: '600', color: 'white' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '10px' },
  label: { fontSize: '12px', fontWeight: '700', color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase', letterSpacing: '1px' },
  input: { background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)' },
  hint: { fontSize: '12px', color: 'rgba(255, 255, 255, 0.4)', fontStyle: 'italic', marginTop: '-4px' },
  modalActions: { display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' },
  cancelBtn: { padding: '14px 28px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: 'rgba(255, 255, 255, 0.7)', fontWeight: '600', fontSize: '15px', cursor: 'pointer', transition: 'all 0.3s' },
  subscriptionCard: { padding: '24px', background: 'rgba(255, 159, 10, 0.05)', border: '2px solid rgba(255, 159, 10, 0.2)', borderRadius: '16px', marginTop: '8px' },
  subscriptionHeader: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' },
  crownIcon: { width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(255, 159, 10, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff9f0a', flexShrink: 0 },
  subscriptionTitle: { fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' },
  subscriptionTier: { fontSize: '20px', fontWeight: '700', color: 'white' },
  priceBox: { textAlign: 'right' },
  priceAmount: { fontSize: '28px', fontWeight: '800', color: '#ff9f0a', display: 'block', lineHeight: '1' },
  pricePeriod: { fontSize: '14px', color: 'rgba(255, 255, 255, 0.5)' },
  subscriptionFeatures: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' },
  feature: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'rgba(255, 255, 255, 0.8)' },
  checkmark: { width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(48, 209, 88, 0.2)', color: '#30d158', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', flexShrink: 0 },
  upgradeBtn: { width: '100%', padding: '14px 20px', borderRadius: '12px', background: 'linear-gradient(135deg, #ff9f0a 0%, #ff375f 100%)', border: 'none', color: 'white', fontSize: '15px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.3s' },
};
