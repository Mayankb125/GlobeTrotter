import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { activitiesApi } from '../api/activities';
import type { Activity } from '../types/activity';
import { ActivityResultCard } from '../components/ActivityResultCard';
import { useToast } from '../components/Toast';
import { Spinner } from '../components/Spinner';

const CATEGORIES = ['All', 'Sightseeing', 'Food', 'Transit', 'Shopping', 'Spiritual', 'Adventure'];

export const ActivitySearchPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [cityFilter, setCityFilter] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchActivities = async (city?: string, cat?: string) => {
    try {
      setLoading(true);
      const categoryParam = cat === 'All' ? undefined : cat;
      const data = await activitiesApi.getActivities(city, categoryParam);
      setActivities(data);
    } catch (err) {
      showToast('Failed to fetch activities', '⚠️');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities(cityFilter, activeCategory);
  }, [activeCategory]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchActivities(cityFilter, activeCategory);
  };

  const handleAddActivity = async (activity: Activity) => {
    try {
      await activitiesApi.addActivityToStop({
        stop_id: 'stop_1',
        title: activity.title,
        category: activity.category,
        cost_inr: activity.cost_inr,
        time_slot: activity.time_slot,
      });

      showToast(`Added "${activity.title}" to itinerary!`, '✅');
      navigate('/builder/trip_1');
    } catch (err) {
      showToast('Failed to add activity.', '❌');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '4px' }}>Activity Search ◎</h2>
        <p className="muted small">Find palace tours, Haveli thalis, and transport stops to add to your itinerary.</p>
      </div>

      <div className="card card-pad" style={{ marginBottom: '20px' }}>
        <form onSubmit={handleSearch} className="grid" style={{ gridTemplateColumns: '1fr auto', gap: '12px', marginBottom: '16px' }}>
          <div className="input-icon-wrap">
            <span className="ico">⌕</span>
            <input
              className="input"
              placeholder="Search by city (e.g. Udaipur, Jaipur)..."
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Search
          </button>
        </form>

        <div className="row gap8 wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`chip ${activeCategory === cat ? 'on' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', placeItems: 'center', padding: '60px' }}>
          <Spinner size="lg" />
        </div>
      ) : activities.length === 0 ? (
        <div className="card card-pad" style={{ textAlign: 'center', padding: '48px' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>No activities found</h3>
          <p className="muted small">Try filtering by a different city or category.</p>
        </div>
      ) : (
        <div className="grid g3">
          {activities.map((act) => (
            <ActivityResultCard key={act.id} activity={act} onAdd={handleAddActivity} />
          ))}
        </div>
      )}
    </div>
  );
};
