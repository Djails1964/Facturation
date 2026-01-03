// src/components/clients/hooks/useClientInitialization.js
// Hook spécialisé pour l'initialisation et le chargement des données client
// ✅ REFACTORISÉ: Utilisation de useClientActions et createLogger

import { useState, useEffect, useCallback } from 'react';
import { FORM_MODES } from '../../../constants/clientConstants';
import { getDefaultClient, getFormData } from '../utils/clientHelpers';
import { normalizeBooleanFields } from '../../../utils/booleanHelper';
// ✅ AJOUT: Import de createLogger
import { createLogger } from '../../../utils/createLogger';
// ✅ AJOUT: Import de useClientActions
import { useClientActions } from './useClientActions';

/**
 * Hook pour l'initialisation et le chargement des données client
 * Gère le cycle de vie complet du chargement et de l'initialisation
 * 
 * ✅ Utilise useClientActions pour les appels API
 * ✅ Utilise createLogger pour le logging
 */
export function useClientInitialization(mode, idClient, dependencies = {}) {
  const {
    setClient,
    setIsLoading,
    validation
  } = dependencies;

  // ✅ Initialisation du logger
  const logger = createLogger('useClientInitialization');

  // ✅ Utilisation de useClientActions pour les opérations API
  const {
    getClient,
    normalizeClient,
    isLoading: actionIsLoading,
    error: actionError
  } = useClientActions();

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
      
      logger.info('🔄 Chargement du client:', id);
      
      // ✅ Appel API via useClientActions
      // getClient retourne directement le client (pas un objet wrappé {success, client})
      const clientData = await getClient(id);
      
      // ✅ Vérification que le client existe
      if (!clientData) {
        throw new Error('Client introuvable');
      }
      
      // ✅ Normalisation des données via useClientActions
      const normalizedClient = normalizeClient(clientData);
      
      // Mise à jour de l'état
      setClient?.(normalizedClient);
      
      // Validation initiale des champs spéciaux
      if (validation) {
        validation.validateField?.('email', normalizedClient.email || '');
        validation.validateField?.('telephone', normalizedClient.telephone || '');
      }
      
      logger.info('✅ Client chargé avec succès:', {
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
      logger.error('❌ Erreur lors du chargement du client:', error);
      setLoadingError(error.message || 'Erreur lors du chargement du client');
      
      // En cas d'erreur, retourner un client par défaut pour éviter les crashes
      const defaultClient = getDefaultClient();
      if (setClient) setClient(defaultClient);
      
      throw error;
    } finally {
      if (!silent) setIsLoading?.(false);
    }
  }, [getClient, normalizeClient, setClient, setIsLoading, validation, retryCount, logger]);

  // ================================
  // INITIALISATION POUR CRÉATION
  // ================================

  const initializerForCreation = useCallback(() => {
    logger.info('✨ Initialisation pour création d\'un nouveau client');
    
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
  }, [setClient, setIsLoading, validation, logger]);

  // ================================
  // RETRY ET RÉCUPÉRATION D'ERREUR
  // ================================

  const retryLoad = useCallback(async () => {
    if (!idClient || mode === FORM_MODES.CREATE) return;
    
    const newRetryCount = retryCount + 1;
    setRetryCount(newRetryCount);
    
    logger.info(`🔄 Tentative de rechargement #${newRetryCount} pour le client:`, idClient);
    
    try {
      await chargerClient(idClient, { retry: true });
    } catch (error) {
      logger.error(`❌ Échec de la tentative #${newRetryCount}:`, error);
      
      // Après 3 échecs, proposer une action alternative
      if (newRetryCount >= 3) {
        setLoadingError(
          'Impossible de charger le client après plusieurs tentatives. ' +
          'Veuillez vérifier votre connexion ou contacter le support.'
        );
      }
    }
  }, [idClient, mode, retryCount, chargerClient, logger]);

  // ================================
  // RÉINITIALISATION
  // ================================

  const reinitialize = useCallback(async () => {
    logger.info('🔄 Réinitialisation complète');
    
    setIsInitialLoadDone(false);
    setIsFullyInitialized(false);
    setInitialFormData({});
    setLoadingError(null);
    setRetryCount(0);
    
    if (mode === FORM_MODES.CREATE) {
      return initializerForCreation();
    } else if (idClient) {
      return chargerClient(idClient);
    }
  }, [mode, idClient, initializerForCreation, chargerClient, logger]);

  // ================================
  // FINALISATION DE L'INITIALISATION
  // ================================

  const finalizeInitialization = useCallback((client) => {
    const currentData = client ? getFormData(client) : {};
    
    // Vérifier que les données sont valides
    const hasValidData = mode === FORM_MODES.CREATE ? 
      true : (currentData && Object.keys(currentData).some(key => currentData[key]));

    if (hasValidData) {
      setInitialFormData(currentData);
      setIsFullyInitialized(true);
      
      logger.info('🎯 Initialisation finalisée pour la détection de modifications:', {
        mode,
        hasData: Object.keys(currentData).length > 0,
        idClient: client?.id || 'nouveau'
      });
      
      return true;
    }
    
    return false;
  }, [mode, logger]);

  // ================================
  // EFFET PRINCIPAL D'INITIALISATION
  // ================================

  useEffect(() => {
    const initializeData = async () => {
      logger.info('🚀 Début d\'initialisation:', { mode, idClient });
      
      try {
        if (idClient && (mode === FORM_MODES.VIEW || mode === FORM_MODES.EDIT)) {
          await chargerClient(idClient);
        } else if (mode === FORM_MODES.CREATE) {
          initializerForCreation();
        }
      } catch (error) {
        logger.error('❌ Erreur lors de l\'initialisation:', error);
      } finally {
        setIsInitialLoadDone(true);
      }
    };

    // Ne pas réinitialiser si déjà fait pour les mêmes paramètres
    if (!isInitialLoadDone) {
      initializeData();
    }
  }, [idClient, mode, chargerClient, initializerForCreation, isInitialLoadDone, logger]);

  // ================================
  // UTILITAIRES DE STATUS
  // ================================

  const getInitializationStatus = useCallback(() => {
    return {
      isInitialLoadDone,
      isFullyInitialized,
      hasError: !!loadingError || !!actionError,
      error: loadingError || actionError?.message,
      retryCount,
      canRetry: retryCount < 3 && !!(loadingError || actionError) && mode !== FORM_MODES.CREATE,
      mode,
      idClient: idClient || 'nouveau'
    };
  }, [
    isInitialLoadDone, isFullyInitialized, loadingError, actionError,
    retryCount, mode, idClient
  ]);

  const isReady = useCallback(() => {
    return isInitialLoadDone && !loadingError && !actionError;
  }, [isInitialLoadDone, loadingError, actionError]);

  // ================================
  // RETOUR DU HOOK
  // ================================

  return {
    // État d'initialisation
    isInitialLoadDone,
    isFullyInitialized,
    initialFormData,
    loadingError: loadingError || actionError?.message,
    retryCount,
    
    // État de chargement depuis useClientActions
    isLoading: actionIsLoading,
    
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
      idClient,
      hasValidationHook: !!validation
    }
  };
}