/**
 * Service de gestion des factures - VERSION FINALE sans état "Retard" persisté
 * @class FactureService
 * @description Gère l'accès aux données des factures via l'API facture-api.php
 */
import api from './api';
import { backendUrl, apiUrl } from '../utils/urlHelper';
import { toBoolean, normalizeBooleanFields, normalizeBooleanFieldsArray } from '../utils/booleanHelper';
import ParametreService from './ParametreService';
import { formatMontant } from '../utils/formatters';
import { handleApiError } from '../utils/apiErrorHandler';
import { createLogger } from '../utils/createLogger';


class FactureService {
  constructor() {
    this.factures = [];
    this._cacheFacture = {};
    this._parametreService = new ParametreService();
    this._delaiPaiementCache = null;

    this.log = createLogger('FactureService');
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
        this._delaiPaiementCache = parseInt(result.parametre.valeurParametre) || 30;
        this.log.debug('✅ Délai de paiement récupéré:', this._delaiPaiementCache, 'jours');
      } else {
        this.log.warn('⚠️ Paramètre "Delai Paiement" non trouvé, utilisation de la valeur par défaut (30 jours)');
        this._delaiPaiementCache = 30;
      }

      return this._delaiPaiementCache;
    } catch (error) {
      handleApiError(error, `_getDelaiPaiement`);
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
    
   
    // Si la facture est "Envoyée" et pas encore payée, vérifier le retard
    if (etatBase === 'Envoyée' && !facture.date_paiement && await this._estEnRetard(facture)) {
      return 'Retard';
    }
    
    return etatBase;
  }

  /**
   * Vérifie si une facture est en retard de paiement
   * @param {Object} facture - Données de la facture
   * @returns {Promise<boolean>} - True si en retard
   */
  async _estEnRetard(facture) {
    if (!facture.date_facture || facture.date_paiement || facture.date_annulation) {
      this.log.debug(`📅 Facture ${facture.numeroFacture || facture.idFacture} - Pas de retard: date_facture=${facture.date_facture}, date_paiement=${facture.date_paiement}, date_annulation=${facture.date_annulation}`);
      return false;
    }
    
    const dateFacture = new Date(facture.date_facture);
    const aujourdhui = new Date();
    const diffTemps = aujourdhui.getTime() - dateFacture.getTime();
    const diffJours = Math.ceil(diffTemps / (1000 * 3600 * 24));
    
    const delaiPaiement = await this._getDelaiPaiement();
    
    const estEnRetard = diffJours > delaiPaiement;
    
    this.log.debug(`📅 Vérification retard - Facture: ${facture.numeroFacture || facture.idFacture}, Âge: ${diffJours} jours, Délai: ${delaiPaiement} jours, En retard: ${estEnRetard}`);
    
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
      handleApiError(error, `getFacturesPayables`);
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

  /**
   * Charge toutes les factures d'un client spécifique
   * ✅ OPTIMISÉ : Appel API dédié (filtrage server-side)
   * Les données snake_case du backend seront automatiquement converties en camelCase par api.js
   * 
   * @param {number} idClient - ID du client
   * @returns {Promise<Array>} Liste des factures du client avec états calculés
   */
  async getFacturesClient(idClient) {
    try {
      // ⚠️ DEBUG: Logs console très détaillés
      console.log('🔍 FactureService.getFacturesClient DÉBUT');
      console.log('  → idClient reçu:', idClient, 'type:', typeof idClient);
      
      this.log.debug(`📥 FactureService - Chargement factures du client #${idClient}`);
      
      // Appel API : GET /api/facture-api.php?idClient=123
      console.log('  → Appel API: facture-api.php avec params:', { idClient });
      const response = await api.get('facture-api.php', { idClient });
      
      console.log('  → Réponse API brute:', response);
      this.log.debug('FactureService - Réponse API getFacturesClient:', response);
      
      if (response && response.success) {
        const facturesData = response.factures || [];
        
        console.log('  → Nombre de factures dans response.factures:', facturesData.length);
        
        // ⚠️ DEBUG: Afficher les idClient pour vérifier le filtrage backend
        if (facturesData.length > 0) {
          console.log('  → Vérification idClient dans les factures reçues:');
          facturesData.forEach((f, idx) => {
            const idClientFacture = f.idClient || f.id_client;
            console.log(`    [${idx}] Facture ${f.numeroFacture || f.numero_facture}: idClient=${idClientFacture}, attendu=${idClient}, match=${idClientFacture == idClient ? '✅' : '❌'}`);
          });
        }
        
        this.log.debug(`✅ ${facturesData.length} factures reçues du client #${idClient}`);
        
        // Normalisation et adaptation des données
        // Note: api.js a déjà converti snake_case → camelCase
        const facturesAdaptees = facturesData.map(facture => ({
          idFacture: facture.idFacture,
          numeroFacture: facture.numeroFacture,
          idClient: facture.idClient,
          nomClient: `${facture.prenom || ''} ${facture.nom || ''}`.trim(),
          dateFacture: facture.dateFacture,
          dateEcheance: facture.dateEcheance,
          montantTotal: parseFloat(facture.montantTotal),
          montantBrut: parseFloat(facture.montantBrut),
          ristourne: parseFloat(facture.ristourne || 0),
          montantAvecRistourne: parseFloat(facture.montantAvecRistourne),
          montantPayeTotal: parseFloat(facture.montantPayeTotal || 0),
          montantRestant: parseFloat(facture.montantRestant),
          nbPaiements: parseInt(facture.nbPaiements || 0),
          etat: facture.etat,
          dateCreation: facture.dateCreation,
          dateModification: facture.dateModification,
          client: {
            idClient: facture.idClient,
            nom: facture.nom,
            prenom: facture.prenom,
            email: facture.email,
            telephone: facture.telephone
          }
        }));
        
        console.log('  → Factures adaptées:', facturesAdaptees.length);
        console.log('🔍 FactureService.getFacturesClient FIN - Retour:', facturesAdaptees.length, 'factures');
        
        this.log.debug(`✅ ${facturesAdaptees.length} factures adaptées pour le client #${idClient}`);
        
        return facturesAdaptees;
      } else {
        console.log('  → Réponse API non successful ou vide');
        this.log.warn('⚠️ Réponse API non successful ou vide');
        return [];
      }
    } catch (error) {
      console.error('❌ Erreur FactureService.getFacturesClient:', error);
      this.log.error(`❌ Erreur lors du chargement des factures du client #${idClient}:`, error);
      handleApiError(error, `getFacturesClient(${idClient})`);
      return [];
    }
  }

  async chargerFactures(annee = null) {
    try {
      const params = {};
      if (annee) {
        params.annee = annee;
      }

      this.log.debug('FactureService - Chargement des factures pour l\'année:', annee);
      const response = await api.get('facture-api.php', params);
      this.log.debug('FactureService - Réponse de l\'API get:', response);
      
      if (response && response.success) {
        const facturesData = response.factures || [];

        // Normalisation préventive des booléens
        const facturesNormalisees = this.normalizeFactures(facturesData);

        const facturesTriees = facturesNormalisees.sort((a, b) => {
          // Extraire les parties du numéro de facture (format: "001.2024")
          const partsA = a.numeroFacture ? a.numeroFacture.split('.') : ['0', '0'];
          const partsB = b.numeroFacture ? b.numeroFacture.split('.') : ['0', '0'];
          
          const numSeqA = parseInt(partsA[0]) || 0;  // Numéro séquentiel (ex: 001)
          const anneeA = parseInt(partsA[1]) || 0;    // Année (ex: 2024)
          
          const numSeqB = parseInt(partsB[0]) || 0;
          const anneeB = parseInt(partsB[1]) || 0;
          
          // Trier d'abord par année (décroissant = plus récent en premier)
          if (anneeA !== anneeB) {
            return anneeB - anneeA;
          }
          
          // Puis par numéro séquentiel (décroissant = plus récent en premier)
          return numSeqB - numSeqA;
        });
        
        // Adaptation des données avec état de base
        const facturesAdaptees = facturesTriees.map(facture => ({
          idFacture: facture.idFacture,
          numeroFacture: facture.numeroFacture,
          client: {
            idClient: facture.idClient,
            prenom: facture.prenom,
            nom: facture.nom,
            email: facture.email || null
          },
          montantTotal: parseFloat(facture.montantTotal),
          etat: this._determinerEtatFacture(facture), // État de base uniquement
          date_facture: facture.dateFacture,
          dateFacture: facture.dateFacture,
          date_paiement: facture.datePaiement,
          date_annulation: facture.dateAnnulation,
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
      handleApiError(error, `chargerFactures`);
    }
  }

  async getFacture(idFacture) {
    try {
      this.log.debug('Récupération de la facture:', idFacture);
      if (idFacture in this._cacheFacture) {
          this.log.debug('Facture trouvée dans le cache:', idFacture);
          // ✅ Enrichir la facture du cache avec l'état d'affichage actuel
          const factureCache = this._cacheFacture[idFacture];
          factureCache.etatAffichage = await this._determinerEtatAffichage(factureCache);
          return factureCache;
      }
      
      const response = await api.get(`facture-api.php?idFacture=${idFacture}`);
      this.log.debug('Réponse de l\'API:', response);
      
      if (response && response.success && response.facture) {
          const factureData = response.facture;
          
          // ✅ AJOUT: Debug des données brutes de l'API
          this.log.debug('🔍 Données brutes de l\'API facture:', factureData);
          this.log.debug('🔍 Clés disponibles dans factureData:', Object.keys(factureData));
          this.log.debug('🔍 Valeurs importantes:', {
            idFacture: factureData.idFacture,
            numeroFacture: factureData.numeroFacture,
            dateFacture: factureData.dateFacture,
            idClient: factureData.idClient,
            montant_total: factureData.montant_total,
            prenom: factureData.prenom,
            nom: factureData.nom
          });
          
          // Normalisation préventive des booléens
          const factureNormalisee = this.normalizeFacture(factureData);
          
          // Gestion du chemin du document avec URL correcte
          let documentPath = null;
          if (factureNormalisee.factfilename) {
              // ✅ CORRECTION: Utiliser l'endpoint API dédié pour servir les PDF
              // Cela garantit que l'authentification est vérifiée
              documentPath = apiUrl('document-api.php', { facture: factureNormalisee.factfilename });
              this.log.debug('Chemin du document de facture (via API):', documentPath);
          }

          this.log.debug('🔍 Données normalisées de la facture:', factureNormalisee);

          const factureFormattee = {
              // ✅ CORRECTION: Essayer différentes variantes de noms de champs
              idFacture: factureNormalisee.idFacture || factureNormalisee.id_facture || '',
              numeroFacture: factureNormalisee.numeroFacture || factureNormalisee.numero_facture || '',
              dateFacture: factureNormalisee.dateFacture || factureNormalisee.date_facture || '',
              idClient: factureNormalisee.idClient,
              montantTotal: parseFloat(factureNormalisee.montantTotal || 0),
              ristourne: parseFloat(factureNormalisee.ristourne || 0),
              montantBrut: parseFloat(factureNormalisee.montantBrut || 0),
              totalAvecRistourne: parseFloat(factureNormalisee.montantTotal || 0) - parseFloat(factureNormalisee.ristourne || 0),
              
              // Données des paiements multiples
              montantPayeTotal: parseFloat(factureNormalisee.montantPayeTotal || 0),
              montantRestant: parseFloat(factureNormalisee.montantRestant || 0),
              nbPaiements: parseInt(factureNormalisee.nbPaiements || 0),
              dateDernierPaiement: factureNormalisee.dateDernierPaiement || null,
              
              lignes: (factureNormalisee.lignes || []).map(ligne => ({
                  idLigne: ligne.idLigne,
                  description: ligne.description,
                  // unite: ligne.unite,
                  quantite: parseFloat(ligne.quantite || 0),
                  prixUnitaire: parseFloat(ligne.prixUnitaire || 0),
                  totalLigne: parseFloat(ligne.totalLigne || 0),
                  idService: ligne.idService || null,
                  idUnite: ligne.idUnite || null,
                  // serviceType: ligne.service_type || ligne.serviceType || null,
                  noOrdre: ligne.noOrdre || null,
                  descriptionDates: ligne.descriptionDates || null
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
                  idClient: factureNormalisee.idClient,
                  prenom: factureNormalisee.prenom,
                  nom: factureNormalisee.nom,
                  email: factureNormalisee.email || null,
              } : null
          };
          
          // ✅ AJOUT: Debug des données formatées
          this.log.debug('🔍 Données formatées pour le frontend:', factureFormattee);
          
          // ✅ ENRICHISSEMENT AUTOMATIQUE avec état d'affichage calculé dynamiquement
          factureFormattee.etatAffichage = await this._determinerEtatAffichage(factureFormattee);
          
          this.log.debug(`🔍 Facture ${factureFormattee.numeroFacture} - État de base: ${factureFormattee.etat}, État d'affichage: ${factureFormattee.etatAffichage}`);
          
          this._cacheFacture[idFacture] = factureFormattee;
          return factureFormattee;
      }
      return null;
    } catch (error) {
      handleApiError(error, `getFacture(${idFacture})`);
    }
  }

  async getProchainNumeroFacture(annee) {
    try {
      const response = await api.get(`facture-api.php?prochainNumeroFacture=${annee}`);
      
      if (response && response.success && response.parametre) {
        const numero = response.parametre.valeurParametre 
          ? `${response.parametre.valeurParametre.toString().padStart(3, '0')}.${annee}`
          : `001.${annee}`;
        
        return numero;
      }
      
      return `001.${annee}`;
    } catch (error) {
      handleApiError(error, `getProchainNumeroFacture(${annee})`);
    }
  }

  async createFacture(factureData) {
    this.log.debug('FactureService - createFacture - Création de la facture avec les données:', factureData);
    try {
      const response = await api.post('facture-api.php', factureData);
      this.log.debug('FactureService - createFacture - response', response)
      
      if (response && response.success) {
        this._clearCache();
        return {
          success: true,
          idFacture: response.factureId,
          message: response.message || 'Facture créée avec succès'
        };
      } else {
        throw new Error(response?.message || 'Erreur lors de la création de la facture');
      }
    } catch (error) {
      handleApiError(error, `createFacture`);
    }
  }

  async updateFacture(idFacture, factureData) {
    try {
      this.log.debug(`FactureService - updateFacture - Mise à jour de la facture ${idFacture} avec les données:`, factureData);
      const response = await api.put(`facture-api.php?idFacture=${idFacture}`, factureData);
      this.log.debug(`FactureService - updateFacture - Réponse de l'API:`, response);

      if (response && response.success) {
        delete this._cacheFacture[idFacture];
        return {
          success: true,
          message: response.message || 'Facture modifiée avec succès'
        };
      } else {
        throw new Error(response?.message || 'Erreur lors de la modification de la facture');
      }
    } catch (error) {
      handleApiError(error, `updateFacture(${idFacture})`);
    }
  }

  async deleteFacture(idFacture) {
    try {
      const response = await api.delete(`facture-api.php?idFacture=${idFacture}`);
      
      if (response && response.success) {
        delete this._cacheFacture[idFacture];
        return {
          success: true,
          message: response.message || 'Facture supprimée avec succès'
        };
      } else {
        throw new Error(response?.message || 'Erreur lors de la suppression de la facture');
      }
    } catch (error) {
      handleApiError(error, `deleteFacture(${idFacture})`);
    }
  }

  async changerEtatFacture(idFacture, nouvelEtat) {
    try {
      // Empêcher la persistance de l'état "Retard"
      if (nouvelEtat === 'Retard') {
        this.log.warn('⚠️ Tentative de persistance de l\'état "Retard" bloquée. Cet état est calculé dynamiquement.');
        return {
          success: false,
          message: 'L\'état "Retard" ne peut pas être persisté, il est calculé automatiquement.'
        };
      }

      const requestData = {
        nouvelEtat: nouvelEtat
      };

      const response = await api.post(`facture-api.php?changerEtat&idFacture=${idFacture}`, requestData);
      
      if (response && response.success) {
        delete this._cacheFacture[idFacture];
        return {
          success: true,
          message: response.message || `Facture mise à jour avec l'état "${nouvelEtat}" avec succès`
        };
      } else {
        throw new Error(response?.message || `Erreur lors du changement d'état de la facture à "${nouvelEtat}"`);
      }
    } catch (error) {
      handleApiError(error, `changerEtatFacture(${idFacture})`);
    }
  }

  /**
   * Annule une facture en changeant son état à "Annulée"
   * @param {number} idFacture - ID de la facture à annuler
   * @returns {Promise<Object>} - Résultat de l'opération
   */
  async annulerFacture(idFacture) {
    try {
      this.log.debug(`🚫 Annulation de la facture ${idFacture}`);
      return await this.changerEtatFacture(idFacture, 'Annulée');
    } catch (error) {
      handleApiError(error, `annulerFacture(${idFacture})`);
    }
  }

  async envoyerFactureParEmail(idFacture, emailData) {
    try {
        const response = await api.post(`facture-api.php?envoyer&idFacture=${idFacture}`, emailData);
        
        this.log.debug('Réponse de l\'API pour l\'envoi par email:', response);
        
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
        handleApiError(error, `envoyerFactureParMail(${idFacture})`);
    }
  }

  /**
   * Enregistre un paiement avec le nouveau système de paiements multiples
   */
  async enregistrerPaiement(idPaiement, data) {
      try {
          const response = await api.post(`facture-api.php?paiement&idPaiement=${idPaiement}`, data);
          
          if (response && response.success) {
              delete this._cacheFacture[response.idFacture];
              return {
                  success: true,
                  message: response.message || 'Paiement enregistré avec succès',
                  idPaiement: response.idPaiement,
                  numeroPaiement: response.numeroPaiement
              };
          } else {
              throw new Error(response?.message || 'Erreur lors de l\'enregistrement du paiement');
          }
      } catch (error) {
          handleApiError(error, `enregistrerPaiement(${idPaiement})`);
      }
  }

  /**
   * Récupère l'historique des paiements d'une facture
   */
  async getHistoriquePaiements(idFacture) {
      try {
          const response = await api.get(`facture-api.php?historiquePaiements&idFacture=${idFacture}`);
          
          if (response && response.success) {
              return {
                  success: true,
                  paiements: response.paiements || []
              };
          } else {
              throw new Error(response?.message || 'Erreur lors de la récupération de l\'historique');
          }
      } catch (error) {
          handleApiError(error, `getHistoriquePaiements(${idFacture})`);
      }
  }

  /**
   * Supprime un paiement (annulation)
   */
  async supprimerPaiement(idPaiement) {
      try {
          const response = await api.delete(`facture-api.php?supprimerPaiement&idPaiement=${idPaiement}`);
          
          if (response && response.success) {
              if (response.idFacture) {
                  delete this._cacheFacture[response.idFacture];
              }
              
              return {
                  success: true,
                  message: response.message || 'Paiement supprimé avec succès',
                  idFacture: response.idFacture
              };
          } else {
              throw new Error(response?.message || 'Erreur lors de la suppression du paiement');
          }
      } catch (error) {
          handleApiError(error, `supprimerPaiement(${idPaiement})`);
      }
  }

  async getFactureUrl(idFacture) {
    try {
        if (idFacture in this._cacheFacture && this._cacheFacture[idFacture].documentPath) {
            return {
                success: true,
                pdfUrl: this._cacheFacture[idFacture].documentPath
            };
        }
        
        const facture = await this.getFacture(idFacture);
        
        if (facture && facture.documentPath) {
            return {
                success: true,
                pdfUrl: facture.documentPath
            };
        }
        
        if (facture && facture.factfilename && facture.factfilename.trim() !== '') {
            const response = await api.get(`facture-api.php?getUrl=1&idFacture=${idFacture}`);
            
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
        handleApiError(error, `getFactureUrl(${idFacture})`);
    }
  }

  async imprimerFacture(idFacture, options = {}) {
    try {
      this.log.debug(`Impression de la facture ${idFacture} avec options:`, options);
      const response = await api.post(`facture-api.php?imprimer=1&idFacture=${idFacture}`, { options });
      this.log.debug(`Réponse de l'impression de la facture ${idFacture}:`, response);

      if (response && response.success) {
        delete this._cacheFacture[idFacture];

        if (response.etatActuel === 'En attente') {
          await this.changerEtatFacture(idFacture, 'Éditée');
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
      handleApiError(error, `imprimerFacture(${idFacture})`);
    }
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
      this.log.debug("getStatistiques Reponse :", response);
      
      if (response && response.success) {
        return {
          success: true,
          statistiques: response.statistiques || {}
        };
      } else {
        throw new Error(response?.message || 'Erreur lors de la récupération des statistiques');
      }
    } catch (error) {
      handleApiError(error, `getStatistiques`);
    }
  }

  _clearCache() {
    this._cacheFacture = {};
  }


}

export default FactureService;