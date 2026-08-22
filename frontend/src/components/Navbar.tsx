import React from 'react';
import { useToast } from './Toast';
import { useAuthStore } from '../store/authStore';

interface NavbarProps {
  crumb: string;
  title: string;
  onOpenSupport: () => void;
  onToggleTheme: () => void;
  isDark: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  crumb,
  title,
  onOpenSupport,
  onToggleTheme,
  isDark,
}) => {
  const { showToast } = useToast();
  const { user } = useAuthStore();

  return (
    <div className="topbar">
      <div className="topbar-title">
        <div className="crumb">{crumb}</div>
        <h1>{title}</h1>
      </div>
      <div className="topbar-right">
        <button
          className="icon-btn"
          onClick={onToggleTheme}
          title="Toggle Dark/Light Mode"
        >
          <span className="theme-toggle-ic">{isDark ? '☀️' : '🌙'}</span>
        </button>
        <button
          className="btn btn-sundial btn-sm"
          onClick={() => showToast('Create trip wizard ready for Phase 9', '＋')}
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
