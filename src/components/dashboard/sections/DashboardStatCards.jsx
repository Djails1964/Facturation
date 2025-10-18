// src/components/dashboard/sections/DashboardStatCards.jsx
/**
 * Composant affichant les cartes de statistiques principales
 * ✅ Modulaire et réutilisable
 * ✅ Utilise les formatters centralisés
 */

import React from 'react';
import { formatMontant } from '../../../utils/formatters';
import '../../../styles/components/dashboard/DashboardStatCards.css';

/**
 * Composant réutilisable pour une carte statistique
 */
function StatCard({ title, value, icon, type = 'text', className = '' }) {
  const classes = `stat-card ${className}`.trim();

  let displayValue = value;
  if (type === 'montant' && typeof value === 'number') {
    displayValue = `${formatMontant(value)} CHF`;
  } else if (type === 'number') {
    displayValue = value.toString();
  }

  return (
    <div className={classes}>
      {icon && <div className="stat-icon">{icon}</div>}
      <div className="stat-value">{displayValue}</div>
      <div className="stat-title">{title}</div>
    </div>
  );
}

/**
 * Composant principal affichant toutes les cartes statistiques
 */
export default function DashboardStatCards({ stats, loading }) {
  if (loading) {
    return (
      <div className="dashboard-cards loading">
        <div className="stat-card placeholder">
          <div className="stat-value shimmer"></div>
          <div className="stat-title shimmer"></div>
        </div>
        <div className="stat-card placeholder">
          <div className="stat-value shimmer"></div>
          <div className="stat-title shimmer"></div>
        </div>
        <div className="stat-card placeholder">
          <div className="stat-value shimmer"></div>
          <div className="stat-title shimmer"></div>
        </div>
        <div className="stat-card placeholder">
          <div className="stat-value shimmer"></div>
          <div className="stat-title shimmer"></div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return <div className="dashboard-cards empty">Pas de données disponibles</div>;
  }

  return (
    <div className="dashboard-cards">
      <StatCard
        title="Total factures"
        value={stats.totalFactures}
        icon="📄"
        type="number"
      />

      <StatCard
        title="Facturé (Envoyée + Payée)"
        value={stats.montantTotal}
        icon="💰"
        type="montant"
      />

      <StatCard
        title="Montant encaissé"
        value={stats.montantPaye}
        icon="✅"
        type="montant"
        className="success"
      />

      <StatCard
        title="Factures envoyées (non payées)"
        value={stats.facturesImpayees}
        icon="⏳"
        type="number"
        className="warning"
      />
    </div>
  );
}

export { StatCard };