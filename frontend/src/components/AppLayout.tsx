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
    if (location.pathname.startsWith('/create-trip')) return { crumb: 'WORKSPACE', title: 'Create Trip' };
    if (location.pathname.startsWith('/city-search')) return { crumb: 'WORKSPACE', title: 'City Search' };
    if (location.pathname.startsWith('/builder')) return { crumb: 'ACTIVE TRIP', title: 'Itinerary Builder' };
    if (location.pathname.startsWith('/activities')) return { crumb: 'ACTIVE TRIP', title: 'Activity Search' };
    if (location.pathname.startsWith('/itinerary')) return { crumb: 'ACTIVE TRIP', title: 'Itinerary View' };
    if (location.pathname.startsWith('/profile')) return { crumb: 'ACCOUNT', title: 'Profile & Settings' };
    return { crumb: 'WORKSPACE', title: 'GlobeTrotter' };
  };

  const { crumb, title } = getBreadcrumb();

  return (
    <div className="app-shell" style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <Sidebar />
      <div className="main" style={{ display: 'flex', flexDirection: 'column', height: '100vh', flex: 1, minWidth: 0 }}>
        <Navbar
          crumb={crumb}
          title={title}
          onOpenSupport={() => setIsSupportOpen(true)}
          onToggleTheme={toggleTheme}
          isDark={isDark}
        />
        <div className="stage" style={{ padding: '20px 28px', flex: 1, overflowY: 'auto', maxWidth: '1300px' }}>
          <Outlet />
        </div>
      </div>
      <SupportModal isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />
    </div>
  );
};
