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
  CODE_EXISTS: 'Ce code existe déjà',
  NAME_EXISTS: 'Ce nom existe déjà'
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