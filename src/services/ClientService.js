/**
 * Service de gestion des clients - VERSION MISE À JOUR avec gestion des booléens
 * @class ClientService
 * @description Gère l'accès aux données des clients via l'API
 * 
 * ⚠️ NOTE: Les méthodes de validation (isValidEmail, detectPhoneType) sont DÉPRÉCIÉES
 *    Utiliser à la place: clientValidators.js ou useClientValidation.js
 */
import api from './api';
import { toBoolean, toBooleanInt, normalizeBooleanFields, normalizeBooleanFieldsArray } from '../utils/booleanHelper';
import { createLogger } from '../utils/createLogger';

class ClientService {
  constructor() {
    this.clients = [];
    this._cacheClient = {}; // Cache pour les clients fréquemment consultés
    
    // Bind des méthodes pour s'assurer que 'this' est correctement défini
    this.chargerClients = this.chargerClients.bind(this);
    this.getClient = this.getClient.bind(this);
    this.createClient = this.createClient.bind(this);
    this.updateClient = this.updateClient.bind(this);
    this.deleteClient = this.deleteClient.bind(this);
    this.checkClientDeletable = this.checkClientDeletable.bind(this);
    this._clearCache = this._clearCache.bind(this);
    this.estTherapeute = this.estTherapeute.bind(this);
    this.normalizeClient = this.normalizeClient.bind(this);
    this.normalizeClients = this.normalizeClients.bind(this);
    
    // ⚠️ DÉPRÉCIÉES - conservées pour rétrocompatibilité
    this.isValidEmail = this.isValidEmail.bind(this);
    this.detectPhoneType = this.detectPhoneType.bind(this);
    this._cleanPhoneNumber = this._cleanPhoneNumber.bind(this);

    this.log = createLogger('ClientService');
  }

  /**
   * Normalise les propriétés booléennes d'un client
   * @param {Object} client - Client à normaliser
   * @returns {Object} - Client avec propriétés booléennes normalisées
   */
  normalizeClient(client) {
    if (!client || typeof client !== 'object') {
      return client;
    }
    
    return normalizeBooleanFields(client, ['estTherapeute']);
  }

  /**
   * Normalise les propriétés booléennes d'un tableau de clients
   * @param {Array} clients - Tableau de clients à normaliser
   * @returns {Array} - Tableau de clients avec propriétés booléennes normalisées
   */
  normalizeClients(clients) {
    if (!Array.isArray(clients)) {
      return clients;
    }
    
    return normalizeBooleanFieldsArray(clients, ['estTherapeute']);
  }

  /**
   * Charge tous les clients
   * @returns {Promise<Array>} - Liste des clients
   */
  async chargerClients() {
    try {
      const response = await api.get('client-api.php');
      
      if (Array.isArray(response)) {
        this.clients = this.normalizeClients(response);
        return this.clients;
      } else if (response && response.clients) {
        this.clients = this.normalizeClients(response.clients);
        return this.clients;
      }
      
      this.log.warn('Format de réponse inattendu pour chargerClients');
      return [];
    } catch (error) {
      this.log.error('Erreur lors du chargement des clients:', error);
      throw error;
    }
  }

  /**
   * Récupère un client par son ID
   * @param {string|number} id ID du client à récupérer
   * @returns {Promise<Object|null>} Client récupéré ou null si non trouvé
   */
  async getClient(id) {
    try {
      // Vérifier le cache
      if (this._cacheClient[id]) {
        this.log.debug(`Client ${id} trouvé dans le cache`);
        return this._cacheClient[id];
      }

      const response = await api.get(`client-api.php?id=${id}`);
      
      if (response && response.success && response.client) {
        // ✅ Normalisation du client
        const normalizedClient = this.normalizeClient(response.client);
        
        this.log.debug('Client avant normalisation:', response.client);
        this.log.debug('Client après normalisation:', normalizedClient);
        
        // Mettre en cache
        this._cacheClient[id] = normalizedClient;
        
        // ✅ Retourner directement le client (pas d'objet wrappé)
        return normalizedClient;
      }
      
      return null;
    } catch (error) {
      this.log.error(`Erreur lors de la récupération du client ${id}:`, error);
      throw error;
    }
  }

  /**
   * Crée un nouveau client
   * @param {Object} clientData Données du client à créer
   * @returns {Promise<Object>} Résultat de la création
   */
  async createClient(clientData) {
    try {
      this.log.debug('Création du client:', clientData);
      
      // Normaliser les booléens avant envoi
      const dataToSend = {
        ...clientData,
        estTherapeute: toBooleanInt(clientData.estTherapeute)
      };
      
      const response = await api.post('client-api.php', dataToSend);
      
      if (response && response.success) {
        // Invalider le cache
        this._clearCache();
      }
      
      return response;
    } catch (error) {
      this.log.error('Erreur lors de la création du client:', error);
      throw error;
    }
  }

  /**
   * Met à jour un client existant
   * @param {string|number} id ID du client à mettre à jour
   * @param {Object} clientData Nouvelles données du client
   * @returns {Promise<Object>} Résultat de la mise à jour
   */
  async updateClient(id, clientData) {
    try {
      this.log.debug(`Mise à jour du client ${id}:`, clientData);
      
      // Normaliser les booléens avant envoi
      const dataToSend = {
        ...clientData,
        estTherapeute: toBooleanInt(clientData.estTherapeute)
      };
      
      const response = await api.put(`client-api.php?id=${id}`, dataToSend);
      
      if (response && response.success) {
        // Invalider le cache pour ce client
        delete this._cacheClient[id];
      }
      
      return response;
    } catch (error) {
      this.log.error(`Erreur lors de la mise à jour du client ${id}:`, error);
      throw error;
    }
  }

