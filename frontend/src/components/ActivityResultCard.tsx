import React from 'react';
import type { Activity } from '../types/activity';

interface ActivityResultCardProps {
  activity: Activity;
  onAdd: (activity: Activity) => void;
}

export const ActivityResultCard: React.FC<ActivityResultCardProps> = ({ activity, onAdd }) => {
  return (
    <div className="card card-pad" style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div>
        <div className="row between" style={{ marginBottom: '6px' }}>
          <span style={{ fontWeight: 700, fontSize: '15px' }}>{activity.title}</span>
          <span className="tag tag-sundial">{activity.category}</span>
        </div>
        <div className="row gap10 small muted" style={{ marginBottom: '8px' }}>
          <span>📍 {activity.city_name}</span>
          {activity.time_slot && <span>🕐 {activity.time_slot}</span>}
          {activity.rating && <span style={{ color: 'var(--sundial)' }}>{activity.rating} ★</span>}
        </div>
        {activity.description && (
          <p className="small muted" style={{ marginTop: '4px' }}>
            {activity.description}
          </p>
        )}
      </div>

      <div className="row between" style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--line-soft)' }}>
        <span className="small font-bold" style={{ color: 'var(--harbor)', fontSize: '14px' }}>
          ₹{activity.cost_inr.toLocaleString('en-IN')}
        </span>
        <button className="btn btn-primary btn-sm" onClick={() => onAdd(activity)}>
          ＋ Add to Stop
        </button>
      </div>
    </div>
  );
};
