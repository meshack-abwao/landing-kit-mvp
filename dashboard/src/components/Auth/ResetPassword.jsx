import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, Lock, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (token) {
      validateToken();
    } else {
      setValidating(false);
    }
  }, [token]);

  const validateToken = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/verification/verify-reset-token/${token}`);
      const data = await response.json();
      
      if (data.success) {
        setTokenValid(true);
        setEmail(data.email);
      }
    } catch (err) {
      console.error('Token validation error:', err);
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:3000/api/verification/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setError(data.error || 'Failed to reset password');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div style={styles.container}>
        <div style={styles.formCard} className="glass-card">
          <div style={styles.loadingState}>
            <div style={styles.spinner}></div>
            <p style={styles.loadingText}>Validating reset link...</p>
          </div>
        </div>
        <div style={styles.bgGlow}></div>
      </div>
    );
  }

  if (!token || !tokenValid) {
    return (
      <div style={styles.container}>
        <div style={styles.formCard} className="glass-card">
          <div style={styles.errorState}>
            <AlertCircle size={48} style={{ color: '#ff375f' }} />
            <h2 style={styles.errorTitle}>Invalid or Expired Link</h2>
            <p style={styles.errorText}>
              This password reset link is no longer valid. Please request a new one.
            </p>
            <Link to="/forgot-password" className="btn btn-primary" style={styles.retryBtn}>
              Request New Link
            </Link>
          </div>
        </div>
        <div style={styles.bgGlow}></div>
      </div>
    );
  }

  if (success) {
    return (
      <div style={styles.container}>
        <div style={styles.formCard} className="glass-card">
          <div style={styles.successState}>
            <div style={styles.successIcon}>
              <Check size={48} />
            </div>
            <h2 style={styles.successTitle}>Password Reset!</h2>
            <p style={styles.successText}>
              Your password has been reset successfully. Redirecting to login...
            </p>
          </div>
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
          <div style={styles.logoIcon}>🔐</div>
          <h1 style={styles.title}>Reset Password</h1>
          <p style={styles.subtitle}>
            Enter a new password for <strong>{email}</strong>
          </p>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>New Password</label>
            <div style={styles.inputWrapper}>
              <Lock size={18} style={styles.inputIcon} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength="6"
                className="dashboard-input"
                style={styles.inputWithIcon}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Confirm Password</label>
            <div style={styles.inputWrapper}>
              <Lock size={18} style={styles.inputIcon} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength="6"
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
            {loading ? 'Resetting...' : 'Reset Password'}
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
    transition: 'color 0.3s',
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
    fontSize: '14px',
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
    textAlign: 'center',
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
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '14px',
    color: 'rgba(255, 255, 255, 0.4)',
    pointerEvents: 'none',
  },
  inputWithIcon: {
    paddingLeft: '44px',
    paddingRight: '44px',
    width: '100%',
  },
  eyeBtn: {
    position: 'absolute',
    right: '14px',
    background: 'transparent',
    border: 'none',
    color: 'rgba(255, 255, 255, 0.4)',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtn: {
    marginTop: '8px',
    padding: '16px',
    fontSize: '16px',
  },
  loadingState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '40px 20px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid rgba(255, 255, 255, 0.1)',
    borderTop: '3px solid #ff9f0a',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    marginTop: '16px',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  errorState: {
    textAlign: 'center',
    padding: '40px 20px',
  },
  errorTitle: {
    fontSize: '24px',
    fontWeight: '700',
    marginTop: '20px',
    marginBottom: '12px',
  },
  errorText: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: '1.5',
    marginBottom: '24px',
  },
  retryBtn: {
    display: 'inline-flex',
    textDecoration: 'none',
  },
  successState: {
    textAlign: 'center',
    padding: '40px 20px',
  },
  successIcon: {
    width: '80px',
    height: '80px',
    margin: '0 auto 20px',
    background: 'rgba(48, 209, 88, 0.2)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#30d158',
  },
  successTitle: {
    fontSize: '24px',
    fontWeight: '700',
    marginBottom: '12px',
    color: '#30d158',
  },
  successText: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: '1.5',
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
