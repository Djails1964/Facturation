import { useState, useCallback } from 'react';

export const useTarifFormValidation = (formState) => {
    const [validationErrors, setValidationErrors] = useState({});
    const [isValidating, setIsValidating] = useState(false);
    
    const { tarif, tarificationService } = formState;
    
    const validateField = useCallback(async (fieldName, value) => {
        setIsValidating(true);
        const errors = {};
        
        try {
            switch (fieldName) {
                case 'prix':
                    if (!value || isNaN(parseFloat(value)) || parseFloat(value) <= 0) {
                        errors[fieldName] = 'Le prix doit être un nombre positif';
                    }
                    break;
                    
                case 'date_debut':
                    if (!value) {
                        errors[fieldName] = 'La date de début est obligatoire';
                    }
                    break;
                    
                case 'date_fin':
                    if (value && tarif.date_debut) {
                        const dateDebut = new Date(tarif.date_debut);
                        const dateFin = new Date(value);
                        
                        if (dateFin <= dateDebut) {
                            errors[fieldName] = 'La date de fin doit être postérieure à la date de début';
                        }
                    }
                    break;
                    
                default:
                    if (!value && ['serviceId', 'uniteId', 'typeTarifId'].includes(fieldName)) {
                        errors[fieldName] = 'Ce champ est obligatoire';
                    }
                    break;
            }
        } catch (error) {
            console.error('Erreur validation:', error);
        } finally {
            setIsValidating(false);
        }
        
        setValidationErrors(prev => ({
            ...prev,
            ...errors,
            ...(errors[fieldName] === undefined && { [fieldName]: undefined })
        }));
        
        return Object.keys(errors).length === 0;
    }, [tarif, tarificationService]);
    
    const validateForm = useCallback(async () => {
        setIsValidating(true);
        const errors = {};
        
        try {
            // Validation synchrone
            if (!tarif.serviceId) errors.serviceId = 'Le service est obligatoire';
            if (!tarif.uniteId) errors.uniteId = 'L\'unité est obligatoire';
            if (!tarif.typeTarifId) errors.typeTarifId = 'Le type de tarif est obligatoire';
            if (!tarif.prix || isNaN(parseFloat(tarif.prix)) || parseFloat(tarif.prix) <= 0) {
                errors.prix = 'Le prix doit être un nombre positif';
            }
            if (!tarif.date_debut) errors.date_debut = 'La date de début est obligatoire';
            
            // Validation des dates
            if (tarif.date_debut && tarif.date_fin) {
                const dateDebut = new Date(tarif.date_debut);
                const dateFin = new Date(tarif.date_fin);
                
                if (dateFin <= dateDebut) {
                    errors.date_fin = 'La date de fin doit être postérieure à la date de début';
                }
            }
            
            // Validation métier (conflits de tarifs)
            if (tarif.serviceId && tarif.uniteId && tarif.typeTarifId && tarif.date_debut) {
                try {
                    const conflictCheck = await tarificationService.checkTarifConflict({
                        serviceId: tarif.serviceId,
                        uniteId: tarif.uniteId,
                        typeTarifId: tarif.typeTarifId,
                        date_debut: tarif.date_debut,
                        date_fin: tarif.date_fin,
                        excludeId: tarif.id // Pour l'édition
                    });
                    
                    if (!conflictCheck.success) {
                        errors.general = conflictCheck.message || 'Conflit de tarifs détecté';
                    }
                } catch (error) {
                    console.warn('Erreur vérification conflit:', error);
                }
            }
            
        } catch (error) {
            console.error('Erreur validation form:', error);
            errors.general = 'Erreur lors de la validation';
        } finally {
            setIsValidating(false);
        }
        
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    }, [tarif, tarificationService]);
    
    const clearValidationErrors = useCallback(() => {
        setValidationErrors({});
    }, []);
    
    const hasValidationErrors = Object.keys(validationErrors).length > 0;
    
    return {
        validationErrors,
        isValidating,
        validateField,
        validateForm,
        clearValidationErrors,
        hasValidationErrors
    };
};