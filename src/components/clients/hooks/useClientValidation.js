// src/components/clients/hooks/useClientValidation.js
// Hook spécialisé pour la validation des clients

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

/**
 * Hook spécialisé pour la validation des champs client
 * Gère la validation en temps réel et les messages d'aide contextuels
 */
export function useClientValidation(client) {
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
    } else {
      setFieldWarnings(prev => {
        const { email, ...rest } = prev;
        return rest;
      });
    }
    
    return result;
  }, []);

  const validatePhoneField = useCallback((phone, required = false) => {
    const result = validatePhone(phone, required);
    
    setFieldErrors(prev => ({
      ...prev,
      telephone: result.isValid ? null : result.error
    }));
    
    setPhoneType(result.phoneType);
    
    return result;
  }, []);

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
           
    // Debug pour voir pourquoi le formulaire n'est pas valide
    console.log('🔍 Calcul isFormValid:', {
      'globalValidation.isValid': globalValidation.isValid,
      'globalValidation.errors': globalValidation.errors,
      'fieldErrors.email': fieldErrors.email,
      'fieldErrors.telephone': fieldErrors.telephone,
      'résultat final': valid
    });
    
    return valid;
  }, [globalValidation.isValid, fieldErrors]);

  // ================================
  // GESTIONNAIRE DE VALIDATION GÉNÉRIQUE
  // ================================

  const validateField = useCallback((fieldName, value, required = false) => {
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
  }, [client, validateEmailField, validatePhoneField]);

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
    setFieldErrors(prev => ({
      ...prev,
      [fieldName]: null
    }));
  }, []);

  const clearAllErrors = useCallback(() => {
    setFieldErrors({
      email: null,
      telephone: null
    });
    setFieldWarnings({});
    setPhoneType(null);
  }, []);

  // ================================
  // VALIDATION BATCH (pour soumission)
  // ================================

  const validateAllFields = useCallback((requiredFields = null) => {
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
  }, [client, validateEmailField, validatePhoneField, fieldWarnings]);

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
    
    return {
      totalFields,
      validFields,
      invalidFields: Object.keys(allValidation.errors).length,
      warningFields: Object.keys(allValidation.warnings).length,
      completionPercentage,
      isComplete: completionPercentage === 100
    };
  }, [client, validateAllFields]);

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