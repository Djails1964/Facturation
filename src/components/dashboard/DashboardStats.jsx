// src/components/dashboard/DashboardStats.jsx
/**
 * Composant principal du Dashboard - VERSION REFACTORISÉE CORRIGÉE
 * ✅ Erreurs corrigées
 * ✅ Imports ajustés
 * ✅ Props variables renommées
 */

import React, { useState, useEffect } from 'react';
import { useDashboard } from './hooks/useDashboard';
import DashboardStatCards from './sections/DashboardStatCards';
import DashboardCharts from './sections/DashboardCharts';
import DashboardRecentInvoices from './sections/DashboardRecentInvoices';
import DashboardControls from './sections/DashboardControls';
import { generateYearOptions, generateDashboardAlerts } from './helpers/dashboardHelpers';
import '../../styles/components/dashboard/DashboardStats.css';

/**
 * Composant principal du Dashboard
 */
function DashboardStats({
  onViewFacture = null,
  onFilterByStatus = null,
  notification = null,
  onClearNotification = null
}) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [alerts, setAlerts] = useState([]);

  // Hook principal avec données normalisées
  const {
    stats,
    factures,
    loading,
    error,
    refresh,
    formatMontant,
    formatDate
  } = useDashboard(selectedYear);

  // Mettre à jour les alertes quand les stats changent
  useEffect(() => {
    if (stats) {
      const newAlerts = generateDashboardAlerts(stats);
      setAlerts(newAlerts);
    }
  }, [stats]);

  // Générer les options d'années
  const yearOptions = generateYearOptions(currentYear);

  /**
   * Gère le changement d'année
   */
  const handleYearChange = (e) => {
    setSelectedYear(parseInt(e.target.value));
  };

  /**
   * Gère le filtrage par état
   */
  const handleFilterByStatus = (status) => {
    if (onFilterByStatus) {
      onFilterByStatus(status);
    }
  };

  // Affichage des erreurs
  if (error) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-error">
          <h3>Erreur</h3>
          <p>{error}</p>
          <button
            className="btn-primary"
            onClick={refresh}
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* En-tête avec titre et contrôles */}
      <div className="dashboard-header">
        <h2>Dashboard</h2>
        <DashboardControls
          selectedYear={selectedYear}
          yearOptions={yearOptions}
          onYearChange={handleYearChange}
          onRefresh={refresh}
          isLoading={loading}
        />
      </div>

      {/* Affichage des notifications */}
      {notification && notification.message && (
        <div className={`notification ${notification.type}`}>
          <span>{notification.message}</span>
          {onClearNotification && (
            <button
              className="notification-close"
              onClick={onClearNotification}
              aria-label="Fermer la notification"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Affichage des alertes */}
      {alerts.length > 0 && (
        <div className="dashboard-alerts">
          {alerts.map((alert, index) => (
            <div
              key={index}
              className={`alert alert-${alert.type}`}
              role="alert"
            >
              {alert.message}
            </div>
          ))}
        </div>
      )}

      {/* Cartes statistiques principales */}
      <DashboardStatCards stats={stats} loading={loading} />

      {/* Graphiques */}
      <DashboardCharts stats={stats} loading={loading} />

      {/* Tableau des factures récentes */}
      <DashboardRecentInvoices
        factures={factures}
        loading={loading}
        onViewFacture={onViewFacture}
        maxRows={5}
        showFooter={true}
      />
    </div>
  );
}

export default DashboardStats;