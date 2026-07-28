// src/constants/appConstants.js
// Constantes génériques partagées par tous les formulaires de l'application
// Indépendantes de toute logique métier (facturation, clients, tarifs...)

// ========== MESSAGES DE NAVIGATION NON SAUVEGARDÉE ==========

export const UNSAVED_CHANGES_MESSAGES = {
  // Titre commun à toutes les modales
  TITLE: 'Modifications non sauvegardées',

  // Boutons communs (modal showConfirm — 2 boutons)
  CONFIRM_TEXT: 'Quitter sans sauvegarder',
  CANCEL_TEXT: "Continuer l'édition",

  // Boutons spécifiques (UnsavedChangesModal — 3 boutons)
  BTN_STAY: 'Rester sur la page',
  BTN_SAVE_AND_QUIT: 'Sauvegarder et quitter',
  BTN_QUIT_WITHOUT_SAVE: 'Quitter sans sauvegarder',

  // Sous-message commun
  SUB_MESSAGE: 'Que souhaitez-vous faire ?',

  // Message générique (utilisé par useUnsavedChanges, useAutoNavigationGuard, etc.)
  DEFAULT: 'Vous avez des modifications non sauvegardées. Souhaitez-vous vraiment quitter sans sauvegarder ?',

  // Messages courts (utilisés par UnsavedChangesModal)
  SHORT_DEFAULT: 'Vous avez des modifications non sauvegardées.',
  SHORT_FACTURE: 'Vous avez des modifications non sauvegardées dans cette facture.',
  SHORT_CLIENT: 'Vous avez des modifications non sauvegardées pour ce client.',
  SHORT_TARIF: 'Vous avez des modifications non sauvegardées dans les tarifs.',
  SHORT_PARAMETRE: 'Vous avez des modifications non sauvegardées dans les paramètres.',

  // Messages longs (utilisés par showConfirm)
  FACTURE: 'Vous avez des modifications non sauvegardées dans le formulaire de facture. Souhaitez-vous vraiment quitter sans sauvegarder ?',
  CLIENT: 'Vous avez des modifications non sauvegardées pour ce client. Souhaitez-vous vraiment quitter sans sauvegarder ?',
  TARIF: 'Vous avez des modifications non sauvegardées dans les tarifs. Souhaitez-vous vraiment quitter sans sauvegarder ?',
  PARAMETRE: 'Vous avez des modifications non sauvegardées dans les paramètres. Souhaitez-vous vraiment quitter sans sauvegarder ?',
};

/**
 * Retourne une config complète prête à passer à showConfirm().
 * Accepte un message optionnel (défaut : message générique).
 * 
 * @param {string} [message] - Message personnalisé (utilise UNSAVED_CHANGES_MESSAGES.DEFAULT si omis)
 * @returns {Object} Config pour showConfirm()
 * 
 * @example
 * // Message générique
 * showConfirm(UNSAVED_CHANGES_CONFIRM_CONFIG())
 * 
 * // Message spécifique à la facture
 * showConfirm(UNSAVED_CHANGES_CONFIRM_CONFIG(UNSAVED_CHANGES_MESSAGES.FACTURE))
 * 
 * // Message dynamique avec nom du client
 * showConfirm(UNSAVED_CHANGES_CONFIRM_CONFIG(
 *   `Vous avez des modifications non sauvegardées pour ${clientName}. Souhaitez-vous vraiment quitter ?`
 * ))
 */
export const UNSAVED_CHANGES_CONFIRM_CONFIG = (message = UNSAVED_CHANGES_MESSAGES.DEFAULT) => ({
  title: UNSAVED_CHANGES_MESSAGES.TITLE,
  message,
  confirmText: UNSAVED_CHANGES_MESSAGES.CONFIRM_TEXT,
  cancelText: UNSAVED_CHANGES_MESSAGES.CANCEL_TEXT,
  type: 'warning',
  size: 'medium',
});

// ========== MESSAGES GÉNÉRIQUES DE FORMULAIRE ==========

export const FORM_MESSAGES = {
  LOADING: 'Chargement en cours...',
  SAVING: 'Enregistrement en cours...',
  SAVE_SUCCESS: 'Enregistrement réussi.',
  SAVE_ERROR: "Une erreur est survenue lors de l'enregistrement.",
  DELETE_SUCCESS: 'Suppression réussie.',
  DELETE_ERROR: 'Une erreur est survenue lors de la suppression.',
};

// ========== LABELS DE BOUTONS GÉNÉRIQUES ==========

export const BUTTON_LABELS = {
  SAVE: 'Enregistrer',
  CANCEL: 'Annuler',
  CLOSE: 'Fermer',
  CONFIRM: 'Confirmer',
  DELETE: 'Supprimer',
  BACK: 'Retour',
  BACK_TO_LIST: 'Retour à la liste',
  NEW: 'Nouveau',
  EDIT: 'Modifier',
  OK: 'OK',
};