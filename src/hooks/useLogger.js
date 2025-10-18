// src/hooks/useLogger.js
import { useEffect, useState, useCallback } from 'react';
import logger from '../utils/logger';

/**
 * Hook personnalisé pour obtenir un logger avec préfixe du composant
 * ✅ Synchronise le niveau de log en temps réel
 * 
 * @param {string} componentName - Nom du composant pour le préfixe
 * @returns {Object} { log, enabled, setEnabled, level, setLevel }
 * 
 * @example
 * function MonComposant() {
 *   const { log, enabled, setEnabled, level, setLevel } = useLogger('MonComposant');
 *   
 *   log.info('Rendu du composant');
 *   
 *   return (
 *     <button onClick={() => setLevel('debug')}>
 *       Activer le debug
 *     </button>
 *   );
 * }
 */
export const useLogger = (componentName) => {
  const [enabled, setEnabledState] = useState(logger.enabled);
  const [level, setLevelState] = useState(logger.level);

  // Synchroniser l'état local avec le logger global
  useEffect(() => {
    // ✅ Fonction pour synchroniser l'état depuis le logger global
    const syncState = () => {
      setEnabledState(logger.enabled);
      setLevelState(logger.level);
    };

    // Écouter les changements du logger
    window.addEventListener('loggerChange', syncState);
    
    // ✅ IMPORTANT : Vérifier aussi périodiquement en cas d'accès direct via console
    const checkInterval = setInterval(() => {
      if (logger.level !== level || logger.enabled !== enabled) {
        syncState();
      }
    }, 1000); // Vérifier toutes les secondes
    
    return () => {
      window.removeEventListener('loggerChange', syncState);
      clearInterval(checkInterval);
    };
  }, [enabled, level]);

  // Setter pour enabled qui met à jour le logger global
  const setEnabled = (newEnabled) => {
    logger.setEnabled(newEnabled);
    setEnabledState(newEnabled);
    window.dispatchEvent(new Event('loggerChange'));
  };

  // Setter pour level qui met à jour le logger global
  const setLevel = (newLevel) => {
    logger.setLevel(newLevel);
    setLevelState(newLevel);
    window.dispatchEvent(new Event('loggerChange'));
  };

  // ✅ Retourner le logger avec préfixe et les contrôles
  // Le logger utilise toujours le niveau du logger global
  return {
    log: logger.withPrefix(componentName),
    enabled,
    setEnabled,
    level: logger.level, // ✅ Toujours récupérer depuis le logger global, pas du cache
    setLevel,
    // Utilitaires supplémentaires
    getStatus: () => logger.getStatus()
  };
};

export default useLogger;