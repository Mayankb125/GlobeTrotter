import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from './Toast';
import { useAuthStore } from '../store/authStore';

interface NavbarProps {
  onOpenSupport: () => void;
  onToggleTheme: () => void;
  isDark: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSupport,
  onToggleTheme,
  isDark,
}) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    showToast(`Searching for "${searchQuery}"...`, '⌕');
    navigate('/city-search');
  };

  return (
    <div className="topbar" style={{ justifyContent: 'space-between' }}>
      {/* Prominent Left-Aligned Navbar Search Bar */}
      <form onSubmit={handleSearchSubmit} style={{ flex: 1, maxWidth: '480px' }}>
        <div className="input-icon-wrap">
          <span className="ico" style={{ fontSize: '15px' }}>⌕</span>
          <input
            className="input"
            placeholder="Search trips, destinations, activities in India..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              borderRadius: '99px',
              padding: '8px 16px 8px 36px',
              fontSize: '13px',
              background: 'var(--paper-2)',
              border: '1px solid var(--line)',
              width: '100%',
            }}
          />
        </div>
      </form>

      {/* Right Navbar Controls */}
      <div className="topbar-right" style={{ flexShrink: 0 }}>
        <button
          className="icon-btn"
          onClick={onToggleTheme}
          title="Toggle Dark/Light Mode"
        >
          <span className="theme-toggle-ic">{isDark ? '☀️' : '🌙'}</span>
        </button>
        <button
          className="btn btn-sundial btn-sm"
          onClick={() => navigate('/create-trip')}
        >
          ＋ New trip
        </button>
        <button
          className="icon-btn"
          onClick={() => showToast('No pending notifications', '🔔')}
          title="Notifications"
        >
          🔔<span className="ping"></span>
        </button>
        <button
          className="icon-btn"
          onClick={onOpenSupport}
          title="GlobeTrotter Help & Support"
        >
          ?
        </button>
        <div
          className="mini-avatar"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/profile')}
          title={user?.name || 'User Profile'}
        >
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt={user.name || 'User'} />
          ) : (
            user?.name?.substring(0, 2).toUpperCase() || 'GT'
          )}
        </div>
      </div>
    </div>
  );
};
