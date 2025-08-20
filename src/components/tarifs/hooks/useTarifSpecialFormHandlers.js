import { useCallback } from 'react';
import { useDateContext } from '../../../context/DateContext';
import { formatDateToYYYYMMDD } from '../../../utils/formatters';

export const useTarifSpecialFormHandlers = (formState, formLogic, formValidation) => {
    const {
        tarifSpecial,
        setError,
        isSubmitting,
        setIsSubmitting,
        hasUnsavedChanges,
        setShowUnsavedModal,
        tarificationService,
        isCreate,
        setHasUnsavedChanges
    } = formState;
    
    const { handleInputChange, resetForm } = formLogic;
    const { validateForm } = formValidation;
    const { openDatePicker } = useDateContext();
    
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
            
            // Sauvegarde
            let result;
            if (isCreate) {
                result = await tarificationService.createTarifSpecial(tarifSpecialData);
            } else {
                result = await tarificationService.updateTarifSpecial(tarifSpecial.id, tarifSpecialData);
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
    }, [tarifSpecial, isSubmitting, isCreate, validateForm, tarificationService, setError, setIsSubmitting, setHasUnsavedChanges]);
    
    const handleCancel = useCallback(() => {
        if (hasUnsavedChanges) {
            setShowUnsavedModal(true);
        } else if (formState.onRetourListe) {
            formState.onRetourListe();
        }
    }, [hasUnsavedChanges, setShowUnsavedModal, formState.onRetourListe]);
    
    const handleOpenDateModal = useCallback((dateType) => {
        const currentValue = tarifSpecial[dateType];
        let initialDate = null;
        
        if (currentValue) {
            try {
                initialDate = new Date(currentValue);
            } catch (error) {
                console.warn('Date invalide:', currentValue);
            }
        }
        
        const config = {
            title: dateType === 'date_debut' ? 'Sélectionner la date de début' : 'Sélectionner la date de fin',
            multiSelect: false,
            confirmText: 'Confirmer la date',
            context: 'default'
        };
        
        const callback = (dates) => {
            if (dates && dates.length > 0) {
                const selectedDate = dates[0];
                const formattedDate = formatDateToYYYYMMDD(selectedDate);
                
                const syntheticEvent = {
                    target: {
                        name: dateType,
                        value: formattedDate
                    }
                };
                
                handleInputChange(syntheticEvent);
            }
        };
        
        openDatePicker(config, callback, initialDate ? [initialDate] : []);
    }, [tarifSpecial, openDatePicker, handleInputChange]);
    
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
        handleOpenDateModal,
        handleConfirmGlobalNavigation,
        handleCancelGlobalNavigation,
        resetForm
    };
};