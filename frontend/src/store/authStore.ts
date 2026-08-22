import { create } from 'zustand';
import type { User } from '../types/user';

// =====================================================================
// Phase 8.2.1 — Auth Store Types & State Interface Contract
// =====================================================================
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  initialize: () => void;
}

// =====================================================================
// Phase 8.2.2 & 8.2.3 — Complete Auth Store Implementation
// =====================================================================
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  // Phase 8.2.2 — Login / Set Session
  setAuth: (user: User, token: string) => {
    localStorage.setItem('globetrotter_jwt_token', token);
    localStorage.setItem('globetrotter_user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },

  // Phase 8.2.2 — Logout / Clear Session
  logout: () => {
    localStorage.removeItem('globetrotter_jwt_token');
    localStorage.removeItem('globetrotter_user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  // Phase 8.2.3 — Rehydration & Boot Initializer
  initialize: () => {
    const token = localStorage.getItem('globetrotter_jwt_token');
    const savedUser = localStorage.getItem('globetrotter_user');
    if (token && savedUser) {
      try {
        const user = JSON.parse(savedUser);
        set({ user, token, isAuthenticated: true });
      } catch (e) {
        localStorage.removeItem('globetrotter_jwt_token');
        localStorage.removeItem('globetrotter_user');
        set({ user: null, token: null, isAuthenticated: false });
      }
    }
  },
}));
