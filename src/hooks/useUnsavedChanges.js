// src/hooks/useUnsavedChanges.js
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
  const initialDataRef = useRef(initialData);
  const isInitialized = useRef(false);
  const lastSavedData = useRef(initialData);

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

  // Mettre à jour les données initiales quand elles changent
  useEffect(() => {
    if (!isInitialized.current || hasJustSaved) {
      initialDataRef.current = { ...currentData };
      lastSavedData.current = { ...currentData };
      isInitialized.current = true;
      setHasUnsavedChanges(false);
    }
  }, [hasJustSaved, currentData]);

  // Détecter les changements
  useEffect(() => {
    if (!isInitialized.current || isSaving) return;

    const hasChanges = !deepCompare(lastSavedData.current, currentData);
    setHasUnsavedChanges(hasChanges);
  }, [currentData, deepCompare, isSaving]);

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
    lastSavedData.current = { ...currentData };
    setHasUnsavedChanges(false);
  }, [currentData]);

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
    
    // Données de debug
    initialData: initialDataRef.current,
    lastSavedData: lastSavedData.current
  };
};