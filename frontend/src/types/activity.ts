export interface Activity {
  id: string;
  city_name: string;
  title: string;
  category: 'Sightseeing' | 'Food' | 'Transit' | 'Shopping' | 'Spiritual' | 'Adventure';
  description?: string;
  cost_inr: number;
  time_slot?: string;
  rating?: number;
  image_url?: string;
}

export interface AddActivityDTO {
  stop_id: string;
  title: string;
  category: string;
  cost_inr: number;
  time_slot?: string;
  notes?: string;
}
