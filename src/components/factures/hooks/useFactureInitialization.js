import { useState, useEffect } from 'react';
import { FORM_MODES } from '../../../constants/factureConstants';

export const useFactureInitialization = (mode, factureId, factureActions) => {
  const [isFullyInitialized, setIsFullyInitialized] = useState(false);
  const [isInitialLoadDone, setIsInitialLoadDone] = useState(false);
  const [initialFormData, setInitialFormData] = useState({});

  const { chargerFacture, fetchProchainNumeroFacture, chargerClients, setFacture, setIsLoading, getFormData } = factureActions;

  // Effet de chargement initial
  useEffect(() => {
    const loadData = async () => {
      if ((mode === FORM_MODES.EDIT || mode === FORM_MODES.VIEW) && factureId) {
        await chargerFacture(factureId);
        if (mode === FORM_MODES.VIEW) {
          await chargerClients();
        }
      } else if (mode === FORM_MODES.CREATE) {
        const today = new Date();
        setFacture(prev => ({
          ...prev,
          dateFacture: today.toISOString().split('T')[0],
          numeroFacture: '',
          clientId: null,
          lignes: []
        }));
        await fetchProchainNumeroFacture(today.getFullYear());
        setIsLoading(false);
      }
      setIsInitialLoadDone(true);
    };

    loadData();
  }, [mode, factureId]);

  // Effet de finalisation de l'initialisation
  useEffect(() => {
    if (isInitialLoadDone && !isFullyInitialized) {
      const timer = setTimeout(() => {
        const currentFormData = getFormData();
        const hasValidData = mode === FORM_MODES.CREATE ? 
          currentFormData.numeroFacture :
          currentFormData.numeroFacture && 
          currentFormData.lignes?.length > 0;

        if (hasValidData) {
          setTimeout(() => {
            const finalFormData = getFormData();
            setInitialFormData(finalFormData);
            setIsFullyInitialized(true);
          }, 800);
        }
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [isInitialLoadDone, isFullyInitialized, getFormData, mode]);

  return {
    isFullyInitialized,
    setIsFullyInitialized,
    isInitialLoadDone,
    initialFormData,
    setInitialFormData
  };
};