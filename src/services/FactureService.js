/**
 * Service de gestion des factures - VERSION MISE À JOUR avec gestion préventive des booléens
 * @class FactureService
 * @description Gère l'accès aux données des factures via l'API facture-api.php
 */
import api from './api';
import { backendUrl } from '../utils/urlHelper';
import { toBoolean, normalizeBooleanFields, normalizeBooleanFieldsArray } from '../utils/booleanHelper'; // ✅ IMPORT du helper

class FactureService {
  constructor() {
    this.factures = [];
    this._cacheFacture = {}; // Cache pour les factures fréquemment consultées
  }

  /**
   * ✅ NORMALISATION D'UNE FACTURE
   * @param {Object} facture - Facture à normaliser
   * @returns {Object} - Facture avec propriétés booléennes normalisées
   */
  normalizeFacture(facture) {
    if (!facture || typeof facture !== 'object') return facture;
    
    // Champs booléens potentiels dans les factures
    const booleanFields = ['est_imprimee', 'est_envoyee', 'est_annulee', 'est_payee'];
    return normalizeBooleanFields(facture, booleanFields);
  }

  /**
   * ✅ NORMALISATION D'UN TABLEAU DE FACTURES
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
      console.log('FactureService - Paramètres de l\'API:', params);
      const response = await api.get('facture-api.php', params);
      console.log('FactureService - Réponse de l\'API get:', response);
      
      if (response && response.success) {
        const facturesData = response.factures || [];

        // ✅ NORMALISATION PRÉVENTIVE DES BOOLÉENS
        const facturesNormalisees = this.normalizeFactures(facturesData);
        console.log('Factures avant normalisation:', facturesData.slice(0, 2));
        console.log('Factures après normalisation:', facturesNormalisees.slice(0, 2));

        const facturesTriees = facturesNormalisees.sort((a, b) => {
          const numA = a.numero_facture ? parseInt(a.numero_facture.split('.')[0]) : 0;
          const numB = b.numero_facture ? parseInt(b.numero_facture.split('.')[0]) : 0;
          return numB - numA;
        });
        
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
          etat: this._determinerEtatFacture(facture),
          date_facture: facture.date_facture,
          dateFacture: facture.date_facture,
          date_paiement: facture.date_paiement,
          date_annulation: facture.date_annulation,
          // ✅ PROPRIÉTÉS BOOLÉENNES NORMALISÉES
          est_imprimee: toBoolean(facture.est_imprimee),
          est_envoyee: toBoolean(facture.est_envoyee),
          est_annulee: toBoolean(facture.est_annulee),
          est_payee: toBoolean(facture.est_payee)
        }));
        
        this.factures = facturesAdaptees;
        return facturesAdaptees;
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
              return this._cacheFacture[id];
          } else {
              console.log('Facture non trouvée dans le cache, appel API:', id);
          }
          
          const response = await api.get(`facture-api.php?id=${id}`);
          console.log('Réponse de l\'API:', response);
          
          if (response && response.success && response.facture) {
              const factureData = response.facture;
              
              // Normalisation préventive des booléens
              const factureNormalisee = this.normalizeFacture(factureData);
              console.log('Facture avant normalisation:', factureData);
              console.log('Facture après normalisation:', factureNormalisee);
              
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
                      console.log('Chemin du document de facture (FIX PERMANENT):', documentPath);
                  } catch (e) {
                      console.warn('Erreur lors de la récupération du chemin du document:', e);
                  }
              }

              const factureFormattee = {
                  id: factureNormalisee.id_facture || '',
                  numeroFacture: factureNormalisee.numero_facture || '',
                  dateFacture: factureNormalisee.date_facture || '',
                  clientId: factureNormalisee.id_client,
                  totalFacture: parseFloat(factureNormalisee.montant_total || 0),
                  ristourne: parseFloat(factureNormalisee.ristourne || 0),
                  totalAvecRistourne: parseFloat(factureNormalisee.montant_total || 0) - parseFloat(factureNormalisee.ristourne || 0),
                  
                  // ✅ NOUVEAU: Données des paiements multiples
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
                  etat: factureNormalisee.etat || '',
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
            
            // ✅ NORMALISATION DES BOOLÉENS DANS LA RÉPONSE
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
   * @param int id ID de la facture
   * @param array data Données du paiement
   * @return array Résultat de l'opération
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
   * @param int factureId ID de la facture
   * @return array Historique des paiements
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
   * @param int paiementId ID du paiement à supprimer
   * @return array Résultat de l'opération
   */
  async supprimerPaiement(paiementId) {
      try {
          const response = await api.delete(`facture-api.php?supprimerPaiement&id=${paiementId}`);
          
          if (response && response.success) {
              // Nettoyer le cache de la facture concernée
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

  /**
   * Récupère les statistiques de paiement d'une facture
   * @param int factureId ID de la facture
   * @return array Statistiques de paiement
   */
  async getStatistiquesPaiement(factureId) {
      try {
          const response = await api.get(`facture-api.php?statistiquesPaiement&id=${factureId}`);
          
          if (response && response.success) {
              return {
                  success: true,
                  statistiques: response.statistiques
              };
          } else {
              throw new Error(response?.message || 'Erreur lors de la récupération des statistiques');
          }
      } catch (error) {
          console.error(`Erreur lors de la récupération des statistiques de paiement pour la facture ${factureId}:`, error);
          throw error;
      }
  }

  async getFactureUrl(id) {
    try {
        if (id in this._cacheFacture && this._cacheFacture[id].documentPath) {
            console.log('URL trouvée dans le cache:', this._cacheFacture[id].documentPath);
            return {
                success: true,
                pdfUrl: this._cacheFacture[id].documentPath
            };
        }
        
        const facture = await this.getFacture(id);
        
        if (facture && facture.documentPath) {
            console.log('URL trouvée dans les données de la facture:', facture.documentPath);
            return {
                success: true,
                pdfUrl: facture.documentPath
            };
        }
        
        if (facture && facture.factfilename && facture.factfilename.trim() !== '') {
            const response = await api.get(`facture-api.php?getUrl=1&id=${id}`);
            
            if (response && response.success && response.pdfUrl) {
                console.log('URL récupérée via l\'API:', response.pdfUrl);
                
                // 🔧 FIX PERMANENT: Corriger l'URL si nécessaire
                let finalUrl = response.pdfUrl;
                if (!finalUrl.startsWith('http')) {
                    finalUrl = backendUrl(finalUrl);
                    console.log('URL complète générée (FIX PERMANENT):', finalUrl);
                }
                
                return {
                    success: true,
                    pdfUrl: finalUrl
                };
            }
        }
        
        console.log('Aucun PDF trouvé pour la facture ID:', id);
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

        // 🔧 FIX PERMANENT: Corriger l'URL PDF
        let finalPdfUrl = response.pdfUrl;
        if (finalPdfUrl && !finalPdfUrl.startsWith('http')) {
            finalPdfUrl = backendUrl(finalPdfUrl);
            console.log('URL PDF complète générée (FIX PERMANENT):', finalPdfUrl);
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
    try {
      const response = await api.post('facture-api.php?mettreAJourRetards=true', {});
      
      if (response && response.success) {
        this._clearCache();
        return {
          success: true,
          facturesModifiees: response.facturesModifiees || 0,
          message: response.message || 'Factures en retard mises à jour avec succès'
        };
      } else {
        throw new Error(response?.message || 'Erreur lors de la mise à jour des factures en retard');
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour des factures en retard:', error);
      throw error;
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

  _determinerEtatFacture(facture) {
    if (facture.etat) {
      return facture.etat;
    }
    
    if (facture.date_paiement) {
      return 'Payée';
    } else if (facture.date_annulation) {
      return 'Annulée';
    } else {
      const dateFacture = new Date(facture.date_facture);
      const aujourdhui = new Date();
      const diffTemps = aujourdhui.getTime() - dateFacture.getTime();
      const diffJours = Math.ceil(diffTemps / (1000 * 3600 * 24));
      
      if (diffJours > 30) {
        return 'Retard';
      } else {
        // ✅ UTILISATION SÉCURISÉE DU HELPER BOOLÉEN
        return toBoolean(facture.est_imprimee) ? 'Éditée' : 'En attente';
      }
    }
  }

  _clearCache() {
    this._cacheFacture = {};
  }

  formatMontant(montant) {
    return new Intl.NumberFormat('fr-CH', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    }).format(parseFloat(montant) || 0);
  }

  formatDate(dateString) {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('fr-CH', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      }).format(date);
    } catch (e) {
      console.error('Erreur lors du formatage de la date:', e);
      return dateString;
    }
  }

}

export default FactureService;