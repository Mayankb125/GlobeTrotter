import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export const CalendarTimelinePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'calendar' | 'timeline'>('timeline');

  const days = [
    { day: 'Day 1 · Nov 4', city: 'Udaipur', events: ['Vande Bharat Express (09:30)', 'Hotel Check-in & Rest (14:00)', 'Lake Pichola Sunset Boat Cruise (16:30)', 'Ambrai Restaurant Dinner (19:30)'] },
    { day: 'Day 2 · Nov 5', city: 'Udaipur', events: ['City Palace Guided Tour (10:00)', 'Jagdish Temple Walk (13:00)', 'Saheliyon-ki-Bari Garden (15:30)'] },
    { day: 'Day 3 · Nov 6', city: 'Jaipur', events: ['Private Cab Transfer to Jaipur (08:00)', 'Hawa Mahal Palace View (14:00)', 'Chokhi Dhani Cultural Dinner (19:00)'] },
  ];

  return (
    <div>
      <div className="row between wrap gap16" style={{ marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', marginBottom: '4px' }}>Calendar & Timeline ▦</h2>
          <p className="muted small">Chronological schedule view across all stops and activities.</p>
        </div>
        <div className="row gap12">
          <div className="row gap8" style={{ background: 'var(--paper-2)', padding: '4px', borderRadius: '99px', border: '1px solid var(--line)' }}>
            <button
              className={`btn btn-sm ${viewMode === 'timeline' ? '' : 'btn-ghost'}`}
              style={viewMode === 'timeline' ? { background: 'var(--card)', border: '1px solid var(--line)' } : { border: 'none' }}
              onClick={() => setViewMode('timeline')}
            >
              Timeline
            </button>
            <button
              className={`btn btn-sm ${viewMode === 'calendar' ? '' : 'btn-ghost'}`}
              style={viewMode === 'calendar' ? { background: 'var(--card)', border: '1px solid var(--line)' } : { border: 'none' }}
              onClick={() => setViewMode('calendar')}
            >
              Calendar
            </button>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/builder/${id || 'trip_1'}`)}>
            ← Back to Builder
          </button>
        </div>
      </div>

      <div className="col gap20">
        {days.map((d, idx) => (
          <div key={idx} className="card card-pad">
            <div className="row between" style={{ marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px solid var(--line)' }}>
              <h3 style={{ fontSize: '16px', color: 'var(--ink)' }}>{d.day}</h3>
              <span className="tag tag-harbor">📍 {d.city}</span>
            </div>
            <div className="col gap10">
              {d.events.map((ev, i) => (
                <div key={i} className="row gap12 card card-pad" style={{ padding: '10px 14px' }}>
                  <span className="mono small" style={{ color: 'var(--sundial)' }}>🗓</span>
                  <span className="small font-medium">{ev}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
