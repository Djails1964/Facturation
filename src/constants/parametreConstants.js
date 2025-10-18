// src/constants/parametreConstants.js
/**
 * Constantes pour la gestion des paramètres
 * Centralise tous les textes, messages et configurations
 */

// ========== MODES DE FORMULAIRE ==========
export const PARAMETRE_MODES = {
  VIEW: 'view',
  EDIT: 'edit'
};

// ========== GROUPES DE PARAMÈTRES ==========
export const PARAMETRE_GROUPES = {
  FACTURATION: 'Facturation',
  PAIEMENT: 'Paiement', 
  EMAIL: 'Email',
  GENERAL: 'General'
};

// ========== TYPES DE PARAMÈTRES ==========
export const PARAMETRE_TYPES = {
  TEXT: 'text',
  TEXTAREA: 'textarea',
  NUMBER: 'number',
  EMAIL: 'email',
  PATH: 'path',
  BOOLEAN: 'boolean',
  SELECT: 'select',
  YEAR: 'year'
};

// ========== MESSAGES DE SUCCÈS ==========
export const PARAMETRE_SUCCESS_MESSAGES = {
  SAVE: 'Paramètres enregistrés avec succès',
  LOAD: 'Paramètres chargés avec succès'
};

// ========== MESSAGES D'ERREUR ==========
export const PARAMETRE_ERROR_MESSAGES = {
  SAVE_FAILED: 'Erreur lors de l\'enregistrement des paramètres',
  LOAD_FAILED: 'Erreur lors du chargement des paramètres',
  INVALID_VALUE: 'Valeur invalide',
  REQUIRED_FIELD: 'Ce champ est obligatoire'
};

// ========== MESSAGES D'ÉTAT ==========
export const PARAMETRE_STATE_MESSAGES = {
  LOADING: 'Chargement des paramètres...',
  SAVING: 'Enregistrement en cours...',
  EMPTY: 'Aucun paramètre disponible'
};

// ========== TEXTES DES BOUTONS ==========
export const PARAMETRE_BUTTON_TEXTS = {
  SAVE: 'Enregistrer',
  CANCEL: 'Annuler',
  RESET: 'Réinitialiser'
};

// ========== VALIDATION ==========
export const PARAMETRE_VALIDATION = {
  MIN_YEAR: 2000,
  MAX_YEAR: 2099,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
};

// ========== LABELS DE CHAMPS COMMUNS ==========
export const PARAMETRE_FIELD_LABELS = {
  VALUE: 'Valeur',
  YEAR: 'Année',
  DESCRIPTION: 'Description'
};

// ========== LIBELLÉS ET DESCRIPTIONS PAR PARAMÈTRE ==========
/**
 * ✅ Dictionnaire centralisé des libellés et descriptions
 * Format: { 'nomParametre': { libelle: '...', description: '...' } }
 * Pour les paramètres avec catégorie, utiliser la clé: 'nomParametre|categorie'
 */
export const PARAMETRE_METADATA = {
  'Prochain Numéro Facture': {
    libelle: 'Prochain numéro de facture',
    description: ''
  },
  'outputDir': {
    libelle: 'Destination des factures PDF',
    description: 'Chemin destination factures PDF depuis BackendUrl'
  },
  'Banque': {
    libelle: 'Nom de la banque',
    description: 'Nom, Adresse de la banque bénéficiaire'
  },
  'IBAN': {
    libelle: 'IBAN',
    description: 'IBAN du bénéficiaire'
  },
  'Beneficiaire': {
    libelle: 'Nom du bénéficiaire',
    description: 'Nom et adresse du bénéficiaire'
  },
  'Delai Paiement': {
    libelle: 'Délai de paiement',
    description: 'Délai de paiement en jours'
  },
  'Ligne 1': {
    libelle: 'Première ligne de signature',
    description: ''
  },
  'Ligne 2': {
    libelle: 'Seconde ligne de signature',
    description: ''
  },
  'Imprimer ristourne': {
    libelle: 'Impression de la ristourne',
    description: 'Imprimer ou non la ristourne sur la facture (O/N)'
  },
  'texte_corps|tu': {
    libelle: 'Texte du courriel',
    description: 'Texte du courriel, proposition 1'
  },
  'texte_corps|vous': {
    libelle: 'Texte du courriel',
    description: 'Texte du courriel, proposition 2'
  }
};

/**
 * ✅ Récupère le libellé d'un paramètre
 * @param {string} nomParametre - Nom du paramètre
 * @param {string} categorie - Catégorie du paramètre (optionnel)
 * @returns {string} Libellé du paramètre ou le nom si pas de libellé
 */
export const getParametreLibelle = (nomParametre, categorie) => {
  const key = categorie ? `${nomParametre}|${categorie}` : nomParametre;
  return PARAMETRE_METADATA[key]?.libelle || nomParametre;
};

/**
 * ✅ Récupère la description d'un paramètre
 * @param {string} nomParametre - Nom du paramètre
 * @param {string} categorie - Catégorie du paramètre (optionnel)
 * @returns {string} Description du paramètre ou chaîne vide si pas de description
 */
export const getParametreDescription = (nomParametre, categorie) => {
  const key = categorie ? `${nomParametre}|${categorie}` : nomParametre;
  return PARAMETRE_METADATA[key]?.description || '';
};