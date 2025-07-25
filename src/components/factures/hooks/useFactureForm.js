import { useState, useCallback, useMemo } from 'react';
import { FORM_MODES } from '../../../constants/factureConstants';
import FactureService from '../../../services/FactureService';
import ClientService from '../../../services/ClientService';

export const useFactureForm = (mode, factureId) => {
  // États principaux
  const [facture, setFacture] = useState({
    id: '',
    numeroFacture: '',
    dateFacture: '',
    clientId: null,
    totalFacture: 0,
    ristourne: 0,
    totalAvecRistourne: 0,
    lignes: [],
    etat: '',
    documentPath: null,
    date_annulation: null,
    date_paiement: null
  });

  const [isLoading, setIsLoading] = useState(factureId !== null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [clientData, setClientData] = useState(null);
  const [clientLoading, setClientLoading] = useState(false);
  const [isLignesValid, setIsLignesValid] = useState(false);

  // Services
  const factureService = useMemo(() => new FactureService(), []);
  const clientService = useMemo(() => new ClientService(), []);

  // Utilitaires
  const isReadOnly = mode === FORM_MODES.VIEW;
  const isFormValid = mode === FORM_MODES.VIEW ||
    (facture.numeroFacture &&
      facture.clientId &&
      facture.lignes &&
      facture.lignes.length > 0 &&
      isLignesValid);

  // Fonction pour obtenir les données du formulaire
  const getFormData = useCallback(() => {
    return {
      numeroFacture: facture.numeroFacture,
      dateFacture: facture.dateFacture,
      clientId: facture.clientId,
      lignes: facture.lignes,
      ristourne: facture.ristourne,
      totalFacture: facture.totalFacture,
      totalAvecRistourne: facture.totalAvecRistourne
    };
  }, [facture]);

  return {
    // États
    facture,
    setFacture,
    isLoading,
    setIsLoading,
    isSubmitting,
    setIsSubmitting,
    error,
    setError,
    clientData,
    setClientData,
    clientLoading,
    setClientLoading,
    isLignesValid,
    setIsLignesValid,
    
    // Services
    factureService,
    clientService,
    
    // Utilitaires
    isReadOnly,
    isFormValid,
    getFormData
  };
};