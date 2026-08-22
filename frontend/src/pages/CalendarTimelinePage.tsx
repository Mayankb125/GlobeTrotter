import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';

export const CalendarTimelinePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [viewMode, setViewMode] = useState<'timeline' | 'calendar'>('calendar');
  const [currentMonth, setCurrentMonth] = useState('November 2026');

  const daysTimeline = [
    {
      day: 'Day 1 · Nov 4',
      city: 'Udaipur',
      events: [
        { title: 'Vande Bharat Express (09:30)', time: '09:30', cat: 'Transit' },
        { title: 'Hotel Check-in & Rest (14:00)', time: '14:00', cat: 'Stay' },
        { title: 'Lake Pichola Sunset Boat Cruise (16:30)', time: '16:30', cat: 'Sightseeing' },
        { title: 'Ambrai Restaurant Dinner (19:30)', time: '19:30', cat: 'Food' },
      ],
    },
    {
      day: 'Day 2 · Nov 5',
      city: 'Udaipur',
      events: [
        { title: 'City Palace Guided Tour (10:00)', time: '10:00', cat: 'Sightseeing' },
        { title: 'Jagdish Temple Walk (13:00)', time: '13:00', cat: 'Spiritual' },
        { title: 'Saheliyon-ki-Bari Garden (15:30)', time: '15:30', cat: 'Sightseeing' },
      ],
    },
    {
      day: 'Day 3 · Nov 6',
      city: 'Jaipur',
      events: [
        { title: 'Private Cab Transfer to Jaipur (08:00)', time: '08:00', cat: 'Transit' },
        { title: 'Hawa Mahal Palace View (14:00)', time: '14:00', cat: 'Sightseeing' },
        { title: 'Chokhi Dhani Cultural Dinner (19:00)', time: '19:00', cat: 'Food' },
      ],
    },
  ];

  // Calendar Month Data for November 2026 (Nov 1 is Sunday)
  const daysInMonth = Array.from({ length: 30 }, (_, i) => i + 1);
  const calendarEventsMap: Record<number, { city: string; title: string; color: string }[]> = {
    4: [
      { city: 'Udaipur', title: 'Vande Bharat (09:30)', color: 'var(--harbor)' },
      { city: 'Udaipur', title: 'Pichola Cruise (16:30)', color: 'var(--sundial)' },
    ],
    5: [
      { city: 'Udaipur', title: 'City Palace (10:00)', color: 'var(--sundial)' },
      { city: 'Udaipur', title: 'Jagdish Temple (13:00)', color: 'var(--harbor)' },
    ],
    6: [
      { city: 'Jaipur', title: 'Jaipur Cab (08:00)', color: '#8a5a9e' },
      { city: 'Jaipur', title: 'Hawa Mahal (14:00)', color: 'var(--sundial)' },
    ],
  };

  return (
    <div>
      <div className="row between wrap gap16" style={{ marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', marginBottom: '4px' }}>Calendar & Timeline ▦</h2>
          <p className="muted small">Chronological schedule view across all stops and activities.</p>
        </div>
        <div className="row gap12">
          <div
            className="row gap4"
            style={{
              background: 'var(--paper-2)',
              padding: '4px',
              borderRadius: '99px',
              border: '1px solid var(--line)',
            }}
          >
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

      {viewMode === 'timeline' ? (
        /* Timeline View */
        <div className="col gap20">
          {daysTimeline.map((d, idx) => (
            <div key={idx} className="card card-pad">
              <div
                className="row between"
                style={{ marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px solid var(--line)' }}
              >
                <h3 style={{ fontSize: '16px', color: 'var(--ink)' }}>{d.day}</h3>
                <span className="tag tag-harbor">📍 {d.city}</span>
              </div>
              <div className="col gap10">
                {d.events.map((ev, i) => (
                  <div key={i} className="row between card card-pad" style={{ padding: '12px 16px' }}>
                    <div className="row gap10">
                      <span className="mono small" style={{ color: 'var(--sundial)' }}>
                        🕐 {ev.time}
                      </span>
                      <span className="small font-medium">{ev.title}</span>
                    </div>
                    <span className="tag tag-sundial">{ev.cat}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Calendar Grid View */
        <div className="card card-pad" style={{ padding: '24px' }}>
          <div className="row between" style={{ marginBottom: '20px' }}>
            <div className="row gap12">
              <h3 style={{ fontSize: '18px' }}>{currentMonth}</h3>
              <span className="tag tag-sundial">3 Active Trip Days</span>
            </div>
            <div className="row gap8">
              <button
                className="icon-btn"
                onClick={() => {
                  setCurrentMonth('October 2026');
                  showToast('Switched to October 2026', '◀');
                }}
                style={{ width: '30px', height: '30px' }}
              >
                ‹
              </button>
              <button
                className="icon-btn"
                onClick={() => {
                  setCurrentMonth('December 2026');
                  showToast('Switched to December 2026', '▶');
                }}
                style={{ width: '30px', height: '30px' }}
              >
                ›
              </button>
            </div>
          </div>

          {/* Weekday Labels Header */}
          <div
            className="grid"
            style={{ gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: 'var(--line)', borderRadius: '8px 8px 0 0', overflow: 'hidden' }}
          >
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((w, i) => (
              <div
                key={i}
                style={{
                  background: 'var(--paper-2)',
                  padding: '10px',
                  textAlign: 'center',
                  fontWeight: 700,
                  fontSize: '12px',
                  color: 'var(--ink-soft)',
                }}
              >
                {w}
              </div>
            ))}
          </div>

          {/* Month Day Cells Grid */}
          <div
            className="grid"
            style={{
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '1px',
              background: 'var(--line)',
              border: '1px solid var(--line)',
              borderTop: 'none',
              borderRadius: '0 0 8px 8px',
              overflow: 'hidden',
            }}
          >
            {daysInMonth.map((dayNum) => {
              const events = calendarEventsMap[dayNum] || [];
              const isTripDay = events.length > 0;

              return (
                <div
                  key={dayNum}
                  style={{
                    minHeight: '90px',
                    background: isTripDay ? 'var(--harbor-tint)' : 'var(--card)',
                    padding: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div className="row between">
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: isTripDay ? 700 : 500,
                        color: isTripDay ? 'var(--harbor)' : 'var(--ink-soft)',
                      }}
                    >
                      {dayNum}
                    </span>
                    {isTripDay && (
                      <span className="tag" style={{ background: 'var(--sundial)', color: '#fff', fontSize: '9px', padding: '1px 5px' }}>
                        {events[0].city}
                      </span>
                    )}
                  </div>

                  <div className="col gap4" style={{ marginTop: '6px' }}>
                    {events.map((ev, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: ev.color,
                          color: '#fff',
                          padding: '3px 6px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          cursor: 'pointer',
                        }}
                        onClick={() => showToast(`${ev.title} in ${ev.city}`, '🗓')}
                        title={ev.title}
                      >
                        {ev.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
