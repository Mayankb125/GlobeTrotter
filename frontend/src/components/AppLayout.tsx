import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { SupportModal } from './SupportModal';

export const AppLayout: React.FC = () => {
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

  return (
    <div className="app-shell" style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <Sidebar />
      <div className="main" style={{ display: 'flex', flexDirection: 'column', height: '100vh', flex: 1, minWidth: 0 }}>
        <Navbar
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
