import { apiClient } from './client';
import type { City, AddStopDTO } from '../types/stop';
import type { TripStop } from '../types/trip';

const MOCK_CITIES: City[] = [
  {
    id: 'city_1',
    name: 'Udaipur',
    state: 'Rajasthan',
    country: 'India',
    description: 'City of Lakes, royal palaces, and sunset Pichola boat cruises.',
    rating: 4.9,
    weather: '26°C Sunny',
    avg_cost: '₹3,500/day',
    image_url: 'https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'city_2',
    name: 'Jaipur',
    state: 'Rajasthan',
    country: 'India',
    description: 'Pink City featuring Hawa Mahal, Amer Fort, and bazaar shopping.',
    rating: 4.8,
    weather: '28°C Pleasant',
    avg_cost: '₹3,200/day',
    image_url: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'city_3',
    name: 'North Goa',
    state: 'Goa',
    country: 'India',
    description: 'Vibrant beaches, water sports, beach shacks, and night markets.',
    rating: 4.7,
    weather: '30°C Warm',
    avg_cost: '₹4,000/day',
    image_url: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'city_4',
    name: 'Varanasi',
    state: 'Uttar Pradesh',
    country: 'India',
    description: 'Ancient spiritual capital, Ganga Aarti rituals, and boat ghats.',
    rating: 4.9,
    weather: '25°C Clear',
    avg_cost: '₹2,200/day',
    image_url: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=600&q=80',
  },
];

export const stopsApi = {
  getCities: async (query?: string): Promise<City[]> => {
    try {
      const response = await apiClient.get<City[]>('/cities', { params: { q: query } });
      return response.data;
    } catch (error) {
      if (!query) return MOCK_CITIES;
      const lower = query.toLowerCase();
      return MOCK_CITIES.filter(
        (c) => c.name.toLowerCase().includes(lower) || c.state.toLowerCase().includes(lower)
      );
    }
  },

  addStop: async (dto: AddStopDTO): Promise<TripStop> => {
    try {
      const response = await apiClient.post<TripStop>(`/trips/${dto.trip_id}/stops`, dto);
      return response.data;
    } catch (error) {
      return {
        id: 'stop_' + Date.now(),
        trip_id: dto.trip_id,
        city_name: dto.city_name,
        start_date: dto.start_date,
        end_date: dto.end_date,
        order_index: Date.now(),
        activities: [],
      };
    }
  },

  deleteStop: async (stopId: string): Promise<{ success: boolean }> => {
    try {
      await apiClient.delete(`/stops/${stopId}`);
      return { success: true };
    } catch (error) {
      return { success: true };
    }
  },
};
