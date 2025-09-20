// src/constants/clientConstants.js
import { FORM_MODES } from './factureConstants'; // Réutilise les modes existants

// Réexportation pour cohérence
export { FORM_MODES };

// Types de téléphone
export const PHONE_TYPES = {
  SWISS: 'swiss',
  FOREIGN: 'foreign'
};

// Titres de formulaire
export const FORM_TITLES = {
  [FORM_MODES.CREATE]: 'Nouveau client',
  [FORM_MODES.EDIT]: (client) => `Modifier le client ${client.prenom} ${client.nom}`,
  [FORM_MODES.VIEW]: (client) => `Fiche client : ${client.prenom} ${client.nom}`
};

// Messages de validation
export const VALIDATION_MESSAGES = {
  EMAIL_INVALID: 'Format d\'email invalide',
  PHONE_INVALID: 'Format de téléphone invalide. Utilisez le format suisse (+41) ou international.',
  REQUIRED_FIELD: 'Ce champ est obligatoire'
};

// Messages de chargement
export const LOADING_MESSAGES = {
  LOADING_CLIENT: 'Chargement des données du client...',
  SAVING_CLIENT: 'Enregistrement en cours...'
};

// Textes d'aide
export const HELP_TEXTS = {
  PHONE_SWISS: 'Format: +41 xx xxx xx xx',
  PHONE_FOREIGN: 'Numéro international',
  PHONE_DEFAULT: 'Format suisse: +41 xx xxx xx xx ou 0xx xxx xx xx'
};