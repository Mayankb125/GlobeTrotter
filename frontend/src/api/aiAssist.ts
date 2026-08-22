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

const getMockAiResponse = (tripId: string, req: AIAssistRequest, numDays: number): AIAssistResponse => {
  const daysDraft: AIDayDraft[] = [];
  
  // Dynamic mock activities based on day index with relative cost weights
  const mockActivitiesByDay = [
    [
      { name: `${req.destination} Highlight Tour`, desc: `Scenic guided tour exploring the best landmarks of ${req.destination}.`, time: '09:00 AM - 01:00 PM', weight: 1.5 },
      { name: 'Local Gastronomy Walk', desc: `Tasting street foods and traditional dinners across ${req.destination}.`, time: '06:00 PM - 09:00 PM', weight: 0.8 },
    ],
    [
      { name: 'Heritage Museum & Palace Visit', desc: 'Guided walkthrough showcasing local history and royal artifacts.', time: '10:00 AM - 01:30 PM', weight: 0.4 },
      { name: 'Scenic Sunset Vantage Stroll', desc: 'Relaxing evening walk to capture panoramic landscape photographs.', time: '05:00 PM - 07:00 PM', weight: 0.2 },
    ],
    [
      { name: 'Outdoor Hiking & Nature Trail', desc: 'Guided eco-trek exploring forests, cliffs, and native flora.', time: '08:00 AM - 12:00 PM', weight: 0.6 },
      { name: 'Traditional Handcrafts Workshop', desc: 'Hands-on learning session from local master artisans.', time: '03:00 PM - 05:30 PM', weight: 0.8 },
    ],
    [
      { name: 'Local Markets & Bazaar Shopping', desc: 'Exploring traditional bazaars, handlooms, and spices.', time: '11:00 AM - 03:00 PM', weight: 0.4 },
      { name: 'Fine Dining & Cultural Performance', desc: 'Traditional dinner accompanied by local folk music and dance.', time: '07:30 PM - 10:00 PM', weight: 2.0 },
    ],
  ];

  const budgetMax = req.budget_max || 50000;
  
  // 1. Calculate total weight of all activities for the trip duration
  let totalWeight = 0;
  for (let i = 1; i <= numDays; i++) {
    const actTemplate = mockActivitiesByDay[(i - 1) % mockActivitiesByDay.length];
    totalWeight += actTemplate[0].weight + actTemplate[1].weight;
  }

  // 2. Derive cost scaling multiplier based on target activities budget (20% of max budget)
  const budgetMultiplier = (budgetMax * 0.2) / totalWeight;

  for (let i = 1; i <= numDays; i++) {
    const actTemplate = mockActivitiesByDay[(i - 1) % mockActivitiesByDay.length];
    daysDraft.push({
      day: i,
      activities: actTemplate.map((act) => ({
        name: act.name,
        description: act.desc,
        cost: Math.round(act.weight * budgetMultiplier),
        time_slot: act.time,
      })),
    });
  }

  return {
    trip_id: tripId,
    destination: req.destination,
    stops_created: numDays,
    activities_created: numDays * 2,
    budget_items_created: 5,
    ai_degraded: true,
    special_notes: `Fallback simulated ${numDays}-day AI suggestion. Ensure your backend and LLM API keys are configured for real suggestions.`,
    budget_draft: {
      accommodation: Math.round(budgetMax * 0.4),
      activities: Math.round(budgetMax * 0.2),
      food: Math.round(budgetMax * 0.25),
      transportation: Math.round(budgetMax * 0.1),
      miscellaneous: Math.round(budgetMax * 0.05),
      total: budgetMax,
      currency: req.currency || 'INR',
    },
    days_draft: daysDraft,
  };
};

export const aiAssistApi = {
  runAiAssist: async (tripId: string, request: AIAssistRequest): Promise<AIAssistResponse> => {
    try {
      const response = await apiClient.post<AIAssistResponse>(`/trips/${tripId}/ai-assist`, request);
      return response.data;
    } catch (error) {
      console.warn('AI Assist API failed. Returning fallback mock response and saving locally.', error);
      
      let numDays = 3; // default fallback if trip not found
      let tripStartDate = new Date().toISOString().split('T')[0];
      
      const raw = localStorage.getItem('globetrotter_user_trips');
      let trips: any[] = [];
      let tripIdx = -1;
      if (raw) {
        try {
          trips = JSON.parse(raw);
          tripIdx = trips.findIndex((t: any) => t.id === tripId);
          if (tripIdx !== -1) {
            const trip = trips[tripIdx];
            tripStartDate = trip.start_date;
            if (trip.start_date && trip.end_date) {
              const sDate = new Date(trip.start_date);
              const eDate = new Date(trip.end_date);
              const diffTime = Math.abs(eDate.getTime() - sDate.getTime());
              numDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            }
          }
        } catch (e) {
          console.error('Failed to parse mock trips', e);
        }
      }

      const mockRes = getMockAiResponse(tripId, request, numDays);

      if (tripIdx !== -1) {
        try {
          const sTime = new Date(tripStartDate).getTime();
          const mockStops = mockRes.days_draft.map((day, idx) => {
            const stopDate = new Date(sTime + idx * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            const stopId = 'stop_ai_' + Date.now() + '_' + idx;
            return {
              id: stopId,
              trip_id: tripId,
              city_name: request.destination,
              start_date: stopDate,
              end_date: stopDate,
              order_index: idx,
              activities: day.activities.map((act, aIdx) => ({
                id: 'act_ai_' + Date.now() + '_' + idx + '_' + aIdx,
                stop_id: stopId,
                title: act.name,
                category: 'Sightseeing',
                cost_inr: act.cost,
                time_slot: act.time_slot || '09:00 AM',
              })),
            };
          });

          trips[tripIdx].stops = mockStops;
          localStorage.setItem('globetrotter_user_trips', JSON.stringify(trips));
        } catch (e) {
          console.error('Failed to save mock AI suggestion to local storage', e);
        }
      }

      return mockRes;
    }
  },
};
