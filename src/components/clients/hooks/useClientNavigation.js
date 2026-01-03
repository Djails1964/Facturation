// src/components/clients/hooks/useClientNavigation.js
// Hook spécialisé pour la gestion de la navigation dans les formulaires client
// ✅ REFACTORISÉ: Utilisation de createLogger au lieu de console.log

import { useCallback } from 'react';
import { FORM_MODES } from '../../../constants/clientConstants';
// ✅ AJOUT: Import de createLogger
import { createLogger } from '../../../utils/createLogger';

/**
 * Hook pour la gestion de la navigation et des actions de formulaire client
 * 
 * ✅ Utilise createLogger pour le logging
 */
export function useClientNavigation(
  clientFormState, 
  onRetourListe, 
  onClientCreated,
  options = {}
) {
  // ✅ Initialisation du logger
  const logger = createLogger('useClientNavigation');

  const {
    mode,
    handleSubmit,
    hasUnsavedChanges,
    showUnsavedModal,
    showGlobalModal,
    globalNavigationCallback,
    confirmNavigation,
    cancelNavigation,
    requestNavigation,
    markAsSaved,
    resetChanges,
    unregisterGuard,
    guardId
  } = clientFormState;

  const { autoNavigateAfterSave = true } = options;

  // ================================
  // GESTIONNAIRE DE RETOUR
  // ================================

  const handleRetour = useCallback(() => {
    logger.info('📙 handleRetour appelé:', { hasUnsavedChanges });
    
    if (hasUnsavedChanges) {
      const canNavigate = requestNavigation(() => {
        logger.info('📙 Navigation vers la liste confirmée');
        if (guardId) {
          unregisterGuard(guardId);
        }
        onRetourListe?.();
      });
      
      if (!canNavigate) {
        logger.debug('🔒 Navigation retour bloquée');
      }
    } else {
      logger.info('📙 Navigation directe vers la liste');
      if (guardId) {
        unregisterGuard(guardId);
      }
      onRetourListe?.();
    }
  }, [hasUnsavedChanges, requestNavigation, onRetourListe, guardId, unregisterGuard, logger]);

  // ================================
  // GESTIONNAIRE DE SOUMISSION AVEC NAVIGATION
  // ================================

  const handleSubmitWithNavigation = useCallback(async () => {
    logger.info('💾 handleSubmitWithNavigation appelé');
    
    const result = await handleSubmit();
    
    if (result?.success) {
      logger.info('✅ Soumission réussie', { idClient: result.idClient });
      markAsSaved();
      if (guardId) {
        unregisterGuard(guardId);
      }
      
      if (mode === FORM_MODES.CREATE && onClientCreated) {
        logger.info('🆕 Client créé, appel de onClientCreated');
        onClientCreated(result.idClient);
      } else if (autoNavigateAfterSave && onRetourListe) {
        logger.info('🔄 Navigation automatique vers la liste');
        onRetourListe();
      }
    } else {
      logger.warn('❌ Échec de la soumission:', result?.message);
    }
    
    return result;
  }, [handleSubmit, markAsSaved, mode, onClientCreated, autoNavigateAfterSave, onRetourListe, guardId, unregisterGuard, logger]);

  // ================================
  // GESTIONNAIRES DE NAVIGATION GLOBALE
  // ================================

  const handleConfirmGlobalNavigation = useCallback(() => {
    logger.info('✅ Navigation globale confirmée');
    
    // Reset des modifications
    resetChanges();
    
    // Désenregistrer le guard
    if (guardId) {
      unregisterGuard(guardId);
    }
    
    // Exécuter le callback de navigation stocké
    if (globalNavigationCallback) {
      logger.debug('🚀 Exécution du callback de navigation globale');
      try {
        globalNavigationCallback();
      } catch (error) {
        logger.error('❌ Erreur lors de l\'exécution du callback:', error);
      }
    } else {
      logger.warn('⚠️ Aucun callback de navigation stocké');
    }
  }, [resetChanges, guardId, unregisterGuard, globalNavigationCallback, logger]);

  const handleCancelGlobalNavigation = useCallback(() => {
    logger.info('❌ Navigation globale annulée');
    // Le cancelNavigation devrait gérer la fermeture de la modal
    cancelNavigation?.();
  }, [cancelNavigation, logger]);

  // ================================
  // RETOUR DU HOOK
  // ================================

  return {
    // États
    hasUnsavedChanges,
    showUnsavedModal,
    showGlobalModal,
    globalNavigationCallback,
    guardId,
    
    // Gestionnaires
    handleRetour,
    handleSubmitWithNavigation,
    confirmNavigation,
    cancelNavigation,
    resetChanges,
    
    // Gestionnaires de navigation globale
    handleConfirmGlobalNavigation,
    handleCancelGlobalNavigation
  };
}