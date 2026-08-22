import React from 'react';
import type { TripStop, StopActivity } from '../types/trip';

interface StopCardProps {
  stop: TripStop;
  onRemoveActivity: (stopId: string, activityId: string) => void;
  onAddActivityClick: (stopId: string) => void;
}

export const StopCard: React.FC<StopCardProps> = ({
  stop,
  onRemoveActivity,
  onAddActivityClick,
}) => {
  return (
    <div className="card card-pad" style={{ marginBottom: '20px' }}>
      <div className="row between" style={{ marginBottom: '16px' }}>
        <div>
          <h3 style={{ fontSize: '17px', color: 'var(--ink)' }}>
            📍 {stop.city_name}
          </h3>
          <p className="small muted" style={{ marginTop: '2px' }}>
            📅 {stop.start_date} → {stop.end_date} · {stop.activities?.length || 0} activities planned
          </p>
        </div>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => onAddActivityClick(stop.id)}
        >
          ＋ Add Activity
        </button>
      </div>

      <div className="route-track">
        {stop.activities && stop.activities.length > 0 ? (
          stop.activities.map((act: StopActivity) => (
            <div key={act.id} className="route-stop done">
              <div className="card card-pad row gap12" style={{ padding: '12px 16px' }}>
                <span className="muted">⠿</span>
                <div style={{ flex: 1 }}>
                  <div className="row between">
                    <span style={{ fontWeight: 600, fontSize: '13.5px' }}>{act.title}</span>
                    <span className="tag tag-sundial">{act.category}</span>
                  </div>
                  <div className="row gap10 small muted" style={{ marginTop: '4px' }}>
                    {act.time_slot && <span>🕐 {act.time_slot}</span>}
                    <span>₹{act.cost_inr.toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <button
                  className="btn-icon"
                  style={{ width: '28px', height: '28px' }}
                  onClick={() => onRemoveActivity(stop.id, act.id)}
                  title="Remove activity"
                >
                  ✕
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="route-stop">
            <p className="small muted" style={{ fontStyle: 'italic', padding: '10px 0' }}>
              No activities added yet. Click "Add Activity" to populate this stop.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
