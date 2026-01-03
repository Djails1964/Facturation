// src/components/shared/hooks/useFormValidation.js
// ✅ Hook personnalisé pour la gestion unifiée de la validation des formulaires

import { useState, useCallback, useMemo } from 'react';
import { validateField, validateForm, createValidationSchema } from '../utils/validationService';

/**
 * Hook pour gérer la validation d'un formulaire de manière unifiée
 * 
 * @param {Object} initialValues - Valeurs initiales du formulaire
 * @param {Object} validationConfig - Configuration de validation (simplifié ou schéma complet)
 * @param {Object} options - Options supplémentaires
 * @returns {Object} - État et fonctions pour gérer le formulaire
 * 
 * @example
 * const { values, errors, handleChange, handleBlur, validate, isValid } = useFormValidation(
 *   { email: '', name: '' },
 *   { 
 *     email: { required: true, email: true },
 *     name: { required: 'Le nom est obligatoire', minLength: [2, 'Min 2 caractères'] }
 *   }
 * );
 */
const useFormValidation = (initialValues = {}, validationConfig = {}, options = {}) => {
    const {
        validateOnChange = false,  // Valider à chaque changement
        validateOnBlur = true,     // Valider au blur (par défaut)
        validateOnSubmit = true,   // Valider à la soumission
    } = options;

    // États
    const [values, setValues] = useState(initialValues);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitCount, setSubmitCount] = useState(0);

    // Créer le schéma de validation à partir de la config
    const validationSchema = useMemo(() => {
        // Si la config contient déjà des fonctions, c'est un schéma complet
        const isFullSchema = Object.values(validationConfig).some(
            v => typeof v === 'function' || (Array.isArray(v) && typeof v[0] === 'function')
        );
        
        return isFullSchema ? validationConfig : createValidationSchema(validationConfig);
    }, [validationConfig]);

    /**
     * Valide un champ spécifique
     */
    const validateSingleField = useCallback((name, value) => {
        const rules = validationSchema[name];
        if (!rules) return null;
        
        return validateField(value, rules, values);
    }, [validationSchema, values]);

    /**
     * Met à jour les erreurs pour un champ
     */
    const setFieldError = useCallback((name, error) => {
        setErrors(prev => {
            if (error) {
                return { ...prev, [name]: error };
            }
            const { [name]: removed, ...rest } = prev;
            return rest;
        });
    }, []);

    /**
     * Gestionnaire de changement de valeur
     */
    const handleChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;
        const newValue = type === 'checkbox' ? checked : value;
        
        setValues(prev => ({ ...prev, [name]: newValue }));
        
        // Valider si l'option est activée
        if (validateOnChange || touched[name]) {
            const error = validateSingleField(name, newValue);
            setFieldError(name, error);
        }
    }, [validateOnChange, touched, validateSingleField, setFieldError]);

    /**
     * Gestionnaire pour mise à jour directe d'une valeur
     */
    const setValue = useCallback((name, value) => {
        setValues(prev => ({ ...prev, [name]: value }));
        
        if (validateOnChange || touched[name]) {
            const error = validateSingleField(name, value);
            setFieldError(name, error);
        }
    }, [validateOnChange, touched, validateSingleField, setFieldError]);

    /**
     * Met à jour plusieurs valeurs d'un coup
     */
    const setMultipleValues = useCallback((newValues) => {
        setValues(prev => ({ ...prev, ...newValues }));
    }, []);

    /**
     * Gestionnaire de blur
     */
    const handleBlur = useCallback((e) => {
        const { name, value } = e.target;
        
        // Marquer comme touché
        setTouched(prev => ({ ...prev, [name]: true }));
        
        // Valider si l'option est activée
        if (validateOnBlur) {
            const error = validateSingleField(name, value);
            setFieldError(name, error);
        }
    }, [validateOnBlur, validateSingleField, setFieldError]);

    /**
     * Valide tout le formulaire
     */
    const validate = useCallback(() => {
        const result = validateForm(values, validationSchema);
        setErrors(result.errors);
        
        // Marquer tous les champs comme touchés
        const allTouched = Object.keys(validationSchema).reduce((acc, key) => {
            acc[key] = true;
            return acc;
        }, {});
        setTouched(allTouched);
        
        return result;
    }, [values, validationSchema]);

    /**
     * Gestionnaire de soumission
     */
    const handleSubmit = useCallback((onSubmit) => async (e) => {
        e?.preventDefault();
        
        setSubmitCount(prev => prev + 1);
        
        if (validateOnSubmit) {
            const result = validate();
            if (!result.isValid) {
                return { success: false, errors: result.errors };
            }
        }
        
        setIsSubmitting(true);
        
        try {
            const result = await onSubmit(values);
            return { success: true, data: result };
        } catch (error) {
            return { success: false, error };
        } finally {
            setIsSubmitting(false);
        }
    }, [validateOnSubmit, validate, values]);

    /**
     * Réinitialise le formulaire
     */
    const reset = useCallback((newValues = initialValues) => {
        setValues(newValues);
        setErrors({});
        setTouched({});
        setIsSubmitting(false);
    }, [initialValues]);

    /**
     * Efface les erreurs
     */
    const clearErrors = useCallback(() => {
        setErrors({});
    }, []);

    /**
     * Efface l'erreur d'un champ spécifique
     */
    const clearFieldError = useCallback((name) => {
        setErrors(prev => {
            const { [name]: removed, ...rest } = prev;
            return rest;
        });
    }, []);

    /**
     * Vérifie si le formulaire est valide (sans erreurs)
     */
    const isValid = useMemo(() => {
        return Object.keys(errors).length === 0;
    }, [errors]);

    /**
     * Vérifie si le formulaire a été modifié
     */
    const isDirty = useMemo(() => {
        return Object.keys(touched).length > 0;
    }, [touched]);

    /**
     * Retourne les props pour un champ de formulaire
     * Utile pour l'intégration avec le composant FormField
     */
    const getFieldProps = useCallback((name) => ({
        name,
        value: values[name] || '',
        onChange: handleChange,
        onBlur: handleBlur,
        error: touched[name] ? errors[name] : undefined,
    }), [values, errors, touched, handleChange, handleBlur]);

    /**
     * Retourne les props étendues pour FormField
     */
    const getFormFieldProps = useCallback((name, additionalProps = {}) => ({
        ...getFieldProps(name),
        ...additionalProps,
    }), [getFieldProps]);

    return {
        // État
        values,
        errors,
        touched,
        isSubmitting,
        isValid,
        isDirty,
        submitCount,
        
        // Setters
        setValues,
        setValue,
        setMultipleValues,
        setErrors,
        setFieldError,
        setTouched,
        
        // Handlers
        handleChange,
        handleBlur,
        handleSubmit,
        
        // Validation
        validate,
        validateSingleField,
        
        // Utils
        reset,
        clearErrors,
        clearFieldError,
        getFieldProps,
        getFormFieldProps,
    };
};

export default useFormValidation;