import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/auth';
import { useToast } from '../components/Toast';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const { showToast } = useToast();

  const [email, setEmail] = useState('saksham@example.com');
  const [password, setPassword] = useState('globetrotter123');
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await authApi.login({ email, password });
      setAuth(res.user, res.access_token);
      showToast(`Welcome back to GlobeTrotter, ${res.user.name}!`, '🎉');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    showToast(`Signing in via ${provider}...`, '🔒');
    setTimeout(async () => {
      const res = await authApi.login({ email: `user.${provider.toLowerCase()}@globetrotter.io` });
      setAuth(res.user, res.access_token);
      showToast(`Signed in with ${provider}!`, '🎉');
      navigate('/dashboard');
    }, 600);
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

            Explore India & the world with GlobeTrotter.
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', marginTop: '16px', fontSize: '15px', lineHeight: 1.6 }}>
            Tell GlobeTrotter where you want to travel — it drafts a day-by-day itinerary, finds Haveli stays, hidden ghats & thali spots, and routes your trip in ₹ INR.
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

      {/* Right Login Form with Styled Crisp Button Borders */}
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
              className="btn btn-block"
              style={{
                background: 'var(--card)',
                boxShadow: '0 1px 3px rgba(0,0,0,.08)',
                color: 'var(--ink)',
                border: '1px solid var(--line)',
              }}
            >
              Sign in
            </button>
            <button
              className="btn btn-block btn-ghost"
              style={{ border: '1px solid transparent' }}
              onClick={() => navigate('/signup')}
            >
              Create account
            </button>
          </div>

          <div>
            <h2 style={{ fontSize: '24px', marginBottom: '4px' }}>Welcome back to GlobeTrotter</h2>
            <p className="muted small" style={{ marginBottom: '24px' }}>
              Sign in to access your saved itineraries and AI travel planner.
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

            <form onSubmit={handleLogin}>
              <div className="field">
                <label>Email</label>
                <div className="input-icon-wrap">
                  <span className="ico">✉</span>
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
              </div>

              <div className="field">
                <div className="row between">
                  <label>Password</label>
                  <Link to="/forgot-password" className="link-btn xsmall">
                    Forgot?
                  </Link>
                </div>
                <div className="input-icon-wrap">
                  <span className="ico">⚿</span>
                  <input
                    className="input"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ border: '1px solid var(--line)' }}
                  />
                </div>
              </div>

              <label
                className="row gap8"
                style={{ fontWeight: 500, color: 'var(--ink-soft)', marginBottom: '20px', cursor: 'pointer' }}
              >
                <input
                  type="checkbox"
                  checked={keepSignedIn}
                  onChange={(e) => setKeepSignedIn(e.target.checked)}
                  style={{ accentColor: 'var(--harbor)' }}
                />
                Keep me signed in
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
                {loading ? 'Signing in...' : 'Sign in →'}
              </button>
            </form>

            <div className="row gap10 center" style={{ margin: '22px 0' }}>
              <span style={{ flex: 1, height: '1px', background: 'var(--line)' }} />
              <span className="xsmall muted">or sign in with</span>
              <span style={{ flex: 1, height: '1px', background: 'var(--line)' }} />
            </div>

            <div className="grid g2">
              <button
                className="btn"
                onClick={() => handleSocialLogin('Google')}
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--line)',
                  boxShadow: 'var(--shadow-sm)',
                  fontWeight: 600,
                }}
              >
                🟢 Google
              </button>
              <button
                className="btn"
                onClick={() => handleSocialLogin('Apple')}
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--line)',
                  boxShadow: 'var(--shadow-sm)',
                  fontWeight: 600,
                }}
              >
                🍏 Apple
              </button>
            </div>

            <p className="small muted" style={{ textAlign: 'center', marginTop: '24px' }}>
              New to GlobeTrotter?{' '}
              <Link to="/signup" className="link-btn">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
