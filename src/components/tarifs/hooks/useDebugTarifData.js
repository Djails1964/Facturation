// hooks/useDebugTarifData.js - Hook de debug pour identifier les problèmes de données

import { useEffect, useRef } from 'react';

export const useDebugTarifData = (tarifs, componentName = 'Component') => {
  const lastDataRef = useRef(null);
  const renderCountRef = useRef(0);
  const lastLogTimeRef = useRef(0);

  useEffect(() => {
    renderCountRef.current++;
    const now = Date.now();
    
    // Éviter le spam de logs (max 1 log par seconde)
    if (now - lastLogTimeRef.current < 1000) {
      return;
    }
    lastLogTimeRef.current = now;

    console.group(`🔍 ${componentName} - Debug données tarifs (render #${renderCountRef.current})`);
    
    // Analyse détaillée des données
    console.log('📊 Analyse des données reçues:', {
      tarifs: tarifs,
      type: typeof tarifs,
      isArray: Array.isArray(tarifs),
      isNull: tarifs === null,
      isUndefined: tarifs === undefined,
      length: tarifs?.length,
      keys: tarifs && typeof tarifs === 'object' ? Object.keys(tarifs) : null,
      constructor: tarifs?.constructor?.name
    });

    // Vérifier si les données ont changé
    const hasChanged = JSON.stringify(tarifs) !== JSON.stringify(lastDataRef.current);
    console.log('🔄 Changement de données:', hasChanged);

    if (tarifs && typeof tarifs === 'object' && !Array.isArray(tarifs)) {
      console.log('⚠️ ATTENTION: tarifs n\'est pas un tableau!');
      console.log('🔍 Propriétés de l\'objet tarifs:', Object.keys(tarifs));
      
      // Chercher des propriétés qui pourraient contenir les vrais tarifs
      Object.keys(tarifs).forEach(key => {
        const value = tarifs[key];
        if (Array.isArray(value)) {
          console.log(`✅ Trouvé un tableau dans "${key}":`, value.length, 'éléments');
        }
      });
    }

    if (Array.isArray(tarifs)) {
      console.log('✅ tarifs est un tableau valide');
      if (tarifs.length > 0) {
        console.log('📝 Premier élément:', tarifs[0]);
        console.log('🔑 Clés du premier élément:', Object.keys(tarifs[0] || {}));
      }
    }

    // Stack trace pour voir d'où vient l'appel
    if (renderCountRef.current > 10) {
      console.log('🚨 ATTENTION: Plus de 10 renders! Possible boucle infinie');
      console.trace('Stack trace:');
    }

    lastDataRef.current = tarifs;
    console.groupEnd();
  }, [tarifs, componentName]);

  return {
    renderCount: renderCountRef.current,
    isValidArray: Array.isArray(tarifs),
    dataLength: tarifs?.length || 0
  };
};

// Hook pour analyser la source des données dans le state management
export const useDebugTarifState = (gestionState) => {
  useEffect(() => {
    if (gestionState && typeof gestionState === 'object') {
      console.group('🔍 Debug TarifGestionState');
      console.log('📊 État complet:', gestionState);
      console.log('📝 Propriétés tarifs:', {
        tarifs: gestionState.tarifs,
        tarifsType: typeof gestionState.tarifs,
        tarifsIsArray: Array.isArray(gestionState.tarifs),
        tarifsLength: gestionState.tarifs?.length
      });
      console.log('📝 Autres données:', {
        services: gestionState.services?.length || 'N/A',
        unites: gestionState.unites?.length || 'N/A',
        typesTarifs: gestionState.typesTarifs?.length || 'N/A'
      });
      console.groupEnd();
    }
  }, [gestionState]);
};