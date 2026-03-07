// src/components/paiements/hooks/usePaiementActions.js
import { useCallback, useMemo } from 'react';
import { useApiCall } from '../../../hooks/useApiCall';
import { createLogger } from '../../../utils/createLogger';
import PaiementService from '../../../services/PaiementService';

/**
 * Hook centralisé pour toutes les actions liées aux paiements
 * 
 * Remplace les appels directs à PaiementService dans tous les hooks de paiements
 * Utilise useApiCall pour une gestion cohérente des erreurs et du chargement
 * 
 * @returns {Object} Toutes les actions disponibles pour les paiements
 */
export const usePaiementActions = () => {
  const log = createLogger('usePaiementActions');
  const { execute: executeApi } = useApiCall();

  // ✅ Créer le service en interne
  const paiementService = useMemo(() => new PaiementService(), []);

  // ========================================
  // ACTIONS PAIEMENTS - CHARGEMENT
  // ========================================

  /**
   * Charge la liste des paiements avec filtrage optionnel et pagination
   * @param {Object} options - Options de filtrage (annee, mois, methode, idClient, statut, page, limit)
   * @returns {Promise<Object>} {paiements: Array, pagination: Object}
   */
  const chargerPaiements = useCallback(async (options = {}) => {
    return await executeApi(
      async () => {
        log.debug('📥 Chargement des paiements avec options:', options);
        const result = await paiementService.chargerPaiements(options);
        log.debug(`✅ ${result.paiements.length} paiements chargés`);
        return result;
      },
      null,
      (error) => {
        log.error('❌ Erreur chargement paiements:', error);
        throw error;
      }
    );
  }, [paiementService, executeApi, log]);

  /**
   * Récupère un paiement spécifique par son ID
   * @param {number} idPaiement - ID du paiement
   * @returns {Promise<Object|null>} Données du paiement
   */
  const getPaiement = useCallback(async (idPaiement) => {
    return await executeApi(
      async () => {
        log.debug('📥 Récupération du paiement:', idPaiement);
        const result = await paiementService.getPaiement(idPaiement);
        if (result) {
          log.debug('✅ Paiement récupéré:', result.numeroPaiement);
        } else {
          log.warn('⚠️ Paiement non trouvé:', idPaiement);
        }
        return result;
      },
      null,
      (error) => {
        log.error('❌ Erreur récupération paiement:', error);
        throw error;
      }
    );
  }, [paiementService, executeApi, log]);

  /**
   * Récupère les paiements d'une facture spécifique
   * @param {number} idFacture - ID de la facture
   * @returns {Promise<Array>} Liste des paiements de la facture
   */
  const getPaiementsParFacture = useCallback(async (idFacture) => {
    return await executeApi(
      async () => {
        log.debug('📥 Récupération des paiements pour la facture:', idFacture);
        const result = await paiementService.getPaiementsParFacture(idFacture);
        log.debug(`✅ ${result.length} paiements trouvés pour la facture`);
        return result;
      },
      null,
      (error) => {
        log.error('❌ Erreur récupération paiements facture:', error);
        throw error;
      }
    );
  }, [paiementService, executeApi, log]);

  /**
   * Récupère les paiements par méthode de paiement
   * @param {string} methode - Méthode de paiement
   * @param {Object} options - Options additionnelles
   * @returns {Promise<Object>} {paiements: Array, pagination: Object}
   */
  const getPaiementsParMethode = useCallback(async (methode, options = {}) => {
    return await executeApi(
      async () => {
        log.debug('📥 Récupération des paiements par méthode:', methode);
        const result = await paiementService.getPaiementsParMethode(methode, options);
        log.debug(`✅ ${result.paiements.length} paiements trouvés`);
        return result;
      },
      null,
      (error) => {
        log.error('❌ Erreur récupération paiements par méthode:', error);
        throw error;
      }
    );
  }, [paiementService, executeApi, log]);

  /**
   * Récupère les paiements d'un client spécifique
   * @param {number} idClient - ID du client
   * @param {Object} options - Options additionnelles
   * @returns {Promise<Object>} {paiements: Array, pagination: Object}
   */
  const getPaiementsParClient = useCallback(async (idClient, options = {}) => {
    return await executeApi(
      async () => {
        log.debug('📥 Récupération des paiements pour le client:', idClient);
        const result = await paiementService.getPaiementsParClient(idClient, options);
        log.debug(`✅ ${result.paiements.length} paiements trouvés`);
        return result;
      },
      null,
      (error) => {
        log.error('❌ Erreur récupération paiements client:', error);
        throw error;
      }
    );
  }, [paiementService, executeApi, log]);

  /**
   * Récupère les paiements libres (non attribués à une facture ni à un loyer) d'un client
   * @param {number} idClient - ID du client
   * @returns {Promise<Array>} Liste des paiements libres
   */
  const getPaiementsLibresParClient = useCallback(async (idClient) => {
    return await executeApi(
      async () => {
        log.debug('📥 Récupération des paiements libres pour le client:', idClient);
        const result = await paiementService.chargerPaiements({
          idClient,
          libre:  true,
          statut: 'confirme',
          limit:  50,
        });
        const paiements = result?.paiements || [];
        log.debug(`✅ ${paiements.length} paiements libres trouvés`);
        return paiements;
      },
      null,
      (error) => {
        log.error('❌ Erreur récupération paiements libres:', error);
        return [];
      }
    );
  }, [paiementService, executeApi, log]);

  /**
   * Récupère les paiements pour une période donnée
   * @param {number} annee - Année
   * @param {number|null} mois - Mois (optionnel)
   * @param {Object} options - Options additionnelles
   * @returns {Promise<Object>} {paiements: Array, pagination: Object}
   */
  const getPaiementsParPeriode = useCallback(async (annee, mois = null, options = {}) => {
    return await executeApi(
      async () => {
        log.debug('📥 Récupération des paiements pour la période:', { annee, mois });
        const result = await paiementService.getPaiementsParPeriode(annee, mois, options);
        log.debug(`✅ ${result.paiements.length} paiements trouvés`);
        return result;
      },
      null,
      (error) => {
        log.error('❌ Erreur récupération paiements période:', error);
        throw error;
      }
    );
  }, [paiementService, executeApi, log]);

  /**
   * Récupère la ventilation d'un paiement libre
   * (liste des attributions sur loyers ou factures depuis ce paiement source)
   * @param {number} idPaiement - ID du paiement libre source
   * @returns {Promise<Object>} {success, ventilation: Array, montant_original, montant_paye, montant_attribue, solde_disponible}
   */
  const getVentilation = useCallback(async (idPaiement) => {
    return await executeApi(
      async () => {
        log.debug('📊 Récupération ventilation du paiement:', idPaiement);
        const result = await paiementService.getVentilation(idPaiement);
        log.debug(`✅ Ventilation récupérée: ${result?.ventilation?.length ?? 0} attribution(s)`);
        return result;
      },
      null,
      (error) => {
        log.error('❌ Erreur récupération ventilation:', error);
        throw error;
      }
    );
  }, [paiementService, executeApi, log]);

  /**
   * Recherche avancée de paiements
   * @param {Object} criteres - Critères de recherche
   * @returns {Promise<Object>} {paiements: Array, pagination: Object}
   */
  const rechercherPaiements = useCallback(async (criteres) => {
    return await executeApi(
      async () => {
        log.debug('🔍 Recherche de paiements avec critères:', criteres);
        const result = await paiementService.rechercherPaiements(criteres);
        log.debug(`✅ ${result.paiements.length} paiements trouvés`);
        return result;
      },
      null,
      (error) => {
        log.error('❌ Erreur recherche paiements:', error);
        throw error;
      }
    );
  }, [paiementService, executeApi, log]);

  // ========================================
  // ACTIONS PAIEMENTS - CRUD
  // ========================================

  /**
   * Crée un nouveau paiement
   * @param {Object} paiementData - Données du paiement
   * @returns {Promise<Object>} Résultat de l'opération
   */
  const creerPaiement = useCallback(async (paiementData) => {
    return await executeApi(
      async () => {
        log.debug('📝 Création d\'un paiement:', paiementData);
        const result = await paiementService.createPaiement(paiementData);
        log.debug('✅ Paiement créé:', result.numeroPaiement);
        return result;
      },
      null,
      (error) => {
        log.error('❌ Erreur création paiement:', error);
        throw error;
      }
    );
  }, [paiementService, executeApi, log]);

  /**
   * Met à jour un paiement existant
   * @param {number} idPaiement - ID du paiement
   * @param {Object} paiementData - Nouvelles données
   * @returns {Promise<Object>} Résultat de l'opération
   */
  const modifierPaiement = useCallback(async (idPaiement, paiementData) => {
    return await executeApi(
      async () => {
        log.debug('🔄 Modification du paiement:', idPaiement);
        const result = await paiementService.updatePaiement(idPaiement, paiementData);
        log.debug('✅ Paiement modifié');
        return result;
      },
      null,
      (error) => {
        log.error('❌ Erreur modification paiement:', error);
        throw error;
      }
    );
  }, [paiementService, executeApi, log]);

  /**
   * Supprime un paiement
   * @param {number} idPaiement - ID du paiement
   * @returns {Promise<Object>} Résultat de l'opération
   */
  const supprimerPaiement = useCallback(async (idPaiement) => {
    return await executeApi(
      async () => {
        log.debug('🗑️ Suppression du paiement:', idPaiement);
        const result = await paiementService.deletePaiement(idPaiement);
        log.debug('✅ Paiement supprimé');
        return result;
      },
      null,
      (error) => {
        log.error('❌ Erreur suppression paiement:', error);
        throw error;
      }
    );
  }, [paiementService, executeApi, log]);

  /**
   * Annule un paiement
   * @param {number} idPaiement - ID du paiement
   * @param {string} motifAnnulation - Motif de l'annulation
   * @returns {Promise<Object>} Résultat de l'opération
   */
  const annulerPaiement = useCallback(async (idPaiement, motifAnnulation) => {
    return await executeApi(
      async () => {
        log.debug('🚫 Annulation du paiement:', idPaiement);
        const result = await paiementService.cancelPaiement(idPaiement, motifAnnulation);
        log.debug('✅ Paiement annulé');
        return result;
      },
      null,
      (error) => {
        log.error('❌ Erreur annulation paiement:', error);
        throw error;
      }
    );
  }, [paiementService, executeApi, log]);

  /**
   * Restaure un paiement annulé
   * @param {number} idPaiement - ID du paiement
   * @returns {Promise<Object>} Résultat de l'opération
   */
  const restaurerPaiement = useCallback(async (idPaiement) => {
    return await executeApi(
      async () => {
        log.debug('♻️ Restauration du paiement:', idPaiement);
        const result = await paiementService.restaurerPaiement(idPaiement);
        log.debug('✅ Paiement restauré');
        return result;
      },
      null,
      (error) => {
        log.error('❌ Erreur restauration paiement:', error);
        throw error;
      }
    );
  }, [paiementService, executeApi, log]);

  // ========================================
  // ACTIONS PAIEMENTS - STATISTIQUES
  // ========================================

  /**
   * Récupère les statistiques des paiements
   * @param {Object} options - Options de filtrage
   * @returns {Promise<Object>} Statistiques
   */
  const getStatistiques = useCallback(async (options = {}) => {
    return await executeApi(
      async () => {
        log.debug('📊 Récupération des statistiques');
        const result = await paiementService.getStatistiques(options);
        log.debug('✅ Statistiques récupérées');
        return result;
      },
      null,
      (error) => {
        log.error('❌ Erreur récupération statistiques:', error);
        throw error;
      }
    );
  }, [paiementService, executeApi, log]);

  // ========================================
  // UTILITAIRES
  // ========================================

  /**
   * Récupère les méthodes de paiement disponibles
   * @returns {Array} Liste des méthodes de paiement
   */
  const getMethodesPaiement = useCallback(() => {
    log.debug('📋 Récupération des méthodes de paiement');
    return paiementService.getMethodesPaiement();
  }, [paiementService, log]);

  /**
   * Récupère les années disponibles
   * @returns {Promise<Array>} Liste des années
   */
  const getAnneesDisponibles = useCallback(async () => {
    return await executeApi(
      async () => {
        log.debug('📅 Récupération des années disponibles');
        const result = await paiementService.getAnneesDisponibles();
        log.debug('✅ Années récupérées:', result);
        return result;
      },
      null,
      (error) => {
        log.error('❌ Erreur récupération années:', error);
        throw error;
      }
    );
  }, [paiementService, executeApi, log]);

  /**
   * Valide les données d'un paiement
   * @param {Object} paiementData - Données à valider
   * @returns {Object} {valid: boolean, errors: Array}
   */
  const validerDonneesPaiement = useCallback((paiementData) => {
    log.debug('✓ Validation des données du paiement');
    return paiementService.validerDonneesPaiement(paiementData);
  }, [paiementService, log]);

  /**
   * Formate une méthode de paiement pour l'affichage
   * @param {string} methode - Méthode de paiement
   * @returns {string} Méthode formatée
   */
  const formatMethodePaiement = useCallback((methode) => {
    return paiementService.formatMethodePaiement(methode);
  }, [paiementService]);

  /**
   * Calcule les totaux d'une liste de paiements
   * @param {Array} paiements - Liste des paiements
   * @returns {Object} Totaux calculés
   */
  const calculerTotaux = useCallback((paiements) => {
    log.debug('🔢 Calcul des totaux pour', paiements.length, 'paiements');
    return paiementService.calculerTotaux(paiements);
  }, [paiementService, log]);

  /**
   * Vide le cache des paiements
   * Utile après des modifications importantes ou pour forcer un rechargement
   * @returns {void}
   */
  const clearCache = useCallback(() => {
    log.debug('🗑️ Vidage du cache des paiements');
    paiementService._clearCache();
    log.debug('✅ Cache vidé');
  }, [paiementService, log]);

  /**
   * Debug de session (développement uniquement)
   * @returns {Promise<Object>} Informations de debug
   */
  const debugSession = useCallback(async () => {
    return await executeApi(
      async () => {
        log.debug('🐛 Debug session');
        const result = await paiementService.debugSession();
        log.debug('✅ Debug terminé');
        return result;
      },
      null,
      (error) => {
        log.error('❌ Erreur debug session:', error);
        throw error;
      }
    );
  }, [paiementService, executeApi, log]);

  // ========================================
  // RETOUR DE TOUTES LES ACTIONS
  // ========================================

  return useMemo(() => ({
    // Chargement
    chargerPaiements,
    getPaiement,
    getPaiementsParFacture,
    getPaiementsParMethode,
    getPaiementsParClient,
    getPaiementsLibresParClient,
    getPaiementsParPeriode,
    getVentilation,
    rechercherPaiements,
    
    // CRUD
    creerPaiement,
    modifierPaiement,
    supprimerPaiement,
    annulerPaiement,
    restaurerPaiement,
    
    // Statistiques
    getStatistiques,
    
    // Utilitaires
    getMethodesPaiement,
    getAnneesDisponibles,
    validerDonneesPaiement,
    formatMethodePaiement,
    calculerTotaux,
    clearCache,
    debugSession,
    
    // Accès direct au service si nécessaire
    service: paiementService
  }), [paiementService]); // ✅ CORRIGÉ : Seul paiementService doit être dans les dépendances
};

export default usePaiementActions;