// src/constants/index.js
// Point d'entrée unique pour toutes les constantes de l'application.
// Tous les composants doivent importer depuis '../../constants' (ou chemin relatif vers ce dossier)
// et NON pas depuis les fichiers individuels (ex: '../../constants/parametreConstants').

// ================================
// FACTURES
// ================================
export {
  FORM_MODES as FACTURE_FORM_MODES,
  VALIDATION_MESSAGES as FACTURE_VALIDATION_MESSAGES,
  BUTTON_TEXTS as FACTURE_BUTTON_TEXTS,
  FORM_TITLES as FACTURE_FORM_TITLES
} from './factureConstants';

// ================================
// PAIEMENTS
// ================================
export {
  PAIEMENT_ETATS,
  METHODES_PAIEMENT,
  METHODES_PAIEMENT_LABELS,
  VALIDATION_MESSAGES as PAIEMENT_VALIDATION_MESSAGES,
  BUTTON_TEXTS as PAIEMENT_BUTTON_TEXTS,
  FORM_TITLES as PAIEMENT_FORM_TITLES,
  SECTION_TITLES as PAIEMENT_SECTION_TITLES,
  LABELS as PAIEMENT_LABELS,
  PAIEMENT_DATE_CONFIG,
  LOG_ACTIONS as PAIEMENT_LOG_ACTIONS,
  NOTIFICATIONS as PAIEMENT_NOTIFICATIONS,
  LOADING_MESSAGES as PAIEMENT_LOADING_MESSAGES,
  HELP_TEXTS as PAIEMENT_HELP_TEXTS,
  LIMITS as PAIEMENT_LIMITS
} from './paiementConstants';

// ================================
// TARIFICATION
// ================================
export {
  FORM_MODES as TARIF_FORM_MODES,
  FORM_TYPES,
  FORM_TITLES as TARIF_FORM_TITLES,
  LOADING_MESSAGES as TARIF_LOADING_MESSAGES,
  VALIDATION_MESSAGES as TARIF_VALIDATION_MESSAGES,
  ACTION_TYPES as TARIF_ACTION_TYPES,
  NOTIFICATION_TYPES as TARIF_NOTIFICATION_TYPES
} from './tarifConstants';

// ================================
// DATES
// ================================
export {
  DATE_FORMATS,
  LOCALES,
  DATE_VALIDATION_MESSAGES,
  DATE_ERROR_MESSAGES,
  DATE_INFO_MESSAGES,
  DATE_LABELS,
  DATE_BUTTON_TEXTS,
  DATE_CONSTRAINTS,
  DATEPICKER_CONFIG,
  DATE_LOADING_MESSAGES,
  CONTEXT_CONFIGS as DATE_CONTEXT_CONFIGS,
  VALIDATION_TYPES as DATE_VALIDATION_TYPES,
  MOIS_ANNEE,
  NOMS_MOIS_COURTS,
  NOMS_MOIS_LONGS,
  getNomMois,
  getNomMoisCourt
} from './dateConstants';
// ⚠️  DATE_HELPERS supprimé — utiliser DateService.js à la place
//     (DateService.isBusinessDay, isToday, isFuture, isPast)

// ================================
// PARAMÈTRES
// ================================
export {
  PARAMETRE_MODES,
  PARAMETRE_GROUPES,
  PARAMETRE_TYPES,
  PARAMETRE_SUCCESS_MESSAGES,
  PARAMETRE_ERROR_MESSAGES,
  PARAMETRE_STATE_MESSAGES,
  PARAMETRE_BUTTON_TEXTS,
  PARAMETRE_VALIDATION,
  PARAMETRE_FIELD_LABELS,
  PARAMETRE_METADATA,
  PARAMETRE_SELECT_OPTIONS,
  PARAMETRE_GROUPE_TITRES,
  PARAMETRE_SOUS_GROUPE_TITRES,
  getParametreLibelle,
  getParametreDescription,
  getGroupeTitre,
  getSousGroupeTitre
} from './parametreConstants';

// ================================
// CLIENTS
// ================================
export {
  PHONE_TYPES,
  FORM_TITLES as CLIENT_FORM_TITLES,
  VALIDATION_MESSAGES as CLIENT_VALIDATION_MESSAGES,
  LOADING_MESSAGES as CLIENT_LOADING_MESSAGES,
  HELP_TEXTS as CLIENT_HELP_TEXTS
} from './clientConstants';

// ================================
// LOYERS
// ================================
export {
  // MOIS_ANNEE est exporté depuis dateConstants — pas besoin de le ré-exporter ici
  FORM_MODES as LOYER_FORM_MODES,
  STATUTS_LOYER,
  ETATS_PAIEMENT as LOYER_ETATS_PAIEMENT,
  LABELS_STATUTS,
  LABELS_ETATS_PAIEMENT,
  COLUMN_LABELS as LOYER_COLUMN_LABELS,
  TABLE_COLUMNS_CONFIG as LOYER_TABLE_COLUMNS_CONFIG,
  DUREES_LOYER
} from './loyerConstants';

// ================================
// UTILISATEURS
// ================================
export {
  USER_FORM_MODES,
  USER_ROLES,
  USER_ROLE_LABELS,
  USER_STATUS,
  USER_STATUS_LABELS,
  USER_FORM_TITLES,
  USER_VALIDATION_MESSAGES,
  USER_SUCCESS_MESSAGES,
  USER_ERROR_MESSAGES,
  USER_BUTTON_TEXTS,
  USER_CONFIRM_MESSAGES,
  USER_PLACEHOLDERS,
  USER_FIELD_LABELS,
  USER_STATE_MESSAGES
} from './userConstants';

// ================================
// DASHBOARD
// ================================
export {
  FACTURE_STATES,
  DASHBOARD_MESSAGES,
  DASHBOARD_ALERTS,
  STATE_COLORS,
  STATE_BADGE_CLASSES,
  CHART_CONFIG,
  STAT_CARD_CONFIG,
  TABLE_CONFIG,
  ALERT_TYPES,
  ALERT_ICONS,
  REFRESH_INTERVALS,
  CACHE_CONFIG,
  YEARS_RANGE,
  EXPORT_FORMATS,
  TABLE_COLUMNS,
  PERFORMANCE_INDICATORS,
  DEFAULT_STATS,
  getStateIcon,
  getStateLabel,
  isStateResolved,
  isStateAtRisk
} from './dashboardConstants';

// ================================
// FIELD MAPPINGS
// ================================
export {
  ALL_MAPPINGS,
  CONTEXT_MAPPINGS,
  initializeFieldMappings,
  getMappingsForContext,
  validateMappings,
  addCustomMappings
} from './fieldMappings';