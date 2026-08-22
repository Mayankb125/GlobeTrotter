import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api/auth';
import { useToast } from '../components/Toast';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      setLoading(true);
      await authApi.forgotPassword(email);
      setSent(true);
      showToast(`Password reset link sent to ${email}`, '📧');
    } catch (err: any) {
      showToast('Failed to send reset link', '⚠️');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--paper)', padding: '20px' }}>
      <div className="card card-pad" style={{ width: '100%', maxWidth: '400px', padding: '32px' }}>
        <div className="row gap10" style={{ marginBottom: '20px' }}>
          <div className="brand-mark">
            <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
              <rect width="36" height="36" rx="9" fill="url(#gt-grad-forgot)" />
              <circle cx="18" cy="18" r="9" stroke="#ffffff" strokeWidth="1.8" strokeDasharray="2 2" opacity="0.8" />
              <ellipse cx="18" cy="18" rx="9" ry="4" stroke="#ffffff" strokeWidth="1.5" opacity="0.9" />
              <path d="M10 23C14 15 20 11 25 13" stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round" />
              <circle cx="25" cy="13" r="2.4" fill="#f59e0b" />
              <defs>
                <linearGradient id="gt-grad-forgot" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#144a47" />
                  <stop offset="1" stopColor="#1f6f6b" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700 }}>
            GlobeTrotter
          </span>
        </div>

        <h2 style={{ fontSize: '22px', marginBottom: '6px' }}>Reset your password</h2>
        <p className="muted small" style={{ marginBottom: '24px' }}>
          Enter the email associated with your GlobeTrotter account to receive a reset link.
        </p>

        {sent ? (
          <div className="col gap14">
            <div className="card card-pad" style={{ background: 'var(--harbor-tint)', borderColor: 'var(--harbor)', color: 'var(--harbor)' }}>
              <p className="small font-medium">
                ✅ Reset instructions have been sent to <b>{email}</b>. Please check your inbox.
              </p>
            </div>
            <button className="btn btn-primary btn-block" onClick={() => navigate('/login')}>
              Return to Sign in →
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Email address</label>
              <div className="input-icon-wrap">
                <span className="ico">✉</span>
                <input
                  className="input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={loading} style={{ marginTop: '10px' }}>
              {loading ? 'Sending link...' : 'Send reset link →'}
            </button>

            <p className="small muted" style={{ textAlign: 'center', marginTop: '20px' }}>
              Remember your password?{' '}
              <Link to="/login" className="link-btn">
                Back to Sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};
