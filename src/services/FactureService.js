/**
 * Service de gestion des factures - VERSION FINALE sans état "Retard" persisté
 * @class FactureService
 * @description Gère l'accès aux données des factures via l'API facture-api.php
 */
import api from './api';
import { backendUrl } from '../utils/urlHelper';
import { toBoolean, normalizeBooleanFields, normalizeBooleanFieldsArray } from '../utils/booleanHelper';
import ParametreService from './ParametreService';
import { formatMontant } from '../utils/formatters';

class FactureService {
  constructor() {
    this.factures = [];
    this._cacheFacture = {};
    this._parametreService = new ParametreService();
    this._delaiPaiementCache = null;
  }

  /**
   * Récupère le délai de paiement depuis les paramètres
   * @returns {Promise<number>} - Délai en jours
   */
  async _getDelaiPaiement() {
    try {
      if (this._delaiPaiementCache !== null) {
        return this._delaiPaiementCache;
      }

      const result = await this._parametreService.getParametre(
        'Delai Paiement',
        'Facture',
        'Paiement'
      );

      if (result.success && result.parametre) {
        this._delaiPaiementCache = parseInt(result.parametre.Valeur_parametre) || 30;
        console.log('✅ Délai de paiement récupéré:', this._delaiPaiementCache, 'jours');
      } else {
        console.warn('⚠️ Paramètre "Delai Paiement" non trouvé, utilisation de la valeur par défaut (30 jours)');
        this._delaiPaiementCache = 30;
      }

      return this._delaiPaiementCache;
    } catch (error) {
      console.error('Erreur lors de la récupération du délai de paiement:', error);
      return 30;
    }
  }

  /**
   * Détermine l'état d'une facture (sans gestion de "Retard" persisté)
   * @param {Object} facture - Données de la facture
   * @returns {string} - État de base stocké en base
   */
  _determinerEtatBase(facture) {
    // Priorité aux états explicites (sauf "Retard" qui ne doit plus être persisté)
    if (facture.etat && facture.etat !== 'Retard') {
      return facture.etat;
    }
    
    // Logique de déduction basée sur les données
    if (facture.date_paiement) {
      return 'Payée';
    } else if (facture.date_annulation) {
      return 'Annulée';
    } else {
      return toBoolean(facture.est_imprimee) ? 'Éditée' : 'En attente';
    }
  }

  /**
   * Détermine l'état d'affichage d'une facture (avec calcul dynamique de retard)
   * @param {Object} facture - Données de la facture
   * @returns {Promise<string>} - État pour l'interface utilisateur
   */
  async _determinerEtatAffichage(facture) {
    const etatBase = this._determinerEtatBase(facture);
    
    console.log(`🔍 _determinerEtatAffichage - Facture ${facture.numeroFacture || facture.id}: état de base = ${etatBase}`);
    
    // Si la facture est "Envoyée" et pas encore payée, vérifier le retard
    if (etatBase === 'Envoyée' && !facture.date_paiement && await this._estEnRetard(facture)) {
      console.log(`🔴 État final: Retard pour facture ${facture.numeroFacture || facture.id}`);
      return 'Retard';
    }
    
    console.log(`✅ État final: ${etatBase} pour facture ${facture.numeroFacture || facture.id}`);
    return etatBase;
  }

  /**
   * Vérifie si une facture est en retard de paiement
   * @param {Object} facture - Données de la facture
   * @returns {Promise<boolean>} - True si en retard
   */
  async _estEnRetard(facture) {
    if (!facture.date_facture || facture.date_paiement || facture.date_annulation) {
      console.log(`📅 Facture ${facture.numeroFacture || facture.id} - Pas de retard: date_facture=${facture.date_facture}, date_paiement=${facture.date_paiement}, date_annulation=${facture.date_annulation}`);
      return false;
    }
    
    const dateFacture = new Date(facture.date_facture);
    const aujourdhui = new Date();
    const diffTemps = aujourdhui.getTime() - dateFacture.getTime();
    const diffJours = Math.ceil(diffTemps / (1000 * 3600 * 24));
    
    const delaiPaiement = await this._getDelaiPaiement();
    
    const estEnRetard = diffJours > delaiPaiement;
    
    console.log(`📅 Vérification retard - Facture: ${facture.numeroFacture || facture.id}, Âge: ${diffJours} jours, Délai: ${delaiPaiement} jours, En retard: ${estEnRetard}`);
    
    return estEnRetard;
  }

