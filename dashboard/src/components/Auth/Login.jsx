import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.jsx';

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
          <div style={styles.logoIcon}>🚀</div>
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
  logoIcon: {
    fontSize: '56px',
    marginBottom: '20px',
  },
  title: {
    fontSize: '36px',
    fontWeight: '800',
    marginBottom: '8px',
    background: 'linear-gradient(135deg, #ff9f0a 0%, #ff375f 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    fontSize: '16px',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  error: {
    padding: '14px 18px',
    background: 'rgba(255, 55, 95, 0.1)',
    border: '1px solid rgba(255, 55, 95, 0.3)',
    borderRadius: '12px',
    color: '#ff375f',
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
    color: 'rgba(255, 255, 255, 0.8)',
  },
  submitBtn: {
    marginTop: '8px',
    padding: '16px',
    fontSize: '16px',
  },
  forgotLink: {
    textAlign: 'center',
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.5)',
    textDecoration: 'none',
    marginTop: '-8px',
  },
  footer: {
    textAlign: 'center',
    marginTop: '32px',
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
    width: '1000px',
    height: '1000px',
    background: 'radial-gradient(circle, rgba(255, 159, 10, 0.15) 0%, transparent 70%)',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    borderRadius: '50%',
    filter: 'blur(120px)',
    pointerEvents: 'none',
  },
};
