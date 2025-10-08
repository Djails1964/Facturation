// src/components/clients/hooks/useClientForm.js
import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigationGuard } from '../../../App';
import { useUnsavedChanges } from '../../../hooks/useUnsavedChanges';
import { useAutoNavigationGuard } from '../../../hooks/useAutoNavigationGuard';
import { showConfirm } from '../../../utils/modalSystem';
import { FORM_MODES, VALIDATION_MESSAGES } from '../../../constants/clientConstants';
import ClientService from '../../../services/ClientService';
import { normalizeBooleanFields, toBoolean } from '../../../utils/booleanHelper';

export const useClientForm = (mode, idClient, propClientService = null) => {
  // Navigation protection
  const { unregisterGuard } = useNavigationGuard();
  const guardId = `client-form-${idClient || 'new'}`;

  // Service client
  const clientService = propClientService || ClientService;
  const isReadOnly = mode === FORM_MODES.VIEW;

  // États principaux
  const [client, setClient] = useState({
    titre: '',
    nom: '',
    prenom: '',
    rue: '',
    numero: '',
    code_postal: '',
    localite: '',
    telephone: '',
    email: '',
    estTherapeute: false
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [fieldWarnings, setFieldWarnings] = useState({});
  const [phoneType, setPhoneType] = useState(null);

  // États pour le système de navigation
  const [isFullyInitialized, setIsFullyInitialized] = useState(false);
  const [isInitialLoadDone, setIsInitialLoadDone] = useState(false);
  const [initialFormData, setInitialFormData] = useState({});
  const [showGlobalModal, setShowGlobalModal] = useState(false);
  const [globalNavigationCallback, setGlobalNavigationCallback] = useState(null);

  // Référence pour éviter la double initialisation
  const hasInitialized = useRef(false);

  // Fonction pour obtenir les données du formulaire
  const getFormData = useCallback(() => {
    return {
      titre: client.titre,
      nom: client.nom,
      prenom: client.prenom,
      rue: client.rue,
      numero: client.numero,
      code_postal: client.code_postal,
      localite: client.localite,
      telephone: client.telephone,
      email: client.email,
      estTherapeute: client.estTherapeute
    };
  }, [client]);

  // Fonction pour vérifier si on peut détecter les changements
  const canDetectChanges = useCallback(() => {
    return !isLoading && 
           !isSubmitting && 
           isInitialLoadDone && 
           isFullyInitialized && 
           Object.keys(initialFormData).length > 0 &&
           mode !== FORM_MODES.VIEW;
  }, [isLoading, isSubmitting, isInitialLoadDone, isFullyInitialized, initialFormData, mode]);

  // Données actuelles pour la détection
  const currentFormData = useMemo(() => {
    const data = canDetectChanges() ? getFormData() : {};
    return data;
  }, [canDetectChanges, client]);

  // Hook de détection des modifications
  const {
    hasUnsavedChanges,
    showUnsavedModal,
    markAsSaved,
    confirmNavigation,
    cancelNavigation,
    requestNavigation,
    resetChanges
  } = useUnsavedChanges(
    initialFormData,
    currentFormData,
    isSubmitting,
    false
  );

  // Protection automatique de navigation
  useAutoNavigationGuard(hasUnsavedChanges, {
    isActive: mode !== FORM_MODES.VIEW && isFullyInitialized,
    guardId: guardId,
    debug: false
  });

  // Gestion des événements de navigation globale
  useEffect(() => {
    if (mode === FORM_MODES.VIEW || !hasUnsavedChanges) return;

    const handleNavigationBlocked = async (event) => {
      console.log('🌍 CLIENT FORM - Événement navigation-blocked reçu:', event.detail);
      
      if (event.detail && event.detail.callback) {
        try {
          const result = await showConfirm({
            title: "Modifications non sauvegardées",
            message: "Vous avez des modifications non sauvegardées. Souhaitez-vous vraiment quitter sans sauvegarder ?",
            confirmText: "Quitter sans sauvegarder",
            cancelText: "Continuer l'édition",
            type: 'warning'
          });

          if (result.action === 'confirm') {
            console.log('✅ CLIENT - Navigation confirmée');
            resetChanges();
            unregisterGuard(guardId);
            if (event.detail.callback) {
              event.detail.callback();
            }
          } else {
            console.log('❌ CLIENT - Navigation annulée');
          }
        } catch (error) {
          console.error('Erreur dans la modal de navigation:', error);
        }
      }
    };

    window.addEventListener('navigation-blocked', handleNavigationBlocked);
    
    return () => {
      window.removeEventListener('navigation-blocked', handleNavigationBlocked);
    };
  }, [mode, hasUnsavedChanges, resetChanges, unregisterGuard, guardId]);

  // Fonction pour charger un client
  const chargerClient = async (id) => {
    if (hasInitialized.current) {
      console.log('Client déjà initialisé, skip');
      return;
    }

    try {
      setIsLoading(true);
      hasInitialized.current = true;

      const data = await clientService.getClient(id);
      if (data) {
        const normalizedClient = normalizeBooleanFields(data, ['estTherapeute']);
        setClient(normalizedClient);
        
        // Validation initiale
        validateEmail(normalizedClient.email || '');
        validatePhone(normalizedClient.telephone || '');

        // Sauvegarder les données initiales
        const formData = {
          titre: normalizedClient.titre || '',
          nom: normalizedClient.nom || '',
          prenom: normalizedClient.prenom || '',
          rue: normalizedClient.rue || '',
          numero: normalizedClient.numero || '',
          code_postal: normalizedClient.code_postal || '',
          localite: normalizedClient.localite || '',
          telephone: normalizedClient.telephone || '',
          email: normalizedClient.email || '',
          estTherapeute: normalizedClient.estTherapeute || false
        };

        setInitialFormData(formData);
        setIsInitialLoadDone(true);
        setIsFullyInitialized(true);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du client:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Validation email
  const validateEmail = (email) => {
    if (!email) {
      setFieldErrors(prev => ({ ...prev, email: null }));
      return true;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setFieldErrors(prev => ({ ...prev, email: 'Format d\'email invalide' }));
      return false;
    }

    setFieldErrors(prev => ({ ...prev, email: null }));
    return true;
  };

  // Validation téléphone
  const validatePhone = (phone) => {
    if (!phone) {
      setFieldErrors(prev => ({ ...prev, telephone: null }));
      setPhoneType(null);
      return true;
    }

    const swissRegex = /^(\+41|0041|0)[1-9]\d{8}$/;
    const foreignRegex = /^\+(?!41)\d{1,3}\d{6,14}$/;

    if (swissRegex.test(phone.replace(/\s/g, ''))) {
      setPhoneType('swiss');
      setFieldErrors(prev => ({ ...prev, telephone: null }));
      return true;
    } else if (foreignRegex.test(phone.replace(/\s/g, ''))) {
      setPhoneType('foreign');
      setFieldErrors(prev => ({ ...prev, telephone: null }));
      return true;
    } else {
      setPhoneType(null);
      setFieldErrors(prev => ({ ...prev, telephone: 'Format de téléphone invalide' }));
      return false;
    }
  };

  // Gestionnaire de changement de champ
  const handleChange = useCallback((e) => {
    if (isReadOnly) return;

    const { name, value } = e.target;
    setClient(prev => ({ ...prev, [name]: value }));

    // Validation en temps réel
    if (name === 'email') {
      validateEmail(value);
    } else if (name === 'telephone') {
      validatePhone(value);
    }
  }, [isReadOnly]);

  // Toggle thérapeute
  const toggleTherapeute = useCallback(() => {
    if (isReadOnly) return;
    setClient(prev => ({ ...prev, estTherapeute: !prev.estTherapeute }));
  }, [isReadOnly]);

  // Soumission du formulaire
  const handleSubmit = useCallback(async () => {
    if (isReadOnly || isSubmitting) return { success: false };

    // Validation finale
    const isEmailValid = validateEmail(client.email);
    const isPhoneValid = validatePhone(client.telephone);

    if (!isEmailValid || !isPhoneValid) {
      setError(VALIDATION_MESSAGES.INVALID_FIELDS);
      return { success: false, message: VALIDATION_MESSAGES.INVALID_FIELDS };
    }

    if (!client.nom || !client.prenom) {
      setError(VALIDATION_MESSAGES.REQUIRED_FIELDS);
      return { success: false, message: VALIDATION_MESSAGES.REQUIRED_FIELDS };
    }

    setIsSubmitting(true);
    setError(null);

    try {
      let result;
      if (mode === FORM_MODES.CREATE) {
        result = await clientService.createClient(client);
      } else if (mode === FORM_MODES.EDIT) {
        result = await clientService.updateClient(idClient, client);
      }

      if (result && result.success) {
        markAsSaved();
        return {
          success: true,
          idClient: result.idClient || idClient,
          message: mode === FORM_MODES.CREATE ? 'Client créé avec succès' : 'Client modifié avec succès'
        };
      } else {
        throw new Error(result?.message || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      setError(error.message);
      return { success: false, message: error.message };
    } finally {
      setIsSubmitting(false);
    }
  }, [mode, idClient, client, isReadOnly, isSubmitting, clientService, markAsSaved]);

  // Initialisation
  useEffect(() => {
    if (mode === FORM_MODES.CREATE) {
      setInitialFormData(getFormData());
      setIsInitialLoadDone(true);
      setIsFullyInitialized(true);
    } else if (mode !== FORM_MODES.CREATE && idClient && !hasInitialized.current) {
      chargerClient(idClient);
    }
  }, [mode, idClient]);

  return {
    // États
    client,
    isLoading,
    isSubmitting,
    error,
    fieldErrors,
    fieldWarnings,
    phoneType,
    isReadOnly,
    
    // Navigation
    hasUnsavedChanges,
    showUnsavedModal,
    showGlobalModal,
    globalNavigationCallback,
    guardId,
    isFullyInitialized,
    
    // Fonctions
    handleChange,
    toggleTherapeute,
    handleSubmit,
    setClient,
    setError,
    setFieldErrors,
    setFieldWarnings,
    
    // Navigation functions
    markAsSaved,
    confirmNavigation,
    cancelNavigation,
    requestNavigation,
    resetChanges,
    unregisterGuard,
    
    // Utilitaires
    getFormData,
    canDetectChanges
  };
};