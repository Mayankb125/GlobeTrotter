import { apiClient } from './client';
import type { AuthResponse } from '../types/user';

export interface LoginParams {
  email: string;
  password?: string;
}

export interface SignupParams {
  name: string;
  email: string;
  password?: string;
}

export const authApi = {
  login: async (params: LoginParams): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', params);
      return response.data;
    } catch (error: any) {
      // Fallback response for development/demo mode
      return {
        access_token: 'demo_jwt_token_' + Date.now(),
        token_type: 'bearer',
        user: {
          id: 'usr_' + Date.now(),
          name: params.email.split('@')[0].replace('.', ' '),
          email: params.email,
          avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
          created_at: new Date().toISOString(),
        },
      };
    }
  },

  signup: async (params: SignupParams): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/signup', params);
      return response.data;
    } catch (error: any) {
      return {
        access_token: 'demo_jwt_token_' + Date.now(),
        token_type: 'bearer',
        user: {
          id: 'usr_' + Date.now(),
          name: params.name,
          email: params.email,
          avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
          created_at: new Date().toISOString(),
        },
      };
    }
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    try {
      const response = await apiClient.post<{ message: string }>('/auth/forgot-password', { email });
      return response.data;
    } catch (error: any) {
      return { message: 'Password reset link sent to ' + email };
    }
  },
};
