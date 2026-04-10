import { useEffect } from 'react';
import { getTodayIso } from '../../../utils/dateHelpers';
import { formatDate } from '../../../utils/formatters';
import { createLogger } from '../../../utils/createLogger';
import { 
    VALIDATION_MESSAGES, 
    NOTIFICATIONS, 
    LOG_ACTIONS,
    LABELS,
    DEFAULT_VALUES
} from '../../../constants/paiementConstants';
import activityLogsService from '../../../services/activityLogsService';
import authService from '../../../services/authService';

// ✅ CACHE GLOBAL pour les utilisateurs
const usersCache = new Map();

export const usePaiementFormLogic = (formState) => {
    const {
        paiement, setPaiement, factures, setFactures, factureSelectionnee, setFactureSelectionnee,
        logsInfo, setLogsInfo, isLoading, setIsLoading, error, setError, logsLoading, setLogsLoading,
        facturesLoading, setFacturesLoading, isCreate, isEdit, mode, idPaiement,
        paiementActions, factureActions, clientActions, loyerActions,
        clients, setClients, clientsLoading, setClientsLoading, clientSelectionne, setClientSelectionne,
        loyers, setLoyers, loyersLoading, setLoyersLoading, setLoyerSelectionne,
        setIsInitialLoadDone, setIsFullyInitialized,
        getFormData, setInitialFormData
    } = formState;
    
    const logLine = createLogger('usePaiementFormLogic');

    // ✅ FONCTION DE CACHE pour les utilisateurs
    const getCachedUserDetails = async (userId) => {
        if (usersCache.has(userId)) {
            logLine.debug(`📦 Cache HIT pour utilisateur ${userId}`);
            return usersCache.get(userId);
        }
        
        logLine.debug(`🌐 Cache MISS pour utilisateur ${userId} - Appel API`);
        try {
            const userResponse = await authService.getUserById(userId);
            
            logLine.debug(`📥 DEBUG - Réponse authService.getUserById(${userId}):`, userResponse);
            
            if (userResponse.success && userResponse.utilisateur) {
                const userDetails = {
                    prenom: userResponse.utilisateur.prenom || '',
                    nom: userResponse.utilisateur.nom || '',
                    username: userResponse.utilisateur.username || 'Username manquant'
                };
                
                logLine.debug(`✅ Utilisateur ${userId} mis en cache:`, userDetails);
                usersCache.set(userId, userDetails);
                return userDetails;
            } else {
                logLine.debug(`❌ API failed - success: ${userResponse.success}, hasUtilisateur: ${!!userResponse.utilisateur}`);
                const fallbackDetails = { prenom: '', nom: '', username: 'API Failed' };
                usersCache.set(userId, fallbackDetails);
                return fallbackDetails;
            }
        } catch (error) {
            logLine.error(`❌ Exception getUserById(${userId}):`, error);
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
            logLine.debug('🚀 Début loadData:', { mode, idPaiement, isEdit, isCreate });
            if (isEdit || mode === 'view') {
                logLine.debug('📥 Appel chargerPaiement pour:', idPaiement);
                await chargerPaiement();
            }
            if (isCreate) {
                logLine.debug('📋 Mode création - chargement clients');
                await chargerClients();
                // Factures et loyers seront chargés quand le client sera sélectionné
                setPaiement(prev => {
                    if (prev.idClient) return prev;
                    return {
                        ...prev,
                        idClient: '',
                        idFacture: '',
                        idLoyer: '',
                        datePaiement: getTodayIso(),
                        montantPaye: '',
                        methodePaiement: DEFAULT_VALUES.METHODE_PAIEMENT,
                        commentaire: ''
                    };
                });
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
            logLine.debug('❌ Pas de idPaiement:', idPaiement);
            return;
        }
        logLine.debug('🔄 Début chargement paiement:', idPaiement);
        setIsLoading(true);
        setError(null);
        
        try {
            logLine.debug('🌐 Appel API paiementActions.getPaiement avec ID:', idPaiement);
            const paiementData = await paiementActions.getPaiement(idPaiement);
            logLine.debug('🔥 Données brutes reçues:', paiementData);
            if (paiementData) {
                const newPaiement = {
                    // IDs
                    idPaiement: paiementData.idPaiement,
                    idFacture: paiementData.idFacture,
                    idClient: paiementData.idClient,
                    
                    // Numéros
                    numeroPaiement: paiementData.numeroPaiement,
                    numeroFacture: paiementData.numeroFacture,
                    
                    // Client
                    nomClient: paiementData.nomClient,  // ✅ AJOUTÉ
                    
                    // Détails du paiement
                    datePaiement: paiementData.datePaiement,
                    montantPaye: paiementData.montantPaye.toString(),
                    methodePaiement: paiementData.methodePaiement,
                    commentaire: paiementData.commentaire || '',
                    
                    // Loyer (si paiement lié à un loyer)
                    idLoyer: paiementData.idLoyer || null,
                    idLoyerDetail: paiementData.idLoyerDetail || null,
                    numeroLoyer: paiementData.numeroLoyer || null,
                    periodeDebut: paiementData.periodeDebut || null,
                    periodeFin: paiementData.periodeFin || null,
                    dureeMois: paiementData.dureeMois || null,
                    loyerMontantTotal: paiementData.loyerMontantTotal || null,
                    montantMensuelMoyen: paiementData.montantMensuelMoyen || null,
                    loyerStatut: paiementData.loyerStatut || null,
                    loyerMontantPaye: paiementData.loyerMontantPaye || null,
                    loyerMois: paiementData.loyerMois || null,
                    loyerNumeroMois: paiementData.loyerNumeroMois || null,
                    loyerAnnee: paiementData.loyerAnnee || null,
                    loyerDetailMontant: paiementData.loyerDetailMontant || null,
                    loyerDetailPaye: paiementData.loyerDetailPaye || null,

                    // État
                    etat: paiementData.statut,
                    statut: paiementData.statut,  // Garder les deux pour compatibilité
                    
                    // Dates système
                    dateCreation: paiementData.dateCreation || '',
                    dateModification: paiementData.dateModification || '',
                    dateAnnulation: paiementData.dateAnnulation || '',
                    
                    // Annulation
                    motifAnnulation: paiementData.motifAnnulation || '',
                    
                    // Infos facture (si présente)
                    montantTotalFacture: paiementData.montantTotalFacture || 0,
                    ristourneFacture: paiementData.ristourneFacture || 0
                };
                
                logLine.debug('🎯 Nouvel état paiement:', newPaiement);
                setPaiement(newPaiement);
                
                // ✅ AMÉLIORATION: Chargement de la facture avec plus de debug
                if (paiementData.idFacture) {
                    logLine.debug('🔄 Chargement facture:', paiementData.idFacture);
                    logLine.debug('🔍 Type idFacture:', typeof paiementData.idFacture);
                    
                    try {
                        const factureData = await factureActions.chargerFacture(paiementData.idFacture);
                        logLine.debug('🔥 Données facture reçues:', factureData);
                        
                        if (factureData) {
                            logLine.debug('✅ Facture chargée avec succès:', {
                                idFacture: factureData.idFacture,
                                numero: factureData.numeroFacture,
                                client: factureData.client,
                                montant: factureData.totalAvecRistourne
                            });
                            setFactureSelectionnee(factureData);
                        } else {
                            logLine.debug('❌ Aucune donnée de facture retournée');
                            setError('Impossible de charger les détails de la facture');
                        }
                    } catch (factureError) {
                        logLine.error('❌ Erreur lors du chargement de la facture:', factureError);
                        setError('Erreur lors du chargement de la facture: ' + factureError.message);
                    }
                } else {
                    logLine.debug('⚠️ Aucun idFacture dans les données du paiement');
                    logLine.debug('⚠️ Données complètes du paiement:', paiementData);
                }
                
                await chargerLogsUtilisateur(idPaiement);
            } else {
                logLine.debug('❌ Aucune donnée de paiement reçue');
                setError(VALIDATION_MESSAGES.PAIEMENT_NON_TROUVE);
            }
        } catch (error) {
            logLine.error('❌ Erreur lors du chargement du paiement:', error);
            setError(NOTIFICATIONS.ERROR.LOAD + ': ' + error.message);
        } finally {
            setIsLoading(false);
            logLine.debug('✅ Fin chargement paiement');
        }
    };
    

    // CLIENT-FIRST : Chargement de la liste des clients
    const chargerClients = async () => {
        setClientsLoading(true);
        try {
            logLine.debug('🔄 Chargement des clients...');
            const clientsData = await clientActions.chargerClients();
            logLine.debug('📥 Clients reçus:', clientsData?.length || 0);
            setClients(clientsData || []);
        } catch (error) {
            logLine.error('❌ Erreur lors du chargement des clients:', error);
            setClients([]);
        } finally {
            setClientsLoading(false);
        }
    };

    // Chargement des factures impayées d'un client spécifique
    const chargerFacturesDuClient = async (idClient) => {
        if (!idClient) { setFactures([]); return; }
        setFacturesLoading(true);
        try {
            logLine.debug('🔄 Chargement factures du client:', idClient);
            const facturesPayables = await factureActions.chargerFacturesPayables();
            if (!facturesPayables || facturesPayables.length === 0) {
                setFactures([]); return;
            }
            // Enrichir et filtrer par client
            const facturesEnrichies = await Promise.all(
                facturesPayables.map(async (facture) => {
                    try {
                        const factureComplete = await factureActions.chargerFacture(facture.id || facture.idFacture);
                        if (!factureComplete) return null;
                        return {
                            ...facture,
                            idFacture: facture.id || facture.idFacture,
                            montantRestant: factureComplete.montantRestant ||
                                (factureComplete.totalAvecRistourne - (factureComplete.montantPayeTotal || 0)),
                            totalAvecRistourne: factureComplete.totalAvecRistourne,
                            montantPayeTotal: factureComplete.montantPayeTotal || 0,
                            client: factureComplete.client
                        };
                    } catch { return null; }
                })
            );
            const filtrees = facturesEnrichies.filter(f => {
                if (!f) return false;
                const idClient = String(f.client?.id || f.client?.idClient || f.idClient || '');
                if (idClient !== String(idClient)) return false;
                const restant = f.montantRestant || 0;
                return restant > 0;
            });
            logLine.debug(`✅ ${filtrees.length} facture(s) impayée(s) pour client ${idClient}`);
            setFactures(filtrees);
        } catch (error) {
            logLine.error('❌ Erreur chargement factures client:', error);
            setFactures([]);
        } finally {
            setFacturesLoading(false);
        }
    };

    // Chargement des loyers non soldés d'un client spécifique
    const chargerLoyersDuClient = async (idClient) => {
        if (!idClient) { setLoyers([]); return; }
        setLoyersLoading(true);
        try {
            logLine.debug('🔄 Chargement loyers du client:', idClient);
            const tous = await loyerActions.chargerLoyers({ idClient: idClient });
            // Garder uniquement les loyers :
            // - non soldés
            // - sans facture liée (les loyers avec id_facture se paient via la facture)
            const nonSoldes = (tous || []).filter(l => {
                const statut = l.statut || l.etat || '';
                const estSolde = statut === 'solde' || statut === 'soldé';
                const aFactureLiee = !!l.idFacture;
                return !estSolde && !aFactureLiee;
            });

            logLine.debug('🔍 [chargerLoyersDuClient] tous les loyers reçus:', tous);
            logLine.debug('🔍 [chargerLoyersDuClient] loyer[0] complet:', tous?.[0]);
            logLine.debug('🔍 [chargerLoyersDuClient] montantsMensuels[0][0]:', 
            tous?.[0]?.montantsMensuels?.[0]);
            logLine.debug('🔍 [chargerLoyersDuClient] clés mois[0]:', 
            Object.keys(tous?.[0]?.montantsMensuels?.[0] || {}));
            
            logLine.debug(`✅ ${nonSoldes.length} loyer(s) non soldé(s) pour client ${idClient}`);
            setLoyers(nonSoldes);
        } catch (error) {
            logLine.error('❌ Erreur chargement loyers client:', error);
            setLoyers([]);
        } finally {
            setLoyersLoading(false);
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
            logLine.debug('chargerLogsUtilisateur - getLogs - logsResponse:', logsResponse);
            
            if (logsResponse.success && logsResponse.logs) {
                const logs = logsResponse.logs;
                logs.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                
                const enrichedLogs = [];
                
                for (const log of logs) {
                    logLine.debug("chargerLogsUtilisateur - ligne de log : ", log);
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
                    
                    logLine.debug(`📄 DEBUG - Log enrichi:`, {
                        action: actionLabel,
                        userName: userName,
                        date: log.created_at,
                        hasDetails: !!modificationDetails,
                        details: modificationDetails
                    });
                }
                
                const newLogsInfo = {
                    allLogs: enrichedLogs // Tous les logs enrichis
                };
                
                logLine.debug('📊 DEBUG - Tous les logs enrichis:', enrichedLogs);
                setLogsInfo(newLogsInfo);
            }
        } catch (error) {
            logLine.error('❌ Erreur lors du chargement des logs utilisateur:', error);
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
            logLine.error('❌ Erreur parsing détails:', error);
            return null;
        }
    };

    // ✅ FONCTION pour traduire les noms de champs — ajout idClient
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
            'idFacture': LABELS.FACTURE,
            'idClient': LABELS.CLIENT || 'Client',
            'idClient': LABELS.CLIENT || 'Client'
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
                return formatDate(value, 'date');
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
        return paiementActions.formatMethodePaiement(methode);
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
        chargerClients,
        chargerFacturesDuClient,
        chargerLoyersDuClient,
        chargerLogsUtilisateur,
        extractUserName,
        getCachedUserDetails,
        clearUsersCache: () => { usersCache.clear(); },
        getCacheStats: () => ({ size: usersCache.size, users: Array.from(usersCache.keys()) })
    };
};