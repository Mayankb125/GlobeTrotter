export interface City {
  id: string;
  name: string;
  state: string;
  country: string;
  description: string;
  rating: number;
  weather: string;
  avg_cost: string;
  image_url: string;
}

export interface AddStopDTO {
  trip_id: string;
  city_name: string;
  start_date: string;
  end_date: string;
}
