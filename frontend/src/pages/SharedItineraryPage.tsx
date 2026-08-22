import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tripsApi } from '../api/trips';
import type { Trip } from '../types/trip';
import { useToast } from '../components/Toast';
import { Spinner } from '../components/Spinner';

export const SharedItineraryPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tripsApi.getTripById('trip_1').then(setTrip).finally(() => setLoading(false));
  }, [token]);

  const handleCopyTrip = () => {
    showToast('Trip copied to your account! Redirecting...', '📋');
    setTimeout(() => {
      navigate('/trips');
    }, 800);
  };

  if (loading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', padding: '80px' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (!trip) return null;

  return (
    <div style={{ maxWidth: '900px', margin: '40px auto', padding: '0 20px' }}>
      <div className="card card-pad" style={{ marginBottom: '24px', background: 'var(--night)', color: '#fff' }}>
        <div className="row between wrap gap16">
          <div>
            <span className="tag" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>
              🌐 Shared Public Itinerary
            </span>
            <h1 style={{ color: '#fff', fontSize: '28px', marginTop: '8px' }}>{trip.name}</h1>
            <p className="small" style={{ color: 'var(--night-muted)', marginTop: '4px' }}>
              {trip.start_date} → {trip.end_date} · {trip.destination}
            </p>
          </div>
          <button className="btn btn-sundial" onClick={handleCopyTrip}>
            📋 Copy Trip to My Account
          </button>
        </div>
      </div>

      <div className="card card-pad">
        <h3 style={{ fontSize: '18px', marginBottom: '12px' }}>Trip Itinerary Highlights</h3>
        <p className="small muted" style={{ marginBottom: '20px' }}>
          This is a read-only view shared by a GlobeTrotter user. You can copy this trip to your workspace to customize your own dates and budget.
        </p>

        <div className="col gap16">
          {trip.stops?.map((stop, idx) => (
            <div key={stop.id} className="card card-pad" style={{ padding: '16px' }}>
              <div className="row between" style={{ marginBottom: '10px' }}>
                <span style={{ fontWeight: 700, fontSize: '16px' }}>Stop {idx + 1}: {stop.city_name}</span>
                <span className="tag tag-harbor">{stop.start_date} → {stop.end_date}</span>
              </div>
              <div className="col gap8">
                {stop.activities?.map((act) => (
                  <div key={act.id} className="row between small muted" style={{ padding: '6px 0', borderBottom: '1px solid var(--line-soft)' }}>
                    <span>{act.title}</span>
                    <span className="font-bold" style={{ color: 'var(--harbor)' }}>₹{act.cost_inr.toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
