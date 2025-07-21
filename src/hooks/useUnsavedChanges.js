// src/hooks/useUnsavedChanges.js - Version corrigée pour gérer la création
import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Hook personnalisé pour détecter les modifications non sauvegardées
 * @param {Object} initialData - Données initiales du formulaire
 * @param {Object} currentData - Données actuelles du formulaire
 * @param {boolean} isSaving - Indique si une sauvegarde est en cours
 * @param {boolean} hasJustSaved - Indique si une sauvegarde vient d'être effectuée
 * @returns {Object} État et fonctions pour gérer les modifications non sauvegardées
 */
export const useUnsavedChanges = (
  initialData = {},
  currentData = {},
  isSaving = false,
  hasJustSaved = false
) => {
  // États
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);

  // Références
  const lastSavedData = useRef(null);
  const isInitialized = useRef(false);
  const initialDataString = JSON.stringify(initialData);
  const currentDataString = JSON.stringify(currentData);

  // Fonction pour vérifier si les données sont "vides" (état initial pour création)
  const isEmptyFormData = useCallback((data) => {
    if (!data || typeof data !== 'object') return true;
    
    const keys = Object.keys(data);
    if (keys.length === 0) return true;
    
    // Vérifier si tous les champs sont vides/falsy (sauf les booléens qui peuvent être false)
    return keys.every(key => {
      const value = data[key];
      if (typeof value === 'boolean') return false; // Les booléens comptent comme "non vides"
      if (typeof value === 'number') return value === 0; // Les nombres 0 sont considérés comme vides
      if (Array.isArray(value)) return value.length === 0;
      if (typeof value === 'string') return value.trim() === '';
      return !value; // null, undefined, etc.
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

      // Gestion spéciale pour les tableaux
      if (Array.isArray(val1) && Array.isArray(val2)) {
        if (val1.length !== val2.length) return false;
        for (let i = 0; i < val1.length; i++) {
          if (!deepCompare(val1[i], val2[i])) return false;
        }
        continue;
      }

      // Gestion spéciale pour les objets imbriqués
      if (typeof val1 === 'object' && typeof val2 === 'object') {
        if (!deepCompare(val1, val2)) return false;
        continue;
      }

      // Comparaison directe pour les primitives
      if (val1 !== val2) return false;
    }

    return true;
  }, []);

  // Initialiser les données de référence au premier chargement
  useEffect(() => {
    // Initialiser dès qu'on a des données initiales (même vides)
    const shouldInitialize = !isInitialized.current && 
      initialData && 
      Object.keys(initialData).length > 0;

    if (shouldInitialize) {
      console.log('🔧 Initialisation données useUnsavedChanges:', {
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
    console.log('🔍 useUnsavedChanges effect déclenché:', {
      isInitialized: isInitialized.current,
      isSaving,
      currentDataKeys: Object.keys(currentData),
      isEmpty: isEmptyFormData(currentData)
    });

    // Ne pas détecter les changements si :
    // - Pas encore initialisé
    // - En cours de sauvegarde
    // - Pas de données actuelles valides
    if (!isInitialized.current || isSaving || !currentData) {
      console.log('🚫 Détection bloquée - conditions non remplies');
      return;
    }

    // Attendre un délai pour éviter les détections transitoires
    const detectionTimer = setTimeout(() => {
      // ✅ LOGIQUE AMÉLIORÉE : Pour les factures, utiliser une comparaison filtrée
      let hasChanges = false;
      
      if (currentData.lignes !== undefined) {
        // C'est probablement FactureForm - utiliser une comparaison plus intelligente
        const currentFiltered = {
          numeroFacture: currentData.numeroFacture,
          dateFacture: currentData.dateFacture,
          clientId: currentData.clientId,
          ristourne: currentData.ristourne || 0,
          lignes: currentData.lignes?.map(l => ({
            description: l.description,
            quantite: parseFloat(l.quantite) || 0,
            prixUnitaire: parseFloat(l.prixUnitaire) || 0,
            serviceId: l.serviceId,
            uniteId: l.uniteId
          })) || []
        };
        
        const savedFiltered = {
          numeroFacture: lastSavedData.current.numeroFacture,
          dateFacture: lastSavedData.current.dateFacture,
          clientId: lastSavedData.current.clientId,
          ristourne: lastSavedData.current.ristourne || 0,
          lignes: lastSavedData.current.lignes?.map(l => ({
            description: l.description,
            quantite: parseFloat(l.quantite) || 0,
            prixUnitaire: parseFloat(l.prixUnitaire) || 0,
            serviceId: l.serviceId,
            uniteId: l.uniteId
          })) || []
        };
        
        hasChanges = !deepCompare(savedFiltered, currentFiltered);
      } else {
        // Comparaison directe pour les autres formulaires
        hasChanges = !deepCompare(lastSavedData.current, currentData);
      }
      
      console.log('🔍 useUnsavedChanges - Détection de modifications:', {
        hasChanges,
        lastSaved: lastSavedData.current,
        current: currentData,
        isLastSavedEmpty: isEmptyFormData(lastSavedData.current),
        isCurrentEmpty: isEmptyFormData(currentData)
      });

      setHasUnsavedChanges(hasChanges);
    }, 500); // ✅ Délai plus long pour la stabilité

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
      console.log('✅ Marqué comme sauvegardé');
    }
  }, [currentDataString]);

  const confirmNavigation = useCallback(() => {
    setShowUnsavedModal(false);
    if (pendingNavigation) {
      pendingNavigation();
      setPendingNavigation(null);
    }
  }, [pendingNavigation]);

  const cancelNavigation = useCallback(() => {
    setShowUnsavedModal(false);
    setPendingNavigation(null);
  }, []);

  const requestNavigation = useCallback((navigationFn) => {
    if (hasUnsavedChanges && !isSaving) {
      setPendingNavigation(() => navigationFn);
      setShowUnsavedModal(true);
      return false; // Bloquer la navigation
    }
    return true; // Autoriser la navigation
  }, [hasUnsavedChanges, isSaving]);

  const resetChanges = useCallback(() => {
    setHasUnsavedChanges(false);
    setShowUnsavedModal(false);
    setPendingNavigation(null);
    console.log('🔄 Reset des changements');
  }, []);

  return {
    // États
    hasUnsavedChanges,
    showUnsavedModal,
    // Fonctions
    markAsSaved,
    confirmNavigation,
    cancelNavigation,
    requestNavigation,
    resetChanges,
    // État d'initialisation pour debug
    isInitialized: isInitialized.current,
    // Données de debug
    lastSavedData: lastSavedData.current
  };
};