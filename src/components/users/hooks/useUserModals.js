// src/components/users/hooks/useUserModals.js
/**
 * Hook unifié pour la gestion des modales utilisateurs
 * Centralise tous les handlers liés aux opérations avec modales
 * Gère la suppression d'utilisateurs via modal de confirmation
 * 
 * ✅ Passe le logger en dépendance au DeleteUserHandler
 */

import { useCallback } from 'react';
import { useLogger } from '../../../hooks/useLogger';
import { DeleteUserHandler } from '../handlers/DeleteUserHandler';

/**
 * Hook unifié pour les modales d'utilisateurs
 * 
 * @param {Object} dependencies - Dépendances nécessaires aux handlers
 * @param {Object} dependencies.authService - Service d'authentification
 * @param {Function} dependencies.showCustom - Fonction pour afficher une modal custom
 * @param {Function} dependencies.showLoading - Fonction pour afficher une modal de loading
 * @param {Function} dependencies.onSetNotification - Callback pour afficher des notifications
 * @param {Function} dependencies.onUserDeleted - Callback après suppression réussie
 * @param {Function} dependencies.fetchUsers - Fonction pour recharger la liste des utilisateurs
 * 
 * @returns {Object} Handlers de modales
 * @returns {Function} handleSupprimerUtilisateur - Handler pour supprimer un utilisateur
 * 
 * @example
 * const { log } = useLogger('GestionUtilisateurs');
 * const modalDependencies = {
 *   authService,
 *   showCustom,
 *   showLoading,
 *   onSetNotification: (msg, type) => showNotification(msg, type),
 *   onUserDeleted: (userId) => console.log('Deleted:', userId),
 *   fetchUsers,
 *   log  // Passer le logger au hook
 * };
 * const { handleSupprimerUtilisateur } = useUserModals(modalDependencies);
 */
export const useUserModals = (dependencies) => {
  // Créer le logger pour ce hook (doit être appelé inconditionnellement)
  const { log: hookLog } = useLogger('useUserModals');
  
  // Utiliser le logger des dépendances s'il existe, sinon utiliser celui du hook
  const log = dependencies.log || hookLog;

  /**
   * Handler pour la suppression d'un utilisateur
   * Affiche une modal de confirmation puis supprime si confirmé
   * 
   * @param {number} userId - ID de l'utilisateur à supprimer
   * @param {string} username - Nom d'utilisateur (pour affichage dans la confirmation)
   * @param {Event} event - Événement DOM (optionnel)
   */
  const handleSupprimerUtilisateur = useCallback(async (userId, username, event) => {
    try {
      log.info('Demande de suppression utilisateur', { userId, username });

      // Créer une instance du handler avec les dépendances
      // ✅ Inclure le logger dans les dépendances
      const deleteHandler = new DeleteUserHandler({
        ...dependencies,
        log  // Passer le logger au handler
      });

      // Exécuter la suppression (gère la modal de confirmation)
      await deleteHandler.handle(userId, username, event);

      log.info('Suppression terminée avec succès');
    } catch (error) {
      log.error('Erreur lors de la suppression', { error: error.message });

      // Notifier l'erreur via le callback
      dependencies.onSetNotification(
        'Erreur lors de la suppression de l\'utilisateur',
        'error'
      );
    }
  }, [log, dependencies]);

  return {
    handleSupprimerUtilisateur
  };
};

export default useUserModals;