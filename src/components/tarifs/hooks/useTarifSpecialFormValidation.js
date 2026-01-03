import { useState, useCallback } from 'react';

/**
 * Hook pour gérer la validation du formulaire de tarif spécial
 * ✅ REFACTORISÉ: Utilise tarifActions au lieu de tarificationService
 */
export const useTarifSpecialFormValidation = (formState) => {
    const [validationErrors, setValidationErrors] = useState({});
    const [isValidating, setIsValidating] = useState(false);
    
    const { tarifSpecial, tarifActions } = formState; // ✅ MODIFIÉ: tarifActions au lieu de tarificationService
    
    const validateField = useCallback(async (fieldName, value) => {
        setIsValidating(true);
        const errors = {};
        
        try {
            switch (fieldName) {
                case 'idClient':
                    if (!value) {
                        errors[fieldName] = 'Le client est obligatoire';
                    }
                    break;
                    
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
                    if (value && tarifSpecial.date_debut) {
                        const dateDebut = new Date(tarifSpecial.date_debut);
                        const dateFin = new Date(value);
                        
                        if (dateFin <= dateDebut) {
                            errors[fieldName] = 'La date de fin doit être postérieure à la date de début';
                        }
                    }
                    break;
                    
                case 'note':
                    if (!value || value.trim() === '') {
                        errors[fieldName] = 'La note est obligatoire pour les tarifs spéciaux';
                    }
                    break;
                    
                default:
                    if (!value && ['idService', 'idUnite'].includes(fieldName)) {
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
    }, [tarifSpecial]);
    
    const validateForm = useCallback(async () => {
        setIsValidating(true);
        const errors = {};
        
        try {
            // Validation synchrone
            if (!tarifSpecial.idClient) errors.idClient = 'Le client est obligatoire';
            if (!tarifSpecial.idService) errors.idService = 'Le service est obligatoire';
            if (!tarifSpecial.idUnite) errors.idUnite = 'L\'unité est obligatoire';
            if (!tarifSpecial.prix || isNaN(parseFloat(tarifSpecial.prix)) || parseFloat(tarifSpecial.prix) <= 0) {
                errors.prix = 'Le prix doit être un nombre positif';
            }
            if (!tarifSpecial.date_debut) errors.date_debut = 'La date de début est obligatoire';
            if (!tarifSpecial.note || tarifSpecial.note.trim() === '') {
                errors.note = 'La note est obligatoire pour les tarifs spéciaux';
            }
            
            // Validation des dates
            if (tarifSpecial.date_debut && tarifSpecial.date_fin) {
                const dateDebut = new Date(tarifSpecial.date_debut);
                const dateFin = new Date(tarifSpecial.date_fin);
                
                if (dateFin <= dateDebut) {
                    errors.date_fin = 'La date de fin doit être postérieure à la date de début';
                }
            }
            
            // ⚠️ TODO: Validation métier (conflits de tarifs spéciaux)
            // La méthode checkTarifSpecialConflict n'existe pas encore dans TarificationService
            // Elle devrait être ajoutée et exposée via tarifActions
            /*
            if (tarifSpecial.idClient && tarifSpecial.idService && tarifSpecial.idUnite && tarifSpecial.date_debut && tarifActions) {
                try {
                    // ✅ FUTUR: Utiliser tarifActions.checkTarifSpecialConflict une fois implémenté
                    const conflictCheck = await tarifActions.checkTarifSpecialConflict({
                        idClient: tarifSpecial.idClient,
                        idService: tarifSpecial.idService,
                        idUnite: tarifSpecial.idUnite,
                        date_debut: tarifSpecial.date_debut,
                        date_fin: tarifSpecial.date_fin,
                        excludeId: tarifSpecial.id // Pour l'édition
                    });
                    
                    if (!conflictCheck.success) {
                        errors.general = conflictCheck.message || 'Conflit de tarifs spéciaux détecté';
                    }
                } catch (error) {
                    console.warn('Erreur vérification conflit:', error);
                }
            }
            */
            
        } catch (error) {
            console.error('Erreur validation form:', error);
            errors.general = 'Erreur lors de la validation';
        } finally {
            setIsValidating(false);
        }
        
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    }, [tarifSpecial, tarifActions]);
    
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