import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../components/Toast';

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { showToast } = useToast();

  const handleSignOut = () => {
    logout();
    showToast('Signed out of GlobeTrotter', '🔒');
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <aside className="sidebar">
      <div className="brand" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
        <div className="brand-mark">
          <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
            <rect width="36" height="36" rx="9" fill="url(#gt-grad-side)" />
            <circle cx="18" cy="18" r="9" stroke="#ffffff" strokeWidth="1.8" strokeDasharray="2 2" opacity="0.8" />
            <ellipse cx="18" cy="18" rx="9" ry="4" stroke="#ffffff" strokeWidth="1.5" opacity="0.9" />
            <ellipse cx="18" cy="18" rx="4" ry="9" stroke="#ffffff" strokeWidth="1.5" opacity="0.9" />
            <path d="M10 23C14 15 20 11 25 13" stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round" />
            <circle cx="25" cy="13" r="2.4" fill="#f59e0b" />
            <defs>
              <linearGradient id="gt-grad-side" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                <stop stopColor="#144a47" />
                <stop offset="1" stopColor="#1f6f6b" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div>
          <div className="brand-name" style={{ fontSize: '19px', letterSpacing: '-0.02em' }}>
            GlobeTrotter
          </div>
          <div className="brand-sub">Explore India & Beyond</div>
        </div>
      </div>

      <div className="nav-label">WORKSPACE</div>
      <nav className="route-nav">
        <button
          className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`}
          onClick={() => navigate('/dashboard')}
        >
          <span className="ic">◧</span>Dashboard
        </button>
        <button
          className={`nav-item ${isActive('/trips') ? 'active' : ''}`}
          onClick={() => navigate('/trips')}
        >
          <span className="ic">✈</span>My Trips
        </button>
        <button
          className={`nav-item ${isActive('/create-trip') ? 'active' : ''}`}
          onClick={() => navigate('/create-trip')}
        >
          <span className="ic">＋</span>Create Trip
        </button>
        <button
          className={`nav-item ${isActive('/city-search') ? 'active' : ''}`}
          onClick={() => navigate('/city-search')}
        >
          <span className="ic">⌕</span>City Search
        </button>
      </nav>

      <div className="nav-label">ACTIVE TRIP · RAJASTHAN</div>
      <nav className="route-nav">
        <button
          className={`nav-item ${isActive('/builder') ? 'active' : ''}`}
          onClick={() => navigate('/builder/trip_1')}
        >
          <span className="ic">≋</span>Itinerary Builder
        </button>
        <button
          className={`nav-item ${isActive('/activities') ? 'active' : ''}`}
          onClick={() => navigate('/activities')}
        >
          <span className="ic">◎</span>Activity Search
        </button>
        <button
          className={`nav-item ${isActive('/itinerary') ? 'active' : ''}`}
          onClick={() => navigate('/itinerary/trip_1')}
        >
          <span className="ic">▤</span>Itinerary View
        </button>
        <button
          className="nav-item"
          onClick={() => showToast('Budget Breakdown ready for Phase 10', '¤')}
        >
          <span className="ic">¤</span>Budget Breakdown
        </button>
        <button
          className="nav-item"
          onClick={() => showToast('Calendar / Timeline ready for Phase 10', '▦')}
        >
          <span className="ic">▦</span>Calendar / Timeline
        </button>
      </nav>

      <div className="nav-label">ACCOUNT</div>
      <nav className="route-nav">
        <button
          className={`nav-item ${isActive('/profile') ? 'active' : ''}`}
          onClick={() => showToast('Profile Settings ready for Phase 11', '⚙')}
        >
          <span className="ic">⚙</span>Profile & Settings
        </button>
        <button className="nav-item" onClick={handleSignOut}>
          <span className="ic">⎋</span>Sign out
        </button>
      </nav>

      <div className="sidebar-foot">
        <div className="mini-avatar">
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt={user.name || 'User'} />
          ) : (
            user?.name?.substring(0, 2).toUpperCase() || 'GT'
          )}
        </div>
        <div>
          <div className="who">{user?.name || 'GlobeTrotter User'}</div>
          <div className="plan">Verified Account</div>
        </div>
      </div>
    </aside>
  );
};
