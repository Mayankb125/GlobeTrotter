import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import { useAuthStore } from './store/authStore';

import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute';
import { AppLayout } from './components/AppLayout';

// Auth Pages (Phase 8)
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { DashboardPage } from './pages/DashboardPage';

// Trip Building Pages (Phase 9)
import { CreateTripPage } from './pages/CreateTripPage';
import { MyTripsPage } from './pages/MyTripsPage';
import { CitySearchPage } from './pages/CitySearchPage';
import { ItineraryBuilderPage } from './pages/ItineraryBuilderPage';
import { ActivitySearchPage } from './pages/ActivitySearchPage';
import { ItineraryViewPage } from './pages/ItineraryViewPage';

export const App: React.FC = () => {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <ToastProvider>
      <Router>
        <Routes>
          {/* Public Auth Routes */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          </Route>

          {/* Protected Application Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/trips" element={<MyTripsPage />} />
              <Route path="/create-trip" element={<CreateTripPage />} />
              <Route path="/city-search" element={<CitySearchPage />} />
              <Route path="/builder/:id" element={<ItineraryBuilderPage />} />
              <Route path="/activities" element={<ActivitySearchPage />} />
              <Route path="/itinerary/:id" element={<ItineraryViewPage />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
};

export default App;
