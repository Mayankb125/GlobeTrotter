export interface StopActivity {
  id: string;
  stop_id: string;
  activity_id?: string;
  title: string;
  category: string;
  cost_inr: number;
  time_slot?: string;
  notes?: string;
  created_at?: string;
}

export interface TripStop {
  id: string;
  trip_id: string;
  city_name: string;
  start_date: string;
  end_date: string;
  order_index: number;
  activities?: StopActivity[];
}

export interface Trip {
  id: string;
  user_id: string;
  name: string;
  destination: string;
  start_date: string;
  end_date: string;
  description?: string;
  cover_image?: string;
  budget_cap?: number;
  is_public?: boolean;
  share_token?: string;
  created_at: string;
  stops?: TripStop[];
}

export interface CreateTripDTO {
  name: string;
  destination: string;
  start_date: string;
  end_date: string;
  description?: string;
  cover_image?: string;
  budget_cap?: number;
}
