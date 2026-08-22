import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import { useAuthStore } from './store/authStore';

import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute';
import { AppLayout } from './components/AppLayout';

import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { DashboardPage } from './pages/DashboardPage';

export const App: React.FC = () => {
  const { initialize } = useAuthStore();

  useEffect(() => {
    // Rehydrate auth state from localStorage on app boot (Phase 8.2.3 & 8.10)
    initialize();
  }, [initialize]);

  return (
    <ToastProvider>
      <Router>
        <Routes>
          {/* Public Routes (Accessible only when logged out) */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          </Route>

          {/* Protected Routes (Accessible only when logged in) */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/trips" element={<DashboardPage />} />
              <Route path="/profile" element={<DashboardPage />} />
            </Route>
          </Route>

          {/* Default Fallback Redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
};

export default App;
