import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tripsApi } from '../api/trips';
import type { Trip } from '../types/trip';
import { TripCard } from '../components/TripCard';
import { useToast } from '../components/Toast';
import { Spinner } from '../components/Spinner';

export const MyTripsPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadTrips = async () => {
    try {
      setLoading(true);
      const data = await tripsApi.getTrips();
      setTrips(data);
    } catch (err) {
      showToast('Failed to load trips', '⚠️');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrips();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this trip?')) return;
    try {
      await tripsApi.deleteTrip(id);
      setTrips((prev) => prev.filter((t) => t.id !== id));
      showToast('Trip deleted.', '🗑️');
    } catch (err) {
      showToast('Failed to delete trip.', '❌');
    }
  };

  const filteredTrips = trips.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.destination.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="row between wrap gap16" style={{ marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', marginBottom: '4px' }}>My Trips ✈️</h2>
          <p className="muted small">Manage and organize your custom travel itineraries.</p>
        </div>
        <button className="btn btn-sundial" onClick={() => navigate('/create-trip')}>
          ＋ Create New Trip
        </button>
      </div>

      <div className="card card-pad" style={{ marginBottom: '24px', padding: '14px 20px' }}>
        <div className="input-icon-wrap">
          <span className="ico">⌕</span>
          <input
            className="input"
            placeholder="Search trips by title or destination..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', placeItems: 'center', padding: '60px' }}>
          <Spinner size="lg" />
        </div>
      ) : filteredTrips.length === 0 ? (
        <div className="card card-pad" style={{ textAlign: 'center', padding: '48px' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>No trips found</h3>
          <p className="muted small" style={{ marginBottom: '20px' }}>
            {search ? 'No trips match your search term.' : 'You have not created any trips yet.'}
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/create-trip')}>
            ＋ Start Planning
          </button>
        </div>
      ) : (
        <div className="grid g3">
          {filteredTrips.map((trip) => (
            <TripCard key={trip.id} trip={trip} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
};
