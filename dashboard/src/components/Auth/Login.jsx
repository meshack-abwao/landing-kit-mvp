import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.jsx';

const JARI_LOGO = 'http://jarisolutions.com/wp-content/uploads/2025/11/cropped-Jari-Business-Solutions-1.png';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.formCard} className="glass-card">
        <div style={styles.header}>
          <img src={JARI_LOGO} alt="Jari" style={styles.logoImg} />
          <h1 style={styles.title}>Jari.Ecom</h1>
          <p style={styles.subtitle}>Sign in to your account</p>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="dashboard-input"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="dashboard-input"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn btn-primary"
            style={styles.submitBtn}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <a href="/forgot-password" style={styles.forgotLink}>Forgot password?</a>
        </form>

        <p style={styles.footer}>
          Don't have an account? <a href="/register" style={styles.link}>Create one</a>
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
    maxWidth: '440px',
    padding: '48px 40px',
    position: 'relative',
    zIndex: 1,
  },
  header: {
    textAlign: 'center',
    marginBottom: '40px',
  },
  logoImg: {
    width: '72px',
    height: '72px',
    objectFit: 'contain',
    marginBottom: '20px',
    borderRadius: '16px',
  },
  title: {
    fontSize: '36px',
    fontWeight: '800',
    marginBottom: '8px',
    background: 'linear-gradient(135deg, #2D5A27 0%, #D4A84B 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    fontSize: '16px',
    color: 'var(--text-muted)',
  },
  error: {
    padding: '14px 18px',
    background: 'rgba(220, 38, 38, 0.1)',
    border: '1px solid rgba(220, 38, 38, 0.3)',
    borderRadius: '12px',
    color: '#dc2626',
    fontSize: '14px',
    marginBottom: '24px',
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--text-secondary)',
  },
  submitBtn: {
    marginTop: '8px',
    padding: '16px',
    fontSize: '16px',
  },
  forgotLink: {
    textAlign: 'center',
    fontSize: '14px',
    color: 'var(--text-muted)',
    textDecoration: 'none',
    marginTop: '-8px',
  },
  footer: {
    textAlign: 'center',
    marginTop: '32px',
    fontSize: '14px',
    color: 'var(--text-muted)',
  },
  link: {
    color: '#D4A84B',
    textDecoration: 'none',
    fontWeight: '600',
  },
  bgGlow: {
    position: 'fixed',
    width: '1000px',
    height: '1000px',
    background: 'radial-gradient(circle, rgba(45, 90, 39, 0.15) 0%, transparent 70%)',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    borderRadius: '50%',
    filter: 'blur(120px)',
    pointerEvents: 'none',
  },
};
