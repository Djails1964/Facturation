/**
 * Service de gestion des tarifications - VERSION camelCase UNIQUEMENT
 * @class TarificationService
 * @description Gère les services, unités, tarifs et calculs de prix
 */
import api from './api';
import { normalizeServices, normalizeUnites, normalizeTypesTarifs, toBoolean } from '../utils/booleanHelper';
import { createLogger } from '../utils/createLogger';

class TarificationService {
  constructor() {
    this.services = [];
    this.unites = [];
    this.typesTarifs = [];
    this.servicesUnites = {}; // Mapping des services aux unités
    this._cacheResultat = {}; // Cache pour les résultats de tarifs

    // ✅ NOUVEAU : Cache pour éviter les rechargements
    this._cache = {
      services: null,
      unites: null,
      typesTarifs: null,
      servicesUnites: null,
      lastUpdate: null,
      isInitialized: false,
      servicesAvecUnites: null,  // NOUVEAU: Cache pour services enrichis
      donneesInitiales: null     // NOUVEAU: Cache pour données complètes
    };
    
    // ✅ NOUVEAU : Verrous pour éviter les appels simultanés
    this._locks = {
      services: false,
      unites: false,
      typesTarifs: false,
      servicesUnites: false,
      donneesInitiales: false    // NOUVEAU: Verrou pour données initiales
    };
    
    // Bind des méthodes pour s'assurer que 'this' est correctement défini
    this.chargerServices = this.chargerServices.bind(this);
    this.createService = this.createService.bind(this);
    this.updateService = this.updateService.bind(this);
    this.updateServiceUniteDefault = this.updateServiceUniteDefault.bind(this);
    this.deleteService = this.deleteService.bind(this);
    this.chargerUnites = this.chargerUnites.bind(this);
    this.createUnite = this.createUnite.bind(this);
    this.updateUnite = this.updateUnite.bind(this);
    this.deleteUnite = this.deleteUnite.bind(this);
    this.linkServiceUnite = this.linkServiceUnite.bind(this);
    this.unlinkServiceUnite = this.unlinkServiceUnite.bind(this);
    this.chargerTypesTarifs = this.chargerTypesTarifs.bind(this);
    this.createTypeTarif = this.createTypeTarif.bind(this);
    this.updateTypeTarif = this.updateTypeTarif.bind(this);
    this.deleteTypeTarif = this.deleteTypeTarif.bind(this);
    this.getTarifClient = this.getTarifClient.bind(this);
    this.getTarifs = this.getTarifs.bind(this);
    this.getTarifsSpeciaux = this.getTarifsSpeciaux.bind(this);
    this.createTarif = this.createTarif.bind(this);
    this.createTarifSpecial = this.createTarifSpecial.bind(this);
    this.updateTarif = this.updateTarif.bind(this);
    this.updateTarifSpecial = this.updateTarifSpecial.bind(this);
    this.deleteTarifSpecial = this.deleteTarifSpecial.bind(this);
    this.deleteTarif = this.deleteTarif.bind(this);
    this.initialiser = this.initialiser.bind(this);
    this.chargerServicesUnites = this.chargerServicesUnites.bind(this);
    this.getTypesServices = this.getTypesServices.bind(this);
    this.getUnitesForService = this.getUnitesForService.bind(this);
    this.calculerPrix = this.calculerPrix.bind(this);
    this.getPrix = this.getPrix.bind(this);
    this.isServiceDefault = this.isServiceDefault.bind(this);
    this.isUniteDefault = this.isUniteDefault.bind(this);
    this.getServiceDefault = this.getServiceDefault.bind(this);
    this.getUniteDefault = this.getUniteDefault.bind(this);
    this.estTherapeute = this.estTherapeute.bind(this);
    this.possedeTarifSpecialDefini = this.possedeTarifSpecialDefini.bind(this);
    this.getTarifInfoMessage = this.getTarifInfoMessage.bind(this);
    this.getUnitesApplicablesPourClient = this.getUnitesApplicablesPourClient.bind(this);
    this.checkUniteUsage = this.checkUniteUsage.bind(this);
    this.checkServiceUsage = this.checkServiceUsage.bind(this);
    this.checkServiceUniteUsageInFacture = this.checkServiceUniteUsageInFacture.bind(this);
    this.checkTypeTarifUsage = this.checkTypeTarifUsage.bind(this);
    this.checkTarifSpecialUsage = this.checkTarifSpecialUsage.bind(this);
    this.checkTarifUsage = this.checkTarifUsage.bind(this);
    this.getDonneesInitiales = this.getDonneesInitiales.bind(this);
    this.getServicesAvecUnites = this.getServicesAvecUnites.bind(this);
    this.getDonneesFacturation = this.getDonneesFacturation.bind(this);
    this.getUnitesPourService = this.getUnitesPourService.bind(this);
    this.getUniteDefautPourService = this.getUniteDefautPourService.bind(this);
    this.getIdUniteDefautPourService = this.getIdUniteDefautPourService.bind(this);

    this.log = createLogger('TarificationService');

  }

  /**
   * Vide le cache de résultats pour forcer de nouveaux calculs
   */
  clearCache() {
    this._cacheResultat = {};
    // Reinitialiser completement le cache (y compris les cles dynamiques)
    this._cache = {
      services: null,
      unites: null,
      unites_all: null,  // AJOUT: Cle dynamique pour toutes les unites
      typesTarifs: null,
      servicesUnites: null,
      servicesAvecUnites: null,
      donneesInitiales: null,
      lastUpdate: null,
      isInitialized: false
    };
    this.log.debug('Cache de tarification vide completement');
  }

  /**
   * NOUVEAU: Vide uniquement le cache des unites (toutes les cles)
   */
  clearUniteCache() {
    // Supprimer toutes les cles commencant par unites
    Object.keys(this._cache).forEach(key => {
      if (key.startsWith('unites')) {
        this._cache[key] = null;
      }
    });
    this._cache.servicesUnites = null;
    this._cache.servicesAvecUnites = null;
    this.log.debug('Cache des unites vide');
  }

  /**
   * NOUVEAU: Vide uniquement le cache des services
   */
  clearServiceCache() {
    this._cache.services = null;
    this._cache.servicesUnites = null;
    this._cache.servicesAvecUnites = null;
    this.log.debug('Cache des services vide');
  }

