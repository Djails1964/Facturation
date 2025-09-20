// src/components/clients/hooks/useClientNavigation.js
// Hook pour la gestion de la navigation client
// ✅ CORRECTIF FINAL : Intégration avec useClientForm pour navigation globale

import { useState, useCallback, useEffect } from 'react';
import { FORM_MODES } from '../../../constants/clientConstants';

/**
 * Hook pour la gestion de la navigation client
 * ✅ CORRECTIF FINAL : Fournit les gestionnaires globaux à useClientForm
 */
export function useClientNavigation(
  clientFormState, 
  onRetourListe, 
  onClientCreated,
  options = {}
) {
  const {
    client,
    mode,
    handleSubmit,
    // Données unifiées d'useUnsavedChanges
    hasUnsavedChanges,
    showUnsavedModal,
    confirmNavigation,
    cancelNavigation,
    requestNavigation,
    markAsSaved,
    resetChanges,
    // ✅ NOUVEAU : Méthode pour connecter avec useClientForm
    setGlobalHandlers
  } = clientFormState;

  const {
    autoNavigateAfterSave = true
  } = options;

  // ================================
  // ÉTAT LOCAL POUR NAVIGATION GLOBALE
  // ================================
  
  const [showGlobalModal, setShowGlobalModal] = useState(false);
  const [globalNavigationCallback, setGlobalNavigationCallback] = useState(null);

  // ================================
  // ✅ CONNEXION AVEC useClientForm
  // ================================

  useEffect(() => {
    if (setGlobalHandlers) {
      console.log('🔗 CLIENT NAVIGATION - Connexion des gestionnaires globaux avec useClientForm');
      setGlobalHandlers({
        setShowGlobalModal,
        setGlobalNavigationCallback: (callback) => setGlobalNavigationCallback(callback)
      });
    }
  }, [setGlobalHandlers]);

  // ================================
  // GESTIONNAIRES DE NAVIGATION
  // ================================

  const handleRetour = useCallback(() => {
    console.log('🔙 CLIENT - handleRetour appelé:', { hasUnsavedChanges });
    
    if (hasUnsavedChanges) {
      // ✅ Utiliser EXCLUSIVEMENT le système useUnsavedChanges
      const canNavigate = requestNavigation(() => {
        console.log('🔙 Navigation vers la liste confirmée via useUnsavedChanges');
        onRetourListe?.();
      });
      
      if (!canNavigate) {
        console.log('🔒 Navigation retour bloquée par modifications non sauvegardées');
      }
    } else {
      console.log('🔙 Navigation directe vers la liste');
      onRetourListe?.();
    }
  }, [hasUnsavedChanges, requestNavigation, onRetourListe]);

  const handleSubmitWithNavigation = useCallback(async (customSubmitFn = null) => {
    try {
      console.log('📤 CLIENT - Soumission avec navigation automatique', { mode, autoNavigateAfterSave });
      
      const submitFunction = customSubmitFn || handleSubmit;
      const result = await submitFunction();
      
      if (result) {
        console.log('✅ CLIENT - Soumission réussie', { mode, autoNavigateAfterSave, hasOnRetourListe: !!onRetourListe });
        
        // ✅ Marquer comme sauvegardé dans le système unifié
        markAsSaved();
        
        // Callbacks selon le mode
        if (mode === FORM_MODES.CREATE && onClientCreated) {
          console.log('🆕 CLIENT - Callback onClientCreated pour nouveau client');
          onClientCreated(result);
        } else if (mode === FORM_MODES.EDIT && onClientCreated) {
          console.log('✏️ CLIENT - Callback onClientCreated pour modification');
          onClientCreated(result);
        }
        
        // ✅ CORRECTIF : Navigation automatique TOUJOURS après sauvegarde réussie
        console.log('🚀 CLIENT - Navigation automatique après sauvegarde réussie (mode:', mode, ')');
        
        setTimeout(() => {
          if (onRetourListe) {
            console.log('📍 CLIENT - Exécution onRetourListe');
            onRetourListe();
          } else {
            console.warn('⚠️ CLIENT - onRetourListe non disponible');
          }
        }, 100);
        
        return result;
      }
    } catch (error) {
      console.error('❌ CLIENT - Erreur lors de la soumission avec navigation:', error);
      throw error;
    }
  }, [handleSubmit, markAsSaved, onClientCreated, mode, onRetourListe, autoNavigateAfterSave]);

  // ================================
  // ✅ GESTIONNAIRES POUR NAVIGATION GLOBALE (Menu → Paiements)
  // ================================
  
  // Ces gestionnaires sont utilisés quand le guard de useClientForm détecte une navigation globale
  const handleConfirmGlobalNavigation = useCallback(() => {
    console.log('✅ CLIENT - Navigation globale confirmée par l\'utilisateur');
    
    setShowGlobalModal(false);
    
    // ✅ Reset via le système unifié
    resetChanges();
    
    // Exécuter le callback de navigation stocké
    if (globalNavigationCallback) {
      console.log('🚀 CLIENT - Exécution du callback de navigation globale');
      try {
        // ✅ CORRECTIF FINAL : Exécuter le callback directement
        if (typeof globalNavigationCallback === 'function') {
          globalNavigationCallback();
        } else {
          console.warn('⚠️ CLIENT - globalNavigationCallback n\'est pas une fonction:', typeof globalNavigationCallback);
        }
        setGlobalNavigationCallback(null);
      } catch (error) {
        console.error('❌ CLIENT - Erreur lors de l\'exécution du callback de navigation:', error);
      }
    } else {
      console.warn('⚠️ CLIENT - Aucun callback de navigation stocké');
    }
  }, [resetChanges, globalNavigationCallback]);

  const handleCancelGlobalNavigation = useCallback(() => {
    console.log('❌ CLIENT - Navigation globale annulée par l\'utilisateur');
    setShowGlobalModal(false);
    setGlobalNavigationCallback(null);
  }, []);

  // ================================
  // RETURN - API PUBLIQUE SIMPLIFIÉE
  // ================================

  return {
    // ✅ États unifiés (proviennent de useUnsavedChanges)
    hasUnsavedChanges,
    showUnsavedModal,
    showGlobalModal,
    
    // Gestionnaires de navigation locale (utilise useUnsavedChanges)
    handleRetour,
    handleSubmitWithNavigation,
    
    // ✅ Gestionnaires unifiés (proviennent de useUnsavedChanges)
    confirmNavigation,
    cancelNavigation,
    
    // Gestionnaires de navigation globale (pour les modales)
    handleConfirmGlobalNavigation,
    handleCancelGlobalNavigation,
    
    // Utilitaires unifiés
    markAsSaved,
    resetChanges,
    
    // État pour debug
    guardId: `client-form-${client.id || 'new'}`,
    
    // ✅ NOUVEAU : Fonctions pour la gestion de la modal globale (utilisées par useClientForm)
    setShowGlobalModal,
    setGlobalNavigationCallback
  };

}