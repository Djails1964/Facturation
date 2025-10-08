// src/hooks/facture/useFactureNavigation.js
// ✅ VERSION FINALE - 100% modalSystem, architecture unifiée

import { useEffect, useCallback } from 'react';
import { useNavigationGuard } from '../../../App';
import { useUnsavedChanges } from '../../../hooks/useUnsavedChanges';
import { useAutoNavigationGuard } from '../../../hooks/useAutoNavigationGuard';
import { showConfirm } from '../../../utils/modalSystem';
import { FORM_MODES } from '../../../constants/factureConstants';

/**
 * Hook pour la gestion de la navigation et protection des modifications
 * Utilise modalSystem pour toutes les modales (navigation locale ET globale)
 */
export const useFactureNavigation = (mode, idFacture, initialFormData, getFormData, canDetectChanges) => {
  const { unregisterGuard } = useNavigationGuard();
  const guardId = `facture-form-${idFacture || 'new'}`;

  // ✅ Hook de détection des modifications (gère automatiquement la modal locale via modalSystem)
  const {
    hasUnsavedChanges,
    markAsSaved,
    requestNavigation,
    resetChanges
  } = useUnsavedChanges(
    initialFormData,
    canDetectChanges() ? getFormData() : {},
    false,
    false
  );

  // ✅ Protection automatique de navigation avec le hook général
  useAutoNavigationGuard(hasUnsavedChanges, {
    isActive: mode !== FORM_MODES.VIEW && canDetectChanges(),
    guardId: guardId,
    debug: false
  });

  // ✅ Gestion des événements de navigation globale (menu, etc.) avec modalSystem
  useEffect(() => {
    if (mode === FORM_MODES.VIEW || !hasUnsavedChanges) return;

    const handleNavigationBlocked = async (event) => {
      console.log('🌍 FACTURE - Événement navigation-blocked reçu:', event.detail);
      
      if (event.detail && event.detail.callback) {
        try {
          const result = await showConfirm({
            title: "Modifications non sauvegardées",
            message: "Vous avez des modifications non sauvegardées. Souhaitez-vous vraiment quitter sans sauvegarder ?",
            confirmText: "Quitter sans sauvegarder",
            cancelText: "Continuer l'édition",
            type: 'warning'
          });
          
          if (result.action === 'confirm') {
            console.log('✅ FACTURE - Navigation confirmée');
            resetChanges();
            unregisterGuard(guardId);
            event.detail.callback();
          } else {
            console.log('❌ FACTURE - Navigation annulée');
          }
        } catch (error) {
          console.error('❌ Erreur modal globale:', error);
        }
      }
    };

    window.addEventListener('navigation-blocked', handleNavigationBlocked);
    
    return () => {
      window.removeEventListener('navigation-blocked', handleNavigationBlocked);
    };
  }, [mode, hasUnsavedChanges, resetChanges, guardId, unregisterGuard]);

  /**
   * Gestion du succès de sauvegarde avec navigation
   */
  const handleSuccessfulSave = useCallback((idFacture, message, callbacks) => {
    console.log('✅ FACTURE - Sauvegarde réussie, nettoyage des modifications');
    
    markAsSaved();
    resetChanges();
    unregisterGuard(guardId);

    // Navigation selon le mode
    if (mode === FORM_MODES.CREATE && callbacks.onFactureCreated) {
      callbacks.onFactureCreated(idFacture, message);
    } else if (callbacks.onRetourListe) {
      callbacks.onRetourListe(idFacture, true, message, 'success');
    }
  }, [mode, markAsSaved, resetChanges, guardId, unregisterGuard]);

  return {
    // États de détection des modifications
    hasUnsavedChanges,
    
    // Fonction de navigation (utilise modalSystem automatiquement)
    requestNavigation,
    
    // Utilitaires
    handleSuccessfulSave,
    markAsSaved,
    resetChanges,
    guardId,
    unregisterGuard
  };
};