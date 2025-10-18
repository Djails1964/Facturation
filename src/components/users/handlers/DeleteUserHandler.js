// src/components/users/handlers/DeleteUserHandler.js
/**
 * Gestionnaire pour la suppression d'utilisateurs
 * Utilise le logger reçu en dépendance pour centraliser le logging
 * 
 * ✅ Le logger est passé via les dépendances du constructor
 * ✅ Pas d'utilisation directe de hooks (car c'est une classe)
 */

import ModalComponents from '../../shared/ModalComponents';

/**
 * Gestionnaire de suppression d'utilisateurs
 * Gère l'affichage de la modal de confirmation et l'exécution de la suppression
 * Utilise le système de modales unifié
 */
export class DeleteUserHandler {
  constructor(dependencies) {
    this.authService = dependencies.authService;
    this.onSetNotification = dependencies.onSetNotification;
    this.onUserDeleted = dependencies.onUserDeleted;
    this.fetchUsers = dependencies.fetchUsers;
    this.showCustom = dependencies.showCustom;
    this.showLoading = dependencies.showLoading;
    
    // ✅ Récupérer le logger des dépendances
    this.log = dependencies.log;
    
    // Nom du handler pour les logs (au cas où log ne serait pas disponible)
    this.handlerName = 'DeleteUserHandler';
  }

  /**
   * Point d'entrée principal : gère le flux complet de suppression
   * @param {number} userId - ID de l'utilisateur à supprimer
   * @param {string} username - Nom d'utilisateur (pour affichage et logs)
   * @param {Event} event - Événement DOM (optionnel)
   */
  async handle(userId, username, event) {
    if (event) {
      event.stopPropagation();
    }

    this.log.info('Début du processus de suppression', { userId, username });

    try {
      // Afficher la modal de confirmation
      const result = await this.showDeleteConfirmation(username);

      if (result.action === 'confirm') {
        // Utilisateur a confirmé : procéder à la suppression
        await this.executeDelete(userId, username);
      } else {
        // Utilisateur a annulé
        this.log.debug('Suppression annulée par l\'utilisateur');
      }
    } catch (error) {
      this.log.error('Erreur dans le processus de suppression', { 
        error: error.message,
        userId,
        username 
      });
      await this.showError(error.message);
    }
  }

  /**
   * Affiche une modal de confirmation avant la suppression
   * @param {string} username - Nom d'utilisateur à afficher
   * @returns {Promise<Object>} Résultat de l'interaction utilisateur
   */
  async showDeleteConfirmation(username) {
    this.log.debug('Affichage modal de confirmation', { username });

    const content = `
      <div class="modal-delete-content">
        <div class="modal-warning-icon" style="text-align: center; margin-bottom: 20px;">
          <span style="font-size: 48px; color: #dc3545;">⚠️</span>
        </div>
        
        <p style="margin: 15px 0; font-weight: 600;">
          Supprimer l'utilisateur <strong>${username}</strong> ?
        </p>
        
        <ul style="margin: 10px 0 20px 20px; color: #666; font-size: 0.9rem;">
          <li>Suppression définitive du compte</li>
          <li>Perte de tous les accès associés</li>
          <li>Suppression de l'historique des connexions</li>
        </ul>
        
        <p style="margin-top: 20px; color: #dc3545; font-weight: 600;">
          Cette action est irrévocable.
        </p>
      </div>
    `;

    const config = {
      title: 'Confirmer la suppression',
      content,
      size: 'medium',
      buttons: [
        {
          text: 'Annuler',
          action: 'cancel',
          className: 'secondary'
        },
        {
          text: 'Supprimer',
          action: 'confirm',
          className: 'danger'
        }
      ]
    };

    return await this.showCustom(config);
  }

  /**
   * Exécute la suppression de l'utilisateur
   * @param {number} userId - ID de l'utilisateur à supprimer
   * @param {string} username - Nom d'utilisateur (pour logs et notifications)
   */
  async executeDelete(userId, username) {
    this.log.info('Exécution de la suppression', { userId, username });

    try {
      // Afficher le loading et exécuter l'appel API
      const result = await this.showLoading(
        {
          title: 'Suppression en cours',
          content: ModalComponents.createLoadingContent(
            `Suppression de l'utilisateur ${username}...`
          ),
          size: 'small'
        },
        async () => {
          this.log.debug('Appel API deleteUser', { userId });
          return await this.authService.deleteUser(userId);
        }
      );

      this.log.debug('Réponse API reçue', { success: result?.success });

      if (result && result.success) {
        // Notification de succès
        this.onSetNotification(
          `Utilisateur ${username} supprimé avec succès`,
          'success'
        );

        this.log.info('Utilisateur supprimé avec succès', { userId, username });

        // Callback pour notifier la suppression
        if (this.onUserDeleted) {
          this.onUserDeleted(userId);
        }

        // Recharger la liste des utilisateurs
        if (this.fetchUsers) {
          await this.fetchUsers();
        }
      } else {
        throw new Error(result?.message || 'Erreur lors de la suppression');
      }
    } catch (error) {
      this.log.error('Erreur lors de l\'exécution de la suppression', { 
        error: error.message,
        userId 
      });
      throw error;
    }
  }

  /**
   * Affiche une modal d'erreur
   * @param {string} message - Message d'erreur à afficher
   */
  async showError(message) {
    this.log.debug('Affichage modal d\'erreur', { message });

    const config = {
      title: 'Erreur de suppression',
      content: `
        <div style="padding: 20px;">
          <p style="color: #dc3545; font-weight: 600; margin-bottom: 10px;">
            ⚠️ Une erreur est survenue
          </p>
          <p style="color: #666;">
            ${message || 'Erreur lors de la suppression de l\'utilisateur'}
          </p>
        </div>
      `,
      size: 'small',
      buttons: [
        {
          text: 'OK',
          action: 'confirm',
          className: 'primary'
        }
      ]
    };

    await this.showCustom(config);
  }
}

export default DeleteUserHandler;