import React from 'react';
import type { City } from '../types/stop';

interface CityResultCardProps {
  city: City;
  onAdd: (city: City) => void;
}

export const CityResultCard: React.FC<CityResultCardProps> = ({ city, onAdd }) => {
  return (
    <div className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div
        className="cover"
        style={{
          height: '140px',
          borderRadius: 0,
          backgroundImage: `url(${city.image_url})`,
        }}
      />
      <div className="card-pad" style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div className="row between" style={{ marginBottom: '4px' }}>
            <div style={{ fontWeight: 700, fontSize: '15px' }}>
              {city.name}, {city.state}
            </div>
            <span className="small font-medium" style={{ color: 'var(--sundial)' }}>
              {city.rating} ★
            </span>
          </div>
          <p className="small muted" style={{ marginTop: '4px' }}>
            {city.description}
          </p>
          <div className="row gap8 wrap" style={{ marginTop: '10px' }}>
            <span className="tag tag-sundial">☀ {city.weather}</span>
            <span className="tag tag-harbor">{city.avg_cost}</span>
          </div>
        </div>

        <button
          className="btn btn-ghost btn-sm btn-block"
          style={{ marginTop: '14px' }}
          onClick={() => onAdd(city)}
        >
          ＋ Add to Trip
        </button>
      </div>
    </div>
  );
};
