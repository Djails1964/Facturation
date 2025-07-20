// src/hooks/useUnsavedChanges.js - Version corrigée
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
    // Vérifier que les données initiales sont valides et complètes
    const hasValidInitialData = initialData && 
      Object.keys(initialData).length > 0 && 
      (initialData.numeroFacture || initialData.id || initialData.clientId);

    if (hasValidInitialData && !isInitialized.current) {
      console.log('🔧 Initialisation données useUnsavedChanges:', initialData);
      lastSavedData.current = { ...initialData };
      isInitialized.current = true;
      setHasUnsavedChanges(false);
    }
  }, [initialDataString]); // Utiliser la version sérialisée pour éviter les re-renders

  // Détecter les changements seulement après initialisation et avec des données valides
  useEffect(() => {
    // Ne pas détecter les changements si :
    // - Pas encore initialisé
    // - En cours de sauvegarde
    // - Pas de données actuelles valides
    // - Données actuelles vides
    if (!isInitialized.current || 
        isSaving || 
        !currentData || 
        Object.keys(currentData).length === 0) {
      return;
    }

    // Attendre un délai plus long pour éviter les détections transitoires
    const detectionTimer = setTimeout(() => {
      const hasChanges = !deepCompare(lastSavedData.current, currentData);
      
      // Pour les formulaires simples (comme ClientForm), utiliser la comparaison directe
      // Pour les formulaires complexes (comme FactureForm), utiliser le filtrage
      if (hasChanges && currentData.lignes !== undefined) {
        // C'est probablement FactureForm - utiliser le filtrage avancé
        const currentDataFiltered = {
          numeroFacture: currentData.numeroFacture,
          dateFacture: currentData.dateFacture,
          clientId: currentData.clientId,
          ristourne: currentData.ristourne || 0,
          lignes: currentData.lignes?.map(l => ({
            description: l.description,
            quantite: l.quantite,
            prixUnitaire: l.prixUnitaire,
            serviceId: l.serviceId,
            uniteId: l.uniteId
          })) || []
        };
        
        const savedDataFiltered = {
          numeroFacture: lastSavedData.current.numeroFacture,
          dateFacture: lastSavedData.current.dateFacture,
          clientId: lastSavedData.current.clientId,
          ristourne: lastSavedData.current.ristourne || 0,
          lignes: lastSavedData.current.lignes?.map(l => ({
            description: l.description,
            quantite: l.quantite,
            prixUnitaire: l.prixUnitaire,
            serviceId: l.serviceId,
            uniteId: l.uniteId
          })) || []
        };
        
        const realChanges = !deepCompare(savedDataFiltered, currentDataFiltered);
        
        console.log('🔍 Comparaison modifications useUnsavedChanges (FactureForm):', {
          hasChanges: realChanges,
          isInitialized: isInitialized.current,
          isSaving,
          lastSaved: savedDataFiltered,
          current: currentDataFiltered
        });

        setHasUnsavedChanges(realChanges);
      } else {
        // C'est probablement ClientForm ou autre - utiliser la comparaison directe
        console.log('🔍 Comparaison modifications useUnsavedChanges (simple):', {
          hasChanges,
          isInitialized: isInitialized.current,
          isSaving,
          lastSaved: lastSavedData.current,
          current: currentData
        });

        setHasUnsavedChanges(hasChanges);
      }
    }, 300); // Délai plus long pour la stabilité

    return () => clearTimeout(detectionTimer);
  }, [currentDataString, deepCompare, isSaving]); // Utiliser la version sérialisée

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
    if (currentData && Object.keys(currentData).length > 0) {
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
    // NE PAS réinitialiser isInitialized - laisser les données de référence
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