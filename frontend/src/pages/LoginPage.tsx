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
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
      {/* Left Branding Showcase Panel */}
      <div
        style={{
          background: 'var(--night)',
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
          padding: '48px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.5,
            backgroundImage:
              'radial-gradient(circle at 15% 20%, #d98e3f 0 2px, transparent 2.6px),radial-gradient(circle at 40% 55%, #1f6f6b 0 2px, transparent 2.6px),radial-gradient(circle at 70% 30%, #fff 0 1.6px, transparent 2px)',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1 }} className="row between">
          <div className="row gap10">
            <div className="brand-mark">
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
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em' }}>
              GlobeTrotter
            </span>
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '420px' }}>
          <p className="eyebrow" style={{ color: 'var(--sundial)' }}>
            AI travel guide · OpenStreetMap & OSRM
          </p>
          <h1 style={{ fontSize: '38px', color: '#fff', lineHeight: 1.12, marginTop: '10px' }}>
            Explore India & the world with GlobeTrotter.
          </h1>
          <p style={{ color: 'var(--night-muted)', marginTop: '14px', fontSize: '14.5px', lineHeight: 1.6 }}>
            Tell GlobeTrotter where you want to travel — it drafts a day-by-day itinerary, finds Haveli stays, hidden ghats & thali spots, and routes your trip in ₹ INR.
          </p>

          <div className="row gap12" style={{ marginTop: '26px' }}>
            <div className="row" style={{ marginRight: '2px' }}>
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
                className="avatar"
                style={{ width: '28px', height: '28px', border: '2px solid var(--night)' }}
                alt="User"
              />
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80"
                className="avatar"
                style={{ width: '28px', height: '28px', border: '2px solid var(--night)', marginLeft: '-8px' }}
                alt="User"
              />
              <img
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80"
                className="avatar"
                style={{ width: '28px', height: '28px', border: '2px solid var(--night)', marginLeft: '-8px' }}
                alt="User"
              />
            </div>
            <span className="small" style={{ color: 'var(--night-muted)' }}>
              Joined by 24,000+ GlobeTrotters exploring India & abroad
            </span>
          </div>
        </div>

        <p className="xsmall" style={{ position: 'relative', zIndex: 1, color: 'var(--night-muted)' }}>
          © GlobeTrotter AI Travel, Inc.
        </p>
      </div>

      {/* Right Login Form */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        <div style={{ width: '100%', maxWidth: '380px' }}>
          <div className="row gap8" style={{ background: 'var(--paper-2)', padding: '4px', borderRadius: '99px', marginBottom: '28px' }}>
            <button className="btn btn-block" style={{ background: 'var(--card)', boxShadow: '0 1px 3px rgba(0,0,0,.08)', color: 'var(--ink)' }}>
              Sign in
            </button>
            <button className="btn btn-block btn-ghost" style={{ border: 'none' }} onClick={() => navigate('/signup')}>
              Create account
            </button>
          </div>

          <div>
            <h2 style={{ fontSize: '23px', marginBottom: '4px' }}>Welcome back to GlobeTrotter</h2>
            <p className="muted small" style={{ marginBottom: '24px' }}>
              Sign in to access your saved itineraries and AI travel planner.
            </p>

            {error && (
              <div className="card card-pad" style={{ padding: '10px 14px', marginBottom: '16px', background: 'var(--coral-tint)', color: 'var(--coral)', borderColor: 'var(--coral)' }}>
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
                  />
                </div>
              </div>

              <label className="row gap8" style={{ fontWeight: 500, color: 'var(--ink-soft)', marginBottom: '18px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={keepSignedIn}
                  onChange={(e) => setKeepSignedIn(e.target.checked)}
                  style={{ accentColor: 'var(--harbor)' }}
                />
                Keep me signed in
              </label>

              <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign in →'}
              </button>
            </form>

            <div className="row gap10 center" style={{ margin: '20px 0' }}>
              <span style={{ flex: 1, height: '1px', background: 'var(--line)' }} />
              <span className="xsmall muted">or sign in with</span>
              <span style={{ flex: 1, height: '1px', background: 'var(--line)' }} />
            </div>

            <div className="grid g2">
              <button className="btn btn-ghost" onClick={() => handleSocialLogin('Google')}>
                🟢 Google
              </button>
              <button className="btn btn-ghost" onClick={() => handleSocialLogin('Apple')}>
                🍏 Apple
              </button>
            </div>

            <p className="small muted" style={{ textAlign: 'center', marginTop: '22px' }}>
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
