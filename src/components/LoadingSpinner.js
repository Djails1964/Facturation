// src/components/LoadingSpinner.js
import React from 'react';
import '../styles/components/LoadingSpinner.css'; // À créer pour le style

const LoadingSpinner = ({ message = 'Chargement...' }) => {
  return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p className="loading-message">{message}</p>
    </div>
  );
};

export default LoadingSpinner;