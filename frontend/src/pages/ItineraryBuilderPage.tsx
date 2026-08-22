import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tripsApi } from '../api/trips';
import { stopsApi } from '../api/stops';
import { activitiesApi } from '../api/activities';
import { aiAssistApi } from '../api/aiAssist';
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

  // AI Assist Modal States
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<any>(null);

  // AI Request inputs
  const [aiHome, setAiHome] = useState('Home');
  const [aiBudgetMin, setAiBudgetMin] = useState(5000);
  const [aiBudgetMax, setAiBudgetMax] = useState(50000);
  const [aiStyle, setAiStyle] = useState('balanced');
  const [aiInterests, setAiInterests] = useState<string[]>(['sightseeing']);

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

  const handleAiSuggest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trip) return;

    try {
      setAiLoading(true);
      const res = await aiAssistApi.runAiAssist(trip.id, {
        destination: trip.destination,
        home_location: aiHome,
        budget_min: aiBudgetMin,
        budget_max: aiBudgetMax,
        travel_style: aiStyle,
        interests: aiInterests,
        currency: 'INR',
      });
      setAiResponse(res);
      showToast('AI Itinerary draft ready!', '✨');
    } catch (err: any) {
      console.error(err);
      showToast('AI Assist failed to generate itinerary.', '⚠️');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAcceptAi = () => {
    setIsAiOpen(false);
    setAiResponse(null);
    loadTrip();
    showToast('Itinerary loaded successfully!', '✅');
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
            <button className="btn btn-sundial btn-sm" onClick={() => setIsAiOpen(true)}>
              ✦ AI Itinerary Assist
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
            <div style={{ display: 'flex', gap: '14px', justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={() => setIsAddStopOpen(true)}>
                ＋ Add First Stop
              </button>
              <button className="btn btn-sundial" onClick={() => setIsAiOpen(true)}>
                ✦ Auto-Generate with AI
              </button>
            </div>
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
      {/* AI Assist Drawer */}
      {isAiOpen && (
        <div className="modal-overlay active" onClick={() => { if (!aiLoading) setIsAiOpen(false); }}>
          <div className="support-drawer" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="drawer-header" style={{ background: 'var(--gt-primary, #144a47)' }}>
              <h3 style={{ fontSize: '16px', color: '#fff', margin: 0 }}>✦ AI Travel Planner Assist</h3>
              <button
                className="btn-icon"
                disabled={aiLoading}
                onClick={() => setIsAiOpen(false)}
                style={{ background: 'transparent', color: '#fff', borderColor: 'rgba(255,255,255,0.2)' }}
              >
                ✕
              </button>
            </div>

            <div className="drawer-body" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 70px)' }}>
              {aiLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: '20px' }}>
                  <Spinner size="lg" />
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontWeight: 600, margin: '0 0 6px 0' }}>AI is designing your itinerary...</p>
                    <p className="small muted" style={{ margin: 0 }}>This may take 5-10 seconds to research weather, routes, and activities.</p>
                  </div>
                </div>
              ) : aiResponse ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="card card-pad" style={{ background: 'var(--gt-primary-tint, #eef7f6)', borderColor: 'var(--gt-primary)' }}>
                    <h4 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>✨</span> Itinerary Generated Successfully!
                    </h4>
                    <p className="small" style={{ margin: '0 0 10px 0' }}>
                      Created <b>{aiResponse.stops_created} stops</b>, <b>{aiResponse.activities_created} activities</b>, and <b>{aiResponse.budget_items_created} budget items</b>.
                    </p>
                    {aiResponse.ai_degraded && (
                      <p className="small" style={{ color: '#b45309', margin: 0 }}>
                        ⚠️ <i>Note: Server returned simulated fallback itinerary (degraded mode).</i>
                      </p>
                    )}
                  </div>

                  {aiResponse.special_notes && (
                    <div style={{ fontSize: '13px', background: 'var(--paper)', borderLeft: '3px solid var(--gt-primary)', padding: '8px 12px' }}>
                      <b>AI Insights:</b> {aiResponse.special_notes}
                    </div>
                  )}

                  <div>
                    <h4 style={{ margin: '0 0 8px 0' }}>Itinerary Preview</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '200px', overflowY: 'auto' }}>
                      {aiResponse.days_draft?.map((day: any) => (
                        <div key={day.day} className="card card-pad" style={{ padding: '10px 14px' }}>
                          <div style={{ fontWeight: 600, fontSize: '13px' }}>Day {day.day}</div>
                          {day.activities?.map((act: any, idx: number) => (
                            <div key={idx} className="small muted" style={{ marginTop: '4px' }}>
                              • {act.name} ({act.time_slot})
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 style={{ margin: '0 0 8px 0' }}>Estimated Budget Draft</h4>
                    <div className="grid g2 gap10">
                      <div className="small">Accommodation: <b>₹{aiResponse.budget_draft?.accommodation}</b></div>
                      <div className="small">Activities: <b>₹{aiResponse.budget_draft?.activities}</b></div>
                      <div className="small">Food: <b>₹{aiResponse.budget_draft?.food}</b></div>
                      <div className="small">Transit: <b>₹{aiResponse.budget_draft?.transportation}</b></div>
                    </div>
                    <div style={{ fontWeight: 700, borderTop: '1px solid var(--gt-border)', paddingTop: '8px', marginTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Total Budget Draft:</span>
                      <span>₹{aiResponse.budget_draft?.total}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => setAiResponse(null)}
                    >
                      ← Back / Re-Generate
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleAcceptAi}
                    >
                      Accept & Import Itinerary
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleAiSuggest}>
                  <div className="field">
                    <label>Destination</label>
                    <input className="input" value={trip.destination} disabled />
                  </div>

                  <div className="field">
                    <label>Origin Location (for flight cost estimates)</label>
                    <input
                      className="input"
                      value={aiHome}
                      onChange={(e) => setAiHome(e.target.value)}
                      placeholder="e.g. Delhi, Mumbai"
                      required
                    />
                  </div>

                  <div className="grid g2">
                    <div className="field">
                      <label>Min Budget (INR)</label>
                      <input
                        className="input"
                        type="number"
                        min="0"
                        value={aiBudgetMin}
                        onChange={(e) => setAiBudgetMin(Number(e.target.value))}
                        required
                      />
                    </div>
                    <div className="field">
                      <label>Max Budget (INR)</label>
                      <input
                        className="input"
                        type="number"
                        min="0"
                        value={aiBudgetMax}
                        onChange={(e) => setAiBudgetMax(Number(e.target.value))}
                        required
                      />
                    </div>
                  </div>

                  <div className="field">
                    <label>Travel Style</label>
                    <select
                      className="input"
                      value={aiStyle}
                      onChange={(e) => setAiStyle(e.target.value)}
                      style={{ background: 'var(--paper)', border: '1px solid var(--gt-border)' }}
                    >
                      <option value="budget">Budget (economic options)</option>
                      <option value="balanced">Balanced (standard comfort)</option>
                      <option value="comfort">Comfort (premium stays)</option>
                      <option value="luxury">Luxury (exclusive experiences)</option>
                    </select>
                  </div>

                  <div className="field">
                    <label>Travel Interests (Ctrl+Click to select multiple)</label>
                    <select
                      className="input"
                      multiple
                      value={aiInterests}
                      onChange={(e) => {
                        const opts = Array.from(e.target.selectedOptions, (option) => option.value);
                        setAiInterests(opts);
                      }}
                      style={{ background: 'var(--paper)', border: '1px solid var(--gt-border)', height: '100px' }}
                    >
                      <option value="sightseeing">Sightseeing / Landmarks</option>
                      <option value="food">Culinary & Street Food</option>
                      <option value="adventure">Outdoor Adventure</option>
                      <option value="history">History & Heritage</option>
                      <option value="nature">Nature & Parks</option>
                      <option value="shopping">Markets & Shopping</option>
                    </select>
                  </div>

                  <button type="submit" className="btn btn-sundial btn-block" style={{ marginTop: '16px' }}>
                    ✦ Generate AI Itinerary →
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
