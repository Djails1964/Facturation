// src/hooks/paiement/usePaiementFormHandlers.js
// 🔧 CORRECTION: Ajout de la fonction handleCancel manquante

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
        isReadOnly, isPaiementAnnule, isCreate, mode, idPaiement,
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
     * Charger les détails d'une facture sélectionnée
     */
    const chargerDetailFacture = useCallback(async (idFacture) => {
        try {
            console.log('🔍 usePaiementFormHandlers - chargerDetailFacture - idFacture:', idFacture);
            
            const factureData = await factureService.getFacture(idFacture);
            console.log('✅ usePaiementFormHandlers - factureData reçue:', factureData);
            
            // Mettre à jour factureSelectionnee dans le state
            formState.setFactureSelectionnee(factureData);
            
            // En mode création, initialiser automatiquement le montant
            if (factureData && isCreate) {
                const montantRestant = factureData.montantRestant || 
                    (factureData.totalAvecRistourne - (factureData.montantPayeTotal || 0));
                
                console.log('💰 Montant restant calculé:', montantRestant);
                
                if (montantRestant > 0) {
                    console.log('✅ Mise à jour du montant payé:', montantRestant.toFixed(2));
                    setPaiement(prev => ({
                        ...prev,
                        montantPaye: montantRestant.toFixed(2)
                    }));
                }
            }
        } catch (error) {
            console.error('❌ Erreur lors du chargement de la facture:', error);
            setError('Impossible de charger les détails de la facture');
        }
    }, [factureService, formState, isCreate, setPaiement, setError]);

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
        
        // ✅ Charger les détails de la facture quand elle est sélectionnée
        if (field === 'idFacture' && value) {
            chargerDetailFacture(value);
        }
    }, [isReadOnly, isPaiementAnnule, mode, setPaiement, chargerDetailFacture]);

    /**
     * Gestionnaire d'ouverture du DatePicker
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
    const handleSuccessfulSave = useCallback((idPaiement, message) => {
        console.log('✅ Sauvegarde réussie PaiementForm - nettoyage des modifications');
        
        markAsSaved();
        resetChanges();
        
        const newFormData = getFormData();
        setInitialFormData(newFormData);

        if (guardId) {
            unregisterGuard(guardId);
        }
        setShowGlobalModal(false);
        setGlobalNavigationCallback(null);

        if (mode === FORM_MODES.CREATE && onPaiementCreated) {
            console.log('📤 Mode CREATE - Appel onPaiementCreated');
            onPaiementCreated(idPaiement, message);
        } else if (mode === FORM_MODES.EDIT && onRetourListe) {
            console.log('📝 Mode EDIT - Retour à la liste avec message de succès');
            onRetourListe(idPaiement, true, message, 'success');
        }
    }, [mode, onPaiementCreated, onRetourListe, markAsSaved, resetChanges, getFormData, 
        setInitialFormData, unregisterGuard, guardId, setShowGlobalModal, 
        setGlobalNavigationCallback]);

    /**
     * Gestionnaire de soumission du formulaire
     */
    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        
        if (isReadOnly || isPaiementAnnule || isSubmitting) return;
        
        console.log('📋 Soumission formulaire paiement:', { mode, paiement });
        setError(null);
        
        // Validation
        const dateValidation = formValidation.validateDatePaiement(paiement.datePaiement);
        if (!dateValidation.isValid) {
            setError(dateValidation.error);
            modalSystem.error(dateValidation.error);
            return;
        }
        
        const montantValidation = formValidation.validateMontant(paiement.montantPaye);
        if (!montantValidation.isValid) {
            setError(montantValidation.error);
            modalSystem.error(montantValidation.error);
            return;
        }
        
        const methodeValidation = formValidation.validateMethodePaiement(paiement.methodePaiement);
        if (!methodeValidation.isValid) {
            setError(methodeValidation.error);
            modalSystem.error(methodeValidation.error);
            return;
        }
        
        try {
            setIsSubmitting(true);
            
            const paiementData = {
                idFacture: paiement.idFacture,
                datePaiement: paiement.datePaiement,
                montantPaye: parseFloat(paiement.montantPaye),
                methodePaiement: paiement.methodePaiement,
                commentaire: paiement.commentaire || ''
            };
            
            console.log('🚀 Envoi des données:', paiementData);
            
            let result;
            if (mode === FORM_MODES.CREATE) {
                result = await paiementService.createPaiement(paiementData);
                if (result.success) {
                    handleSuccessfulSave(result.idPaiement, NOTIFICATIONS.CREATE_SUCCESS);
                }
            } else if (mode === FORM_MODES.EDIT) {
                result = await paiementService.updatePaiement(idPaiement, paiementData);
                if (result.success) {
                    handleSuccessfulSave(idPaiement, NOTIFICATIONS.UPDATE_SUCCESS);
                }
            }
            
            if (!result.success) {
                throw new Error(result.message || 'Erreur lors de la sauvegarde');
            }
            
        } catch (err) {
            console.error('❌ Erreur sauvegarde paiement:', err);
            const errorMessage = err.message || 'Une erreur est survenue';
            setError(errorMessage);
            modalSystem.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    }, [paiement, mode, idPaiement, isReadOnly, isPaiementAnnule, isSubmitting,
        formValidation, paiementService, setError, setIsSubmitting, handleSuccessfulSave]);

    /**
     * Gestionnaire d'annulation de paiement
     */
    const handleAnnuler = useCallback(async () => {
        if (isPaiementAnnule) return;
        
        const confirmed = await modalSystem.confirm(
            'Êtes-vous sûr de vouloir annuler ce paiement ?',
            'Confirmer l\'annulation'
        );
        
        if (!confirmed) return;
        
        try {
            setIsSubmitting(true);
            const result = await paiementService.annulerPaiement(idPaiement);
            
            if (result.success) {
                modalSystem.success(NOTIFICATIONS.CANCEL_SUCCESS);
                if (onRetourListe) {
                    onRetourListe();
                }
            } else {
                throw new Error(result.message || 'Erreur lors de l\'annulation');
            }
        } catch (err) {
            console.error('❌ Erreur annulation paiement:', err);
            modalSystem.error(err.message || 'Une erreur est survenue');
        } finally {
            setIsSubmitting(false);
        }
    }, [idPaiement, isPaiementAnnule, paiementService, onRetourListe, setIsSubmitting]);

    /**
     * 🔧 NOUVEAU: Gestionnaire du bouton Cancel/Retour
     * Cette fonction est utilisée par PaiementFormActions
     */
    const handleCancel = useCallback(() => {
        console.log('🔙 PaiementForm.handleCancel appelé:', { 
            mode, 
            isPaiementAnnule,
            hasUnsavedChanges,
            guardId
        });
        
        // ✅ MODE VIEW: Navigation directe sans vérification
        if (mode === FORM_MODES.VIEW) {
            console.log('✅ Mode VIEW - Retour direct à la liste');
            if (onRetourListe) {
                onRetourListe();
            }
            return;
        }

        // Paiement annulé: navigation directe
        if (isPaiementAnnule) {
            console.log('✅ Paiement annulé - navigation directe');
            if (guardId) {
                unregisterGuard(guardId);
            }
            if (onRetourListe) {
                onRetourListe();
            }
            return;
        }

        // Pas de modifications: navigation directe
        if (!hasUnsavedChanges || !canDetectChanges()) {
            console.log('✅ Pas de modifications - navigation directe');
            if (guardId) {
                unregisterGuard(guardId);
            }
            if (onRetourListe) {
                onRetourListe();
            }
            return;
        }

        // Modifications détectées: demander confirmation
        console.log('⚠️ Modifications détectées - demande de confirmation');
        const canNavigate = requestNavigation(() => {
            if (guardId) {
                unregisterGuard(guardId);
            }
            if (onRetourListe) {
                onRetourListe();
            }
        });

        if (!canNavigate) {
            console.log('🔒 Navigation bloquée - Modal de confirmation affichée');
        }
    }, [mode, isPaiementAnnule, hasUnsavedChanges, canDetectChanges, requestNavigation, unregisterGuard, guardId, onRetourListe]);

    /**
     * Gestionnaire de retour à la liste (version alternative)
     */
    const handleRetourListe = useCallback(() => {
        if (hasUnsavedChanges && canDetectChanges) {
            requestNavigation(() => {
                if (onRetourListe) {
                    onRetourListe();
                }
            });
        } else {
            if (onRetourListe) {
                onRetourListe();
            }
        }
    }, [hasUnsavedChanges, canDetectChanges, requestNavigation, onRetourListe]);

    /**
     * Gérer la confirmation de navigation externe
     */
    const handleConfirmGlobalNavigation = useCallback(() => {
        console.log('✅ PAIEMENT - Navigation globale confirmée');
        
        // Fermer la modal
        setShowGlobalModal(false);
        
        // Reset des modifications
        resetChanges();
        
        // Désenregistrer le guard
        if (guardId) {
            unregisterGuard(guardId);
        }
        
        // Exécuter le callback de navigation stocké
        if (formState.globalNavigationCallback) {
            console.log('🚀 PAIEMENT - Exécution du callback de navigation globale');
            try {
                formState.globalNavigationCallback();
                setGlobalNavigationCallback(null);
            } catch (error) {
                console.error('❌ PAIEMENT - Erreur lors de l\'exécution du callback:', error);
            }
        } else {
            console.warn('⚠️ PAIEMENT - Aucun callback de navigation stocké');
        }
    }, [
        setShowGlobalModal, 
        resetChanges, 
        guardId, 
        unregisterGuard, 
        formState.globalNavigationCallback, 
        setGlobalNavigationCallback
    ]);

    /**
     * Gérer l'annulation de navigation externe
     */
    const handleCancelGlobalNavigation = useCallback(() => {
        console.log('❌ PAIEMENT - Navigation globale annulée');
        setShowGlobalModal(false);
        setGlobalNavigationCallback(null);
    }, [setShowGlobalModal, setGlobalNavigationCallback]);


    return {
        handleInputChange,
        handleOpenDateModal,
        handleSubmit,
        handleCancel,
        handleAnnuler,
        handleRetourListe,
        handleSuccessfulSave,
        // ✅ AJOUTER CES DEUX LIGNES
        handleConfirmGlobalNavigation,
        handleCancelGlobalNavigation
    };
};