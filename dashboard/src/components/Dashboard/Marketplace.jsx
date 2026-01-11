import { useState, useEffect } from 'react';
import { settingsAPI } from '../../services/api.jsx';
import { Check, Zap, X, ChevronDown, ChevronUp, TrendingUp, Users, MessageCircle, Instagram, Video, Gift, BarChart3, Star } from 'lucide-react';

export default function Marketplace() {
  const [addOns, setAddOns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedAddOn, setSelectedAddOn] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [processing, setProcessing] = useState(false);
  const [expandedCard, setExpandedCard] = useState(null);

  useEffect(() => {
    loadAddOns();
  }, []);

  const loadAddOns = async () => {
    try {
      const response = await settingsAPI.getAddOns();
      setAddOns(response.data.addOns);
    } catch (error) {
      console.error('Failed to load add-ons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = (e, addOn) => {
    e.stopPropagation();
    if (addOn.isActive) {
      alert('This add-on is already active!');
      return;
    }
    setSelectedAddOn(addOn);
    setShowCheckout(true);
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    setProcessing(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await settingsAPI.activateAddOn(selectedAddOn.id);
      
      alert('Payment successful! Add-on activated.');
      setShowCheckout(false);
      setPhoneNumber('');
      loadAddOns();
    } catch (error) {
      console.error('Payment failed:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const closeCheckout = () => {
    setShowCheckout(false);
    setSelectedAddOn(null);
    setPhoneNumber('');
  };

  const toggleExpand = (addOnId) => {
    setExpandedCard(expandedCard === addOnId ? null : addOnId);
  };

  const getAddOnDetails = (name) => {
    const details = {
      'Order Updates via SMS': {
        icon: <MessageCircle size={20} />,
        benefits: [
          'Instant customer notifications on order status',
          'Reduce "where is my order?" messages by 80%',
          'Build trust with real-time updates',
          'Automated SMS for: Order placed, Processing, Shipped, Delivered'
        ],
        results: 'Sellers report 60% fewer customer support inquiries'
      },
      'Instant Payment Prompt': {
        icon: <TrendingUp size={20} />,
        benefits: [
          'Increase conversion rates by up to 35%',
          'One-click M-Pesa payment for customers',
          'Reduce cart abandonment significantly',
          'Instant payment confirmation to your phone'
        ],
        results: 'Average 25% boost in completed purchases'
      },
      'Customer Re-engagement': {
        icon: <Users size={20} />,
        benefits: [
          'Automatically remind customers who didn\'t complete purchase',
          'Win back 15-20% of abandoned carts',
          'Smart timing: Follow-up after 24 hours',
          'Personalized messages increase effectiveness'
        ],
        results: 'Recover thousands in lost revenue monthly'
      },
      'Product Video Ads': {
        icon: <Video size={20} />,
        benefits: [
          'Showcase products in action with video',
          'Products with video sell 40% more',
          'Build confidence before purchase',
          'Perfect for fashion, accessories, home goods'
        ],
        results: 'Video products get 3x more engagement'
      },
      'Shoppable Instagram Posts': {
        icon: <Instagram size={20} />,
        benefits: [
          'Turn Instagram posts into instant purchases',
          'Tag products directly in your content',
          'Seamless checkout without leaving Instagram',
          'Perfect for lifestyle & fashion brands'
        ],
        results: 'Double your Instagram sales overnight'
      },
      'Promotional Banners': {
        icon: <Gift size={20} />,
        benefits: [
          'Highlight sales, discounts, new arrivals',
          'Eye-catching banners at top of store',
          'Schedule promotions in advance',
          'Drive urgency with countdown timers'
        ],
        results: 'Flash sales generate 3x normal traffic'
      },
      'Smart Customer Support': {
        icon: <Star size={20} />,
        benefits: [
          'AI-powered instant responses to common questions',
          'Available 24/7 even while you sleep',
          'Answer product queries automatically',
          'Escalate complex issues to you'
        ],
        results: 'Handle 10x more customers effortlessly'
      },
      'Central Hub Page': {
        icon: <BarChart3 size={20} />,
        benefits: [
          'One link for all your products & socials',
          'Professional landing page in bio',
          'Analytics on visitor behavior',
          'Perfect for Instagram, TikTok, WhatsApp'
        ],
        results: 'Increase click-through rates by 45%'
      }
    };

    return details[name] || {
      icon: <Zap size={20} />,
      benefits: ['Powerful feature to boost your sales'],
      results: 'Proven to increase revenue'
    };
  };

  if (loading) {
    return <div style={styles.loading}>Loading add-ons...</div>;
  }

  return (
    <div style={styles.container} className="fade-in">
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Add-Ons</h1>
          <p style={styles.subtitle}>Boost your store with powerful features</p>
        </div>
      </div>

      {showCheckout && selectedAddOn && (
        <div style={styles.modalOverlay} onClick={closeCheckout}>
          <div style={styles.checkoutModal} className="glass-card" onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Activate Add-On</h2>
              <button onClick={closeCheckout} style={styles.closeBtn}>
                <X size={24} />
              </button>
            </div>

            <div style={styles.checkoutContent}>
              <div style={styles.addOnSummary}>
                <div style={styles.addOnIcon}>⚡</div>
                <div>
                  <h3 style={styles.addOnName}>{selectedAddOn.name}</h3>
                  <p style={styles.addOnPrice}>KES {selectedAddOn.price}/month</p>
                </div>
              </div>

              <form onSubmit={handleCheckout} style={styles.checkoutForm}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>M-PESA PHONE NUMBER</label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="254712345678"
                    required
                    pattern="254[0-9]{9}"
                    className="dashboard-input"
                    style={styles.input}
                  />
                  <p style={styles.hint}>You'll receive an STK push to complete payment</p>
                </div>

                <div style={styles.paymentInfo}>
                  <div style={styles.infoRow}>
                    <span>Add-on Price:</span>
                    <span style={styles.amount}>KES {selectedAddOn.price}</span>
                  </div>
                  <div style={styles.infoRow}>
                    <span>Billing:</span>
                    <span>Monthly</span>
                  </div>
                  <div style={{...styles.infoRow, ...styles.totalRow}}>
                    <span>Total Due:</span>
                    <span style={styles.totalAmount}>KES {selectedAddOn.price}</span>
                  </div>
                </div>

                <div style={styles.checkoutActions}>
                  <button type="button" onClick={closeCheckout} style={styles.cancelBtn} disabled={processing}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={processing}>
                    {processing ? 'Processing...' : 'Pay with M-Pesa'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <div style={styles.grid}>
        {addOns.map((addOn) => {
          const details = getAddOnDetails(addOn.name);
          const isExpanded = expandedCard === addOn.id;

          return (
            <div 
              key={addOn.id} 
              style={{
                ...styles.card,
                cursor: 'pointer',
              }} 
              className="glass-card"
              onClick={() => toggleExpand(addOn.id)}
            >
              <div style={styles.cardHeader}>
                <div style={styles.iconWrapper}>
                  <Zap size={32} style={{ color: '#ff9f0a' }} />
                </div>
                {addOn.isActive && (
                  <div style={styles.activeBadge}>
                    <Check size={16} />
                    Active
                  </div>
                )}
              </div>

              <h3 style={styles.cardTitle}>{addOn.name}</h3>
              <p style={styles.cardDesc}>{addOn.description}</p>

              {isExpanded && (
                <div style={styles.expandedContent} onClick={(e) => e.stopPropagation()}>
                  <div style={styles.benefitsSection}>
                    <div style={styles.benefitsHeader}>
                      {details.icon}
                      <h4 style={styles.benefitsTitle}>What You Get:</h4>
                    </div>
                    <ul style={styles.benefitsList}>
                      {details.benefits.map((benefit, idx) => (
                        <li key={idx} style={styles.benefitItem}>
                          <span style={styles.checkIcon}>✓</span>
                          {benefit}
                        </li>
                      ))}
                    </ul>
                    <div style={styles.resultsBox}>
                      <TrendingUp size={16} style={{ color: '#30d158' }} />
                      <span style={styles.resultsText}>{details.results}</span>
                    </div>
                  </div>
                </div>
              )}

              <div style={styles.cardFooter}>
                <div style={styles.pricing}>
                  <span style={styles.price}>+KES {addOn.price}</span>
                  <span style={styles.period}>/mo</span>
                </div>

                <div style={styles.footerActions}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(addOn.id);
                    }}
                    style={styles.learnMoreBtn}
                  >
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    {isExpanded ? 'Less' : 'Learn More'}
                  </button>

                  <button
                    onClick={(e) => handleActivate(e, addOn)}
                    disabled={addOn.isActive}
                    style={{
                      ...styles.activateBtn,
                      opacity: addOn.isActive ? 0.5 : 1,
                      cursor: addOn.isActive ? 'not-allowed' : 'pointer',
                    }}
                    className="btn btn-primary"
                  >
                    {addOn.isActive ? 'Active' : 'Activate'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: '1400px' },
  loading: { textAlign: 'center', padding: '40px', color: 'var(--text-muted)' },
  header: { marginBottom: '32px' },
  title: { fontSize: '36px', fontWeight: '800', marginBottom: '8px' },
  subtitle: { fontSize: '16px', color: 'var(--text-muted)' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
  checkoutModal: { width: '100%', maxWidth: '500px', padding: '32px' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' },
  modalTitle: { fontSize: '28px', fontWeight: '800' },
  closeBtn: { background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '8px', borderRadius: '8px', transition: 'all 0.3s' },
  checkoutContent: { display: 'flex', flexDirection: 'column', gap: '24px' },
  addOnSummary: { display: 'flex', alignItems: 'center', gap: '16px', padding: '20px', background: 'rgba(255, 159, 10, 0.1)', border: '1px solid rgba(255, 159, 10, 0.2)', borderRadius: '12px' },
  addOnIcon: { fontSize: '48px' },
  addOnName: { fontSize: '20px', fontWeight: '700', marginBottom: '4px' },
  addOnPrice: { fontSize: '16px', color: '#ff9f0a', fontWeight: '600' },
  checkoutForm: { display: 'flex', flexDirection: 'column', gap: '24px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '10px' },
  label: { fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' },
  input: { background: 'var(--glass-bg)', border: '1px solid var(--border-color)' },
  hint: { fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' },
  paymentInfo: { padding: '20px', background: 'var(--glass-bg)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px' },
  infoRow: { display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--text-secondary)' },
  amount: { fontWeight: '600', color: 'var(--text-primary)' },
  totalRow: { paddingTop: '12px', borderTop: '1px solid var(--border-color)', fontSize: '16px', fontWeight: '700' },
  totalAmount: { color: '#ff9f0a', fontSize: '20px' },
  checkoutActions: { display: 'flex', gap: '12px', justifyContent: 'flex-end' },
  cancelBtn: { padding: '14px 28px', borderRadius: '12px', background: 'var(--glass-bg)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '15px', cursor: 'pointer', transition: 'all 0.3s' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' },
  card: { padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px', transition: 'all 0.3s' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  iconWrapper: { width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(255, 159, 10, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  activeBadge: { display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'rgba(48, 209, 88, 0.2)', color: '#30d158', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
  cardTitle: { fontSize: '24px', fontWeight: '700' },
  cardDesc: { fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' },
  expandedContent: { padding: '20px', background: 'rgba(255, 159, 10, 0.05)', border: '1px solid rgba(255, 159, 10, 0.15)', borderRadius: '12px', animation: 'fadeIn 0.3s ease' },
  benefitsSection: { display: 'flex', flexDirection: 'column', gap: '16px' },
  benefitsHeader: { display: 'flex', alignItems: 'center', gap: '10px', color: '#ff9f0a' },
  benefitsTitle: { fontSize: '16px', fontWeight: '700' },
  benefitsList: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' },
  benefitItem: { display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '14px', lineHeight: '1.5', color: 'var(--text-secondary)' },
  checkIcon: { color: '#30d158', fontWeight: '700', fontSize: '16px', flexShrink: 0 },
  resultsBox: { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: 'rgba(48, 209, 88, 0.1)', border: '1px solid rgba(48, 209, 88, 0.2)', borderRadius: '8px', marginTop: '8px' },
  resultsText: { fontSize: '13px', fontWeight: '600', color: '#30d158' },
  cardFooter: { display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' },
  pricing: { display: 'flex', alignItems: 'baseline', gap: '4px' },
  price: { fontSize: '28px', fontWeight: '800', color: '#ff9f0a' },
  period: { fontSize: '14px', color: 'var(--text-muted)' },
  footerActions: { display: 'flex', gap: '12px', justifyContent: 'space-between', alignItems: 'center' },
  learnMoreBtn: { display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', background: 'var(--glass-bg)', border: '1px solid var(--border-color)', borderRadius: '10px', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s' },
  activateBtn: { padding: '12px 24px' },
};