  /**
   * Vérifie si une facture peut recevoir des paiements
   * @param {Object} facture - Données de la facture
   * @returns {Promise<boolean>} - True si payable
   */
  async _peutRecevoirPaiement(facture) {
    const etatAffichage = await this._determinerEtatAffichage(facture);
    const etatsPayables = ['Envoyée', 'Retard', 'Partiellement payée'];
    return etatsPayables.includes(etatAffichage);
  }

  /**
   * Version simplifiée pour la compatibilité (calcul dynamique uniquement)
   * @param {Object} facture - Données de la facture
   * @returns {string} - État calculé dynamiquement
   */
  _determinerEtatFacture(facture) {
    const etatBase = this._determinerEtatBase(facture);
    
    // Pour la version synchrone, on ne peut pas faire le calcul de retard dynamique
    // On retourne l'état de base, le calcul de retard se fera via _determinerEtatAffichage
    return etatBase;
  }

  /**
   * Vide le cache du délai de paiement
   */
  _clearDelaiPaiementCache() {
    this._delaiPaiementCache = null;
  }

  /**
   * Récupère les factures payables avec délai configurable
   * @param {number} annee - Année à filtrer
   * @returns {Promise<Array>} - Liste des factures pouvant recevoir des paiements
   */
  async getFacturesPayables(annee = null) {
    try {
      const factures = await this.chargerFactures(annee);
      
      const facturesPayables = [];
      
      for (const facture of factures) {
        if (await this._peutRecevoirPaiement(facture)) {
          // Enrichir avec l'état d'affichage correct (avec calcul de retard)
          facture.etatAffichage = await this._determinerEtatAffichage(facture);
          facturesPayables.push(facture);
        }
      }
      
      return facturesPayables;
    } catch (error) {
      console.error('Erreur lors de la récupération des factures payables:', error);
      return [];
    }
  }

  /**
   * Enrichit une facture avec son état d'affichage calculé dynamiquement
   * @param {Object} facture - Facture à enrichir
   * @returns {Promise<Object>} - Facture avec etatAffichage
   */
  async enrichirAvecEtatAffichage(facture) {
    const factureEnrichie = { ...facture };
    factureEnrichie.etatAffichage = await this._determinerEtatAffichage(facture);
    return factureEnrichie;
  }

  /**
   * Enrichit un tableau de factures avec les états d'affichage calculés
   * @param {Array} factures - Tableau de factures à enrichir
   * @returns {Promise<Array>} - Factures avec etatAffichage
   */
  async enrichirFacturesAvecEtatAffichage(factures) {
    const facturesEnrichies = [];
    
    for (const facture of factures) {
      const factureEnrichie = await this.enrichirAvecEtatAffichage(facture);
      facturesEnrichies.push(factureEnrichie);
    }
    
    return facturesEnrichies;
  }

  /**
   * Normalisation d'une facture
   * @param {Object} facture - Facture à normaliser
   * @returns {Object} - Facture avec propriétés booléennes normalisées
   */
  normalizeFacture(facture) {
    if (!facture || typeof facture !== 'object') return facture;
    
    const booleanFields = ['est_imprimee', 'est_envoyee', 'est_annulee', 'est_payee'];
    return normalizeBooleanFields(facture, booleanFields);
  }

  /**
   * Normalisation d'un tableau de factures
   * @param {Array} factures - Tableau de factures à normaliser
   * @returns {Array} - Factures avec propriétés booléennes normalisées
   */
  normalizeFactures(factures) {
    if (!Array.isArray(factures)) return factures;
    
    const booleanFields = ['est_imprimee', 'est_envoyee', 'est_annulee', 'est_payee'];
    return normalizeBooleanFieldsArray(factures, booleanFields);
  }

