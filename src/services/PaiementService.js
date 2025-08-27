/**
 * Service de gestion des paiements - Version complète
 * @class PaiementService
 * @description Gère l'accès aux données des paiements via l'API paiement-api.php
 */
import api from './api';
import { 
    METHODES_PAIEMENT_LABELS,
    PAIEMENT_ETATS 
} from '../constants/paiementConstants';


class PaiementService {
  constructor() {
    this.paiements = [];
    this._cachePaiement = {}; // Cache pour les paiements fréquemment consultés
  }

  /**
   * ✅ COMPLÉTÉE : Charge la liste des paiements avec filtrage optionnel et pagination
   * @param {Object} options Options de filtrage et pagination
   * @returns {Object} {paiements: Array, pagination: Object}
   */
  async chargerPaiements(options = {}) {
    try {
      const params = {};
      
      // Ajouter les filtres s'ils sont définis
      if (options.annee) params.annee = options.annee;
      if (options.mois) params.mois = options.mois;
      if (options.methode) params.methode = options.methode;
      if (options.clientId) params.client_id = options.clientId;
      if (options.idFacture) params.IdFacture = options.idFacture;
      if (options.page) params.page = options.page;
      if (options.limit) params.limit = options.limit;
      if (options.statut) params.statut = options.statut; // ✅ Filtre par statut (confirme/annule)

      console.log('PaiementService - Chargement des paiements avec options:', options);
      console.log('PaiementService - Paramètres de l\'API:', params);
      
      const response = await api.get('paiement-api.php', params);
      console.log('PaiementService - Réponse de l\'API get:', response);
      
      if (response && response.success) {
        const paiementsData = response.paiements || [];

        // Adapter les données pour le frontend
        const paiementsAdaptes = paiementsData.map(paiement => ({
          idPaiement: paiement.idPaiement,
          idFacture: paiement.idFacture,
          numeroFacture: paiement.numeroFacture,
          idClient: paiement.idClient,
          nomClient: paiement.nomClient,
          datePaiement: paiement.datePaiement,
          montantPaye: parseFloat(paiement.montantPaye),
          methodePaiement: paiement.methodePaiement,
          commentaire: paiement.commentaire,
          numeroPaiement: paiement.numeroPaiement,
          dateCreation: paiement.dateCreation,
          statut: paiement.statut || PAIEMENT_ETATS.VALIDE,
          dateModification: paiement.dateModification || null,
          dateAnnulation: paiement.dateAnnulation || null,
          motifAnnulation: paiement.motifAnnulation || null,
          montantTotalFacture: parseFloat(paiement.montantTotal),
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
   * ✅ EXISTANTE : Récupère un paiement spécifique par son ID
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
      
      const response = await api.get(`paiement-api.php?idPaiement=${id}`);
      console.log('Réponse de l\'API:', response);
      
      if (response && response.success && response.paiement) {
        const paiementData = response.paiement;
        console.log('PaiementService - getPaiement - paiementData:', paiementData);
        
        const paiementFormate = {
          idPaiement: paiementData.idPaiement,
          idFacture: paiementData.idFacture,
          numeroFacture: paiementData.numeroFacture,
          idClient: paiementData.idClient,
          nomClient: paiementData.nomClient,
          datePaiement: paiementData.datePaiement,
          montantPaye: parseFloat(paiementData.montantPaye),
          methodePaiement: paiementData.methodePaiement,
          commentaire: paiementData.commentaire,
          numeroPaiement: paiementData.numeroPaiement,
          dateCreation: paiementData.dateCreation,
          statut: paiementData.statut || PAIEMENT_ETATS.VALIDE, // ✅ Statut par défaut
          dateAnnulation: paiementData.dateAnnulation || null,
          motifAnnulation: paiementData.motifAnnulation || null,
          montantTotalFacture: parseFloat(paiementData.montantTotal),
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
   * ✅ EXISTANTE : Récupère les paiements d'une facture spécifique
   * @param {number} idFacture ID de la facture
   * @returns {Array} Liste des paiements de la facture
   */
  async getPaiementsParFacture(idFacture) {
    try {
      console.log('getpaiementsParFacture - idFacture :', idFacture);
      const response = await api.get(`paiement-api.php?idFacture=${idFacture}`);
      console.log('getpaiementsParFacture - response: ', response);
      
      if (response && response.success) {
        // ✅ Adapter les données de la même façon que chargerPaiements
        const paiementsData = response.paiements || [];
        return paiementsData.map(paiement => ({
          idPaiement: paiement.idPaiement,
          idFacture: paiement.idFacture,
          numeroFacture: paiement.numero_facture,
          clientId: paiement.id_client,
          nomClient: paiement.nom_client,
          datePaiement: paiement.date_paiement,
          montantPaye: parseFloat(paiement.montant_paye),
          methodePaiement: paiement.methode_paiement,
          commentaire: paiement.commentaire,
          numeroPaiement: paiement.numero_paiement,
          dateCreation: paiement.date_creation,
          statut: paiement.statut || PAIEMENT_ETATS.VALIDE,
          dateAnnulation: paiement.date_annulation || null,
          motifAnnulation: paiement.motif_annulation || null,
          montantTotalFacture: parseFloat(paiement.montant_total || 0),
          ristourneFacture: parseFloat(paiement.ristourne || 0)
        }));
      }
      
      return [];
    } catch (error) {
      console.error(`Erreur lors de la récupération des paiements pour la facture ${idFacture}:`, error);
      return [];
    }
  }

  /**
   * ✅ EXISTANTE : Crée un nouveau paiement
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
          id: response.idPaiement,
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
   * ✅ EXISTANTE : Met à jour un paiement existant
   * @param {number} id ID du paiement
   * @param {Object} paiementData Nouvelles données du paiement
   * @returns {Object} Résultat de l'opération
   */
  async updatePaiement(id, paiementData) {
    try {
      const response = await api.put(`paiement-api.php?idPaiement=${id}`, paiementData);
      
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
   * ✅ EXISTANTE : Annule un paiement (au lieu de le supprimer)
   * @param {number} id ID du paiement
   * @param {string} motifAnnulation Motif de l'annulation
   * @returns {Object} Résultat de l'opération
   */
  async cancelPaiement(id, motifAnnulation = null) {
    try {
      const data = motifAnnulation ? { motif_annulation: motifAnnulation } : {};
      const response = await api.delete(`paiement-api.php?idPaiement=${id}`, data);
      
      if (response && response.success) {
        delete this._cachePaiement[id];
        return {
          success: true,
          idFacture: response.idFacture,
          numeroPaiement: response.numeroPaiement,
          message: response.message || 'Paiement annulé avec succès'
        };
      } else {
        throw new Error(response?.message || 'Erreur lors de l\'annulation du paiement');
      }
    } catch (error) {
      console.error(`Erreur lors de l'annulation du paiement ${id}:`, error);
      throw error;
    }
  }

  /**
   * ✅ EXISTANTE : Supprime un paiement (méthode legacy)
   * @param {number} id ID du paiement
   * @returns {Object} Résultat de l'opération
   * @deprecated Utilisez cancelPaiement() à la place
   */
  async deletePaiement(id) {
    try {
      const response = await api.delete(`paiement-api.php?idPaiement=${id}`);
      
      if (response && response.success) {
        delete this._cachePaiement[id];
        return {
          success: true,
          idFacture: response.idFacture,
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
   * ✅ EXISTANTE : Récupère les statistiques globales des paiements
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
   * ✅ NOUVELLE : Récupère les paiements avec pagination avancée
   * @param {number} page Numéro de page (1-based)
   * @param {number} limit Nombre d'éléments par page
   * @param {Object} filtres Filtres à appliquer
   * @returns {Object} {paiements: Array, pagination: Object}
   */
  async getPaiementsAvecPagination(page = 1, limit = 50, filtres = {}) {
    return await this.chargerPaiements({
      page,
      limit,
      ...filtres
    });
  }

  /**
   * ✅ NOUVELLE : Récupère uniquement les paiements confirmés
   * @param {Object} options Options de filtrage
   * @returns {Object} {paiements: Array, pagination: Object}
   */
  async getPaiementsConfirmes(options = {}) {
    return await this.chargerPaiements({
      ...options,
      statut: PAIEMENT_ETATS.VALIDE
    });
  }

  /**
   * ✅ NOUVELLE : Récupère uniquement les paiements annulés
   * @param {Object} options Options de filtrage
   * @returns {Object} {paiements: Array, pagination: Object}
   */
  async getPaiementsAnnules(options = {}) {
    return await this.chargerPaiements({
      ...options,
      statut: PAIEMENT_ETATS.ANNULE
    });
  }

  /**
   * ✅ NOUVELLE : Récupère les paiements par méthode de paiement
   * @param {string} methode Méthode de paiement
   * @param {Object} options Options de filtrage
   * @returns {Object} {paiements: Array, pagination: Object}
   */
  async getPaiementsParMethode(methode, options = {}) {
    return await this.chargerPaiements({
      ...options,
      methode: methode
    });
  }

  /**
   * ✅ NOUVELLE : Récupère les paiements d'un client spécifique
   * @param {number} clientId ID du client
   * @param {Object} options Options de filtrage
   * @returns {Object} {paiements: Array, pagination: Object}
   */
  async getPaiementsParClient(clientId, options = {}) {
    return await this.chargerPaiements({
      ...options,
      clientId: clientId
    });
  }

  /**
   * ✅ NOUVELLE : Récupère les paiements pour une période donnée
   * @param {number} annee Année
   * @param {number|null} mois Mois (optionnel)
   * @param {Object} options Options de filtrage
   * @returns {Object} {paiements: Array, pagination: Object}
   */
  async getPaiementsParPeriode(annee, mois = null, options = {}) {
    const filtres = { ...options, annee };
    if (mois) {
      filtres.mois = mois;
    }
    
    return await this.chargerPaiements(filtres);
  }

  /**
   * ✅ NOUVELLE : Recherche avancée de paiements
   * @param {Object} criteres Critères de recherche
   * @returns {Object} {paiements: Array, pagination: Object}
   */
  async rechercherPaiements(criteres) {
    const options = {};
    
    // Convertir les critères en paramètres d'API
    if (criteres.numeroFacture) {
      // Note: L'API ne supporte pas directement la recherche par numéro de facture
      // Il faudrait d'abord récupérer l'ID de la facture
      console.warn('Recherche par numéro de facture non implémentée dans l\'API');
    }
    
    if (criteres.nomClient) {
      // Note: L'API ne supporte pas directement la recherche par nom de client
      console.warn('Recherche par nom de client non implémentée dans l\'API');
    }
    
    if (criteres.montantMin || criteres.montantMax) {
      // Note: L'API ne supporte pas le filtrage par montant
      console.warn('Filtrage par montant non implémenté dans l\'API');
    }
    
    // Appliquer les filtres supportés
    Object.keys(criteres).forEach(cle => {
      if (['annee', 'mois', 'methode', 'statut', 'clientId', 'idFacture', 'page', 'limit'].includes(cle)) {
        options[cle] = criteres[cle];
      }
    });
    
    return await this.chargerPaiements(options);
  }

  /**
   * ✅ NOUVELLE : Debug de session (développement uniquement)
   * @returns {Object} Informations de debug
   */
  async debugSession() {
    try {
      if (process.env.NODE_ENV !== 'development') {
        throw new Error('Debug session disponible uniquement en développement');
      }
      
      const response = await api.get('paiement-api.php?debug_session=1');
      return response;
    } catch (error) {
      console.error('Erreur lors du debug session:', error);
      throw error;
    }
  }

  /**
   * ✅ EXISTANTE : Récupère les méthodes de paiement disponibles
   * @returns {Array} Liste des méthodes de paiement
   */
  getMethodesPaiement() {
    return Object.entries(METHODES_PAIEMENT_LABELS).map(([value, label]) => ({
      value: value,
      label: label
    }));
  }


  /**
   * ✅ EXISTANTE : Récupère la liste des années disponibles pour le filtrage
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
   * ✅ NOUVELLE : Valide les données d'un paiement avant envoi
   * @param {Object} paiementData Données à valider
   * @returns {Object} {valid: boolean, errors: Array}
   */
  validerDonneesPaiement(paiementData) {
    const errors = [];
    
    // Validation des champs obligatoires
    if (!paiementData.idFacture) {
      errors.push('L\'ID de la facture est obligatoire');
    }
    
    if (!paiementData.datePaiement) {
      errors.push('La date de paiement est obligatoire');
    }
    
    if (!paiementData.montantPaye || paiementData.montantPaye <= 0) {
      errors.push('Le montant payé doit être positif');
    }
    
    if (!paiementData.methodePaiement) {
      errors.push('La méthode de paiement est obligatoire');
    }
    
    // Validation de la date
    if (paiementData.datePaiement) {
      const datePayment = new Date(paiementData.datePaiement);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      
      if (datePayment > today) {
        errors.push('La date de paiement ne peut pas être dans le futur');
      }
    }
    
    // Validation de la méthode de paiement
    if (paiementData.methodePaiement) {
      const methodesValides = this.getMethodesPaiement().map(m => m.value);
      if (!methodesValides.includes(paiementData.methodePaiement)) {
        errors.push('Méthode de paiement non valide');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * ✅ EXISTANTE : Nettoie le cache
   * @private
   */
  _clearCache() {
    this._cachePaiement = {};
  }

  /**
   * ✅ EXISTANTE : Formate une méthode de paiement pour l'affichage
   * @param {string} methode Méthode de paiement
   * @returns {string} Méthode formatée
   */
  formatMethodePaiement(methode) {
    const methodes = this.getMethodesPaiement();
    const methodeObj = methodes.find(m => m.value === methode);
    return methodeObj ? methodeObj.label : methode;
  }

  /**
   * ✅ NOUVELLE : Calcule les totaux d'une liste de paiements
   * @param {Array} paiements Liste des paiements
   * @returns {Object} Totaux calculés
   */
  calculerTotaux(paiements) {
    const paiementsConfirmes = paiements.filter(p => p.statut === PAIEMENT_ETATS.VALIDE);
    const paiementsAnnules = paiements.filter(p => p.statut === PAIEMENT_ETATS.ANNULE);

    return {
      nombreTotal: paiements.length,
      nombreConfirmes: paiementsConfirmes.length,
      nombreAnnules: paiementsAnnules.length,
      montantTotal: paiementsConfirmes.reduce((sum, p) => sum + p.montantPaye, 0),
      montantAnnule: paiementsAnnules.reduce((sum, p) => sum + p.montantPaye, 0),
      montantMoyen: paiementsConfirmes.length > 0 ? 
        paiementsConfirmes.reduce((sum, p) => sum + p.montantPaye, 0) / paiementsConfirmes.length : 0
    };
  }
}

export default PaiementService;