// src/components/dashboard/helpers/dashboardHelpers.js
/**
 * Fonctions utilitaires pour le dashboard - VERSION CORRIGÉE
 * ✅ Erreurs de switch case corrigées
 * ✅ Toutes les fonctions utilisées
 */

/**
 * Détermine les couleurs d'un état de facture
 */
export const getStatusColor = (status) => {
  const colors = {
    'Payée': '#28a745',
    'Partiellement payée': '#fd7e14',
    'En attente': '#ffc107',
    'Retard': '#dc3545',
    'Éditée': '#17a2b8',
    'Envoyée': '#0056b3',
    'Annulée': '#6c757d'
  };
  return colors[status] || '#666';
};

/**
 * Obtient les classes CSS pour un badge d'état
 */
export const getEtatBadgeClass = (etat) => {
  const classMap = {
    'Payée': 'etat-payee',
    'Partiellement payée': 'etat-partiellement-payee',
    'En attente': 'etat-en-attente',
    'Retard': 'etat-retard',
    'Éditée': 'etat-editee',
    'Envoyée': 'etat-envoyee',
    'Annulée': 'etat-annulee'
  };
  return classMap[etat] || 'etat-default';
};

/**
 * Calcule le taux de paiement (en pourcentage)
 */
export const calculatePaymentRate = (montantPaye, montantTotal) => {
  if (!montantTotal || montantTotal === 0) return 0;
  return Math.round((montantPaye / montantTotal) * 100);
};

/**
 * Formate les données pour affichage dans les cartes statistiques
 */
export const formatStatCard = (value, type = 'montant') => {
  if (type === 'montant') {
    return `${value.toFixed(2)} CHF`;
  }
  return value.toString();
};

/**
 * Génère les options d'années disponibles
 */
export const generateYearOptions = (currentYear = null) => {
  const year = currentYear || new Date().getFullYear();
  const options = [];
  
  for (let i = 0; i <= 5; i++) {
    options.push(year - i);
  }
  
  return options;
};

/**
 * Détermine les seuils d'alerte pour le dashboard
 */
export const getAlertThresholds = () => {
  return {
    highUnpaid: 5000,      // Montant impayé élevé
    manyOverdue: 5,        // Nombre de factures en retard
    lowPaymentRate: 50     // Taux de paiement faible (%)
  };
};

/**
 * Génère les alertes du dashboard basées sur les statistiques
 */
export const generateDashboardAlerts = (stats) => {
  const alerts = [];
  const thresholds = getAlertThresholds();

  if (!stats) return alerts;

  // Alerte: Montant impayé élevé
  const montantImpaye = stats.montantTotal - stats.montantPaye;
  if (montantImpaye > thresholds.highUnpaid) {
    alerts.push({
      type: 'warning',
      message: `⚠️ Montant impayé élevé: ${montantImpaye.toFixed(2)} CHF`,
      severity: 'high'
    });
  }

  // Alerte: Plusieurs factures en retard
  const facturesEnRetard = stats.statusDistribution['Retard'] || 0;
  if (facturesEnRetard > thresholds.manyOverdue) {
    alerts.push({
      type: 'danger',
      message: `🔴 ${facturesEnRetard} factures en retard`,
      severity: 'critical'
    });
  }

  // Alerte: Taux de paiement faible
  if (stats.totalFactures > 0) {
    const paymentRate = calculatePaymentRate(stats.montantPaye, stats.montantTotal);
    if (paymentRate < thresholds.lowPaymentRate && stats.totalFactures > 3) {
      alerts.push({
        type: 'info',
        message: `ℹ️ Taux de paiement: ${paymentRate}%`,
        severity: 'medium'
      });
    }
  }

  return alerts;
};

/**
 * Prépare les données pour l'export (CSV, PDF, etc.)
 */
export const prepareExportData = (factures, stats, selectedYear) => {
  return {
    metadata: {
      year: selectedYear,
      exportDate: new Date().toISOString(),
      totalRecords: factures.length
    },
    summary: {
      totalFactures: stats.totalFactures,
      montantTotal: stats.montantTotal,
      montantPaye: stats.montantPaye,
      montantImpaye: stats.montantTotal - stats.montantPaye
    },
    data: factures.map(f => ({
      numero: f.numeroFacture,
      date: f.dateFacture,
      client: f.client?.nomComplet || `${f.client?.prenom} ${f.client?.nom}`,
      montant: f.montantTotal,
      etat: f.etatAffichage || f.etat
    }))
  };
};

/**
 * Filtre les factures selon les critères
 */
export const filterFactures = (factures, criteria) => {
  let filtered = [...factures];

  if (criteria.etat) {
    filtered = filtered.filter(f => f.etatAffichage === criteria.etat || f.etat === criteria.etat);
  }

  if (criteria.minMontant !== undefined) {
    filtered = filtered.filter(f => f.montantTotal >= criteria.minMontant);
  }

  if (criteria.maxMontant !== undefined) {
    filtered = filtered.filter(f => f.montantTotal <= criteria.maxMontant);
  }

  if (criteria.idClient) {
    filtered = filtered.filter(f => f.client?.id === criteria.idClient);
  }

  if (criteria.dateDebut) {
    filtered = filtered.filter(f => new Date(f.dateFacture) >= new Date(criteria.dateDebut));
  }

  if (criteria.dateFin) {
    filtered = filtered.filter(f => new Date(f.dateFacture) <= new Date(criteria.dateFin));
  }

  return filtered;
};

/**
 * Calcule les indicateurs de performance
 */
export const calculatePerformanceIndicators = (stats, previousYearStats) => {
  const indicators = {
    totalFacturesChange: 0,
    montantTotalChange: 0,
    montantPayeChange: 0,
    paymentRateChange: 0,
    trend: 'stable' // 'up', 'down', 'stable'
  };

  if (!previousYearStats) return indicators;

  // Changement du nombre de factures
  indicators.totalFacturesChange = stats.totalFactures - previousYearStats.totalFactures;

  // Changement du montant total
  indicators.montantTotalChange = stats.montantTotal - previousYearStats.montantTotal;

  // Changement du montant payé
  indicators.montantPayeChange = stats.montantPaye - previousYearStats.montantPaye;

  // Changement du taux de paiement
  const currentRate = calculatePaymentRate(stats.montantPaye, stats.montantTotal);
  const previousRate = calculatePaymentRate(previousYearStats.montantPaye, previousYearStats.montantTotal);
  indicators.paymentRateChange = currentRate - previousRate;

  // Déterminer la tendance
  if (indicators.montantTotalChange > 0 && indicators.montantPayeChange > 0) {
    indicators.trend = 'up';
  } else if (indicators.montantTotalChange < 0 || indicators.montantPayeChange < 0) {
    indicators.trend = 'down';
  }

  return indicators;
};

/**
 * Formate un nombre pour affichage avec séparateurs de milliers
 */
export const formatNumber = (num) => {
  return new Intl.NumberFormat('fr-CH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
};