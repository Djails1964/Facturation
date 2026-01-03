import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createLogger } from '../../../utils/createLogger';
import { toBoolean, normalizeServices } from '../../../utils/booleanHelper';

/**
 * Hook personnalisé pour la gestion de la configuration des factures
 * 
 * ✅ REFACTORISÉ : Utilise les données de tarification passées en props depuis FactureGestion
 * ✅ Plus d'appels API directs - les données sont déjà chargées
 * ✅ Calcule uniquement les mappings et valeurs par défaut
 * 
 * @param {Object} client - Client sélectionné
 * @param {boolean} readOnly - Mode lecture seule
 * @param {Object} tarifData - Données de tarification depuis FactureGestion
 */
export function useFactureConfiguration(client, readOnly, tarifData = null) {

    const log = createLogger("useFactureConfiguration");
    log.debug(`Entrée dans useFactureConfiguration avec:`, {
        clientId: client?.id,
        readOnly,
        hasTarifData: !!tarifData,
        tarifDataLoaded: tarifData?.isLoaded
    });

    // États de configuration
    const [unitesByService, setUnitesByService] = useState({});
    const [defaultService, setDefaultService] = useState(null);
    const [defaultUnites, setDefaultUnites] = useState({});
    const [tarifInfo, setTarifInfo] = useState('');
    
    // États de chargement
    const [isLoading, setIsLoading] = useState(true);
    const [loadingError, setLoadingError] = useState(null);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    
    // Références pour éviter les rechargements
    const initRef = useRef(false);
    const clientPrecedent = useRef(null);

    // ✅ Extraire les données de tarifData
    const services = useMemo(() => tarifData?.services || [], [tarifData?.services]);
    const unites = useMemo(() => tarifData?.unites || [], [tarifData?.unites]);
    const tarifActions = tarifData?.tarifActions || null;

    /**
     * Crée le mapping des unités par service
     * ✅ Utilise directement unitesLiees depuis les services enrichis
     */
    const createUniteMappings = useCallback((servicesData) => {
        const unitesMap = {};
        
        log.debug("📝 createUniteMappings - Services enrichis:", servicesData?.length);
        
        if (!servicesData || servicesData.length === 0) {
            log.warn("Aucun service disponible pour le mapping");
            return unitesMap;
        }

        servicesData.forEach(service => {
            const codeService = service.codeService || service.code;
            
            // ✅ NOUVEAU : Utiliser directement unitesLiees depuis le service enrichi
            if (service.unitesLiees && Array.isArray(service.unitesLiees)) {
                const codesUnites = service.unitesLiees
                    .map(u => u.codeUnite || u.code)
                    .filter(Boolean);
                
                unitesMap[codeService] = [...new Set(codesUnites)]; // Éviter les doublons
                
                log.debug(`✅ Unités pour ${codeService}:`, unitesMap[codeService]);
            } else {
                log.warn(`⚠️ Service ${codeService} sans unitesLiees`);
                unitesMap[codeService] = [];
            }
        });
        
        log.debug("✅ Mapping final des unités par service:", unitesMap);
        return unitesMap;
    }, [log]);

    /**
     * Crée les valeurs par défaut
     * ✅ Utilise directement uniteDefaut depuis les services enrichis
     */
    const createDefaultValues = useCallback((servicesData) => {
        log.debug("Création des valeurs par défaut");

        // Normaliser les services pour convertir isDefault correctement
        const normalizedServices = normalizeServices(servicesData);
        
        // Trouver le service par défaut
        const defaultServiceObj = normalizedServices.find(s => s.isDefault === true);
        
        if (!defaultServiceObj) {
            log.warn("Aucun service par défaut trouvé, utilisation du premier");
        } else {
            log.debug("Service par défaut trouvé:", defaultServiceObj.nomService);
        }
        
        // ✅ NOUVEAU : Créer le mapping des unités par défaut depuis les services enrichis
        const defaultUniteMap = {};
        
        servicesData.forEach(service => {
            const codeService = service.codeService || service.code;
            
            // Utiliser directement idUniteDefaut ou uniteDefaut du service enrichi
            if (service.idUniteDefaut) {
                // Trouver le code de l'unité par défaut
                const uniteDefaut = service.uniteDefaut || 
                    service.unitesLiees?.find(u => u.idUnite === service.idUniteDefaut);
                
                if (uniteDefaut) {
                    defaultUniteMap[codeService] = uniteDefaut.codeUnite || uniteDefaut.code;
                    log.debug(`✅ Unité par défaut pour ${codeService}:`, defaultUniteMap[codeService]);
                }
            } else if (service.unitesLiees?.length > 0) {
                // Chercher une unité marquée comme défaut dans unitesLiees
                const uniteDefault = service.unitesLiees.find(u => u.isDefaultPourService);
                if (uniteDefault) {
                    defaultUniteMap[codeService] = uniteDefault.codeUnite || uniteDefault.code;
                } else {
                    // Sinon prendre la première unité
                    defaultUniteMap[codeService] = service.unitesLiees[0].codeUnite || service.unitesLiees[0].code;
                }
                log.debug(`✅ Unité par défaut (fallback) pour ${codeService}:`, defaultUniteMap[codeService]);
            }
        });

        log.debug("Mapping final des unités par défaut:", defaultUniteMap);

        return {
            service: defaultServiceObj || normalizedServices[0] || null,
            unites: defaultUniteMap
        };
    }, [log]);

    /**
     * Initialise la configuration à partir des données de tarification
     */
    const initializeConfiguration = useCallback(() => {
        // Vérifier que les données de tarification sont chargées
        if (!tarifData?.isLoaded) {
            log.debug("⏳ Attente du chargement des données de tarification...");
            setIsLoading(true);
            return;
        }

        if (services.length === 0) {
            log.warn("⚠️ Aucun service disponible");
            setIsLoading(false);
            setMessage("Aucun service disponible");
            setMessageType('warning');
            return;
        }

        // Éviter les rechargements inutiles
        if (initRef.current && clientPrecedent.current === client?.id) {
            log.debug("Déjà initialisé pour ce client");
            return;
        }
        
        setIsLoading(true);
        
        try {
            log.debug('📥 Initialisation configuration depuis tarifData:', {
                services: services.length,
                unites: unites.length,
                clientId: client?.id
            });

            // ✅ Création des mappings (plus d'appels API)
            const mappings = createUniteMappings(services);
            
            // ✅ Création des valeurs par défaut (plus d'appels API)
            const defaults = createDefaultValues(services);
            
            log.debug('✅ Configuration créée:', {
                unitesByService: Object.keys(mappings).length,
                defaultService: defaults.service?.nomService,
                defaultUnites: Object.keys(defaults.unites).length
            });
            
            setUnitesByService(mappings);
            setDefaultService(defaults.service);
            setDefaultUnites(defaults.unites);
            setMessage('');
            setMessageType('');
            
            initRef.current = true;
            clientPrecedent.current = client?.id;
            
        } catch (error) {
            log.error('❌ Erreur configuration:', error);
            setLoadingError(error.message);
            setMessage(error.message);
            setMessageType('error');
        } finally {
            setIsLoading(false);
        }
    }, [client?.id, tarifData?.isLoaded, services, unites, createUniteMappings, createDefaultValues, log]);

    /**
     * Met à jour l'information sur le tarif appliqué
     */
    const updateTarifInfo = useCallback(async () => {
        if (readOnly || !client || !tarifActions) {
            setTarifInfo('');
            return;
        }

        try {
            log.debug('📥 Récupération du message de tarif...');
            const message = await tarifActions.getTarifInfoMessage(client);
            
            if (message) {
                log.debug('✅ Message de tarif reçu:', message);
                setTarifInfo(message);
            } else {
                setTarifInfo('');
            }
        } catch (error) {
            log.error('❌ Erreur récupération message tarif:', error);
            setTarifInfo('');
        }
    }, [readOnly, client, tarifActions, log]);

    // ✅ Effet pour initialiser quand les données de tarification sont chargées
    useEffect(() => {
        if (tarifData?.isLoaded) {
            initializeConfiguration();
        }
    }, [tarifData?.isLoaded, initializeConfiguration]);

    // ✅ Effet pour mettre à jour le tarif info quand le client change
    useEffect(() => {
        if (!readOnly && client && tarifData?.isLoaded) {
            updateTarifInfo();
        }
    }, [client?.id, readOnly, tarifData?.isLoaded, updateTarifInfo]);

    // ✅ Réinitialiser si le client change
    useEffect(() => {
        if (client?.id !== clientPrecedent.current) {
            log.debug('🔄 Changement de client détecté, réinitialisation...');
            initRef.current = false;
            initializeConfiguration();
        }
    }, [client?.id, initializeConfiguration, log]);

    // ✅ NOUVEAU : Fonctions d'accès rapide aux données
    const getUnitesPourService = useCallback((idService) => {
        if (tarifData?.getUnitesPourService) {
            return tarifData.getUnitesPourService(idService);
        }
        // Fallback local
        const service = services.find(s => s.idService === idService);
        return service?.unitesLiees || [];
    }, [tarifData, services]);

    const getUniteDefautPourService = useCallback((idService) => {
        if (tarifData?.getUniteDefautPourService) {
            return tarifData.getUniteDefautPourService(idService);
        }
        // Fallback local
        const service = services.find(s => s.idService === idService);
        return service?.uniteDefaut || null;
    }, [tarifData, services]);

    const getIdUniteDefautPourService = useCallback((idService) => {
        if (tarifData?.getIdUniteDefautPourService) {
            return tarifData.getIdUniteDefautPourService(idService);
        }
        // Fallback local
        const service = services.find(s => s.idService === idService);
        return service?.idUniteDefaut || null;
    }, [tarifData, services]);

    return {
        // Configuration
        services,
        unites,
        unitesByService,
        defaultService,
        defaultUnites,
        tarifActions,
        tarifInfo,
        
        // États de chargement
        isLoading: isLoading || (tarifData?.isLoading ?? true),
        loadingError,
        message,
        messageType,
        
        // ✅ NOUVEAU : Fonctions d'accès aux données enrichies
        getUnitesPourService,
        getUniteDefautPourService,
        getIdUniteDefautPourService,
        
        // Méthodes
        initializeConfiguration,
        updateTarifInfo
    };
}