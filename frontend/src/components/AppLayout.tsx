import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { SupportModal } from './SupportModal';

export const AppLayout: React.FC = () => {
  const location = useLocation();
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('globetrotter-theme');
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('globetrotter-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('globetrotter-theme', 'light');
    }
  };

  const getBreadcrumb = () => {
    if (location.pathname.startsWith('/dashboard')) return { crumb: 'WORKSPACE', title: 'Dashboard' };
    if (location.pathname.startsWith('/trips')) return { crumb: 'WORKSPACE', title: 'My Trips' };
    if (location.pathname.startsWith('/profile')) return { crumb: 'ACCOUNT', title: 'Profile & Settings' };
    return { crumb: 'WORKSPACE', title: 'GlobeTrotter' };
  };

  const { crumb, title } = getBreadcrumb();

  return (
    <div className="app-shell" style={{ display: 'flex' }}>
      <Sidebar />
      <div className="main">
        <Navbar
          crumb={crumb}
          title={title}
          onOpenSupport={() => setIsSupportOpen(true)}
          onToggleTheme={toggleTheme}
          isDark={isDark}
        />
        <div className="stage">
          <Outlet />
        </div>
      </div>
      <SupportModal isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />
    </div>
  );
};
