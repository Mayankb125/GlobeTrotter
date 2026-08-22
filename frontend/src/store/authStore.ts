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
