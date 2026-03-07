// src/services/LoyerService.js
// Service de gestion des loyers via l'API
// ✅ VERSION CORRIGÉE pour table loyer séparée
// ✅ AJOUT : genererConfirmationPDF

import api from './api';
import { createLogger } from '../utils/createLogger';

class LoyerService {
  constructor() {
    this.loyers = [];
    this._cacheLoyer = {};
    
    // Bind des méthodes
    this.chargerLoyers           = this.chargerLoyers.bind(this);
    this.getLoyer                = this.getLoyer.bind(this);
    this.createLoyer             = this.createLoyer.bind(this);
    this.updateLoyer             = this.updateLoyer.bind(this);
    this.deleteLoyer             = this.deleteLoyer.bind(this);
    this.genererNumeroLoyer      = this.genererNumeroLoyer.bind(this);
    this.genererConfirmationPDF  = this.genererConfirmationPDF.bind(this);
    this._clearCache             = this._clearCache.bind(this);

    this.log = createLogger('LoyerService');
  }

  /**
   * Charge tous les loyers
   * @param {Object} filtres - Filtres optionnels { id_client, annee, statut }
   * @returns {Promise<Array>} - Liste des loyers
   */
  async chargerLoyers(filtres = {}) {
    try {
      // Construire l'URL avec les filtres
      let url = 'loyer-api.php';
      const params = new URLSearchParams();
      
      if (filtres.id_client) params.append('id_client', filtres.id_client);
      if (filtres.annee)     params.append('annee',     filtres.annee);
      if (filtres.statut)    params.append('statut',    filtres.statut);
      
      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;
      
      this.log.debug('📥 Chargement loyers avec filtres:', filtres);
      
      const response = await api.get(url);
      
      if (Array.isArray(response)) {
        this.loyers = response;
        return this.loyers;
      } else if (response && response.loyers) {
        this.loyers = response.loyers;
        return this.loyers;
      }
      
      this.log.warn('Format de réponse inattendu pour chargerLoyers');
      return [];
    } catch (error) {
      this.log.error('Erreur lors du chargement des loyers:', error);
      throw error;
    }
  }

  /**
   * Récupère un loyer par son ID
   * @param {number} idLoyer - ID du loyer
   * @returns {Promise<Object>} - Loyer avec tous ses détails
   */
  async getLoyer(idLoyer, forceRefresh = false) {
    if (!idLoyer) throw new Error('ID loyer requis');

    try {
      // Vérifier le cache (sauf si forceRefresh demandé)
      if (!forceRefresh && this._cacheLoyer[idLoyer]) {
        this.log.debug('📦 Loyer trouvé en cache:', idLoyer);
        return this._cacheLoyer[idLoyer];
      }

      this.log.debug('🔍 Récupération du loyer:', idLoyer);
      const response = await api.get(`loyer-api.php?id=${idLoyer}`);
      
      if (response && response.loyer) {

        this.log.debug('🔍 [LoyerService.getLoyer] réponse brute:', response.loyer);
        this.log.debug('🔍 [LoyerService.getLoyer] montantsMensuels[0]:', 
          response.loyer.montantsMensuels?.[0]);
        this.log.debug('🔍 [LoyerService.getLoyer] clés mois[0]:', 
          Object.keys(response.loyer.montantsMensuels?.[0] || {}));

        this._cacheLoyer[idLoyer] = response.loyer;
        return response.loyer;
      }
      
      throw new Error('Loyer non trouvé');
    } catch (error) {
      this.log.error('Erreur lors de la récupération du loyer:', error);
      throw error;
    }
  }

  /**
   * Crée un nouveau loyer
   * ✅ La numérotation est gérée automatiquement par le backend
   * 
   * @param {Object} loyerData - Données du loyer
   * @returns {Promise<Object>} - Loyer créé avec id_loyer et numero_loyer
   */
  async createLoyer(loyerData) {
    try {
      this.log.debug('➕ Création d\'un loyer:', loyerData);
      
      const response = await api.post('loyer-api.php', loyerData);
      this._clearCache();
      
      if (response && response.loyer) {
        this.log.info('✅ Loyer créé:', {
          id:     response.loyer.idLoyer,
          numero: response.loyer.numeroLoyer
        });
        return response.loyer;
      }
      
      // Fallback si la structure est différente
      if (response && (response.idLoyer)) {
        return response;
      }
      
      return response;
    } catch (error) {
      this.log.error('Erreur lors de la création du loyer:', error);
      throw error;
    }
  }

