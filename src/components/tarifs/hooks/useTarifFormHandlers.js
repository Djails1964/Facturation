import { useCallback } from 'react';
import { VALIDATION_MESSAGES } from '../../../constants/tarifConstants';

/**
 * Hook pour gérer les handlers du formulaire de tarif
 * ✅ REFACTORISÉ: Utilise tarifActions au lieu de tarificationService
 * ✅ REFACTORISÉ: Navigation via requestNavigation (showConfirm unifié)
 */
export const useTarifFormHandlers = (formState, formLogic, formValidation) => {
    const {
        tarif,
        setError,
        isSubmitting,
        setIsSubmitting,
        hasUnsavedChanges,
        requestNavigation,
        tarifActions,
        isCreate,
        setHasUnsavedChanges
    } = formState;
    
    const { handleInputChange, resetForm } = formLogic;
    const { validateForm } = formValidation;
    
    const handleSubmit = useCallback(async (event) => {
        event.preventDefault();
        
        if (isSubmitting) return;
        
        setIsSubmitting(true);
        setError('');
        
        try {
            const isValid = await validateForm();
            if (!isValid) {
                throw new Error('Veuillez corriger les erreurs dans le formulaire');
            }
            
            const tarifData = {
                ...tarif,
                prix: parseFloat(tarif.prix)
            };
            
            let result;
            if (isCreate) {
                result = await tarifActions.create('tarif', tarifData);
            } else {
                result = await tarifActions.update('tarif', tarif.id, tarifData);
            }
            
            if (result.success) {
                setHasUnsavedChanges(false);
                
                if (isCreate && formState.onTarifCreated) {
                    formState.onTarifCreated(result.tarif);
                } else if (formState.onRetourListe) {
                    formState.onRetourListe();
                }
            } else {
                throw new Error(result.message || 'Erreur lors de la sauvegarde');
            }
            
        } catch (error) {
            console.error('Erreur sauvegarde:', error);
            setError(error.message || 'Erreur lors de la sauvegarde du tarif');
        } finally {
            setIsSubmitting(false);
        }
    }, [tarif, isSubmitting, isCreate, validateForm, tarifActions, setError, setIsSubmitting, setHasUnsavedChanges, formState]);
    
    const handleCancel = useCallback(() => {
        requestNavigation(() => formState.onRetourListe?.());
    }, [requestNavigation, formState.onRetourListe]);
    
    return {
        handleSubmit,
        handleCancel,
        handleInputChange,
        resetForm
    };
};