// src/components/factures/hooks/useFactureActions.js
// ✅ VERSION REFACTORISÉE - Uniquement FactureService
// ✅ Pas d'appels à useTarifActions ou ClientService
// ✅ L'enrichissement des données se fait ailleurs (useFactureFormActions ou helpers)

import { useCallback, useMemo } from 'react';
import { useApiCall } from '../../../hooks/useApiCall';
import { createLogger } from '../../../utils/createLogger';
import FactureService from '../../../services/FactureService';

/**
 * Hook centralisé pour toutes les actions liées aux factures
 * ✅ Responsabilité unique : uniquement les appels à FactureService
 * ✅ Pas d'appels à d'autres services (Client, Tarification)
 * 
 * @returns {Object} Actions disponibles pour les factures
 */
export const useFactureActions = () => {
  const log = createLogger('useFactureActions');
  const { execute: executeApi } = useApiCall();

  // ✅ Créer le service en interne
  const factureService = useMemo(() => new FactureService(), []);

  // ========================================
  // ACTIONS CRUD FACTURES
  // ========================================

  /**
   * Charge toutes les factures pour une année donnée
   * @param {number} annee - Année des factures à charger
   * @returns {Promise<Array>} Factures avec états calculés
   */
  const chargerFactures = useCallback(async (annee) => {
    return await executeApi(
      async () => {
        log.debug(`📥 Chargement des factures pour l'année ${annee}...`);
        const facturesData = await factureService.chargerFactures(annee);
        
        log.debug(`🔄 Enrichissement de ${facturesData.length} factures avec états calculés...`);
        const facturesEnrichies = await factureService.enrichirFacturesAvecEtatAffichage(facturesData);
        
        log.debug(`✅ ${facturesEnrichies.length} factures chargées`);
        return facturesEnrichies;
      },
      null,
      (error) => {
        log.error('❌ Erreur chargement factures:', error);
        throw error;
      }
    );
  }, [factureService, executeApi, log]);

  /**
   * Charge les factures pouvant recevoir un paiement
   * @param {number} annee - Année des factures (optionnel)
   * @returns {Promise<Array>} Factures payables avec états calculés
   */
  const chargerFacturesPayables = useCallback(async (annee = null) => {
    return await executeApi(
      async () => {
        log.debug(`📥 Chargement des factures payables pour l'année ${annee || 'toutes'}...`);
        const facturesPayables = await factureService.getFacturesPayables(annee);
        
        log.debug(`✅ ${facturesPayables?.length || 0} factures payables chargées`);
        return facturesPayables || [];
      },
      null,
      (error) => {
        log.error('❌ Erreur chargement factures payables:', error);
        throw error;
      }
    );
  }, [factureService, executeApi, log]);

  /**
   * Charge toutes les factures d'un client spécifique
   * ✅ OPTIMISÉ : Appel API dédié (filtrage server-side)
   * @param {number} idClient - ID du client
   * @returns {Promise<Array>} Factures du client avec états calculés
   */
  const chargerFacturesClient = useCallback(async (idClient) => {
    return await executeApi(
      async () => {
        log.debug(`📥 Chargement factures client #${idClient}...`);
        
        // ✅ OPTIMISÉ : Endpoint dédié avec snake_case → camelCase automatique
        const facturesClient = await factureService.getFacturesClient(idClient);
        
        log.debug(`✅ ${facturesClient?.length || 0} factures chargées pour le client #${idClient}`);
        return facturesClient || [];
      },
      null,
      (error) => {
        log.error(`❌ Erreur factures client #${idClient}:`, error);
        throw error;
      }
    );
  }, [factureService, executeApi, log]);

  /**
   * Charge une facture par son ID (données brutes sans enrichissement tarification)
   * @param {number} idFacture - ID de la facture
   * @returns {Promise<Object>} Facture brute depuis l'API
   */
  const chargerFacture = useCallback(async (idFacture) => {
    return await executeApi(
      async () => {
        log.debug('📥 Chargement facture:', idFacture);
        const factureData = await factureService.getFacture(idFacture);
        
        log.debug("✅ Facture chargée:", factureData?.numeroFacture);
        log.debug("📊 Données brutes de la facture:", factureData);

        if (!factureData) {
          throw new Error('Aucune donnée de facture trouvée');
        }

        return factureData;
      },
      null,
      (error) => {
        log.error('❌ Erreur chargement facture:', error);
        throw error;
      }
    );
  }, [factureService, executeApi, log]);

  /**
   * Récupère l'URL d'une facture
   * @param {number} idFacture - ID de la facture
   * @returns {Promise<string>} URL de la facture
   */
  const getFactureUrl = useCallback(async (idFacture) => {
    return await executeApi(
      async () => {
        log.debug('🔗 Récupération URL facture:', idFacture);
        const result = await factureService.getFactureUrl(idFacture);
        log.debug('✅ URL récupérée');
        return result;
      },
      null,
      (error) => {
        log.error('❌ Erreur récupération URL:', error);
        throw error;
      }
    );
  }, [factureService, executeApi, log]);

  /**
   * Imprime une facture
   * @param {number} idFacture - ID de la facture
   * @returns {Promise<Object>} Résultat de l'impression
   */
  const imprimerFacture = useCallback(async (idFacture) => {
    return await executeApi(
      async () => {
        log.debug('🖨️ Impression facture:', idFacture);
        const result = await factureService.imprimerFacture(idFacture);
        log.debug('✅ Facture imprimée');
        return result;
      },
      null,
      (error) => {
        log.error('❌ Erreur impression:', error);
        throw error;
      }
    );
  }, [factureService, executeApi, log]);

  /**
   * Envoie une facture par email
   * @param {number} idFacture - ID de la facture
   * @param {Object} emailData - Données de l'email
   * @returns {Promise<Object>} Résultat de l'envoi
   */
  const envoyerFactureParEmail = useCallback(async (idFacture, emailData) => {
    return await executeApi(
      async () => {
        log.debug('📧 Envoi email facture:', idFacture);
        const result = await factureService.envoyerFactureParEmail(idFacture, emailData);
        log.debug('✅ Email envoyé');
        return result;
      },
      null,
      (error) => {
        log.error('❌ Erreur envoi email:', error);
        throw error;
      }
    );
  }, [factureService, executeApi, log]);

  /**
   * Crée une nouvelle facture
   * @param {Object} factureData - Données de la facture à créer
   * @returns {Promise<Object>} Facture créée
   */
  const creerFacture = useCallback(async (factureData) => {
    return await executeApi(
      async () => {
        log.debug('📝 Création facture:', factureData);
        const result = await factureService.createFacture(factureData);
        log.debug('✅ Facture créée:', result);
        return result;
      },
      null,
      (error) => {
        log.error('❌ Erreur création facture:', error);
        throw error;
      }
    );
  }, [factureService, executeApi, log]);

  /**
   * Met à jour une facture existante
   * @param {number} idFacture - ID de la facture
   * @param {Object} factureData - Nouvelles données
   * @returns {Promise<Object>} Facture mise à jour
   */
  const modifierFacture = useCallback(async (idFacture, factureData) => {
    return await executeApi(
      async () => {
        log.debug('🔄 Modification facture:', idFacture);
        const result = await factureService.updateFacture(idFacture, factureData);
        log.debug('✅ Facture modifiée:', result);
        return result;
      },
      null,
      (error) => {
        log.error('❌ Erreur modification facture:', error);
        throw error;
      }
    );
  }, [factureService, executeApi, log]);

  /**
   * Supprime une facture
   * @param {number} idFacture - ID de la facture à supprimer
   * @returns {Promise<boolean>} Succès de la suppression
   */
  const supprimerFacture = useCallback(async (idFacture) => {
    return await executeApi(
      async () => {
        log.debug('🗑️ Suppression facture:', idFacture);
        await factureService.deleteFacture(idFacture);
        log.debug('✅ Facture supprimée');
        return true;
      },
      null,
      (error) => {
        log.error('❌ Erreur suppression facture:', error);
        throw error;
      }
    );
  }, [factureService, executeApi, log]);

  /**
   * Marque une facture comme payée
   * @param {number} idFacture - ID de la facture
   * @param {Object} paiementData - Données du paiement
   * @returns {Promise<Object>} Facture mise à jour
   */
  const marquerCommePayee = useCallback(async (idFacture, paiementData) => {
    return await executeApi(
      async () => {
        log.debug('💰 Marquage facture comme payée:', idFacture);
        const result = await factureService.marquerCommePayee(idFacture, paiementData);
        log.debug('✅ Facture marquée comme payée');
        return result;
      },
      null,
      (error) => {
        log.error('❌ Erreur marquage paiement:', error);
        throw error;
      }
    );
  }, [factureService, executeApi, log]);

  /**
   * Annule une facture
   * @param {number} idFacture - ID de la facture
   * @returns {Promise<Object>} Facture annulée
   */
  const annulerFacture = useCallback(async (idFacture) => {
    return await executeApi(
      async () => {
        log.debug('🚫 Annulation facture:', idFacture);
        const result = await factureService.annulerFacture(idFacture);
        log.debug('✅ Facture annulée');
        return result;
      },
      null,
      (error) => {
        log.error('❌ Erreur annulation facture:', error);
        throw error;
      }
    );
  }, [factureService, executeApi, log]);

  /**
   * Marque une facture comme imprimée
   * @param {number} idFacture - ID de la facture
   * @returns {Promise<Object>} Facture mise à jour
   */
  const marquerCommeImprimee = useCallback(async (idFacture) => {
    return await executeApi(
      async () => {
        log.debug('🖨️ Marquage facture comme imprimée:', idFacture);
        const result = await factureService.marquerCommeImprimee(idFacture);
        log.debug('✅ Facture marquée comme imprimée');
        return result;
      },
      null,
      (error) => {
        log.error('❌ Erreur marquage impression:', error);
        throw error;
      }
    );
  }, [factureService, executeApi, log]);

  /**
   * Marque une facture comme envoyée
   * @param {number} idFacture - ID de la facture
   * @returns {Promise<Object>} Facture mise à jour
   */
  const marquerCommeEnvoyee = useCallback(async (idFacture) => {
    return await executeApi(
      async () => {
        log.debug('📧 Marquage facture comme envoyée:', idFacture);
        const result = await factureService.marquerCommeEnvoyee(idFacture);
        log.debug('✅ Facture marquée comme envoyée');
        return result;
      },
      null,
      (error) => {
        log.error('❌ Erreur marquage envoi:', error);
        throw error;
      }
    );
  }, [factureService, executeApi, log]);

  // ========================================
  // UTILITAIRES
  // ========================================

  /**
   * Enrichit les factures avec les états d'affichage
   * @param {Array} factures - Factures à enrichir
   * @returns {Promise<Array>} Factures enrichies
   */
  const enrichirFacturesAvecEtat = useCallback(async (factures) => {
    return await executeApi(
      async () => {
        log.debug(`🔄 Enrichissement de ${factures.length} factures avec états...`);
        const result = await factureService.enrichirFacturesAvecEtatAffichage(factures);
        log.debug('✅ Factures enrichies avec états');
        return result;
      },
      null,
      (error) => {
        log.error('❌ Erreur enrichissement factures:', error);
        throw error;
      }
    );
  }, [factureService, executeApi, log]);

  /**
   * Vide le cache des factures
   */
  const clearCache = useCallback(() => {
    log.debug('🗑️ Vidage du cache des factures');
    if (factureService._clearCache) {
      factureService._clearCache();
    }
    log.debug('✅ Cache vidé');
  }, [factureService, log]);

  // ========================================
  // RETOUR DE TOUTES LES ACTIONS
  // ========================================

  return useMemo(() => ({
    // Actions CRUD
    chargerFactures,
    chargerFacturesPayables,
    chargerFacturesClient,
    chargerFacture,
    creerFacture,
    modifierFacture,
    supprimerFacture,
    
    // Actions d'état
    marquerCommePayee,
    annulerFacture,
    marquerCommeImprimee,
    marquerCommeEnvoyee,
    
    // Actions documents
    getFactureUrl,
    imprimerFacture,
    envoyerFactureParEmail,
    
    // Utilitaires
    enrichirFacturesAvecEtat,
    clearCache
  }), [
    chargerFactures,
    chargerFacturesPayables,
    chargerFacturesClient,
    chargerFacture,
    creerFacture,
    modifierFacture,
    supprimerFacture,
    marquerCommePayee,
    annulerFacture,
    marquerCommeImprimee,
    marquerCommeEnvoyee,
    getFactureUrl,
    imprimerFacture,
    envoyerFactureParEmail,
    enrichirFacturesAvecEtat,
    clearCache
  ]);
};

export default useFactureActions;