  /**
   * Met à jour un loyer existant
   * @param {number} idLoyer - ID du loyer
   * @param {Object} loyerData - Nouvelles données
   * @returns {Promise<Object>} - Loyer mis à jour
   */
  async updateLoyer(idLoyer, loyerData) {
    if (!idLoyer) throw new Error('ID loyer requis pour la mise à jour');

    try {
      this.log.debug('✏️ Mise à jour du loyer:', idLoyer);
      
      const response = await api.put(`loyer-api.php?id=${idLoyer}`, loyerData);
      
      // Invalider le cache
      delete this._cacheLoyer[idLoyer];
      
      if (response && response.loyer) return response.loyer;
      return response;
    } catch (error) {
      this.log.error('Erreur lors de la mise à jour du loyer:', error);
      throw error;
    }
  }

  /**
   * Supprime un loyer
   * @param {number} idLoyer - ID du loyer à supprimer
   * @returns {Promise<Object>} - Résultat de la suppression
   */
  async deleteLoyer(idLoyer) {
    if (!idLoyer) throw new Error('ID loyer requis pour la suppression');

    try {
      this.log.debug('🗑️ Suppression du loyer:', idLoyer);
      
      const response = await api.delete(`loyer-api.php?id=${idLoyer}`);
      
      // Invalider le cache
      delete this._cacheLoyer[idLoyer];
      
      return response;
    } catch (error) {
      this.log.error('Erreur lors de la suppression du loyer:', error);
      throw error;
    }
  }

  /**
   * Génère le prochain numéro de loyer pour un client
   * Format: LOY-{id_client}-{seq}
   * Exemple: LOY-12-001, LOY-12-002
   * 
   * @param {number} idClient - ID du client (OBLIGATOIRE)
   * @returns {Promise<string>} - Numéro de loyer (ex: "LOY-12-003")
   */
  async genererNumeroLoyer(idClient) {
    if (!idClient) {
      throw new Error('ID client requis pour générer le numéro de loyer');
    }

    try {
      this.log.debug('🔢 Génération du numéro de loyer pour client:', idClient);
      
      const response = await api.get(`loyer-api.php?action=generer_numero&id_client=${idClient}`);
      
      if (response && response.numero_loyer) {
        this.log.info('✅ Numéro généré:', response.numero_loyer);
        return response.numero_loyer;
      }
      if (response && response.numeroLoyer) {
        this.log.info('✅ Numéro généré:', response.numeroLoyer);
        return response.numeroLoyer;
      }
      
      throw new Error('Impossible de générer le numéro de loyer');
    } catch (error) {
      this.log.error('Erreur lors de la génération du numéro:', error);
      throw error;
    }
  }


  /**
   * ✅ NOUVEAU : Génère le PDF de confirmation de paiement de loyer
   *
   * @param {number} idLoyer - ID du loyer
   * @returns {Promise<{ success: boolean, pdfUrl: string, message: string }>}
   */
  async genererConfirmationPDF(idLoyer) {
    if (!idLoyer) throw new Error('ID loyer requis pour générer la confirmation PDF');

    try {
      this.log.debug('📄 Génération confirmation PDF pour loyer:', idLoyer);

      const response = await api.post(`loyer-api.php?action=generer_confirmation&id=${idLoyer}`);

      this.log.debug('📄 Réponse génération confirmation:', response);

      if (response && response.success) {
        // Invalider le cache (le statut peut avoir changé)
        delete this._cacheLoyer[idLoyer];

        return {
          success: true,
          pdfUrl:  response.pdfUrl  || response.pdf_url  || null,
          message: response.message || 'Confirmation générée avec succès'
        };
      }

      throw new Error(response?.message || 'Erreur lors de la génération de la confirmation PDF');
    } catch (error) {
      this.log.error('Erreur lors de la génération de la confirmation PDF:', error);
      throw error;
    }
  }

  /**
   * Vide le cache
   * @private
   */
  _clearCache() {
    this._cacheLoyer = {};
    this.log.debug('🗑️ Cache vidé');
  }

  /**
   * Invalide le cache d'un loyer spécifique
   * @param {number} idLoyer - ID du loyer à invalider
   */
  invalidateCache(idLoyer) {
    if (idLoyer) {
      delete this._cacheLoyer[idLoyer];
      this.log.debug(`🗑️ Cache invalidé pour loyer #${idLoyer}`);
    }
  }
}

// Export d'une instance unique (singleton)
const loyerServiceInstance = new LoyerService();
export default loyerServiceInstance;