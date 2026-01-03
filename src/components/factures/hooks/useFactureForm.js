// src/components/factures/hooks/useFactureForm.js
// ✅ VERSION REFACTORISÉE - Ne crée plus de services en interne
// ✅ Les appels API passent par useFactureActions et useTarifActions

import { useState, useCallback } from 'react';
import { FORM_MODES } from '../../../constants/factureConstants';

/**
 * Hook principal pour la gestion de l'état du formulaire de facture
 * ✅ REFACTORISÉ: Ne crée plus de services en interne
 * ✅ Les composants utilisent useFactureFormActions pour les opérations API
 * 
 * @param {string} mode - Mode du formulaire (VIEW, CREATE, EDIT)
 * @param {string|number} idFacture - ID de la facture (null pour création)
 * @returns {Object} État et fonctions du formulaire
 */
export const useFactureForm = (mode, idFacture) => {
  // États principaux
  const [facture, setFacture] = useState({
    idFacture: '',
    numeroFacture: '',
    dateFacture: '',
    idClient: null,
    montantTotal: 0,
    ristourne: 0,
    totalAvecRistourne: 0,
    lignes: [],
    etat: '',
    documentPath: null,
    date_annulation: null,
    date_paiement: null
  });

  const [isLoading, setIsLoading] = useState(idFacture !== null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [clientData, setClientData] = useState(null);
  const [clientLoading, setClientLoading] = useState(false);
  const [isLignesValid, setIsLignesValid] = useState(false);

  // Utilitaires
  const isReadOnly = mode === FORM_MODES.VIEW;
  const isFormValid = mode === FORM_MODES.VIEW ||
    (facture.numeroFacture &&
      facture.idClient &&
      facture.lignes &&
      facture.lignes.length > 0 &&
      isLignesValid);

  // Fonction pour obtenir les données du formulaire avec mémorisation
  const getFormData = useCallback(() => {
    return {
      numeroFacture: facture.numeroFacture,
      dateFacture: facture.dateFacture,
      idClient: facture.idClient,
      lignes: facture.lignes,
      ristourne: facture.ristourne,
      montantTotal: facture.montantTotal,
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
    
    // ✅ Plus de services retournés - utiliser useFactureFormActions
    
    // Utilitaires
    isReadOnly,
    isFormValid,
    getFormData
  };
};

export default useFactureForm;