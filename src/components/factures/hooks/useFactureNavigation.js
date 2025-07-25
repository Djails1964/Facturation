import { useState, useEffect, useCallback } from 'react';
import { useNavigationGuard } from '../../../App';
import { useUnsavedChanges } from '../../../hooks/useUnsavedChanges';
import { FORM_MODES } from '../../../constants/factureConstants';

export const useFactureNavigation = (mode, factureId, initialFormData, getFormData, canDetectChanges) => {
  const { registerGuard, unregisterGuard } = useNavigationGuard();
  const guardId = `facture-form-${factureId || 'new'}`;
  
  const [showGlobalModal, setShowGlobalModal] = useState(false);
  const [globalNavigationCallback, setGlobalNavigationCallback] = useState(null);

  const {
    hasUnsavedChanges,
    showUnsavedModal,
    markAsSaved,
    confirmNavigation,
    cancelNavigation,
    requestNavigation,
    resetChanges
  } = useUnsavedChanges(
    initialFormData,
    canDetectChanges() ? getFormData() : {},
    false,
    false
  );

  // Enregistrement du guard
  useEffect(() => {
    if (canDetectChanges()) {
      const guardFunction = async () => hasUnsavedChanges;
      registerGuard(guardId, guardFunction);
      return () => unregisterGuard(guardId);
    }
  }, [canDetectChanges, hasUnsavedChanges, guardId, registerGuard, unregisterGuard]);

  // Gestion des navigations externes
  useEffect(() => {
    if (canDetectChanges() && hasUnsavedChanges) {
      const handleGlobalNavigation = (event) => {
        if (event.detail && event.detail.callback) {
          setGlobalNavigationCallback(() => event.detail.callback);
          setShowGlobalModal(true);
        }
      };

      window.addEventListener('navigation-blocked', handleGlobalNavigation);
      return () => window.removeEventListener('navigation-blocked', handleGlobalNavigation);
    }
  }, [canDetectChanges, hasUnsavedChanges]);

  const handleSuccessfulSave = useCallback((factureId, message, callbacks) => {
    markAsSaved();
    resetChanges();
    unregisterGuard(guardId);
    setShowGlobalModal(false);
    setGlobalNavigationCallback(null);

    if (mode === FORM_MODES.CREATE && callbacks.onFactureCreated) {
      callbacks.onFactureCreated(factureId, message);
    } else if (callbacks.onRetourListe) {
      callbacks.onRetourListe(factureId, true, message, 'success');
    }
  }, [mode, markAsSaved, resetChanges, guardId, unregisterGuard]);

  return {
    hasUnsavedChanges,
    showUnsavedModal,
    confirmNavigation,
    cancelNavigation,
    requestNavigation,
    showGlobalModal,
    setShowGlobalModal,
    globalNavigationCallback,
    setGlobalNavigationCallback,
    handleSuccessfulSave,
    guardId,
    unregisterGuard,
    resetChanges
  };
};