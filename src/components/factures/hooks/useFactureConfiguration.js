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
        
        if (serviceUnites && Array.isArray(serviceUnites) && serviceUnites.length > 0) {
            console.log("Table de liaison services-unités chargée:", serviceUnites);
            
            services.forEach(service => {
                const liaisonsService = serviceUnites.filter(
                    liaison => liaison.service_id === service.id || liaison.service_code === service.code
                );
                
                const unitesCodes = liaisonsService.map(liaison => {
                    const unite = unites.find(u => u.id === liaison.unite_id || u.code === liaison.unite_code);
                    return unite ? unite.code : null;
                }).filter(code => code !== null);
                
                unitesMap[service.code] = unitesCodes;
                console.log(`Unités pour le service ${service.nom} (${service.code}):`, unitesCodes);
            });
        } else {
            console.warn("Aucune donnée dans serviceUnites, création d'un mapping alternatif");
            
            services.forEach(service => {
                const unitesForService = unites.filter(u => 
                    u.service_id === service.id || u.service_code === service.code
                );
                unitesMap[service.code] = unitesForService.map(u => u.code).filter(Boolean);
            });
        }
        
        console.log("Mapping des unités par service:", unitesMap);
        return unitesMap;
    }

    async function createDefaultValues(service, services, unites) {
        const defaultServiceObj = service.getServiceDefault(services);
        
        const defaultUnitesArray = await Promise.all(
            services.map(async (serviceObj) => {
                try {
                    const defaultUniteId = await service.getUniteDefault(serviceObj);
                    
                    if (!defaultUniteId) {
                        const unitesPourService = unites.filter(u => 
                            u.service_id === serviceObj.id || 
                            u.service_code === serviceObj.code
                        );
                        
                        if (unitesPourService.length > 0) {
                            return { [serviceObj.code]: unitesPourService[0].code };
                        }
                        return null;
                    }
                    
                    const defaultUnite = unites.find(unite => unite.id === defaultUniteId);
                    return defaultUnite ? { [serviceObj.code]: defaultUnite.code } : null;
                } catch (error) {
                    console.error(`Erreur pour le service ${serviceObj.code}:`, error);
                    return null;
                }
            })
        );
        
        const defaultUniteMap = defaultUnitesArray
            .filter(item => item !== null)
            .reduce((acc, item) => ({...acc, ...item}), {});
        
        return {
            service: defaultServiceObj,
            unites: defaultUniteMap
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