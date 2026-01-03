// src/components/clients/hooks/useClientValidation.js
// Hook spécialisé pour la validation des clients
// ✅ REFACTORISÉ: Utilisation de createLogger au lieu de console.log

import { useState, useCallback, useMemo } from 'react';
import { 
  PHONE_TYPES, 
  VALIDATION_MESSAGES, 
  HELP_TEXTS 
} from '../../../constants/clientConstants';
import { 
  validateEmail, 
  validatePhone, 
  validateAllClientFields,
  getFieldHelpText 
} from '../utils/clientValidators';
// ✅ AJOUT: Import de createLogger
import { createLogger } from '../../../utils/createLogger';

/**
 * Hook spécialisé pour la validation des champs client
 * Gère la validation en temps réel et les messages d'aide contextuels
 */
export function useClientValidation(client) {
  // ✅ Initialisation du logger
  const logger = createLogger('useClientValidation');

  // ================================
  // ÉTAT LOCAL
  // ================================
  
  const [fieldErrors, setFieldErrors] = useState({
    email: null,
    telephone: null
  });
  
  const [phoneType, setPhoneType] = useState(null);
  const [fieldWarnings, setFieldWarnings] = useState({});

  // ================================
  // VALIDATION INDIVIDUELLE DES CHAMPS
  // ================================

  const validateEmailField = useCallback((email, required = false) => {
    logger.debug('📧 Validation email:', email);
    const result = validateEmail(email, required);
    
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
      logger.debug('⚠️ Avertissements email:', result.warnings);
    } else {
      setFieldWarnings(prev => {
        const { email, ...rest } = prev;
        return rest;
      });
    }
    
    logger.debug(`✅ Résultat validation email: ${result.isValid ? 'valide' : 'invalide'}`);
    return result;
  }, [logger]);

  const validatePhoneField = useCallback((phone, required = false) => {
    logger.debug('📱 Validation téléphone:', phone);
    const result = validatePhone(phone, required);
    
    setFieldErrors(prev => ({
      ...prev,
      telephone: result.isValid ? null : result.error
    }));
    
    setPhoneType(result.phoneType);
    
    logger.debug(`✅ Résultat validation téléphone: ${result.isValid ? 'valide' : 'invalide'}`, {
      phoneType: result.phoneType
    });
    return result;
  }, [logger]);

  // ================================
  // VALIDATION GLOBALE
  // ================================

  const globalValidation = useMemo(() => {
    return validateAllClientFields(client);
  }, [client]);

  const isFormValid = useMemo(() => {
    const valid = globalValidation.isValid && 
           !fieldErrors.email && 
           !fieldErrors.telephone;
           
    logger.debug('🔍 Calcul isFormValid:', {
      'globalValidation.isValid': globalValidation.isValid,
      'globalValidation.errors': globalValidation.errors,
      'fieldErrors.email': fieldErrors.email,
      'fieldErrors.telephone': fieldErrors.telephone,
      'résultat final': valid
    });
    
    return valid;
  }, [globalValidation.isValid, fieldErrors, logger]);

  // ================================
  // GESTIONNAIRE DE VALIDATION GÉNÉRIQUE
  // ================================

  const validateField = useCallback((fieldName, value, required = false) => {
    logger.debug(`🔄 Validation du champ: ${fieldName}`);
    
    switch (fieldName) {
      case 'email':
        return validateEmailField(value, required);
      case 'telephone':
        return validatePhoneField(value, required);
      default:
        // Pour les autres champs, utiliser la validation globale
        const tempClient = { ...client, [fieldName]: value };
        const result = validateAllClientFields(tempClient);
        return {
          isValid: !result.errors[fieldName],
          error: result.errors[fieldName] || null
        };
    }
  }, [client, validateEmailField, validatePhoneField, logger]);

  // ================================
  // UTILITAIRES POUR L'INTERFACE
  // ================================

  const getHelpTextForField = useCallback((fieldName, fieldValue) => {
    const validationResult = fieldName === 'telephone' ? 
      { phoneType, helpText: getFieldHelpText(fieldName, fieldValue, { phoneType }) } :
      { error: fieldErrors[fieldName] };
      
    return getFieldHelpText(fieldName, fieldValue, validationResult);
  }, [phoneType, fieldErrors]);

  const getFieldStatus = useCallback((fieldName) => {
    const hasError = !!fieldErrors[fieldName];
    const hasWarning = !!(fieldWarnings[fieldName] && fieldWarnings[fieldName].length > 0);
    
    if (hasError) return 'error';
    if (hasWarning) return 'warning';
    return 'valid';
  }, [fieldErrors, fieldWarnings]);

  const getFieldClasses = useCallback((fieldName, baseClass = 'input-group') => {
    const status = getFieldStatus(fieldName);
    const classes = [baseClass];
    
    if (status === 'error') classes.push('has-error');
    if (status === 'warning') classes.push('has-warning');
    if (phoneType && fieldName === 'telephone') classes.push(`phone-type-${phoneType}`);
    
    return classes.join(' ');
  }, [getFieldStatus, phoneType]);

  // ================================
  // RESET ET NETTOYAGE
  // ================================

  const clearFieldError = useCallback((fieldName) => {
    logger.debug(`🧹 Nettoyage erreur du champ: ${fieldName}`);
    setFieldErrors(prev => ({
      ...prev,
      [fieldName]: null
    }));
  }, [logger]);

  const clearAllErrors = useCallback(() => {
    logger.debug('🧹 Nettoyage de toutes les erreurs');
    setFieldErrors({
      email: null,
      telephone: null
    });
    setFieldWarnings({});
    setPhoneType(null);
  }, [logger]);

  // ================================
  // VALIDATION BATCH (pour soumission)
  // ================================

  const validateAllFields = useCallback((requiredFields = null) => {
    logger.info('🔍 Validation de tous les champs', { requiredFields });
    
    // Valider les champs spéciaux
    const emailResult = validateEmailField(client.email, requiredFields?.includes('email'));
    const phoneResult = validatePhoneField(client.telephone, requiredFields?.includes('telephone'));
    
    // Valider tous les autres champs
    const globalResult = validateAllClientFields(client, requiredFields);
    
    const combinedErrors = {
      ...globalResult.errors,
      ...(emailResult.isValid ? {} : { email: emailResult.error }),
      ...(phoneResult.isValid ? {} : { telephone: phoneResult.error })
    };
    
    const isValid = Object.keys(combinedErrors).length === 0;
    
    logger.info(`✅ Validation complète: ${isValid ? 'succès' : 'échec'}`, {
      errorsCount: Object.keys(combinedErrors).length,
      errors: combinedErrors
    });
    
    return {
      isValid,
      errors: combinedErrors,
      warnings: {
        ...globalResult.warnings,
        ...fieldWarnings
      },
      hasErrors: !isValid,
      hasWarnings: Object.keys(fieldWarnings).length > 0
    };
  }, [client, validateEmailField, validatePhoneField, fieldWarnings, logger]);

  // ================================
  // MESSAGES D'AIDE CONTEXTUELS
  // ================================

  const getContextualHelp = useCallback(() => {
    const help = {};
    
    // Aide pour le téléphone selon le type détecté
    if (phoneType === PHONE_TYPES.SWISS) {
      help.telephone = HELP_TEXTS.PHONE_SWISS;
    } else if (phoneType === PHONE_TYPES.FOREIGN) {
      help.telephone = HELP_TEXTS.PHONE_FOREIGN;
    } else if (client.telephone && !fieldErrors.telephone) {
      help.telephone = HELP_TEXTS.PHONE_DEFAULT;
    }
    
    // Aide pour l'email
    if (client.email && !fieldErrors.email) {
      help.email = 'Email valide';
    }
    
    return help;
  }, [phoneType, client.telephone, client.email, fieldErrors]);

  // ================================
  // STATISTIQUES DE VALIDATION
  // ================================

  const getValidationStats = useCallback(() => {
    const allValidation = validateAllFields();
    const totalFields = Object.keys(client).filter(key => 
      ['titre', 'nom', 'prenom', 'rue', 'numero', 'code_postal', 'localite', 'telephone', 'email']
      .includes(key)
    ).length;
    
    const validFields = totalFields - Object.keys(allValidation.errors).length;
    const completionPercentage = totalFields > 0 ? Math.round((validFields / totalFields) * 100) : 0;
    
    logger.debug('📊 Statistiques de validation:', {
      totalFields,
      validFields,
      completionPercentage
    });
    
    return {
      totalFields,
      validFields,
      invalidFields: Object.keys(allValidation.errors).length,
      warningFields: Object.keys(allValidation.warnings).length,
      completionPercentage,
      isComplete: completionPercentage === 100
    };
  }, [client, validateAllFields, logger]);

  // ================================
  // RETOUR DU HOOK
  // ================================

  return {
    // Erreurs et état
    fieldErrors,
    fieldWarnings,
    phoneType,
    isFormValid,
    hasErrors: !isFormValid,
    
    // Validation individuelle
    validateField,
    validateEmailField,
    validatePhoneField,
    validateAllFields,
    
    // Validation globale
    globalValidation,
    
    // Utilitaires d'interface
    getHelpTextForField,
    getFieldStatus,
    getFieldClasses,
    getContextualHelp,
    getValidationStats,
    
    // Nettoyage
    clearFieldError,
    clearAllErrors,
    
    // Constantes pour l'interface
    PHONE_TYPES,
    VALIDATION_MESSAGES,
    HELP_TEXTS
  };
}