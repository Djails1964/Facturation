import { useCallback, useMemo } from 'react';
import { useApiCall } from '../../../hooks/useApiCall';
import { createLogger } from '../../../utils/createLogger';
import TarificationService from '../../../services/TarificationService';
// import ClientService from '../../../services/ClientService';

/**
 * Hook centralisé pour tous les appels API liés aux tarifs
 * ✅ VERSION OPTIMISÉE avec fonctions CRUD génériques
 * ✅ Architecture unifiée : toutes les interactions avec TarificationService passent par ce hook
 * ✅ Gestion automatique des sessions expirées via useApiCall
 * ✅ Logging cohérent et gestion d'erreurs structurée
 * ✅ Services créés en interne pour cohérence avec les autres hooks
 * 
 * @returns {Object} Actions API optimisées pour les tarifs
 */
export const useTarifActions = () => {
  const log = createLogger('useTarifActions');

  // ✅ Hook API centralisé pour gestion automatique des sessions expirées
  const { execute: executeApi, isLoading, error } = useApiCall();

  const tarificationService = useMemo(() => new TarificationService(), []);
  // const clientService = useMemo(() => new ClientService(), []);
  
  // const services = useMemo(() => ({
  //   tarification: tarificationService,
  //   client: clientService
  // }), [tarificationService, clientService]);
  
  

  // ========================================
  // MAPPING DES TYPES D'ENTITÉS
  // ========================================

  /**
   * Configuration des types d'entités et leurs méthodes associées
   */
  const entityConfig = useMemo(() => ({
    service: {
      charger: 'chargerServices',
      create: 'createService',
      update: 'updateService',
      delete: 'deleteService',
      checkUsage: 'checkServiceUsage',
      label: 'service',
      pluralLabel: 'services'
    },
    unite: {
      charger: 'chargerUnites',
      create: 'createUnite',
      update: 'updateUnite',
      delete: 'deleteUnite',
      checkUsage: 'checkUniteUsage',
      label: 'unité',
      pluralLabel: 'unités'
    },
    typeTarif: {
      charger: 'chargerTypesTarifs',
      create: 'createTypeTarif',
      update: 'updateTypeTarif',
      delete: 'deleteTypeTarif',
      checkUsage: 'checkTypeTarifUsage',
      label: 'type de tarif',
      pluralLabel: 'types de tarifs'
    },
    tarif: {
      charger: 'getAllTarifs',
      create: 'createTarif',
      update: 'updateTarif',
      delete: 'deleteTarif',
      checkUsage: 'checkTarifUsage',
      label: 'tarif',
      pluralLabel: 'tarifs'
    },
    tarifSpecial: {
      charger: 'getAllTarifsSpeciaux',
      create: 'createTarifSpecial',
      update: 'updateTarifSpecial',
      delete: 'deleteTarifSpecial',
      checkUsage: 'checkTarifSpecialUsage',
      label: 'tarif spécial',
      pluralLabel: 'tarifs spéciaux'
    },
    donneesInitiales: {
      charger: 'getDonneesInitiales',
      label: 'données initiales',
      pluralLabel: 'données initiales'
    }
  }), []);

  // ========================================
  // FONCTIONS CRUD GÉNÉRIQUES
  // ========================================

  /**
   * Charge des entités d'un type donné
   * @param {string} type - Type d'entité ('service', 'unite', 'typeTarif', 'tarif', 'tarifSpecial')
   * @param {Object|number|string} params - Paramètres optionnels pour le chargement
   * @returns {Promise<Array>} Liste des entités
   */
  const charger = useCallback(async (type, params = {}) => {
    const config = entityConfig[type];
    if (!config) {
      throw new Error(`Type d'entité inconnu: ${type}`);
    }

    return await executeApi(
      async () => {
        log.debug(`📡 Chargement des ${config.pluralLabel}...`, params);
        const methodName = config.charger;
        const method = tarificationService[methodName];
        
        if (!method) {
          throw new Error(`Méthode ${methodName} non trouvée dans tarificationService`);
        }

        // ✅ Gestion spécifique des paramètres selon le type
        let result;
        if (type === 'unite') {
          // chargerUnites(idService = null) - accepte un ID simple
          result = await method.call(tarificationService, typeof params === 'object' && params !== null ? params.idService : params);
        } else if (type === 'service' || type === 'typeTarif') {
          // chargerServices() et chargerTypesTarifs() - pas de paramètres
          result = await method.call(tarificationService);
        } else {
          // getAllTarifs(params) et getAllTarifsSpeciaux(params) - acceptent un objet params
          result = await method.call(tarificationService, params);
        }
        
        // Normalisation du résultat
        let normalizedResult = [];
        if (Array.isArray(result)) {
          normalizedResult = result;
        } else if (result && typeof result === 'object') {
          // Gestion des formats alternatifs
          if (result.data && Array.isArray(result.data)) {
            normalizedResult = result.data;
          } else if (result[config.pluralLabel] && Array.isArray(result[config.pluralLabel])) {
            normalizedResult = result[config.pluralLabel];
          } else {
            // Pour les unités qui peuvent retourner un objet
            const values = Object.values(result);
            if (Array.isArray(values[0])) {
              values.forEach(v => {
                if (Array.isArray(v)) normalizedResult = [...normalizedResult, ...v];
              });
            } else {
              normalizedResult = values;
            }
          }
        }
        
        log.debug(`✅ ${config.pluralLabel} chargés:`, normalizedResult?.length || 0);
        return normalizedResult;
      },
      null,
      (error) => {
        log.error(`❌ Erreur chargement ${config.pluralLabel}:`, error);
        throw error;
      }
    );
  }, [tarificationService, entityConfig, executeApi, log]);

  /**
   * Crée une nouvelle entité
   * @param {string} type - Type d'entité
   * @param {Object} data - Données de l'entité
   * @returns {Promise<Object>} Entité créée
   */
  const create = useCallback(async (type, data) => {
    const config = entityConfig[type];
    if (!config) {
      throw new Error(`Type d'entité inconnu: ${type}`);
    }

    return await executeApi(
      async () => {
        log.debug(`➕ Création ${config.label}:`, data);
        const methodName = config.create;
        const method = tarificationService[methodName];
        
        if (!method) {
          throw new Error(`Méthode ${methodName} non trouvée dans tarificationService`);
        }

        const result = await method.call(tarificationService, data);
        log.debug(`✅ ${config.label} créé(e):`, result);
        return result;
      },
      null,
      (error) => {
        log.error(`❌ Erreur création ${config.label}:`, error);
        throw error;
      }
    );
  }, [tarificationService, entityConfig, executeApi, log]);

  /**
   * Met à jour une entité existante
   * @param {string} type - Type d'entité
   * @param {number|string} id - ID de l'entité
   * @param {Object} data - Nouvelles données
   * @returns {Promise<Object>} Entité mise à jour
   */
  const update = useCallback(async (type, id, data) => {
    const config = entityConfig[type];
    if (!config) {
      throw new Error(`Type d'entité inconnu: ${type}`);
    }

    return await executeApi(
      async () => {
        log.debug(`🔄 Mise à jour ${config.label}:`, { id, data });
        const methodName = config.update;
        const method = tarificationService[methodName];
        
        if (!method) {
          throw new Error(`Méthode ${methodName} non trouvée dans tarificationService`);
        }

        const result = await method.call(tarificationService, id, data);
        log.debug(`✅ ${config.label} mis(e) à jour:`, result);
        return result;
      },
      null,
      (error) => {
        log.error(`❌ Erreur mise à jour ${config.label}:`, error);
        throw error;
      }
    );
  }, [tarificationService, entityConfig, executeApi, log]);

  /**
   * Supprime une entité
   * @param {string} type - Type d'entité
   * @param {number|string} id - ID de l'entité
   * @returns {Promise<Object>} Résultat de la suppression
   */
  const deleteEntity = useCallback(async (type, id) => {
    const config = entityConfig[type];
    if (!config) {
      throw new Error(`Type d'entité inconnu: ${type}`);
    }

    return await executeApi(
      async () => {
        log.debug(`🗑️ Suppression ${config.label}:`, id);
        const methodName = config.delete;
        const method = tarificationService[methodName];
        
        if (!method) {
          throw new Error(`Méthode ${methodName} non trouvée dans tarificationService`);
        }

        const result = await method.call(tarificationService, id);
        log.debug(`✅ ${config.label} supprimé(e):`, result);
        return result;
      },
      null,
      (error) => {
        log.error(`❌ Erreur suppression ${config.label}:`, error);
        throw error;
      }
    );
  }, [tarificationService, entityConfig, executeApi, log]);

  /**
   * Vérifie l'utilisation d'une entité
   * @param {string} type - Type d'entité
   * @param {number|string} id - ID de l'entité
   * @returns {Promise<Object>} Informations sur l'utilisation
   */
  const checkUsage = useCallback(async (type, id) => {
    const config = entityConfig[type];
    if (!config) {
      throw new Error(`Type d'entité inconnu: ${type}`);
    }

    return await executeApi(
      async () => {
        log.debug(`🔍 Vérification utilisation ${config.label}:`, id);
        const methodName = config.checkUsage;
        const method = tarificationService[methodName];
        
        if (!method) {
          throw new Error(`Méthode ${methodName} non trouvée dans tarificationService`);
        }

        const result = await method.call(tarificationService, id);
        log.debug(`✅ Résultat vérification ${config.label}:`, result);
        return result;
      },
      null,
      (error) => {
        log.error(`❌ Erreur vérification ${config.label}:`, error);
        throw error;
      }
    );
  }, [tarificationService, entityConfig, executeApi, log]);

  // ========================================
  // FONCTIONS SPÉCIFIQUES SERVICES
  // ========================================

  /**
   * Met à jour l'unité par défaut d'un service
   */
  const updateServiceUniteDefault = useCallback(async (idService, idUnite) => {
    return await executeApi(
      async () => {
        log.debug('🔄 Mise à jour unité par défaut:', { idService, idUnite });
        const result = await tarificationService.updateServiceUniteDefault(idService, idUnite);
        log.debug('✅ Unité par défaut mise à jour:', result);
        return result;
      },
      null,
      (error) => {
        log.error('❌ Erreur mise à jour unité par défaut:', error);
        throw error;
      }
    );
  }, [tarificationService, executeApi, log]);

  // ========================================
  // FONCTIONS SPÉCIFIQUES UNITÉS
  // ========================================

  /**
   * Récupère l'unité par défaut pour un service
   */
  const getUniteDefault = useCallback(async (idService) => {
    return await executeApi(
      async () => {
        log.debug('🔍 Recherche unité par défaut:', idService);
        const result = await tarificationService.getUniteDefault(idService);
        log.debug('✅ Unité par défaut trouvée:', result);
        return result;
      },
      null,
      (error) => {
        log.error('❌ Erreur recherche unité par défaut:', error);
        throw error;
      }
    );
  }, [tarificationService, executeApi, log]);

  // ========================================
  // LIAISONS SERVICE-UNITÉ
  // ========================================

  /**
   * Lie un service à une unité
   */
  const linkServiceUnite = useCallback(async (idService, idUnite) => {
    return await executeApi(
      async () => {
        log.debug('🔗 Liaison service-unité:', { idService, idUnite });
        const result = await tarificationService.linkServiceUnite(idService, idUnite);
        log.debug('✅ Liaison créée:', result);
        return result;
      },
      null,
      (error) => {
        log.error('❌ Erreur liaison service-unité:', error);
        throw error;
      }
    );
  }, [tarificationService, executeApi, log]);

  /**
   * Délie un service d'une unité
   */
  const unlinkServiceUnite = useCallback(async (idService, idUnite) => {
    return await executeApi(
      async () => {
        log.debug('🔓 Déliaison service-unité:', { idService, idUnite });
        const result = await tarificationService.unlinkServiceUnite(idService, idUnite);
        log.debug('✅ Déliaison effectuée:', result);
        return result;
      },
      null,
      (error) => {
        log.error('❌ Erreur déliaison service-unité:', error);
        throw error;
      }
    );
  }, [tarificationService, executeApi, log]);

  /**
   * Vérifie l'utilisation d'une liaison service-unité dans les factures
   */
  const checkServiceUniteUsageInFacture = useCallback(async (idService, idUnite) => {
    return await executeApi(
      async () => {
        log.debug('🔍 Vérification utilisation liaison dans factures:', { idService, idUnite });
        const result = await tarificationService.checkServiceUniteUsageInFacture(idService, idUnite);
        log.debug('✅ Résultat vérification:', result);
        return result;
      },
      null,
      (error) => {
        log.error('❌ Erreur vérification liaison:', error);
        throw error;
      }
    );
  }, [tarificationService, executeApi, log]);

  /**
   * Charge toutes les liaisons service-unité
   */
  const chargerServicesUnites = useCallback(async () => {
    return await executeApi(
      async () => {
        log.debug('📡 Chargement des liaisons service-unité...');
        const result = await tarificationService.chargerServicesUnites();
        log.debug('✅ Liaisons chargées:', result?.length || 0);
        return result;
      },
      null,
      (error) => {
        log.error('❌ Erreur chargement liaisons:', error);
        throw error;
      }
    );
  }, [tarificationService, executeApi, log]);

  // ========================================
  // RECHERCHE ET RÉCUPÉRATION SPÉCIFIQUES
  // ========================================

  /**
   * Récupère des tarifs avec filtres spécifiques
   */
  const getTarifs = useCallback(async (params = {}) => {
    return await executeApi(
      async () => {
        log.debug('📡 Recherche tarifs...', params);
        const result = await tarificationService.getTarifs(params);
        log.debug('✅ Tarifs trouvés:', result?.length || 0);
        return result;
      },
      null,
      (error) => {
        log.error('❌ Erreur recherche tarifs:', error);
        throw error;
      }
    );
  }, [tarificationService, executeApi, log]);

  /**
   * Récupère le tarif applicable pour un client
   */
  const getTarifClient = useCallback(async (params) => {
    return await executeApi(
      async () => {
        log.debug('📡 Recherche tarif client...', params);
        const result = await tarificationService.getTarifClient(params);
        log.debug('✅ Tarif client trouvé:', result);
        return result;
      },
      null,
      (error) => {
        log.error('❌ Erreur recherche tarif client:', error);
        throw error;
      }
    );
  }, [tarificationService, executeApi, log]);

  /**
   * Récupère des tarifs spéciaux avec filtres spécifiques
   */
  const getTarifsSpeciaux = useCallback(async (params = {}) => {
    return await executeApi(
      async () => {
        log.debug('📡 Recherche tarifs spéciaux...', params);
        const result = await tarificationService.getTarifsSpeciaux(params);
        log.debug('✅ Tarifs spéciaux trouvés:', result?.length || 0);
        return result;
      },
      null,
      (error) => {
        log.error('❌ Erreur recherche tarifs spéciaux:', error);
        throw error;
      }
    );
  }, [tarificationService, executeApi, log]);

  // ========================================
  // CALCULS ET UTILITAIRES
  // ========================================

  /**
   * Calcule le prix pour un client selon les paramètres
   */
  const calculerPrix = useCallback(async (params) => {
    return await executeApi(
      async () => {
        log.debug('💰 Calcul de prix...', params);
        const result = await tarificationService.calculerPrix(params);
        log.debug('✅ Prix calculé:', result);
        return result;
      },
      null,
      (error) => {
        log.error('❌ Erreur calcul prix:', error);
        throw error;
      }
    );
  }, [tarificationService, executeApi, log]);

  /**
   * Vérifie si un client est thérapeute
   */
  const estTherapeute = useCallback(async (idClient) => {
    return await executeApi(
      async () => {
        log.debug('🔍 Vérification statut thérapeute:', idClient);
        const result = await tarificationService.estTherapeute(idClient);
        log.debug('✅ Statut thérapeute:', result);
        return result;
      },
      null,
      (error) => {
        log.error('❌ Erreur vérification thérapeute:', error);
        throw error;
      }
    );
  }, [tarificationService, executeApi, log]);

  /**
   * Vérifie si un client possède un tarif spécial défini
   */
  const possedeTarifSpecialDefini = useCallback(async (idClient, idService, idUnite) => {
    return await executeApi(
      async () => {
        log.debug('🔍 Vérification tarif spécial défini:', { idClient, idService, idUnite });
        const result = await tarificationService.possedeTarifSpecialDefini(idClient, idService, idUnite);
        log.debug('✅ Tarif spécial défini:', result);
        return result;
      },
      null,
      (error) => {
        log.error('❌ Erreur vérification tarif spécial défini:', error);
        throw error;
      }
    );
  }, [tarificationService, executeApi, log]);

  /**
   * Récupère le message d'information sur le tarif applicable
   */
  const getTarifInfoMessage = useCallback(async (params) => {
    return await executeApi(
      async () => {
        log.debug('📋 Récupération message info tarif...', params);
        const result = await tarificationService.getTarifInfoMessage(params);
        log.debug('✅ Message info tarif:', result);
        return result;
      },
      null,
      (error) => {
        log.error('❌ Erreur récupération message info tarif:', error);
        throw error;
      }
    );
  }, [tarificationService, executeApi, log]);

  /**
   * Récupère les unités applicables pour un client
   */
  const getUnitesApplicablesPourClient = useCallback(async (idClient, idService) => {
    return await executeApi(
      async () => {
        log.debug('📋 Récupération unités applicables...', { idClient, idService });
        const result = await tarificationService.getUnitesApplicablesPourClient(idClient, idService);
        log.debug('✅ Unités applicables:', result?.length || 0);
        return result;
      },
      null,
      (error) => {
        log.error('❌ Erreur récupération unités applicables:', error);
        throw error;
      }
    );
  }, [tarificationService, executeApi, log]);

  /**
   * Initialise le service de tarification
   */
  const initialiser = useCallback(async () => {
    return await executeApi(
      async () => {
        log.debug('🔧 Initialisation service tarification...');
        const result = await tarificationService.initialiser();
        log.debug('✅ Service initialisé:', result);
        return result;
      },
      null,
      (error) => {
        log.error('❌ Erreur initialisation service:', error);
        throw error;
      }
    );
  }, [tarificationService, executeApi, log]);

  /**
   * Vide le cache du service
   */
  const clearCache = useCallback(() => {
    log.debug('🗑️ Vidage du cache...');
    tarificationService.clearCache();
    log.debug('✅ Cache vidé');
  }, [tarificationService, log]);

  // ========================================
  // DONNÉES INITIALES UNIFIÉES
  // ========================================

  /**
   * Charge toutes les données de tarification en une seule requête
   * Services enrichis avec leurs unités liées et l'unité par défaut
   * @param {boolean} forceReload - Force le rechargement même si cache valide
   * @returns {Promise<Object>} { services, unites, typesTarifs }
   */
  const getDonneesInitiales = useCallback(async (forceReload = false) => {
    return await executeApi(
      async () => {
        log.debug('📥 Chargement des données initiales unifiées...', { forceReload });
        const result = await tarificationService.getDonneesInitiales(forceReload);
        log.debug('✅ Données initiales chargées:', {
          services: result.services?.length || 0,
          unites: result.unites?.length || 0,
          typesTarifs: result.typesTarifs?.length || 0
        });
        return result;
      },
      null,
      (error) => {
        log.error('❌ Erreur chargement données initiales:', error);
        throw error;
      }
    );
  }, [tarificationService, executeApi, log]);

  /**
   * Récupère les services avec leurs unités liées et leur unité par défaut
   * @param {boolean} actifsUniquement - Filtrer uniquement les services actifs
   * @returns {Promise<Array>} Services enrichis
   */
  const getServicesAvecUnites = useCallback(async (actifsUniquement = false) => {
    return await executeApi(
      async () => {
        log.debug('📥 Chargement des services avec unités...', { actifsUniquement });
        const result = await tarificationService.getServicesAvecUnites(actifsUniquement);
        log.debug('✅ Services avec unités chargés:', result?.length || 0);
        return result;
      },
      null,
      (error) => {
        log.error('❌ Erreur chargement services avec unités:', error);
        throw error;
      }
    );
  }, [tarificationService, executeApi, log]);

  /**
   * Récupère les données optimisées pour un formulaire de facturation
   * @returns {Promise<Object>} { services, serviceDefaut, servicesOptions }
   */
  const getDonneesFacturation = useCallback(async () => {
    return await executeApi(
      async () => {
        log.debug('📥 Chargement des données de facturation...');
        const result = await tarificationService.getDonneesFacturation();
        log.debug('✅ Données facturation chargées:', {
          services: result.services?.length || 0,
          serviceDefaut: result.serviceDefaut?.nomService || 'aucun'
        });
        return result;
      },
      null,
      (error) => {
        log.error('❌ Erreur chargement données facturation:', error);
        throw error;
      }
    );
  }, [tarificationService, executeApi, log]);

  /**
   * Obtient les unités liées à un service (depuis le cache)
   * Méthode synchrone - utilise le cache de TarificationService
   * @param {number} idService
   * @returns {Array}
   */
  const getUnitesPourService = useCallback((idService) => {
    log.debug('🔍 Récupération unités pour service:', idService);
    const result = tarificationService.getUnitesPourService(idService);
    log.debug('✅ Unités trouvées:', result?.length || 0);
    return result;
  }, [tarificationService, log]);

  /**
   * Obtient l'unité par défaut d'un service (depuis le cache)
   * Méthode synchrone - utilise le cache de TarificationService
   * @param {number} idService
   * @returns {Object|null}
   */
  const getUniteDefautPourService = useCallback((idService) => {
    log.debug('🔍 Récupération unité par défaut pour service:', idService);
    const result = tarificationService.getUniteDefautPourService(idService);
    log.debug('✅ Unité par défaut:', result?.nomUnite || 'aucune');
    return result;
  }, [tarificationService, log]);

  /**
   * Obtient l'ID de l'unité par défaut d'un service (depuis le cache)
   * Méthode synchrone - utilise le cache de TarificationService
   * @param {number} idService
   * @returns {number|null}
   */
  const getIdUniteDefautPourService = useCallback((idService) => {
    log.debug('🔍 Récupération ID unité par défaut pour service:', idService);
    const result = tarificationService.getIdUniteDefautPourService(idService);
    log.debug('✅ ID unité par défaut:', result);
    return result;
  }, [tarificationService, log]);

  /**
   * Obtient un service enrichi par son ID (depuis le cache)
   * Méthode synchrone - utilise le cache de TarificationService
   * @param {number} idService
   * @returns {Object|null}
   */
  const getServiceAvecUnites = useCallback((idService) => {
    log.debug('🔍 Récupération service avec unités:', idService);
    const result = tarificationService.getServiceAvecUnites(idService);
    log.debug('✅ Service trouvé:', result?.nomService || 'aucun');
    return result;
  }, [tarificationService, log]);


  // ========================================
  // RETOUR DE TOUTES LES ACTIONS
  // ========================================

  return {
    // État global
    isLoading,
    error,

    // ✅ FONCTIONS CRUD GÉNÉRIQUES (5 fonctions au lieu de 25+)
    charger,           // Remplace: chargerServices, chargerUnites, chargerTypesTarifs, getAllTarifs, getAllTarifsSpeciaux
    create,            // Remplace: createService, createUnite, createTypeTarif, createTarif, createTarifSpecial
    update,            // Remplace: updateService, updateUnite, updateTypeTarif, updateTarif, updateTarifSpecial
    delete: deleteEntity, // Remplace: deleteService, deleteUnite, deleteTypeTarif, deleteTarif, deleteTarifSpecial
    checkUsage,        // Remplace: checkServiceUsage, checkUniteUsage, checkTypeTarifUsage, checkTarifUsage, checkTarifSpecialUsage

    // Fonctions spécifiques services
    updateServiceUniteDefault,

    // Fonctions spécifiques unités
    getUniteDefault,

    // Liaisons service-unité (4 fonctions)
    linkServiceUnite,
    unlinkServiceUnite,
    checkServiceUniteUsageInFacture,
    chargerServicesUnites,

    // ✅ NOUVEAU: Données initiales unifiées
    getDonneesInitiales,      // Charge tout en une requête
    getServicesAvecUnites,    // Services enrichis avec unités
    getDonneesFacturation,    // Données optimisées pour formulaires
    
    // ✅ NOUVEAU: Accès direct aux données du cache (synchrone)
    getUnitesPourService,        // Unités liées à un service
    getUniteDefautPourService,   // Unité par défaut d'un service (objet)
    getIdUniteDefautPourService, // ID de l'unité par défaut
    getServiceAvecUnites,        // Service enrichi par ID

    // Recherche et récupération spécifiques (3 fonctions)
    getTarifs,
    getTarifClient,
    getTarifsSpeciaux,

    // Calculs et utilitaires (7 fonctions)
    calculerPrix,
    estTherapeute,
    possedeTarifSpecialDefini,
    getTarifInfoMessage,
    getUnitesApplicablesPourClient,
    initialiser,
    clearCache
    // ,

    // // Clients (1 fonction)
    // chargerClients
  };
};