  /**
   * Charger tous les services disponibles
   * @returns {Promise<Array>} Liste des services avec booléens normalisés
   */
  async chargerServices() {
    // ✅ CACHE : Retourner les données en cache si disponibles
    if (this._cache.services && !this._locks.services) {
      this.log.debug('🔄 Services retournés depuis le cache');
      return this._cache.services;
    }

    // ✅ VERROU : Éviter les appels simultanés
    if (this._locks.services) {
      this.log.debug('⏳ Chargement des services déjà en cours, attente...');
      // Attendre que le verrou soit libéré
      while (this._locks.services) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return this._cache.services || [];
    }

    try {
      this._locks.services = true;
      this.log.debug('📥 Chargement des services depuis l\'API');
      
      const response = await api.get('tarif-api.php?services=true');
      
      if (response && response.success && response.services) {
        const validServices = response.services.filter(service => 
          service && 
          typeof service === 'object' && 
          service.idService && 
          typeof service.codeService === 'string' && 
          typeof service.nomService === 'string'
        );

        const normalizedServices = normalizeServices(validServices);
        
        // ✅ MISE EN CACHE
        this._cache.services = normalizedServices;
        this.services = normalizedServices; // Compatibilité
        
        this.log.debug('✅ Services chargés et mis en cache:', normalizedServices.length);
        return normalizedServices;
      }
      
      return [];
    } catch (error) {
      this.log.error('❌ Erreur lors du chargement des services:', error);
      return [];
    } finally {
      this._locks.services = false;
    }
  }


  /**
   * Créer un nouveau service
   * @param {Object} serviceData Données du service
   * @returns {Promise<Object>} Résultat de la création
   */
  async createService(serviceData) {
    const payload = {
      action: 'createService',
      ...serviceData,
      actif: toBoolean(serviceData.actif),
      isDefault: toBoolean(serviceData.isDefault)
    };
    
    const response = await api.post('tarif-api.php', payload);
    this.clearCache(); // Vider le cache après modification
    if (response.success && response.service) {
      this.log.debug('Service créé avec objet complet:', response.service);
    }
    return response;
  }

  /**
   * Mettre à jour un service existant
   * @param {number} id ID du service
   * @param {Object} serviceData Données mises à jour
   * @returns {Promise<Object>} Résultat de la mise à jour
   */
  async updateService(id, serviceData) {
    try {
      const payload = {
        action: 'updateService',
        id,
        ...serviceData,
        actif: toBoolean(serviceData.actif),
        isDefault: toBoolean(serviceData.isDefault)
      };
      
      const response = await api.put('tarif-api.php', payload);
      this.clearCache(); // Vider le cache après modification
      return response;
    } catch (error) {
      this.log.error('Erreur lors de la mise à jour du service:', error);
      throw error;
    }
  }


  /**
   * Mettre à jour l'unité par défaut d'un service
   * @param {number} idService ID du service
   * @param {number} idUnite ID de l'unité
   * @returns {Promise<Object>} Résultat de la mise à jour
   */
  async updateServiceUniteDefault(idService, idUnite) {
    try {
      const response = await api.post('tarif-api.php', {
        action: 'updateServiceUniteDefault',
        idService,
        idUnite
      });
      this.clearCache();
      return response;
    } catch (error) {
      this.log.error('Erreur lors de la mise à jour de l\'unité par défaut:', error);
      throw error;
    }
  }

  /**
   * Supprimer un service
   * @param {number} id ID du service à supprimer
   * @returns {Promise<Object>} Résultat de la suppression
   */
  async deleteService(id) {
    try {
      const response = await api.delete(`tarif-api.php?id=${id}&type=service`);
      this.clearCache(); // Vider le cache après suppression
      return response;
    } catch (error) {
      this.log.error('Erreur lors de la suppression du service:', error);
      throw error;
    }
  }

  /**
   * Charger les unités pour un service spécifique ou tous les services
   * @param {number} [idService] ID du service optionnel
   * @returns {Promise<Array>} Liste des unités avec booléens normalisés
   */
  async chargerUnites(idService = null) {
    const cacheKey = idService ? `unites_${idService}` : 'unites_all';

    // ✅ CACHE : Vérifier le cache spécifique
    if (this._cache[cacheKey] && !this._locks.unites) {
      this.log.debug('🔄 Unités retournées depuis le cache:', cacheKey);
      return this._cache[cacheKey];
    }

    // ✅ VERROU : Éviter les appels simultanés
    if (this._locks.unites) {
      this.log.debug('⏳ Chargement des unités déjà en cours, attente...');
      while (this._locks.unites) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return this._cache[cacheKey] || [];
    }

    try {
      this._locks.unites = true;
      this.log.debug('📥 Chargement des unités depuis l\'API, idService:', idService);

      const url = idService
        ? `tarif-api.php?unites=true&idService=${idService}`
        : 'tarif-api.php?unites=true';
      
      const response = await api.get(url);
      
      if (response && response.success && response.unites) {
        const validUnites = response.unites.filter(unite => 
          unite && 
          typeof unite === 'object' && 
          unite.idUnite && 
          typeof unite.codeUnite === 'string' && 
          typeof unite.nomUnite === 'string'
        );
        
        const normalizedUnites = normalizeUnites(validUnites);
        
        // ✅ MISE EN CACHE
        this._cache[cacheKey] = normalizedUnites;
        if (!idService) {
          this.unites = normalizedUnites; // Compatibilité
        }
        
        this.log.debug('✅ Unités chargées et mises en cache:', normalizedUnites.length);
        return normalizedUnites;
      }
      
      return [];
    } catch (error) {
      this.log.error('❌ Erreur lors du chargement des unités:', error);
      return [];
    } finally {
      this._locks.unites = false;
    }
  }

