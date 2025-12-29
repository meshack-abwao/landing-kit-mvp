import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    businessName: '',
    instagramHandle: '',
    phone: '',
    affiliateCode: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        navigate('/login');
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.formCard} className="glass-card">
        <div style={styles.header}>
          <div style={styles.logoIcon}>🛍️</div>
          <h1 style={styles.title}>Join Jari.Ecom</h1>
          <p style={styles.subtitle}>Start selling in under 5 minutes</p>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Business Name</label>
            <input
              type="text"
              value={formData.businessName}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
              placeholder="Jari Solutions"
              required
              className="dashboard-input"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="you@example.com"
              required
              className="dashboard-input"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              required
              minLength="6"
              className="dashboard-input"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Instagram Handle</label>
            <input
              type="text"
              value={formData.instagramHandle}
              onChange={(e) => setFormData({ ...formData, instagramHandle: e.target.value })}
              placeholder="@yourhandle"
              required
              className="dashboard-input"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Phone Number</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="254712345678"
              required
              className="dashboard-input"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Affiliate Code <span style={styles.optional}>(Optional)</span></label>
            <input
              type="text"
              value={formData.affiliateCode}
              onChange={(e) => setFormData({ ...formData, affiliateCode: e.target.value.toUpperCase() })}
              placeholder="PARTNER123"
              className="dashboard-input"
            />
            <p style={styles.hint}>Have a referral code? Enter it for special benefits</p>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn btn-primary"
            style={styles.submitBtn}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p style={styles.footer}>
          Already have an account? <a href="/login" style={styles.link}>Login</a>
        </p>
      </div>

      <div style={styles.bgGlow}></div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    position: 'relative',
    overflow: 'hidden',
  },
  formCard: {
    width: '100%',
    maxWidth: '480px',
    padding: '40px',
    position: 'relative',
    zIndex: 1,
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  logoIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  title: {
    fontSize: '32px',
    fontWeight: '800',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '15px',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  error: {
    padding: '12px 16px',
    background: 'rgba(255, 55, 95, 0.1)',
    border: '1px solid rgba(255, 55, 95, 0.3)',
    borderRadius: '10px',
    color: '#ff375f',
    fontSize: '14px',
    marginBottom: '20px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  optional: {
    fontSize: '11px',
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.4)',
    textTransform: 'none',
  },
  hint: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.4)',
  },
  submitBtn: {
    marginTop: '12px',
  },
  footer: {
    textAlign: 'center',
    marginTop: '24px',
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  link: {
    color: '#ff9f0a',
    textDecoration: 'none',
    fontWeight: '600',
  },
  bgGlow: {
    position: 'fixed',
    width: '800px',
    height: '800px',
    background: 'radial-gradient(circle, rgba(255, 159, 10, 0.15) 0%, transparent 70%)',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    borderRadius: '50%',
    filter: 'blur(120px)',
    pointerEvents: 'none',
  },
};
