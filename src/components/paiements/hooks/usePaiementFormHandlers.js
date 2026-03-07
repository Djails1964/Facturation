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
    PAIEMENT_DATE_CONFIG,
    DEFAULT_VALUES  // ✅ AJOUTÉ 
} from '../../../constants/paiementConstants';

export const usePaiementFormHandlers = (formState, formLogic, formValidation) => {
    const {
        paiement, setPaiement, setError, isSubmitting, setIsSubmitting,
        isReadOnly, isPaiementAnnule, isCreate, mode, idPaiement,
        onRetourListe, onPaiementCreated, paiementActions, factureActions, loyerActions,
        markAsSaved, resetChanges, getFormData, setInitialFormData,
        unregisterGuard, guardId, setShowGlobalModal, setGlobalNavigationCallback,
        hasUnsavedChanges, canDetectChanges, requestNavigation,
        // CLIENT-FIRST
        clients, clientSelectionne, setClientSelectionne,
        // Onglets / loyer
        typeOnglet, setTypeOnglet,
        loyerSelectionne, setLoyerSelectionne,
        moisSelectionnes, setMoisSelectionnes
    } = formState;

    const log = createLogger('usePaiementFormHandlers');

    log.debug('🔧 usePaiementFormHandlers - Initialisation avec état:', {
        mode,
        isReadOnly,
        isPaiementAnnule,
        isCreate
    });
    log.debug('🎨 formState:', formState);
    log.debug('🧠 formLogic:', formLogic);
    log.debug('✅ formValidation:', formValidation);

    // DatePicker handler
    const datePickerHandler = new DatePickerModalHandler({
        showCustom: modalSystem.custom.bind(modalSystem),
        showError: modalSystem.error.bind(modalSystem),
        showLoading: modalSystem.showLoading.bind(modalSystem)
    });

    /**
     * Charger les détails d'une facture sélectionnée
     * Tolère idFacture null/vide (paiement libre sans facture)
     */
    const chargerDetailFacture = useCallback(async (idFacture) => {
        try {
            log.debug('ℹ️ usePaiementFormHandlers - chargerDetailFacture - idFacture:', idFacture);
            
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
     * - Si le champ est idClient : réinitialise idFacture, factureSelectionnee et montant
     * - Si le champ est idFacture : charge les détails de la facture (ou null si paiement libre)
     */
    const handleInputChange = useCallback((field, value) => {
        if (isReadOnly || isPaiementAnnule) return;
        
        log.debug('🔄 PaiementForm handleInputChange:', { field, value, mode });

        // Changement de client → recharger factures + loyers du client
        if (field === 'idClient') {
            log.debug('👤 Changement de client — réinitialisation facture + loyer');
            setPaiement(prev => ({
                ...prev,
                idClient: value,
                idFacture: '',
                idLoyer: '',
                montantPaye: '',
                datePaiement: DateService.getTodayInputFormat(),
                methodePaiement: DEFAULT_VALUES.METHODE_PAIEMENT,
                commentaire: prev.commentaire || ''
            }));
            formState.setFactureSelectionnee(null);
            setLoyerSelectionne(null);
            setMoisSelectionnes({});

            if (value) {
                const client = clients?.find(c => String(c.idClient || c.id) === String(value));
                setClientSelectionne(client || null);
                // Charger factures et loyers du client sélectionné
                formLogic.chargerFacturesDuClient(value);
                formLogic.chargerLoyersDuClient(value);
            } else {
                setClientSelectionne(null);
            }
            return;
        }

        // Changement de facture (onglet Facture)
        if (field === 'idFacture') {
            if (value) {
                log.debug('📋 Facture sélectionnée:', value);
                setPaiement(prev => ({
                    ...prev,
                    idFacture: value,
                    montantPaye: '',
                    datePaiement: DateService.getTodayInputFormat(),
                    methodePaiement: DEFAULT_VALUES.METHODE_PAIEMENT
                }));
                chargerDetailFacture(value);
            }
            return;
        }

        // Changement de loyer (onglet Loyer)
        if (field === 'idLoyer') {
            setMoisSelectionnes({});
            setLoyerSelectionne(null);
            if (value) {
                log.debug('🏠 Loyer sélectionné:', value);
                setPaiement(prev => ({ ...prev, idLoyer: value }));
                // Charger le détail complet du loyer (avec montantsMensuels)
                loyerActions.getLoyer(value)
                    .then(l => setLoyerSelectionne(l))
                    .catch(() => {});
            } else {
                setPaiement(prev => ({ ...prev, idLoyer: '' }));
            }
            return;
        }

        setPaiement(prev => ({ ...prev, [field]: value }));
    }, [isReadOnly, isPaiementAnnule, mode, setPaiement, chargerDetailFacture,
        clients, setClientSelectionne, setLoyerSelectionne, setMoisSelectionnes,
        formState, formLogic, loyerActions]);

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
     * Construit un message adapté selon que la facture est présente ou non
     */
    const handleSuccessfulSave = useCallback((result, message) => {
        log.debug('✅ Sauvegarde réussie PaiementForm - nettoyage des modifications');

        // 1. Extraire les infos depuis formState (déjà  dispo dans le scope du hook)
        const numFacture = formState.factureSelectionnee?.numeroFacture || 'N/A';
        const clientData = formState.factureSelectionnee?.client;
        log.debug(' formState.factureSelectionnee:', formState.factureSelectionnee);
        log.debug(' clientData:', clientData);
        let nomClient = 'Client inconnu';

        if (clientData && clientData.nom) {
            // Construction : Prénom Nom (ou juste Nom si pas de prénom)
            nomClient = `${clientData.prenom ? clientData.prenom + ' ' : ''}${clientData.nom}`.trim();
        }

        log.debug(' result.numeroPaiement:', result.numeroPaiement);

        const montant = formState.paiement?.montantPaye || 0;
        
        // 2. Récupérer le numéro de paiement depuis le résultat de l'API
        // Note: On vérifie plusieurs clés possibles selon votre API (numeroPaiement ou idPaiement)
        log.debug(' idPaiement reçu:', result.idPaiement);
        log.debug(' typeOf idPaiement:', typeof result.idPaiement);
        const numPaiement = result.numeroPaiement || result.idPaiement || 'N/A'; 

        // 3. Construction du message enrichi
        const messageEnrichi = `Paiement n° ${numPaiement} (Facture ${numFacture} - ${nomClient}) d'un montant de ${montant} CHF enregistré avec succès`;

        log.debug('✅ Sauvegarde réussie, message::', messageEnrichi);
        log.debug(' factureSelectionnee avant reset:', formState.factureSelectionnee);
        
        markAsSaved();
        resetChanges();

        log.debug(' factureSelectionnee après reset:', formState.factureSelectionnee);


        const newFormData = getFormData();
        setInitialFormData(newFormData);

        if (guardId) {
            unregisterGuard(guardId);
        }
        setShowGlobalModal(false);
        setGlobalNavigationCallback(null);

        if (mode === FORM_MODES.CREATE && onPaiementCreated) {
            log.debug('📤 Mode CREATE - Appel onPaiementCreated');
            onPaiementCreated(idPaiement, messageEnrichi);
        } else if (mode === FORM_MODES.EDIT && onRetourListe) {
            log.debug('📙 Mode EDIT - Retour à la liste avec message de succès');
            onRetourListe(idPaiement, true, messageEnrichi, 'success');
        }
    }, [mode, onPaiementCreated, onRetourListe, markAsSaved, resetChanges, getFormData, 
        setInitialFormData, unregisterGuard, guardId, setShowGlobalModal, 
        setGlobalNavigationCallback]);

    /**
     * Soumission onglet Loyer : enregistre chaque mois sélectionné séquentiellement
     */
    const handleLoyerSubmit = useCallback(async () => {
        if (!loyerSelectionne) return;
        const moisAValider = Object.entries(moisSelectionnes)
            .filter(([, m]) => m.selectionne)
            .map(([idLoyerDetail, m]) => ({ idLoyerDetail: parseInt(idLoyerDetail), ...m }));

        if (moisAValider.length === 0) {
            const msg = 'Veuillez sélectionner au moins un mois à payer';
            modalSystem.error(msg); return;
        }
        // Valider chaque mois
        for (const m of moisAValider) {
            const dv = formValidation.validateDatePaiement(m.datePaiement);
            if (!dv.isValid) { modalSystem.error(`Mois ${m.label || ''} : ${dv.error}`); return; }
            if (!m.montantPaye || parseFloat(m.montantPaye) <= 0) {
                modalSystem.error(`Mois ${m.label || ''} : montant invalide`); return;
            }
            if (!m.methodePaiement) {
                modalSystem.error(`Mois ${m.label || ''} : méthode de paiement requise`); return;
            }
        }

        setIsSubmitting(true);
        setError(null);
        try {
            let nbOK = 0;
            for (const m of moisAValider) {
                const detail = loyerSelectionne.montantsMensuels?.find(
                    d => d.idLoyerDetail === m.idLoyerDetail
                );
                const montantDu = parseFloat(detail?.montant || 0);
                const montantPaye = parseFloat(m.montantPaye);
                const result = await loyerActions.enregistrerPaiementDetail(
                    loyerSelectionne.idLoyer,
                    {
                        idClient:         paiement.idClient,
                        idLoyerDetail:    m.idLoyerDetail,
                        datePaiement:     m.datePaiement,
                        montantPaye,
                        methodePaiement:  m.methodePaiement,
                        commentaire:      m.commentaire || '',
                        estTotalementPaye: montantPaye >= montantDu - 0.005
                    }
                );
                if (!result.success) throw new Error(result.message || 'Erreur paiement mois');
                nbOK++;
            }
            const msg = `${nbOK} mois de loyer enregistré${nbOK > 1 ? 's' : ''} avec succès`;
            markAsSaved();
            if (onPaiementCreated) onPaiementCreated(null, msg);
        } catch (err) {
            log.error('❌ Erreur paiement loyer:', err);
            setError(err.message);
            modalSystem.error(err.message);
        } finally {
            setIsSubmitting(false);
        }
    }, [loyerSelectionne, moisSelectionnes, paiement.idClient, loyerActions,
        formValidation, setIsSubmitting, setError, markAsSaved, onPaiementCreated]);

    /**
     * Gestionnaire de soumission du formulaire (onglet Facture)
     */
    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        
        if (isReadOnly || isPaiementAnnule || isSubmitting) return;
        
        log.debug('📋 Soumission formulaire paiement:', { mode, paiement });
        setError(null);
        
        // Client obligatoire
        if (isCreate && !paiement.idClient) {
            const msg = 'Veuillez sélectionner un client';
            setError(msg); modalSystem.error(msg); return;
        }
        // Facture obligatoire en création (plus de paiement libre)
        if (isCreate && !paiement.idFacture) {
            const msg = 'Veuillez sélectionner une facture';
            setError(msg); modalSystem.error(msg); return;
        }

        // Validation de la date
        const dateValidation = formValidation.validateDatePaiement(paiement.datePaiement);
        if (!dateValidation.isValid) {
            setError(dateValidation.error);
            modalSystem.error(dateValidation.error);
            return;
        }
        
        // Validation du montant
        const montantValidation = formValidation.validateMontant(paiement.montantPaye);
        if (!montantValidation.isValid) {
            setError(montantValidation.error);
            modalSystem.error(montantValidation.error);
            return;
        }
        
        // Validation de la méthode de paiement
        const methodeValidation = formValidation.validateMethodePaiement(paiement.methodePaiement);
        if (!methodeValidation.isValid) {
            setError(methodeValidation.error);
            modalSystem.error(methodeValidation.error);
            return;
        }
        
        try {
            setIsSubmitting(true);
            
            const paiementData = {
                idClient: paiement.idClient,
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
                log.debug('✅ Résultat création paiement:', result);
                if (result.success) {
                    handleSuccessfulSave(result, NOTIFICATIONS.CREATE_SUCCESS);
                }
            } else if (mode === FORM_MODES.EDIT) {
                result = await paiementActions.modifierPaiement(idPaiement, paiementData);
                if (result.success) {
                    handleSuccessfulSave(result, NOTIFICATIONS.UPDATE_SUCCESS);
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
        handleLoyerSubmit,
        handleCancel,
        handleAnnuler,
        handleRetourListe,
        handleSuccessfulSave,
        handleConfirmGlobalNavigation,
        handleCancelGlobalNavigation
    };
};