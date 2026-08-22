import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tripsApi } from '../api/trips';
import { stopsApi } from '../api/stops';
import { activitiesApi } from '../api/activities';
import type { Trip, TripStop } from '../types/trip';
import { StopCard } from '../components/StopCard';
import { useToast } from '../components/Toast';
import { Spinner } from '../components/Spinner';

export const ItineraryBuilderPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);

  // Add Stop Modal State
  const [isAddStopOpen, setIsAddStopOpen] = useState(false);
  const [cityName, setCityName] = useState('Jodhpur, Rajasthan');
  const [startDate, setStartDate] = useState('2026-11-08');
  const [endDate, setEndDate] = useState('2026-11-10');

  const loadTrip = async () => {
    try {
      setLoading(true);
      const data = await tripsApi.getTripById(id || 'trip_1');
      setTrip(data);
    } catch (err) {
      showToast('Trip not found, loading default trip...', '⚠️');
      const data = await tripsApi.getTripById('trip_1');
      setTrip(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrip();
  }, [id]);

  const handleAddStop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trip) return;

    try {
      const newStop = await stopsApi.addStop({
        trip_id: trip.id,
        city_name: cityName,
        start_date: startDate,
        end_date: endDate,
      });

      setTrip((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          stops: [...(prev.stops || []), newStop],
        };
      });

      showToast(`Added "${cityName}" stop to trip!`, '📍');
      setIsAddStopOpen(false);
    } catch (err) {
      showToast('Failed to add stop.', '❌');
    }
  };

  const handleRemoveActivity = async (stopId: string, activityId: string) => {
    try {
      await activitiesApi.deleteActivity(activityId);
      setTrip((prev) => {
        if (!prev || !prev.stops) return prev;
        return {
          ...prev,
          stops: prev.stops.map((s) => {
            if (s.id === stopId) {
              return {
                ...s,
                activities: s.activities?.filter((a) => a.id !== activityId),
              };
            }
            return s;
          }),
        };
      });
      showToast('Activity removed.', '🗑️');
    } catch (err) {
      showToast('Failed to remove activity.', '❌');
    }
  };

  const handleAskAiFillGaps = async () => {
    if (!trip) return;
    showToast(`Asking AI for ${trip.destination} itinerary gap suggestions...`, '🤖');
    setTimeout(() => {
      const newAct = {
        id: 'act_ai_' + Date.now(),
        stop_id: trip.stops?.[0]?.id || 'stop_1',
        title: `Heritage Palace Walk in ${trip.destination.split(',')[0]}`,
        category: 'Sightseeing',
        cost_inr: 500,
        time_slot: '15:00 · 1 hr',
      };

      setTrip((prev) => {
        if (!prev || !prev.stops || prev.stops.length === 0) return prev;
        const updatedStops = [...prev.stops];
        updatedStops[0].activities = [...(updatedStops[0].activities || []), newAct];
        return { ...prev, stops: updatedStops };
      });

      showToast(`AI added "${newAct.title}" to Day 1!`, '✨');
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
    <div>
      {/* Header Banner */}
      <div className="card card-pad" style={{ marginBottom: '24px', background: 'var(--night)', color: '#fff' }}>
        <div className="row between wrap gap16">
          <div>
            <span className="tag" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>
              Itinerary Builder
            </span>
            <h2 style={{ color: '#fff', fontSize: '24px', marginTop: '8px' }}>
              {trip.name}
            </h2>
            <p className="small" style={{ color: 'var(--night-muted)', marginTop: '4px' }}>
              {trip.destination} · {trip.start_date} → {trip.end_date}
            </p>
          </div>
          <div className="row gap10">
            <button className="btn btn-sundial btn-sm" onClick={handleAskAiFillGaps}>
              ✦ Ask AI to Fill Gaps
            </button>
            <button
              className="btn btn-sm"
              style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}
              onClick={() => setIsAddStopOpen(true)}
            >
              ＋ Add Stop
            </button>
            <button
              className="btn btn-sm"
              style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}
              onClick={() => navigate(`/itinerary/${trip.id}`)}
            >
              View Itinerary →
            </button>
          </div>
        </div>
      </div>

      {/* Stops List */}
      <div>
        {trip.stops && trip.stops.length > 0 ? (
          trip.stops.map((stop: TripStop) => (
            <StopCard
              key={stop.id}
              stop={stop}
              onRemoveActivity={handleRemoveActivity}
              onAddActivityClick={() => navigate(`/activities`)}
            />
          ))
        ) : (
          <div className="card card-pad" style={{ textAlign: 'center', padding: '48px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>No stops added yet</h3>
            <p className="muted small" style={{ marginBottom: '20px' }}>
              Add your first city destination to begin building your trip stops.
            </p>
            <button className="btn btn-primary" onClick={() => setIsAddStopOpen(true)}>
              ＋ Add First Stop
            </button>
          </div>
        )}
      </div>

      {/* Add Stop Drawer / Modal */}
      {isAddStopOpen && (
        <div className="modal-overlay active" onClick={() => setIsAddStopOpen(false)}>
          <div className="support-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h3 style={{ fontSize: '16px', color: '#fff' }}>Add Stop to Itinerary</h3>
              <button
                className="btn-icon"
                onClick={() => setIsAddStopOpen(false)}
                style={{ background: 'transparent', color: '#fff', borderColor: 'rgba(255,255,255,0.2)' }}
              >
                ✕
              </button>
            </div>
            <div className="drawer-body">
              <form onSubmit={handleAddStop}>
                <div className="field">
                  <label>City Name *</label>
                  <input
                    className="input"
                    value={cityName}
                    onChange={(e) => setCityName(e.target.value)}
                    required
                  />
                </div>
                <div className="grid g2">
                  <div className="field">
                    <label>Start Date *</label>
                    <input
                      className="input"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="field">
                    <label>End Date *</label>
                    <input
                      className="input"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <button type="submit" className="btn btn-sundial btn-block" style={{ marginTop: '14px' }}>
                  Add Stop →
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
