// src/components/clients/hooks/useClientForm.js
// Hook principal pour la gestion du formulaire client
// ✅ CORRECTIF FINAL : Gestion unifiée du guard global et local

import { useState, useCallback, useMemo, useEffect } from 'react';
import { FORM_MODES } from '../../../constants/clientConstants';
import { normalizeBooleanFields, toBoolean } from '../../../utils/booleanHelper';
import { getDefaultClient, getFormData, normalizeClientForAPI } from '../utils/clientHelpers';
import { validateAllClientFields } from '../utils/clientValidators';
import { useUnsavedChanges } from '../../../hooks/useUnsavedChanges';
import { useNavigationGuard } from '../../../App';
import ClientService from '../../../services/ClientService';

/**
 * Hook principal pour la gestion du formulaire client
 * ✅ CORRECTIF FINAL : Guard global qui utilise les gestionnaires de useClientNavigation
 */
export function useClientForm(mode, clientId, clientService = ClientService) {
  // ================================
  // ÉTAT LOCAL
  // ================================
  
  const [client, setClient] = useState(getDefaultClient());
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  // États pour la détection des modifications
  const [isInitialLoadDone, setIsInitialLoadDone] = useState(false);
  const [isFullyInitialized, setIsFullyInitialized] = useState(false);
  const [initialFormData, setInitialFormData] = useState({});

  // États de validation
  const [fieldErrors, setFieldErrors] = useState({
    email: null,
    telephone: null
  });
  const [phoneType, setPhoneType] = useState(null);

  // ✅ NOUVEAU : État pour gestionnaires globaux (fourni par useClientNavigation)
  const [globalNavigationHandlers, setGlobalNavigationHandlers] = useState({
    setShowGlobalModal: null,
    setGlobalNavigationCallback: null
  });

  // ================================
  // NAVIGATION GUARD UNIFIÉ
  // ================================
  
  const { registerGuard, unregisterGuard } = useNavigationGuard();
  const guardId = `client-form-${client.id || 'new'}`;

  // ================================
  // PROPRIÉTÉS DÉRIVÉES
  // ================================
  
  const isReadOnly = mode === FORM_MODES.VIEW;
  
  // Données actuelles du formulaire pour détection de modifications
  const currentFormData = useMemo(() => {
    return getFormData(client);
  }, [client]);

  // Validation globale du formulaire
  const validationResult = useMemo(() => {
    return validateAllClientFields(client);
  }, [client]);

  const isFormValid = validationResult.isValid && !fieldErrors.email && !fieldErrors.telephone;
  const hasErrors = !isFormValid;

  // ✅ DEBUG temporaire pour diagnostiquer le problème de validation
  console.log('🔍 DEBUG validation détaillée:', {
    'validationResult': validationResult,
    'validationResult.isValid': validationResult.isValid,
    'validationResult.errors': validationResult.errors,
    'fieldErrors': fieldErrors,
    'client data': client,
    'mode': mode,
    'isFormValid final': isFormValid
  });

  // Fonction pour vérifier si on peut détecter les modifications
  const canDetectChanges = useCallback(() => {
    return !isLoading && 
           !isSubmitting && 
           isInitialLoadDone && 
           isFullyInitialized && 
           Object.keys(initialFormData).length > 0 &&
           mode !== FORM_MODES.VIEW;
  }, [isLoading, isSubmitting, isInitialLoadDone, isFullyInitialized, initialFormData, mode]);

  // ================================
  // ✅ HOOK UNIFIÉ POUR DÉTECTION DES MODIFICATIONS
  // ================================

  const unsavedChangesHook = useUnsavedChanges(
    initialFormData,
    currentFormData,
    isSubmitting,
    false // pas de debug par défaut
  );

  const {
    hasUnsavedChanges,
    showUnsavedModal,
    markAsSaved,
    confirmNavigation,
    cancelNavigation,
    requestNavigation,
    resetChanges
  } = unsavedChangesHook;

  // ================================
  // ✅ ENREGISTREMENT DU GUARD UNIFIÉ (Version compatible système global)
  // ================================

  useEffect(() => {
    if (mode !== FORM_MODES.VIEW && isFullyInitialized) {
      console.log('🛡️ CLIENT FORM - Enregistrement du guard unifié:', guardId);
      
      // ✅ CORRECTIF FINAL : Utiliser la signature compatible avec le système global
      const guardFunction = async () => {
        console.log('🔍 CLIENT FORM - Guard appelé:', { guardId, hasUnsavedChanges });
        
        // Retourner true si des modifications non sauvegardées existent (bloquer la navigation)
        return hasUnsavedChanges;
      };
      
      registerGuard(guardId, guardFunction);
      
      return () => {
        console.log('🗑️ CLIENT FORM - Désenregistrement du guard unifié:', guardId);
        unregisterGuard(guardId);
      };
    }
  }, [mode, isFullyInitialized, guardId, registerGuard, unregisterGuard, hasUnsavedChanges]);

  // ✅ GESTION DES ÉVÉNEMENTS DE NAVIGATION GLOBALE (comme PaiementForm)
  useEffect(() => {
    if (mode !== FORM_MODES.VIEW && hasUnsavedChanges) {
      const handleGlobalNavigation = (event) => {
        console.log('🌐 CLIENT FORM - Événement navigation-blocked reçu:', event.detail);
        
        if (event.detail && event.detail.source && event.detail.callback) {
          console.log('🔗 CLIENT FORM - Stockage du callback de navigation globale');
          
          // Utiliser les gestionnaires de useClientNavigation
          if (globalNavigationHandlers.setShowGlobalModal && globalNavigationHandlers.setGlobalNavigationCallback) {
            globalNavigationHandlers.setGlobalNavigationCallback(() => event.detail.callback);
            globalNavigationHandlers.setShowGlobalModal(true);
          }
        }
      };

      window.addEventListener('navigation-blocked', handleGlobalNavigation);
      return () => window.removeEventListener('navigation-blocked', handleGlobalNavigation);
    }
  }, [mode, hasUnsavedChanges, globalNavigationHandlers]);

  // ================================
  // FONCTIONS DE VALIDATION
  // ================================

  const validateField = useCallback((fieldName, value) => {
    const { validateEmail, validatePhone } = require('../utils/clientValidators');
    
    switch (fieldName) {
      case 'email':
        const emailResult = validateEmail(value);
        setFieldErrors(prev => ({
          ...prev,
          email: emailResult.isValid ? null : emailResult.error
        }));
        return emailResult.isValid;
        
      case 'telephone':
        const phoneResult = validatePhone(value);
        setFieldErrors(prev => ({
          ...prev,
          telephone: phoneResult.isValid ? null : phoneResult.error
        }));
        if (phoneResult.isValid && phoneResult.type) {
          setPhoneType(phoneResult.type);
        }
        return phoneResult.isValid;
        
      default:
        return true;
    }
  }, []);

  // ================================
  // GESTIONNAIRES D'ÉVÉNEMENTS
  // ================================

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    
    setClient(prev => ({
      ...prev,
      [name]: fieldValue
    }));
    
    // Validation en temps réel
    validateField(name, fieldValue);
  }, [validateField]);

  const toggleTherapeute = useCallback(() => {
    setClient(prev => ({
      ...prev,
      estTherapeute: !toBoolean(prev.estTherapeute)
    }));
  }, []);

  // ================================
  // CHARGEMENT ET PERSISTANCE
  // ================================

  const chargerClient = useCallback(async (id) => {
    try {
      setIsLoading(true);
      console.log('📄 Chargement du client:', id);
      
      const data = await clientService.getClient(id);
      if (data) {
        const normalizedClient = normalizeBooleanFields(data, ['estTherapeute']);
        setClient(normalizedClient);
        
        // Validation initiale
        validateField('email', normalizedClient.email || '');
        validateField('telephone', normalizedClient.telephone || '');
        
        console.log('✅ Client chargé:', normalizedClient);
      } else {
        throw new Error('Client introuvable');
      }
    } catch (err) {
      console.error('❌ Erreur lors du chargement du client:', err);
      setError(`Erreur lors du chargement du client: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [clientService, validateField]);

  // ================================
  // SOUMISSION DU FORMULAIRE
  // ================================

  const handleSubmit = useCallback(async (e) => {
    if (e) e.preventDefault();
    
    if (isSubmitting || !isFormValid) {
      console.warn('⚠️ Soumission bloquée:', { isSubmitting, isFormValid });
      return null;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      
      console.log('📤 Soumission du formulaire client:', mode);
      
      // Normaliser les données pour l'API
      const clientData = normalizeClientForAPI(client);
      
      let result;
      
      if (mode === FORM_MODES.CREATE) {
        console.log('➕ Création du client:', clientData);
        result = await clientService.createClient(clientData);
      } else if (mode === FORM_MODES.EDIT) {
        console.log('✏️ Modification du client:', clientData);
        result = await clientService.updateClient(client.id, clientData);
      }

      if (result) {
        console.log('✅ Client sauvegardé avec succès:', result);
        
        // ✅ Mettre à jour les données initiales via le système unifié
        const newFormData = getFormData(client);
        setInitialFormData(newFormData);
        markAsSaved();
        
        return result;
      } else {
        throw new Error('Aucune réponse du serveur');
      }
      
    } catch (err) {
      console.error('❌ Erreur lors de la soumission:', err);
      setError(`Erreur lors de la sauvegarde: ${err.message}`);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [client, mode, isSubmitting, isFormValid, clientService, markAsSaved]);

  // ================================
  // INITIALISATION
  // ================================

  // Chargement initial des données
  useEffect(() => {
    const loadData = async () => {
      if (clientId && (mode === FORM_MODES.VIEW || mode === FORM_MODES.EDIT)) {
        await chargerClient(clientId);
      } else if (mode === FORM_MODES.CREATE) {
        const defaultClient = getDefaultClient();
        setClient(defaultClient);
        setFieldErrors({ email: null, telephone: null });
        setPhoneType(null);
        setIsLoading(false);
      }
      
      setIsInitialLoadDone(true);
    };

    loadData();
  }, [clientId, mode, chargerClient]);

  // Finalisation de l'initialisation pour la détection de modifications
  useEffect(() => {
    if (isInitialLoadDone && !isLoading && !isFullyInitialized) {
      const timer = setTimeout(() => {
        const currentData = getFormData(client);
        
        // Vérifier que nous avons des données valides
        const hasValidData = mode === FORM_MODES.CREATE ?
          true : (currentData && Object.keys(currentData).some(key => currentData[key]));

        if (hasValidData) {
          setInitialFormData(currentData);
          setIsFullyInitialized(true);
          
          console.log('🔧 Initialisation terminée pour la détection de modifications:', {
            mode,
            hasData: Object.keys(currentData).length > 0,
            initialData: currentData
          });
        }
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [isInitialLoadDone, isLoading, isFullyInitialized, mode, client]);

  // ================================
  // FONCTIONS UTILITAIRES
  // ================================

  const resetForm = useCallback(() => {
    const defaultClient = getDefaultClient();
    setClient(defaultClient);
    setFieldErrors({ email: null, telephone: null });
    setPhoneType(null);
    setError(null);
    setInitialFormData(getFormData(defaultClient));
  }, []);

  // ✅ NOUVEAU : Méthode pour enregistrer les gestionnaires globaux
  const setGlobalHandlers = useCallback((handlers) => {
    setGlobalNavigationHandlers(handlers);
  }, []);

  // ================================
  // RETOUR DU HOOK
  // ================================

  return {
    // État principal
    client,
    setClient,
    isLoading,
    isSubmitting,
    error,
    
    // Validation
    fieldErrors,
    phoneType,
    isFormValid,
    hasErrors,
    validationResult,
    validateField,
    
    // Gestionnaires
    handleChange,
    toggleTherapeute,
    handleSubmit,
    
    // Gestion des données
    chargerClient,
    resetForm,
    
    // Propriétés dérivées
    isReadOnly,
    currentFormData,
    initialFormData,
    
    // État d'initialisation
    isInitialLoadDone,
    isFullyInitialized,
    canDetectChanges: canDetectChanges(),
    
    // ✅ DONNÉES UNIFIÉES de useUnsavedChanges (pour useClientNavigation)
    hasUnsavedChanges,
    showUnsavedModal,
    markAsSaved,
    confirmNavigation,
    cancelNavigation,
    requestNavigation,
    resetChanges,
    
    // ✅ NOUVEAU : Méthode pour connecter avec useClientNavigation
    setGlobalHandlers,
    
    // Utilitaires
    clientService,
    guardId
  };
}