// src/components/factures/hooks/useFactureFormValidation.js
// ✅ Hook de validation unifié pour le formulaire de facture

import { useState, useCallback, useMemo } from 'react';
import { 
    validateFactureForm, 
    validateLigneFacture, 
    validateAllLignes,
    FactureValidationRules 
} from '../utils/factureValidation';

/**
 * Hook personnalisé pour gérer la validation du formulaire de facture
 * Utilise le système de validation unifié
 */
const useFactureFormValidation = (initialErrors = {}) => {
    // État des erreurs
    const [errors, setErrors] = useState(initialErrors);
    const [lignesErrors, setLignesErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [lignesTouched, setLignesTouched] = useState({});

    /**
     * Valide un champ spécifique du formulaire principal
     */
    const validateField = useCallback((fieldName, value, facture = {}) => {
        let error = null;
        
        switch (fieldName) {
            case 'numeroFacture':
                if (!value) {
                    error = 'Le numéro de facture est requis';
                }
                break;
                
            case 'idClient':
                error = FactureValidationRules.clientRequired(value);
                break;
                
            case 'dateFacture':
                error = FactureValidationRules.dateFactureValid(value);
                break;
                
            case 'ristourne':
                error = FactureValidationRules.ristourneValid(value, facture.totalFacture || 0);
                break;
                
            default:
                break;
        }
        
        return error;
    }, []);

    /**
     * Met à jour l'erreur d'un champ
     */
    const setFieldError = useCallback((fieldName, error) => {
        setErrors(prev => {
            if (error) {
                return { ...prev, [fieldName]: error };
            }
            const { [fieldName]: removed, ...rest } = prev;
            return rest;
        });
    }, []);

    /**
     * Marque un champ comme touché et le valide
     */
    const touchField = useCallback((fieldName, value, facture = {}) => {
        setTouched(prev => ({ ...prev, [fieldName]: true }));
        
        const error = validateField(fieldName, value, facture);
        setFieldError(fieldName, error);
        
        return error;
    }, [validateField, setFieldError]);

    /**
     * Valide un champ de ligne de facture
     */
    const validateLigneField = useCallback((index, fieldName, value, ligne = {}) => {
        let error = null;
        
        switch (fieldName) {
            case 'serviceType':
            case 'service':
                if (!value && !ligne.service && !ligne.idService) {
                    error = 'Le service est requis';
                }
                break;
                
            case 'unite':
                if (!value && !ligne.unite && !ligne.idUnite && !ligne.uniteCode) {
                    error = 'L\'unité est requise';
                }
                break;
                
            case 'description':
                if (!value?.trim()) {
                    error = 'La description est requise';
                } else if (value.trim().length < 3) {
                    error = 'Minimum 3 caractères';
                }
                break;
                
            case 'quantite':
                const quantite = parseFloat(value);
                if (isNaN(quantite) || quantite <= 0) {
                    error = 'La quantité doit être supérieure à 0';
                }
                break;
                
            case 'prixUnitaire':
                const prix = parseFloat(value);
                if (isNaN(prix) || prix <= 0) {
                    error = 'Le prix doit être supérieur à 0';
                }
                break;
                
            default:
                break;
        }
        
        return error;
    }, []);

    /**
     * Met à jour l'erreur d'un champ de ligne
     */
    const setLigneFieldError = useCallback((index, fieldName, error) => {
        setLignesErrors(prev => {
            const ligneErrors = { ...(prev[index] || {}) };
            
            if (error) {
                ligneErrors[fieldName] = error;
            } else {
                delete ligneErrors[fieldName];
            }
            
            if (Object.keys(ligneErrors).length === 0) {
                const { [index]: removed, ...rest } = prev;
                return rest;
            }
            
            return { ...prev, [index]: ligneErrors };
        });
    }, []);

    /**
     * Marque un champ de ligne comme touché et le valide
     */
    const touchLigneField = useCallback((index, fieldName, value, ligne = {}) => {
        setLignesTouched(prev => ({
            ...prev,
            [index]: { ...(prev[index] || {}), [fieldName]: true }
        }));
        
        const error = validateLigneField(index, fieldName, value, ligne);
        setLigneFieldError(index, fieldName, error);
        
        return error;
    }, [validateLigneField, setLigneFieldError]);

    /**
     * Valide une ligne complète
     */
    const validateLigne = useCallback((ligne, index) => {
        const result = validateLigneFacture(ligne, index);
        
        if (!result.isValid) {
            setLignesErrors(prev => ({
                ...prev,
                [index]: result.errors
            }));
        } else {
            setLignesErrors(prev => {
                const { [index]: removed, ...rest } = prev;
                return rest;
            });
        }
        
        return result;
    }, []);

    /**
     * Valide toutes les lignes
     */
    const validateAllLines = useCallback((lignes) => {
        const result = validateAllLignes(lignes);
        setLignesErrors(result.errors);
        return result;
    }, []);

    /**
     * Valide le formulaire complet
     */
    const validateForm = useCallback((facture, isLignesValid = true) => {
        const result = validateFactureForm(facture, isLignesValid);
        setErrors(result.errors);
        
        // Marquer tous les champs comme touchés
        setTouched({
            numeroFacture: true,
            idClient: true,
            dateFacture: true
        });
        
        return result;
    }, []);

    /**
     * Réinitialise toutes les erreurs
     */
    const clearErrors = useCallback(() => {
        setErrors({});
        setLignesErrors({});
        setTouched({});
        setLignesTouched({});
    }, []);

    /**
     * Réinitialise les erreurs d'une ligne spécifique
     */
    const clearLigneErrors = useCallback((index) => {
        setLignesErrors(prev => {
            const { [index]: removed, ...rest } = prev;
            return rest;
        });
        setLignesTouched(prev => {
            const { [index]: removed, ...rest } = prev;
            return rest;
        });
    }, []);

    /**
     * Vérifie si le formulaire a des erreurs
     */
    const hasErrors = useMemo(() => {
        return Object.keys(errors).length > 0 || Object.keys(lignesErrors).length > 0;
    }, [errors, lignesErrors]);

    /**
     * Vérifie si une ligne spécifique a des erreurs
     */
    const ligneHasErrors = useCallback((index) => {
        return lignesErrors[index] && Object.keys(lignesErrors[index]).length > 0;
    }, [lignesErrors]);

    /**
     * Obtient l'erreur d'un champ (seulement si touché)
     */
    const getFieldError = useCallback((fieldName) => {
        return touched[fieldName] ? errors[fieldName] : undefined;
    }, [errors, touched]);

    /**
     * Obtient l'erreur d'un champ de ligne (seulement si touché)
     */
    const getLigneFieldError = useCallback((index, fieldName) => {
        const isTouched = lignesTouched[index]?.[fieldName];
        return isTouched ? lignesErrors[index]?.[fieldName] : undefined;
    }, [lignesErrors, lignesTouched]);

    /**
     * Génère la classe CSS d'erreur pour un champ de ligne
     */
    const getErrorClass = useCallback((index, fieldName) => {
        const hasError = lignesErrors[index]?.[fieldName];
        return hasError ? 'fdf_error-validation' : '';
    }, [lignesErrors]);

    return {
        // État
        errors,
        lignesErrors,
        touched,
        lignesTouched,
        hasErrors,
        
        // Validation des champs principaux
        validateField,
        setFieldError,
        touchField,
        getFieldError,
        
        // Validation des lignes
        validateLigneField,
        setLigneFieldError,
        touchLigneField,
        validateLigne,
        validateAllLines,
        getLigneFieldError,
        ligneHasErrors,
        getErrorClass,
        
        // Validation complète
        validateForm,
        
        // Utilitaires
        clearErrors,
        clearLigneErrors,
        setErrors,
        setLignesErrors
    };
};

export default useFactureFormValidation;