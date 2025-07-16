/**
 * Service de gestion des clients - VERSION MISE À JOUR avec gestion des booléens
 * @class ClientService
 * @description Gère l'accès aux données des clients via l'API
 */
import api from './api';
import { toBoolean, toBooleanInt, normalizeBooleanFields, normalizeBooleanFieldsArray } from '../utils/booleanHelper';

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
    this.isValidEmail = this.isValidEmail.bind(this);
    this.detectPhoneType = this.detectPhoneType.bind(this);
    this._cleanPhoneNumber = this._cleanPhoneNumber.bind(this);
    this._clearCache = this._clearCache.bind(this);
    this.estTherapeute = this.estTherapeute.bind(this);
    this.normalizeClient = this.normalizeClient.bind(this);
    this.normalizeClients = this.normalizeClients.bind(this);
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
   * @returns {Array} - Clients avec propriétés booléennes normalisées
   */
  normalizeClients(clients) {
    if (!Array.isArray(clients)) {
      return clients;
    }
    
    return normalizeBooleanFieldsArray(clients, ['estTherapeute']);
  }

  /**
   * Charge tous les clients disponibles
   * @returns {Promise<Array>} Liste des clients avec booléens normalisés
   */
  async chargerClients() {
    try {
      const response = await api.get('client-api.php');
      
      if (response && response.success && response.clients) {
        // ✅ NORMALISATION DES BOOLÉENS AVEC LE HELPER
        const normalizedClients = this.normalizeClients(response.clients);
        
        console.log('Clients avant normalisation:', response.clients.slice(0, 2));
        console.log('Clients après normalisation:', normalizedClients.slice(0, 2));
        
        // Mise à jour de la liste interne
        this.clients = normalizedClients;
        return normalizedClients;
      }
      return [];
    } catch (error) {
      console.error('Erreur lors du chargement des clients:', error);
      return [];
    }
  }

  /**
   * Récupère les détails d'un client spécifique
   * @param {string|number} id ID du client
   * @returns {Promise<Object|null>} Données du client ou null si non trouvé
   */
  async getClient(id) {
    try {
      // Vérifier si le client est déjà dans le cache
      if (this._cacheClient[id]) {
        return this._cacheClient[id];
      }
      
      const response = await api.get(`client-api.php?id=${id}`);
      
      if (response && response.success && response.client) {
        // ✅ NORMALISATION DU CLIENT AVEC LE HELPER
        const normalizedClient = this.normalizeClient(response.client);
        
        console.log('Client avant normalisation:', response.client);
        console.log('Client après normalisation:', normalizedClient);
        
        // Mettre à jour le cache
        this._cacheClient[id] = normalizedClient;
        return normalizedClient;
      }
      return null;
    } catch (error) {
      console.error(`Erreur lors de la récupération du client ${id}:`, error);
      return null;
    }
  }

  /**
   * Crée un nouveau client
   * @param {Object} clientData Données du client
   * @returns {Promise<Object>} Résultat de la création
   */
  async createClient(clientData) {
    try {
      // ✅ PRÉPARATION DES DONNÉES AVEC NORMALISATION BOOLÉENNE
      const preparedData = {
        ...clientData,
        // Conversion sécurisée du booléen estTherapeute pour l'API
        estTherapeute: toBooleanInt(clientData.estTherapeute)
      };
      
      console.log('Création client - données d\'entrée:', clientData);
      console.log('Création client - données normalisées:', preparedData);
      
      // Si le téléphone est fourni, s'assurer qu'il est au format propre
      if (preparedData.telephone) {
        preparedData.telephone = this._cleanPhoneNumber(preparedData.telephone);
      }
      
      const response = await api.post('client-api.php', preparedData);
      
      if (response && response.success) {
        // Invalider le cache après création
        this._clearCache();
        return {
          success: true,
          id: response.id,
          message: response.message || 'Client créé avec succès'
        };
      } else {
        throw new Error(response?.message || 'Erreur lors de la création du client');
      }
    } catch (error) {
      console.error('Erreur lors de la création du client:', error);
      throw error;
    }
  }

  /**
   * Met à jour un client existant
   * @param {string|number} id ID du client
   * @param {Object} clientData Données mises à jour
   * @returns {Promise<Object>} Résultat de la mise à jour
   */
  async updateClient(id, clientData) {
    try {
      console.log('✏️ DEBUG - updateClient appelé pour:', id);
      console.log('✏️ DEBUG - Session cookies:', document.cookie);
      console.log('✏️ DEBUG - Session stockée:', window.currentSessionId);
      
      // ✅ PRÉPARATION DES DONNÉES AVEC NORMALISATION BOOLÉENNE
      const preparedData = {
        ...clientData,
        // Conversion sécurisée du booléen estTherapeute pour l'API
        estTherapeute: toBooleanInt(clientData.estTherapeute)
      };
      
      console.log('Mise à jour client - données d\'entrée:', clientData);
      console.log('Mise à jour client - données normalisées:', preparedData);
      
      // Si le téléphone est fourni, s'assurer qu'il est au format propre
      if (preparedData.telephone) {
        preparedData.telephone = this._cleanPhoneNumber(preparedData.telephone);
      }
      
      const response = await api.put(`client-api.php?id=${id}`, preparedData);
      
      if (response && response.success) {
        // Invalider le cache après mise à jour
        delete this._cacheClient[id];
        return {
          success: true,
          message: response.message || 'Client modifié avec succès'
        };
      } else {
        throw new Error(response?.message || 'Erreur lors de la modification du client');
      }
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du client ${id}:`, error);
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
      const response = await api.delete(`client-api.php?id=${id}`);
      
      if (response && response.success) {
        // Invalider le cache après suppression
        delete this._cacheClient[id];
        return {
          success: true,
          message: response.message || 'Client supprimé avec succès'
        };
      } else {
        throw new Error(response?.message || 'Erreur lors de la suppression du client');
      }
    } catch (error) {
      console.error(`Erreur lors de la suppression du client ${id}:`, error);
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
      console.log('🔍 DEBUG - checkClientDeletable appelé pour:', id);
      console.log('🔍 DEBUG - Session cookies:', document.cookie);
      console.log('🔍 DEBUG - Session stockée:', window.currentSessionId);
      const response = await api.get(`client-api.php?id=${id}&checkFactures=true`);
      
      return {
        success: response.success,
        // ✅ NORMALISATION DU BOOLÉEN aUneFacture
        aUneFacture: toBoolean(response.aUneFacture),
        message: response.message
      };
    } catch (error) {
      console.error(`Erreur lors de la vérification des factures du client ${id}:`, error);
      throw error;
    }
  }

  /**
   * Vérifie si une adresse email est valide
   * @param {string} email Adresse email à valider
   * @returns {boolean} True si l'email est valide
   */
  isValidEmail(email) {
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
   * Détecte le type de numéro de téléphone (suisse ou étranger)
   * @param {string} phone Numéro à analyser
   * @returns {Object} Informations sur le numéro
   */
  detectPhoneType(phone) {
    // Si le champ est vide, retourner un objet vide
    if (!phone) {
      return {
        isValid: true,
        type: null,
        formattedNumber: ''
      };
    }
    
    // Nettoyer le numéro pour l'analyse (garder uniquement les chiffres et le +)
    const cleanedPhone = phone.replace(/[^\d+]/g, '');
    
    // Vérifier si c'est un numéro suisse
    // Format international suisse: +41 suivi de 9 chiffres
    const swissInternationalRegex = /^\+41\d{9}$/;
    // Format national suisse: 0 suivi de 9 chiffres
    const swissNationalRegex = /^0\d{9}$/;
    
    // Vérifier si c'est un autre numéro international (commence par + mais pas +41)
    const otherInternationalRegex = /^\+(?!41)\d{1,3}\d{4,14}$/;
    
    let result = {
      isValid: false,
      type: null,
      formattedNumber: phone
    };
    
    // Déterminer le type et formater le numéro
    if (swissInternationalRegex.test(cleanedPhone)) {
      // Numéro suisse au format international
      result.isValid = true;
      result.type = 'swiss';
      
      // Formater: +41 xx xxx xx xx
      const groups = cleanedPhone.match(/^\+41(\d{2})(\d{3})(\d{2})(\d{2})$/);
      if (groups) {
        result.formattedNumber = `+41 ${groups[1]} ${groups[2]} ${groups[3]} ${groups[4]}`;
      }
    } 
    else if (swissNationalRegex.test(cleanedPhone)) {
      // Numéro suisse au format national (convertir en international)
      result.isValid = true;
      result.type = 'swiss';
      
      // Convertir en format international et formater
      const internationalNumber = '+41' + cleanedPhone.substring(1);
      const groups = internationalNumber.match(/^\+41(\d{2})(\d{3})(\d{2})(\d{2})$/);
      if (groups) {
        result.formattedNumber = `+41 ${groups[1]} ${groups[2]} ${groups[3]} ${groups[4]}`;
      }
    } 
    else if (otherInternationalRegex.test(cleanedPhone)) {
      // Autre numéro international
      result.isValid = true;
      result.type = 'foreign';
      
      // Garder le format tel quel pour les numéros étrangers
      result.formattedNumber = cleanedPhone;
    } 
    else if (cleanedPhone.length >= 8) {
      // Si le numéro a au moins 8 chiffres mais ne correspond pas aux formats reconnus
      result.isValid = true;
      result.type = 'foreign';
      result.formattedNumber = cleanedPhone;
    }
    
    return result;
  }

  /**
   * Prépare un numéro de téléphone pour le stockage
   * @param {string} phone Numéro de téléphone
   * @param {string} type Type de numéro ('swiss' ou 'foreign')
   * @returns {string} Numéro formaté pour le stockage
   * @private
   */
  _cleanPhoneNumber(phone, type = null) {
    if (!phone) {
      return '';
    }
    
    // Si le type n'est pas fourni, le détecter
    if (!type) {
      const phoneInfo = this.detectPhoneType(phone);
      type = phoneInfo.type;
    }
    
    // Nettoyer le numéro (garder les chiffres et le +)
    const cleanedPhone = phone.replace(/[^\d+]/g, '');
    
    // Si c'est un numéro suisse au format national, le convertir en international
    if (type === 'swiss' && cleanedPhone.startsWith('0')) {
      return '+41' + cleanedPhone.substring(1);
    }
    
    return cleanedPhone;
  }

  /**
   * Vide le cache des clients
   * @private
   */
  _clearCache() {
    this._cacheClient = {};
  }

  /**
   * Vérifie si un client est thérapeute
   * @param {string|number} id ID du client
   * @returns {Promise<boolean>} True si le client est thérapeute
   */
  async estTherapeute(id) {
    try {
      // Vérifier si le client est dans le cache
      if (this._cacheClient[id]) {
        // ✅ UTILISATION DE LA NORMALISATION BOOLÉENNE
        return toBoolean(this._cacheClient[id].estTherapeute);
      }
      
      const client = await this.getClient(id);
      // ✅ UTILISATION DE LA NORMALISATION BOOLÉENNE
      return client ? toBoolean(client.estTherapeute) : false;
    } catch (error) {
      console.error(`Erreur lors de la vérification du statut thérapeute du client ${id}:`, error);
      return false;
    }
  }
}

export default ClientService;