  /**
   * Créer une nouvelle unité
   * @param {Object} uniteData Données de l'unité
   * @returns {Promise<Object>} Résultat de la création
   */
  async createUnite(uniteData) {
    try {
      const payload = {
        action: 'createUnite',
        ...uniteData,
        // actif: toBoolean(uniteData.actif),
        // isDefault: toBoolean(uniteData.isDefault)
      };
      
      this.log.debug("Données pour création d'unité : ", payload);
      const response = await api.post('tarif-api.php', payload);
      this.clearCache(); // Vider le cache après modification
      return response;
    } catch (error) {
      this.log.error('Erreur lors de la création de l\'unité:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour une unité existante
   * @param {number} id ID de l'unité
   * @param {Object} uniteData Données mises à jour
   * @returns {Promise<Object>} Résultat de la mise à jour
   */
  async updateUnite(id, uniteData) {
    try {
      const payload = {
        action: 'updateUnite',
        id,
        ...uniteData,
        // actif: toBoolean(uniteData.actif),
        // isDefault: toBoolean(uniteData.isDefault)
      };
      
      const response = await api.put('tarif-api.php', payload);
      this.clearCache(); // Vider le cache après modification
      return response;
    } catch (error) {
      this.log.error('Erreur lors de la mise à jour de l\'unité:', error);
      throw error;
    }
  }

  /**
   * Supprimer une unité
   * @param {number} id ID de l'unité à supprimer
   * @returns {Promise<Object>} Résultat de la suppression
   */
  async deleteUnite(id) {
    try {
      const response = await api.delete(`tarif-api.php?id=${id}&type=unite`);
      this.clearCache(); // Vider le cache après suppression
      return response;
    } catch (error) {
      this.log.error('Erreur lors de la suppression de l\'unité:', error);
      throw error;
    }
  }

  /**
   * Associer une unité à un service
   * @param {number} idService ID du service
   * @param {number} idUnite ID de l'unité
   * @returns {Promise<Object>} Résultat de l'association
   */
  async linkServiceUnite(idService, idUnite) {
    try {
      const payload = {
        action: 'linkServiceUnite',
        idService: Number(idService),
        idUnite: Number(idUnite)
      };
      
      this.log.debug('Payload pour l\'association:', payload);
      const response = await api.post('tarif-api.php', payload);
      this.clearCache();
      return response;
    } catch (error) {
      this.log.error('Erreur lors de l\'association de l\'unité au service:', error);
      throw error;
    }
  }

  /**
   * Dissocier une unité d'un service
   * @param {number} idService ID du service
   * @param {number} idUnite ID de l'unité
   * @returns {Promise<Object>} Résultat de la dissociation
   */
  async unlinkServiceUnite(idService, idUnite) {
    try {
      const params = {
        type: 'serviceUnite',
        idService,
        idUnite
      };
      this.log.debug('Params pour la dissociation:', params);
      const response = await api.delete('tarif-api.php', params);
      this.clearCache();
      return response;
    } catch (error) {
      this.log.error('Erreur lors de la dissociation:', error);
      throw error;
    }
  }

  /**
   * Vérifie si un service est utilisé dans des factures ou des tarifs
   * @param {number} id ID du service à vérifier
   * @returns {Promise<Object>} Résultat de la vérification
   */
  async checkServiceUsage(id) {
    try {
      this.log.debug("checkServiceUsage - id en input: ", id);
      const response = await api.get(`tarif-api.php?checkServiceUsage=${id}`);
      return response;
    } catch (error) {
      this.log.error('Erreur lors de la vérification de l\'utilisation du service:', error);
      throw error;
    }
  }

  /**
   * Vérifie si une liaison service-unité est utilisée dans des factures
   * @param {number} idService ID du service
   * @param {number} idUnite ID de l'unité
   * @returns {Promise<Object>} Résultat de la vérification
   */
  async checkServiceUniteUsageInFacture(idService, idUnite) {
    try {
      const response = await api.get(`tarif-api.php?checkServiceUniteUsageInFacture=true&idService=${idService}&idUnite=${idUnite}`);
      return response;
    } catch (error) {
      this.log.error('Erreur lors de la vérification de l\'utilisation de la liaison dans les factures:', error);
      throw error;
    }
  }

  /**
   * Vérifie si une unité est utilisée dans des factures ou des tarifs
   * @param {number} id ID de l'unité à vérifier
   * @returns {Promise<Object>} Résultat de la vérification
   */
  async checkUniteUsage(id) {
    try {
      const response = await api.get(`tarif-api.php?checkUniteUsage=${id}`);
      return response;
    } catch (error) {
      this.log.error('Erreur lors de la vérification de l\'utilisation de l\'unité:', error);
      throw error;
    }
  }

  /**
   * Vérifie si un type de tarif est utilisé dans des tarifs
   * @param {number} id ID du type de tarif à vérifier
   * @returns {Promise<Object>} Résultat de la vérification
   */
  async checkTypeTarifUsage(id) {
    try {
      const response = await api.get(`tarif-api.php?checkTypeTarifUsage=${id}`);
      return response;
    } catch (error) {
      this.log.error('Erreur lors de la vérification de l\'utilisation du type de tarif:', error);
      throw error;
    }
  }

  /**
   * Vérifie si un tarif standard est utilisé dans des factures
   * @param {number} id ID du tarif standard
   * @returns {Promise<Object>} Résultat de la vérification
   */
  async checkTarifUsage(id) {
    try {
      const response = await api.get(`tarif-api.php?checkTarifUsage=${id}`);
      return response;
    } catch (error) {
      this.log.error('Erreur lors de la vérification de l\'utilisation du tarif:', error);
      throw error;
    }
  }

  /**
   * Vérifie si un tarif spécial est utilisé dans des factures
   * @param {number} id ID du tarif spécial
   * @returns {Promise<Object>} Résultat de la vérification
   */
  async checkTarifSpecialUsage(id) {
    try {
      const response = await api.get(`tarif-api.php?checkTarifSpecialUsage=${id}`);
      return response;
    } catch (error) {
      this.log.error('Erreur lors de la vérification de l\'utilisation du tarif spécial:', error);
      throw error;
    }
  }

  /**
   * Récupérer les types de tarifs
   * @returns {Promise<Array>} Liste des types de tarifs avec booléens normalisés
   */
  async chargerTypesTarifs() {
    if (this._cache.typesTarifs && !this._locks.typesTarifs) {
      this.log.debug('🔄 Types de tarifs retournés depuis le cache');
      return this._cache.typesTarifs;
    }

    if (this._locks.typesTarifs) {
      this.log.debug('⏳ Chargement des types de tarifs déjà en cours, attente...');
      while (this._locks.typesTarifs) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return this._cache.typesTarifs || [];
    }

    try {
      this._locks.typesTarifs = true;
      this.log.debug('📥 Chargement des types de tarifs depuis l\'API');
      
      const response = await api.get('tarif-api.php?typesTarifs=true');
      
      if (response && response.success && response.typesTarifs) {
        const validTypesTarifs = response.typesTarifs.filter(typeTarif => 
          typeTarif && 
          typeof typeTarif === 'object' && 
          typeTarif.idTypeTarif && 
          typeof typeTarif.codeTypeTarif === 'string' && 
          typeof typeTarif.nomTypeTarif === 'string'
        );

        const normalizedTypesTarifs = normalizeTypesTarifs(validTypesTarifs);
        
        this._cache.typesTarifs = normalizedTypesTarifs;
        this.typesTarifs = normalizedTypesTarifs;
        
        this.log.debug('✅ Types de tarifs chargés et mis en cache:', normalizedTypesTarifs.length);
        return normalizedTypesTarifs;
      }
      
      return [];
    } catch (error) {
      this.log.error('❌ Erreur lors du chargement des types de tarifs:', error);
      return [];
    } finally {
      this._locks.typesTarifs = false;
    }
  }

  /**
   * Créer un nouveau type de tarif
   * @param {Object} typeTarifData Données du type de tarif
   * @returns {Promise<Object>} Résultat de la création
   */
  async createTypeTarif(typeTarifData) {
    try {
      const payload = {
        action: 'createTypeTarif',
        ...typeTarifData,
        // ✅ NORMALISATION DES BOOLÉENS AVANT ENVOI
        // actif: toBoolean(typeTarifData.actif),
        // isDefault: toBoolean(typeTarifData.isDefault)
      };
      
      const response = await api.post('tarif-api.php', payload);
      return response;
    } catch (error) {
      this.log.error('Erreur lors de la création du type de tarif:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour un type de tarif existant
   * @param {number} id ID du type de tarif
   * @param {Object} typeTarifData Données mises à jour
   * @returns {Promise<Object>} Résultat de la mise à jour
   */
  async updateTypeTarif(id, typeTarifData) {
    try {
      const payload = {
        action: 'updateTypeTarif',
        id,
        ...typeTarifData,
        // ✅ NORMALISATION DES BOOLÉENS AVANT ENVOI
        // actif: toBoolean(typeTarifData.actif),
        // isDefault: toBoolean(typeTarifData.isDefault)
      };
      
      const response = await api.put('tarif-api.php', payload);
      return response;
    } catch (error) {
      this.log.error('Erreur lors de la mise à jour du type de tarif:', error);
      throw error;
    }
  }

  /**
   * Supprimer un type de tarif
   * @param {number} id ID du type de tarif à supprimer
   * @returns {Promise<Object>} Résultat de la suppression
   */
  async deleteTypeTarif(id) {
    try {
      const response = await api.delete(`tarif-api.php?id=${id}&type=typeTarif`);
      this.clearCache()
      return response;
    } catch (error) {
      this.log.error('Erreur lors de la suppression du type de tarif:', error);
      throw error;
    }
  }

  /**
   * Obtenir le tarif pour un client spécifique
   * @param {Object} params Paramètres pour obtenir le tarif
   * @returns {Promise<Object>} Détails du tarif
   */
  async getTarifClient(params) {
    const { idClient, idService, idUnite, date } = params;
    
    try {
      const queryParams = {
        tarifClient: 'true',
        idClient,
        idService,
        idUnite,
        date: date || new Date().toISOString().split('T')[0]
      };

      this.log.debug('Params pour getTarifClient:', queryParams);
      const response = await api.get('tarif-api.php', queryParams);
      this.log.debug('Réponse de getTarifClient:', response);
      return response;
    } catch (error) {
      this.log.error('Erreur lors de la récupération du tarif client:', error);
      return null;
    }
  }

  /**
   * Récupérer les tarifs
   * @param {Object} params Paramètres de filtrage
   * @returns {Promise<Array>} Liste des tarifs
   */
  async getTarifs(params = {}) {
    const { idService, idUnite, idTypeTarif, date } = params;

    try {
      const queryParams = {
        tarifs: 'true'
      };

      if (idService) queryParams.idService = idService;
      if (idUnite) queryParams.idUnite = idUnite;
      if (idTypeTarif) queryParams.idTypeTarif = idTypeTarif;
      if (date) queryParams.date = date;

      const response = await api.get('tarif-api.php', queryParams);
      
      return response && response.success 
        ? response.tarifs || [] 
        : [];
    } catch (error) {
      this.log.error('Erreur lors de la récupération des tarifs:', error);
      return [];
    }
  }

  /**
   * Récupérer tous les tarifs standards (valides ou non)
   * @param {Object} params Paramètres de filtrage optionnels
   * @returns {Promise<Array>} Liste de tous les tarifs standards
   */
  async getAllTarifs(params = {}) {
    const { idService, idUnite, typeTarifId } = params;
    
    try {
      const queryParams = {
        allTarifs: 'true'
      };
      
      if (idService) queryParams.idService = idService;
      if (idUnite) queryParams.idUnite = idUnite;
      if (typeTarifId) queryParams.typeTarifId = typeTarifId;

      const response = await api.get('tarif-api.php', queryParams);
      
      return response && response.success 
        ? response.tarifs || [] 
        : [];
    } catch (error) {
      this.log.error('Erreur lors de la récupération de tous les tarifs:', error);
      return [];
    }
  }

  /**
   * Récupérer tous les tarifs spéciaux (valides ou non)
   * @param {Object} params Paramètres de filtrage optionnels
   * @returns {Promise<Array>} Liste de tous les tarifs spéciaux
   */
  async getAllTarifsSpeciaux(params = {}) {
    const { idClient, idService, idUnite } = params;
    
    try {
      const queryParams = {
        allTarifsSpeciaux: 'true'
      };
      
      if (idClient) queryParams.idClient = idClient;
      if (idService) queryParams.idService = idService;
      if (idUnite) queryParams.idUnite = idUnite;

      const response = await api.get('tarif-api.php', queryParams);
      
      return response && response.success 
        ? response.tarifsSpeciaux || [] 
        : [];
    } catch (error) {
      this.log.error('Erreur lors de la récupération de tous les tarifs spéciaux:', error);
      return [];
    }
  }

  /**
   * Récupérer les tarifs spéciaux
   * @param {Object} params Paramètres de filtrage
   * @returns {Promise<Array>} Liste des tarifs spéciaux
   */
  async getTarifsSpeciaux(params = {}) {
    const { idClient, idService, idUnite, date } = params;
    
    try {
      const queryParams = {
        tarifsSpeciaux: 'true'
      };
      
      if (idClient) queryParams.idClient = idClient;
      if (idService) queryParams.idService = idService;
      if (idUnite) queryParams.idUnite = idUnite;
      if (date) queryParams.date = date;

      const response = await api.get('tarif-api.php', queryParams);
      
      return response && response.success 
        ? response.tarifsSpeciaux || [] 
        : [];
    } catch (error) {
      this.log.error('Erreur lors de la récupération des tarifs spéciaux:', error);
      return [];
    }
  }

  /**
   * ✅ MÉTHODE UTILITAIRE pour nettoyer les dates vides
   * @param {Object} data - Données à nettoyer
   * @returns {Object} Données avec dates vides converties en null
   */
  static cleanDateFields(data) {
    if (!data || typeof data !== 'object') {
      return data;
    }
    
    const cleaned = { ...data };
    
    // Liste des champs de date (camelCase et snake_case)
    const dateFields = [
      'dateDebut', 'date_debut',
      'dateFin', 'date_fin',
      'dateCreation', 'date_creation', 
      'dateModification', 'date_modification'
    ];
    
    dateFields.forEach(field => {
      if (cleaned.hasOwnProperty(field) && cleaned[field] === '') {
        this.log.debug(`🗂️ TarificationService - Nettoyage date vide: ${field} = "${cleaned[field]}" → null`);
        cleaned[field] = null;
      }
    });
    
    return cleaned;
  }

  /**
   * Créer un nouveau tarif
   * @param {Object} tarifData Données du tarif
   * @returns {Promise<Object>} Résultat de la création
   */
  async createTarif(tarifData) {
    try {
      // ✅ NETTOYAGE des dates vides AVANT envoi
      const cleanedData = TarificationService.cleanDateFields(tarifData);
      
      const payload = {
        action: 'createTarif',
        ...cleanedData
      };
      
      this.log.debug('🚀 Création tarif - payload nettoyé:', payload);
      
      const response = await api.post('tarif-api.php', payload);
      return response;
    } catch (error) {
      this.log.error('Erreur lors de la création du tarif:', error);
      throw error;
    }
  }

  /**
   * Crée un nouveau tarif spécial
   * @param {Object} tarifSpecialData Données du tarif spécial
   * @returns {Promise<Object>} Résultat de la création
   */
  async createTarifSpecial(tarifSpecialData) {
    try {
      // ✅ NETTOYAGE des dates vides AVANT envoi
      const cleanedData = TarificationService.cleanDateFields(tarifSpecialData);
      
      const payload = {
        action: 'createTarifSpecial',
        ...cleanedData
      };
      
      this.log.debug('🚀 Création tarif spécial - payload nettoyé:', payload);
      
      const response = await api.post('tarif-api.php', payload);
      return response;
    } catch (error) {
      this.log.error('Erreur lors de la création du tarif spécial:', error);
      throw error;
    }
  }

  /**
   * Met à jour un tarif existant
   * @param {number} id ID du tarif
   * @param {Object} tarifData Données mises à jour
   * @returns {Promise<Object>} Résultat de la mise à jour
   */
  async updateTarif(id, tarifData) {
    try {
      // ✅ NETTOYAGE des dates vides AVANT envoi
      const cleanedData = TarificationService.cleanDateFields(tarifData);
      
      const payload = {
        action: 'updateTarif',
        id,
        ...cleanedData
      };
      
      this.log.debug('🔄 Mise à jour tarif - payload nettoyé:', payload);
      
      const response = await api.put('tarif-api.php', payload);
      return response;
    } catch (error) {
      this.log.error('Erreur lors de la mise à jour du tarif:', error);
      throw error;
    }
  }

  /**
   * Met à jour un tarif spécial existant
   * @param {number} id ID du tarif spécial
   * @param {Object} tarifSpecialData Données mises à jour
   * @returns {Promise<Object>} Résultat de la mise à jour
   */
  async updateTarifSpecial(id, tarifSpecialData) {
    try {
      // ✅ NETTOYAGE des dates vides AVANT envoi
      const cleanedData = TarificationService.cleanDateFields(tarifSpecialData);
      
      const payload = {
        action: 'updateTarifSpecial',
        id,
        ...cleanedData
      };
      
      this.log.debug('🔄 Mise à jour tarif spécial - payload nettoyé:', payload);
      
      const response = await api.put('tarif-api.php', payload);
      return response;
    } catch (error) {
      this.log.error('Erreur lors de la mise à jour du tarif spécial:', error);
      throw error;
    }
  }

  /**
   * Supprime un tarif spécial
   * @param {number} id ID du tarif spécial à supprimer
   * @returns {Promise<Object>} Résultat de la suppression
   */
  async deleteTarifSpecial(id) {
    try {
      const response = await api.delete(`tarif-api.php?id=${id}&type=tarifSpecial`);
      this.clearCache()
      return response;
    } catch (error) {
      this.log.error('Erreur lors de la suppression du tarif spécial:', error);
      throw error;
    }
  }

  /**
   * Supprimer un tarif
   * @param {number} id ID du tarif à supprimer
   * @returns {Promise<Object>} Résultat de la suppression
   */
  async deleteTarif(id) {
    try {
      const response = await api.delete(`tarif-api.php?id=${id}&type=tarif`);
      this.clearCache()
      return response;
    } catch (error) {
      this.log.error('Erreur lors de la suppression du tarif:', error);
      throw error;
    }
  }

  /**
   * Initialiser tous les services
   * @returns {Promise<Object>} Résultat de l'initialisation
   */
  async initialiser() {
    if (this._cache.isInitialized) {
      this.log.debug('✅ TarificationService déjà initialisé, retour des données en cache');
      return {
        services: this._cache.services || [],
        unites: this._cache.unites || [],
        typesTarifs: this._cache.typesTarifs || [],
        servicesUnites: this.servicesUnites
      };
    }

    try {
      this.log.debug('🚀 Initialisation du TarificationService');
      
      // Charger toutes les données de base en parallèle
      const [services, unites, typesTarifs] = await Promise.all([
        this.chargerServices(),
        this.chargerUnites(),
        this.chargerTypesTarifs()
      ]);

      // Charger les associations services-unités séparément
      await this.chargerServicesUnites();

      // Marquer comme initialisé
      this._cache.isInitialized = true;
      this._cache.lastUpdate = new Date();

      this.log.debug('✅ TarificationService initialisé avec succès');

      return {
        services,
        unites,
        typesTarifs,
        servicesUnites: this.servicesUnites
      };
    } catch (error) {
      this.log.error('❌ Erreur lors de l\'initialisation:', error);
      return {
        services: [],
        unites: [],
        typesTarifs: [],
        servicesUnites: {}
      };
    }
  }

  /**
   * ===============================
   * DONNÉES INITIALES UNIFIÉES
   * ===============================
   */

  /**
   * Charge toutes les données de tarification en une seule requête
   * C'est la méthode principale à utiliser au démarrage des composants
   * @param {boolean} forceReload - Force le rechargement même si cache valide
   * @returns {Promise<Object>} Données initialisées avec services enrichis
   */
  async getDonneesInitiales(forceReload = false) {
    // Vérifier le cache
    if (!forceReload && this._cache.donneesInitiales && this._cache.isInitialized) {
      this.log.debug('📦 Données initiales retournées depuis le cache');
      return this._cache.donneesInitiales;
    }

    // Éviter les appels simultanés
    if (this._locks.donneesInitiales) {
      this.log.debug('⏳ Chargement des données initiales déjà en cours, attente...');
      while (this._locks.donneesInitiales) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return this._cache.donneesInitiales || {};
    }

    try {
      this._locks.donneesInitiales = true;
      this.log.debug('📥 Chargement des données initiales depuis l\'API');

      const response = await api.get('tarif-api.php?donneesInitiales=true');

      if (response && response.success) {
        // Stocker dans le cache
        this._cache.donneesInitiales = {
          services: response.services || [],           // Services enrichis avec unités
          unites: response.unites || [],
          typesTarifs: response.typesTarifs || [],
          timestamp: response.timestamp
        };
        
        // Mettre à jour aussi les caches individuels pour compatibilité
        this._cache.servicesAvecUnites = response.services || [];
        this._cache.unites = response.unites || [];
        this._cache.typesTarifs = response.typesTarifs || [];
        this._cache.isInitialized = true;
        this._cache.lastUpdate = new Date();

        this.log.debug('✅ Données initiales chargées:', {
          services: this._cache.donneesInitiales.services.length,
          unites: this._cache.donneesInitiales.unites.length,
          typesTarifs: this._cache.donneesInitiales.typesTarifs.length
        });

        return this._cache.donneesInitiales;
      }

      this.log.warn('⚠️ Réponse invalide pour données initiales, fallback sur initialiser()');
      // Fallback sur l'ancienne méthode
      return this.initialiser();

    } catch (error) {
      this.log.error('❌ Erreur lors du chargement des données initiales:', error);
      // Fallback sur l'ancienne méthode en cas d'erreur
      return this.initialiser();
    } finally {
      this._locks.donneesInitiales = false;
    }
  }

  /**
   * Récupère les services avec leurs unités liées et leur unité par défaut
   * @param {boolean} actifsUniquement - Filtrer uniquement les services actifs
   * @returns {Promise<Array>} Services enrichis
   */
  async getServicesAvecUnites(actifsUniquement = false) {
    // Charger les données initiales si pas encore fait
    if (!this._cache.servicesAvecUnites) {
      await this.getDonneesInitiales();
    }

    let services = this._cache.servicesAvecUnites || [];
    
    if (actifsUniquement) {
      services = services.filter(s => toBoolean(s.actif));
    }

    return services;
  }

  /**
   * Récupère les données optimisées pour un formulaire de facturation
   * @returns {Promise<Object>}
   */
  async getDonneesFacturation() {
    try {
      // Essayer d'abord l'endpoint dédié
      const response = await api.get('tarif-api.php?donneesFacturation=true');
      
      if (response && response.success) {
        return {
          services: response.services || [],
          serviceDefaut: response.serviceDefaut || null,
          servicesOptions: response.servicesOptions || []
        };
      }
    } catch (error) {
      this.log.warn('Endpoint donneesFacturation non disponible, fallback:', error.message);
    }

    // Fallback: construire à partir des données initiales
    const servicesAvecUnites = await this.getServicesAvecUnites(true);
    const serviceDefaut = servicesAvecUnites.find(s => toBoolean(s.isDefault)) || null;

    return {
      services: servicesAvecUnites,
      serviceDefaut,
      servicesOptions: servicesAvecUnites.map(s => ({
        value: s.idService,
        label: s.nomService,
        code: s.codeService,
        unites: (s.unitesLiees || []).map(u => ({
          value: u.idUnite,
          label: u.nomUnite,
          code: u.codeUnite,
          isDefault: u.isDefaultPourService
        })),
        idUniteDefaut: s.idUniteDefaut
      }))
    };
  }

  /**
   * Obtient les unités liées à un service (depuis le cache enrichi)
   * @param {number} idService
   * @returns {Array}
   */
  getUnitesPourService(idService) {
    if (!idService) return [];
    
    const services = this._cache.servicesAvecUnites || [];
    const service = services.find(s => s.idService === idService);
    
    return service?.unitesLiees || [];
  }

  /**
   * Obtient l'unité par défaut d'un service (depuis le cache enrichi)
   * @param {number} idService
   * @returns {Object|null}
   */
  getUniteDefautPourService(idService) {
    if (!idService) return null;
    
    const services = this._cache.servicesAvecUnites || [];
    const service = services.find(s => s.idService === idService);
    
    return service?.uniteDefaut || null;
  }

  /**
   * Obtient l'ID de l'unité par défaut d'un service (depuis le cache enrichi)
   * @param {number} idService
   * @returns {number|null}
   */
  getIdUniteDefautPourService(idService) {
    if (!idService) return null;
    
    const services = this._cache.servicesAvecUnites || [];
    const service = services.find(s => s.idService === idService);
    
    return service?.idUniteDefaut || null;
  }

  /**
   * Obtient un service enrichi par son ID
   * @param {number} idService
   * @returns {Object|null}
   */
  getServiceAvecUnites(idService) {
    if (!idService) return null;
    
    const services = this._cache.servicesAvecUnites || [];
    return services.find(s => s.idService === idService) || null;
  }


  /**
   * Charger les associations entre services et unités
   * @returns {Promise<Array>} Associations entre services et unités
   */
  async chargerServicesUnites() {
    if (this._cache.servicesUnites && !this._locks.servicesUnites) {
      this.log.debug('🔄 Services-unités retournés depuis le cache');
      return this._cache.servicesUnites;
    }

    if (this._locks.servicesUnites) {
      this.log.debug('⏳ Chargement des services-unités déjà en cours, attente...');
      while (this._locks.servicesUnites) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return this._cache.servicesUnites || [];
    }

    try {
      this._locks.servicesUnites = true;
      this.log.debug('📥 Chargement des services-unités depuis l\'API');
      
      const response = await api.get('tarif-api.php?servicesUnites=true');

      this.log.debug('Résultat du chargement des services-unités depuis l\'API :', response);
      
      if (response && response.success) {
        const relations = response.servicesUnites || [];
        
        // Organiser par idService pour un accès rapide
        this.servicesUnites = {};
        relations.forEach(relation => {
          const idService = relation.idService;
          const idUnite = relation.idUnite;
          
          if (idService && idUnite) {
            if (!this.servicesUnites[idService]) {
              this.servicesUnites[idService] = [];
            }
            this.servicesUnites[idService].push(idUnite);
          }
        });
        
        this._cache.servicesUnites = relations;
        this.log.debug('✅ Services-unités chargés et mis en cache:', relations.length);
        return relations;
      }
      return [];
    } catch (error) {
      this.log.error('❌ Erreur lors du chargement des relations services-unités:', error);
      return [];
    } finally {
      this._locks.servicesUnites = false;
    }
  }

  /**
   * Obtenir les types de services
   * @returns {Array} Codes des services
   */
  getTypesServices() {
    const services = this._cache.services || this.services;
    return services.map(service => service.codeService);
  }

  /**
   * Obtenir les unités pour un service
   * @param {string} idService ID du service
   * @returns {Array} Codes des unités
   */
  getUnitesForService(idService) {
    if (!idService) {
      return [];
    }
    
    const services = this._cache.services || this.services;
    const service = services.find(s => s.idService === idService);
    if (!service) {
      return [];
    }

    const unites = this._cache.unites || this.unites;
    if (!unites || !Array.isArray(unites)) {
      return [];
    }
    
    // Utiliser le mapping des relations services-unités
    if (this.servicesUnites && this.servicesUnites[service.idService]) {
      const uniteIds = this.servicesUnites[service.idService];
      
      if (Array.isArray(uniteIds)) {
        return uniteIds.map(idUnite => {
          const unite = unites.find(u => u.idUnite === idUnite);
          return unite ? unite.code : null;
        }).filter(code => code !== null);
      }
    }
    
    // Fallback: chercher les unités avec le id correspondant
    try {
      const unitesForService = unites.filter(u => u.idService === service.idService);
      return unitesForService.map(u => u.code);
    } catch (error) {
      this.log.error('Erreur lors du filtrage des unités:', error);
      return [];
    }
  }

  /**
   * Calculer le prix final en tenant compte des différents paramètres
   * @param {Object} params Paramètres pour le calcul du prix
   * @returns {Promise<number>} Prix calculé
   */
  async calculerPrix(params) {
    const { idClient, idService, idUnite, date } = params;

    this.log.debug('Calcul du prix avec les paramètres:', {
      idClient,
      idService,
      idUnite,
      date
    });

    // Essayer d'abord de récupérer un tarif spécial client
    const tarifClient = await this.getTarifClient({
      idClient,
      idService,
      idUnite,
      date
    });

    this.log.debug('Tarif client récupéré:', tarifClient);
      
    // ✅ CORRECTION: Vérifier si on a un tarif client valide avec un prix
    if (tarifClient && tarifClient.success && tarifClient.tarif && tarifClient.tarif.prix !== undefined) {
      const prix = parseFloat(tarifClient.tarif.prix);
      this.log.debug('Prix depuis tarif client:', prix);
      return prix;
    }
      
    // Si pas de tarif spécial, chercher un tarif standard
    const tarifs = await this.getTarifs({
      idService,
      idUnite,
      date 
    });
    
    this.log.debug('Tarifs standards récupérés:', tarifs);
      
    // ✅ CORRECTION: Meilleure gestion des tarifs standards
    if (tarifs && Array.isArray(tarifs) && tarifs.length > 0) {
      // Chercher le premier tarif avec un prix valide
      for (const tarif of tarifs) {
        if (tarif && tarif.prix !== undefined && tarif.prix !== null) {
          const prix = parseFloat(tarif.prix);
          this.log.debug('Prix depuis tarif standard:', prix);
          return prix;
        }
      }
    }
    
    // ✅ AJOUT: Fallback - essayer de récupérer TOUS les tarifs pour cette combinaison
    this.log.debug('Aucun tarif trouvé, tentative de récupération de tous les tarifs...');
    
    try {
      const tousLesTarifs = await this.getAllTarifs({
        idService: idService,
        idUnite: idUnite
      });
      
      this.log.debug('Tous les tarifs récupérés:', tousLesTarifs);
      
      if (tousLesTarifs && Array.isArray(tousLesTarifs) && tousLesTarifs.length > 0) {
        this.log.debug('Analyse des tous les tarifs pour trouver un prix valide...');
        
        // Chercher un tarif valide pour la date donnée ou le plus récent
        const tarifsValides = tousLesTarifs.filter(tarif => {
          this.log.debug('Analyse tarif complet:', tarif);
          
          // Essayer différents noms de propriétés pour le prix
          const prixValue = tarif.prix || tarif.prixTarif || tarif.montant || tarif.price;
          
          if (prixValue === undefined || prixValue === null || prixValue === '') {
            this.log.debug('Prix non trouvé dans ce tarif');
            return false;
          }
          
          const prixNum = parseFloat(prixValue);
          if (isNaN(prixNum)) {
            this.log.debug('Prix non parsable:', prixValue);
            return false;
          }
          
          // Si pas de date de début, le tarif est valide
          if (!tarif.dateDebut) return true;
          
          // Vérifier si le tarif est valide pour la date
          const dateDebut = new Date(tarif.dateDebut);
          const dateVerif = new Date(date || new Date().toISOString().split('T')[0]);
          
          let dateFinOk = true;
          if (tarif.dateFin) {
            const dateFin = new Date(tarif.dateFin);
            dateFinOk = dateVerif <= dateFin;
          }
          
          return dateVerif >= dateDebut && dateFinOk;
        });
        
        if (tarifsValides.length > 0) {
          // Prendre le premier tarif valide
          const prixValue = tarifsValides[0].prix || tarifsValides[0].prixTarif || tarifsValides[0].montant || tarifsValides[0].price;
          const prix = parseFloat(prixValue);
          this.log.debug('Prix depuis tarif valide (fallback):', prix);
          return prix;
        } else if (tousLesTarifs.length > 0) {
          // En dernier recours, prendre le premier tarif même s'il n'est pas valide pour la date
          const prixValue = tousLesTarifs[0].prix || tousLesTarifs[0].prixTarif || tousLesTarifs[0].montant || tousLesTarifs[0].price;
          if (prixValue !== undefined && prixValue !== null && prixValue !== '') {
            const prix = parseFloat(prixValue);
            if (!isNaN(prix)) {
              this.log.debug('Prix depuis tarif (dernier recours):', prix);
              return prix;
            }
          }
          this.log.debug('Aucun prix valide trouvé dans les tarifs');
        }
      }
    } catch (error) {
      this.log.error('Erreur lors de la récupération de tous les tarifs:', error);
    }
    
    this.log.debug('Aucun prix trouvé, retour de 0');
    return 0;
  }


  /**
   * Obtenir le prix pour un service, une unité et un client spécifiques
   * @param {Object} params Paramètres pour le calcul du prix
   * @returns {number} Prix calculé
   */
  getPrix(params) {
    const { typeService, unite, client } = params;
    
    if (!typeService || !unite || !client) {
      this.log.warn('Paramètres manquants pour getPrix', params);
      return 0;
    }
    
    try {
      // ✅ RECHERCHE avec camelCase uniquement
      const service = this.services.find(s => s.code === typeService);
      if (!service) {
        this.log.warn(`Service non trouvé pour le code: ${typeService}`);
        return 0;
      }
      
      const uniteObj = this.unites.find(u => u.code === unite);
      if (!uniteObj) {
        this.log.warn(`Unité non trouvée pour le code: ${unite}`);
        return 0;
      }
      
      // ✅ UTILISATION des ID camelCase
      const cacheKey = `${client.id}-${service.idService}-${uniteObj.idUnite}`;
      if (this._cacheResultat && this._cacheResultat[cacheKey] !== undefined) {
        return this._cacheResultat[cacheKey];
      }
      
      // Démarrer la requête en arrière-plan pour les futures demandes
      this.getTarifClient({
        idClient: client.id,
        idService: service.idService,
        idUnite: uniteObj.idUnite,
        date: new Date().toISOString().split('T')[0]
      }).then(tarifClient => {
        this._cacheResultat[cacheKey] = tarifClient?.prix || 0;
      }).catch(error => {
        this.log.error('Erreur lors de la récupération du tarif client:', error);
      });
      
      return 0;
    } catch (error) {
      this.log.error('Erreur dans getPrix:', error);
      return 0;
    }
  }

  /**
   * Vérifie si un service est défini comme service par défaut
   * @param {number} idService ID du service à vérifier
   * @returns {boolean} True si le service est par défaut, false sinon
   */
  isServiceDefault(idService) {
    if (!idService) return false;
    
    const services = this._cache.services || this.services;
    if (!services || !Array.isArray(services)) {
      return false;
    }
    
    const service = services.find(s => s.idService === idService);
    return service ? toBoolean(service.isDefault) : false;
  }

  /**
   * Vérifie si une unité est définie comme unité par défaut
   * @param {number} idUnite ID de l'unité à vérifier
   * @returns {boolean} True si l'unité est par défaut, false sinon
   */
  isUniteDefault(idUnite) {
    if (!idUnite) return false;
    
    const unites = this._cache.unites || this.unites;
    if (!unites || !Array.isArray(unites)) {
      return false;
    }
    
    const unite = unites.find(u => u.idUnite === idUnite);
    return unite ? toBoolean(unite.isDefault) : false;
  }

  /**
   * Obtient le service défini comme service par défaut
   * @param {Array} [services] Liste des services à vérifier
   * @returns {Object|null} Le service par défaut ou null si aucun n'est trouvé
   */
  getServiceDefault(services = null) {
    const servicesToCheck = services || this._cache.services || this.services;

    if (!servicesToCheck || !Array.isArray(servicesToCheck)) {
        this.log.warn('Aucun service disponible pour getServiceDefault');
        return null;
    }
    
    const defaultService = servicesToCheck.find(service => toBoolean(service.isDefault));
    this.log.debug('Service par défaut trouvé:', defaultService?.nomService || 'Aucun');
    return defaultService || null;
  }

  /**
   * Obtenir l'ID de l'unité par défaut pour un service
   * @param {Object} service Service pour lequel chercher l'unité par défaut
   * @returns {Promise<number|null>} ID de l'unité par défaut ou null
   */
  async getUniteDefault(service) {
    if (!service) return null;

    this.log.debug('Recherche de l\'unité par défaut pour le service:', service.nomService || service.codeService || service.idService);

    const cacheKey = `uniteDefault_${service.idService}`;
    
    // Vérifier le cache de résultats
    if (this._cacheResultat[cacheKey] !== undefined) {
      return this._cacheResultat[cacheKey];
    }

    try {
        const response = await api.get(`tarif-api.php?uniteDefautService=${service.idService}`);
        this.log.debug('Réponse de l\'API pour l\'unité par défaut:', response);
        
        if (response && response.success && response.idUnite) {
            this._cacheResultat[cacheKey] = response.idUnite;
            return response.idUnite;
        }
        
        this._cacheResultat[cacheKey] = null;
        return null;
    } catch (error) {
      this.log.error('Erreur lors de la récupération de l\'unité par défaut:', error);
      this._cacheResultat[cacheKey] = null;
      return null;
    }
  }

  /**
   * Vérifie si un client est thérapeute
   * @param {number} idClient ID du client
   * @returns {Promise<boolean>} True si le client est thérapeute, false sinon
   */
  async estTherapeute(idClient) {
    const cacheKey = `therapeute_${idClient}`;
    if (this._cacheResultat[cacheKey] !== undefined) {
      return this._cacheResultat[cacheKey];
    }

    try {
      const response = await api.get(`tarif-api.php?estTherapeute=true&idClient=${idClient}`);
      const result = response && response.success ? toBoolean(response.estTherapeute) : false;
      this._cacheResultat[cacheKey] = result;
      return result;
    } catch (error) {
      this.log.error('Erreur lors de la vérification du statut thérapeute:', error);
      return false;
    }
  }

  /**
   * Vérifie si un client possède un tarif spécial défini
   * @param {number} idClient ID du client
   * @param {string} [date] Date pour la vérification (format YYYY-MM-DD)
   * @returns {Promise<boolean>} True si le client possède un tarif spécial, false sinon
   */
  async possedeTarifSpecialDefini(idClient, date = null) {
    const cacheKey = `tarifSpecial_${idClient}_${date || 'nodate'}`;
    if (this._cacheResultat[cacheKey] !== undefined) {
      return this._cacheResultat[cacheKey];
    }

    try {
      const queryParams = {
        possedeTarifSpecial: 'true',
        idClient
      };
      
      if (date) {
        queryParams.date = date;
      }
      
      const response = await api.get('tarif-api.php', queryParams);
      const result = response && response.success ? toBoolean(response.possedeTarifSpecial) : false;
      this._cacheResultat[cacheKey] = result;
      return result;
    } catch (error) {
      this.log.error('Erreur lors de la vérification des tarifs spéciaux:', error);
      return false;
    }
  }

  /**
   * Obtenir le message de tarif en fonction du statut du client
   * @param {Object} client Client
   * @returns {Promise<string>} Message d'information sur le tarif
   */
  async getTarifInfoMessage(client) {
    const cacheKey = `tarifInfo_${client.id}`;
    
    // Vérifier le cache
    if (this._cacheResultat[cacheKey]) {
      return this._cacheResultat[cacheKey];
    }

    try {
      // Vérifier si le client possède un tarif spécial
      const possedeTarifSpecial = await this.possedeTarifSpecialDefini(client.id);
      
      let message;
      if (possedeTarifSpecial) {
        message = 'Tarif spécial appliqué';
      } else {
        // Vérifier si le client est thérapeute
        const estTherapeute = await this.estTherapeute(client.id);
        message = estTherapeute ? 'Tarif thérapeute appliqué' : 'Tarif standard appliqué';
      }
      
      // Mettre en cache
      this._cacheResultat[cacheKey] = message;
      return message;
    } catch (error) {
      this.log.error('Erreur lors de la détermination du message de tarif:', error);
      return 'Information de tarif indisponible';
    }
  }

  /**
   * Récupère toutes les unités applicables pour un client spécifique
   * @param {number} idClient ID du client
   * @param {string} [date] Date pour la recherche des tarifs valides (format YYYY-MM-DD)
   * @returns {Promise<Array>} Liste des unités avec leurs détails
   */
  async getUnitesApplicablesPourClient(idClient, date = null) {
    const cacheKey = `unitesClient_${idClient}_${date || 'nodate'}`;
    
    // Vérifier le cache
    if (this._cacheResultat[cacheKey]) {
      this.log.debug('🔄 Unités client retournées depuis le cache');
      return this._cacheResultat[cacheKey];
    }

    try {
      const queryParams = {
        unitesClient: 'true',
        idClient: idClient
      };
      
      if (date) {
        queryParams.date = date;
      }
      
      this.log.debug('📥 Chargement des unités applicables pour le client depuis l\'API', queryParams);
      const response = await api.get('tarif-api.php', queryParams);
      
      const result = response && response.success ? response.unites || [] : [];
      
      // Mettre en cache
      this._cacheResultat[cacheKey] = result;
      
      this.log.debug('✅ Unités applicables pour le client chargées:', result.length);
      return result;
    } catch (error) {
      this.log.error('❌ Erreur lors de la récupération des unités pour le client:', error);
      return [];
    }
  }
}

export default TarificationService;