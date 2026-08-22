import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { tripsApi } from '../api/trips';
import { useToast } from '../components/Toast';

const PRESET_COVERS = [
  { name: 'Rajasthan Forts & Palaces', url: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1000&q=80' },
  { name: 'Goa Beaches & Palms', url: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1000&q=80' },
  { name: 'Udaipur Lake Pichola', url: 'https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?auto=format&fit=crop&w=1000&q=80' },
  { name: 'Himalayan Peaks & Valley', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=80' },
];

export const CreateTripPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  const [budgetCap, setBudgetCap] = useState('');
  const [coverImage, setCoverImage] = useState(PRESET_COVERS[0].url);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !destination || !startDate || !endDate) {
      showToast('Please complete all required fields.', '⚠️');
      return;
    }

    try {
      setLoading(true);
      const newTrip = await tripsApi.createTrip({
        name,
        destination,
        start_date: startDate,
        end_date: endDate,
        description,
        cover_image: coverImage,
        budget_cap: Number(budgetCap) || 0,
      });

      showToast(`Trip "${newTrip.name}" created successfully!`, '🎉');
      navigate('/trips');
    } catch (err: any) {
      showToast('Failed to create trip.', '❌');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="card card-pad" style={{ padding: '32px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '4px' }}>Plan New Trip ✈️</h2>
        <p className="muted small" style={{ marginBottom: '28px' }}>
          Enter your destination and dates to start building your custom itinerary in ₹ INR.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Trip Title *</label>
            <input
              className="input"
              placeholder="e.g. Royal Rajasthan Expedition"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="grid g2">
            <div className="field">
              <label>Destination(s) in India *</label>
              <div className="input-icon-wrap">
                <span className="ico">⌕</span>
                <input
                  className="input"
                  placeholder="e.g. Jaipur, Udaipur, Goa"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="field">
              <label>Target Budget Cap (₹ INR)</label>
              <input
                className="input"
                type="number"
                placeholder="185000"
                value={budgetCap}
                onChange={(e) => setBudgetCap(e.target.value)}
              />
            </div>
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

          <div className="field">
            <label>Description & Trip Goals</label>
            <textarea
              className="input"
              rows={3}
              placeholder="Brief summary of sights, stays, and activities..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div className="field" style={{ marginBottom: '24px' }}>
            <label>Choose Cover Image</label>
            <div className="grid g4" style={{ marginTop: '8px' }}>
              {PRESET_COVERS.map((preset, idx) => (
                <div
                  key={idx}
                  onClick={() => setCoverImage(preset.url)}
                  style={{
                    height: '80px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundImage: `url(${preset.url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    cursor: 'pointer',
                    border: coverImage === preset.url ? '3px solid var(--harbor)' : '1px solid var(--line)',
                    position: 'relative',
                  }}
                  title={preset.name}
                >
                  {coverImage === preset.url && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        background: 'var(--harbor)',
                        color: '#fff',
                        borderRadius: '50%',
                        width: '18px',
                        height: '18px',
                        fontSize: '11px',
                        display: 'grid',
                        placeItems: 'center',
                      }}
                    >
                      ✓
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="row gap12" style={{ justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => navigate('/trips')}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating Trip...' : '✦ Create Trip & Open Builder →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
