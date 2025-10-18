// src/components/dashboard/sections/DashboardControls.jsx
/**
 * Composant des contrôles du dashboard
 * ✅ Sélection d'année, rafraîchissement, etc.
 */

import React from 'react';
import '../../../styles/components/dashboard/DashboardControls.css';

export default function DashboardControls({
  selectedYear,
  yearOptions = [],
  onYearChange = null,
  onRefresh = null,
  isLoading = false
}) {
  return (
    <div className="dashboard-controls">
      <div className="control-group">
        <label htmlFor="yearSelect" className="control-label">
          Année:
        </label>
        <select
          id="yearSelect"
          value={selectedYear}
          onChange={onYearChange}
          disabled={isLoading}
          className="control-select"
        >
          {yearOptions.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      {onRefresh && (
        <button
          className="btn-refresh"
          onClick={onRefresh}
          disabled={isLoading}
          title="Rafraîchir les données"
          aria-label="Rafraîchir"
        >
          {isLoading ? (
            <>
              <span className="spinner"></span>
              Chargement...
            </>
          ) : (
            <>
              <span>🔄</span>
              Rafraîchir
            </>
          )}
        </button>
      )}
    </div>
  );
}