import { useState, useEffect, useRef, useCallback } from 'react';
import TarificationService from '../../../services/TarificationService';

/**
 * Hook personnalisé pour la gestion de la configuration des factures
 * Gère les services, unités, tarification et valeurs par défaut
 */
export function useFactureConfiguration(client, readOnly) {
    // États de configuration
    const [services, setServices] = useState([]);
    const [unites, setUnites] = useState([]);
    const [unitesByService, setUnitesByService] = useState({});
    const [defaultService, setDefaultService] = useState(null);
    const [defaultUnites, setDefaultUnites] = useState({});
    const [tarificationService, setTarificationService] = useState(null);
    const [tarifInfo, setTarifInfo] = useState('');
    
    // États de chargement
    const [isLoading, setIsLoading] = useState(!readOnly);
    const [loadingError, setLoadingError] = useState(null);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    
    // Références pour éviter les rechargements
    const initRef = useRef(false);
    const clientPrecedent = useRef(null);

    /**
     * Initialise les services et unités pour un client donné
     */
    const initializeConfiguration = useCallback(async () => {
        if (!client || !client.id) {
            console.log("Attente du client ou mode lecture seule...");
            return;
        }
        
        // Éviter les rechargements inutiles
        if (initRef.current && clientPrecedent.current === client.id) {
            console.log("Déjà initialisé pour ce client");
            return;
        }
        
        try {
            setIsLoading(true);
            setLoadingError(null);
            console.log("Initialisation des services pour le client:", client.id);
            
            const service = await initializeTarificationService();
            const servicesData = await loadServices(service);
            const unitesData = await loadUnites(service, client.id);
            const serviceUnitesData = await loadServiceUnites(service);
            
            const mappings = createUniteMappings(servicesData, unitesData, serviceUnitesData);
            const defaults = await createDefaultValues(service, servicesData, unitesData);
            
            // Mettre à jour les états
            updateConfigurationState({
                tarificationService: service,
                services: servicesData,
                unites: unitesData,
                unitesByService: mappings,
                defaultService: defaults.service,
                defaultUnites: defaults.unites
            });
            
            // Marquer comme initialisé
            clientPrecedent.current = client.id;
            initRef.current = true;
            setIsLoading(false);
            
        } catch (error) {
            handleConfigurationError(error);
        }
    }, [client, readOnly]);

    /**
     * Met à jour l'information sur le tarif appliqué
     */
    const updateTarifInfo = useCallback(async () => {
        if (readOnly || !tarificationService || !client) {
            setTarifInfo('');
            return;
        }
        
        try {
            const message = await tarificationService.getTarifInfoMessage(client);
            setTarifInfo(message);
        } catch (error) {
            console.error('Erreur lors de la récupération du message de tarif:', error);
            setTarifInfo('');
        }
    }, [tarificationService, client, readOnly]);

    // Effets
    useEffect(() => {
        initializeConfiguration();
    }, [initializeConfiguration]);

    useEffect(() => {
        updateTarifInfo();
    }, [updateTarifInfo]);

    // Méthodes privées
    async function initializeTarificationService() {
        const service = new TarificationService();
        await service.initialiser();
        return service;
    }

    async function loadServices(service) {
        const servicesTous = await service.chargerServices();
        console.log("Services chargés:", servicesTous);
        
        if (!servicesTous || servicesTous.length === 0) {
            throw new Error("Aucun service chargé");
        }
        
        return servicesTous;
    }

    async function loadUnites(service, clientId) {
        const unitesTous = await service.getUnitesApplicablesPourClient(clientId);
        console.log("Unités applicables pour le client:", unitesTous);
        return unitesTous;
    }

    async function loadServiceUnites(service) {
        return await service.chargerServicesUnites();
    }

    function createUniteMappings(services, unites, serviceUnites) {
        const unitesMap = {};
        
        console.log("🔍 createUniteMappings - Services:", services);
        console.log("🔍 createUniteMappings - Unités:", unites);
        console.log("🔍 createUniteMappings - ServiceUnites:", serviceUnites);
        
        if (serviceUnites && Array.isArray(serviceUnites) && serviceUnites.length > 0) {
            console.log("Table de liaison services-unités chargée:", serviceUnites);
            
            services.forEach(service => {
                console.log(`\n🔍 Traitement du service: ${service.nomService} (${service.codeService}) - ID: ${service.idService}`);
                
                // ✅ CORRECTION PRINCIPALE : Améliorer le filtrage avec debug
                const liaisonsService = serviceUnites.filter(liaison => {
                    // Normaliser les IDs en strings pour comparaison
                    const liaisonServiceId = String(liaison.idService || liaison.serviceId || '');
                    const currentServiceId = String(service.idService || '');
                    
                    const matches = liaisonServiceId === currentServiceId;
                    
                    if (matches) {
                        console.log(`✅ Liaison trouvée:`, liaison);
                    } else {
                        console.log(`❌ Liaison ignorée (${liaisonServiceId} ≠ ${currentServiceId}):`, liaison);
                    }
                    
                    return matches;
                });
                
                console.log(`🔍 Liaisons filtrées pour ${service.codeService}:`, liaisonsService);
                
                if (liaisonsService.length === 0) {
                    console.warn(`⚠️ Aucune liaison trouvée pour le service ${service.codeService} (ID: ${service.idService})`);
                    console.warn("Liaisons disponibles:", serviceUnites.map(l => ({
                        serviceId: l.idService || l.serviceId,
                        uniteId: l.idUnite || l.uniteId
                    })));
                }
                
                const unitesCodes = liaisonsService.map(liaison => {
                    console.log(`🔍 Traitement de la liaison:`, liaison);
                    
                    // Normaliser les IDs pour la recherche d'unité
                    const liaisonUniteId = liaison.idUnite || liaison.uniteId;
                    
                    // ✅ CORRECTION CRITIQUE : Debug et recherche par ID
                    console.log(`🔍 Recherche d'unité avec ID: ${liaisonUniteId}`);
                    console.log(`🔍 Unités disponibles pour debug:`, unites.map(u => ({
                        idUnite: u.idUnite,
                        codeUnite: u.codeUnite,
                        nomUnite: u.nomUnite
                    })));
                    
                    const unite = unites.find(u => {
                        const uniteId = u.idUnite || u.uniteId || u.id;
                        const matches = String(uniteId) === String(liaisonUniteId);
                        console.log(`🔍 Test unité ${u.nomUnite} (ID: ${uniteId}) === ${liaisonUniteId} ? ${matches}`);
                        return matches;
                    });
                    
                    if (unite) {
                        console.log(`✅ Unité trouvée pour liaison:`, unite);
                        return unite.codeUnite || unite.code;
                    } else {
                        console.warn(`❌ Aucune unité trouvée pour liaison:`, liaison);
                        console.warn("Unités disponibles:", unites.map(u => ({
                            id: u.idUnite || u.uniteId || u.id,
                            code: u.codeUnite || u.code
                        })));
                        return null;
                    }
                }).filter(codeUnite => codeUnite !== null);

                // ✅ IMPORTANT: Éviter les doublons et valider
                const codesUniques = [...new Set(unitesCodes)];
                unitesMap[service.codeService] = codesUniques;
                
                console.log(`✅ Unités uniques pour le service ${service.nomService} (${service.codeService}):`, codesUniques);
                
                // ✅ AJOUT : Validation finale
                if (codesUniques.length === 0) {
                    console.warn(`⚠️ Aucune unité mappée pour ${service.codeService}, utilisation du fallback`);
                    
                    // Fallback : chercher les unités directement liées au service
                    const unitesDirectes = unites.filter(u => {
                        const uniteServiceId = String(u.idService || u.serviceId || '');
                        const currentServiceId = String(service.idService || '');
                        return uniteServiceId === currentServiceId;
                    });
                    
                    if (unitesDirectes.length > 0) {
                        const codesFallback = unitesDirectes.map(u => u.codeUnite || u.code).filter(Boolean);
                        unitesMap[service.codeService] = [...new Set(codesFallback)];
                        console.log(`🔄 Fallback appliqué pour ${service.codeService}:`, unitesMap[service.codeService]);
                    }
                }
            });
        } else {
            console.warn("Aucune donnée dans serviceUnites, création d'un mapping alternatif");
            
            services.forEach(service => {
                // ✅ CORRECTION : Utiliser la logique de fallback directement
                const unitesForService = unites.filter(u => {
                    const uniteServiceId = String(u.idService || u.serviceId || '');
                    const currentServiceId = String(service.idService || '');
                    return uniteServiceId === currentServiceId;
                });
                
                const codes = unitesForService.map(u => u.codeUnite || u.code).filter(Boolean);
                unitesMap[service.codeService] = [...new Set(codes)]; // Éviter les doublons
                
                console.log(`Unités directes pour ${service.codeService}:`, unitesMap[service.codeService]);
            });
        }
        
        console.log("✅ Mapping final des unités par service:", unitesMap);
        
        // ✅ AJOUT : Validation finale du mapping
        const servicesAvecUnites = Object.keys(unitesMap).filter(service => unitesMap[service].length > 0);
        const servicesSansUnites = Object.keys(unitesMap).filter(service => unitesMap[service].length === 0);
        
        console.log(`✅ Services avec unités (${servicesAvecUnites.length}):`, servicesAvecUnites);
        if (servicesSansUnites.length > 0) {
            console.warn(`⚠️ Services sans unités (${servicesSansUnites.length}):`, servicesSansUnites);
        }
        
        return unitesMap;
    }

    async function createDefaultValues(service, services, unites) {
        console.log("Création des valeurs par défaut");
        console.log("Services disponibles pour défauts:", services);
        console.log("Unités disponibles pour défauts:", unites);    
        // ✅ CORRECTION : Chercher le service par défaut avec le bon nom de propriété
        const defaultServiceObj = services.find(s => s.isDefault === true || s.isDefault === 1);
        
        if (!defaultServiceObj) {
            console.warn("Aucun service par défaut trouvé");
        } else {
            console.log("Service par défaut trouvé:", defaultServiceObj);
        }
        
        const defaultUnitesArray = await Promise.all(
            services.map(async (serviceObj) => {
                try {
                    // ✅ CORRECTION : Utiliser idService converti par api.js
                    const defaultUniteId = await service.getUniteDefault(serviceObj);

                    console.log(`Unité par défaut pour le service ${serviceObj.codeService} (ID: ${serviceObj.idService}):`, defaultUniteId);
                    
                    if (!defaultUniteId) {
                        // ✅ CORRECTION : Chercher par idService converti
                        const unitesPourService = unites.filter(u => 
                            u.idService === serviceObj.idService || 
                            u.serviceId === serviceObj.idService
                        );
                        
                        if (unitesPourService.length > 0) {
                            return { [serviceObj.codeService]: unitesPourService[0].codeUnite || unitesPourService[0].code };
                        }
                        return null;
                    }
                    
                    // ✅ CORRECTION : Chercher par idUnite converti
                    const defaultUnite = unites.find(unite => unite.idUnite === defaultUniteId || unite.id === defaultUniteId);
                    console.log(`Unité trouvée pour l'ID ${defaultUniteId}:`, defaultUnite);
                    //return defaultUnite ? { [serviceObj.codeService]: defaultUnite.codeUnite || defaultUnite.code } : null;
                    return defaultUnite ? defaultUnite : null;
                } catch (error) {
                    console.error(`Erreur pour le service ${serviceObj.codeService}:`, error);
                    return null;
                }
            })
        );

        console.log("Unités par défaut trouvées:", defaultUnitesArray);
        
        const defaultUniteMap = defaultUnitesArray
            .filter(item => item !== null)
            .reduce((acc, item) => ({...acc, ...item}), {});
        
        console.log("Mapping final des unités par défaut:", defaultUniteMap);

        return {
            service: defaultServiceObj,
            unites: defaultUnitesArray
        };
    }

    function updateConfigurationState(config) {
        setTarificationService(config.tarificationService);
        setServices(config.services);
        setUnites(config.unites);
        setUnitesByService(config.unitesByService);
        setDefaultUnites(config.defaultUnites);
        setDefaultService(config.defaultService);
    }

    function handleConfigurationError(error) {
        console.error('Erreur lors de l\'initialisation avec le client:', error);
        setMessage('Erreur lors du chargement des services pour ce client');
        setMessageType('error');
        setLoadingError(error);
        setIsLoading(false);
    }

    return {
        // Configuration
        services,
        unites,
        unitesByService,
        defaultService,
        defaultUnites,
        tarificationService,
        tarifInfo,
        
        // États de chargement
        isLoading,
        loadingError,
        message,
        messageType,
        
        // Méthodes
        initializeConfiguration,
        updateTarifInfo
    };
}