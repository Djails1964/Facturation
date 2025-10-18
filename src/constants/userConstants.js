// src/constants/userConstants.js
/**
 * Constantes pour la gestion des utilisateurs
 * Centralise tous les textes, messages et configurations
 */

// ========== MODES DE FORMULAIRE ==========
export const USER_FORM_MODES = {
  VIEW: 'view',
  CREATE: 'create',
  EDIT: 'edit'
};

// ========== RÔLES UTILISATEURS ==========
export const USER_ROLES = {
  ADMIN: 'admin',
  GESTIONNAIRE: 'gestionnaire',
  STANDARD: 'standard'
};

export const USER_ROLE_LABELS = {
  [USER_ROLES.ADMIN]: 'Administrateur',
  [USER_ROLES.GESTIONNAIRE]: 'Gestionnaire',
  [USER_ROLES.STANDARD]: 'Standard'
};

// ========== STATUTS ==========
export const USER_STATUS = {
  ACTIVE: 1,
  INACTIVE: 0
};

export const USER_STATUS_LABELS = {
  [USER_STATUS.ACTIVE]: 'Actif',
  [USER_STATUS.INACTIVE]: 'Inactif'
};

// ========== TITRES DE FORMULAIRES ==========
export const USER_FORM_TITLES = {
  CREATE: 'Nouvel utilisateur',
  EDIT: 'Modifier l\'utilisateur',
  VIEW: 'Détails de l\'utilisateur'
};

// ========== MESSAGES DE VALIDATION ==========
export const USER_VALIDATION_MESSAGES = {
  USERNAME_REQUIRED: 'Le nom d\'utilisateur est obligatoire.',
  PASSWORD_REQUIRED: 'Le mot de passe est obligatoire pour un nouvel utilisateur.',
  PASSWORD_MIN_LENGTH: 'Le mot de passe doit contenir au moins 6 caractères.',
  EMAIL_INVALID: 'L\'adresse email n\'est pas valide.',
  NOM_REQUIRED: 'Le nom est obligatoire.',
  PRENOM_REQUIRED: 'Le prénom est obligatoire.',
  ROLE_REQUIRED: 'Le rôle est obligatoire.'
};

// ========== MESSAGES DE SUCCÈS ==========
export const USER_SUCCESS_MESSAGES = {
  CREATE: 'Utilisateur créé avec succès',
  UPDATE: 'Utilisateur modifié avec succès',
  DELETE: 'Utilisateur supprimé avec succès'
};

// ========== MESSAGES D'ERREUR ==========
export const USER_ERROR_MESSAGES = {
  CREATE_FAILED: 'Erreur lors de la création de l\'utilisateur',
  UPDATE_FAILED: 'Erreur lors de la modification de l\'utilisateur',
  DELETE_FAILED: 'Erreur lors de la suppression de l\'utilisateur',
  FETCH_FAILED: 'Erreur lors du chargement des utilisateurs',
  SESSION_EXPIRED: 'Session expirée - veuillez vous reconnecter',
  UNAUTHORIZED: 'Vous n\'avez pas les droits d\'accès à cette page'
};

// ========== TEXTES DES BOUTONS ==========
export const USER_BUTTON_TEXTS = {
  CREATE: 'Créer',
  SAVE: 'Enregistrer',
  CANCEL: 'Annuler',
  CLOSE: 'Fermer',
  DELETE: 'Supprimer',
  CONFIRM_DELETE: 'Confirmer la suppression',
  NEW_USER: 'Nouvel utilisateur'
};

// ========== MESSAGES DE CONFIRMATION ==========
export const USER_CONFIRM_MESSAGES = {
  DELETE_TITLE: 'Confirmer la suppression',
  DELETE_MESSAGE: (username) => `Êtes-vous sûr de vouloir supprimer l'utilisateur "${username}" ?`,
  DELETE_WARNING: 'Cette action est irréversible.'
};

// ========== PLACEHOLDERS ==========
export const USER_PLACEHOLDERS = {
  USERNAME: 'Nom d\'utilisateur',
  PASSWORD: 'Mot de passe',
  NOM: 'Nom',
  PRENOM: 'Prénom',
  EMAIL: 'Adresse email',
  ROLE: 'Sélectionner un rôle'
};

// ========== LABELS DE CHAMPS ==========
export const USER_FIELD_LABELS = {
  USERNAME: 'Nom d\'utilisateur',
  PASSWORD: 'Mot de passe',
  NOM: 'Nom',
  PRENOM: 'Prénom',
  EMAIL: 'Email',
  ROLE: 'Rôle',
  COMPTE_ACTIF: 'Compte actif',
  DERNIERE_CONNEXION: 'Dernière connexion'
};

// ========== MESSAGES D'ÉTAT ==========
export const USER_STATE_MESSAGES = {
  LOADING: 'Chargement des utilisateurs...',
  EMPTY: 'Aucun utilisateur trouvé',
  SUBMITTING: 'Enregistrement...',
  DELETING: 'Suppression...'
};