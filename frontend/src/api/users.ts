import { apiClient } from './client';
import type { User } from '../types/user';

export interface UpdateProfileDTO {
  name?: string;
  email?: string;
  profile_photo_url?: string;
  password?: string;
}

export const usersApi = {
  updateProfile: async (dto: UpdateProfileDTO): Promise<User> => {
    try {
      const response = await apiClient.put<any>('/auth/me', dto);
      const user: User = {
        id: response.data.id,
        name: response.data.name,
        email: response.data.email,
        avatar_url: response.data.profile_photo_url || response.data.avatar_url,
        created_at: response.data.created_at,
      };
      localStorage.setItem('globetrotter_user', JSON.stringify(user));
      return user;
    } catch (error) {
      // Local fallback for offline mode
      const savedUser = localStorage.getItem('globetrotter_user');
      if (savedUser) {
        const user = JSON.parse(savedUser);
        const updated = {
          ...user,
          name: dto.name !== undefined ? dto.name : user.name,
          email: dto.email !== undefined ? dto.email : user.email,
          avatar_url: dto.profile_photo_url !== undefined ? dto.profile_photo_url : user.avatar_url,
        };
        localStorage.setItem('globetrotter_user', JSON.stringify(updated));
        return updated;
      }
      throw error;
    }
  },

  deleteAccount: async (): Promise<{ success: boolean }> => {
    try {
      await apiClient.delete('/auth/me');
      localStorage.removeItem('globetrotter_jwt_token');
      localStorage.removeItem('globetrotter_user');
      return { success: true };
    } catch (error) {
      localStorage.removeItem('globetrotter_jwt_token');
      localStorage.removeItem('globetrotter_user');
      return { success: true };
    }
  },
};
