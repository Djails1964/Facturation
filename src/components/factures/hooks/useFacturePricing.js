import { useState, useCallback, useRef, useEffect } from 'react';
import { useApiCall } from '../../../hooks/useApiCall';
import { createLogger } from '../../../utils/createLogger';

/**
 * Hook personnalisé pour la gestion des calculs de prix dans les factures
 * VERSION ARCHITECTURE UNIFIÉE - Une seule fonction principale pour tous les calculs
 * CORRIGÉ pour forcer le recalcul lors des changements de service
 */
export function useFacturePricing(
    client,
    tarifActions,
    services,
    unites,
    lignes,
    modifierLigne,
    prixModifiesManuel
) {

    const log = createLogger("useFacturePricing");

    // ✅ Hook API centralisé
    const { execute: executeApi } = useApiCall();

    // États pour le suivi des calculs
    const [isCalculating, setIsCalculating] = useState(false);
    const [lastCalculation, setLastCalculation] = useState({});
    
    // Références pour éviter les calculs multiples
    const calculationCache = useRef(new Map());
    const calculationPromises = useRef(new Map());
    const initialPriceCalculationDone = useRef(null); // Stocke l'ID client
    
    /**
     * FONCTION PRINCIPALE UNIFIÉE: Calcul du prix pour un client
     */
    const calculerPrixPourClient = useCallback(async (params) => {
        const { idClient, idService, idUnite, forceRecalcul = false } = params;

        log.debug('Calcul prix pour client appelé avec:', { idClient, idService, idUnite, forceRecalcul });
        
        // Validation stricte des paramètres
        if (!idClient || !idService || !idUnite) {
            log.warn('Paramètres manquants pour calculerPrixPourClient:', { idClient, idService, idUnite });
            return 0;
        }

        if (!tarifActions) {
            log.warn('tarifActions non disponible');
            return 0;
        }

        // Clé de cache
        const cacheKey = `${idClient}-${idService}-${idUnite}`;

        // Vérification cache ou force recalcul
        if (!forceRecalcul) {
            if (calculationCache.current.has(cacheKey)) {
                const cachedResult = calculationCache.current.get(cacheKey);
                const now = Date.now();
                
                if (now - cachedResult.timestamp < 10000) {
                    log.debug(`Prix récupéré du cache: ${cachedResult.prix} CHF pour ${cacheKey}`);
                    return cachedResult.prix;
                } else {
                    calculationCache.current.delete(cacheKey);
                    log.debug(`Cache expiré pour ${cacheKey}, recalcul nécessaire`);
                }
            }
        } else {
            calculationCache.current.delete(cacheKey);
            log.debug(`Force recalcul demandé pour ${cacheKey}`);
        }

        // Protection contre les appels simultanés
        if (calculationPromises.current.has(cacheKey)) {
            log.debug(`Calcul déjà en cours pour ${cacheKey}, attente du résultat...`);
            return await calculationPromises.current.get(cacheKey);
        }

        // Créer la promesse de calcul
        const calculationPromise = (async () => {
            try {
                return await executeApi(
                    async () => {
                        log.debug('🔥 Calcul du prix initial:', {
                            idClient,
                            idService,
                            idUnite,
                            clientNom: client?.nom
                        });

                        const prix = await tarifActions.calculerPrix({
                            idClient,
                            idService,
                            idUnite,
                            date: new Date().toISOString().split('T')[0]
                        });

                        return prix || 0;
                    },
                    (finalPrix) => {
                        log.debug(`✅ Prix calculé: ${finalPrix} CHF pour client ${client?.nom}`);
                        
                        // Mise en cache du résultat
                        calculationCache.current.set(cacheKey, {
                            prix: finalPrix,
                            timestamp: Date.now()
                        });
                    },
                    (error) => {
                        log.error('❌ Erreur calcul prix:', error);
                        // Retourner 0 en cas d'erreur
                        calculationCache.current.set(cacheKey, {
                            prix: 0,
                            timestamp: Date.now()
                        });
                    }
                );
            } finally {
                // Nettoyer la promesse
                calculationPromises.current.delete(cacheKey);
            }
        })();

        // Stocker la promesse
        calculationPromises.current.set(cacheKey, calculationPromise);
        
        return await calculationPromise;
    }, [tarifActions, client, executeApi]);

    /**
     * FONCTION UTILITAIRE: Extraction unifiée des IDs de service et unité
     */
    const extraireIdsLigne = useCallback((ligne, index, nouvellesValeurs = null) => {
        let idService = null;
        let idUnite = null;
        let serviceCode = null;
        let uniteCode = null;

        log.debug(`Extraction IDs ligne ${index}:`, {
            ligne: ligne,
            nouvellesValeurs: nouvellesValeurs
        });

        // EXTRACTION DU SERVICE
        if (nouvellesValeurs?.serviceType) {
            // Nouvelle valeur fournie
            serviceCode = nouvellesValeurs.serviceType;
            const serviceObj = services?.find(s => s.codeService === serviceCode);
            idService = serviceObj?.idService;
            log.debug('Service ID depuis nouvelle valeur:', { serviceCode, idService });
        } else if (nouvellesValeurs?.service && typeof nouvellesValeurs.service === 'object') {
            // Objet service fourni
            idService = nouvellesValeurs.service.idService;
            serviceCode = nouvellesValeurs.service.codeService;
            log.debug('Service ID depuis objet nouvelle valeur:', { serviceCode, idService });
        } else if (ligne.service?.idService) {
            // Objet enrichi
            idService = ligne.service.idService;
            serviceCode = ligne.service.codeService;
            log.debug('Service ID depuis objet enrichi:', { serviceCode, idService });
        } else if (ligne.idService) {
            // ID direct
            idService = ligne.idService;
            log.debug('Service ID depuis propriété directe:', idService);
        } else if (ligne.serviceType && services) {
            // Code service
            serviceCode = ligne.serviceType;
            const serviceObj = services.find(s => s.codeService === serviceCode);
            idService = serviceObj?.idService;
            log.debug('Service ID depuis code service:', { serviceCode, idService });
        }

        // EXTRACTION DE L'UNITÉ
        if (nouvellesValeurs?.unite) {
            // Nouvelle valeur fournie
            if (typeof nouvellesValeurs.unite === 'object') {
                idUnite = nouvellesValeurs.unite.idUnite;
                uniteCode = nouvellesValeurs.unite.code || nouvellesValeurs.unite.codeUnite;
                log.debug('Unité ID depuis objet nouvelle valeur:', { uniteCode, idUnite });
            } else {
                uniteCode = nouvellesValeurs.unite;
                const uniteObj = unites?.find(u => u.code === uniteCode || u.codeUnite === uniteCode);
                idUnite = uniteObj?.idUnite;
                log.debug('Unité ID depuis code nouvelle valeur:', { uniteCode, idUnite });
            }
        } else if (ligne.unite?.idUnite) {
            // Objet enrichi
            idUnite = ligne.unite.idUnite;
            uniteCode = ligne.unite.code || ligne.unite.codeUnite;
            log.debug('Unité ID depuis objet enrichi:', { uniteCode, idUnite });
        } else if (ligne.idUnite) {
            // ID direct
            idUnite = ligne.idUnite;
            log.debug('Unité ID depuis propriété directe:', idUnite);
        } else if (ligne.uniteCode && unites) {
            // Code unité
            uniteCode = ligne.uniteCode;
            const uniteObj = unites.find(u => u.codeUnite === uniteCode || u.code === uniteCode);
            idUnite = uniteObj?.idUnite;
            log.debug('Unité ID depuis uniteCode:', { uniteCode, idUnite });
        } else if (typeof ligne.unite === 'string' && unites) {
            // String unité
            uniteCode = ligne.unite;
            const uniteObj = unites.find(u => u.codeUnite === uniteCode || u.code === uniteCode);
            idUnite = uniteObj?.idUnite;
            log.debug('Unité ID depuis string unité:', { uniteCode, idUnite });
        }

        const result = { idService, idUnite, serviceCode, uniteCode };
        log.debug(`IDs finaux ligne ${index}:`, result);
        return result;
    }, [services, unites]);

    /**
     * FONCTION PRINCIPALE UNIFIÉE: Calcule les prix des lignes selon différentes stratégies
     */
    const calculerPrix = useCallback(async (options = {}) => {
        const {
            mode = 'missing',
            ligneIndex = null,
            nouvellesValeurs = null,
            respecterModificationsManuelles = true,
            forceRecalcul = false  // ✅ AJOUT: Paramètre pour forcer le recalcul
        } = options;

        if (!client || !lignes?.length || !tarifActions || isCalculating) {
            log.debug('Conditions non remplies pour calcul prix:', {
                client: !!client,
                lignes: lignes?.length,
                tarifActions: !!tarifActions,
                isCalculating
            });
            return;
        }

        log.debug(`Calcul prix unifié - Mode: ${mode}`, options);

        // Déterminer les lignes à traiter
        let lignesToProcess = [];
        
        switch (mode) {
            case 'single':
                if (ligneIndex !== null && ligneIndex >= 0 && ligneIndex < lignes.length) {
                    lignesToProcess = [{ ligne: lignes[ligneIndex], index: ligneIndex }];
                }
                break;
                
            case 'missing':
                lignesToProcess = lignes
                    .map((ligne, index) => ({ ligne, index }))
                    .filter(({ ligne, index }) => {
                        const sansPrix = ligne.prixUnitaire === 0 || ligne.prixUnitaire === '' || ligne.prixUnitaire === null || ligne.prixUnitaire === undefined;
                        const pasModifieManuel = !respecterModificationsManuelles || !prixModifiesManuel?.current?.[index];
                        return sansPrix && pasModifieManuel;
                    });
                break;
                
            case 'all':
            case 'client_change':
                lignesToProcess = lignes
                    .map((ligne, index) => ({ ligne, index }))
                    .filter(({ index }) => {
                        return !respecterModificationsManuelles || !prixModifiesManuel?.current?.[index];
                    });
                break;
                
            default:
                log.warn('Mode de calcul inconnu:', mode);
                return;
        }

        if (lignesToProcess.length === 0) {
            log.debug(`Aucune ligne à traiter pour le mode ${mode}`);
            return;
        }

        log.debug(`Traitement de ${lignesToProcess.length} ligne(s) en mode ${mode}`);
        setIsCalculating(true);

        try {
            for (const { ligne, index } of lignesToProcess) {
                try {
                    // EXTRACTION DES IDs UNIFIÉE
                    const ids = extraireIdsLigne(ligne, index, nouvellesValeurs);
                    
                    if (!ids.idService || !ids.idUnite) {
                        log.warn(`IDs manquants ligne ${index}:`, ids);
                        continue;
                    }

                    log.debug(`Calcul prix ligne ${index}:`, {
                        service: ids.serviceCode,
                        unite: ids.uniteCode,
                        ancienPrix: ligne.prixUnitaire
                    });

                    // ✅ CORRECTION: Utiliser forceRecalcul du paramètre options
                    const shouldForceRecalcul = forceRecalcul || mode === 'client_change' || mode === 'all';

                    // CALCUL DU PRIX
                    const nouveauPrix = await calculerPrixPourClient({
                        idClient: client.id,
                        idService: ids.idService,
                        idUnite: ids.idUnite,
                        forceRecalcul: shouldForceRecalcul
                    });


                    // MISE À JOUR PROTÉGÉE
                    // Ne pas mettre à jour si le nouveau prix est 0 et l'ancien est > 0 en mode missing
                    const ancienPrix = parseFloat(ligne.prixUnitaire) || 0;
                    const doitMettreAJour = nouveauPrix >= 0 && 
                                           nouveauPrix !== ancienPrix &&
                                           !(nouveauPrix === 0 && ancienPrix > 0 && mode === 'missing');
                    
                    if (doitMettreAJour) {
                        if (modifierLigne && typeof modifierLigne === 'function') {
                            modifierLigne(index, 'prixUnitaire', nouveauPrix);
                            log.debug(`Prix mis à jour ligne ${index}: ${ancienPrix} → ${nouveauPrix} CHF`);
                        }
                    } else if (nouveauPrix === 0 && ancienPrix > 0) {
                        log.debug(`Prix NON mis à jour ligne ${index}: protection (${ancienPrix} → ${nouveauPrix})`);
                    }

                } catch (error) {
                    log.error(`Erreur calcul ligne ${index}:`, error);
                }

                // Délai entre les lignes pour éviter la surcharge
                if (lignesToProcess.length > 1) {
                    await new Promise(resolve => setTimeout(resolve, 30));
                }
            }
        } catch (error) {
            log.error('Erreur dans calculerPrix:', error);
        } finally {
            setIsCalculating(false);
        }
    }, [client, lignes, tarifActions, isCalculating, calculerPrixPourClient, extraireIdsLigne, modifierLigne, prixModifiesManuel]);

    // FONCTIONS PUBLIQUES SIMPLIFIÉES (wrappers)
    
    const calculerPrixManquants = useCallback(() => {
        return calculerPrix({ mode: 'missing' });
    }, [calculerPrix]);

    const recalculerTousLesPrix = useCallback(() => {
        return calculerPrix({ mode: 'all', respecterModificationsManuelles: true });
    }, [calculerPrix]);

    const recalculerPrixChangementClient = useCallback(() => {
        return calculerPrix({ mode: 'client_change', respecterModificationsManuelles: true });
    }, [calculerPrix]);

    /**
     * ✅ CORRECTION: Fonction avec support du forceRecalcul
     */
    const recalculerPrixLigne = useCallback((index, nouvellesValeurs = null, options = {}) => {
        return calculerPrix({ 
            mode: 'single', 
            ligneIndex: index, 
            nouvellesValeurs,
            respecterModificationsManuelles: false, // Pour une ligne spécifique, on recalcule toujours
            forceRecalcul: options.forceRecalcul || false  // ✅ AJOUT: Support du forceRecalcul
        });
    }, [calculerPrix]);

    /**
     * Calcul du prix pour un service et une unité spécifiques
     */
    const calculerPrixPourServiceUnite = useCallback(async (serviceCode, uniteCode) => {
        if (!client || !serviceCode || !uniteCode || !services || !unites) {
            return 0;
        }

        const service = services.find(s => s.codeService === serviceCode);
        const unite = unites.find(u => u.code === uniteCode || u.codeUnite === uniteCode);

        if (!service || !unite) {
            log.warn('Service ou unité non trouvé:', { serviceCode, uniteCode });
            return 0;
        }

        return await calculerPrixPourClient({
            idClient: client.id,
            idService: service.idService,
            idUnite: unite.idUnite
        });
    }, [client, services, unites, calculerPrixPourClient]);

    /**
     * Vérification si un prix est en cours de calcul
     */
    const isPrixCalculating = useCallback((idService, idUnite) => {
        if (!client) return false;
        const cacheKey = `${client.id}-${idService}-${idUnite}`;
        return calculationPromises.current.has(cacheKey);
    }, [client]);

    /**
     * ✅ CORRECTION: Nettoyage du cache avec option de clé spécifique
     */
    const clearCache = useCallback((specificKey = null) => {
        if (specificKey) {
            calculationCache.current.delete(specificKey);
            calculationPromises.current.delete(specificKey);
            log.debug('Cache vidé pour clé spécifique:', specificKey);
        } else {
            calculationCache.current.clear();
            calculationPromises.current.clear();
            log.debug('Cache des prix entièrement vidé');
        }
    }, []);

    /**
     * ✅ AJOUT: Fonction pour vider le cache d'une combinaison spécifique
     */
    const clearCacheForServiceUnite = useCallback((idService, idUnite) => {
        if (!client) return;
        const cacheKey = `${client.id}-${idService}-${idUnite}`;
        clearCache(cacheKey);
    }, [client, clearCache]);

    /**
     * Obtention du tarif d'information pour un client
     */
    const getTarifInfo = useCallback(async () => {
        if (!client || !tarifActions) {
            return '';
        }

        return new Promise((resolve) => {
            executeApi(
                async () => {
                    log.debug('🔥 Récupération du message de tarif info...');
                    const message = await tarifActions.getTarifInfoMessage(client);
                    return message;
                },
                (message) => {
                    log.debug('✅ Message de tarif info récupéré:', message);
                    resolve(message || '');
                },
                (error) => {
                    log.error('❌ Erreur récupération tarif info:', error);
                    resolve('');
                }
            );
        });
    }, [client, tarifActions, executeApi]);

    /**
     * Validation qu'un prix est valide
     */
    const isValidPrice = useCallback((prix) => {
        return typeof prix === 'number' && prix >= 0 && !isNaN(prix);
    }, []);

    /**
     * Formatage d'un prix pour affichage
     */
    const formatPrice = useCallback((prix) => {
        if (!isValidPrice(prix)) return '0.00';
        return prix.toFixed(2);
    }, [isValidPrice]);

    /**
     * EFFET SIMPLIFIÉ pour changement de client
     */
    useEffect(() => {
        if (client?.id !== lastCalculation.idClient) {
            clearCache();
            
            if (lastCalculation.idClient) { // Pas la première initialisation
                log.debug('Changement de client détecté:', {
                    ancien: lastCalculation.idClient,
                    nouveau: client?.id
                });
                
                setTimeout(() => {
                    recalculerPrixChangementClient();
                }, 500);
            }
            
            setLastCalculation({ 
                idClient: client?.id, 
                timestamp: Date.now() 
            });
        }
    }, [client?.id, lastCalculation.idClient, clearCache, recalculerPrixChangementClient]);

    /**
     * Effet pour déclencher le calcul automatique des prix manquants
     */
    useEffect(() => {
        if (!client || !lignes?.length || !tarifActions) {
            return;
        }

        // Vérifier s'il y a des lignes avec prix manquant et service+unité définis
        const lignesAvecPrixManquant = lignes.filter(ligne => {
            const prixVide = ligne.prixUnitaire === '' || ligne.prixUnitaire === null || ligne.prixUnitaire === undefined;
            const hasServiceEtUnite = ligne.idService && ligne.idUnite;
            return prixVide && hasServiceEtUnite;
        });

        // Ne rien faire s'il n'y a pas de prix manquant
        if (lignesAvecPrixManquant.length === 0) {
            return;
        }

        const timer = setTimeout(() => {
            calculerPrixManquants();
        }, 300);

        return () => clearTimeout(timer);
    }, [client?.id, lignes?.length, lignes, tarifActions]);

    /**
     * Nettoyage lors du démontage
     */
    useEffect(() => {
        return () => {
            clearCache();
        };
    }, [clearCache]);

    return {
        // Fonction principale unifiée
        calculerPrix,
        extraireIdsLigne,
        
        // Fonctions de convenance (wrappers)
        calculerPrixPourClient,
        calculerPrixManquants,
        recalculerTousLesPrix,
        recalculerPrixChangementClient,
        recalculerPrixLigne,
        calculerPrixPourServiceUnite,
        
        // Utilitaires
        getTarifInfo,
        isPrixCalculating,
        clearCache,
        clearCacheForServiceUnite,  // ✅ AJOUT
        isValidPrice,
        formatPrice,
        
        // États
        isCalculating,
        lastCalculation
    };
}