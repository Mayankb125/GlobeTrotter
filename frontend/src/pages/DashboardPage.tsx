import React from 'react';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../components/Toast';

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const { showToast } = useToast();

  return (
    <div>
      {/* Welcome & Stats Row */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '4px' }}>
          Welcome back, {user?.name || 'Traveler'}! ✈️
        </h2>
        <p className="muted small">
          Here is your AI travel summary and upcoming trip itineraries.
        </p>
      </div>

      <div className="grid g4" style={{ marginBottom: '24px' }}>
        <div className="card stat-card">
          <div className="stat-label">Upcoming trip</div>
          <div className="stat-value">18d</div>
          <div className="stat-delta up">Rajasthan · Nov 4</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Trips planned</div>
          <div className="stat-value">12</div>
          <div className="stat-delta up">+3 this year</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">States & Destinations</div>
          <div className="stat-value">14</div>
          <div className="stat-delta soft">across India & overseas</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Avg. budget accuracy</div>
          <div className="stat-value">96%</div>
          <div className="stat-delta up">AI ₹ estimate vs actual</div>
        </div>
      </div>

      {/* Main Active Trip & Tasks Banner */}
      <div className="grid" style={{ gridTemplateColumns: '1.6fr 1fr', gap: '20px', marginBottom: '24px' }}>
        <div
          className="card card-pad"
          style={{
            background:
              "linear-gradient(120deg,rgba(14,23,22,0.85),rgba(31,51,48,0.9)), url('https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1000&q=80')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            color: '#fff',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <span className="tag" style={{ background: 'rgba(255,255,255,.18)', color: '#fff' }}>
            Continue planning
          </span>
          <h2 style={{ color: '#fff', fontSize: '24px', marginTop: '12px' }}>
            Royal Rajasthan Circuit
          </h2>
          <p className="small" style={{ color: 'rgba(255,255,255,0.85)', marginTop: '6px' }}>
            Nov 4–12 · Jaipur → Udaipur → Jodhpur · 2 travelers
          </p>
          <div className="progress" style={{ marginTop: '16px', background: 'rgba(255,255,255,.2)' }}>
            <span style={{ width: '68%', background: 'var(--sundial)' }} />
          </div>
          <div className="row gap10" style={{ marginTop: '18px' }}>
            <button
              className="btn btn-sundial btn-sm"
              onClick={() => showToast('Opening Itinerary Builder...', '≋')}
            >
              Open builder →
            </button>
            <button
              className="btn btn-sm"
              style={{ background: 'rgba(255,255,255,.15)', color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}
              onClick={() => showToast('Loading Budget Breakdown...', '¤')}
            >
              View budget
            </button>
          </div>
        </div>

        <div className="card card-pad">
          <div style={{ marginBottom: '14px' }}>
            <h3 style={{ fontSize: '15px' }}>This week in India</h3>
          </div>
          <div className="col gap14">
            <div
              className="row gap12"
              style={{ cursor: 'pointer' }}
              onClick={() => showToast('Boat & Jagmandir tickets confirmed', '🎫')}
            >
              <div
                className="tag tag-sundial"
                style={{ width: '34px', height: '34px', borderRadius: '50%', justifyContent: 'center' }}
              >
                🎫
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '13px' }}>Book Lake Pichola boat tour</div>
                <div className="small muted">Due Thu</div>
              </div>
            </div>
            <div
              className="row gap12"
              style={{ cursor: 'pointer' }}
              onClick={() => showToast('Haveli dining budget saved', '💴')}
            >
              <div
                className="tag tag-harbor"
                style={{ width: '34px', height: '34px', borderRadius: '50%', justifyContent: 'center' }}
              >
                💴
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '13px' }}>Set Haveli dining budget for Udaipur</div>
                <div className="small muted">Due Fri</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Plan New Trip Banner */}
      <div className="card card-pad" style={{ padding: '24px 32px' }}>
        <div className="row between wrap gap16">
          <div>
            <h3 style={{ fontSize: '16px', marginBottom: '4px' }}>Ready to plan a new adventure?</h3>
            <p className="small muted">
              Draft a custom day-by-day itinerary with AI routing & budget estimates in ₹ INR.
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => showToast('Create Trip wizard ready for Phase 9', '＋')}
          >
            ＋ Plan New Trip
          </button>
        </div>
      </div>
    </div>
  );
};
