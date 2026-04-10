import { useCallback } from 'react';
import { VALIDATION_MESSAGES } from '../../../constants/tarifConstants';

/**
 * Hook pour gérer les handlers du formulaire de tarif spécial
 * ✅ REFACTORISÉ: Utilise tarifActions au lieu de tarificationService
 * ✅ REFACTORISÉ: DateInputField gère la saisie des dates — handleOpenDateModal supprimé
 */
export const useTarifSpecialFormHandlers = (formState, formLogic, formValidation) => {
    const {
        tarifSpecial,
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
            const tarifSpecialData = {
                ...tarifSpecial,
                prix: parseFloat(tarifSpecial.prix),
                note: tarifSpecial.note.trim()
            };
            
            // ✅ REFACTORISÉ: Utilisation de tarifActions (qui gère déjà executeApi en interne)
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