  /**
   * Supprime un client
   * @param {string|number} id ID du client à supprimer
   * @returns {Promise<Object>} Résultat de la suppression
   */
  async deleteClient(id) {
    try {
      this.log.debug(`Suppression du client ${id}`);
      
      const response = await api.delete(`client-api.php?id=${id}`);
      
      if (response && (response.success || response.status === 'success')) {
        // Invalider le cache
        delete this._cacheClient[id];
        
        return {
          success: true,
          message: response.message || 'Client supprimé avec succès'
        };
      } else {
        throw new Error(response?.message || 'Erreur lors de la suppression du client');
      }
    } catch (error) {
      this.log.error(`Erreur lors de la suppression du client ${id}:`, error);
      throw error;
    }
  }

  /**
   * Vérifie si un client peut être supprimé (n'a pas de factures associées)
   * @param {string|number} id ID du client à vérifier
   * @returns {Promise<Object>} Résultat de la vérification
   */
  async checkClientDeletable(id) {
    try {
      this.log.debug('DEBUG - checkClientDeletable appelé pour:', id);
      const response = await api.get(`client-api.php?id=${id}&checkFactures=true`);
      
      return {
        success: response.success,
        // ✅ NORMALISATION DU BOOLÉEN aUneFacture
        aUneFacture: toBoolean(response.aUneFacture),
        message: response.message
      };
    } catch (error) {
      this.log.error(`Erreur lors de la vérification des factures du client ${id}:`, error);
      throw error;
    }
  }

  /**
   * Vérifie si un client est thérapeute
   * @param {Object|number} clientOrId - Client ou ID du client
   * @returns {Promise<boolean>|boolean} True si le client est thérapeute
   */
  async estTherapeute(clientOrId) {
    // Si c'est déjà un objet client
    if (clientOrId && typeof clientOrId === 'object' && 'estTherapeute' in clientOrId) {
      return toBoolean(clientOrId.estTherapeute);
    }

    // Si c'est un ID, charger le client
    if (clientOrId) {
      try {
        const result = await this.getClient(clientOrId);
        if (result && result.success && result.client) {
          return toBoolean(result.client.estTherapeute);
        }
      } catch (error) {
        this.log.error('Erreur lors de la vérification du statut thérapeute:', error);
      }
    }

    return false;
  }

  /**
   * Nettoie le cache des clients
   */
  _clearCache() {
    this._cacheClient = {};
    this.log.debug('Cache des clients nettoyé');
  }

  // ========================================
  // ⚠️ MÉTHODES DÉPRÉCIÉES
  // Utiliser clientValidators.js ou useClientValidation.js à la place
  // ========================================

  /**
   * @deprecated Utiliser validateEmail de clientValidators.js à la place
   * Vérifie si une adresse email est valide
   * @param {string} email Adresse email à valider
   * @returns {boolean} True si l'email est valide
   */
  isValidEmail(email) {
    console.warn('⚠️ ClientService.isValidEmail est DÉPRÉCIÉ. Utiliser validateEmail de clientValidators.js');
    
    // Si le champ est vide, on le considère comme valide (non obligatoire)
    if (!email) {
      return true;
    }
    
    // Vérification de la longueur (max 254 caractères selon RFC)
    if (email.length > 254) {
      return false;
    }
    
    // Expression régulière pour validation complète
    const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    
    return emailRegex.test(String(email).toLowerCase());
  }

  /**
   * @deprecated Utiliser validatePhone de clientValidators.js à la place
   * Détecte le type de numéro de téléphone (suisse ou étranger)
   * @param {string} phone Numéro à analyser
   * @returns {string|null} Type de téléphone ('swiss', 'foreign', null)
   */
  detectPhoneType(phone) {
    console.warn('⚠️ ClientService.detectPhoneType est DÉPRÉCIÉ. Utiliser validatePhone de clientValidators.js');
    
    // Si le champ est vide, retourner null
    if (!phone) {
      return null;
    }
    
    // Nettoyer le numéro pour l'analyse (garder uniquement les chiffres et le +)
    const cleanedPhone = this._cleanPhoneNumber(phone);
    
    // Vérifier si c'est un numéro suisse
    // Format international suisse: +41 suivi de 9 chiffres
    const swissInternationalRegex = /^\+41\d{9}$/;
    // Format national suisse: 0 suivi de 9 chiffres
    const swissNationalRegex = /^0\d{9}$/;
    
    if (swissInternationalRegex.test(cleanedPhone) || swissNationalRegex.test(cleanedPhone)) {
      return 'swiss';
    }
    
    // Vérifier si c'est un autre numéro international (commence par + mais pas +41)
    const otherInternationalRegex = /^\+(?!41)\d{7,15}$/;
    
    if (otherInternationalRegex.test(cleanedPhone)) {
      return 'foreign';
    }
    
    // Si aucun format reconnu
    return null;
  }

  /**
   * @deprecated Méthode interne dépréciée
   * Nettoie un numéro de téléphone
   * @param {string} phone Numéro à nettoyer
   * @returns {string} Numéro nettoyé
   */
  _cleanPhoneNumber(phone) {
    if (!phone) return '';
    return phone.replace(/[^\d+]/g, '');
  }
}

export default ClientService;