  async chargerFactures(annee = null) {
    try {
      const params = {};
      if (annee) {
        params.annee = annee;
      }

      console.log('FactureService - Chargement des factures pour l\'année:', annee);
      const response = await api.get('facture-api.php', params);
      console.log('FactureService - Réponse de l\'API get:', response);
      
      if (response && response.success) {
        const facturesData = response.factures || [];

        // Normalisation préventive des booléens
        const facturesNormalisees = this.normalizeFactures(facturesData);

        const facturesTriees = facturesNormalisees.sort((a, b) => {
          const numA = a.numero_facture ? parseInt(a.numero_facture.split('.')[0]) : 0;
          const numB = b.numero_facture ? parseInt(b.numero_facture.split('.')[0]) : 0;
          return numB - numA;
        });
        
        // Adaptation des données avec état de base
        const facturesAdaptees = facturesTriees.map(facture => ({
          id: facture.id_facture,
          numeroFacture: facture.numero_facture,
          client: {
            id: facture.id_client,
            prenom: facture.prenom,
            nom: facture.nom,
            email: facture.email || null
          },
          montantTotal: parseFloat(facture.montant_total),
          etat: this._determinerEtatFacture(facture), // État de base uniquement
          date_facture: facture.date_facture,
          dateFacture: facture.date_facture,
          date_paiement: facture.date_paiement,
          date_annulation: facture.date_annulation,
          // Propriétés booléennes normalisées
          est_imprimee: toBoolean(facture.est_imprimee),
          est_envoyee: toBoolean(facture.est_envoyee),
          est_annulee: toBoolean(facture.est_annulee),
          est_payee: toBoolean(facture.est_payee)
        }));
        
        // ✅ ENRICHISSEMENT AUTOMATIQUE avec état d'affichage calculé dynamiquement
        const facturesEnrichies = [];
        for (const facture of facturesAdaptees) {
          const etatAffichage = await this._determinerEtatAffichage(facture);
          facturesEnrichies.push({
            ...facture,
            etatAffichage: etatAffichage
          });
        }
        
        this.factures = facturesEnrichies;
        return facturesEnrichies;
      }
      return [];
    } catch (error) {
      console.error('Erreur lors du chargement des factures:', error);
      return [];
    }
  }

