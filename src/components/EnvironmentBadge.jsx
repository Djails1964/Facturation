// src/components/EnvironmentBadge.jsx
import React from 'react';
import { useAppVersion } from '../hooks/useAppVersion';

const EnvironmentBadge = () => {
  const { version, environment, loading } = useAppVersion();
  
  const label = process.env.REACT_APP_ENVIRONMENT_LABEL;
  const color = process.env.REACT_APP_ENVIRONMENT_COLOR;

  // Ne rien afficher en production ou si pas de label
  if (environment === 'production' || !label) {
    return null;
  }

  const badgeStyle = {
    position: 'fixed',
    top: '0',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: color || '#ff9800',
    color: '#fff',
    padding: '4px 16px',
    fontSize: '12px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    borderRadius: '0 0 8px 8px',
    zIndex: 9999,
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    letterSpacing: '1px',
    display: 'flex',
    gap: '10px',
    alignItems: 'center'
  };

  return (
    <div style={badgeStyle}>
      <span>{label}</span>
      <span style={{ opacity: 0.8, fontSize: '10px' }}>
        {loading ? '...' : `v${version}`}
      </span>
    </div>
  );
};

export default EnvironmentBadge;