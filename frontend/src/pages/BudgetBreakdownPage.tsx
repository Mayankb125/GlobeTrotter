import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { budgetApi } from '../api/budget';
import type { TripBudgetDetails } from '../types/budget';
import { BudgetPieChart } from '../components/BudgetPieChart';
import { OverBudgetAlert } from '../components/OverBudgetAlert';
import { Spinner } from '../components/Spinner';

export const BudgetBreakdownPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [budget, setBudget] = useState<TripBudgetDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    budgetApi.getTripBudget(id || 'trip_1').then(setBudget).finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', padding: '80px' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (!budget) return null;

  return (
    <div>
      <div className="row between wrap gap16" style={{ marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', marginBottom: '4px' }}>Budget Breakdown ¤</h2>
          <p className="muted small">Track estimated expenditure by activity category in ₹ INR.</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/builder/${budget.trip_id}`)}>
          ← Back to Builder
        </button>
      </div>

      {budget.is_over_budget && <OverBudgetAlert overAmountInr={budget.over_amount_inr} />}

      <div className="grid g3" style={{ marginBottom: '24px' }}>
        <div className="card stat-card">
          <div className="stat-label">Target Budget Cap</div>
          <div className="stat-value">₹{budget.budget_cap.toLocaleString('en-IN')}</div>
          <div className="stat-delta up">User defined cap</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Total Planned Expenditure</div>
          <div className="stat-value">₹{budget.total_spent_inr.toLocaleString('en-IN')}</div>
          <div className="stat-delta up">Calculated from activities</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Remaining Budget</div>
          <div className="stat-value" style={{ color: budget.remaining_inr >= 0 ? 'var(--harbor)' : 'var(--coral)' }}>
            ₹{budget.remaining_inr.toLocaleString('en-IN')}
          </div>
          <div className={`stat-delta ${budget.remaining_inr >= 0 ? 'up' : 'down'}`}>
            {budget.remaining_inr >= 0 ? 'Within budget limit' : 'Budget exceeded'}
          </div>
        </div>
      </div>

      <div className="card card-pad">
        <h3 style={{ fontSize: '17px', marginBottom: '16px' }}>Category Allocation Breakdown</h3>
        <BudgetPieChart categories={budget.categories} totalSpent={budget.total_spent_inr} />
      </div>
    </div>
  );
};
