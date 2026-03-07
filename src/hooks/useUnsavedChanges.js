// src/hooks/useUnsavedChanges.js - Version avec modal système unifié
import { useState, useEffect, useRef, useCallback } from 'react';
import { showConfirm } from '../utils/modalSystem';
import { createLogger } from '../utils/createLogger';

/**
 * Hook personnalisé pour détecter les modifications non sauvegardées
 * ✅ VERSION UNIFIÉE : Utilise le modal system au lieu de modales locales
 */
export const useUnsavedChanges = (
  initialData = {},
  currentData = {},
  isSaving = false,
  hasJustSaved = false
) => {

  const log = createLogger('useUnsavedChanges');

  // États
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  // ✅ SUPPRIMÉ : Plus besoin de showUnsavedModal car on utilise le modal system
  const [pendingNavigation, setPendingNavigation] = useState(null);

  // Références
  const lastSavedData = useRef(null);
  const isInitialized = useRef(false);
  const initialDataString = JSON.stringify(initialData);
  const currentDataString = JSON.stringify(currentData);

  // Fonction pour vérifier si les données sont "vides"
  const isEmptyFormData = useCallback((data) => {
    if (!data || typeof data !== 'object') return true;
    
    const keys = Object.keys(data);
    if (keys.length === 0) return true;
    
    return keys.every(key => {
      const value = data[key];
      if (typeof value === 'boolean') return false;
      if (typeof value === 'number') return value === 0;
      if (Array.isArray(value)) return value.length === 0;
      if (typeof value === 'string') return value.trim() === '';
      return !value;
    });
  }, []);

  // Fonction de comparaison profonde optimisée
  const deepCompare = useCallback((obj1, obj2) => {
    if (obj1 === obj2) return true;
    if (!obj1 || !obj2) return obj1 === obj2;
    if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return obj1 === obj2;

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) return false;

    for (let key of keys1) {
      if (!keys2.includes(key)) return false;
      const val1 = obj1[key];
      const val2 = obj2[key];

      if (Array.isArray(val1) && Array.isArray(val2)) {
        if (val1.length !== val2.length) return false;
        for (let i = 0; i < val1.length; i++) {
          if (!deepCompare(val1[i], val2[i])) return false;
        }
        continue;
      }

      if (typeof val1 === 'object' && typeof val2 === 'object') {
        if (!deepCompare(val1, val2)) return false;
        continue;
      }

      if (val1 !== val2) return false;
    }

    return true;
  }, []);

  // Initialiser les données de référence au premier chargement
  useEffect(() => {
    const shouldInitialize = !isInitialized.current && 
      initialData && 
      Object.keys(initialData).length > 0;

    if (shouldInitialize) {
      log.debug('🔧 Initialisation données useUnsavedChanges:', {
        initialData,
        isEmpty: isEmptyFormData(initialData),
        keys: Object.keys(initialData)
      });
      
      lastSavedData.current = { ...initialData };
      isInitialized.current = true;
      setHasUnsavedChanges(false);
    }
  }, [initialDataString, isEmptyFormData]);

  // Détecter les changements seulement après initialisation
  useEffect(() => {
    log.debug('🔍 useUnsavedChanges effect déclenché:', {
      isInitialized: isInitialized.current,
      isSaving,
      currentDataKeys: Object.keys(currentData),
      isEmpty: isEmptyFormData(currentData)
    });

    if (!isInitialized.current || isSaving || !currentData) {
      log.debug('🚫 Détection bloquée - conditions non remplies');
      return;
    }

    const detectionTimer = setTimeout(() => {
      let hasChanges = false;
      
      if (currentData.lignes !== undefined) {
        // Factures - comparaison filtrée
        const currentFiltered = {
          numeroFacture: currentData.numeroFacture,
          dateFacture: currentData.dateFacture,
          idClient: currentData.idClient,
          ristourne: currentData.ristourne || 0,
          lignes: currentData.lignes?.map(l => ({
            description: l.description,
            quantite: parseFloat(l.quantite) || 0,
            prixUnitaire: parseFloat(l.prixUnitaire) || 0,
            idService: l.idService,
            idUnite: l.idUnite
          })) || []
        };
        
        const savedFiltered = {
          numeroFacture: lastSavedData.current.numeroFacture,
          dateFacture: lastSavedData.current.dateFacture,
          idClient: lastSavedData.current.idClient,
          ristourne: lastSavedData.current.ristourne || 0,
          lignes: lastSavedData.current.lignes?.map(l => ({
            description: l.description,
            quantite: parseFloat(l.quantite) || 0,
            prixUnitaire: parseFloat(l.prixUnitaire) || 0,
            idService: l.idService,
            idUnite: l.idUnite
          })) || []
        };

        log.debug('📊 Comparaison lignes facture:', {
          currentLignes: currentFiltered.lignes,
          savedLignes: savedFiltered.lignes,
          equal: deepCompare(currentFiltered.lignes, savedFiltered.lignes)
        });
        
        hasChanges = !deepCompare(savedFiltered, currentFiltered);
      } else {
        // Autres formulaires - comparaison directe
        hasChanges = !deepCompare(lastSavedData.current, currentData);
      }
      
      log.debug('🔍 useUnsavedChanges - Détection de modifications:', {
        hasChanges,
        lastSaved: lastSavedData.current,
        current: currentData,
        isLastSavedEmpty: isEmptyFormData(lastSavedData.current),
        isCurrentEmpty: isEmptyFormData(currentData)
      });

      setHasUnsavedChanges(hasChanges);
    }, 500);

    return () => clearTimeout(detectionTimer);
  }, [currentDataString, deepCompare, isSaving, isEmptyFormData]);

  // Bloquer la navigation du navigateur si modifications non sauvegardées
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges && !isSaving) {
        e.preventDefault();
        e.returnValue = 'Vous avez des modifications non sauvegardées. Êtes-vous sûr de vouloir quitter ?';
        return e.returnValue;
      }
    };

    if (hasUnsavedChanges) {
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [hasUnsavedChanges, isSaving]);

  // Fonctions utilitaires
  const markAsSaved = useCallback(() => {
    if (currentData) {
      lastSavedData.current = { ...currentData };
      setHasUnsavedChanges(false);
      log.debug('✅ Marqué comme sauvegardé');
    }
  }, [currentDataString]);

  // ✅ NOUVEAU : Utilise le modal system unifié au lieu d'un état local
  const requestNavigation = useCallback((navigationFn) => {
    if (hasUnsavedChanges && !isSaving) {
      log.debug('🎭 MODAL UNIFIÉE - Affichage modal pour modifications non sauvegardées');
      
      const modalConfig = {
        title: "Modifications non sauvegardées",
        message: "Vous avez des modifications non sauvegardées. Souhaitez-vous vraiment quitter sans sauvegarder ?",
        confirmText: "Quitter sans sauvegarder",
        cancelText: "Continuer l'édition",
        type: 'warning',
        size: 'medium'
      };

      showConfirm(modalConfig)
        .then((result) => {
          if (result.action === 'confirm') {
            log.debug('✅ MODAL UNIFIÉE - Navigation confirmée par l\'utilisateur');
            log.debug('🚀 MODAL UNIFIÉE - Exécution du callback de navigation');
            
            // ✅ CORRECTIF : Vérifier et exécuter le callback
            if (typeof navigationFn === 'function') {
              try {
                navigationFn();
                log.debug('✅ MODAL UNIFIÉE - Callback de navigation exécuté avec succès');
              } catch (error) {
                log.error('❌ MODAL UNIFIÉE - Erreur lors de l\'exécution du callback:', error);
              }
            } else {
              log.error('❌ MODAL UNIFIÉE - navigationFn n\'est pas une fonction:', typeof navigationFn);
            }
          } else {
            log.debug('❌ MODAL UNIFIÉE - Navigation annulée par l\'utilisateur');
          }
        })
        .catch((error) => {
          log.error('❌ Erreur dans la modal unifiée:', error);
        });
        
      return false; // Bloquer la navigation
    }
    return true; // Autoriser la navigation
  }, [hasUnsavedChanges, isSaving]);

  // ✅ SIMPLIFIÉES : Plus besoin de ces fonctions avec le modal system
  const confirmNavigation = useCallback(() => {
    // Cette fonction n'est plus utilisée avec le modal system
    log.debug('⚠️ confirmNavigation appelé - mais utilise le modal system maintenant');
  }, []);

  const cancelNavigation = useCallback(() => {
    // Cette fonction n'est plus utilisée avec le modal system
    log.debug('⚠️ cancelNavigation appelé - mais utilise le modal system maintenant');
  }, []);

  const resetChanges = useCallback(() => {
    setHasUnsavedChanges(false);
    setPendingNavigation(null);
    log.debug('🔄 Reset des changements');
  }, []);

  return {
    // États
    hasUnsavedChanges,
    showUnsavedModal: false, // ✅ Toujours false car on utilise le modal system
    // Fonctions
    markAsSaved,
    confirmNavigation, // Gardée pour compatibilité mais non utilisée
    cancelNavigation,  // Gardée pour compatibilité mais non utilisée
    requestNavigation, // ✅ Utilise maintenant le modal system
    resetChanges,
    // État d'initialisation pour debug
    isInitialized: isInitialized.current,
    // Données de debug
    lastSavedData: lastSavedData.current
  };
};