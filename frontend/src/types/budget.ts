export interface CategoryBudget {
  category: string;
  amount_inr: number;
  percentage: number;
  color: string;
}

export interface TripBudgetDetails {
  trip_id: string;
  budget_cap: number;
  total_spent_inr: number;
  remaining_inr: number;
  is_over_budget: boolean;
  over_amount_inr: number;
  categories: CategoryBudget[];
}
