import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/auth';
import { useToast } from '../components/Toast';

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const { showToast } = useToast();

  const [name, setName] = useState('Saksham Lodha');
  const [email, setEmail] = useState('saksham@example.com');
  const [password, setPassword] = useState('globetrotter123');
  const [agreed, setAgreed] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (!agreed) {
      setError('You must agree to the Terms & Privacy Policy to sign up.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await authApi.signup({ name, email, password });
      setAuth(res.user, res.access_token);
      showToast(`Welcome to GlobeTrotter, ${res.user.name}!`, '🎉');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1.1fr 1fr' }}>
      {/* Left Branding Showcase Panel with Rich Travel Background Image */}
      <div
        style={{
          background:
            'linear-gradient(180deg, rgba(14, 23, 22, 0.75) 0%, rgba(14, 23, 22, 0.92) 100%), url("https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1600&q=80")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
          padding: '52px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ position: 'relative', zIndex: 1 }} className="row between">
          <div className="row gap10">
            <div className="brand-mark" style={{ width: '38px', height: '38px' }}>
              <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
                <rect width="36" height="36" rx="9" fill="url(#gt-grad-auth)" />
                <circle cx="18" cy="18" r="9" stroke="#ffffff" strokeWidth="1.8" strokeDasharray="2 2" opacity="0.8" />
                <ellipse cx="18" cy="18" rx="9" ry="4" stroke="#ffffff" strokeWidth="1.5" opacity="0.9" />
                <ellipse cx="18" cy="18" rx="4" ry="9" stroke="#ffffff" strokeWidth="1.5" opacity="0.9" />
                <path d="M10 23C14 15 20 11 25 13" stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round" />
                <circle cx="25" cy="13" r="2.4" fill="#f59e0b" />
                <defs>
                  <linearGradient id="gt-grad-auth" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#144a47" />
                    <stop offset="1" stopColor="#1f6f6b" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em' }}>
              GlobeTrotter
            </span>
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '440px' }}>
          <h1 style={{ fontSize: '40px', color: '#fff', lineHeight: 1.12, marginTop: '12px' }}>

            Start exploring with GlobeTrotter.
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', marginTop: '16px', fontSize: '15px', lineHeight: 1.6 }}>
            Create your account to unlock AI itinerary generation, budget tracking in ₹ INR, and interactive map routing.
          </p>

          <div className="row gap12" style={{ marginTop: '28px' }}>
            <div className="row" style={{ marginRight: '2px' }}>
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
                className="avatar"
                style={{ width: '30px', height: '30px', border: '2px solid var(--night)' }}
                alt="User"
              />
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80"
                className="avatar"
                style={{ width: '30px', height: '30px', border: '2px solid var(--night)', marginLeft: '-8px' }}
                alt="User"
              />
              <img
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80"
                className="avatar"
                style={{ width: '30px', height: '30px', border: '2px solid var(--night)', marginLeft: '-8px' }}
                alt="User"
              />
            </div>
            <span className="small" style={{ color: 'rgba(255,255,255,0.85)' }}>
              Joined by 24,000+ GlobeTrotters exploring India & abroad
            </span>
          </div>
        </div>

        <p className="xsmall" style={{ position: 'relative', zIndex: 1, color: 'rgba(255,255,255,0.6)' }}>
          © GlobeTrotter AI Travel, Inc.
        </p>
      </div>

      {/* Right Signup Form with Styled Button Borders */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        <div style={{ width: '100%', maxWidth: '390px' }}>
          <div
            className="row gap8"
            style={{
              background: 'var(--paper-2)',
              padding: '4px',
              borderRadius: '99px',
              marginBottom: '28px',
              border: '1px solid var(--line)',
            }}
          >
            <button
              className="btn btn-block btn-ghost"
              style={{ border: '1px solid transparent' }}
              onClick={() => navigate('/login')}
            >
              Sign in
            </button>
            <button
              className="btn btn-block"
              style={{
                background: 'var(--card)',
                boxShadow: '0 1px 3px rgba(0,0,0,.08)',
                color: 'var(--ink)',
                border: '1px solid var(--line)',
              }}
            >
              Create account
            </button>
          </div>

          <div>
            <h2 style={{ fontSize: '24px', marginBottom: '4px' }}>Start exploring with GlobeTrotter</h2>
            <p className="muted small" style={{ marginBottom: '24px' }}>
              Free while in beta — plan your next journey in seconds.
            </p>

            {error && (
              <div
                className="card card-pad"
                style={{
                  padding: '10px 14px',
                  marginBottom: '16px',
                  background: 'var(--coral-tint)',
                  color: 'var(--coral)',
                  borderColor: 'var(--coral)',
                }}
              >
                <span className="small font-medium">{error}</span>
              </div>
            )}

            <form onSubmit={handleSignup}>
              <div className="field">
                <label>Full name</label>
                <input
                  className="input"
                  placeholder="Saksham Lodha"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  style={{ border: '1px solid var(--line)' }}
                />
              </div>

              <div className="field">
                <label>Email</label>
                <input
                  className="input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{ border: '1px solid var(--line)' }}
                />
              </div>

              <div className="field">
                <label>Password</label>
                <input
                  className="input"
                  type="password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ border: '1px solid var(--line)' }}
                />
              </div>

              <label
                className="row gap8"
                style={{ fontWeight: 500, color: 'var(--ink-soft)', marginBottom: '20px', lineHeight: 1.4, cursor: 'pointer' }}
              >
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  style={{ accentColor: 'var(--harbor)', marginTop: '2px' }}
                />
                I agree to Terms & Privacy Policy
              </label>

              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={loading}
                style={{
                  padding: '12px 20px',
                  fontSize: '14px',
                  boxShadow: '0 2px 8px rgba(31, 111, 107, 0.3)',
                  border: '1px solid var(--harbor-dark)',
                }}
              >
                {loading ? 'Creating account...' : 'Create account →'}
              </button>
            </form>

            <p className="small muted" style={{ textAlign: 'center', marginTop: '24px' }}>
              Already have an account?{' '}
              <Link to="/login" className="link-btn">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
