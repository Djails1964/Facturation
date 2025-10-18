// src/helpers/userHelpers.js
import { 
  USER_FORM_MODES, 
  USER_FORM_TITLES, 
  USER_BUTTON_TEXTS,
  USER_ROLE_LABELS,
  USER_STATUS_LABELS,
  USER_ROLES
} from '../../../constants/userConstants';

/**
 * Obtient le titre du formulaire selon le mode
 * @param {string} mode - Mode du formulaire (create, edit, view)
 * @returns {string} Titre du formulaire
 */
export const getUserFormTitle = (mode) => {
  return USER_FORM_TITLES[mode.toUpperCase()] || USER_FORM_TITLES.VIEW;
};

/**
 * Obtient le texte du bouton de soumission selon le mode
 * @param {string} mode - Mode du formulaire
 * @returns {string} Texte du bouton
 */
export const getUserSubmitButtonText = (mode) => {
  switch (mode) {
    case USER_FORM_MODES.CREATE:
      return USER_BUTTON_TEXTS.CREATE;
    case USER_FORM_MODES.EDIT:
      return USER_BUTTON_TEXTS.SAVE;
    default:
      return USER_BUTTON_TEXTS.CLOSE;
  }
};

/**
 * Vérifie si un compte est actif
 * @param {number|boolean|string} compteActif - Statut du compte
 * @returns {boolean} True si le compte est actif
 */
export const isCompteActif = (compteActif) => {
  if (typeof compteActif === 'boolean') return compteActif;
  if (typeof compteActif === 'number') return compteActif === 1;
  if (typeof compteActif === 'string') {
    return compteActif === '1' || compteActif.toLowerCase() === 'true';
  }
  return false;
};

/**
 * Obtient la classe CSS pour le rôle
 * @param {string} role - Rôle de l'utilisateur
 * @returns {string} Classe CSS correspondante
 */
export const getUserRoleClass = (role) => {
  if (!role) return '';
  
  switch (role.toLowerCase()) {
    case USER_ROLES.ADMIN:
      return 'user-role-admin';
    case USER_ROLES.GESTIONNAIRE:
      return 'user-role-gestionnaire';
    case USER_ROLES.STANDARD:
      return 'user-role-standard';
    default:
      return '';
  }
};

/**
 * Obtient le label du rôle
 * @param {string} role - Rôle de l'utilisateur
 * @returns {string} Label du rôle
 */
export const getUserRoleLabel = (role) => {
  return USER_ROLE_LABELS[role] || role;
};

/**
 * Obtient le label du statut
 * @param {number|boolean} status - Statut du compte
 * @returns {string} Label du statut
 */
export const getUserStatusLabel = (status) => {
  return isCompteActif(status) ? USER_STATUS_LABELS[1] : USER_STATUS_LABELS[0];
};

/**
 * Prépare les données utilisateur pour l'envoi au serveur
 * @param {Object} userData - Données du formulaire
 * @param {string} mode - Mode du formulaire
 * @returns {Object} Données formatées
 */
export const prepareUserDataForSubmit = (userData, mode) => {
  const data = {
    username: userData.username?.trim(),
    nom: userData.nom?.trim(),
    prenom: userData.prenom?.trim(),
    email: userData.email?.trim(),
    role: userData.role,
    compte_actif: userData.compte_actif ? 1 : 0
  };

  // Ajouter le mot de passe seulement s'il est fourni
  if (userData.password && userData.password.trim() !== '') {
    data.password = userData.password;
  }

  // Ajouter l'ID en mode édition
  if (mode === USER_FORM_MODES.EDIT && userData.id) {
    data.id = userData.id;
  }

  return data;
};

/**
 * Valide les données du formulaire utilisateur
 * @param {Object} userData - Données à valider
 * @param {string} mode - Mode du formulaire
 * @returns {Object} { isValid: boolean, errors: Object }
 */
export const validateUserData = (userData, mode) => {
  const errors = {};

  // Validation du nom d'utilisateur
  if (!userData.username || userData.username.trim() === '') {
    errors.username = 'Le nom d\'utilisateur est obligatoire';
  }

  // Validation du mot de passe (obligatoire en création uniquement)
  if (mode === USER_FORM_MODES.CREATE) {
    if (!userData.password || userData.password.trim() === '') {
      errors.password = 'Le mot de passe est obligatoire';
    } else if (userData.password.length < 6) {
      errors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }
  } else if (userData.password && userData.password.length < 6) {
    errors.password = 'Le mot de passe doit contenir au moins 6 caractères';
  }

  // Validation du nom
  if (!userData.nom || userData.nom.trim() === '') {
    errors.nom = 'Le nom est obligatoire';
  }

  // Validation du prénom
  if (!userData.prenom || userData.prenom.trim() === '') {
    errors.prenom = 'Le prénom est obligatoire';
  }

  // Validation de l'email (optionnel mais doit être valide si fourni)
  if (userData.email && userData.email.trim() !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      errors.email = 'L\'adresse email n\'est pas valide';
    }
  }

  // Validation du rôle
  if (!userData.role) {
    errors.role = 'Le rôle est obligatoire';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Formate le nom complet de l'utilisateur
 * @param {Object} user - Utilisateur
 * @returns {string} Nom complet
 */
export const getFullName = (user) => {
  if (!user) return '';
  return `${user.prenom || ''} ${user.nom || ''}`.trim();
};

/**
 * Formate la date de dernière connexion
 * @param {string} dateStr - Date en string
 * @returns {string} Date formatée ou "Jamais"
 */
export const formatLastConnection = (dateStr) => {
  if (!dateStr || dateStr === 'Jamais') return 'Jamais';
  
  try {
    const date = new Date(dateStr);
    return date.toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return dateStr;
  }
};

/**
 * Vérifie si l'utilisateur a les droits de gestion
 * @param {Object} user - Utilisateur actuel
 * @returns {boolean} True si l'utilisateur peut gérer
 */
export const canManageUsers = (user) => {
  if (!user) return false;
  return user.role === USER_ROLES.ADMIN || user.role === USER_ROLES.GESTIONNAIRE;
};

/**
 * Vérifie si l'utilisateur peut supprimer un autre utilisateur
 * @param {Object} currentUser - Utilisateur actuel
 * @param {Object} targetUser - Utilisateur cible
 * @returns {boolean} True si la suppression est autorisée
 */
export const canDeleteUser = (currentUser, targetUser) => {
  if (!currentUser || !targetUser) return false;
  
  // On ne peut pas se supprimer soi-même
  if (currentUser.id_utilisateur === targetUser.id_utilisateur) return false;
  
  // Seul un admin peut supprimer
  return currentUser.role === USER_ROLES.ADMIN;
};

/**
 * Crée un objet utilisateur vide pour le formulaire
 * @returns {Object} Utilisateur vide
 */
export const createEmptyUser = () => ({
  username: '',
  password: '',
  nom: '',
  prenom: '',
  email: '',
  role: USER_ROLES.STANDARD,
  compte_actif: true
});

/**
 * Convertit un utilisateur de l'API en données de formulaire
 * @param {Object} user - Utilisateur de l'API
 * @returns {Object} Données pour le formulaire
 */
export const userToFormData = (user) => ({
  id: user.id_utilisateur,
  username: user.username,
  password: '',
  nom: user.nom || '',
  prenom: user.prenom || '',
  email: user.email || '',
  role: user.role || USER_ROLES.STANDARD,
  compte_actif: isCompteActif(user.compte_actif),
  derniere_connexion: user.derniere_connexion || 'Jamais'
});