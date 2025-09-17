import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Hook personnalisé pour la gestion des calculs de prix dans les factures
 * VERSION ARCHITECTURE UNIFIÉE - Une seule fonction principale pour tous les calculs
 * CORRIGÉ pour forcer le recalcul lors des changements de service
 */
export function useFacturePricing(
    client,
    tarificationService,
    services,
    unites,
    lignes,
    modifierLigne,
    prixModifiesManuel
) {
    // États pour le suivi des calculs
    const [isCalculating, setIsCalculating] = useState(false);
    const [lastCalculation, setLastCalculation] = useState({});
    
    // Références pour éviter les calculs multiples
    const calculationCache = useRef(new Map());
    const calculationPromises = useRef(new Map());
    
    /**
     * FONCTION PRINCIPALE UNIFIÉE: Calcul du prix pour un client
     */
    const calculerPrixPourClient = useCallback(async (params) => {
        const { clientId, idService, idUnite, forceRecalcul = false } = params;

        console.log('Calcul prix pour client appelé avec:', { clientId, idService, idUnite, forceRecalcul });
        
        // Validation stricte des paramètres
        if (!clientId || !idService || !idUnite) {
            console.warn('Paramètres manquants pour calculerPrixPourClient:', { clientId, idService, idUnite });
            return 0;
        }

        if (!tarificationService) {
            console.warn('TarificationService non disponible');
            return 0;
        }

        // Clé de cache
        const cacheKey = `${clientId}-${idService}-${idUnite}`;

        // Vérification cache ou force recalcul
        if (!forceRecalcul) {
            if (calculationCache.current.has(cacheKey)) {
                const cachedResult = calculationCache.current.get(cacheKey);
                const now = Date.now();
                
                if (now - cachedResult.timestamp < 10000) {
                    console.log(`Prix récupéré du cache: ${cachedResult.prix} CHF pour ${cacheKey}`);
                    return cachedResult.prix;
                } else {
                    calculationCache.current.delete(cacheKey);
                    console.log(`Cache expiré pour ${cacheKey}, recalcul nécessaire`);
                }
            }
        } else {
            calculationCache.current.delete(cacheKey);
            console.log(`Force recalcul demandé pour ${cacheKey}`);
        }

        // Protection contre les appels simultanés
        if (calculationPromises.current.has(cacheKey)) {
            console.log(`Calcul déjà en cours pour ${cacheKey}, attente du résultat...`);
            return await calculationPromises.current.get(cacheKey);
        }

        // Créer la promesse de calcul
        const calculationPromise = (async () => {
            try {
                console.log('Calcul du prix initial pour:', {
                    clientId,
                    idService,
                    idUnite,
                    clientNom: client?.nom,
                    forceRecalcul
                });

                const prix = await tarificationService.calculerPrix({
                    clientId,
                    idService,
                    idUnite,
                    date: new Date().toISOString().split('T')[0]
                });

                const finalPrix = prix || 0;
                
                // Mise en cache du résultat
                calculationCache.current.set(cacheKey, {
                    prix: finalPrix,
                    timestamp: Date.now()
                });

                console.log(`Prix calculé: ${finalPrix} CHF pour client ${client?.nom} (ID: ${clientId})`);
                return finalPrix;
            } catch (error) {
                console.error('Erreur dans calculerPrixPourClient:', error);
                return 0;
            } finally {
                // Nettoyer la promesse
                calculationPromises.current.delete(cacheKey);
            }
        })();

        // Stocker la promesse
        calculationPromises.current.set(cacheKey, calculationPromise);
        
        return await calculationPromise;
    }, [tarificationService, client]);

    /**
     * FONCTION UTILITAIRE: Extraction unifiée des IDs de service et unité
     */
    const extraireIdsLigne = useCallback((ligne, index, nouvellesValeurs = null) => {
        let idService = null;
        let idUnite = null;
        let serviceCode = null;
        let uniteCode = null;

        console.log(`Extraction IDs ligne ${index}:`, {
            ligne: ligne,
            nouvellesValeurs: nouvellesValeurs
        });

        // EXTRACTION DU SERVICE
        if (nouvellesValeurs?.serviceType) {
            // Nouvelle valeur fournie
            serviceCode = nouvellesValeurs.serviceType;
            const serviceObj = services?.find(s => s.codeService === serviceCode);
            idService = serviceObj?.idService;
            console.log('Service ID depuis nouvelle valeur:', { serviceCode, idService });
        } else if (nouvellesValeurs?.service && typeof nouvellesValeurs.service === 'object') {
            // Objet service fourni
            idService = nouvellesValeurs.service.idService;
            serviceCode = nouvellesValeurs.service.codeService;
            console.log('Service ID depuis objet nouvelle valeur:', { serviceCode, idService });
        } else if (ligne.service?.idService) {
            // Objet enrichi
            idService = ligne.service.idService;
            serviceCode = ligne.service.codeService;
            console.log('Service ID depuis objet enrichi:', { serviceCode, idService });
        } else if (ligne.serviceId) {
            // ID direct
            idService = ligne.serviceId;
            console.log('Service ID depuis propriété directe:', idService);
        } else if (ligne.serviceType && services) {
            // Code service
            serviceCode = ligne.serviceType;
            const serviceObj = services.find(s => s.codeService === serviceCode);
            idService = serviceObj?.idService;
            console.log('Service ID depuis code service:', { serviceCode, idService });
        }

        // EXTRACTION DE L'UNITÉ
        if (nouvellesValeurs?.unite) {
            // Nouvelle valeur fournie
            if (typeof nouvellesValeurs.unite === 'object') {
                idUnite = nouvellesValeurs.unite.idUnite;
                uniteCode = nouvellesValeurs.unite.code || nouvellesValeurs.unite.codeUnite;
                console.log('Unité ID depuis objet nouvelle valeur:', { uniteCode, idUnite });
            } else {
                uniteCode = nouvellesValeurs.unite;
                const uniteObj = unites?.find(u => u.code === uniteCode || u.codeUnite === uniteCode);
                idUnite = uniteObj?.idUnite;
                console.log('Unité ID depuis code nouvelle valeur:', { uniteCode, idUnite });
            }
        } else if (ligne.unite?.idUnite) {
            // Objet enrichi
            idUnite = ligne.unite.idUnite;
            uniteCode = ligne.unite.code || ligne.unite.codeUnite;
            console.log('Unité ID depuis objet enrichi:', { uniteCode, idUnite });
        } else if (ligne.uniteId) {
            // ID direct
            idUnite = ligne.uniteId;
            console.log('Unité ID depuis propriété directe:', idUnite);
        } else if (ligne.uniteCode && unites) {
            // Code unité
            uniteCode = ligne.uniteCode;
            const uniteObj = unites.find(u => u.codeUnite === uniteCode || u.code === uniteCode);
            idUnite = uniteObj?.idUnite;
            console.log('Unité ID depuis uniteCode:', { uniteCode, idUnite });
        } else if (typeof ligne.unite === 'string' && unites) {
            // String unité
            uniteCode = ligne.unite;
            const uniteObj = unites.find(u => u.codeUnite === uniteCode || u.code === uniteCode);
            idUnite = uniteObj?.idUnite;
            console.log('Unité ID depuis string unité:', { uniteCode, idUnite });
        }

        const result = { idService, idUnite, serviceCode, uniteCode };
        console.log(`IDs finaux ligne ${index}:`, result);
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

        if (!client || !lignes?.length || !tarificationService || isCalculating) {
            console.log('Conditions non remplies pour calcul prix:', {
                client: !!client,
                lignes: lignes?.length,
                tarificationService: !!tarificationService,
                isCalculating
            });
            return;
        }

        console.log(`Calcul prix unifié - Mode: ${mode}`, options);

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
                console.warn('Mode de calcul inconnu:', mode);
                return;
        }

        if (lignesToProcess.length === 0) {
            console.log(`Aucune ligne à traiter pour le mode ${mode}`);
            return;
        }

        console.log(`Traitement de ${lignesToProcess.length} ligne(s) en mode ${mode}`);
        setIsCalculating(true);

        try {
            for (const { ligne, index } of lignesToProcess) {
                try {
                    // EXTRACTION DES IDs UNIFIÉE
                    const ids = extraireIdsLigne(ligne, index, nouvellesValeurs);
                    
                    if (!ids.idService || !ids.idUnite) {
                        console.warn(`IDs manquants ligne ${index}:`, ids);
                        continue;
                    }

                    console.log(`Calcul prix ligne ${index}:`, {
                        service: ids.serviceCode,
                        unite: ids.uniteCode,
                        ancienPrix: ligne.prixUnitaire
                    });

                    // ✅ CORRECTION: Utiliser forceRecalcul du paramètre options
                    const shouldForceRecalcul = forceRecalcul || mode === 'client_change' || mode === 'all';

                    // CALCUL DU PRIX
                    const nouveauPrix = await calculerPrixPourClient({
                        clientId: client.id,
                        idService: ids.idService,
                        idUnite: ids.idUnite,
                        forceRecalcul: shouldForceRecalcul
                    });

                    // MISE À JOUR SI NÉCESSAIRE
                    if (nouveauPrix >= 0 && nouveauPrix !== ligne.prixUnitaire) {
                        if (modifierLigne && typeof modifierLigne === 'function') {
                            modifierLigne(index, 'prixUnitaire', nouveauPrix);
                            console.log(`Prix mis à jour ligne ${index}: ${ligne.prixUnitaire} → ${nouveauPrix} CHF`);
                        }
                    }

                } catch (error) {
                    console.error(`Erreur calcul ligne ${index}:`, error);
                }

                // Délai entre les lignes pour éviter la surcharge
                if (lignesToProcess.length > 1) {
                    await new Promise(resolve => setTimeout(resolve, 30));
                }
            }
        } catch (error) {
            console.error('Erreur dans calculerPrix:', error);
        } finally {
            setIsCalculating(false);
        }
    }, [client, lignes, tarificationService, isCalculating, calculerPrixPourClient, extraireIdsLigne, modifierLigne, prixModifiesManuel]);

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
            console.warn('Service ou unité non trouvé:', { serviceCode, uniteCode });
            return 0;
        }

        return await calculerPrixPourClient({
            clientId: client.id,
            idService: service.idService,
            idUnite: unite.idUnite
        });
    }, [client, services, unites, calculerPrixPourClient]);

    /**
     * Vérification si un prix est en cours de calcul
     */
    const isPrixCalculating = useCallback((serviceId, uniteId) => {
        if (!client) return false;
        const cacheKey = `${client.id}-${serviceId}-${uniteId}`;
        return calculationPromises.current.has(cacheKey);
    }, [client]);

    /**
     * ✅ CORRECTION: Nettoyage du cache avec option de clé spécifique
     */
    const clearCache = useCallback((specificKey = null) => {
        if (specificKey) {
            calculationCache.current.delete(specificKey);
            calculationPromises.current.delete(specificKey);
            console.log('Cache vidé pour clé spécifique:', specificKey);
        } else {
            calculationCache.current.clear();
            calculationPromises.current.clear();
            console.log('Cache des prix entièrement vidé');
        }
    }, []);

    /**
     * ✅ AJOUT: Fonction pour vider le cache d'une combinaison spécifique
     */
    const clearCacheForServiceUnite = useCallback((serviceId, uniteId) => {
        if (!client) return;
        const cacheKey = `${client.id}-${serviceId}-${uniteId}`;
        clearCache(cacheKey);
    }, [client, clearCache]);

    /**
     * Obtention du tarif d'information pour un client
     */
    const getTarifInfo = useCallback(async () => {
        if (!client || !tarificationService) {
            return '';
        }

        try {
            return await tarificationService.getTarifInfoMessage(client);
        } catch (error) {
            console.error('Erreur lors de la récupération du tarif info:', error);
            return '';
        }
    }, [client, tarificationService]);

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
        if (client?.id !== lastCalculation.clientId) {
            clearCache();
            
            if (lastCalculation.clientId) { // Pas la première initialisation
                console.log('Changement de client détecté:', {
                    ancien: lastCalculation.clientId,
                    nouveau: client?.id
                });
                
                setTimeout(() => {
                    recalculerPrixChangementClient();
                }, 500);
            }
            
            setLastCalculation({ 
                clientId: client?.id, 
                timestamp: Date.now() 
            });
        }
    }, [client?.id, lastCalculation.clientId, clearCache, recalculerPrixChangementClient]);

    /**
     * Effet pour déclencher le calcul automatique des prix manquants
     */
    useEffect(() => {
        if (!client || !lignes?.length || !tarificationService) {
            return;
        }

        const timer = setTimeout(() => {
            calculerPrixManquants();
        }, 300);

        return () => clearTimeout(timer);
    }, [client?.id, lignes?.length, tarificationService, calculerPrixManquants]);

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