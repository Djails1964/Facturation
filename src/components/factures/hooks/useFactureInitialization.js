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

  const { chargerFacture, fetchProchainNumeroFacture, chargerClients, setFacture, setIsLoading, getFormData } = factureActions;

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
      
      try {
        console.log('🚀 Début initialisation pour mode:', currentMode, 'ID:', currentId);

        if (currentMode === FORM_MODES.CREATE) {
          // ✅ MODE CREATION
          console.log('🆕 Initialisation mode création');
          const today = new Date();
          setFacture(prev => ({
            ...prev,
            dateFacture: today.toISOString().split('T')[0],
            numeroFacture: '',
            clientId: null,
            lignes: []
          }));
          
          await fetchProchainNumeroFacture(today.getFullYear());
          
        } else if ((currentMode === FORM_MODES.VIEW || currentMode === FORM_MODES.EDIT) && currentId) {
          // ✅ MODE VIEW/EDIT avec ID
          console.log('🔄 Chargement facture pour mode:', currentMode, 'ID:', currentId);
          await chargerFacture(currentId);
          
          // ✅ ATTENDRE que les données soient réellement chargées
          console.log('⏳ Attente propagation des données...');
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
        setTimeout(() => {
          const finalFormData = getFormData();
          console.log('📊 Données finales récupérées:', finalFormData);
          
          // ✅ Vérifier que nous avons vraiment des données avant de marquer comme initialisé
          const hasValidData = currentMode === FORM_MODES.CREATE ? 
            finalFormData.numeroFacture : 
            finalFormData.numeroFacture || finalFormData.clientId; // Au moins l'un des deux
          
          if (hasValidData || currentMode === FORM_MODES.VIEW) {
            setInitialFormData(finalFormData);
            setIsFullyInitialized(true);
            console.log('✅ Initialisation REELLEMENT terminée avec données:', finalFormData);
          } else {
            console.log('⚠️ Pas encore de données, nouvel essai...');
            // Réessayer dans 200ms
            setTimeout(() => {
              const retryFormData = getFormData();
              console.log('🔄 Retry - Données récupérées:', retryFormData);
              setInitialFormData(retryFormData);
              setIsFullyInitialized(true);
              console.log('✅ Initialisation terminée (retry) pour mode:', currentMode);
            }, 200);
          }
        }, 300); // Augmenté de 100ms à 300ms

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