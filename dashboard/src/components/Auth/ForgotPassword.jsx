import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, Check } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3000/api/verification/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setSent(true);
      } else {
        setError(data.error || 'Failed to send reset email');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div style={styles.container}>
        <div style={styles.formCard} className="glass-card">
          <div style={styles.successIcon}>
            <Check size={48} />
          </div>
          <h1 style={styles.title}>Check Your Email</h1>
          <p style={styles.message}>
            If an account exists with <strong>{email}</strong>, you'll receive a password reset link shortly.
          </p>
          <p style={styles.hint}>
            Don't see it? Check your spam folder.
          </p>
          <Link to="/login" style={styles.backLink}>
            <ArrowLeft size={18} />
            Back to Login
          </Link>
        </div>
        <div style={styles.bgGlow}></div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.formCard} className="glass-card">
        <Link to="/login" style={styles.backBtn}>
          <ArrowLeft size={18} />
          Back to Login
        </Link>

        <div style={styles.header}>
          <div style={styles.logoIcon}>🔑</div>
          <h1 style={styles.title}>Forgot Password?</h1>
          <p style={styles.subtitle}>No worries! Enter your email and we'll send you a reset link.</p>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Email Address</label>
            <div style={styles.inputWrapper}>
              <Mail size={20} style={styles.inputIcon} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="dashboard-input"
                style={styles.inputWithIcon}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn btn-primary"
            style={styles.submitBtn}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
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
    padding: '40px',
    position: 'relative',
    zIndex: 1,
  },
  backBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    color: 'rgba(255, 255, 255, 0.6)',
    textDecoration: 'none',
    fontSize: '14px',
    marginBottom: '24px',
    transition: 'color 0.2s',
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
    fontSize: '28px',
    fontWeight: '800',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '15px',
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: '1.5',
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
    fontSize: '14px',
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  inputWrapper: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'rgba(255, 255, 255, 0.4)',
  },
  inputWithIcon: {
    paddingLeft: '44px',
  },
  submitBtn: {
    marginTop: '8px',
  },
  successIcon: {
    width: '80px',
    height: '80px',
    margin: '0 auto 24px',
    background: 'rgba(48, 209, 88, 0.2)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#30d158',
  },
  message: {
    fontSize: '16px',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: '16px',
    lineHeight: '1.5',
  },
  hint: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    marginBottom: '24px',
  },
  backLink: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    color: '#ff9f0a',
    textDecoration: 'none',
    fontSize: '15px',
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
