import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { stopsApi } from '../api/stops';
import type { City } from '../types/stop';
import { CityResultCard } from '../components/CityResultCard';
import { useToast } from '../components/Toast';
import { Spinner } from '../components/Spinner';

export const CitySearchPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [query, setQuery] = useState('');
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCities = async (searchQuery?: string) => {
    try {
      setLoading(true);
      const data = await stopsApi.getCities(searchQuery);
      setCities(data);
    } catch (err) {
      showToast('Failed to fetch cities', '⚠️');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCities();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCities(query);
  };

  const handleAddCityToTrip = (city: City) => {
    showToast(`Adding "${city.name}" to trip wizard...`, '✈️');
    navigate('/create-trip');
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '4px' }}>City Search ⌕</h2>
        <p className="muted small">Discover top destinations across India and add them to your trip.</p>
      </div>

      <div className="card card-pad" style={{ marginBottom: '24px' }}>
        <form onSubmit={handleSearch} className="grid" style={{ gridTemplateColumns: '1fr auto', gap: '12px' }}>
          <div className="input-icon-wrap">
            <span className="ico">⌕</span>
            <input
              className="input"
              placeholder="Search a city, state, or region (e.g. Udaipur, Goa, Rajasthan)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Search
          </button>
        </form>
      </div>

      {loading ? (
        <div style={{ display: 'grid', placeItems: 'center', padding: '60px' }}>
          <Spinner size="lg" />
        </div>
      ) : cities.length === 0 ? (
        <div className="card card-pad" style={{ textAlign: 'center', padding: '48px' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>No cities found</h3>
          <p className="muted small">Try searching for a different destination or region.</p>
        </div>
      ) : (
        <div className="grid g3">
          {cities.map((city) => (
            <CityResultCard key={city.id} city={city} onAdd={handleAddCityToTrip} />
          ))}
        </div>
      )}
    </div>
  );
};
