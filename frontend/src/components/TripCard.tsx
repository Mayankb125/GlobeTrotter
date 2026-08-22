import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Trip } from '../types/trip';

interface TripCardProps {
  trip: Trip;
  onDelete?: (id: string) => void;
}

export const TripCard: React.FC<TripCardProps> = ({ trip, onDelete }) => {
  const navigate = useNavigate();

  const formattedBudget = trip.budget_cap
    ? `₹${trip.budget_cap.toLocaleString('en-IN')}`
    : 'No cap set';

  return (
    <div className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div
        className="cover"
        style={{
          height: '160px',
          borderRadius: 0,
          backgroundImage: `url(${
            trip.cover_image ||
            'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=800&q=80'
          })`,
        }}
      >
        <div className="cover-overlay" />
        <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 2 }}>
          <span className="tag" style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}>
            {trip.stops?.length || 0} stops
          </span>
        </div>
        <div style={{ position: 'absolute', bottom: '12px', left: '16px', right: '16px', color: '#fff', zIndex: 2 }}>
          <h3 style={{ fontSize: '18px', color: '#fff', lineHeight: 1.2 }}>{trip.name}</h3>
          <p className="xsmall" style={{ color: 'rgba(255,255,255,0.85)', marginTop: '2px' }}>
            {trip.destination}
          </p>
        </div>
      </div>

      <div className="card-pad" style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div className="row between small muted" style={{ marginBottom: '8px' }}>
            <span>📅 {trip.start_date} → {trip.end_date}</span>
            <span className="tag tag-sundial">{formattedBudget}</span>
          </div>
          {trip.description && (
            <p className="small muted" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {trip.description}
            </p>
          )}
        </div>

        <div className="row between" style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--line-soft)' }}>
          <div className="row gap8">
            <button
              className="btn btn-sundial btn-sm"
              onClick={() => navigate(`/builder/${trip.id}`)}
            >
              Open Builder →
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => navigate(`/itinerary/${trip.id}`)}
            >
              View
            </button>
          </div>
          {onDelete && (
            <button
              className="btn-icon"
              style={{ width: '30px', height: '30px' }}
              title="Delete Trip"
              onClick={() => onDelete(trip.id)}
            >
              🗑️
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
