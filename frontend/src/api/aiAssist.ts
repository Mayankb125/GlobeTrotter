import { apiClient } from './client';

export interface AIAssistRequest {
  destination: string;
  home_location?: string;
  budget_min?: number;
  budget_max?: number;
  travel_style?: string;
  interests?: string[];
  dietary_restrictions?: string[];
  currency?: string;
}

export interface AIActivityDraft {
  name: string;
  description?: string;
  location?: string;
  cost: number;
  time_slot?: string;
  transportation?: string;
}

export interface AIDayDraft {
  day: number;
  date?: string;
  activities: AIActivityDraft[];
}

export interface AIBudgetDraft {
  accommodation: number;
  activities: number;
  food: number;
  transportation: number;
  miscellaneous: number;
  total: number;
  currency: string;
}

export interface AIAssistResponse {
  trip_id: string;
  destination: string;
  stops_created: number;
  activities_created: number;
  budget_items_created: number;
  days_draft: AIDayDraft[];
  budget_draft: AIBudgetDraft;
  special_notes?: string;
  ai_degraded: boolean;
}

const getMockAiResponse = (tripId: string, req: AIAssistRequest): AIAssistResponse => {
  return {
    trip_id: tripId,
    destination: req.destination,
    stops_created: 1,
    activities_created: 2,
    budget_items_created: 3,
    ai_degraded: true,
    special_notes: 'Fallback simulated AI suggestion. Ensure your backend and LLM API keys are configured for real suggestions.',
    budget_draft: {
      accommodation: (req.budget_max || 50000) * 0.4,
      activities: (req.budget_max || 50000) * 0.2,
      food: (req.budget_max || 50000) * 0.15,
      transportation: (req.budget_max || 50000) * 0.15,
      miscellaneous: (req.budget_max || 50000) * 0.1,
      total: req.budget_max || 50000,
      currency: req.currency || 'INR',
    },
    days_draft: [
      {
        day: 1,
        activities: [
          {
            name: `${req.destination} Highlight Tour`,
            description: `Scenic guided tour exploring the best landmarks of ${req.destination}.`,
            cost: (req.budget_max || 50000) * 0.1,
            time_slot: '09:00 AM - 01:00 PM',
          },
          {
            name: 'Local Gastronomy Walk',
            description: `Tasting street foods and traditional dinners across ${req.destination}.`,
            cost: (req.budget_max || 50000) * 0.1,
            time_slot: '06:00 PM - 09:00 PM',
          },
        ],
      },
    ],
  };
};

export const aiAssistApi = {
  runAiAssist: async (tripId: string, request: AIAssistRequest): Promise<AIAssistResponse> => {
    try {
      const response = await apiClient.post<AIAssistResponse>(`/trips/${tripId}/ai-assist`, request);
      return response.data;
    } catch (error) {
      console.warn('AI Assist API failed. Returning fallback mock response.', error);
      return getMockAiResponse(tripId, request);
    }
  },
};
