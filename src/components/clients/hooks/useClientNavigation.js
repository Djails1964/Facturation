// src/components/clients/hooks/useClientNavigation.js
import { useCallback } from 'react';
import { FORM_MODES } from '../../../constants/clientConstants';

export function useClientNavigation(
  clientFormState, 
  onRetourListe, 
  onClientCreated,
  options = {}
) {
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

  // ✅ Gestionnaire de retour
  const handleRetour = useCallback(() => {
    console.log('🔙 CLIENT - handleRetour appelé:', { hasUnsavedChanges });
    
    if (hasUnsavedChanges) {
      const canNavigate = requestNavigation(() => {
        console.log('🔙 Navigation vers la liste confirmée');
        if (guardId) {
          unregisterGuard(guardId);
        }
        onRetourListe?.();
      });
      
      if (!canNavigate) {
        console.log('🔒 Navigation retour bloquée');
      }
    } else {
      console.log('🔙 Navigation directe vers la liste');
      if (guardId) {
        unregisterGuard(guardId);
      }
      onRetourListe?.();
    }
  }, [hasUnsavedChanges, requestNavigation, onRetourListe, guardId, unregisterGuard]);

  // ✅ Gestionnaire de soumission avec navigation
  const handleSubmitWithNavigation = useCallback(async () => {
    console.log('💾 CLIENT - handleSubmitWithNavigation appelé');
    
    const result = await handleSubmit();
    
    if (result?.success) {
      markAsSaved();
      if (guardId) {
        unregisterGuard(guardId);
      }
      
      if (mode === FORM_MODES.CREATE && onClientCreated) {
        onClientCreated(result.idClient);
      } else if (autoNavigateAfterSave && onRetourListe) {
        onRetourListe();
      }
    }
    
    return result;
  }, [handleSubmit, markAsSaved, mode, onClientCreated, autoNavigateAfterSave, onRetourListe, guardId, unregisterGuard]);

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
    resetChanges
  };
}