  async getFacture(id) {
      try {
          console.log('Récupération de la facture:', id);
          if (id in this._cacheFacture) {
              console.log('Facture trouvée dans le cache:', id);
              // ✅ Enrichir la facture du cache avec l'état d'affichage actuel
              const factureCache = this._cacheFacture[id];
              factureCache.etatAffichage = await this._determinerEtatAffichage(factureCache);
              return factureCache;
          }
          
          const response = await api.get(`facture-api.php?id=${id}`);
          console.log('Réponse de l\'API:', response);
          
          if (response && response.success && response.facture) {
              const factureData = response.facture;
              
              // Normalisation préventive des booléens
              const factureNormalisee = this.normalizeFacture(factureData);
              
              // Gestion du chemin du document avec URL correcte
              let documentPath = null;
              if (factureNormalisee.factfilename) {
                  try {
                      const outputDirResponse = await api.get('parametre-api.php?nomParametre=OutputDir&groupe=Facture&sGroupe=Chemin');
                      
                      let outputDir = 'storage/factures';
                      if (outputDirResponse && outputDirResponse.success) {
                          outputDir = outputDirResponse.parametre?.Valeur_parametre || outputDir;
                      }
                      
                      documentPath = backendUrl(`${outputDir}/${factureNormalisee.factfilename}`);
                      console.log('Chemin du document de facture:', documentPath);
                  } catch (e) {
                      console.warn('Erreur lors de la récupération du chemin du document:', e);
                  }
              }

              const factureFormattee = {
                  id: factureNormalisee.id_facture || '',
                  numeroFacture: factureNormalisee.numero_facture || '',
                  dateFacture: factureNormalisee.date_facture || '',
                  date_facture: factureNormalisee.date_facture || '', // ✅ AJOUT: Champ requis pour le calcul de retard
                  clientId: factureNormalisee.id_client,
                  totalFacture: parseFloat(factureNormalisee.montant_total || 0),
                  ristourne: parseFloat(factureNormalisee.ristourne || 0),
                  totalAvecRistourne: parseFloat(factureNormalisee.montant_total || 0) - parseFloat(factureNormalisee.ristourne || 0),
                  
                  // Données des paiements multiples
                  montantPayeTotal: parseFloat(factureNormalisee.montant_paye_total || 0),
                  montantRestant: parseFloat(factureNormalisee.montant_restant || 0),
                  nbPaiements: parseInt(factureNormalisee.nb_paiements || 0),
                  dateDernierPaiement: factureNormalisee.date_dernier_paiement || null,
                  
                  lignes: (factureNormalisee.lignes || []).map(ligne => ({
                      id: ligne.id_ligne,
                      description: ligne.description,
                      unite: ligne.unite,
                      quantite: parseFloat(ligne.quantite || 0),
                      prixUnitaire: parseFloat(ligne.prix_unitaire || 0),
                      total: parseFloat(ligne.total_ligne || 0),
                      serviceId: ligne.service_id || null,
                      uniteId: ligne.unite_id || null,
                      serviceType: ligne.service_type || ligne.serviceType || null,
                      noOrdre: ligne.no_ordre || null,
                      descriptionDates: ligne.description_dates || null
                  })),
                  etat: this._determinerEtatBase(factureNormalisee), // État de base uniquement
                  documentPath: documentPath,
                  factfilename: factureNormalisee.factfilename || null,
                  date_annulation: factureNormalisee.date_annulation || null,
                  date_paiement: factureNormalisee.date_paiement || null,
                  
                  // Propriétés booléennes normalisées
                  est_imprimee: toBoolean(factureNormalisee.est_imprimee),
                  est_envoyee: toBoolean(factureNormalisee.est_envoyee),
                  est_annulee: toBoolean(factureNormalisee.est_annulee),
                  est_payee: toBoolean(factureNormalisee.est_payee),
                  client: factureNormalisee.nom ? {
                      id: factureNormalisee.id_client,
                      prenom: factureNormalisee.prenom,
                      nom: factureNormalisee.nom,
                      email: factureNormalisee.email || null,
                  } : null
              };
              
              // ✅ ENRICHISSEMENT AUTOMATIQUE avec état d'affichage calculé dynamiquement
              factureFormattee.etatAffichage = await this._determinerEtatAffichage(factureFormattee);
              
              console.log(`🔍 Facture ${factureFormattee.numeroFacture} - État de base: ${factureFormattee.etat}, État d'affichage: ${factureFormattee.etatAffichage}`);
              
              this._cacheFacture[id] = factureFormattee;
              return factureFormattee;
          }
          return null;
      } catch (error) {
          console.error(`Erreur lors de la récupération de la facture ${id}:`, error);
          return null;
      }
  }

  async getProchainNumeroFacture(annee) {
    try {
      const response = await api.get(`facture-api.php?prochainNumeroFacture=${annee}`);
      
      if (response && response.success && response.parametre) {
        const numero = response.parametre.Valeur_parametre 
          ? `${response.parametre.Valeur_parametre.toString().padStart(3, '0')}.${annee}`
          : `001.${annee}`;
        
        return numero;
      }
      
      return `001.${annee}`;
    } catch (error) {
      console.error("Erreur lors de la récupération du prochain numéro de facture:", error);
      return `001.${annee}`;
    }
  }

  async createFacture(factureData) {
    try {
      const response = await api.post('facture-api.php', factureData);
      
      if (response && response.success) {
        this._clearCache();
        return {
          success: true,
          id: response.factureId,
          message: response.message || 'Facture créée avec succès'
        };
      } else {
        throw new Error(response?.message || 'Erreur lors de la création de la facture');
      }
    } catch (error) {
      console.error('Erreur lors de la création de la facture:', error);
      throw error;
    }
  }

