import { useState, useEffect, useRef } from 'react';
import { FORM_MODES } from '../../../constants/factureConstants';

export const useFactureInitialization = (mode, idFacture, factureActions) => {
  const [isFullyInitialized, setIsFullyInitialized] = useState(false);
  const [isInitialLoadDone, setIsInitialLoadDone] = useState(false);
  const [initialFormData, setInitialFormData] = useState({});

  // ✅ PROTECTION TOTALE contre les appels multiples
  const initRef = useRef({
    hasInitialized: false,
    currentMode: null,
    currentId: null,
    isProcessing: false
  });

  const { chargerFacture, chargerClients, setFacture, setIsLoading, getFormData } = factureActions;

  // ✅ EFFET UNIQUE simplifié avec protection totale
  useEffect(() => {
    const currentMode = mode;
    const currentId = idFacture;
    
    console.log('🔍 useFactureInitialization - useEffect déclenché:', {
      mode: currentMode,
      idFacture: currentId,
      typeIdFacture: typeof currentId
    });

    // ✅ VERIFICATIONS DE SECURITE
    // 1. Vérifier si déjà en cours de traitement
    if (initRef.current.isProcessing) {
      console.log('⏸️ Traitement déjà en cours, abandon');
      return;
    }

    // 2. Vérifier si déjà initialisé pour ces paramètres EXACTS
    if (initRef.current.hasInitialized && 
        initRef.current.currentMode === currentMode && 
        initRef.current.currentId === currentId) {
      console.log('✅ Déjà initialisé pour ces paramètres, skip');
      return;
    }

    // 3. Si mode VIEW sans ID, ne pas initialiser
    if ((currentMode === FORM_MODES.VIEW || currentMode === FORM_MODES.EDIT) && !currentId) {
      console.log('❌ Mode VIEW/EDIT sans ID, abandon');
      setIsLoading(false);
      return;
    }

    // ✅ DEBUT DU TRAITEMENT
    const initializeData = async () => {
      // Marquer comme en cours
      initRef.current.isProcessing = true;

      let factureDataRef = null;
      
      try {
        console.log('🚀 Début initialisation pour mode:', currentMode, 'ID:', currentId);

        if (currentMode === FORM_MODES.CREATE) {
          // ✅ MODE CREATION
          // numeroFacture est vide — il sera alloué par le backend à la sauvegarde
          console.log('🆕 Initialisation mode création');
          const today = new Date();
          setFacture(prev => ({
            ...prev,
            dateFacture: today.toISOString().split('T')[0],
            numeroFacture: '',
            idClient: null,
            lignes: []
          }));
          
        } else if ((currentMode === FORM_MODES.VIEW || currentMode === FORM_MODES.EDIT) && currentId) {
          // ✅ MODE VIEW/EDIT avec ID
          console.log('🔄 Chargement facture pour mode:', currentMode, 'ID:', currentId);
          const loadedFacture = await chargerFacture(currentId);
          console.log('📦 Données facture chargées:', loadedFacture);
          
          // Stocker les données pour l'initialisation
          factureDataRef = loadedFacture;
        }

        // ✅ FINALISATION
        console.log('✅ Initialisation terminée pour mode:', currentMode);
        
        // Marquer comme traité
        initRef.current.hasInitialized = true;
        initRef.current.currentMode = currentMode;
        initRef.current.currentId = currentId;
        
        setIsInitialLoadDone(true);
        setIsLoading(false);
        
        // ✅ CORRECTION: Attendre plus longtemps pour que les données se propagent
        if (currentMode === FORM_MODES.CREATE) {
          // Mode création
          setTimeout(() => {
            const finalFormData = getFormData();
            console.log('📊 Données finales (CREATE):', finalFormData);
            setInitialFormData(finalFormData);
            setIsFullyInitialized(true);
          }, 300);
        } else if (factureDataRef) {  // ✅ Changé de factureData à factureDataRef
          // Mode EDIT/VIEW : utiliser directement factureDataRef de l'API
          setTimeout(() => {
            console.log('✅ Utilisation des données API directes:', factureDataRef);
            setInitialFormData({
              numeroFacture: factureDataRef.numeroFacture || '',
              dateFacture: factureDataRef.dateFacture || '',
              idClient: factureDataRef.idClient || null,
              lignes: factureDataRef.lignes || [],
              ristourne: factureDataRef.ristourne || 0,
              montantTotal: factureDataRef.montantTotal || 0,
              totalAvecRistourne: factureDataRef.totalAvecRistourne || 0
            });
            setIsFullyInitialized(true);
          }, 500);
        }

      } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
        setIsLoading(false);
      } finally {
        initRef.current.isProcessing = false;
      }
    };

    // Démarrer l'initialisation
    initializeData();

  }, [mode, idFacture]); // ✅ DEPENDANCES MINIMALES

  // ✅ Cleanup lors du démontage
  useEffect(() => {
    return () => {
      console.log('🧹 Cleanup useFactureInitialization');
      initRef.current = {
        hasInitialized: false,
        currentMode: null,
        currentId: null,
        isProcessing: false
      };
    };
  }, []);

  return {
    isFullyInitialized,
    setIsFullyInitialized,
    isInitialLoadDone,
    initialFormData,
    setInitialFormData
  };
};