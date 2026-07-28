import { useCallback } from 'react';
import { VALIDATION_MESSAGES } from '../../../constants/tarifConstants';

/**
 * Hook pour gérer les handlers du formulaire de tarif spécial
 * ✅ REFACTORISÉ: Utilise tarifActions au lieu de tarificationService
 * ✅ REFACTORISÉ: Navigation via requestNavigation (showConfirm unifié)
 */
export const useTarifSpecialFormHandlers = (formState, formLogic, formValidation) => {
    const {
        tarifSpecial,
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
            
            const tarifSpecialData = {
                ...tarifSpecial,
                prix: parseFloat(tarifSpecial.prix),
                note: tarifSpecial.note.trim()
            };
            
            let result;
            if (isCreate) {
                result = await tarifActions.create('tarifSpecial', tarifSpecialData);
            } else {
                result = await tarifActions.update('tarifSpecial', tarifSpecial.id, tarifSpecialData);
            }
            
            if (result.success) {
                setHasUnsavedChanges(false);
                
                if (isCreate && formState.onTarifSpecialCreated) {
                    formState.onTarifSpecialCreated(result.tarifSpecial);
                } else if (formState.onRetourListe) {
                    formState.onRetourListe();
                }
            } else {
                throw new Error(result.message || 'Erreur lors de la sauvegarde');
            }
            
        } catch (error) {
            console.error('Erreur sauvegarde:', error);
            setError(error.message || 'Erreur lors de la sauvegarde du tarif spécial');
        } finally {
            setIsSubmitting(false);
        }
    }, [tarifSpecial, isSubmitting, isCreate, validateForm, tarifActions, setError, setIsSubmitting, setHasUnsavedChanges, formState]);
    
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