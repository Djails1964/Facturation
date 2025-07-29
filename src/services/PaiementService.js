/**
 * Service de gestion des paiements
 * @class PaiementService
 * @description Gère l'accès aux données des paiements via l'API paiement-api.php
 */
import api from './api';

class PaiementService {
  constructor() {
    this.paiements = [];
    this._cachePaiement = {}; // Cache pour les paiements fréquemment consultés
  }

  /**
   * Charge la liste des paiements avec filtrage optionnel
   * @param {Object} options Options de filtrage et pagination
   * @returns {Array} Liste des paiements
   */
  async chargerPaiements(options = {}) {
    try {
      const params = {};
      
      // Ajouter les filtres s'ils sont définis
      if (options.annee) params.annee = options.annee;
      if (options.mois) params.mois = options.mois;
      if (options.methode) params.methode = options.methode;
      if (options.clientId) params.client_id = options.clientId;
      if (options.factureId) params.facture_id = options.factureId;
      if (options.page) params.page = options.page;
      if (options.limit) params.limit = options.limit;

      console.log('PaiementService - Chargement des paiements avec options:', options);
      console.log('PaiementService - Paramètres de l\'API:', params);
      
      const response = await api.get('paiement-api.php', params);
      console.log('PaiementService - Réponse de l\'API get:', response);
      
      if (response && response.success) {
        const paiementsData = response.paiements || [];

        // Adapter les données pour le frontend
        const paiementsAdaptes = paiementsData.map(paiement => ({
          id: paiement.id_paiement,
          factureId: paiement.id_facture,
          numeroFacture: paiement.numero_facture,
          clientId: paiement.id_client,
          nomClient: paiement.nom_client,
          datePaiement: paiement.date_paiement,
          montantPaye: parseFloat(paiement.montant_paye),
          methodePaiement: paiement.methode_paiement,
          commentaire: paiement.commentaire,
          numeroPaiement: paiement.numero_paiement,
          dateCreation: paiement.date_creation,
          // Informations sur la facture
          montantTotalFacture: parseFloat(paiement.montant_total),
          ristourneFacture: parseFloat(paiement.ristourne || 0)
        }));
        
        this.paiements = paiementsAdaptes;
        
        return {
          paiements: paiementsAdaptes,
          pagination: response.pagination || null
        };
      }
      
      return { paiements: [], pagination: null };
    } catch (error) {
      console.error('Erreur lors du chargement des paiements:', error);
      return { paiements: [], pagination: null };
    }
  }

  /**
   * Récupère un paiement spécifique par son ID
   * @param {number} id ID du paiement
   * @returns {Object|null} Données du paiement
   */
  async getPaiement(id) {
    try {
      console.log('Récupération du paiement:', id);
      
      if (id in this._cachePaiement) {
        console.log('Paiement trouvé dans le cache:', id);
        return this._cachePaiement[id];
      }
      
      const response = await api.get(`paiement-api.php?id=${id}`);
      console.log('Réponse de l\'API:', response);
      
      if (response && response.success && response.paiement) {
        const paiementData = response.paiement;
        
        const paiementFormate = {
          id: paiementData.id_paiement,
          factureId: paiementData.id_facture,
          numeroFacture: paiementData.numero_facture,
          clientId: paiementData.id_client,
          nomClient: paiementData.nom_client,
          datePaiement: paiementData.date_paiement,
          montantPaye: parseFloat(paiementData.montant_paye),
          methodePaiement: paiementData.methode_paiement,
          commentaire: paiementData.commentaire,
          numeroPaiement: paiementData.numero_paiement,
          dateCreation: paiementData.date_creation,
          montantTotalFacture: parseFloat(paiementData.montant_total),
          ristourneFacture: parseFloat(paiementData.ristourne || 0)
        };
        
        this._cachePaiement[id] = paiementFormate;
        return paiementFormate;
      }
      
      return null;
    } catch (error) {
      console.error(`Erreur lors de la récupération du paiement ${id}:`, error);
      return null;
    }
  }

  /**
   * Récupère les paiements d'une facture spécifique
   * @param {number} factureId ID de la facture
   * @returns {Array} Liste des paiements de la facture
   */
  async getPaiementsParFacture(factureId) {
    try {
      const response = await api.get(`paiement-api.php?facture_id=${factureId}`);
      
      if (response && response.success) {
        return response.paiements || [];
      }
      
      return [];
    } catch (error) {
      console.error(`Erreur lors de la récupération des paiements pour la facture ${factureId}:`, error);
      return [];
    }
  }

