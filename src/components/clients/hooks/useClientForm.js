// src/components/clients/hooks/useClientForm.js
import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigationGuard } from '../../../App';
import { useUnsavedChanges } from '../../../hooks/useUnsavedChanges';
import { useAutoNavigationGuard } from '../../../hooks/useAutoNavigationGuard';
import { showConfirm } from '../../../utils/modalSystem';
import { FORM_MODES, VALIDATION_MESSAGES } from '../../../constants/clientConstants';
// ✅ Import de useClientActions pour les opérations CRUD uniquement
import { useClientActions } from './useClientActions';
// ✅ NOUVEAU: Import des fonctions de validation depuis clientValidators
import { 
  validateEmail, 
  validatePhone, 
  PHONE_TYPES 
} from '../utils/clientValidators';
// ✅ Import de createLogger
import { createLogger } from '../../../utils/createLogger';
import { normalizeBooleanFields, toBoolean } from '../../../utils/booleanHelper';

export const useClientForm = (mode, idClient) => {
  // ✅ Initialisation du logger
  const logger = createLogger('useClientForm');
  
  // Navigation protection
  const { unregisterGuard } = useNavigationGuard();
  const guardId = `client-form-${idClient || 'new'}`;

  // ✅ Utilisation de useClientActions UNIQUEMENT pour les opérations CRUD
  // ❌ SUPPRIMÉ: isValidEmail, detectPhoneType - maintenant depuis clientValidators
  const {
    getClient,
    createClient,
    updateClient,
    normalizeClient,
    isLoading: actionIsLoading,
    error: actionError
  } = useClientActions();

  const isReadOnly = mode === FORM_MODES.VIEW;

  // États principaux
  const [client, setClient] = useState({
    titre: '',
    nom: '',
    prenom: '',
    rue: '',
    numero: '',
    codePostal: '',
    localite: '',
    telephone: '',
    email: '',
    estTherapeute: false,
  });

  // ✅ États locaux pour le chargement initial et les erreurs de validation
  const [localIsLoading, setLocalIsLoading] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  // ================================
  // FONCTIONS UTILITAIRES
  // ================================

  // Fonction pour obtenir les données du formulaire
  const getFormData = useCallback(() => {
    return {
      titre: client.titre,
      nom: client.nom,
      prenom: client.prenom,
      rue: client.rue,
      numero: client.numero,
      codePostal: client.codePostal,
      localite: client.localite,
      telephone: client.telephone,
      email: client.email,
      estTherapeute: client.estTherapeute,
    };
  }, [client]);

  // Fonction pour vérifier si on peut détecter les changements
  const canDetectChanges = useCallback(() => {
    return !localIsLoading && 
           !actionIsLoading &&  // ✅ Vérifier aussi le loading des actions
           !isSubmitting && 
           isInitialLoadDone && 
           isFullyInitialized && 
           Object.keys(initialFormData).length > 0 &&
           mode !== FORM_MODES.VIEW;
  }, [localIsLoading, actionIsLoading, isSubmitting, isInitialLoadDone, isFullyInitialized, initialFormData, mode]);

  // Données actuelles pour la détection
  const currentFormData = useMemo(() => {
    const data = canDetectChanges() ? getFormData() : {};
    return data;
  }, [canDetectChanges, client]);

  // ================================
  // SYSTÈME DE DÉTECTION DES MODIFICATIONS
  // ================================

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
      logger.debug('🌐 CLIENT FORM - Événement navigation-blocked reçu:', event.detail);
      
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
            logger.debug('✅ CLIENT - Navigation confirmée');
            resetChanges();
            unregisterGuard(guardId);
            if (event.detail.callback) {
              event.detail.callback();
            }
          } else {
            logger.debug('❌ CLIENT - Navigation annulée');
          }
        } catch (err) {
          logger.error('Erreur dans la modal de navigation:', err);
        }
      }
    };

    window.addEventListener('navigation-blocked', handleNavigationBlocked);
    
    return () => {
      window.removeEventListener('navigation-blocked', handleNavigationBlocked);
    };
  }, [mode, hasUnsavedChanges, resetChanges, unregisterGuard, guardId]);

  // ================================
  // ✅ VALIDATION AVEC clientValidators
  // ================================

  /**
   * Valide l'email en utilisant clientValidators
   * @param {string} email - Email à valider
   * @returns {boolean} - true si valide
   */
  const validateEmailField = useCallback((email) => {
    if (!email) {
      setFieldErrors(prev => ({ ...prev, email: null }));
      return true;
    }

    const result = validateEmail(email);
    
    setFieldErrors(prev => ({
      ...prev,
      email: result.isValid ? null : result.error
    }));
    
    // Gérer les avertissements
    if (result.warnings && result.warnings.length > 0) {
      setFieldWarnings(prev => ({
        ...prev,
        email: result.warnings
      }));
    } else {
      setFieldWarnings(prev => {
        const { email: _, ...rest } = prev;
        return rest;
      });
    }
    
    return result.isValid;
  }, []);

  /**
   * Valide le téléphone en utilisant clientValidators
   * @param {string} phone - Téléphone à valider
   * @returns {boolean} - true si valide
   */
  const validatePhoneField = useCallback((phone) => {
    if (!phone) {
      setFieldErrors(prev => ({ ...prev, telephone: null }));
      setPhoneType(null);
      return true;
    }

    const result = validatePhone(phone);
    
    setFieldErrors(prev => ({
      ...prev,
      telephone: result.isValid ? null : result.error
    }));
    
    // Mettre à jour le type de téléphone
    setPhoneType(result.phoneType || null);
    
    return result.isValid;
  }, []);

  // ================================
  // CHARGEMENT DU CLIENT
  // ================================

  const chargerClient = async (idClient) => {
    if (hasInitialized.current) {
      logger.debug('Client déjà initialisé, skip');
      return;
    }

    try {
      setLocalIsLoading(true);
      setLocalError(null);
      hasInitialized.current = true;

      // ✅ Utiliser getClient de useClientActions
      const data = await getClient(idClient);

      if (data) {
        // ✅ Utiliser normalizeClient du hook
        const normalizedClient = normalizeClient(data);
        setClient(normalizedClient);
        
        // ✅ Validation initiale avec clientValidators
        validateEmailField(normalizedClient.email || '');
        validatePhoneField(normalizedClient.telephone || '');

        // Sauvegarder les données initiales
        const formData = {
          titre: normalizedClient.titre || '',
          nom: normalizedClient.nom || '',
          prenom: normalizedClient.prenom || '',
          rue: normalizedClient.rue || '',
          numero: normalizedClient.numero || '',
          codePostal: normalizedClient.codePostal || '',
          localite: normalizedClient.localite || '',
          telephone: normalizedClient.telephone || '',
          email: normalizedClient.email || '',
          estTherapeute: normalizedClient.estTherapeute || false,
            };

        setInitialFormData(formData);
        setIsInitialLoadDone(true);
        setIsFullyInitialized(true);
      }
    } catch (err) {
      logger.error('Erreur lors du chargement du client:', err);
      setLocalError(err.message || 'Erreur lors du chargement du client');
    } finally {
      setLocalIsLoading(false);
    }
  };

  // ================================
  // GESTIONNAIRES DE CHANGEMENT
  // ================================

  // Gestionnaire de changement de champ
  const handleChange = useCallback((e) => {
    if (isReadOnly) return;

    const { name, value } = e.target;
    setClient(prev => ({ ...prev, [name]: value }));

    // ✅ Validation en temps réel avec clientValidators
    if (name === 'email') {
      validateEmailField(value);
    } else if (name === 'telephone') {
      validatePhoneField(value);
    }
  }, [isReadOnly, validateEmailField, validatePhoneField]);

  // Toggle thérapeute
  const toggleTherapeute = useCallback(() => {
    if (isReadOnly) return;
    setClient(prev => ({ ...prev, estTherapeute: !prev.estTherapeute }));
  }, [isReadOnly]);

  // ================================
  // SOUMISSION DU FORMULAIRE
  // ================================

  const handleSubmit = useCallback(async () => {
    if (isReadOnly || isSubmitting) return { success: false };

    // ✅ Validation finale avec clientValidators
    const isEmailValid = validateEmailField(client.email);
    const isPhoneValid = validatePhoneField(client.telephone);

    if (!isEmailValid || !isPhoneValid) {
      setLocalError(VALIDATION_MESSAGES.INVALID_FIELDS);
      return { success: false, message: VALIDATION_MESSAGES.INVALID_FIELDS };
    }

    if (!client.nom || !client.prenom) {
      setLocalError(VALIDATION_MESSAGES.REQUIRED_FIELDS);
      return { success: false, message: VALIDATION_MESSAGES.REQUIRED_FIELDS };
    }

    setIsSubmitting(true);
    setLocalError(null);

    try {
      let result;
      if (mode === FORM_MODES.CREATE) {
        result = await createClient(client);
      } else if (mode === FORM_MODES.EDIT) {
        result = await updateClient(idClient, client);
      }

      if (result && result.success) {
        markAsSaved();
        return {
          success: true,
          idClient: result.idClient || result.id || idClient,
          message: mode === FORM_MODES.CREATE ? 'Client créé avec succès' : 'Client modifié avec succès'
        };
      } else {
        throw new Error(result?.message || 'Erreur lors de la sauvegarde');
      }
    } catch (err) {
      logger.error('Erreur lors de la soumission:', err);
      setLocalError(err.message);
      return { success: false, message: err.message };
    } finally {
      setIsSubmitting(false);
    }
  }, [mode, idClient, client, isReadOnly, isSubmitting, createClient, updateClient, markAsSaved, validateEmailField, validatePhoneField]);

  // ================================
  // INITIALISATION
  // ================================

  useEffect(() => {
    if (mode === FORM_MODES.CREATE) {
      setInitialFormData(getFormData());
      setIsInitialLoadDone(true);
      setIsFullyInitialized(true);
    } else if (mode !== FORM_MODES.CREATE && idClient && !hasInitialized.current) {
      chargerClient(idClient);
    }
  }, [mode, idClient]);

  // ================================
  // RETOUR DU HOOK
  // ================================

  return {
    // États - Combiner les états locaux et ceux de useClientActions
    client,
    isLoading: localIsLoading || actionIsLoading,
    isSubmitting,
    error: localError || actionError?.message,
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
    setError: setLocalError,
    setFieldErrors,
    setFieldWarnings,
    
    // ✅ Fonctions de validation exposées
    validateEmailField,
    validatePhoneField,
    
    // Navigation functions
    markAsSaved,
    confirmNavigation,
    cancelNavigation,
    requestNavigation,
    resetChanges,
    unregisterGuard,
    
    // Utilitaires
    getFormData,
    canDetectChanges,
    
    // ✅ Constantes pour l'interface
    PHONE_TYPES
  };
};