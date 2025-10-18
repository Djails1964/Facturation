// src/constants/dashboardConstants.js
/**
 * Constantes pour le Dashboard - VERSION CORRIGÉE
 * ✅ Pas d'erreurs no-unused-vars
 * ✅ Exports utilisés partout
 */

// ========== ÉTATS DE FACTURE ==========
export const FACTURE_STATES = {
  PAYEE: 'Payée',
  PARTIELLEMENT_PAYEE: 'Partiellement payée',
  EN_ATTENTE: 'En attente',
  RETARD: 'Retard',
  EDITEE: 'Éditée',
  ENVOYEE: 'Envoyée',
  ANNULEE: 'Annulée'
};

// ========== MESSAGES ==========
export const DASHBOARD_MESSAGES = {
  LOADING: 'Chargement des statistiques...',
  NO_DATA: 'Aucune donnée disponible',
  NO_INVOICES: 'Aucune facture pour cette année',
  ERROR: 'Erreur lors du chargement du dashboard',
  REFRESH_SUCCESS: 'Données rafraîchies avec succès',
  REFRESH_ERROR: 'Erreur lors du rafraîchissement',
  ERROR_LOADING_INVOICES: 'Erreur lors du chargement des factures',
  RETRY: 'Réessayer'
};

// ========== SEUILS D'ALERTE ==========
export const DASHBOARD_ALERTS = {
  HIGH_UNPAID: 5000,           // Montant impayé élevé (CHF)
  MANY_OVERDUE: 5,             // Nombre de factures en retard
  LOW_PAYMENT_RATE: 50,        // Taux de paiement faible (%)
  MANY_PENDING: 10             // Nombre de factures en attente
};

// ========== COULEURS PAR ÉTAT ==========
export const STATE_COLORS = {
  [FACTURE_STATES.PAYEE]: '#28a745',
  [FACTURE_STATES.PARTIELLEMENT_PAYEE]: '#fd7e14',
  [FACTURE_STATES.EN_ATTENTE]: '#ffc107',
  [FACTURE_STATES.RETARD]: '#dc3545',
  [FACTURE_STATES.EDITEE]: '#17a2b8',
  [FACTURE_STATES.ENVOYEE]: '#0056b3',
  [FACTURE_STATES.ANNULEE]: '#6c757d'
};

// ========== CLASSES CSS PAR ÉTAT ==========
export const STATE_BADGE_CLASSES = {
  [FACTURE_STATES.PAYEE]: 'etat-payee',
  [FACTURE_STATES.PARTIELLEMENT_PAYEE]: 'etat-partiellement-payee',
  [FACTURE_STATES.EN_ATTENTE]: 'etat-en-attente',
  [FACTURE_STATES.RETARD]: 'etat-retard',
  [FACTURE_STATES.EDITEE]: 'etat-editee',
  [FACTURE_STATES.ENVOYEE]: 'etat-envoyee',
  [FACTURE_STATES.ANNULEA]: 'etat-annulee'
};

// ========== CONFIGURATION GRAPHIQUES ==========
export const CHART_CONFIG = {
  COLORS: ['#800000', '#a06060', '#c08080', '#e0a0a0', '#f0c0c0'],
  MONTHS: [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ],
  LINE_STROKE_WIDTH: 2,
  LINE_ACTIVE_DOT_RADIUS: 8,
  PIE_OUTER_RADIUS: 80,
  PIE_INNER_RADIUS: 60,
  PIE_OUTER_RADIUS_LARGE: 100,
  TOOLTIP_BG_COLOR: 'rgba(255, 255, 255, 0.95)',
  TOOLTIP_BORDER_COLOR: '#ddd'
};

// ========== CONFIGURATION DES CARTES ==========
export const STAT_CARD_CONFIG = {
  ICONS: {
    total: '📄',
    facture: '💰',
    encaisse: '✅',
    impayees: '⏳'
  },
  TYPES: {
    NUMBER: 'number',
    MONTANT: 'montant',
    PERCENTAGE: 'percentage'
  }
};

