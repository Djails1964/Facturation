// src/hooks/useGlobalNavigationGuard.js - Version améliorée
import { useEffect, useRef } from 'react';
import { createLogger } from '../utils/createLogger';

/**
 * Hook pour intercepter TOUTES les navigations possibles
 * Doit être utilisé au niveau le plus haut possible de l'application
 */
export const useGlobalNavigationGuard = () => {

  const log = createLogger("useGlobalNavigationGuard");

  const activeGuards = useRef(new Map());
  const pendingNavigation = useRef(null);
  const isNavigationBlocked = useRef(false);

  // Enregistrer un guard pour un composant spécifique
  const registerGuard = (guardId, guardFunction) => {
    activeGuards.current.set(guardId, guardFunction);
    log.debug(`🔒 Guard enregistré: ${guardId}`);
  };

  // Désenregistrer un guard
  const unregisterGuard = (guardId) => {
    activeGuards.current.delete(guardId);
    log.debug(`🔓 Guard supprimé: ${guardId}`);
  };

  // Vérifier s'il y a des modifications non sauvegardées
  const checkForUnsavedChanges = async () => {
    for (const [guardId, guardFunction] of activeGuards.current) {
      const hasUnsavedChanges = await guardFunction();
      if (hasUnsavedChanges) {
        log.debug(`⚠️ Modifications non sauvegardées détectées dans: ${guardId}`);
        return { hasChanges: true, guardId };
      }
    }
    return { hasChanges: false, guardId: null };
  };

  // Intercepter la navigation et demander confirmation si nécessaire
  const interceptNavigation = async (navigationFunction, source = 'unknown') => {
    log.debug(`🔍 Vérification navigation depuis: ${source}`);
    
    const { hasChanges, guardId } = await checkForUnsavedChanges();
    
    if (hasChanges) {
      log.debug(`🚫 Navigation bloquée par: ${guardId}`);
      
      // Stocker la navigation en attente
      pendingNavigation.current = navigationFunction;
      isNavigationBlocked.current = true;
      
      // Émettre un événement pour que le composant concerné puisse afficher sa modal
      const event = new CustomEvent('navigation-blocked', {
        detail: {
          source,
          guardId,
          callback: navigationFunction
        }
      });
      window.dispatchEvent(event);
      
      return false; // Navigation bloquée
    }
    
    // Pas de modifications, autoriser la navigation
    log.debug(`✅ Navigation autorisée depuis: ${source}`);
    navigationFunction();
    return true;
  };

  // Confirmer la navigation en attente
  const confirmPendingNavigation = () => {
    if (pendingNavigation.current) {
      log.debug(`✅ Exécution de la navigation en attente`);
      pendingNavigation.current();
      pendingNavigation.current = null;
      isNavigationBlocked.current = false;
    }
  };

  // Annuler la navigation en attente
  const cancelPendingNavigation = () => {
    log.debug(`❌ Annulation de la navigation en attente`);
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