  async updateFacture(id, factureData) {
    try {
      const response = await api.put(`facture-api.php?id=${id}`, factureData);
      
      if (response && response.success) {
        delete this._cacheFacture[id];
        return {
          success: true,
          message: response.message || 'Facture modifiée avec succès'
        };
      } else {
        throw new Error(response?.message || 'Erreur lors de la modification de la facture');
      }
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de la facture ${id}:`, error);
      throw error;
    }
  }

  async deleteFacture(id) {
    try {
      const response = await api.delete(`facture-api.php?id=${id}`);
      
      if (response && response.success) {
        delete this._cacheFacture[id];
        return {
          success: true,
          message: response.message || 'Facture supprimée avec succès'
        };
      } else {
        throw new Error(response?.message || 'Erreur lors de la suppression de la facture');
      }
    } catch (error) {
      console.error(`Erreur lors de la suppression de la facture ${id}:`, error);
      throw error;
    }
  }

  async changerEtatFacture(id, nouvelEtat) {
    try {
      // Empêcher la persistance de l'état "Retard"
      if (nouvelEtat === 'Retard') {
        console.warn('⚠️ Tentative de persistance de l\'état "Retard" bloquée. Cet état est calculé dynamiquement.');
        return {
          success: false,
          message: 'L\'état "Retard" ne peut pas être persisté, il est calculé automatiquement.'
        };
      }

      const requestData = {
        nouvelEtat: nouvelEtat
      };

      const response = await api.post(`facture-api.php?changerEtat&id=${id}`, requestData);
      
      if (response && response.success) {
        delete this._cacheFacture[id];
        return {
          success: true,
          message: response.message || `Facture mise à jour avec l'état "${nouvelEtat}" avec succès`
        };
      } else {
        throw new Error(response?.message || `Erreur lors du changement d'état de la facture à "${nouvelEtat}"`);
      }
    } catch (error) {
      console.error(`Erreur lors du changement d'état de la facture ${id}:`, error);
      throw error;
    }
  }

  async envoyerFactureParEmail(factureId, emailData) {
    try {
        const response = await api.post(`facture-api.php?envoyer&id=${factureId}`, emailData);
        
        console.log('Réponse de l\'API pour l\'envoi par email:', response);
        
        if (response && response.success) {
            let processedResponse = { ...response };
            
            // Normalisation des booléens dans la réponse
            processedResponse.shouldOpenNewWindow = toBoolean(response.shouldOpenNewWindow);
            processedResponse.etatMisAJour = toBoolean(response.etatMisAJour);
            
            return {
                success: true,
                message: response.message || 'Facture envoyée par email avec succès',
                method: response.method,
                requestId: response.requestId,
                shouldOpenNewWindow: processedResponse.shouldOpenNewWindow,
                newWindowUrl: processedResponse.newWindowUrl,
                etatMisAJour: processedResponse.etatMisAJour,
                ...processedResponse
            };
        } else {
            throw new Error(response?.message || 'Erreur lors de l\'envoi de la facture par email');
        }
    } catch (error) {
        console.error(`Erreur lors de l'envoi par email de la facture ${factureId}:`, error);
        throw error;
    }
  }

  /**
   * Enregistre un paiement avec le nouveau système de paiements multiples
   */
  async enregistrerPaiement(id, data) {
      try {
          const response = await api.post(`facture-api.php?paiement&id=${id}`, data);
          
          if (response && response.success) {
              delete this._cacheFacture[id];
              return {
                  success: true,
                  message: response.message || 'Paiement enregistré avec succès',
                  paiementId: response.paiementId,
                  numeroPaiement: response.numeroPaiement
              };
          } else {
              throw new Error(response?.message || 'Erreur lors de l\'enregistrement du paiement');
          }
      } catch (error) {
          console.error(`Erreur lors de l'enregistrement du paiement pour la facture ${id}:`, error);
          throw error;
      }
  }

  /**
   * Récupère l'historique des paiements d'une facture
   */
  async getHistoriquePaiements(factureId) {
      try {
          const response = await api.get(`facture-api.php?historiquePaiements&id=${factureId}`);
          
          if (response && response.success) {
              return {
                  success: true,
                  paiements: response.paiements || []
              };
          } else {
              throw new Error(response?.message || 'Erreur lors de la récupération de l\'historique');
          }
      } catch (error) {
          console.error(`Erreur lors de la récupération de l'historique des paiements pour la facture ${factureId}:`, error);
          throw error;
      }
  }

  /**
   * Supprime un paiement (annulation)
   */
  async supprimerPaiement(paiementId) {
      try {
          const response = await api.delete(`facture-api.php?supprimerPaiement&id=${paiementId}`);
          
          if (response && response.success) {
              if (response.factureId) {
                  delete this._cacheFacture[response.factureId];
              }
              
              return {
                  success: true,
                  message: response.message || 'Paiement supprimé avec succès',
                  factureId: response.factureId
              };
          } else {
              throw new Error(response?.message || 'Erreur lors de la suppression du paiement');
          }
      } catch (error) {
          console.error(`Erreur lors de la suppression du paiement ${paiementId}:`, error);
          throw error;
      }
  }

  async getFactureUrl(id) {
    try {
        if (id in this._cacheFacture && this._cacheFacture[id].documentPath) {
            return {
                success: true,
                pdfUrl: this._cacheFacture[id].documentPath
            };
        }
        
        const facture = await this.getFacture(id);
        
        if (facture && facture.documentPath) {
            return {
                success: true,
                pdfUrl: facture.documentPath
            };
        }
        
        if (facture && facture.factfilename && facture.factfilename.trim() !== '') {
            const response = await api.get(`facture-api.php?getUrl=1&id=${id}`);
            
            if (response && response.success && response.pdfUrl) {
                let finalUrl = response.pdfUrl;
                if (!finalUrl.startsWith('http')) {
                    finalUrl = backendUrl(finalUrl);
                }
                
                return {
                    success: true,
                    pdfUrl: finalUrl
                };
            }
        }
        
        return {
            success: false,
            message: 'Aucun fichier PDF associé à cette facture'
        };
    } catch (error) {
        console.error(`Erreur lors de la récupération de l'URL de la facture ${id}:`, error);
        return {
            success: false,
            message: error.message || 'Erreur lors de la récupération de l\'URL de la facture'
        };
    }
  }

  async imprimerFacture(id, options = {}) {
    try {
      const response = await api.post(`facture-api.php?imprimer=1&id=${id}`, { options });
      
      if (response && response.success) {
        delete this._cacheFacture[id];

        if (response.etatActuel === 'En attente') {
          await this.changerEtatFacture(id, 'Éditée');
        }

        let finalPdfUrl = response.pdfUrl;
        if (finalPdfUrl && !finalPdfUrl.startsWith('http')) {
            finalPdfUrl = backendUrl(finalPdfUrl);
        }

        return {
          success: true,
          pdfUrl: finalPdfUrl,
          message: response.message || 'Facture imprimée avec succès'
        };
      } else {
        throw new Error(response?.message || 'Erreur lors de l\'impression de la facture');
      }
    } catch (error) {
      console.error(`Erreur lors de l'impression de la facture ${id}:`, error);
      throw error;
    }
  }

  async mettreAJourRetards() {
    // Cette méthode n'est plus nécessaire puisque les retards sont calculés dynamiquement
    console.log('⚠️ mettreAJourRetards() est obsolète - les retards sont maintenant calculés dynamiquement');
    return {
      success: true,
      facturesModifiees: 0,
      message: 'Les retards sont calculés automatiquement, aucune mise à jour nécessaire'
    };
  }

  async getStatistiques(annee = null) {
    try {
      const params = {
        statistiques: true
      };
      
      if (annee) {
        params.annee = annee;
      }

      const response = await api.get('facture-api.php', params);
      console.log("getStatistiques Reponse :", response);
      
      if (response && response.success) {
        return {
          success: true,
          statistiques: response.statistiques || {}
        };
      } else {
        throw new Error(response?.message || 'Erreur lors de la récupération des statistiques');
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  }

  _clearCache() {
    this._cacheFacture = {};
  }


}

export default FactureService;