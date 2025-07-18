// src/hooks/useGlobalNavigationGuard.js
import { useEffect, useRef } from 'react';

/**
 * Hook pour intercepter TOUTES les navigations possibles
 * Doit être utilisé au niveau le plus haut possible de l'application
 */
export const useGlobalNavigationGuard = () => {
  const activeGuards = useRef(new Map());
  const pendingNavigation = useRef(null);
  const isNavigationBlocked = useRef(false);

  // Enregistrer un guard pour un composant spécifique
  const registerGuard = (guardId, guardFunction) => {
    activeGuards.current.set(guardId, guardFunction);
    console.log(`🔒 Guard enregistré: ${guardId}`);
  };

  // Désenregistrer un guard
  const unregisterGuard = (guardId) => {
    activeGuards.current.delete(guardId);
    console.log(`🔓 Guard supprimé: ${guardId}`);
  };

  // Vérifier s'il y a des modifications non sauvegardées
  const checkForUnsavedChanges = async () => {
    for (const [guardId, guardFunction] of activeGuards.current) {
      const hasUnsavedChanges = await guardFunction();
      if (hasUnsavedChanges) {
        console.log(`⚠️ Modifications non sauvegardées détectées dans: ${guardId}`);
        return { hasChanges: true, guardId };
      }
    }
    return { hasChanges: false, guardId: null };
  };

  // Intercepter la navigation et demander confirmation si nécessaire
  const interceptNavigation = async (navigationFunction, source = 'unknown') => {
    console.log(`🔍 Vérification navigation depuis: ${source}`);
    
    const { hasChanges, guardId } = await checkForUnsavedChanges();
    
    if (hasChanges) {
      console.log(`🚫 Navigation bloquée par: ${guardId}`);
      // Stocker la navigation en attente
      pendingNavigation.current = navigationFunction;
      isNavigationBlocked.current = true;
      
      // Le guard spécifique gérera l'affichage de la modal
      return false; // Navigation bloquée
    }
    
    // Pas de modifications, autoriser la navigation
    console.log(`✅ Navigation autorisée depuis: ${source}`);
    navigationFunction();
    return true;
  };

  // Confirmer la navigation en attente
  const confirmPendingNavigation = () => {
    if (pendingNavigation.current) {
      console.log(`✅ Exécution de la navigation en attente`);
      pendingNavigation.current();
      pendingNavigation.current = null;
      isNavigationBlocked.current = false;
    }
  };

  // Annuler la navigation en attente
  const cancelPendingNavigation = () => {
    console.log(`❌ Annulation de la navigation en attente`);
    pendingNavigation.current = null;
    isNavigationBlocked.current = false;
  };

  return {
    registerGuard,
    unregisterGuard,
    interceptNavigation,
    confirmPendingNavigation,
    cancelPendingNavigation,
    checkForUnsavedChanges,
    isNavigationBlocked: () => isNavigationBlocked.current
  };
};