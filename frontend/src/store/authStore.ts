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
// Phase 8.2.2 — Zustand Store Creation & Actions (setAuth, logout)
// =====================================================================
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  setAuth: (user: User, token: string) => {
    localStorage.setItem('globetrotter_jwt_token', token);
    localStorage.setItem('globetrotter_user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('globetrotter_jwt_token');
    localStorage.removeItem('globetrotter_user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  initialize: () => {
    // Rehydration placeholder — implemented in Phase 8.2.3
  },
}));
