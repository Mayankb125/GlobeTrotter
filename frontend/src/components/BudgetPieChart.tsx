import React from 'react';
import type { CategoryBudget } from '../types/budget';

interface BudgetPieChartProps {
  categories: CategoryBudget[];
  totalSpent: number;
}

export const BudgetPieChart: React.FC<BudgetPieChartProps> = ({ categories, totalSpent }) => {
  let cumulative = 0;
  const slices = categories.map((cat) => {
    const startAngle = (cumulative / 100) * 360;
    cumulative += cat.percentage;
    const endAngle = (cumulative / 100) * 360;
    return { ...cat, startAngle, endAngle };
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '32px', padding: '16px 0' }}>
      <div style={{ position: 'relative', width: '180px', height: '180px' }}>
        <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
          {slices.map((slice, i) => {
            const strokeDasharray = `${slice.percentage * 2.827} 282.7`;
            const strokeDashoffset = -((slice.startAngle / 360) * 282.7);
            return (
              <circle
                key={i}
                cx="50"
                cy="50"
                r="45"
                fill="transparent"
                stroke={slice.color}
                strokeWidth="10"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
              />
            );
          })}
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span className="xsmall muted uppercase tracking-wide">Total Spent</span>
          <span style={{ fontWeight: 800, fontSize: '16px', color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>
            ₹{totalSpent.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      <div className="col gap10" style={{ flex: 1 }}>
        {categories.map((cat, idx) => (
          <div key={idx} className="row between small">
            <div className="row gap8">
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: cat.color }} />
              <span style={{ fontWeight: 600 }}>{cat.category}</span>
            </div>
            <div className="row gap8">
              <span className="muted">{cat.percentage}%</span>
              <span className="font-bold">₹{cat.amount_inr.toLocaleString('en-IN')}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
