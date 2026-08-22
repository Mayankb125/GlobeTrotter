import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tripsApi } from '../api/trips';
import type { Trip, TripStop, StopActivity } from '../types/trip';
import { useToast } from '../components/Toast';
import { Spinner } from '../components/Spinner';

export const ItineraryViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);

  const loadTrip = async () => {
    try {
      setLoading(true);
      const data = await tripsApi.getTripById(id || 'trip_1');
      setTrip(data);
    } catch (err) {
      showToast('Loading sample trip itinerary...', 'ℹ️');
      const data = await tripsApi.getTripById('trip_1');
      setTrip(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrip();
  }, [id]);

  if (loading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', padding: '80px' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (!trip) return null;

  return (
    <div>
      {/* Cover Header */}
      <div
        className="cover"
        style={{
          height: '240px',
          marginBottom: '24px',
          backgroundImage: `url(${
            trip.cover_image ||
            'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1600&q=80'
          })`,
        }}
      >
        <div className="cover-overlay" />
        <div style={{ position: 'absolute', bottom: '24px', left: '32px', right: '32px', color: '#fff', zIndex: 2 }}>
          <span className="tag" style={{ background: 'rgba(255,255,255,.2)', color: '#fff' }}>
            {trip.stops?.length || 0} cities · Full Itinerary View
          </span>
          <h1 style={{ color: '#fff', fontSize: '32px', marginTop: '8px' }}>{trip.name}</h1>
          <p style={{ color: 'rgba(255,255,255,.9)', marginTop: '4px', fontSize: '14px' }}>
            {trip.start_date} → {trip.end_date} · {trip.destination}
          </p>
        </div>
      </div>

      <div className="row between wrap gap16" style={{ marginBottom: '24px' }}>
        <div className="row gap12 wrap">
          <span className="tag tag-harbor" style={{ padding: '6px 12px', fontSize: '13px' }}>
            🌤 26°C avg weather
          </span>
          <span className="tag tag-sundial" style={{ padding: '6px 12px', fontSize: '13px' }}>
            ₹ {trip.budget_cap ? `₹${trip.budget_cap.toLocaleString('en-IN')} cap` : 'Estimated'}
          </span>
        </div>
        <div className="row gap10">
          <button className="btn btn-sundial btn-sm" onClick={() => navigate(`/builder/${trip.id}`)}>
            ✏️ Edit in Builder
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              showToast('Itinerary link copied to clipboard!', '🔗');
            }}
          >
            🔗 Share Link
          </button>
        </div>
      </div>

      {/* Day Blocks across Stops */}
      <div className="col gap24">
        {trip.stops && trip.stops.length > 0 ? (
          trip.stops.map((stop: TripStop, index: number) => (
            <div key={stop.id} className="card card-pad">
              <div className="row between" style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--line)' }}>
                <div>
                  <h3 style={{ fontSize: '18px', color: 'var(--ink)' }}>
                    Stop {index + 1}: {stop.city_name}
                  </h3>
                  <p className="small muted" style={{ marginTop: '2px' }}>
                    📅 {stop.start_date} → {stop.end_date}
                  </p>
                </div>
                <span className="tag tag-harbor">{stop.activities?.length || 0} activities</span>
              </div>

              <div className="route-track">
                {stop.activities && stop.activities.length > 0 ? (
                  stop.activities.map((act: StopActivity) => (
                    <div key={act.id} className="route-stop done">
                      <div className="card card-pad row between gap12" style={{ padding: '14px 18px' }}>
                        <div>
                          <div className="row gap8">
                            {act.time_slot && (
                              <span className="small mono muted">{act.time_slot}</span>
                            )}
                            <span style={{ fontWeight: 600, fontSize: '14px' }}>{act.title}</span>
                          </div>
                          {act.notes && (
                            <p className="small muted" style={{ marginTop: '4px' }}>
                              {act.notes}
                            </p>
                          )}
                        </div>
                        <div className="row gap10">
                          <span className="small font-bold" style={{ color: 'var(--harbor)' }}>
                            ₹{act.cost_inr.toLocaleString('en-IN')}
                          </span>
                          <span className="tag tag-sundial">{act.category}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="route-stop">
                    <p className="small muted" style={{ fontStyle: 'italic', padding: '8px 0' }}>
                      No activities scheduled for this stop yet.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="card card-pad" style={{ textAlign: 'center', padding: '48px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>Itinerary is currently empty</h3>
            <p className="muted small" style={{ marginBottom: '20px' }}>
              Add stops and activities to build out your full trip schedule.
            </p>
            <button className="btn btn-primary" onClick={() => navigate(`/builder/${trip.id}`)}>
              Open Itinerary Builder →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
