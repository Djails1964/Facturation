// src/components/clients/sections/ClientFormModals.jsx
// Gestion des modales pour le formulaire client - VERSION CORRIGÉE

import React, { useEffect } from 'react';
import { showConfirm } from '../../../utils/modalSystem';
import { createLogger } from '../../../utils/createLogger';
import { UNSAVED_CHANGES_CONFIRM_CONFIG, UNSAVED_CHANGES_MESSAGES } from '../../../constants/appConstants';

/**
 * Composant pour gérer toutes les modales du formulaire client
 * ✅ CORRECTION FINALE : Utilise bien le système modal unifié pour les deux types de navigation
 */
function ClientFormModals({
  showUnsavedModal = false,
  showGlobalModal = false,
  confirmNavigation,
  cancelNavigation,
  handleConfirmGlobalNavigation,
  handleCancelGlobalNavigation,
  hasUnsavedChanges = false,
  clientName = '',
  modalOptions = {},
  navigation = null,
  onRetourListe = null
}) {

  // ✅ Initialisation du logger
  const logger = createLogger('ClientFormModals');

  logger.debug('📋 ClientFormModals - Props reçues:', {
    showUnsavedModal,
    showGlobalModal,
    hasUnsavedChanges,
    clientName
  });

  // ================================
  // ✅ MODAL POUR MODIFICATIONS NON SAUVEGARDÉES (Navigation locale - bouton Retour)
  // ================================
  
  useEffect(() => {
    if (showUnsavedModal) {
      logger.debug('🎭 ClientFormModals - Affichage modal locale (bouton Retour)');

      // Message dynamique si le nom du client est disponible
      const message = clientName
        ? `Vous avez des modifications non sauvegardées pour ${clientName}. Souhaitez-vous vraiment quitter sans sauvegarder ?`
        : UNSAVED_CHANGES_MESSAGES.CLIENT;

      const modalConfig = {
        ...UNSAVED_CHANGES_CONFIRM_CONFIG(message),
        ...modalOptions.unsaved
      };

      showConfirm(modalConfig)
        .then((result) => {
          logger.debug('🎭 Modal locale - Résultat:', result);
          
          if (result.action === 'confirm') {
            logger.debug('✅ Modal locale confirmée - exécution callback');
            confirmNavigation?.();
          } else {
            logger.debug('❌ Modal locale annulée');
            cancelNavigation?.();
          }
        })
        .catch((error) => {
          logger.error('❌ Erreur modal locale:', error);
          cancelNavigation?.();
        });
    }
  }, [showUnsavedModal, confirmNavigation, cancelNavigation, clientName, modalOptions]);

  // ================================
  // ✅ MODAL POUR NAVIGATION GLOBALE (Menu → Paiements, etc.)
  // ================================
  
  useEffect(() => {
    if (showGlobalModal) {
      logger.debug('🎭 ClientFormModals - Affichage modal globale (navigation menu)');

      // Message dynamique si le nom du client est disponible
      const message = clientName
        ? `Vous avez des modifications non sauvegardées pour ${clientName}. Souhaitez-vous vraiment quitter sans sauvegarder ?`
        : UNSAVED_CHANGES_MESSAGES.CLIENT;

      const modalConfig = {
        ...UNSAVED_CHANGES_CONFIRM_CONFIG(message),
        ...modalOptions.global
      };

      showConfirm(modalConfig)
        .then((result) => {
          logger.debug('🎭 Modal globale - Résultat:', result);
          
          if (result.action === 'confirm') {
            logger.debug('✅ Modal globale confirmée - exécution callback de navigation');
            handleConfirmGlobalNavigation?.();
          } else {
            logger.debug('❌ Modal globale annulée');
            handleCancelGlobalNavigation?.();
          }
        })
        .catch((error) => {
          logger.error('❌ Erreur modal globale:', error);
          handleCancelGlobalNavigation?.();
        });
    }
  }, [showGlobalModal, handleConfirmGlobalNavigation, handleCancelGlobalNavigation, clientName, modalOptions]);

  // ================================
  // RENDU
  // ================================

  // Ce composant ne rend rien car il utilise le modalSystem via useEffect
  // Les modales sont créées directement par showConfirm()
  return null;
}

export default ClientFormModals;