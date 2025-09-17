/**
 * Service de gestion des tarifications - VERSION camelCase UNIQUEMENT
 * @class TarificationService
 * @description Gère les services, unités, tarifs et calculs de prix
 */
import api from './api';
import { normalizeServices, normalizeUnites, normalizeTypesTarifs, toBoolean } from '../utils/booleanHelper';

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
      isInitialized: false
    };
    
    // ✅ NOUVEAU : Verrous pour éviter les appels simultanés
    this._locks = {
      services: false,
      unites: false,
      typesTarifs: false,
      servicesUnites: false
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
  }

  /**
   * Vide le cache de résultats pour forcer de nouveaux calculs
   */
  clearCache() {
    this._cacheResultat = {};
    this._cache = {
      services: null,
      unites: null,
      typesTarifs: null,
      servicesUnites: null,
      lastUpdate: null,
      isInitialized: false
    };
    console.log('♻️ Cache de tarification vidé complètement');
  }

  /**
   * Charger tous les services disponibles
   * @returns {Promise<Array>} Liste des services avec booléens normalisés
   */
  async chargerServices() {
    // ✅ CACHE : Retourner les données en cache si disponibles
    if (this._cache.services && !this._locks.services) {
      console.log('🔄 Services retournés depuis le cache');
      return this._cache.services;
    }

    // ✅ VERROU : Éviter les appels simultanés
    if (this._locks.services) {
      console.log('⏳ Chargement des services déjà en cours, attente...');
      // Attendre que le verrou soit libéré
      while (this._locks.services) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return this._cache.services || [];
    }

    try {
      this._locks.services = true;
      console.log('📥 Chargement des services depuis l\'API');
      
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
        
        console.log('✅ Services chargés et mis en cache:', normalizedServices.length);
        return normalizedServices;
      }
      
      return [];
    } catch (error) {
      console.error('❌ Erreur lors du chargement des services:', error);
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
      console.error('Erreur lors de la mise à jour du service:', error);
      throw error;
    }
  }


  /**
   * Mettre à jour l'unité par défaut d'un service
   * @param {number} serviceId ID du service
   * @param {number} uniteId ID de l'unité
   * @returns {Promise<Object>} Résultat de la mise à jour
   */
  async updateServiceUniteDefault(serviceId, uniteId) {
    try {
      const response = await api.post('tarif-api.php', {
        action: 'updateServiceUniteDefault',
        serviceId,
        uniteId
      });
      return response;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'unité par défaut:', error);
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
      console.error('Erreur lors de la suppression du service:', error);
      throw error;
    }
  }

  /**
   * Charger les unités pour un service spécifique ou tous les services
   * @param {number} [serviceId] ID du service optionnel
   * @returns {Promise<Array>} Liste des unités avec booléens normalisés
   */
  async chargerUnites(idService = null) {
    const cacheKey = idService ? `unites_${idService}` : 'unites_all';

    // ✅ CACHE : Vérifier le cache spécifique
    if (this._cache[cacheKey] && !this._locks.unites) {
      console.log('🔄 Unités retournées depuis le cache:', cacheKey);
      return this._cache[cacheKey];
    }

    // ✅ VERROU : Éviter les appels simultanés
    if (this._locks.unites) {
      console.log('⏳ Chargement des unités déjà en cours, attente...');
      while (this._locks.unites) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return this._cache[cacheKey] || [];
    }

    try {
      this._locks.unites = true;
      console.log('📥 Chargement des unités depuis l\'API, idService:', idService);

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
        
        console.log('✅ Unités chargées et mises en cache:', normalizedUnites.length);
        return normalizedUnites;
      }
      
      return [];
    } catch (error) {
      console.error('❌ Erreur lors du chargement des unités:', error);
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
        actif: toBoolean(uniteData.actif),
        isDefault: toBoolean(uniteData.isDefault)
      };
      
      const response = await api.post('tarif-api.php', payload);
      this.clearCache(); // Vider le cache après modification
      return response;
    } catch (error) {
      console.error('Erreur lors de la création de l\'unité:', error);
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
        actif: toBoolean(uniteData.actif),
        isDefault: toBoolean(uniteData.isDefault)
      };
      
      const response = await api.put('tarif-api.php', payload);
      this.clearCache(); // Vider le cache après modification
      return response;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'unité:', error);
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
      console.error('Erreur lors de la suppression de l\'unité:', error);
      throw error;
    }
  }

  /**
   * Associer une unité à un service
   * @param {number} serviceId ID du service
   * @param {number} uniteId ID de l'unité
   * @returns {Promise<Object>} Résultat de l'association
   */
  async linkServiceUnite(serviceId, uniteId) {
    try {
      const payload = {
        action: 'linkServiceUnite',
        serviceId: Number(serviceId),
        uniteId: Number(uniteId)
      };
      
      console.log('Payload pour l\'association:', payload);
      const response = await api.post('tarif-api.php', payload);
      return response;
    } catch (error) {
      console.error('Erreur lors de l\'association de l\'unité au service:', error);
      throw error;
    }
  }

  /**
   * Dissocier une unité d'un service
   * @param {number} serviceId ID du service
   * @param {number} uniteId ID de l'unité
   * @returns {Promise<Object>} Résultat de la dissociation
   */
  async unlinkServiceUnite(serviceId, uniteId) {
    try {
      const params = {
        type: 'serviceUnite',
        serviceId,
        uniteId
      };
      console.log('Params pour la dissociation:', params);
      const response = await api.delete('tarif-api.php', params);
      return response;
    } catch (error) {
      console.error('Erreur lors de la dissociation:', error);
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
      const response = await api.get(`tarif-api.php?checkServiceUsage=${id}`);
      return response;
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'utilisation du service:', error);
      throw error;
    }
  }

  /**
   * Vérifie si une liaison service-unité est utilisée dans des factures
   * @param {number} serviceId ID du service
   * @param {number} uniteId ID de l'unité
   * @returns {Promise<Object>} Résultat de la vérification
   */
  async checkServiceUniteUsageInFacture(serviceId, uniteId) {
    try {
      const response = await api.get(`tarif-api.php?checkServiceUniteUsageInFacture=true&serviceId=${serviceId}&uniteId=${uniteId}`);
      return response;
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'utilisation de la liaison dans les factures:', error);
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
      console.error('Erreur lors de la vérification de l\'utilisation de l\'unité:', error);
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
      console.error('Erreur lors de la vérification de l\'utilisation du type de tarif:', error);
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
      console.error('Erreur lors de la vérification de l\'utilisation du tarif:', error);
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
      console.error('Erreur lors de la vérification de l\'utilisation du tarif spécial:', error);
      throw error;
    }
  }

  /**
   * Récupérer les types de tarifs
   * @returns {Promise<Array>} Liste des types de tarifs avec booléens normalisés
   */
  async chargerTypesTarifs() {
    if (this._cache.typesTarifs && !this._locks.typesTarifs) {
      console.log('🔄 Types de tarifs retournés depuis le cache');
      return this._cache.typesTarifs;
    }

    if (this._locks.typesTarifs) {
      console.log('⏳ Chargement des types de tarifs déjà en cours, attente...');
      while (this._locks.typesTarifs) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return this._cache.typesTarifs || [];
    }

    try {
      this._locks.typesTarifs = true;
      console.log('📥 Chargement des types de tarifs depuis l\'API');
      
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
        
        console.log('✅ Types de tarifs chargés et mis en cache:', normalizedTypesTarifs.length);
        return normalizedTypesTarifs;
      }
      
      return [];
    } catch (error) {
      console.error('❌ Erreur lors du chargement des types de tarifs:', error);
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
        actif: toBoolean(typeTarifData.actif),
        isDefault: toBoolean(typeTarifData.isDefault)
      };
      
      const response = await api.post('tarif-api.php', payload);
      return response;
    } catch (error) {
      console.error('Erreur lors de la création du type de tarif:', error);
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
        actif: toBoolean(typeTarifData.actif),
        isDefault: toBoolean(typeTarifData.isDefault)
      };
      
      const response = await api.put('tarif-api.php', payload);
      return response;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du type de tarif:', error);
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
      return response;
    } catch (error) {
      console.error('Erreur lors de la suppression du type de tarif:', error);
      throw error;
    }
  }

  /**
   * Obtenir le tarif pour un client spécifique
   * @param {Object} params Paramètres pour obtenir le tarif
   * @returns {Promise<Object>} Détails du tarif
   */
  async getTarifClient(params) {
    const { clientId, idService, idUnite, date } = params;
    
    try {
      const queryParams = {
        tarifClient: 'true',
        clientId,
        idService,
        idUnite,
        date: date || new Date().toISOString().split('T')[0]
      };

      console.log('Params pour getTarifClient:', queryParams);
      const response = await api.get('tarif-api.php', queryParams);
      console.log('Réponse de getTarifClient:', response);
      return response;
    } catch (error) {
      console.error('Erreur lors de la récupération du tarif client:', error);
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
      console.error('Erreur lors de la récupération des tarifs:', error);
      return [];
    }
  }

  /**
   * Récupérer tous les tarifs standards (valides ou non)
   * @param {Object} params Paramètres de filtrage optionnels
   * @returns {Promise<Array>} Liste de tous les tarifs standards
   */
  async getAllTarifs(params = {}) {
    const { serviceId, uniteId, typeTarifId } = params;
    
    try {
      const queryParams = {
        allTarifs: 'true'
      };
      
      if (serviceId) queryParams.serviceId = serviceId;
      if (uniteId) queryParams.uniteId = uniteId;
      if (typeTarifId) queryParams.typeTarifId = typeTarifId;

      const response = await api.get('tarif-api.php', queryParams);
      
      return response && response.success 
        ? response.tarifs || [] 
        : [];
    } catch (error) {
      console.error('Erreur lors de la récupération de tous les tarifs:', error);
      return [];
    }
  }

  /**
   * Récupérer tous les tarifs spéciaux (valides ou non)
   * @param {Object} params Paramètres de filtrage optionnels
   * @returns {Promise<Array>} Liste de tous les tarifs spéciaux
   */
  async getAllTarifsSpeciaux(params = {}) {
    const { clientId, serviceId, uniteId } = params;
    
    try {
      const queryParams = {
        allTarifsSpeciaux: 'true'
      };
      
      if (clientId) queryParams.clientId = clientId;
      if (serviceId) queryParams.serviceId = serviceId;
      if (uniteId) queryParams.uniteId = uniteId;

      const response = await api.get('tarif-api.php', queryParams);
      
      return response && response.success 
        ? response.tarifsSpeciaux || [] 
        : [];
    } catch (error) {
      console.error('Erreur lors de la récupération de tous les tarifs spéciaux:', error);
      return [];
    }
  }

  /**
   * Récupérer les tarifs spéciaux
   * @param {Object} params Paramètres de filtrage
   * @returns {Promise<Array>} Liste des tarifs spéciaux
   */
  async getTarifsSpeciaux(params = {}) {
    const { clientId, serviceId, uniteId, date } = params;
    
    try {
      const queryParams = {
        tarifsSpeciaux: 'true'
      };
      
      if (clientId) queryParams.clientId = clientId;
      if (serviceId) queryParams.serviceId = serviceId;
      if (uniteId) queryParams.uniteId = uniteId;
      if (date) queryParams.date = date;

      const response = await api.get('tarif-api.php', queryParams);
      
      return response && response.success 
        ? response.tarifsSpeciaux || [] 
        : [];
    } catch (error) {
      console.error('Erreur lors de la récupération des tarifs spéciaux:', error);
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
        console.log(`🗂️ TarificationService - Nettoyage date vide: ${field} = "${cleaned[field]}" → null`);
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
      
      console.log('🚀 Création tarif - payload nettoyé:', payload);
      
      const response = await api.post('tarif-api.php', payload);
      return response;
    } catch (error) {
      console.error('Erreur lors de la création du tarif:', error);
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
      
      console.log('🚀 Création tarif spécial - payload nettoyé:', payload);
      
      const response = await api.post('tarif-api.php', payload);
      return response;
    } catch (error) {
      console.error('Erreur lors de la création du tarif spécial:', error);
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
      
      console.log('🔄 Mise à jour tarif - payload nettoyé:', payload);
      
      const response = await api.put('tarif-api.php', payload);
      return response;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du tarif:', error);
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
      
      console.log('🔄 Mise à jour tarif spécial - payload nettoyé:', payload);
      
      const response = await api.put('tarif-api.php', payload);
      return response;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du tarif spécial:', error);
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
      return response;
    } catch (error) {
      console.error('Erreur lors de la suppression du tarif spécial:', error);
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
      return response;
    } catch (error) {
      console.error('Erreur lors de la suppression du tarif:', error);
      throw error;
    }
  }

  /**
   * Initialiser tous les services
   * @returns {Promise<Object>} Résultat de l'initialisation
   */
  async initialiser() {
    if (this._cache.isInitialized) {
      console.log('✅ TarificationService déjà initialisé, retour des données en cache');
      return {
        services: this._cache.services || [],
        unites: this._cache.unites || [],
        typesTarifs: this._cache.typesTarifs || [],
        servicesUnites: this.servicesUnites
      };
    }

    try {
      console.log('🚀 Initialisation du TarificationService');
      
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

      console.log('✅ TarificationService initialisé avec succès');

      return {
        services,
        unites,
        typesTarifs,
        servicesUnites: this.servicesUnites
      };
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation:', error);
      return {
        services: [],
        unites: [],
        typesTarifs: [],
        servicesUnites: {}
      };
    }
  }

  /**
   * Charger les associations entre services et unités
   * @returns {Promise<Array>} Associations entre services et unités
   */
  async chargerServicesUnites() {
    if (this._cache.servicesUnites && !this._locks.servicesUnites) {
      console.log('🔄 Services-unités retournés depuis le cache');
      return this._cache.servicesUnites;
    }

    if (this._locks.servicesUnites) {
      console.log('⏳ Chargement des services-unités déjà en cours, attente...');
      while (this._locks.servicesUnites) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return this._cache.servicesUnites || [];
    }

    try {
      this._locks.servicesUnites = true;
      console.log('📥 Chargement des services-unités depuis l\'API');
      
      const response = await api.get('tarif-api.php?servicesUnites=true');
      
      if (response && response.success) {
        const relations = response.servicesUnites || [];
        
        // Organiser par service_id pour un accès rapide
        this.servicesUnites = {};
        relations.forEach(relation => {
          const serviceId = relation.serviceId || relation.service_id;
          const uniteId = relation.uniteId || relation.unite_id;
          
          if (serviceId && uniteId) {
            if (!this.servicesUnites[serviceId]) {
              this.servicesUnites[serviceId] = [];
            }
            this.servicesUnites[serviceId].push(uniteId);
          }
        });
        
        this._cache.servicesUnites = relations;
        console.log('✅ Services-unités chargés et mis en cache:', relations.length);
        return relations;
      }
      return [];
    } catch (error) {
      console.error('❌ Erreur lors du chargement des relations services-unités:', error);
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
   * @param {string} serviceId ID du service
   * @returns {Array} Codes des unités
   */
  getUnitesForService(serviceId) {
    if (!serviceId) {
      return [];
    }
    
    const services = this._cache.services || this.services;
    const service = services.find(s => s.idService === serviceId);
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
        return uniteIds.map(uniteId => {
          const unite = unites.find(u => u.idUnite === uniteId);
          return unite ? unite.code : null;
        }).filter(code => code !== null);
      }
    }
    
    // Fallback: chercher les unités avec le service_id correspondant
    try {
      const unitesForService = unites.filter(u => u.serviceId === service.idService);
      return unitesForService.map(u => u.code);
    } catch (error) {
      console.error('Erreur lors du filtrage des unités:', error);
      return [];
    }
  }

  /**
   * Calculer le prix final en tenant compte des différents paramètres
   * @param {Object} params Paramètres pour le calcul du prix
   * @returns {Promise<number>} Prix calculé
   */
  async calculerPrix(params) {
    const { clientId, idService, idUnite, date } = params;

    console.log('Calcul du prix avec les paramètres:', {
      clientId,
      idService,
      idUnite,
      date
    });

    // Essayer d'abord de récupérer un tarif spécial client
    const tarifClient = await this.getTarifClient({
      clientId,
      idService,
      idUnite,
      date
    });

    console.log('Tarif client récupéré:', tarifClient);
      
    // ✅ CORRECTION: Vérifier si on a un tarif client valide avec un prix
    if (tarifClient && tarifClient.success && tarifClient.tarif && tarifClient.tarif.prix !== undefined) {
      const prix = parseFloat(tarifClient.tarif.prix);
      console.log('Prix depuis tarif client:', prix);
      return prix;
    }
      
    // Si pas de tarif spécial, chercher un tarif standard
    const tarifs = await this.getTarifs({
      idService,
      idUnite,
      date 
    });
    
    console.log('Tarifs standards récupérés:', tarifs);
      
    // ✅ CORRECTION: Meilleure gestion des tarifs standards
    if (tarifs && Array.isArray(tarifs) && tarifs.length > 0) {
      // Chercher le premier tarif avec un prix valide
      for (const tarif of tarifs) {
        if (tarif && tarif.prix !== undefined && tarif.prix !== null) {
          const prix = parseFloat(tarif.prix);
          console.log('Prix depuis tarif standard:', prix);
          return prix;
        }
      }
    }
    
    // ✅ AJOUT: Fallback - essayer de récupérer TOUS les tarifs pour cette combinaison
    console.log('Aucun tarif trouvé, tentative de récupération de tous les tarifs...');
    
    try {
      const tousLesTarifs = await this.getAllTarifs({
        serviceId: idService,
        uniteId: idUnite
      });
      
      console.log('Tous les tarifs récupérés:', tousLesTarifs);
      
      if (tousLesTarifs && Array.isArray(tousLesTarifs) && tousLesTarifs.length > 0) {
        console.log('Analyse des tous les tarifs pour trouver un prix valide...');
        
        // Chercher un tarif valide pour la date donnée ou le plus récent
        const tarifsValides = tousLesTarifs.filter(tarif => {
          console.log('Analyse tarif complet:', tarif);
          
          // Essayer différents noms de propriétés pour le prix
          const prixValue = tarif.prix || tarif.prixTarif || tarif.montant || tarif.price;
          
          if (prixValue === undefined || prixValue === null || prixValue === '') {
            console.log('Prix non trouvé dans ce tarif');
            return false;
          }
          
          const prixNum = parseFloat(prixValue);
          if (isNaN(prixNum)) {
            console.log('Prix non parsable:', prixValue);
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
          console.log('Prix depuis tarif valide (fallback):', prix);
          return prix;
        } else if (tousLesTarifs.length > 0) {
          // En dernier recours, prendre le premier tarif même s'il n'est pas valide pour la date
          const prixValue = tousLesTarifs[0].prix || tousLesTarifs[0].prixTarif || tousLesTarifs[0].montant || tousLesTarifs[0].price;
          if (prixValue !== undefined && prixValue !== null && prixValue !== '') {
            const prix = parseFloat(prixValue);
            if (!isNaN(prix)) {
              console.log('Prix depuis tarif (dernier recours):', prix);
              return prix;
            }
          }
          console.log('Aucun prix valide trouvé dans les tarifs');
        }
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de tous les tarifs:', error);
    }
    
    console.log('Aucun prix trouvé, retour de 0');
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
      console.warn('Paramètres manquants pour getPrix', params);
      return 0;
    }
    
    try {
      // ✅ RECHERCHE avec camelCase uniquement
      const service = this.services.find(s => s.code === typeService);
      if (!service) {
        console.warn(`Service non trouvé pour le code: ${typeService}`);
        return 0;
      }
      
      const uniteObj = this.unites.find(u => u.code === unite);
      if (!uniteObj) {
        console.warn(`Unité non trouvée pour le code: ${unite}`);
        return 0;
      }
      
      // ✅ UTILISATION des ID camelCase
      const cacheKey = `${client.id}-${service.idService}-${uniteObj.idUnite}`;
      if (this._cacheResultat && this._cacheResultat[cacheKey] !== undefined) {
        return this._cacheResultat[cacheKey];
      }
      
      // Démarrer la requête en arrière-plan pour les futures demandes
      this.getTarifClient({
        clientId: client.id,
        serviceId: service.idService,
        uniteId: uniteObj.idUnite,
        date: new Date().toISOString().split('T')[0]
      }).then(tarifClient => {
        this._cacheResultat[cacheKey] = tarifClient?.prix || 0;
      }).catch(error => {
        console.error('Erreur lors de la récupération du tarif client:', error);
      });
      
      return 0;
    } catch (error) {
      console.error('Erreur dans getPrix:', error);
      return 0;
    }
  }

  /**
   * Vérifie si un service est défini comme service par défaut
   * @param {number} serviceId ID du service à vérifier
   * @returns {boolean} True si le service est par défaut, false sinon
   */
  isServiceDefault(serviceId) {
    if (!serviceId) return false;
    
    const services = this._cache.services || this.services;
    if (!services || !Array.isArray(services)) {
      return false;
    }
    
    const service = services.find(s => s.idService === serviceId);
    return service ? toBoolean(service.isDefault) : false;
  }

  /**
   * Vérifie si une unité est définie comme unité par défaut
   * @param {number} uniteId ID de l'unité à vérifier
   * @returns {boolean} True si l'unité est par défaut, false sinon
   */
  isUniteDefault(uniteId) {
    if (!uniteId) return false;
    
    const unites = this._cache.unites || this.unites;
    if (!unites || !Array.isArray(unites)) {
      return false;
    }
    
    const unite = unites.find(u => u.idUnite === uniteId);
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
        console.warn('Aucun service disponible pour getServiceDefault');
        return null;
    }
    
    const defaultService = servicesToCheck.find(service => toBoolean(service.isDefault));
    console.log('Service par défaut trouvé:', defaultService?.nomService || 'Aucun');
    return defaultService || null;
  }

  /**
   * Obtenir l'ID de l'unité par défaut pour un service
   * @param {Object} service Service pour lequel chercher l'unité par défaut
   * @returns {Promise<number|null>} ID de l'unité par défaut ou null
   */
  async getUniteDefault(service) {
    if (!service) return null;

    console.log('Recherche de l\'unité par défaut pour le service:', service.nomService || service.codeService || service.idService);

    const cacheKey = `uniteDefault_${service.idService}`;
    
    // Vérifier le cache de résultats
    if (this._cacheResultat[cacheKey] !== undefined) {
      return this._cacheResultat[cacheKey];
    }

    try {
        const response = await api.get(`tarif-api.php?uniteDefautService=${service.idService}`);
        console.log('Réponse de l\'API pour l\'unité par défaut:', response);
        
        if (response && response.success && response.idUnite) {
            this._cacheResultat[cacheKey] = response.idUnite;
            return response.idUnite;
        }
        
        this._cacheResultat[cacheKey] = null;
        return null;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'unité par défaut:', error);
      this._cacheResultat[cacheKey] = null;
      return null;
    }
  }

  /**
   * Vérifie si un client est thérapeute
   * @param {number} clientId ID du client
   * @returns {Promise<boolean>} True si le client est thérapeute, false sinon
   */
  async estTherapeute(clientId) {
    const cacheKey = `therapeute_${clientId}`;
    if (this._cacheResultat[cacheKey] !== undefined) {
      return this._cacheResultat[cacheKey];
    }

    try {
      const response = await api.get(`tarif-api.php?estTherapeute=true&clientId=${clientId}`);
      const result = response && response.success ? toBoolean(response.estTherapeute) : false;
      this._cacheResultat[cacheKey] = result;
      return result;
    } catch (error) {
      console.error('Erreur lors de la vérification du statut thérapeute:', error);
      return false;
    }
  }

  /**
   * Vérifie si un client possède un tarif spécial défini
   * @param {number} clientId ID du client
   * @param {string} [date] Date pour la vérification (format YYYY-MM-DD)
   * @returns {Promise<boolean>} True si le client possède un tarif spécial, false sinon
   */
  async possedeTarifSpecialDefini(clientId, date = null) {
    const cacheKey = `tarifSpecial_${clientId}_${date || 'nodate'}`;
    if (this._cacheResultat[cacheKey] !== undefined) {
      return this._cacheResultat[cacheKey];
    }

    try {
      const queryParams = {
        possedeTarifSpecial: 'true',
        clientId
      };
      
      if (date) {
        queryParams.date = date;
      }
      
      const response = await api.get('tarif-api.php', queryParams);
      const result = response && response.success ? toBoolean(response.possedeTarifSpecial) : false;
      this._cacheResultat[cacheKey] = result;
      return result;
    } catch (error) {
      console.error('Erreur lors de la vérification des tarifs spéciaux:', error);
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
      console.error('Erreur lors de la détermination du message de tarif:', error);
      return 'Information de tarif indisponible';
    }
  }

  /**
   * Récupère toutes les unités applicables pour un client spécifique
   * @param {number} clientId ID du client
   * @param {string} [date] Date pour la recherche des tarifs valides (format YYYY-MM-DD)
   * @returns {Promise<Array>} Liste des unités avec leurs détails
   */
  async getUnitesApplicablesPourClient(clientId, date = null) {
    const cacheKey = `unitesClient_${clientId}_${date || 'nodate'}`;
    
    // Vérifier le cache
    if (this._cacheResultat[cacheKey]) {
      console.log('🔄 Unités client retournées depuis le cache');
      return this._cacheResultat[cacheKey];
    }

    try {
      const queryParams = {
        unitesClient: 'true',
        clientId: clientId
      };
      
      if (date) {
        queryParams.date = date;
      }
      
      console.log('📥 Chargement des unités applicables pour le client depuis l\'API', queryParams);
      const response = await api.get('tarif-api.php', queryParams);
      
      const result = response && response.success ? response.unites || [] : [];
      
      // Mettre en cache
      this._cacheResultat[cacheKey] = result;
      
      console.log('✅ Unités applicables pour le client chargées:', result.length);
      return result;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des unités pour le client:', error);
      return [];
    }
  }
}

export default TarificationService;