// src/constants/tarifConstants.js - Constantes pour la gestion des tarifs

export const FORM_MODES = {
  CREATE: 'create',
  EDIT: 'edit',
  VIEW: 'view'
};

export const FORM_TYPES = {
  SERVICE: 'service',
  UNITE: 'unite',
  TYPE_TARIF: 'typeTarif',
  TARIF: 'tarif',
  TARIF_SPECIAL: 'tarifSpecial'
};

export const FORM_TITLES = {
  CREATE_TARIF: 'Créer un nouveau tarif',
  EDIT_TARIF: 'Modifier le tarif',
  VIEW_TARIF: 'Consulter le tarif',
  CREATE: 'Nouveau tarif',
  EDIT: 'Modifier',
  VIEW: 'Consulter'
};

export const LOADING_MESSAGES = {
  LOADING_TARIF: 'Chargement du tarif...',
  LOADING_SERVICE: 'Chargement du service...',
  LOADING_UNITE: 'Chargement de l\'unité...',
  LOADING_TYPETARIF: 'Chargement du type de tarif...',
  LOADING_TARIFSPECIAL: 'Chargement du tarif spécial...'
};

export const VALIDATION_MESSAGES = {
  REQUIRED_FIELD: 'Ce champ est obligatoire',
  INVALID_PRICE: 'Le prix doit être un nombre positif',
  INVALID_DATE_RANGE: 'La date de fin doit être postérieure à la date de début',
  DATE_DEBUT_REQUIRED: 'La date de début est obligatoire',
  CODE_EXISTS: 'Ce code existe déjà',
  NAME_EXISTS: 'Ce nom existe déjà',
  FORM_ERRORS: 'Veuillez corriger les erreurs dans le formulaire',
  SAVE_ERROR: 'Erreur lors de la sauvegarde',
  SAVE_TARIF_ERROR: 'Erreur lors de la sauvegarde du tarif',
  SAVE_TARIF_SPECIAL_ERROR: 'Erreur lors de la sauvegarde du tarif spécial',
};

export const LABELS = {
  // Champs communs
  SERVICE:      'Service',
  UNITE:        'Unité',
  TYPE_TARIF:   'Type de tarif',
  PRIX:         'Prix (CHF)',
  DATE_DEBUT:   'Date de début',
  DATE_FIN:     'Date de fin (optionnel)',
  NOTE:         'Note (obligatoire)',
  // Sélecteurs
  SELECT_SERVICE:    'Sélectionner un service',
  SELECT_UNITE:      'Sélectionner une unité',
  SELECT_TYPE_TARIF: 'Sélectionner un type de tarif',
  SELECT_CLIENT:     'Sélectionner un client',
  // Titres sections
  SECTION_TARIF:         'Informations du tarif',
  SECTION_TARIF_SPECIAL: 'Informations du tarif spécial',
  // Calendrier
  CAL_DATE_DEBUT: 'Sélectionner la date de début',
  CAL_DATE_FIN:   'Sélectionner la date de fin',
};

export const ACTION_TYPES = {
  CREATE: 'create',
  EDIT: 'edit',
  DELETE: 'delete',
  VIEW: 'view',
  DUPLICATE: 'duplicate',
  EXPORT: 'export'
};

export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};
// ── Titres de colonnes des tableaux ──────────────────────────────────────────

export const COLUMN_LABELS_TARIF_STANDARD = {
  SERVICE:  'Service',
  UNITE:    'Unité',
  TYPE:     'Type',
  PRIX:     'Prix (CHF)',
  PERIODE:  'Période',
  STATUT:   'État',
};

export const COLUMN_LABELS_TARIF_SPECIAL = {
  CLIENT:   'Client',
  SERVICE:  'Service',
  UNITE:    'Unité',
  PRIX:     'Prix (CHF)',
  PERIODE:  'Période',
  STATUT:   'État',
};

export const COLUMN_LABELS_TYPE_TARIF = {
  CODE:        'Code',
  NOM:         'Nom',
  DESCRIPTION: 'Description',
};

export const COLUMN_LABELS_SERVICE = {
  CODE:        'Code',
  NOM:         'Nom',
  DESCRIPTION: 'Description',
  STATUT:      'État',
};

export const COLUMN_LABELS_UNITE = {
  CODE:        'Code',
  ABREV:       'Abrév.',
  NOM:         'Nom',
  DESCRIPTION: 'Description',
};

// Titres de section des tableaux
export const TABLE_TITLES = {
  TARIFS_STANDARDS: 'Liste des tarifs standards',
  TARIFS_SPECIAUX:  'Liste des tarifs spéciaux',
  TYPES_TARIFS:     'Liste des types de tarifs',
  SERVICES:         'Liste des services',
  UNITES:           'Liste des unités',
};