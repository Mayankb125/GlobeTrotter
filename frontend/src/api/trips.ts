import { apiClient } from './client';
import type { Trip, CreateTripDTO } from '../types/trip';

// Mock initial storage for local UI testing fallback
const LOCAL_STORAGE_KEY = 'globetrotter_user_trips';

const MOCK_INITIAL_TRIPS: Trip[] = [
  {
    id: 'trip_1',
    user_id: 'usr_demo',
    name: 'Royal Rajasthan Circuit',
    destination: 'Jaipur, Udaipur, Jodhpur',
    start_date: '2026-11-04',
    end_date: '2026-11-12',
    description: 'Exploring royal palaces, lake Pichola sunset boat tours, and authentic thali dining.',
    cover_image: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1000&q=80',
    budget_cap: 185000,
    is_public: true,
    share_token: 'raj_circuit_2026',
    created_at: new Date().toISOString(),
    stops: [
      {
        id: 'stop_1',
        trip_id: 'trip_1',
        city_name: 'Udaipur, Rajasthan',
        start_date: '2026-11-04',
        end_date: '2026-11-07',
        order_index: 0,
        activities: [
          {
            id: 'act_1',
            stop_id: 'stop_1',
            title: 'Vande Bharat Express (Delhi → Udaipur)',
            category: 'Transit',
            cost_inr: 2500,
            time_slot: '09:30',
          },
          {
            id: 'act_2',
            stop_id: 'stop_1',
            title: 'Lake Pichola Sunset Boat Cruise',
            category: 'Sightseeing',
            cost_inr: 1500,
            time_slot: '16:30',
          },
          {
            id: 'act_3',
            stop_id: 'stop_1',
            title: 'Ambrai Restaurant Lakeside Dinner',
            category: 'Food',
            cost_inr: 3500,
            time_slot: '19:30',
          },
        ],
      },
    ],
  },
  {
    id: 'trip_2',
    user_id: 'usr_demo',
    name: 'Goa Sun & Beach Retreat',
    destination: 'North & South Goa',
    start_date: '2026-12-15',
    end_date: '2026-12-20',
    description: 'Beachside shacks, water sports at Calangute, and Panjim heritage strolls.',
    cover_image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1000&q=80',
    budget_cap: 95000,
    is_public: false,
    created_at: new Date().toISOString(),
    stops: [],
  },
];

const getStoredTrips = (): Trip[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(MOCK_INITIAL_TRIPS));
    return MOCK_INITIAL_TRIPS;
  } catch (e) {
    return MOCK_INITIAL_TRIPS;
  }
};

const saveStoredTrips = (trips: Trip[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(trips));
  } catch (e) {}
};

export const tripsApi = {
  getTrips: async (): Promise<Trip[]> => {
    try {
      const response = await apiClient.get<Trip[]>('/trips');
      return response.data;
    } catch (error) {
      return getStoredTrips();
    }
  },

  getTripById: async (id: string): Promise<Trip> => {
    try {
      const response = await apiClient.get<Trip>(`/trips/${id}`);
      return response.data;
    } catch (error) {
      const trips = getStoredTrips();
      const found = trips.find((t) => t.id === id);
      if (!found) throw new Error('Trip not found');
      return found;
    }
  },

  createTrip: async (dto: CreateTripDTO): Promise<Trip> => {
    try {
      const response = await apiClient.post<Trip>('/trips', dto);
      return response.data;
    } catch (error) {
      const trips = getStoredTrips();
      const newTrip: Trip = {
        id: 'trip_' + Date.now(),
        user_id: 'usr_demo',
        ...dto,
        cover_image:
          dto.cover_image ||
          'https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?auto=format&fit=crop&w=1000&q=80',
        created_at: new Date().toISOString(),
        stops: [],
      };
      trips.unshift(newTrip);
      saveStoredTrips(trips);
      return newTrip;
    }
  },

  deleteTrip: async (id: string): Promise<{ success: boolean }> => {
    try {
      await apiClient.delete(`/trips/${id}`);
      return { success: true };
    } catch (error) {
      const trips = getStoredTrips().filter((t) => t.id !== id);
      saveStoredTrips(trips);
      return { success: true };
    }
  },
};
