import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', color = 'var(--harbor)' }) => {
  const sizePx = size === 'sm' ? 16 : size === 'lg' ? 32 : 24;

  return (
    <div
      style={{
        width: sizePx,
        height: sizePx,
        border: `2px solid rgba(0, 0, 0, 0.1)`,
        borderTopColor: color,
        borderRadius: '50%',
        animation: 'gtSpin 0.6s linear infinite',
        display: 'inline-block',
      }}
    />
  );
};
