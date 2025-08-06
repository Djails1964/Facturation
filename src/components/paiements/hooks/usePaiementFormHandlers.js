import React, { useCallback } from 'react';
import modalSystem from '../../../utils/modalSystem';
import DatePickerModalHandler from '../../shared/modals/handlers/DatePickerModalHandler';
import DateService from '../../../utils/DateService';
import { 
    FORM_MODES, 
    VALIDATION_MESSAGES, 
    NOTIFICATIONS, 
    PAIEMENT_DATE_CONFIG 
} from '../../../constants/paiementConstants';

export const usePaiementFormHandlers = (formState, formLogic, formValidation) => {
    const {
        paiement, setPaiement, setError, isSubmitting, setIsSubmitting,
        isReadOnly, isPaiementAnnule, isCreate, mode, paiementId,
        onRetourListe, onPaiementCreated, paiementService, factureService,
        markAsSaved, resetChanges, getFormData, setInitialFormData,
        unregisterGuard, guardId, setShowGlobalModal, setGlobalNavigationCallback,
        hasUnsavedChanges, canDetectChanges, requestNavigation
    } = formState;

    // DatePicker handler
    const datePickerHandler = new DatePickerModalHandler({
        showCustom: modalSystem.custom.bind(modalSystem),
        showError: modalSystem.error.bind(modalSystem),
        showLoading: modalSystem.showLoading.bind(modalSystem)
    });

    /**
     * Gestionnaire de changement des champs
     */
    const handleInputChange = useCallback((field, value) => {
        if (isReadOnly || isPaiementAnnule) return;
        
        console.log('📝 PaiementForm handleInputChange:', { field, value, mode });
        
        setPaiement(prev => ({
            ...prev,
            [field]: value
        }));
        
        if (field === 'factureId' && value) {
            chargerDetailFacture(value);
        }
    }, [isReadOnly, isPaiementAnnule, mode, setPaiement]);

    /**
     * Charger les détails d'une facture sélectionnée
     */
    const chargerDetailFacture = useCallback(async (factureId) => {
        try {
            const factureData = await factureService.getFacture(factureId);
            formState.setFactureSelectionnee(factureData);
            
            if (factureData && isCreate) {
                const montantRestant = factureData.montantRestant || 
                    (factureData.totalAvecRistourne - (factureData.montantPayeTotal || 0));
                
                if (montantRestant > 0) {
                    setPaiement(prev => ({
                        ...prev,
                        montantPaye: montantRestant.toString()
                    }));
                }
            }
        } catch (error) {
            console.error('Erreur lors du chargement de la facture:', error);
        }
    }, [factureService, formState.setFactureSelectionnee, isCreate, setPaiement]);

    /**
     * Ouvrir la modal de sélection de date
     */
    const handleOpenDateModal = useCallback(async (event) => {
        if (isReadOnly || isPaiementAnnule) return;
        
        console.log('📅 Ouverture modal de sélection de date pour paiement');
        
        try {
            const anchorRef = React.createRef();
            if (event && event.currentTarget) {
                anchorRef.current = event.currentTarget;
            }
            
            let initialDates = [];
            if (paiement.datePaiement) {
                const parsedDate = DateService.fromInputFormat(paiement.datePaiement);
                if (parsedDate) {
                    initialDates = [parsedDate];
                }
            }
            
            const config = {
                initialDates: initialDates,
                multiSelect: false,
                minDate: null,
                maxDate: DateService.getToday(),
                title: PAIEMENT_DATE_CONFIG.TITLE,
                confirmText: PAIEMENT_DATE_CONFIG.CONFIRM_TEXT,
                context: 'payment',
                anchorRef: anchorRef
            };
            
            const result = await datePickerHandler.handle(config, event);
            
            if (result.action === 'confirm' && result.dates.length > 0) {
                const selectedDate = result.dates[0];
                
                if (DateService.isStrictlyFuture(selectedDate)) {
                    await modalSystem.warning(
                        'Les dates futures ne sont pas autorisées pour les paiements.',
                        'Date non valide'
                    );
                    return;
                }
                
                const dateString = DateService.toInputFormat(selectedDate);
                handleInputChange('datePaiement', dateString);
            }
            
        } catch (error) {
            console.error('❌ Erreur lors de la sélection de date:', error);
            await modalSystem.error(`Erreur lors de la sélection de date : ${error.message}`);
        }
    }, [isReadOnly, isPaiementAnnule, paiement.datePaiement, datePickerHandler, handleInputChange]);

    /**
     * Fonction pour gérer une sauvegarde réussie
     */
    const handleSuccessfulSave = useCallback((paiementId, message) => {
        console.log('✅ Sauvegarde réussie PaiementForm - nettoyage des modifications');
        
        markAsSaved();
        resetChanges();
        
        const newFormData = getFormData();
        setInitialFormData(newFormData);

        unregisterGuard(guardId);

        setShowGlobalModal(false);
        setGlobalNavigationCallback(null);

        if (mode === FORM_MODES.CREATE && onPaiementCreated) {
            onPaiementCreated(paiementId, message);
        } else if (onRetourListe) {
            onRetourListe(paiementId, true, message, 'success');
        }
    }, [mode, onPaiementCreated, onRetourListe, markAsSaved, resetChanges, getFormData, guardId, unregisterGuard]);

    /**
     * Soumission du formulaire
     */
    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        
        if (isPaiementAnnule) {
            setError(VALIDATION_MESSAGES.PAIEMENT_ANNULE);
            return;
        }
        
        const validation = formValidation.validateForm();
        if (!validation.isValid) {
            setError(validation.error);
            return;
        }
        
        setIsSubmitting(true);
        setError(null);
        
        try {
            const paiementData = {
                factureId: parseInt(paiement.factureId),
                datePaiement: paiement.datePaiement,
                montantPaye: parseFloat(paiement.montantPaye),
                methodePaiement: paiement.methodePaiement,
                commentaire: paiement.commentaire || null
            };
            
            let result;
            
            if (isCreate) {
                result = await paiementService.createPaiement(paiementData);
                if (result.success) {
                    handleSuccessfulSave(result.id, result.message || NOTIFICATIONS.SUCCESS.CREATE);
                }
            } else if (formState.canEdit) {
                result = await paiementService.updatePaiement(paiementId, paiementData);
                if (result.success) {
                    handleSuccessfulSave(paiementId, result.message || NOTIFICATIONS.SUCCESS.UPDATE);
                }
            }
            
        } catch (error) {
            console.error('Erreur lors de la soumission:', error);
            setError(error.message || (isCreate ? NOTIFICATIONS.ERROR.CREATE : NOTIFICATIONS.ERROR.UPDATE));
        } finally {
            setIsSubmitting(false);
        }
    }, [isPaiementAnnule, formValidation, setError, setIsSubmitting, paiement, isCreate, paiementService, paiementId, handleSuccessfulSave]);

    /**
     * Gestion du retour avec protection
     */
    const handleCancel = useCallback(() => {
        // En mode VIEW, navigation directe sans protection
        if (mode === FORM_MODES.VIEW) {
            unregisterGuard(guardId);
            if (onRetourListe) onRetourListe();
            return;
        }

        // Pour les paiements annulés, navigation directe
        if (isPaiementAnnule) {
            unregisterGuard(guardId);
            if (onRetourListe) onRetourListe();
            return;
        }

        // Vérification directe : si pas de modifications, naviguer directement
        if (!hasUnsavedChanges || !canDetectChanges()) {
            unregisterGuard(guardId);
            if (onRetourListe) onRetourListe();
            return;
        }

        // Pour les modes EDIT et CREATE avec modifications, utiliser la protection
        const canNavigate = requestNavigation(() => {
            unregisterGuard(guardId);
            if (onRetourListe) onRetourListe();
        });

        if (!canNavigate) {
            console.log('🔒 Navigation retour bloquée par des modifications non sauvegardées (PaiementForm)');
        }
    }, [mode, isPaiementAnnule, hasUnsavedChanges, canDetectChanges, requestNavigation, unregisterGuard, guardId, onRetourListe]);

    /**
     * Gérer la confirmation de navigation externe
     */
    const handleConfirmGlobalNavigation = useCallback(() => {
        setShowGlobalModal(false);
        unregisterGuard(guardId);
        
        if (formState.globalNavigationCallback) {
            formState.globalNavigationCallback();
            setGlobalNavigationCallback(null);
        }
    }, [setShowGlobalModal, unregisterGuard, guardId, formState.globalNavigationCallback, setGlobalNavigationCallback]);

    /**
     * Gérer l'annulation de navigation externe
     */
    const handleCancelGlobalNavigation = useCallback(() => {
        setShowGlobalModal(false);
        setGlobalNavigationCallback(null);
    }, [setShowGlobalModal, setGlobalNavigationCallback]);

    return {
        handleInputChange,
        handleOpenDateModal,
        handleSubmit,
        handleCancel,
        handleConfirmGlobalNavigation,
        handleCancelGlobalNavigation,
        chargerDetailFacture
    };
};