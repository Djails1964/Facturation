import { useCallback } from 'react';
import { VALIDATION_MESSAGES } from '../../../constants/tarifConstants';

/**
 * Hook pour gérer les handlers du formulaire de tarif
 * ✅ REFACTORISÉ: Utilise tarifActions au lieu de tarificationService
 * ✅ REFACTORISÉ: DateInputField gère la saisie des dates — handleOpenDateModal supprimé
 */
export const useTarifFormHandlers = (formState, formLogic, formValidation) => {
    const {
        tarif,
        setError,
        isSubmitting,
        setIsSubmitting,
        hasUnsavedChanges,
        setShowUnsavedModal,
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
            // Validation
            const isValid = await validateForm();
            if (!isValid) {
                throw new Error('Veuillez corriger les erreurs dans le formulaire');
            }
            
            // Préparation des données
            const tarifData = {
                ...tarif,
                prix: parseFloat(tarif.prix)
            };
            
            // ✅ REFACTORISÉ: Utilisation de tarifActions au lieu de tarificationService
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
        if (hasUnsavedChanges) {
            setShowUnsavedModal(true);
        } else if (formState.onRetourListe) {
            formState.onRetourListe();
        }
    }, [hasUnsavedChanges, setShowUnsavedModal, formState.onRetourListe]);
    
    const handleConfirmGlobalNavigation = useCallback(() => {
        setHasUnsavedChanges(false);
        formState.setShowGlobalModal(false);
        
        if (formState.globalNavigationCallback) {
            formState.globalNavigationCallback();
        }
    }, [setHasUnsavedChanges, formState]);
    
    const handleCancelGlobalNavigation = useCallback(() => {
        formState.setShowGlobalModal(false);
        formState.setGlobalNavigationCallback(null);
    }, [formState]);
    
    return {
        handleSubmit,
        handleCancel,
        handleInputChange,
        handleConfirmGlobalNavigation,
        handleCancelGlobalNavigation,
        resetForm
    };
};