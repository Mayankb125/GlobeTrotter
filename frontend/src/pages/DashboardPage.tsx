import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../components/Toast';
import { tripsApi } from '../api/trips';
import type { Trip } from '../types/trip';
import { TripCard } from '../components/TripCard';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const [trips, setTrips] = useState<Trip[]>([]);

  useEffect(() => {
    tripsApi.getTrips().then(setTrips).catch(() => {});
  }, []);

  const activeTrip = trips[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '16px' }}>
      {/* Welcome Header */}
      <div>
        <h2 style={{ fontSize: '22px', marginBottom: '2px', lineHeight: 1.2 }}>
          Welcome back, {user?.name || 'Traveler'}! ✈️
        </h2>
        <p className="muted xsmall">
          Here is your AI travel summary and active trip itineraries.
        </p>
      </div>

      {/* Stats Cards Row */}
      <div className="grid g4">
        <div className="card stat-card" style={{ padding: '12px 16px' }}>
          <div className="stat-label">Upcoming trip</div>
          <div className="stat-value" style={{ fontSize: '24px' }}>{activeTrip ? '18d' : 'None'}</div>
          <div className="stat-delta up">{activeTrip?.name || 'Create a trip'}</div>
        </div>
        <div className="card stat-card" style={{ padding: '12px 16px' }}>
          <div className="stat-label">Trips planned</div>
          <div className="stat-value" style={{ fontSize: '24px' }}>{trips.length}</div>
          <div className="stat-delta up">+3 this year</div>
        </div>
        <div className="card stat-card" style={{ padding: '12px 16px' }}>
          <div className="stat-label">States & Destinations</div>
          <div className="stat-value" style={{ fontSize: '24px' }}>14</div>
          <div className="stat-delta soft">across India & overseas</div>
        </div>
        <div className="card stat-card" style={{ padding: '12px 16px' }}>
          <div className="stat-label">Avg. budget accuracy</div>
          <div className="stat-value" style={{ fontSize: '24px' }}>96%</div>
          <div className="stat-delta up">AI ₹ estimate vs actual</div>
        </div>
      </div>

      {/* Main Active Trip Banner & Weekly Tasks */}
      {activeTrip && (
        <div className="grid" style={{ gridTemplateColumns: '1.6fr 1fr', gap: '16px' }}>
          <div
            className="card card-pad"
            style={{
              padding: '16px 20px',
              background: `linear-gradient(120deg,rgba(14,23,22,0.85),rgba(31,51,48,0.9)), url('${
                activeTrip.cover_image ||
                'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1000&q=80'
              }')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              color: '#fff',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <span className="tag" style={{ background: 'rgba(255,255,255,.18)', color: '#fff', padding: '2px 8px', fontSize: '10px' }}>
                Active trip
              </span>
              <h2 style={{ color: '#fff', fontSize: '20px', marginTop: '6px' }}>
                {activeTrip.name}
              </h2>
              <p className="xsmall" style={{ color: 'rgba(255,255,255,0.85)', marginTop: '2px' }}>
                {activeTrip.start_date} → {activeTrip.end_date} · {activeTrip.destination}
              </p>
            </div>
            <div>
              <div className="progress" style={{ marginTop: '10px', background: 'rgba(255,255,255,.2)', height: '4px' }}>
                <span style={{ width: '68%', background: 'var(--sundial)' }} />
              </div>
              <div className="row gap10" style={{ marginTop: '12px' }}>
                <button
                  className="btn btn-sundial btn-sm"
                  onClick={() => navigate(`/builder/${activeTrip.id}`)}
                >
                  Open builder →
                </button>
                <button
                  className="btn btn-sm"
                  style={{ background: 'rgba(255,255,255,.15)', color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}
                  onClick={() => showToast('Budget Breakdown ready for Phase 10', '¤')}
                >
                  View budget
                </button>
              </div>
            </div>
          </div>

          <div className="card card-pad" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '14px', marginBottom: '10px' }}>This week in India</h3>
              <div className="col gap10">
                <div
                  className="row gap10"
                  style={{ cursor: 'pointer' }}
                  onClick={() => showToast('Boat & Jagmandir tickets confirmed', '🎫')}
                >
                  <div
                    className="tag tag-sundial"
                    style={{ width: '30px', height: '30px', borderRadius: '50%', justifyContent: 'center' }}
                  >
                    🎫
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '12.5px' }}>Book Lake Pichola boat tour</div>
                    <div className="xsmall muted">Due Thu</div>
                  </div>
                </div>
                <div
                  className="row gap10"
                  style={{ cursor: 'pointer' }}
                  onClick={() => showToast('Haveli dining budget saved', '💴')}
                >
                  <div
                    className="tag tag-harbor"
                    style={{ width: '30px', height: '30px', borderRadius: '50%', justifyContent: 'center' }}
                  >
                    💴
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '12.5px' }}>Set Haveli dining budget for Udaipur</div>
                    <div className="xsmall muted">Due Fri</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Trips Section */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div className="row between" style={{ marginBottom: '10px' }}>
          <h3 style={{ fontSize: '16px' }}>Recent Trips</h3>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/trips')}>
            View all ({trips.length}) →
          </button>
        </div>
        <div className="grid g2" style={{ flex: 1 }}>
          {trips.slice(0, 2).map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      </div>
    </div>
  );
};
