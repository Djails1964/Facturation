import { useEffect } from 'react';
import DateService from '../../../utils/DateService';
import { 
    VALIDATION_MESSAGES, 
    NOTIFICATIONS, 
    LOG_ACTIONS,
    METHODES_PAIEMENT_LABELS,  // ✅ AJOUT
    LABELS,
    DEFAULT_VALUES     // ✅ AJOUT
} from '../../../constants/paiementConstants';
import activityLogsService from '../../../services/activityLogsService';
import authService from '../../../services/authService';
import PaiementService from '../../../services/PaiementService';

// ✅ CACHE GLOBAL pour les utilisateurs
const usersCache = new Map();

export const usePaiementFormLogic = (formState) => {
    const {
        paiement, setPaiement, factures, setFactures, factureSelectionnee, setFactureSelectionnee,
        logsInfo, setLogsInfo, isLoading, setIsLoading, error, setError, logsLoading, setLogsLoading,
        facturesLoading, setFacturesLoading, isCreate, isEdit, mode, idPaiement,
        paiementService, factureService, setIsInitialLoadDone, setIsFullyInitialized,
        getFormData, setInitialFormData
    } = formState;
    
    // ✅ FONCTION DE CACHE pour les utilisateurs
    const getCachedUserDetails = async (userId) => {
        if (usersCache.has(userId)) {
            console.log(`📦 Cache HIT pour utilisateur ${userId}`);
            return usersCache.get(userId);
        }
        
        console.log(`🌐 Cache MISS pour utilisateur ${userId} - Appel API`);
        try {
            const userResponse = await authService.getUserById(userId);
            
            console.log(`📥 DEBUG - Réponse authService.getUserById(${userId}):`, userResponse);
            
            if (userResponse.success && userResponse.utilisateur) { // ✅ CORRECTION: utilisateur au lieu de user
                const userDetails = {
                    prenom: userResponse.utilisateur.prenom || '', // ✅ CORRECTION: utilisateur.prenom
                    nom: userResponse.utilisateur.nom || '',       // ✅ CORRECTION: utilisateur.nom
                    username: userResponse.utilisateur.username || 'Username manquant' // ✅ CORRECTION: utilisateur.username
                };
                
                console.log(`✅ Utilisateur ${userId} mis en cache:`, userDetails);
                usersCache.set(userId, userDetails);
                return userDetails;
            } else {
                console.log(`❌ API failed - success: ${userResponse.success}, hasUtilisateur: ${!!userResponse.utilisateur}`);
                const fallbackDetails = { prenom: '', nom: '', username: 'API Failed' };
                usersCache.set(userId, fallbackDetails);
                return fallbackDetails;
            }
        } catch (error) {
            console.error(`❌ Exception getUserById(${userId}):`, error);
            const fallbackDetails = { prenom: '', nom: '', username: 'Exception: ' + error.message };
            usersCache.set(userId, fallbackDetails);
            return fallbackDetails;
        }
    };
    
    // ✅ FONCTION pour formater les noms avec cache
    const formatUserNameWithCache = async (log) => {
        if (log.user_id) {
            const userDetails = await getCachedUserDetails(log.user_id);
            
            if (userDetails.prenom || userDetails.nom) {
                return `${userDetails.prenom} ${userDetails.nom}`.trim();
            } else {
                return userDetails.username;
            }
        }
        
        // Fallback sur l'ancienne méthode
        return extractUserName(log);
    };
    
    // Chargement initial
    useEffect(() => {
        const loadData = async () => {
            console.log('🚀 Début loadData:', { mode, idPaiement, isEdit, isCreate });
            if (isEdit || mode === 'view') {
                console.log('📥 Appel chargerPaiement pour:', idPaiement);
                await chargerPaiement();
            }
            if (isCreate) {
                console.log('📋 Mode création - chargement factures');
                await chargerFactures();
                setPaiement(prev => ({
                    ...prev,
                    idFacture: '',
                    datePaiement: DateService.getTodayInputFormat(),
                    montantPaye: '',
                    // ✅ AJOUT : Initialisation par défaut avec virement bancaire
                    methodePaiement: DEFAULT_VALUES.METHODE_PAIEMENT,
                    commentaire: ''
                }));
            }
            setIsInitialLoadDone(true);
        };
        loadData();
    }, [idPaiement, mode]);
    
    // Finalisation de l'initialisation
    useEffect(() => {
        if (formState.isInitialLoadDone && !isLoading && !formState.isFullyInitialized) {
            const timer = setTimeout(() => {
                const currentFormData = getFormData();
                const hasValidData = isCreate ? 
                    (currentFormData.datePaiement !== undefined) :
                    (currentFormData.idFacture && currentFormData.datePaiement);
                
                if (hasValidData) {
                    setTimeout(() => {
                        const finalFormData = getFormData();
                        setInitialFormData(finalFormData);
                        setIsFullyInitialized(true);
                    }, 300);
                }
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [formState.isInitialLoadDone, isLoading, formState.isFullyInitialized, getFormData, mode]);
    
    // Fonctions de chargement
    const chargerPaiement = async () => {
        if (!idPaiement) {
            console.log('❌ Pas de idPaiement:', idPaiement);
            return;
        }
        console.log('🔄 Début chargement paiement:', idPaiement);
        setIsLoading(true);
        setError(null);
        
        try {
            console.log('📥 Appel API paiementService.getPaiement avec ID:', idPaiement);
            const paiementData = await paiementService.getPaiement(idPaiement);
            console.log('🔥 Données brutes reçues:', paiementData);
            if (paiementData) {
                const newPaiement = {
                    idFacture: paiementData.idFacture,
                    datePaiement: paiementData.datePaiement,
                    montantPaye: paiementData.montantPaye.toString(),
                    methodePaiement: paiementData.methodePaiement,
                    commentaire: paiementData.commentaire || '',
                    etat: paiementData.statut,
                    dateCreation: paiementData.dateCreation || '',
                    dateModification: paiementData.dateModification || '',
                    dateAnnulation: paiementData.dateAnnulation || ''
                };
                
                console.log('🎯 Nouvel état paiement:', newPaiement);
                setPaiement(newPaiement);
                
                // ✅ AMÉLIORATION: Chargement de la facture avec plus de debug
                if (paiementData.idFacture) {
                    console.log('🔄 Chargement facture:', paiementData.idFacture);
                    console.log('🔍 Type idFacture:', typeof paiementData.idFacture);
                    
                    try {
                        const factureData = await factureService.getFacture(paiementData.idFacture);
                        console.log('🔥 Données facture reçues:', factureData);
                        
                        if (factureData) {
                            console.log('✅ Facture chargée avec succès:', {
                                id: factureData.idFacture,
                                numero: factureData.numeroFacture,
                                client: factureData.client,
                                montant: factureData.totalAvecRistourne
                            });
                            setFactureSelectionnee(factureData);
                        } else {
                            console.log('❌ Aucune donnée de facture retournée');
                            setError('Impossible de charger les détails de la facture');
                        }
                    } catch (factureError) {
                        console.error('❌ Erreur lors du chargement de la facture:', factureError);
                        setError('Erreur lors du chargement de la facture: ' + factureError.message);
                    }
                } else {
                    console.log('⚠️ Aucun idFacture dans les données du paiement');
                    console.log('⚠️ Données complètes du paiement:', paiementData);
                }
                
                await chargerLogsUtilisateur(idPaiement);
            } else {
                console.log('❌ Aucune donnée de paiement reçue');
                setError(VALIDATION_MESSAGES.PAIEMENT_NON_TROUVE);
            }
        } catch (error) {
            console.error('❌ Erreur lors du chargement du paiement:', error);
            setError(NOTIFICATIONS.ERROR.LOAD + ': ' + error.message);
        } finally {
            setIsLoading(false);
            console.log('✅ Fin chargement paiement');
        }
    };
    
    const chargerFactures = async () => {
        if (!isCreate) return;
        setFacturesLoading(true);
        
        try {
            console.log('🔄 Chargement des factures payables...');
            
            // ✅ CORRECTION: Utiliser getFacturesPayables au lieu de chargerFactures + filtrage manuel
            const facturesPayables = await factureService.getFacturesPayables();
            
            console.log('📋 Factures payables reçues:', facturesPayables);
            console.log('📊 Nombre de factures:', facturesPayables?.length || 0);
            
            if (!facturesPayables || facturesPayables.length === 0) {
                console.warn('⚠️ Aucune facture payable trouvée');
                setFactures([]);
                return;
            }
            
            // Enrichir chaque facture avec les détails complets
            const facturesEnrichies = await Promise.all(
                facturesPayables.map(async (facture) => {
                    try {
                        const factureComplete = await factureService.getFacture(facture.id || facture.idFacture);
                        if (factureComplete) {
                            return {
                                ...facture,
                                id: facture.id || facture.idFacture, // S'assurer qu'on a un ID
                                idFacture: facture.id || facture.idFacture, // Compatibilité
                                montantRestant: factureComplete.montantRestant || 
                                    (factureComplete.totalAvecRistourne - (factureComplete.montantPayeTotal || 0)),
                                totalAvecRistourne: factureComplete.totalAvecRistourne,
                                montantPayeTotal: factureComplete.montantPayeTotal || 0,
                                client: factureComplete.client // S'assurer d'avoir les infos client
                            };
                        }
                        return facture;
                    } catch (error) {
                        console.error(`Erreur lors de l'enrichissement de la facture ${facture.id || facture.idFacture}:`, error);
                        return facture;
                    }
                })
            );
            
            // Filtrer les factures avec un montant restant > 0
            const facturesAvecMontantRestant = facturesEnrichies.filter(facture => {
                const montantRestant = facture.montantRestant || 
                    (facture.montantTotal - (facture.montantPayeTotal || 0));
                return montantRestant > 0;
            });
            
            console.log('✅ Factures enrichies et filtrées:', facturesAvecMontantRestant);
            setFactures(facturesAvecMontantRestant);
            
        } catch (error) {
            console.error('❌ Erreur lors du chargement des factures:', error);
            setError('Impossible de charger les factures: ' + error.message);
            setFactures([]);
        } finally {
            setFacturesLoading(false);
        }
    };
    
    // ✅ FONCTION DE CHARGEMENT DES LOGS AVEC CACHE
    const chargerLogsUtilisateur = async (idPaiement) => {
        if (!idPaiement) return;
        setLogsLoading(true);
        
        try {
            const logsResponse = await activityLogsService.getLogs({
                entity_type: 'paiement',
                entity_id: idPaiement,
                action_type: `${LOG_ACTIONS.PAIEMENT_CREATE},${LOG_ACTIONS.PAIEMENT_UPDATE},${LOG_ACTIONS.PAIEMENT_CANCEL}`
            });
            console.log('chargerLogsUtilisateur - getLogs - logsResponse:', logsResponse);
            
            if (logsResponse.success && logsResponse.logs) {
                const logs = logsResponse.logs;
                logs.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)); // ✅ CHANGEMENT: Tri chronologique (ancien -> récent)
                
                // ✅ NOUVELLE STRUCTURE: Liste de tous les logs avec détails
                const enrichedLogs = [];
                
                for (const log of logs) {
                    const userName = await formatUserNameWithCache(log);
                    const actionLabel = getActionLabel(log.action_type);
                    const modificationDetails = parseModificationDetails(log.details);
                    
                    enrichedLogs.push({
                        action: actionLabel,
                        userName: userName,
                        date: log.created_at,
                        details: modificationDetails,
                        actionType: log.action_type
                    });
                    
                    console.log(`🔄 DEBUG - Log enrichi:`, {
                        action: actionLabel,
                        userName: userName,
                        date: log.created_at,
                        hasDetails: !!modificationDetails,
                        details: modificationDetails
                    });
                }
                
                // ✅ NOUVELLE STRUCTURE pour les logs info
                const newLogsInfo = {
                    allLogs: enrichedLogs // Tous les logs enrichis
                };
                
                console.log('📊 DEBUG - Tous les logs enrichis:', enrichedLogs);
                setLogsInfo(newLogsInfo);
            }
        } catch (error) {
            console.error('❌ Erreur lors du chargement des logs utilisateur:', error);
        } finally {
            setLogsLoading(false);
        }
    };

    // ✅ NOUVELLE FONCTION pour traduire les actions
    const getActionLabel = (actionType) => {
        const labels = {
            [LOG_ACTIONS.PAIEMENT_CREATE]: 'Créé par',
            [LOG_ACTIONS.PAIEMENT_UPDATE]: 'Modifié par',
            [LOG_ACTIONS.PAIEMENT_CANCEL]: 'Annulé par'
        };
        return labels[actionType] || 'Action par';
    };

    // ✅ NOUVELLE FONCTION pour parser les détails
    const parseModificationDetails = (details) => {
        if (!details) return null;
        
        try {
            const parsedDetails = typeof details === 'string' ? JSON.parse(details) : details;
            
            if (!parsedDetails.changes) return null;
            
            const changes = [];
            Object.entries(parsedDetails.changes).forEach(([field, change]) => {
                if (change && typeof change === 'object') {
                    let oldValue, newValue;
                    
                    if (change.ancien !== undefined && change.nouveau !== undefined) {
                        oldValue = change.ancien;
                        newValue = change.nouveau;
                    } else if (change.old !== undefined && change.new !== undefined) {
                        oldValue = change.old;
                        newValue = change.new;
                    }
                    
                    if (oldValue !== undefined && newValue !== undefined) {
                        changes.push({
                            field: translateFieldName(field),
                            oldValue: formatFieldValue(field, oldValue),
                            newValue: formatFieldValue(field, newValue)
                        });
                    }
                }
            });
            
            return changes.length > 0 ? changes : null;
        } catch (error) {
            console.error('❌ Erreur parsing détails:', error);
            return null;
        }
    };

    // ✅ FONCTION pour traduire les noms de champs
    const translateFieldName = (field) => {
        const translations = {
            'date_paiement': LABELS.DATE_PAIEMENT,
            'datePaiement': LABELS.DATE_PAIEMENT,
            'montant_paye': LABELS.MONTANT_PAYE,
            'montantPaye': LABELS.MONTANT_PAYE,
            'methode_paiement': LABELS.METHODE_PAIEMENT,
            'methodePaiement': LABELS.METHODE_PAIEMENT,
            'commentaire': LABELS.COMMENTAIRE,
            'facture_id': LABELS.FACTURE,
            'idFacture': LABELS.FACTURE
        };
        return translations[field] || field;
    };

    // ✅ FONCTION pour formater les valeurs
    const formatFieldValue = (field, value) => {
        if (value === null || value === undefined || value === '') {
            return '(vide)';
        }
        
        // Normaliser le nom du champ
        const normalizedField = field.replace('_', '');
        
        switch (normalizedField) {
            case 'datepaiement':
            case 'datePaiement':
                return DateService.formatSingleDate(value, 'date');
            case 'montantpaye':
            case 'montantPaye':
                return `${value} CHF`;
            case 'methodepaiement':
            case 'methodePaiement':
                return formatMethodePaiement(value);
            default:
                return String(value);
        }
    };

    // ✅ FONCTION pour formater les méthodes de paiement
    const formatMethodePaiement = (methode) => {
        const paiementService = new PaiementService();
        return paiementService.formatMethodePaiement(methode);
    };
    
    const extractUserName = (log) => {
        if (log.user_name && log.user_name.trim()) return log.user_name.trim();
        if (log.user_firstname && log.user_lastname) return `${log.user_firstname.trim()} ${log.user_lastname.trim()}`;
        if (log.user_email && log.user_email.trim()) return log.user_email.trim();
        if (log.username && log.username.trim()) return log.username.trim();
        if (log.user_id) return `User ID: ${log.user_id}`;
        return 'Utilisateur inconnu';
    };
    
    return {
        chargerPaiement,
        chargerFactures,
        chargerLogsUtilisateur,
        extractUserName,
        // Fonctions de cache exposées
        getCachedUserDetails,
        clearUsersCache: () => {
            usersCache.clear();
            console.log('🧹 Cache utilisateurs vidé');
        },
        getCacheStats: () => ({
            size: usersCache.size,
            users: Array.from(usersCache.keys())
        })
    };
};