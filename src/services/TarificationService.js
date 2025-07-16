/**
 * Service de gestion des tarifications - VERSION COMPLÈTE avec gestion des booléens
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
    console.log('⭐ Cache de tarification vidé');
  }

  /**
   * Charger tous les services disponibles
   * @returns {Promise<Array>} Liste des services avec booléens normalisés
   */
  async chargerServices() {
    try {
      const response = await api.get('tarif-api.php?services=true');
      
      if (response && response.success && response.services) {
        // ✅ NORMALISATION DES BOOLÉENS
        const normalizedServices = normalizeServices(response.services);
        console.log('Services avant normalisation:', response.services.slice(0, 2));
        console.log('Services après normalisation:', normalizedServices.slice(0, 2));
        return normalizedServices;
      }
      
      return [];
    } catch (error) {
      console.error('Erreur lors du chargement des services:', error);
      return [];
    }
  }

  /**
   * Créer un nouveau service
   * @param {Object} serviceData Données du service
   * @returns {Promise<Object>} Résultat de la création
   */
  async createService(serviceData) {
    try {
      const payload = {
        action: 'createService',
        ...serviceData,
        // ✅ NORMALISATION DES BOOLÉENS AVANT ENVOI
        actif: toBoolean(serviceData.actif),
        isDefault: toBoolean(serviceData.isDefault)
      };
      
      console.log('Création service - payload normalisé:', payload);
      const response = await api.post('tarif-api.php', payload);
      return response;
    } catch (error) {
      console.error('Erreur lors de la création du service:', error);
      throw error;
    }
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
        // ✅ NORMALISATION DES BOOLÉENS AVANT ENVOI
        actif: toBoolean(serviceData.actif),
        isDefault: toBoolean(serviceData.isDefault)
      };
      
      console.log('Mise à jour service - payload normalisé:', payload);
      const response = await api.put('tarif-api.php', payload);
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
  async chargerUnites(serviceId = null) {
    try {
      const url = serviceId 
        ? `tarif-api.php?unites=true&serviceId=${serviceId}` 
        : 'tarif-api.php?unites=true';
      
      const response = await api.get(url);
      
      if (response && response.success && response.unites) {
        // Validation et normalisation des unités
        const validUnites = response.unites.filter(unite => 
          unite && 
          typeof unite === 'object' && 
          unite.id && 
          typeof unite.code === 'string' && 
          typeof unite.nom === 'string'
        );
        
        // ✅ NORMALISATION DES BOOLÉENS
        const normalizedUnites = normalizeUnites(validUnites);
        console.log('Unités avant normalisation:', validUnites.slice(0, 2));
        console.log('Unités après normalisation:', normalizedUnites.slice(0, 2));
        return normalizedUnites;
      }
      
      return [];
    } catch (error) {
      console.error('Erreur lors du chargement des unités:', error);
      return [];
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
        // ✅ NORMALISATION DES BOOLÉENS AVANT ENVOI
        actif: toBoolean(uniteData.actif),
        isDefault: toBoolean(uniteData.isDefault)
      };
      
      const response = await api.post('tarif-api.php', payload);
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
        // ✅ NORMALISATION DES BOOLÉENS AVANT ENVOI
        actif: toBoolean(uniteData.actif),
        isDefault: toBoolean(uniteData.isDefault)
      };
      
      const response = await api.put('tarif-api.php', payload);
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
    try {
      const response = await api.get('tarif-api.php?typesTarifs=true');
      
      if (response && response.success && response.typesTarifs) {
        // ✅ NORMALISATION DES BOOLÉENS
        const normalizedTypesTarifs = normalizeTypesTarifs(response.typesTarifs);
        return normalizedTypesTarifs;
      }
      
      return [];
    } catch (error) {
      console.error('Erreur lors du chargement des types de tarifs:', error);
      return [];
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
    const { clientId, serviceId, uniteId, date } = params;
    
    try {
      const queryParams = {
        tarifClient: 'true',
        clientId,
        serviceId,
        uniteId,
        date: date || new Date().toISOString().split('T')[0]
      };

      const response = await api.get('tarif-api.php', queryParams);
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
    const { serviceId, uniteId, typeTarifId, date } = params;
    
    try {
      const queryParams = {
        tarifs: 'true'
      };
      
      if (serviceId) queryParams.serviceId = serviceId;
      if (uniteId) queryParams.uniteId = uniteId;
      if (typeTarifId) queryParams.typeTarifId = typeTarifId;
      if (date) queryParams.date = date;

      console.log('getTarifs - Query params pour les tarifs:', queryParams);
      const response = await api.get('tarif-api.php', queryParams);
      console.log('getTarifs - Réponse de l\'API:', response);
      
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
   * Créer un nouveau tarif
   * @param {Object} tarifData Données du tarif
   * @returns {Promise<Object>} Résultat de la création
   */
  async createTarif(tarifData) {
    try {
      const payload = {
        action: 'createTarif',
        // Traitement des dates vides
        date_fin: tarifData.date_fin === '' ? null : tarifData.date_fin,
        ...tarifData
      };
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
      const payload = {
        action: 'createTarifSpecial',
        // Traitement des dates vides
        date_fin: tarifSpecialData.date_fin === '' ? null : tarifSpecialData.date_fin,
        clientId: tarifSpecialData.clientId,
        serviceId: tarifSpecialData.serviceId,
        uniteId: tarifSpecialData.uniteId,
        prix: tarifSpecialData.prix,
        date_debut: tarifSpecialData.date_debut,
        note: tarifSpecialData.note
      };
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
      const payload = {
        action: 'updateTarif',
        id,
        // Traitement des dates vides
        date_fin: tarifData.date_fin === '' ? null : tarifData.date_fin,
        ...tarifData
      };
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
      const payload = {
        action: 'updateTarifSpecial',
        id,
        // Traitement des dates vides
        date_fin: tarifSpecialData.date_fin === '' ? null : tarifSpecialData.date_fin,
        ...tarifSpecialData
      };
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
    try {
      // Charger les services, unités et types de tarifs
      const [services, unites, typesTarifs] = await Promise.all([
        this.chargerServices(),
        this.chargerUnites(),
        this.chargerTypesTarifs()
      ]);

      // Charger les associations services-unités séparément
      // (le résultat est stocké dans this.servicesUnites)
      await this.chargerServicesUnites();

      return {
        services,
        unites,
        typesTarifs,
        servicesUnites: this.servicesUnites
      };
    } catch (error) {
      console.error('Erreur lors de l\'initialisation:', error);
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
    try {
      const response = await api.get('tarif-api.php?servicesUnites=true');
      
      if (response && response.success) {
        // Stocker le résultat dans la propriété de classe
        const relations = response.servicesUnites || [];
        
        // Organiser par service_id pour un accès rapide
        this.servicesUnites = {};
        relations.forEach(relation => {
          if (!this.servicesUnites[relation.service_id]) {
            this.servicesUnites[relation.service_id] = [];
          }
          this.servicesUnites[relation.service_id].push(relation.unite_id);
        });
        
        return relations;
      }
      return [];
    } catch (error) {
      console.error('Erreur lors du chargement des relations services-unités:', error);
      return [];
    }
  }

  /**
   * Obtenir les types de services
   * @returns {Array} Codes des services
   */
  getTypesServices() {
    return this.services.map(service => service.code);
  }

  /**
   * Obtenir les unités pour un service
   * @param {string} serviceId ID du service
   * @returns {Array} Codes des unités
   */
  getUnitesForService(serviceId) {
    // Vérification de serviceId
    if (!serviceId) {
      return [];
    }
    
    // Trouver le service
    const service = this.services.find(s => s.id === serviceId);
    if (!service) {
      return [];
    }

    // Vérification des unités
    if (!this.unites || !Array.isArray(this.unites)) {
      return [];
    }
    
    // Utiliser le mapping des relations services-unités
    if (this.servicesUnites && this.servicesUnites[service.id]) {
      const uniteIds = this.servicesUnites[service.id];
      
      if (Array.isArray(uniteIds)) {
        // Convertir les IDs d'unités en codes
        return uniteIds.map(uniteId => {
          const unite = this.unites.find(u => u.id === uniteId);
          return unite ? unite.code : null;
        }).filter(code => code !== null);
      }
    }
    
    // Fallback: chercher les unités avec le service_id correspondant
    try {
      const unitesForService = this.unites.filter(u => u.service_id === service.id);
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
    const { clientId, serviceId, uniteId, date } = params;
      
    // Essayer d'abord de récupérer un tarif spécial client
    const tarifClient = await this.getTarifClient({ 
      clientId, 
      serviceId, 
      uniteId, 
      date 
    });
      
    if (tarifClient && tarifClient.success && tarifClient.tarif) {
      return tarifClient.tarif.prix;
    }
      
    // Si pas de tarif spécial, chercher un tarif standard
    const tarifs = await this.getTarifs({ 
      serviceId, 
      uniteId, 
      typeTarifId: 1, // Tarif Normal
      date 
    });
      
    // Retourner le premier tarif trouvé, sinon 0
    return tarifs.length > 0 ? tarifs[0].prix : 0;
  }

  /**
   * Obtenir le prix pour un service, une unité et un client spécifiques
   * @param {Object} params Paramètres pour le calcul du prix
   * @returns {number} Prix calculé
   */
  getPrix(params) {
    const { typeService, unite, client } = params;
    
    // Vérification des paramètres essentiels
    if (!typeService || !unite || !client) {
      console.warn('Paramètres manquants pour getPrix', params);
      return 0;
    }
    
    try {
      // Trouver l'ID du service correspondant au code
      const service = this.services.find(s => s.code === typeService);
      if (!service) {
        console.warn(`Service non trouvé pour le code: ${typeService}`);
        return 0;
      }
      
      // Trouver l'ID de l'unité correspondant au code
      const uniteObj = this.unites.find(u => u.code === unite);
      if (!uniteObj) {
        console.warn(`Unité non trouvée pour le code: ${unite}`);
        return 0;
      }
      
      // Vérifier si nous avons déjà ce tarif en cache
      const cacheKey = `${client.id}-${service.id}-${uniteObj.id}`;
      if (this._cacheResultat && this._cacheResultat[cacheKey] !== undefined) {
        return this._cacheResultat[cacheKey];
      }
      
      // Démarrer la requête en arrière-plan pour les futures demandes
      this.getTarifClient({
        clientId: client.id,
        serviceId: service.id,
        uniteId: uniteObj.id,
        date: new Date().toISOString().split('T')[0]
      }).then(tarifClient => {
        this._cacheResultat[cacheKey] = tarifClient?.prix || 0;
      }).catch(error => {
        console.error('Erreur lors de la récupération du tarif client:', error);
      });
      
      // Par défaut, retourner 0 en attendant que le cache soit mis à jour
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
    if (!serviceId || !this.services || !Array.isArray(this.services)) {
      return false;
    }
    
    const service = this.services.find(s => s.id === serviceId);
    // ✅ UTILISATION DE LA NORMALISATION BOOLÉENNE
    return service ? toBoolean(service.isDefault) : false;
  }

  /**
   * Vérifie si une unité est définie comme unité par défaut
   * @param {number} uniteId ID de l'unité à vérifier
   * @returns {boolean} True si l'unité est par défaut, false sinon
   */
  isUniteDefault(uniteId) {
    if (!uniteId || !this.unites || !Array.isArray(this.unites)) {
      return false;
    }
    
    const unite = this.unites.find(u => u.id === uniteId);
    // ✅ UTILISATION DE LA NORMALISATION BOOLÉENNE
    return unite ? toBoolean(unite.isDefault) : false;
  }

  /**
   * Obtient le service défini comme service par défaut
   * @param {Array} [services] Liste des services à vérifier
   * @returns {Object|null} Le service par défaut ou null si aucun n'est trouvé
   */
  getServiceDefault(services = null) {
    // Utiliser les services passés en paramètre ou this.services
    const servicesToCheck = services || this.services;

    if (!servicesToCheck || !Array.isArray(servicesToCheck)) {
        console.warn('Aucun service disponible');
        return null;
    }
    
    // ✅ UTILISATION DE LA NORMALISATION BOOLÉENNE
    return servicesToCheck.find(service => toBoolean(service.isDefault)) || null;
  }

  /**
   * Obtenir l'ID de l'unité par défaut pour un service
   * @param {Object} service Service pour lequel chercher l'unité par défaut
   * @returns {Promise<number|null>} ID de l'unité par défaut ou null
   */
  async getUniteDefault(service) {
    // Si aucun service n'est fourni, retourner null
    if (!service) return null;

    try {
        // Requête pour obtenir l'unité par défaut via l'API
        const response = await api.get(`tarif-api.php?uniteDefautService=${service.id}`);
        
        // Vérifier la réponse de l'API
        if (response && response.success && response.uniteId) {
            return response.uniteId;
        }
        
        // Retourner null si aucune unité par défaut n'est trouvée
        return null;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'unité par défaut:', error);
      return null;
    }
  }

  /**
   * Vérifie si un client est thérapeute
   * @param {number} clientId ID du client
   * @returns {Promise<boolean>} True si le client est thérapeute, false sinon
   */
  async estTherapeute(clientId) {
    try {
      const response = await api.get(`tarif-api.php?estTherapeute=true&clientId=${clientId}`);
      
      if (response && response.success) {
        // ✅ UTILISATION DE LA NORMALISATION BOOLÉENNE
        return toBoolean(response.estTherapeute);
      }
      return false;
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
    try {
      const queryParams = {
        possedeTarifSpecial: 'true',
        clientId
      };
      
      if (date) {
        queryParams.date = date;
      }
      
      const response = await api.get('tarif-api.php', queryParams);
      
      if (response && response.success) {
        // ✅ UTILISATION DE LA NORMALISATION BOOLÉENNE
        return toBoolean(response.possedeTarifSpecial);
      }
      return false;
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
    try {
      // Vérifier si le client possède un tarif spécial
      const possedeTarifSpecial = await this.possedeTarifSpecialDefini(client.id);
      
      if (possedeTarifSpecial) {
        return 'Tarif spécial appliqué';
      }
      
      // Vérifier si le client est thérapeute
      const estTherapeute = await this.estTherapeute(client.id);
      
      if (estTherapeute) {
        return 'Tarif thérapeute appliqué';
      }
      
      // Si ni tarif spécial, ni thérapeute, tarif standard
      return 'Tarif standard appliqué';
    } catch (error) {
      console.error('Erreur lors de la détermination du message de tarif:', error);
      return 'Information de tarif indisponible';
    }
  }

  /**
   * Récupère toutes les unités applicables pour un client spécifique
   * Inclut les unités avec tarif standard et les unités avec tarif spécial
   * @param {number} clientId ID du client
   * @param {string} [date] Date pour la recherche des tarifs valides (format YYYY-MM-DD)
   * @returns {Promise<Array>} Liste des unités avec leurs détails
   */
  async getUnitesApplicablesPourClient(clientId, date = null) {
    try {
      const queryParams = {
        unitesClient: 'true',
        clientId: clientId
      };
      
      if (date) {
        queryParams.date = date;
      }
      
      const response = await api.get('tarif-api.php', queryParams);
      
      return response && response.success 
        ? response.unites || [] 
        : [];
    } catch (error) {
      console.error('Erreur lors de la récupération des unités pour le client:', error);
      return [];
    }
  }
}

export default TarificationService;