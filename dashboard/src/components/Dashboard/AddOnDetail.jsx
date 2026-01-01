import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { settingsAPI } from '../../services/api.jsx';
import { Check, ArrowLeft, Zap } from 'lucide-react';

export default function AddOnDetail() {
  const { addonName } = useParams();
  const navigate = useNavigate();
  const [addon, setAddon] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAddon();
  }, [addonName]);

  const loadAddon = async () => {
    try {
      const response = await settingsAPI.getAddOns();
      const foundAddon = response.data.addOns.find(a => a.name === addonName);
      setAddon(foundAddon);
    } catch (error) {
      console.error('Failed to load add-on:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async () => {
    if (addon.isActive) {
      alert('Add-on is already active!');
      return;
    }

    try {
      await settingsAPI.activateAddOn(addon.id);
      alert('Add-on activated successfully!');
      await loadAddon();
    } catch (error) {
      alert('Failed to activate add-on');
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  if (!addon) {
    return (
      <div style={styles.notFound}>
        <h2>Add-on not found</h2>
        <button onClick={() => navigate('/dashboard/marketplace')} className="btn btn-primary">
          Back to Marketplace
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container} className="fade-in">
      <button onClick={() => navigate('/dashboard/marketplace')} style={styles.backBtn}>
        <ArrowLeft size={20} />
        Back to Marketplace
      </button>

      <div style={styles.hero} className="glass-card">
        <div style={styles.heroIcon}>
          <Zap size={48} />
        </div>
        <h1 style={styles.title}>{addon.display_name}</h1>
        <p style={styles.price}>+KES {parseInt(addon.price).toLocaleString()}/month</p>
        <p style={styles.heroDesc}>{addon.description}</p>

        <button
          onClick={handleActivate}
          style={{
            ...styles.activateBtn,
            background: addon.isActive ? 'rgba(48, 209, 88, 0.2)' : 'linear-gradient(135deg, #ff9f0a 0%, #ff375f 100%)',
            cursor: addon.isActive ? 'not-allowed' : 'pointer'
          }}
          className={addon.isActive ? '' : 'btn btn-primary'}
          disabled={addon.isActive}
        >
          {addon.isActive ? (
            <>
              <Check size={20} />
              Already Active
            </>
          ) : (
            <>
              <Zap size={20} />
              Activate Now
            </>
          )}
        </button>
      </div>

      {/* JTBD Section */}
      <div style={styles.section} className="glass-card">
        <h2 style={styles.sectionTitle}>The Job You're Trying to Get Done</h2>
        <p style={styles.jobStatement}>"{addon.job_title || 'Help grow your business faster'}"</p>
      </div>

      {/* Outcome Section */}
      <div style={styles.section} className="glass-card">
        <h2 style={styles.sectionTitle}>Primary Outcome</h2>
        <div style={styles.outcomeCard}>
          <div style={styles.outcomeIcon}>🎯</div>
          <p style={styles.outcomeText}>{addon.outcome || 'Achieve better results with less effort'}</p>
        </div>
      </div>

      {/* Benefits Section */}
      <div style={styles.section} className="glass-card">
        <h2 style={styles.sectionTitle}>How It Helps You</h2>
        <div style={styles.benefitsGrid}>
          {addon.benefit_1 && (
            <div style={styles.benefitCard}>
              <div style={styles.benefitNumber}>1</div>
              <p style={styles.benefitText}>{addon.benefit_1}</p>
            </div>
          )}
          {addon.benefit_2 && (
            <div style={styles.benefitCard}>
              <div style={styles.benefitNumber}>2</div>
              <p style={styles.benefitText}>{addon.benefit_2}</p>
            </div>
          )}
          {addon.benefit_3 && (
            <div style={styles.benefitCard}>
              <div style={styles.benefitNumber}>3</div>
              <p style={styles.benefitText}>{addon.benefit_3}</p>
            </div>
          )}
        </div>
      </div>

      {/* CTA Section */}
      <div style={styles.ctaSection} className="glass-card">
        <h3 style={styles.ctaTitle}>Ready to boost your sales?</h3>
        <p style={styles.ctaDesc}>Start using {addon.display_name} today for just KES {parseInt(addon.price).toLocaleString()}/month</p>
        <button
          onClick={handleActivate}
          style={styles.ctaBtn}
          className="btn btn-primary"
          disabled={addon.isActive}
        >
          {addon.isActive ? 'Already Active' : 'Activate Now'}
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: '900px', margin: '0 auto' },
  loading: { textAlign: 'center', padding: '40px', color: 'rgba(255, 255, 255, 0.5)' },
  notFound: { textAlign: 'center', padding: '80px 20px' },
  backBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', color: 'rgba(255, 255, 255, 0.7)', fontSize: '15px', fontWeight: '600', cursor: 'pointer', marginBottom: '24px', transition: 'all 0.3s' },
  hero: { padding: '48px 40px', textAlign: 'center', marginBottom: '24px' },
  heroIcon: { width: '96px', height: '96px', margin: '0 auto 24px', background: 'linear-gradient(135deg, #ff9f0a 0%, #ff375f 100%)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' },
  title: { fontSize: '42px', fontWeight: '800', marginBottom: '12px', letterSpacing: '-0.02em' },
  price: { fontSize: '24px', fontWeight: '700', color: '#ff9f0a', marginBottom: '20px' },
  heroDesc: { fontSize: '18px', color: 'rgba(255, 255, 255, 0.7)', lineHeight: '1.6', marginBottom: '32px', maxWidth: '600px', margin: '0 auto 32px' },
  activateBtn: { display: 'inline-flex', alignItems: 'center', gap: '12px', padding: '18px 40px', fontSize: '18px', fontWeight: '700', borderRadius: '14px', border: 'none', color: 'white', cursor: 'pointer', transition: 'all 0.3s' },
  section: { padding: '32px', marginBottom: '24px' },
  sectionTitle: { fontSize: '24px', fontWeight: '700', marginBottom: '20px' },
  jobStatement: { fontSize: '20px', fontStyle: 'italic', color: 'rgba(255, 255, 255, 0.8)', lineHeight: '1.6', padding: '24px', background: 'rgba(255, 159, 10, 0.1)', borderLeft: '4px solid #ff9f0a', borderRadius: '12px' },
  outcomeCard: { display: 'flex', alignItems: 'center', gap: '20px', padding: '24px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '16px' },
  outcomeIcon: { fontSize: '48px', flexShrink: 0 },
  outcomeText: { fontSize: '18px', lineHeight: '1.6', color: 'rgba(255, 255, 255, 0.9)' },
  benefitsGrid: { display: 'grid', gap: '16px' },
  benefitCard: { display: 'flex', gap: '20px', padding: '24px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '16px', alignItems: 'flex-start' },
  benefitNumber: { width: '40px', height: '40px', background: 'linear-gradient(135deg, #ff9f0a 0%, #ff375f 100%)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '700', color: 'white', flexShrink: 0 },
  benefitText: { fontSize: '16px', lineHeight: '1.6', color: 'rgba(255, 255, 255, 0.8)' },
  ctaSection: { padding: '48px', textAlign: 'center', background: 'linear-gradient(135deg, rgba(255, 159, 10, 0.1) 0%, rgba(255, 55, 95, 0.1) 100%)' },
  ctaTitle: { fontSize: '28px', fontWeight: '800', marginBottom: '12px' },
  ctaDesc: { fontSize: '16px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '24px' },
  ctaBtn: { padding: '16px 40px', fontSize: '18px' },
};