  /**
   * Crée un nouveau paiement
   * @param {Object} paiementData Données du paiement
   * @returns {Object} Résultat de l'opération
   */
  async createPaiement(paiementData) {
    try {
      const response = await api.post('paiement-api.php', paiementData);
      
      if (response && response.success) {
        this._clearCache();
        return {
          success: true,
          id: response.paiementId,
          numeroPaiement: response.numeroPaiement,
          message: response.message || 'Paiement enregistré avec succès'
        };
      } else {
        throw new Error(response?.message || 'Erreur lors de l\'enregistrement du paiement');
      }
    } catch (error) {
      console.error('Erreur lors de la création du paiement:', error);
      throw error;
    }
  }

  /**
   * Met à jour un paiement existant
   * @param {number} id ID du paiement
   * @param {Object} paiementData Nouvelles données du paiement
   * @returns {Object} Résultat de l'opération
   */
  async updatePaiement(id, paiementData) {
    try {
      const response = await api.put(`paiement-api.php?id=${id}`, paiementData);
      
      if (response && response.success) {
        delete this._cachePaiement[id];
        return {
          success: true,
          message: response.message || 'Paiement modifié avec succès'
        };
      } else {
        throw new Error(response?.message || 'Erreur lors de la modification du paiement');
      }
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du paiement ${id}:`, error);
      throw error;
    }
  }

  /**
   * Supprime un paiement
   * @param {number} id ID du paiement
   * @returns {Object} Résultat de l'opération
   */
  async deletePaiement(id) {
    try {
      const response = await api.delete(`paiement-api.php?id=${id}`);
      
      if (response && response.success) {
        delete this._cachePaiement[id];
        return {
          success: true,
          factureId: response.factureId,
          message: response.message || 'Paiement supprimé avec succès'
        };
      } else {
        throw new Error(response?.message || 'Erreur lors de la suppression du paiement');
      }
    } catch (error) {
      console.error(`Erreur lors de la suppression du paiement ${id}:`, error);
      throw error;
    }
  }

  /**
   * Récupère les statistiques globales des paiements
   * @param {number|null} annee Année pour filtrer les statistiques
   * @returns {Object} Statistiques complètes
   */
  async getStatistiques(annee = null) {
    try {
      const params = {
        statistiques: true
      };
      
      if (annee) {
        params.annee = annee;
      }

      const response = await api.get('paiement-api.php', params);
      console.log("getStatistiques Paiements Réponse :", response);
      
      if (response && response.success) {
        return {
          success: true,
          statistiques: response.statistiques || {}
        };
      } else {
        throw new Error(response?.message || 'Erreur lors de la récupération des statistiques');
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques des paiements:', error);
      throw error;
    }
  }

  /**
   * Récupère les méthodes de paiement disponibles
   * @returns {Array} Liste des méthodes de paiement
   */
  getMethodesPaiement() {
    return [
      { value: 'especes', label: 'Espèces' },
      { value: 'carte_bancaire', label: 'Carte bancaire' },
      { value: 'virement', label: 'Virement bancaire' },
      { value: 'cheque', label: 'Chèque' },
      { value: 'twint', label: 'TWINT' },
      { value: 'paypal', label: 'PayPal' },
      { value: 'autre', label: 'Autre' }
    ];
  }

  /**
   * Récupère la liste des années disponibles pour le filtrage
   * @returns {Array} Liste des années
   */
  async getAnneesDisponibles() {
    try {
      // On peut récupérer cette information depuis les statistiques
      const statsResponse = await this.getStatistiques();
      
      if (statsResponse.success && statsResponse.statistiques.evolution_mensuelle) {
        const annees = [...new Set(
          statsResponse.statistiques.evolution_mensuelle.map(item => parseInt(item.annee))
        )].sort((a, b) => b - a); // Tri décroissant
        
        return annees;
      }
      
      // Fallback : années par défaut
      const currentYear = new Date().getFullYear();
      return [currentYear, currentYear - 1, currentYear - 2];
      
    } catch (error) {
      console.error('Erreur lors de la récupération des années:', error);
      const currentYear = new Date().getFullYear();
      return [currentYear, currentYear - 1, currentYear - 2];
    }
  }

  /**
   * Nettoie le cache
   * @private
   */
  _clearCache() {
    this._cachePaiement = {};
  }

  /**
   * Formate une méthode de paiement pour l'affichage
   * @param {string} methode Méthode de paiement
   * @returns {string} Méthode formatée
   */
  formatMethodePaiement(methode) {
    const methodes = this.getMethodesPaiement();
    const methodeObj = methodes.find(m => m.value === methode);
    return methodeObj ? methodeObj.label : methode;
  }
}

export default PaiementService;