// PaiementForm.jsx - VERSION AVEC PROTECTION DES MODIFICATIONS NON SAUVEGARDÉES

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FiCalendar } from 'react-icons/fi';
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

import modalSystem from '../../utils/modalSystem';

import DatePickerModalHandler from '../../components/shared/modals/handlers/DatePickerModalHandler';
import ConfirmationModal from '../../components/shared/ConfirmationModal';
import { useNavigationGuard } from '../../App';
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges';
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
    
    // ✅ AJOUT: Hook global pour s'enregistrer
    const { registerGuard, unregisterGuard } = useNavigationGuard();

    // ✅ AJOUT: ID unique pour ce guard
    const guardId = `paiement-form-${paiementId || 'new'}`;

    // ✅ AJOUT: États pour tracker l'initialisation complète
    const [isFullyInitialized, setIsFullyInitialized] = useState(false);
    const [isInitialLoadDone, setIsInitialLoadDone] = useState(false);

    // ✅ AJOUT: État pour la modal de navigation externe
    const [showGlobalModal, setShowGlobalModal] = useState(false);
    const [globalNavigationCallback, setGlobalNavigationCallback] = useState(null);
    
    // DatePicker handler
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
    
    // ✅ AJOUT: Données initiales pour la détection des modifications
    const [initialFormData, setInitialFormData] = useState({});
    
    // Dérivations d'état
    const isReadOnly = mode === FORM_MODES.VIEW;
    const isEdit = mode === FORM_MODES.EDIT;
    const isCreate = mode === FORM_MODES.CREATE;
    
    // Vérifier si le paiement est annulé
    const isPaiementAnnule = paiement.etat === PAIEMENT_ETATS.ANNULE;
    
    // Empêcher modification/suppression si paiement annulé
    const canEdit = isEdit && !isPaiementAnnule;

    // ✅ AJOUT: Fonction pour obtenir les données actuelles du formulaire
    const getFormData = useCallback(() => {
        return {
            factureId: paiement.factureId,
            datePaiement: paiement.datePaiement,
            montantPaye: paiement.montantPaye,
            methodePaiement: paiement.methodePaiement,
            commentaire: paiement.commentaire
        };
    }, [paiement]);

    // ✅ AJOUT: Fonction pour vérifier si on peut commencer la détection
    const canDetectChanges = useCallback(() => {
        return !isLoading && 
               !isSubmitting && 
               isInitialLoadDone && 
               isFullyInitialized && 
               Object.keys(initialFormData).length > 0 &&
               mode !== FORM_MODES.VIEW &&
               !isPaiementAnnule;
    }, [isLoading, isSubmitting, isInitialLoadDone, isFullyInitialized, initialFormData, mode, isPaiementAnnule]);

    // ✅ AJOUT: Données actuelles pour la détection (calculées à chaque render)
    const currentFormData = useMemo(() => {
        const data = canDetectChanges() ? getFormData() : {};
        console.log('🔄 useMemo currentFormData PaiementForm recalculé:', {
            canDetectChanges: canDetectChanges(),
            data,
            paiementId
        });
        return data;
    }, [canDetectChanges, paiement]); // Dépendre directement de `paiement`

    // ✅ AJOUT: Hook local pour détecter les modifications
    const {
        hasUnsavedChanges,
        showUnsavedModal,
        markAsSaved,
        confirmNavigation,
        cancelNavigation,
        requestNavigation,
        resetChanges
    } = useUnsavedChanges(
        initialFormData,
        currentFormData,
        isSubmitting,
        false
    );

    // ✅ AJOUT: Debug: Log des données pour voir ce qui change
    useEffect(() => {
        if (canDetectChanges()) {
            console.log('📊 PaiementForm données comparaison:', {
                canDetectChanges: canDetectChanges(),
                initialFormData,
                currentFormData,
                sonIdentiques: JSON.stringify(initialFormData) === JSON.stringify(currentFormData),
                hasUnsavedChanges
            });
        }
    }, [paiement, initialFormData, canDetectChanges, currentFormData, hasUnsavedChanges]);
    
    // ========================================
    // FONCTIONS DE GESTION DES DATES
    // ========================================
    
    const formatDateForDisplay = (dateString) => {
        return DateService.formatSingleDate(dateString, 'date');
    };

    const handleOpenDateModal = async (event) => {
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
                    console.log('📅 Date initiale parsée:', DateService.formatSingleDate(parsedDate));
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
            
            console.log('📅 Configuration du DatePicker:', config);
            
            const result = await datePickerHandler.handle(config, event);
            
            console.log('📅 Résultat sélection date:', result);
            
            if (result.action === 'confirm' && result.dates.length > 0) {
                const selectedDate = result.dates[0];
                
                if (DateService.isStrictlyFuture(selectedDate)) {
                    console.warn('⚠️ Tentative de sélection d\'une date future pour un paiement');
                    await modalSystem.warning(
                        'Les dates futures ne sont pas autorisées pour les paiements.',
                        'Date non valide'
                    );
                    return;
                }
                
                const dateString = DateService.toInputFormat(selectedDate);
                
                console.log('📅 Date sélectionnée et formatée:', {
                    selectedDate: DateService.formatSingleDate(selectedDate),
                    dateString,
                    verification: DateService.fromInputFormat(dateString)
                });
                
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
        
        const dateObj = DateService.fromInputFormat(datePaiement);
        if (!dateObj) {
            return { isValid: false, error: 'Format de date invalide' };
        }
        
        if (DateService.isStrictlyFuture(dateObj)) {
            return { 
                isValid: false, 
                error: 'Les dates futures ne sont pas autorisées pour les paiements' 
            };
        }
        
        const daysAgo = DateService.getDaysFromDate(dateObj);
        if (daysAgo > 365) {
            return { 
                isValid: false, 
                error: 'La date de paiement ne peut pas être antérieure à un an' 
            };
        }
        
        return { isValid: true };
    };
    
    // ✅ AJOUT: Charger les données au montage avec initialisation
    useEffect(() => {
        const loadData = async () => {
            if (isEdit || mode === FORM_MODES.VIEW) {
                await chargerPaiement();
            }
            if (isCreate) {
                await chargerFactures();
                // Pour la création, initialiser avec les valeurs par défaut
                const defaultPaiement = {
                    factureId: '',
                    datePaiement: DateService.getTodayInputFormat(),
                    montantPaye: '',
                    methodePaiement: '',
                    commentaire: ''
                };
                
                setPaiement(prev => ({
                    ...prev,
                    ...defaultPaiement
                }));
            }
            
            console.log('✅ Chargement initial PaiementForm terminé');
            setIsInitialLoadDone(true);
        };

        loadData();
    }, [paiementId, mode]);

    // ✅ AJOUT: Effet pour finaliser l'initialisation après que toutes les données soient chargées
    useEffect(() => {
        if (isInitialLoadDone && !isLoading && !isFullyInitialized) {
            const timer = setTimeout(() => {
                console.log('🔧 Finalisation de l\'initialisation PaiementForm');
                const currentFormData = getFormData();
                
                const hasValidData = mode === FORM_MODES.CREATE ? 
                    (currentFormData.datePaiement !== undefined) :
                    (currentFormData.factureId && currentFormData.datePaiement);
                
                if (hasValidData) {
                    setTimeout(() => {
                        const finalFormData = getFormData();
                        const isStable = JSON.stringify(currentFormData) === JSON.stringify(finalFormData);
                        
                        if (isStable) {
                            setInitialFormData(finalFormData);
                            setIsFullyInitialized(true);
                            console.log('✅ Initialisation PaiementForm complète avec données stables:', {
                                mode,
                                finalFormData
                            });
                        } else {
                            console.log('⏳ Données PaiementForm pas encore stables, attente...');
                            setTimeout(() => {
                                const stabilizedData = getFormData();
                                setInitialFormData(stabilizedData);
                                setIsFullyInitialized(true);
                                console.log('✅ Initialisation PaiementForm forcée après délai supplémentaire:', stabilizedData);
                            }, 1000);
                        }
                    }, 300);
                } else {
                    console.log('❌ Données PaiementForm pas encore valides pour initialisation:', {
                        mode,
                        currentFormData,
                        hasValidData
                    });
                }
            }, 500);

            return () => clearTimeout(timer);
        }
    }, [isInitialLoadDone, isLoading, isFullyInitialized, getFormData, mode]);

    // ✅ AJOUT: Enregistrer le guard global seulement quand tout est prêt
    useEffect(() => {
        if (canDetectChanges()) {
            const guardFunction = async () => {
                console.log(`🔍 Vérification modifications pour ${guardId}:`, hasUnsavedChanges);
                return hasUnsavedChanges;
            };

            registerGuard(guardId, guardFunction);
            console.log(`🔒 Guard enregistré pour ${guardId}`);

            return () => {
                unregisterGuard(guardId);
                console.log(`🔓 Guard désenregistré pour ${guardId}`);
            };
        }
    }, [canDetectChanges, hasUnsavedChanges, guardId, registerGuard, unregisterGuard]);

    // ✅ AJOUT: Intercepter les navigations externes
    useEffect(() => {
        if (canDetectChanges() && hasUnsavedChanges) {
            const handleGlobalNavigation = (event) => {
                console.log('🚨 Navigation externe détectée avec modifications non sauvegardées PaiementForm');
                
                if (event.detail && event.detail.source && event.detail.callback) {
                    console.log('🔄 Affichage modal pour navigation externe PaiementForm:', event.detail.source);
                    setGlobalNavigationCallback(() => event.detail.callback);
                    setShowGlobalModal(true);
                }
            };

            window.addEventListener('navigation-blocked', handleGlobalNavigation);

            return () => {
                window.removeEventListener('navigation-blocked', handleGlobalNavigation);
            };
        }
    }, [canDetectChanges, hasUnsavedChanges]);

    // ✅ AJOUT: Debug: Afficher l'état des modifications
    useEffect(() => {
        console.log('🔍 État modifications PaiementForm:', {
            guardId,
            hasUnsavedChanges,
            canDetectChanges: canDetectChanges(),
            isFullyInitialized,
            isInitialLoadDone,
            showGlobalModal,
            mode,
            isLoading,
            isSubmitting,
            initialDataKeys: Object.keys(initialFormData),
            currentDataKeys: Object.keys(getFormData()),
            paiementData: {
                factureId: paiement.factureId,
                montantPaye: paiement.montantPaye,
                methodePaiement: paiement.methodePaiement
            }
        });
    }, [guardId, hasUnsavedChanges, canDetectChanges, isFullyInitialized, isInitialLoadDone, showGlobalModal, mode, isLoading, isSubmitting, initialFormData, paiement]);
    
    // Charger les informations utilisateur depuis les logs d'activité
    const chargerLogsUtilisateur = async (paiementId) => {
        if (!paiementId) return;
        
        setLogsLoading(true);
        
        try {
            console.log('📋 Chargement des logs pour le paiement:', paiementId);
            
            const logsResponse = await activityLogsService.getLogs({
                entity_type: 'paiement',
                entity_id: paiementId,
                action_type: `${LOG_ACTIONS.PAIEMENT_CREATE},${LOG_ACTIONS.PAIEMENT_UPDATE},${LOG_ACTIONS.PAIEMENT_CANCEL}`
            });
            
            if (logsResponse.success && logsResponse.logs) {
                const logs = logsResponse.logs;
                
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
        } finally {
            setLogsLoading(false);
        }
    };
    
    const extractUserName = (log) => {
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
    
    // Charger un paiement
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

                const factureData = await factureService.getFacture(paiementData.factureId);
                if (factureData) {
                    setFactureSelectionnee(factureData);
                }
                
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
    
    // ✅ MODIFICATION: Gestionnaires de changement avec logging
    const handleInputChange = (field, value) => {
        if (isReadOnly || isPaiementAnnule) return;
        
        console.log('📝 PaiementForm handleInputChange:', { field, value, mode });
        
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
    
    // Validation du formulaire
    const validateForm = () => {
        if (!paiement.factureId) {
            setError(VALIDATION_MESSAGES.FACTURE_REQUIRED);
            return false;
        }
        
        const dateValidation = validateDatePaiement(paiement.datePaiement);
        if (!dateValidation.isValid) {
            setError(dateValidation.error);
            return false;
        }
        
        const montant = parseFloat(paiement.montantPaye);
        if (!montant || montant <= 0) {
            setError(VALIDATION_MESSAGES.MONTANT_REQUIRED);
            return false;
        }
        
        if (!paiement.methodePaiement) {
            setError(VALIDATION_MESSAGES.METHODE_REQUIRED);
            return false;
        }
        
        if (factureSelectionnee && isCreate) {
            const montantRestant = factureSelectionnee.montantRestant || 
                (factureSelectionnee.totalAvecRistourne - (factureSelectionnee.montantPayeTotal || 0));
            
            if (montant > montantRestant + 0.01) {
                setError(VALIDATION_MESSAGES.MONTANT_SUPERIEUR);
                return false;
            }
        }
        
        return true;
    };

    // ✅ AJOUT: Fonction pour gérer une sauvegarde réussie
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
                if (result.success) {
                    handleSuccessfulSave(result.id, result.message || NOTIFICATIONS.SUCCESS.CREATE);
                }
            } else if (canEdit) {
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
    };
    
    // ✅ MODIFICATION: Gestion du retour avec protection
    const handleCancel = () => {
        // En mode VIEW, navigation directe sans protection
        if (mode === FORM_MODES.VIEW) {
            console.log('🔙 Navigation directe en mode VIEW (PaiementForm)');
            unregisterGuard(guardId);
            
            if (onRetourListe) {
                onRetourListe();
            }
            return;
        }

        // Pour les paiements annulés, navigation directe
        if (isPaiementAnnule) {
            console.log('🔙 Navigation directe pour paiement annulé (PaiementForm)');
            unregisterGuard(guardId);
            
            if (onRetourListe) {
                onRetourListe();
            }
            return;
        }

        console.log('🔍 État avant navigation Retour PaiementForm:', {
            hasUnsavedChanges,
            canDetectChanges: canDetectChanges(),
            mode,
            isSubmitting
        });

        // Vérification directe : si pas de modifications, naviguer directement
        if (!hasUnsavedChanges || !canDetectChanges()) {
            console.log('✅ Aucune modification détectée, navigation directe (PaiementForm)');
            unregisterGuard(guardId);
            
            if (onRetourListe) {
                onRetourListe();
            }
            return;
        }

        // Pour les modes EDIT et CREATE avec modifications, utiliser la protection
        const canNavigate = requestNavigation(() => {
            console.log('🔙 Navigation retour autorisée PaiementForm');
            unregisterGuard(guardId);
            
            if (onRetourListe) {
                onRetourListe();
            }
        });

        if (!canNavigate) {
            console.log('🔒 Navigation retour bloquée par des modifications non sauvegardées (PaiementForm)');
        }
    };

    // ✅ AJOUT: Gérer la confirmation de navigation externe
    const handleConfirmGlobalNavigation = () => {
        console.log('✅ Confirmation navigation externe PaiementForm');
        setShowGlobalModal(false);
        
        unregisterGuard(guardId);
        
        if (globalNavigationCallback) {
            globalNavigationCallback();
            setGlobalNavigationCallback(null);
        }
    };

    // ✅ AJOUT: Gérer l'annulation de navigation externe
    const handleCancelGlobalNavigation = () => {
        console.log('❌ Annulation navigation externe PaiementForm');
        setShowGlobalModal(false);
        setGlobalNavigationCallback(null);
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
    
    // Formater les informations utilisateur pour l'affichage
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

    // ✅ AJOUT: Cleanup lors du démontage
    useEffect(() => {
        return () => {
            if (mode !== FORM_MODES.VIEW && !isPaiementAnnule) {
                console.log(`🧹 Nettoyage ${guardId} lors du démontage`);
                unregisterGuard(guardId);
                resetChanges();
                setIsFullyInitialized(false);
            }
        };
    }, [mode, guardId, unregisterGuard, resetChanges, isPaiementAnnule]);
    
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
            <div className="content-section-title">
                <h2>{getTitre()}</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="paiement-form">
                <div className="paiement-form-container">
                    
                    {/* ✅ BADGE D'ÉTAT EN TAILLE NORMALE DANS LE CONTENEUR */}
                    {paiement.etat && (
                        <div className="paiement-etat-badge-container">
                            <span className={getBadgeClasses(paiement.etat, 'normal')}>
                                {formatEtatText(paiement.etat)}
                            </span>
                        </div>
                    )}
                    
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
                            {/* Champ date avec icône FiCalendar */}
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
                                    <FiCalendar 
                                        className="calendar-icon"
                                        onClick={handleOpenDateModal}
                                        title={LABELS.OPEN_DATE_CALENDAR}
                                        size={16}
                                    />
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
                    
                    {/* Section: Informations système avec données utilisateur */}
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
                            className={isReadOnly || isPaiementAnnule ? "btn-primary" : "btn-secondary"}
                            disabled={isSubmitting}
                        >
                            {isReadOnly || isPaiementAnnule ? BUTTON_TEXTS.BACK : BUTTON_TEXTS.CANCEL}
                        </button>
                    </div>
                </div>
            </form>

            {/* ✅ AJOUT: Modal pour les modifications non sauvegardées (navigation locale via bouton Annuler) */}
            <ConfirmationModal
                isOpen={showUnsavedModal}
                title="Modifications non sauvegardées"
                message="Vous avez des modifications non sauvegardées dans le formulaire de paiement. Souhaitez-vous vraiment quitter sans sauvegarder ?"
                type="warning"
                onConfirm={confirmNavigation}
                onCancel={cancelNavigation}
                confirmText="Quitter sans sauvegarder"
                cancelText="Continuer l'édition"
                singleButton={false}
            />

            {/* ✅ AJOUT: Modal pour les modifications non sauvegardées (navigation externe via menu/déconnexion) */}
            <ConfirmationModal
                isOpen={showGlobalModal}
                title="Modifications non sauvegardées"
                message="Vous avez des modifications non sauvegardées dans le formulaire de paiement. Souhaitez-vous vraiment quitter sans sauvegarder ?"
                type="warning"
                onConfirm={handleConfirmGlobalNavigation}
                onCancel={handleCancelGlobalNavigation}
                confirmText="Quitter sans sauvegarder"
                cancelText="Continuer l'édition"
                singleButton={false}
            />
        </div>
    );
}

export default PaiementForm;