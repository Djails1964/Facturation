// hooks/useTarifNotifications.js - Version migrée vers NotificationService unifié

import { useNotifications } from '../../../services/NotificationService';
import { createLogger } from '../../../utils/createLogger';

const log = createLogger('useTarifNotifications');

/**
 * Hook pour gérer les notifications dans la gestion des tarifs
 * Utilise maintenant le NotificationService unifié au lieu d'un système local
 * 
 * MIGRATION:
 * - addNotification('success', 'Message') → showSuccess('Message')
 * - addNotification('error', 'Message') → showError('Message')
 * - addNotification('warning', 'Message') → showWarning('Message')
 * - addNotification('info', 'Message') → showInfo('Message')
 */
export const useTarifNotifications = () => {
  const { showSuccess, showError, showWarning, showInfo, notifications } = useNotifications();

  /**
   * Fonction de compatibilité pour garder l'ancienne API addNotification
   * Mappage vers le NotificationService unifié
   */
  const addNotification = (type, message, data = {}) => {
    log.debug('📢 Notification tarif:', { type, message, data });
    
    switch (type) {
      case 'success':
        showSuccess(message);
        break;
      case 'error':
        showError(message);
        break;
      case 'warning':
        showWarning(message);
        break;
      case 'info':
        showInfo(message);
        break;
      default:
        log.warn('⚠️ Type de notification inconnu:', type);
        showInfo(message);
    }
  };

  /**
   * Fonction de compatibilité pour removeNotification
   * Note: NotificationService gère la fermeture automatiquement
   */
  const removeNotification = (id) => {
    log.debug('🗑️ removeNotification appelé (géré automatiquement par NotificationService):', id);
    // NotificationService gère la fermeture automatiquement
    // Cette fonction est conservée pour la compatibilité mais ne fait rien
  };

  return {
    // Notifications du service unifié
    notifications,
    
    // Fonctions de compatibilité (ancienne API)
    addNotification,
    removeNotification,
    
    // Nouvelles fonctions directes (recommandé)
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
};