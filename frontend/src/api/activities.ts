import { apiClient } from './client';
import type { Activity, AddActivityDTO } from '../types/activity';
import type { StopActivity } from '../types/trip';

const MOCK_ACTIVITIES: Activity[] = [
  {
    id: 'act_c1',
    city_name: 'Udaipur',
    title: 'City Palace Guided Tour',
    category: 'Sightseeing',
    description: 'Explore the grand courtyard, crystal gallery, and royal arms room.',
    cost_inr: 800,
    time_slot: '10:00 · 2 hrs',
    rating: 4.9,
  },
  {
    id: 'act_c2',
    city_name: 'Udaipur',
    title: 'Lake Pichola Sunset Boat Cruise',
    category: 'Sightseeing',
    description: 'Scenic evening boat ride to Jagmandir Island Palace.',
    cost_inr: 1500,
    time_slot: '16:30 · 1.5 hrs',
    rating: 4.8,
  },
  {
    id: 'act_c3',
    city_name: 'Udaipur',
    title: 'Ambrai Restaurant Lakeside Thali Dinner',
    category: 'Food',
    description: 'Authentic Rajasthani Laal Maas & Gatte Ki Sabzi overlooking City Palace.',
    cost_inr: 3500,
    time_slot: '19:30 · 2 hrs',
    rating: 4.9,
  },
  {
    id: 'act_c4',
    city_name: 'Jaipur',
    title: 'Amer Fort Elephant & Jeep Safari',
    category: 'Sightseeing',
    description: 'Ascend to Amer Fort hilltop and tour Sheesh Mahal mirror palace.',
    cost_inr: 1200,
    time_slot: '09:00 · 3 hrs',
    rating: 4.8,
  },
  {
    id: 'act_c5',
    city_name: 'Jaipur',
    title: 'Lassiwala Johari Bazaar Refreshment',
    category: 'Food',
    description: 'Famous kulhad lassi in Jaipur’s historic market.',
    cost_inr: 150,
    time_slot: '12:30 · 30 min',
    rating: 4.7,
  },
];

export const activitiesApi = {
  getActivities: async (city?: string, category?: string): Promise<Activity[]> => {
    try {
      const response = await apiClient.get<Activity[]>('/activities', { params: { city, category } });
      return response.data;
    } catch (error) {
      return MOCK_ACTIVITIES.filter((a) => {
        const matchesCity = !city || a.city_name.toLowerCase().includes(city.toLowerCase());
        const matchesCategory = !category || a.category === category;
        return matchesCity && matchesCategory;
      });
    }
  },

  addActivityToStop: async (dto: AddActivityDTO): Promise<StopActivity> => {
    try {
      const response = await apiClient.post<StopActivity>(`/stops/${dto.stop_id}/activities`, dto);
      return response.data;
    } catch (error) {
      return {
        id: 'act_' + Date.now(),
        stop_id: dto.stop_id,
        title: dto.title,
        category: dto.category,
        cost_inr: dto.cost_inr,
        time_slot: dto.time_slot || '10:00',
        notes: dto.notes,
        created_at: new Date().toISOString(),
      };
    }
  },

  deleteActivity: async (activityId: string): Promise<{ success: boolean }> => {
    try {
      await apiClient.delete(`/activities/${activityId}`);
      return { success: true };
    } catch (error) {
      return { success: true };
    }
  },
};
