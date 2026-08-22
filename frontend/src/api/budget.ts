import { apiClient } from './client';
import type { TripBudgetDetails } from '../types/budget';

const MOCK_BUDGET: TripBudgetDetails = {
  trip_id: 'trip_1',
  budget_cap: 185000,
  total_spent_inr: 142500,
  remaining_inr: 42500,
  is_over_budget: false,
  over_amount_inr: 0,
  categories: [
    { category: 'Stays & Haveli Hotels', amount_inr: 68000, percentage: 48, color: '#1f6f6b' },
    { category: 'Sightseeing & Palaces', amount_inr: 28500, percentage: 20, color: '#d98e3f' },
    { category: 'Food & Royal Dining', amount_inr: 26000, percentage: 18, color: '#4b6f9e' },
    { category: 'Transit & Vande Bharat', amount_inr: 20000, percentage: 14, color: '#8a5a9e' },
  ],
};

export const budgetApi = {
  getTripBudget: async (tripId: string): Promise<TripBudgetDetails> => {
    try {
      const response = await apiClient.get<TripBudgetDetails>(`/trips/${tripId}/budget`);
      return response.data;
    } catch (error) {
      return MOCK_BUDGET;
    }
  },
};
