// src/hooks/paiement/usePaiementFormHandlers.js

import React, { useCallback } from 'react';
import modalSystem from '../../../utils/modalSystem';
import DatePickerModalHandler from '../../shared/modals/handlers/DatePickerModalHandler';
import DateService from '../../../utils/DateService';
import { createLogger } from '../../../utils/createLogger';
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
        onRetourListe, onPaiementCreated, paiementActions, factureActions,
        markAsSaved, resetChanges, getFormData, setInitialFormData,
        unregisterGuard, guardId, setShowGlobalModal, setGlobalNavigationCallback,
        hasUnsavedChanges, canDetectChanges, requestNavigation
    } = formState;

    const log = createLogger('usePaiementFormHandlers');

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
            log.debug('🔍 usePaiementFormHandlers - chargerDetailFacture - idFacture:', idFacture);
            
            const factureData = await factureActions.chargerFacture(idFacture);
            log.debug('✅ usePaiementFormHandlers - factureData reçue:', factureData);
            
            // Mettre à jour factureSelectionnee dans le state
            formState.setFactureSelectionnee(factureData);
            
            // En mode création, initialiser automatiquement le montant SEULEMENT si vide
            if (factureData && isCreate) {
                const montantRestant = factureData.montantRestant || 
                    (factureData.totalAvecRistourne - (factureData.montantPayeTotal || 0));
                
                log.debug('💰 Montant restant calculé:', montantRestant);
                
                // Ne pas écraser si l'utilisateur a déjà saisi un montant
                setPaiement(prev => {
                    const montantActuel = prev.montantPaye;
                    const montantEstVide = !montantActuel || montantActuel === '' || montantActuel === '0' || montantActuel === '0.00';
                    
                    if (montantEstVide && montantRestant > 0) {
                        log.debug('✅ Initialisation automatique du montant payé:', montantRestant.toFixed(2));
                        return {
                            ...prev,
                            montantPaye: montantRestant.toFixed(2)
                        };
                    } else {
                        log.debug('ℹ️ Montant déjà saisi, pas d\'écrasement:', montantActuel);
                        return prev;
                    }
                });
            }
        } catch (error) {
            log.error('❌ Erreur lors du chargement de la facture:', error);
            setError('Impossible de charger les détails de la facture');
        }
    }, [factureActions, formState, isCreate, setPaiement, setError]);

    /**
     * Gestionnaire de changement des champs
     */
    const handleInputChange = useCallback((field, value) => {
        if (isReadOnly || isPaiementAnnule) return;
        
        log.debug('📝 PaiementForm handleInputChange:', { field, value, mode });
        
        setPaiement(prev => ({
            ...prev,
            [field]: value
        }));
        
        // Charger les détails de la facture quand elle est sélectionnée
        if (field === 'idFacture' && value) {
            chargerDetailFacture(value);
        }
    }, [isReadOnly, isPaiementAnnule, mode, setPaiement, chargerDetailFacture]);

    /**
     * Gestionnaire d'ouverture du DatePicker
     */
    const handleOpenDateModal = useCallback(async (event) => {
        if (isReadOnly || isPaiementAnnule) return;
        
        log.debug('📅 Ouverture modal de sélection de date pour paiement');
        
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
            log.error('❌ Erreur lors de la sélection de date:', error);
            await modalSystem.error(`Erreur lors de la sélection de date : ${error.message}`);
        }
    }, [isReadOnly, isPaiementAnnule, paiement.datePaiement, datePickerHandler, handleInputChange]);

    /**
     * Fonction pour gérer une sauvegarde réussie
     */
    const handleSuccessfulSave = useCallback((idPaiement, message) => {
        log.debug('✅ Sauvegarde réussie PaiementForm - nettoyage des modifications');
        
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
            log.debug('📤 Mode CREATE - Appel onPaiementCreated');
            onPaiementCreated(idPaiement, message);
        } else if (mode === FORM_MODES.EDIT && onRetourListe) {
            log.debug('🔙 Mode EDIT - Retour à la liste avec message de succès');
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
        
        log.debug('📋 Soumission formulaire paiement:', { mode, paiement });
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
            
            log.debug('🚀 Envoi des données:', paiementData);
            
            let result;
            if (mode === FORM_MODES.CREATE) {
                result = await paiementActions.creerPaiement(paiementData);
                if (result.success) {
                    handleSuccessfulSave(result.idPaiement, NOTIFICATIONS.CREATE_SUCCESS);
                }
            } else if (mode === FORM_MODES.EDIT) {
                result = await paiementActions.modifierPaiement(idPaiement, paiementData);
                if (result.success) {
                    handleSuccessfulSave(idPaiement, NOTIFICATIONS.UPDATE_SUCCESS);
                }
            }
            
            if (!result.success) {
                throw new Error(result.message || 'Erreur lors de la sauvegarde');
            }
            
        } catch (err) {
            log.error('❌ Erreur sauvegarde paiement:', err);
            const errorMessage = err.message || 'Une erreur est survenue';
            setError(errorMessage);
            modalSystem.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    }, [paiement, mode, idPaiement, isReadOnly, isPaiementAnnule, isSubmitting,
        formValidation, paiementActions, setError, setIsSubmitting, handleSuccessfulSave]);

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
            const result = await paiementActions.annulerPaiement(idPaiement);
            
            if (result.success) {
                modalSystem.success(NOTIFICATIONS.CANCEL_SUCCESS);
                if (onRetourListe) {
                    onRetourListe();
                }
            } else {
                throw new Error(result.message || 'Erreur lors de l\'annulation');
            }
        } catch (err) {
            log.error('❌ Erreur annulation paiement:', err);
            modalSystem.error(err.message || 'Une erreur est survenue');
        } finally {
            setIsSubmitting(false);
        }
    }, [idPaiement, isPaiementAnnule, paiementActions, onRetourListe, setIsSubmitting]);

    /**
     * Gestionnaire du bouton Cancel/Retour
     * Cette fonction est utilisée par PaiementFormActions
     */
    const handleCancel = useCallback(() => {
        log.debug('🔙 PaiementForm.handleCancel appelé:', { 
            mode, 
            isPaiementAnnule,
            hasUnsavedChanges,
            guardId
        });
        
        // MODE VIEW: Navigation directe sans vérification
        if (mode === FORM_MODES.VIEW) {
            log.debug('✅ Mode VIEW - Retour direct à la liste');
            if (onRetourListe) {
                onRetourListe();
            }
            return;
        }

        // Paiement annulé: navigation directe
        if (isPaiementAnnule) {
            log.debug('✅ Paiement annulé - navigation directe');
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
            log.debug('✅ Pas de modifications - navigation directe');
            if (guardId) {
                unregisterGuard(guardId);
            }
            if (onRetourListe) {
                onRetourListe();
            }
            return;
        }

        // Modifications détectées: demander confirmation
        log.debug('⚠️ Modifications détectées - demande de confirmation');
        const canNavigate = requestNavigation(() => {
            if (guardId) {
                unregisterGuard(guardId);
            }
            if (onRetourListe) {
                onRetourListe();
            }
        });

        if (!canNavigate) {
            log.debug('🔒 Navigation bloquée - Modal de confirmation affichée');
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
        log.debug('✅ PAIEMENT - Navigation globale confirmée');
        
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
            log.debug('🚀 PAIEMENT - Exécution du callback de navigation globale');
            try {
                formState.globalNavigationCallback();
                setGlobalNavigationCallback(null);
            } catch (error) {
                log.error('❌ PAIEMENT - Erreur lors de l\'exécution du callback:', error);
            }
        } else {
            log.warn('⚠️ PAIEMENT - Aucun callback de navigation stocké');
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
        log.debug('❌ PAIEMENT - Navigation globale annulée');
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
        handleConfirmGlobalNavigation,
        handleCancelGlobalNavigation
    };
};