// ========== CONFIGURATION DU TABLEAU ==========
export const TABLE_CONFIG = {
  MAX_ROWS_DEFAULT: 5,
  ROWS_PER_PAGE: 10,
  SORT_DIRECTIONS: {
    ASC: 'asc',
    DESC: 'desc'
  }
};

// ========== TYPES D'ALERTES ==========
export const ALERT_TYPES = {
  WARNING: 'warning',
  DANGER: 'danger',
  INFO: 'info',
  SUCCESS: 'success'
};

// ========== ICÔNES D'ALERTES ==========
export const ALERT_ICONS = {
  WARNING: '⚠️',
  DANGER: '🔴',
  INFO: 'ℹ️',
  SUCCESS: '✅'
};

// ========== INTERVALLE DE RAFRAÎCHISSEMENT ==========
export const REFRESH_INTERVALS = {
  MANUAL: 0,                    // Manuel uniquement
  AUTO_5MIN: 5 * 60 * 1000,    // 5 minutes
  AUTO_15MIN: 15 * 60 * 1000,  // 15 minutes
  AUTO_1HOUR: 60 * 60 * 1000   // 1 heure
};

// ========== CONFIGURATION CACHE ==========
export const CACHE_CONFIG = {
  ENABLED: true,
  TTL: 5 * 60 * 1000,           // 5 minutes
  MAX_ENTRIES: 10
};

// ========== ANNÉES DISPONIBLES ==========
export const YEARS_RANGE = {
  PAST_YEARS: 5,               // Nombre d'années passées à afficher
  FUTURE_YEARS: 1              // Nombre d'années futures à afficher
};

// ========== FORMAT D'EXPORT ==========
export const EXPORT_FORMATS = {
  CSV: 'csv',
  PDF: 'pdf',
  EXCEL: 'xlsx',
  JSON: 'json'
};

// ========== COLONNES DU TABLEAU ==========
export const TABLE_COLUMNS = {
  NUMERO: 'numeroFacture',
  DATE: 'dateFacture',
  CLIENT: 'client',
  MONTANT: 'montantTotal',
  ETAT: 'etatAffichage',
  ACTION: 'action'
};

// ========== INDICATEURS DE PERFORMANCE ==========
export const PERFORMANCE_INDICATORS = {
  FACTURES_TREND: 'totalFacturesChange',
  MONTANT_TREND: 'montantTotalChange',
  PAIEMENT_TREND: 'montantPayeChange',
  RATE_TREND: 'paymentRateChange',
  GENERAL_TREND: 'trend'
};

// ========== STATISTIQUES PAR DÉFAUT ==========
export const DEFAULT_STATS = {
  totalFactures: 0,
  montantTotal: 0,
  montantPaye: 0,
  facturesImpayees: 0,
  statusDistribution: {},
  statusDistributionChart: [],
  monthlyData: []
};

/**
 * Mappe un état de facture à son icône
 */
export const getStateIcon = (state) => {
  const icons = {
    [FACTURE_STATES.PAYEE]: '✅',
    [FACTURE_STATES.PARTIELLEMENT_PAYEE]: '⏸️',
    [FACTURE_STATES.EN_ATTENTE]: '⏳',
    [FACTURE_STATES.RETARD]: '⚠️',
    [FACTURE_STATES.EDITEE]: '✏️',
    [FACTURE_STATES.ENVOYEE]: '📧',
    [FACTURE_STATES.ANNULEE]: '❌'
  };
  return icons[state] || '❓';
};

/**
 * Mappe un état de facture à son label d'affichage
 */
export const getStateLabel = (state) => {
  return state || FACTURE_STATES.EN_ATTENTE;
};

/**
 * Détermine si un état est considéré comme "résolu"
 */
export const isStateResolved = (state) => {
  return [FACTURE_STATES.PAYEE, FACTURE_STATES.ANNULEA].includes(state);
};

/**
 * Détermine si un état nécessite attention
 */
export const isStateAtRisk = (state) => {
  return [FACTURE_STATES.RETARD, FACTURE_STATES.EN_ATTENTE].includes(state);
};