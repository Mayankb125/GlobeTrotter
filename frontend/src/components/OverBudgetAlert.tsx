import React from 'react';

interface OverBudgetAlertProps {
  overAmountInr: number;
}

export const OverBudgetAlert: React.FC<OverBudgetAlertProps> = ({ overAmountInr }) => {
  return (
    <div
      className="card card-pad"
      style={{
        padding: '14px 18px',
        marginBottom: '20px',
        background: 'var(--coral-tint)',
        borderColor: 'var(--coral)',
        color: 'var(--coral)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div className="row gap12">
        <span style={{ fontSize: '20px' }}>⚠️</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: '14px' }}>Target Budget Exceeded</div>
          <div className="small" style={{ marginTop: '2px', opacity: 0.9 }}>
            Your planned itinerary activities exceed your target cap by ₹{overAmountInr.toLocaleString('en-IN')}.
          </div>
        </div>
      </div>
      <span className="tag" style={{ background: 'var(--coral)', color: '#fff' }}>
        +₹{overAmountInr.toLocaleString('en-IN')} over cap
      </span>
    </div>
  );
};
