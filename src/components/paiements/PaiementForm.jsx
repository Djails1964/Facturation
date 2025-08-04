// PaiementForm.jsx - VERSION MIGRÉE VERS modalSystem.js

import React, { useState, useEffect } from 'react';
import { 
    FORM_MODES, 
    VALIDATION_MESSAGES, 
    BUTTON_TEXTS, 
    FORM_TITLES,
    SECTION_TITLES,
    LOADING_MESSAGES,
    PAIEMENT_ETATS,
    LOG_ACTIONS,
    HELP_TEXTS,
    NOTIFICATIONS,
    LABELS,
    PAIEMENT_DATE_CONFIG
} from '../../constants/paiementConstants';
import PaiementService from '../../services/PaiementService';
import FactureService from '../../services/FactureService';
import activityLogsService from '../../services/activityLogsService';
import DateService from '../../utils/DateService';

import modalSystem from '../../utils/modalSystem'; // ✅ NOUVEAU

import DatePickerModalHandler from '../../components/shared/modals/handlers/DatePickerModalHandler';
import '../../styles/components/paiements/PaiementForm.css';
import { 
    formatMontant, 
    formatDate, 
    getBadgeClasses, 
    formatEtatText 
} from '../../utils/formatters';

function PaiementForm({
    mode = FORM_MODES.VIEW,
    paiementId = null,
    onRetourListe,
    onPaiementCreated,
    clients = [],
    clientsLoading = false,
    onRechargerClients = null
}) {
    
    // Services
    const paiementService = new PaiementService();
    const factureService = new FactureService();
    
  
    // ✅ CHANGEMENT 3: Utiliser modalSystem directement
    const datePickerHandler = new DatePickerModalHandler({
        showCustom: modalSystem.custom.bind(modalSystem),
        showError: modalSystem.error.bind(modalSystem),
        showLoading: modalSystem.showLoading.bind(modalSystem)
    });
    
    // États du formulaire
    const [paiement, setPaiement] = useState({
        factureId: '',
        datePaiement: DateService.getTodayInputFormat(),
        montantPaye: '',
        methodePaiement: '',
        commentaire: '',
        etat: '',
        dateCreation: '',
        dateModification: '',
        dateAnnulation: ''
    });
    
    // États pour les informations utilisateur depuis les logs
    const [logsInfo, setLogsInfo] = useState({
        userCreation: null,
        userModification: null,
        userAnnulation: null,
        dateCreationComplete: null,
        dateModificationComplete: null,
        dateAnnulationComplete: null
    });
    
    // États de l'interface
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [logsLoading, setLogsLoading] = useState(false);
    
    // États pour les données liées
    const [factures, setFactures] = useState([]);
    const [facturesLoading, setFacturesLoading] = useState(false);
    const [factureSelectionnee, setFactureSelectionnee] = useState(null);
    
    // Dérivations d'état
    const isReadOnly = mode === FORM_MODES.VIEW;
    const isEdit = mode === FORM_MODES.EDIT;
    const isCreate = mode === FORM_MODES.CREATE;
    
    // Vérifier si le paiement est annulé
    const isPaiementAnnule = paiement.etat === PAIEMENT_ETATS.ANNULE;
    
    // Empêcher modification/suppression si paiement annulé
    const canEdit = isEdit && !isPaiementAnnule;
    
    // ========================================
    // ✅ FONCTIONS DE GESTION DES DATES AVEC modalSystem
    // ========================================
    
    /**
     * Formate une date pour l'affichage dans l'input
     */
    const formatDateForDisplay = (dateString) => {
        return DateService.formatSingleDate(dateString, 'date');
    };

    /**
     * ✅ CHANGEMENT 4: Ouvre la modal de sélection de date avec modalSystem
     */
    const handleOpenDateModal = async (event) => {
        if (isReadOnly || isPaiementAnnule) return;
        
        console.log('📅 Ouverture modal de sélection de date pour paiement');
        
        try {
            // Créer une référence d'ancrage pour le positionnement intelligent
            const anchorRef = React.createRef();
            if (event && event.currentTarget) {
                anchorRef.current = event.currentTarget;
            }
            
            // ✅ AMÉLIORATION 1: Utiliser fromInputFormat pour parser la date initiale
            let initialDates = [];
            if (paiement.datePaiement) {
                const parsedDate = DateService.fromInputFormat(paiement.datePaiement);
                if (parsedDate) {
                    initialDates = [parsedDate];
                    console.log('📅 Date initiale parsée:', DateService.formatSingleDate(parsedDate));
                }
            }
            
            // Configuration spécifique aux paiements
            const config = {
                initialDates: initialDates,
                multiSelect: false,
                minDate: null,
                maxDate: DateService.getToday(), // ✅ AMÉLIORATION 2: Utiliser getToday() au lieu de new Date()
                title: PAIEMENT_DATE_CONFIG.TITLE,
                confirmText: PAIEMENT_DATE_CONFIG.CONFIRM_TEXT,
                context: 'payment',
                anchorRef: anchorRef
            };
            
            console.log('📅 Configuration du DatePicker:', config);
            
            const result = await datePickerHandler.handle(config, event);
            
            console.log('📅 Résultat sélection date:', result);
            
            if (result.action === 'confirm' && result.dates.length > 0) {
                const selectedDate = result.dates[0];
                
                // ✅ AMÉLIORATION 3: Vérification de sécurité avec isStrictlyFuture
                if (DateService.isStrictlyFuture(selectedDate)) {
                    console.warn('⚠️ Tentative de sélection d\'une date future pour un paiement');
                    await modalSystem.warning(
                        'Les dates futures ne sont pas autorisées pour les paiements.',
                        'Date non valide'
                    );
                    return;
                }
                
                // ✅ AMÉLIORATION 4: Utiliser toInputFormat pour la conversion
                const dateString = DateService.toInputFormat(selectedDate);
                
                console.log('📅 Date sélectionnée et formatée:', {
                    selectedDate: DateService.formatSingleDate(selectedDate),
                    dateString,
                    verification: DateService.fromInputFormat(dateString)
                });
                
                // Mettre à jour l'état du paiement
                handleInputChange('datePaiement', dateString);
            }
            
        } catch (error) {
            console.error('❌ Erreur lors de la sélection de date:', error);
            await modalSystem.error(`Erreur lors de la sélection de date : ${error.message}`);
        }
    };

    const validateDatePaiement = (datePaiement) => {
        if (!datePaiement) {
            return { isValid: false, error: VALIDATION_MESSAGES.DATE_REQUIRED };
        }
        
        // ✅ AMÉLIORATION 5: Utiliser fromInputFormat pour parser
        const dateObj = DateService.fromInputFormat(datePaiement);
        if (!dateObj) {
            return { isValid: false, error: 'Format de date invalide' };
        }
        
        // ✅ AMÉLIORATION 6: Utiliser isStrictlyFuture au lieu de comparaison manuelle
        if (DateService.isStrictlyFuture(dateObj)) {
            return { 
                isValid: false, 
                error: 'Les dates futures ne sont pas autorisées pour les paiements' 
            };
        }
        
        // ✅ AMÉLIORATION 7: Vérifier que ce n'est pas trop ancien (optionnel)
        const daysAgo = DateService.getDaysFromDate(dateObj);
        if (daysAgo > 365) { // Plus d'un an
            return { 
                isValid: false, 
                error: 'La date de paiement ne peut pas être antérieure à un an' 
            };
        }
        
        return { isValid: true };
    };
    
    // Charger les données au montage
    useEffect(() => {
        if (isEdit || mode === FORM_MODES.VIEW) {
            chargerPaiement();
        }
        if (isCreate) {
            chargerFactures();
        }
    }, [paiementId, mode]);
    
    // ✅ Charger les informations utilisateur depuis les logs d'activité
    const chargerLogsUtilisateur = async (paiementId) => {
        if (!paiementId) return;
        
        setLogsLoading(true);
        
        try {
            console.log('📋 Chargement des logs pour le paiement:', paiementId);
            
            // Utiliser entity_id pour cibler précisément le paiement
            const logsResponse = await activityLogsService.getLogs({
                entity_type: 'paiement',
                entity_id: paiementId,
                action_type: `${LOG_ACTIONS.PAIEMENT_CREATE},${LOG_ACTIONS.PAIEMENT_UPDATE},${LOG_ACTIONS.PAIEMENT_CANCEL}`
            });
            
            if (logsResponse.success && logsResponse.logs) {
                const logs = logsResponse.logs;
                
                // Trier les logs par date pour avoir le plus récent en premier
                logs.sort((a, b) => new Date(b.date_action) - new Date(a.date_action));
                
                const newLogsInfo = {
                    userCreation: null,
                    userModification: null,
                    userAnnulation: null,
                    dateCreationComplete: null,
                    dateModificationComplete: null,
                    dateAnnulationComplete: null
                };
                
                logs.forEach(log => {
                    const userName = extractUserName(log);
                    
                    if (log.action_type === LOG_ACTIONS.PAIEMENT_CREATE && !newLogsInfo.userCreation) {
                        newLogsInfo.userCreation = userName;
                        newLogsInfo.dateCreationComplete = log.date_action;
                    } else if (log.action_type === LOG_ACTIONS.PAIEMENT_UPDATE && !newLogsInfo.userModification) {
                        newLogsInfo.userModification = userName;
                        newLogsInfo.dateModificationComplete = log.date_action;
                    } else if (log.action_type === LOG_ACTIONS.PAIEMENT_CANCEL && !newLogsInfo.userAnnulation) {
                        newLogsInfo.userAnnulation = userName;
                        newLogsInfo.dateAnnulationComplete = log.date_action;
                    }
                });
                
                setLogsInfo(newLogsInfo);
                console.log('📋 Logs utilisateur chargés:', newLogsInfo);
            }
        } catch (error) {
            console.error('❌ Erreur lors du chargement des logs utilisateur:', error);
            // Ne pas bloquer l'affichage si les logs ne sont pas disponibles
        } finally {
            setLogsLoading(false);
        }
    };
    
    // ✅ Extraire le nom utilisateur depuis un log
    const extractUserName = (log) => {
        // Priorité: nom complet > email > nom utilisateur > ID
        if (log.user_name && log.user_name.trim()) {
            return log.user_name.trim();
        }
        if (log.user_firstname && log.user_lastname) {
            return `${log.user_firstname.trim()} ${log.user_lastname.trim()}`;
        }
        if (log.user_email && log.user_email.trim()) {
            return log.user_email.trim();
        }
        if (log.username && log.username.trim()) {
            return log.username.trim();
        }
        if (log.user_id) {
            return `User ID: ${log.user_id}`;
        }
        return 'Utilisateur inconnu';
    };
    
    // Charger un paiement (modifiée pour inclure les logs)
    const chargerPaiement = async () => {
        if (!paiementId) return;
        
        setIsLoading(true);
        setError(null);
        
        try {
            const paiementData = await paiementService.getPaiement(paiementId);
          
            if (paiementData) {
                setPaiement({
                    factureId: paiementData.factureId,
                    datePaiement: paiementData.datePaiement,
                    montantPaye: paiementData.montantPaye.toString(),
                    methodePaiement: paiementData.methodePaiement,
                    commentaire: paiementData.commentaire || '',
                    etat: paiementData.statut, 
                    dateCreation: paiementData.dateCreation || '',
                    dateModification: paiementData.dateModification || '',
                    dateAnnulation: paiementData.dateAnnulation || ''
                });

                // Charger les détails de la facture
                const factureData = await factureService.getFacture(paiementData.factureId);
                if (factureData) {
                    setFactureSelectionnee(factureData);
                }
                
                // Charger les informations utilisateur depuis les logs
                await chargerLogsUtilisateur(paiementId);
            } else {
                setError(VALIDATION_MESSAGES.PAIEMENT_NON_TROUVE);
            }
        } catch (error) {
            console.error('Erreur lors du chargement du paiement:', error);
            setError(NOTIFICATIONS.ERROR.LOAD + ': ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };
    
    // Charger la liste des factures (pour le mode création)
    const chargerFactures = async () => {
        if (!isCreate) return;
        
        setFacturesLoading(true);
        
        try {
            const facturesData = await factureService.chargerFactures();
            
            const facturesPayables = facturesData.filter(facture => {
                const etatsPayables = ['Envoyée', 'Partiellement payée', 'Retard'];
                return etatsPayables.includes(facture.etat);
            });
            
            const facturesEnrichies = await Promise.all(
                facturesPayables.map(async (facture) => {
                    try {
                        const factureComplete = await factureService.getFacture(facture.id);
                        
                        if (factureComplete) {
                            return {
                                ...facture,
                                montantRestant: factureComplete.montantRestant || (factureComplete.totalAvecRistourne - (factureComplete.montantPayeTotal || 0)),
                                totalAvecRistourne: factureComplete.totalAvecRistourne,
                                montantPayeTotal: factureComplete.montantPayeTotal || 0
                            };
                        }
                        
                        return facture;
                    } catch (error) {
                        console.error(`Erreur lors de l'enrichissement de la facture ${facture.id}:`, error);
                        return facture;
                    }
                })
            );
            
            const facturesAvecMontantRestant = facturesEnrichies.filter(facture => {
                const montantRestant = facture.montantRestant || (facture.montantTotal - (facture.montantPayeTotal || 0));
                return montantRestant > 0;
            });
            
            setFactures(facturesAvecMontantRestant);
        } catch (error) {
            console.error('Erreur lors du chargement des factures:', error);
        } finally {
            setFacturesLoading(false);
        }
    };
    
    // Gestionnaires de changement
    const handleInputChange = (field, value) => {
        if (isReadOnly || isPaiementAnnule) return;
        
        setPaiement(prev => ({
            ...prev,
            [field]: value
        }));
        
        if (field === 'factureId' && value) {
            chargerDetailFacture(value);
        }
    };
    
    // Charger les détails d'une facture sélectionnée
    const chargerDetailFacture = async (factureId) => {
        try {
            const factureData = await factureService.getFacture(factureId);
            setFactureSelectionnee(factureData);
            
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
    };
    
    // ✅ VALIDATION DU FORMULAIRE AVEC DateService
    const validateForm = () => {
        // Validation de la facture
        if (!paiement.factureId) {
            setError(VALIDATION_MESSAGES.FACTURE_REQUIRED);
            return false;
        }
        
        // ✅ AMÉLIORATION 8: Utiliser la nouvelle méthode de validation
        const dateValidation = validateDatePaiement(paiement.datePaiement);
        if (!dateValidation.isValid) {
            setError(dateValidation.error);
            return false;
        }
        
        // Validation du montant
        const montant = parseFloat(paiement.montantPaye);
        if (!montant || montant <= 0) {
            setError(VALIDATION_MESSAGES.MONTANT_REQUIRED);
            return false;
        }
        
        // Validation de la méthode de paiement
        if (!paiement.methodePaiement) {
            setError(VALIDATION_MESSAGES.METHODE_REQUIRED);
            return false;
        }
        
        // Vérifier que le montant ne dépasse pas ce qui reste à payer
        if (factureSelectionnee && isCreate) {
            const montantRestant = factureSelectionnee.montantRestant || 
                (factureSelectionnee.totalAvecRistourne - (factureSelectionnee.montantPayeTotal || 0));
            
            if (montant > montantRestant + 0.01) { // +0.01 pour les erreurs d'arrondi
                setError(VALIDATION_MESSAGES.MONTANT_SUPERIEUR);
                return false;
            }
        }
        
        return true;
    };

    // ========================================
    // 3. NOUVELLE MÉTHODE UTILITAIRE POUR DÉBUGGER
    // ========================================

    // ✅ À ajouter dans PaiementForm.jsx pour débugger les problèmes de date

    const debugDateHandling = (label, date) => {
        if (process.env.NODE_ENV === 'development') {
            console.log(`🔍 DEBUG ${label}:`, {
                original: date,
                type: typeof date,
                isDate: date instanceof Date,
                formatted: DateService.formatSingleDate(date),
                inputFormat: DateService.toInputFormat(date),
                isToday: DateService.isSameDayAsToday(date),
                isFuture: DateService.isStrictlyFuture(date),
                daysFromToday: DateService.getDaysFromDate(date)
            });
        }
    };
    
    // Soumission du formulaire
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (isPaiementAnnule) {
            setError(VALIDATION_MESSAGES.PAIEMENT_ANNULE);
            return;
        }
        
        if (!validateForm()) return;
        
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
                if (result.success && onPaiementCreated) {
                    onPaiementCreated(result.id, result.message || NOTIFICATIONS.SUCCESS.CREATE);
                }
            } else if (canEdit) {
                result = await paiementService.updatePaiement(paiementId, paiementData);
                if (result.success && onRetourListe) {
                    onRetourListe(paiementId, true, result.message || NOTIFICATIONS.SUCCESS.UPDATE, 'success');
                }
            }
            
        } catch (error) {
            console.error('Erreur lors de la soumission:', error);
            setError(error.message || (isCreate ? NOTIFICATIONS.ERROR.CREATE : NOTIFICATIONS.ERROR.UPDATE));
        } finally {
            setIsSubmitting(false);
        }
    };
    
    // Annulation
    const handleCancel = () => {
        if (onRetourListe) {
            onRetourListe(null, false, '', '');
        }
    };
    
    // Titre du formulaire
    const getTitre = () => {
        switch (mode) {
            case FORM_MODES.CREATE:
                return FORM_TITLES.CREATE;
            case FORM_MODES.EDIT:
                return isPaiementAnnule ? FORM_TITLES.EDIT_CANCELLED : FORM_TITLES.EDIT;
            case FORM_MODES.VIEW:
                return isPaiementAnnule ? FORM_TITLES.VIEW_CANCELLED : FORM_TITLES.VIEW;
            default:
                return 'Paiement';
        }
    };
    
    // ✅ Formater les informations utilisateur pour l'affichage
    const formatUserInfo = (user, date) => {
        if (!user && !date) return '-';
        
        const userPart = user || 'Utilisateur inconnu';
        const datePart = date ? DateService.formatSingleDate(date, 'datetime') : '';
        
        return datePart ? `${userPart} le ${datePart}` : userPart;
    };
    
    const getEtatBadgeClass = (etat) => {
        return getBadgeClasses(etat, 'small');
    };
    
    const formatDateForSystemDisplay = (dateString) => {
        if (!dateString) return '-';
        return DateService.formatSingleDate(dateString, 'datetime');
    };
    
    // Rendu conditionnel pour le chargement
    if (isLoading) {
        return (
            <div className="content-section-container">
                <div className="content-section-title">
                    <h2>{getTitre()}</h2>
                </div>
                <div className="paiement-form-container">
                    <p className="loading-message">{LOADING_MESSAGES.LOADING_PAIEMENT}</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="content-section-container">
            {/* ✅ Structure similaire à FactureHeader avec badge positionné */}
            <div className="content-section-title">
                <h2>{getTitre()}</h2>
                
                {/* ✅ Badge d'état avec même style et positionnement que FactureHeader */}
                {paiement.etat && (
                    <div className="paiement-header-etat-simple">
                        <span className={getEtatBadgeClass(paiement.etat)}>
                            {formatEtatText(paiement.etat)}
                        </span>
                    </div>
                )}
            </div>
            
            <form onSubmit={handleSubmit} className="paiement-form">
                <div className="paiement-form-container">
                    
                    {error && (
                        <div className="notification error">
                            {error}
                        </div>
                    )}
                    
                    {isPaiementAnnule && mode !== FORM_MODES.VIEW && (
                        <div className="notification warning">
                            <strong>⚠️ Paiement annulé</strong><br/>
                            {HELP_TEXTS.CANCELLED_WARNING}<br/>
                            Annulé le {formatDateForSystemDisplay(paiement.dateAnnulation)}
                        </div>
                    )}
                    
                    {/* Section Facture */}
                    <div className="form-section">
                        <h3>{SECTION_TITLES.FACTURE}</h3>
                        
                        <div className="form-row">
                            <div className="input-group">
                                {isCreate ? (
                                    <>
                                        <select
                                            id="factureId"
                                            value={paiement.factureId}
                                            onChange={(e) => handleInputChange('factureId', e.target.value)}
                                            required
                                            disabled={facturesLoading}
                                        >
                                            <option value="">Sélectionner une facture</option>
                                            {factures.map(facture => {
                                                const montantRestant = facture.montantRestant || 
                                                    (facture.totalAvecRistourne ? 
                                                        facture.totalAvecRistourne - (facture.montantPayeTotal || 0) :
                                                        facture.montantTotal - (facture.montantPayeTotal || 0)
                                                    );
                                                
                                                return (
                                                    <option key={facture.id} value={facture.id}>
                                                        {facture.numeroFacture} - {facture.client.prenom} {facture.client.nom} 
                                                        ({formatMontant(montantRestant)} CHF à payer)
                                                    </option>
                                                );
                                            })}
                                        </select>
                                        <label htmlFor="factureId" className="required">{LABELS.FACTURE}</label>
                                    </>
                                ) : (
                                    <>
                                        <input
                                            type="text"
                                            value={factureSelectionnee ? 
                                                `${factureSelectionnee.numeroFacture} - ${factureSelectionnee.client?.prenom} ${factureSelectionnee.client?.nom}` 
                                                : 'Chargement...'
                                            }
                                            readOnly
                                            placeholder=" "
                                        />
                                        <label>{LABELS.FACTURE}</label>
                                    </>
                                )}
                            </div>
                        </div>
                        
                        {/* Détails de la facture */}
                        {factureSelectionnee && (
                            <div className="facture-details">
                                <div className="details-row">
                                    <span>{LABELS.MONTANT_TOTAL}:</span>
                                    <span>{formatMontant(factureSelectionnee.totalAvecRistourne || factureSelectionnee.totalFacture)} CHF</span>
                                </div>
                                <div className="details-row">
                                    <span>{LABELS.DEJA_PAYE}:</span>
                                    <span>{formatMontant(factureSelectionnee.montantPayeTotal || 0)} CHF</span>
                                </div>
                                <div className="details-row">
                                    <span>{LABELS.MONTANT_RESTANT}:</span>
                                    <span className="montant-restant">
                                        {formatMontant(
                                            factureSelectionnee.montantRestant || 
                                            (factureSelectionnee.totalAvecRistourne || factureSelectionnee.totalFacture) - (factureSelectionnee.montantPayeTotal || 0)
                                        )} CHF
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {/* Section Paiement */}
                    <div className="form-section">
                        <h3>{SECTION_TITLES.PAIEMENT}</h3>
                        
                        <div className="form-row">
                            {/* ✅ CHAMP DATE AVEC modalSystem - PLUS DE CHANGEMENTS ICI */}
                            <div className="input-group date-input-wrapper">
                                <input
                                    type="text"
                                    id="datePaiement"
                                    value={formatDateForDisplay(paiement.datePaiement)}
                                    readOnly
                                    required
                                    placeholder=" "
                                    onClick={handleOpenDateModal}
                                    className={(isReadOnly || isPaiementAnnule) ? 'readonly' : 'clickable'}
                                />
                                <label htmlFor="datePaiement" className="required">
                                    {LABELS.DATE_PAIEMENT}
                                </label>
                                
                                {!isReadOnly && !isPaiementAnnule && (
                                    <span 
                                        className="date-picker-icon"
                                        onClick={handleOpenDateModal}
                                        title={LABELS.OPEN_DATE_CALENDAR}
                                    >
                                        📅
                                    </span>
                                )}
                            </div>
                            
                            <div className="input-group">
                                <input
                                    type="number"
                                    id="montantPaye"
                                    value={paiement.montantPaye}
                                    onChange={(e) => handleInputChange('montantPaye', e.target.value)}
                                    step="0.01"
                                    min="0"
                                    required
                                    readOnly={isReadOnly || isPaiementAnnule}
                                    placeholder=" "
                                />
                                <label htmlFor="montantPaye" className="required">{LABELS.MONTANT_PAYE}</label>
                            </div>
                        </div>
                        
                        <div className="form-row">
                            <div className="input-group">
                                {isReadOnly || isPaiementAnnule ? (
                                    <>
                                        <input
                                            type="text"
                                            value={paiementService.formatMethodePaiement(paiement.methodePaiement)}
                                            readOnly
                                            placeholder=" "
                                        />
                                        <label>{LABELS.METHODE_PAIEMENT}</label>
                                    </>
                                ) : (
                                    <>
                                        <select
                                            id="methodePaiement"
                                            value={paiement.methodePaiement}
                                            onChange={(e) => handleInputChange('methodePaiement', e.target.value)}
                                            required
                                        >
                                            <option value="">Sélectionner une méthode</option>
                                            {paiementService.getMethodesPaiement().map(methode => (
                                                <option key={methode.value} value={methode.value}>
                                                    {methode.label}
                                                </option>
                                            ))}
                                        </select>
                                        <label htmlFor="methodePaiement" className="required">{LABELS.METHODE_PAIEMENT}</label>
                                    </>
                                )}
                            </div>
                        </div>
                        
                        <div className="form-row">
                            <div className="input-group full-width">
                                <textarea
                                    id="commentaire"
                                    value={paiement.commentaire}
                                    onChange={(e) => handleInputChange('commentaire', e.target.value)}
                                    rows={3}
                                    readOnly={isReadOnly || isPaiementAnnule}
                                    placeholder=" "
                                />
                                <label htmlFor="commentaire">{LABELS.COMMENTAIRE}</label>
                            </div>
                        </div>
                    </div>
                    
                    {/* ✅ SECTION: Informations système avec données utilisateur */}
                    {(mode === FORM_MODES.VIEW || isEdit) && (
                        <div className="form-section">
                            <h3>{SECTION_TITLES.SYSTEM_INFO}</h3>
                            
                            {logsLoading && (
                                <div className="notification info">
                                    {LOADING_MESSAGES.LOADING_LOGS}
                                </div>
                            )}
                            
                            <div className="form-row">
                                {/* Informations de création */}
                                <div className="input-group">
                                    <input
                                        type="text"
                                        value={formatUserInfo(logsInfo.userCreation, logsInfo.dateCreationComplete || paiement.dateCreation)}
                                        readOnly
                                    />
                                    <label>Créé par</label>
                                </div>
                                
                                {/* Informations de modification */}
                                {(paiement.dateModification || logsInfo.dateModificationComplete) && (
                                    <div className="input-group">
                                        <input
                                            type="text"
                                            value={formatUserInfo(logsInfo.userModification, logsInfo.dateModificationComplete || paiement.dateModification)}
                                            readOnly
                                        />
                                        <label>Modifié par</label>
                                    </div>
                                )}
                                
                                {/* Informations d'annulation */}
                                {(paiement.dateAnnulation || logsInfo.dateAnnulationComplete) && (
                                    <div className="input-group">
                                        <input
                                            type="text"
                                            value={formatUserInfo(logsInfo.userAnnulation, logsInfo.dateAnnulationComplete || paiement.dateAnnulation)}
                                            readOnly
                                        />
                                        <label>Annulé par</label>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Actions du formulaire */}
                    <div className="form-actions">
                        {!isReadOnly && !isPaiementAnnule && (
                            <button 
                                type="submit" 
                                disabled={isSubmitting}
                                className="btn-primary"
                            >
                                {isSubmitting ? LOADING_MESSAGES.SAVING : 
                                 isCreate ? BUTTON_TEXTS.CREATE : 
                                 BUTTON_TEXTS.EDIT}
                            </button>
                        )}
                        
                        <button 
                            type="button" 
                            onClick={handleCancel}
                            className="btn-secondary"
                        >
                            {isReadOnly || isPaiementAnnule ? BUTTON_TEXTS.BACK : BUTTON_TEXTS.CANCEL}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}

export default PaiementForm;