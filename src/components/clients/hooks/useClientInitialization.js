// src/components/clients/hooks/useClientInitialization.js
// Hook spécialisé pour l'initialisation et le chargement des données client

import { useState, useEffect, useCallback } from 'react';
import { FORM_MODES } from '../../../constants/clientConstants';
import { getDefaultClient, getFormData } from '../utils/clientHelpers';
import { normalizeBooleanFields } from '../../../utils/booleanHelper';

/**
 * Hook pour l'initialisation et le chargement des données client
 * Gère le cycle de vie complet du chargement et de l'initialisation
 */
export function useClientInitialization(mode, clientId, dependencies = {}) {
  const {
    setClient,
    setIsLoading,
    clientService,
    validation
  } = dependencies;

  // ================================
  // ÉTAT LOCAL
  // ================================
  
  const [isInitialLoadDone, setIsInitialLoadDone] = useState(false);
  const [isFullyInitialized, setIsFullyInitialized] = useState(false);
  const [initialFormData, setInitialFormData] = useState({});
  const [loadingError, setLoadingError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  // ================================
  // CHARGEMENT D'UN CLIENT EXISTANT
  // ================================

  const chargerClient = useCallback(async (id, options = {}) => {
    const { silent = false, retry = false } = options;
    
    try {
      if (!silent) setIsLoading?.(true);
      setLoadingError(null);
      
      console.log('🔄 Chargement du client:', id);
      
      // Appel API
      const data = await clientService.getClient(id);
      
      if (!data) {
        throw new Error('Client introuvable');
      }
      
      // Normalisation des données
      const normalizedClient = normalizeBooleanFields(data, ['estTherapeute']);
      
      // Mise à jour de l'état
      setClient?.(normalizedClient);
      
      // Validation initiale des champs spéciaux
      if (validation) {
        validation.validateField?.('email', normalizedClient.email || '');
        validation.validateField?.('telephone', normalizedClient.telephone || '');
      }
      
      console.log('✅ Client chargé avec succès:', {
        id: normalizedClient.id,
        nom: `${normalizedClient.prenom} ${normalizedClient.nom}`,
        estTherapeute: normalizedClient.estTherapeute
      });
      
      // Reset du compteur de retry en cas de succès
      if (retry && retryCount > 0) {
        setRetryCount(0);
      }
      
      return normalizedClient;
      
    } catch (error) {
      console.error('❌ Erreur lors du chargement du client:', error);
      setLoadingError(error.message || 'Erreur lors du chargement du client');
      
      // En cas d'erreur, retourner un client par défaut pour éviter les crashes
      const defaultClient = getDefaultClient();
      if (setClient) setClient(defaultClient);
      
      throw error;
    } finally {
      if (!silent) setIsLoading?.(false);
    }
  }, [clientService, setClient, setIsLoading, validation, retryCount]);

  // ================================
  // INITIALISATION POUR CRÉATION
  // ================================

  const initializerForCreation = useCallback(() => {
    console.log('✨ Initialisation pour création d\'un nouveau client');
    
    const defaultClient = getDefaultClient();
    
    // Mise à jour de l'état
    setClient?.(defaultClient);
    setLoadingError(null);
    setIsLoading?.(false);
    
    // Reset des validations
    if (validation) {
      validation.clearAllErrors?.();
    }
    
    return defaultClient;
  }, [setClient, setIsLoading, validation]);

  // ================================
  // RETRY ET RÉCUPÉRATION D'ERREUR
  // ================================

  const retryLoad = useCallback(async () => {
    if (!clientId || mode === FORM_MODES.CREATE) return;
    
    const newRetryCount = retryCount + 1;
    setRetryCount(newRetryCount);
    
    console.log(`🔄 Tentative de rechargement #${newRetryCount} pour le client:`, clientId);
    
    try {
      await chargerClient(clientId, { retry: true });
    } catch (error) {
      console.error(`❌ Échec de la tentative #${newRetryCount}:`, error);
      
      // Après 3 échecs, proposer une action alternative
      if (newRetryCount >= 3) {
        setLoadingError(
          'Impossible de charger le client après plusieurs tentatives. ' +
          'Veuillez vérifier votre connexion ou contacter le support.'
        );
      }
    }
  }, [clientId, mode, retryCount, chargerClient]);

  // ================================
  // RÉINITIALISATION
  // ================================

  const reinitialize = useCallback(async (newMode = null, newClientId = null) => {
    console.log('🔄 Réinitialisation du hook:', { newMode, newClientId });
    
    // Reset de l'état
    setIsInitialLoadDone(false);
    setIsFullyInitialized(false);
    setInitialFormData({});
    setLoadingError(null);
    setRetryCount(0);
    
    const targetMode = newMode || mode;
    const targetClientId = newClientId || clientId;
    
    // Chargement selon le mode
    if (targetClientId && (targetMode === FORM_MODES.VIEW || targetMode === FORM_MODES.EDIT)) {
      await chargerClient(targetClientId);
    } else if (targetMode === FORM_MODES.CREATE) {
      initializerForCreation();
    }
    
    setIsInitialLoadDone(true);
  }, [mode, clientId, chargerClient, initializerForCreation]);

  // ================================
  // FINALISATION DE L'INITIALISATION
  // ================================

  const finalizeInitialization = useCallback((client) => {
    const currentData = getFormData(client);
    
    // Vérifier que nous avons des données valides
    const hasValidData = mode === FORM_MODES.CREATE ? 
      true : (currentData && Object.keys(currentData).some(key => currentData[key]));

    if (hasValidData) {
      setInitialFormData(currentData);
      setIsFullyInitialized(true);
      
      console.log('🎯 Initialisation finalisée pour la détection de modifications:', {
        mode,
        hasData: Object.keys(currentData).length > 0,
        clientId: client.id || 'nouveau'
      });
      
      return true;
    }
    
    return false;
  }, [mode]);

  // ================================
  // EFFET PRINCIPAL D'INITIALISATION
  // ================================

  useEffect(() => {
    const initializeData = async () => {
      console.log('🚀 Début d\'initialisation:', { mode, clientId });
      
      try {
        if (clientId && (mode === FORM_MODES.VIEW || mode === FORM_MODES.EDIT)) {
          await chargerClient(clientId);
        } else if (mode === FORM_MODES.CREATE) {
          initializerForCreation();
        }
      } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
      } finally {
        setIsInitialLoadDone(true);
      }
    };

    // Ne pas réinitialiser si déjà fait pour les mêmes paramètres
    if (!isInitialLoadDone) {
      initializeData();
    }
  }, [clientId, mode, chargerClient, initializerForCreation, isInitialLoadDone]);

  // ================================
  // UTILITAIRES DE STATUS
  // ================================

  const getInitializationStatus = useCallback(() => {
    return {
      isInitialLoadDone,
      isFullyInitialized,
      hasError: !!loadingError,
      error: loadingError,
      retryCount,
      canRetry: retryCount < 3 && !!loadingError && mode !== FORM_MODES.CREATE,
      mode,
      clientId: clientId || 'nouveau'
    };
  }, [
    isInitialLoadDone, isFullyInitialized, loadingError, 
    retryCount, mode, clientId
  ]);

  const isReady = useCallback(() => {
    return isInitialLoadDone && !loadingError;
  }, [isInitialLoadDone, loadingError]);

  // ================================
  // RETOUR DU HOOK
  // ================================

  return {
    // État d'initialisation
    isInitialLoadDone,
    isFullyInitialized,
    initialFormData,
    loadingError,
    retryCount,
    
    // Fonctions de chargement
    chargerClient,
    retryLoad,
    reinitialize,
    finalizeInitialization,
    
    // Utilitaires
    getInitializationStatus,
    isReady: isReady(),
    
    // Actions
    clearError: () => setLoadingError(null),
    
    // Pour debug
    _internal: {
      mode,
      clientId,
      hasValidationHook: !!validation
    }
  };
}