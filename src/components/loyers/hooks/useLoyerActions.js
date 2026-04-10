// src/components/loyers/hooks/useLoyerActions.js
// Hook pour gérer les actions sur les loyers
// ✅ VERSION CORRIGÉE pour table loyer séparée

import { useMemo } from 'react';
import { useApiCall } from '../../../hooks/useApiCall';
import LoyerService from '../../../services/LoyerService';
import { createLogger } from '../../../utils/createLogger';

const logger = createLogger('useLoyerActions');

export function useLoyerActions() {
  const { execute: executeApi, isLoading, error } = useApiCall();

  // Créer l'instance du service une seule fois
  const loyerService = useMemo(() => LoyerService, []);

  /**
   * Charge tous les loyers
   * @param {Object} filtres - Filtres optionnels { idClient, annee, statut }
   * @returns {Promise<Array>} Liste des loyers
   */
  const chargerLoyers = async (filtres = {}) => {
    logger.info('🚀 Chargement de tous les loyers', filtres);

    return executeApi(
      async () => {
        const loyers = await loyerService.chargerLoyers(filtres);
        logger.debug('✅ Loyers chargés:', loyers);
        return loyers;
      },
      () => {
        logger.info(`✅ Succès: ${loyerService.loyers?.length || 0} loyers chargés`);
      },
      (error) => {
        logger.error('❌ Erreur lors du chargement des loyers:', error);
        throw error;
      }
    );
  };

  /**
   * Récupère un loyer par son ID
   * @param {number} idLoyer - ID du loyer
   * @returns {Promise<Object>} Loyer
   */
  const getLoyer = async (idLoyer, forceRefresh = false) => {
    if (!idLoyer) {
      logger.warn('⚠️ getLoyer appelé sans ID');
      return null;
    }

    logger.info(`📥 Récupération du loyer #${idLoyer}${forceRefresh ? ' (force refresh)' : ''}`);

    return executeApi(
      async () => {
        const loyer = await loyerService.getLoyer(idLoyer, forceRefresh);
        logger.debug('✅ Loyer récupéré:', loyer);
        return loyer;
      },
      () => {
        logger.info(`✅ Loyer #${idLoyer} récupéré avec succès`);
      },
      (error) => {
        logger.error(`❌ Erreur lors de la récupération du loyer #${idLoyer}:`, error);
        throw error;
      }
    );
  };

  /**
   * Invalide le cache d'un loyer spécifique
   * Utile avant d'ouvrir une modal de paiement pour forcer un rechargement frais
   * @param {number} idLoyer - ID du loyer à invalider
   */
  const invalidateLoyer = (idLoyer) => {
    if (idLoyer) loyerService.invalidateCache(idLoyer);
  };

  /**
   * Crée un nouveau loyer
   * @param {Object} loyerData - Données du loyer
   * @returns {Promise<Object>} Résultat de la création
   */
  const createLoyer = async (loyerData) => {
    logger.info('➕ Création d\'un nouveau loyer', {
      client: loyerData.idClient,
      montant: loyerData.loyerMontantTotal
    });

    return executeApi(
      async () => {
        const result = await loyerService.createLoyer(loyerData);
        logger.debug('✅ Résultat création:', result);
        return result;
      },
      (result) => {
        const id = result?.idLoyer;
        const numero = result?.numeroLoyer;
        logger.info(`✅ Loyer créé avec succès - ID: ${id}, Numéro: ${numero}`);
      },
      (error) => {
        logger.error('❌ Erreur lors de la création du loyer:', error);
        throw error;
      }
    );
  };

  /**
   * Met à jour un loyer existant
   * @param {number} idLoyer - ID du loyer
   * @param {Object} loyerData - Nouvelles données
   * @returns {Promise<Object>} Résultat de la mise à jour
   */
  const updateLoyer = async (idLoyer, loyerData) => {
    if (!idLoyer) {
      const error = new Error('ID loyer requis pour la mise à jour');
      logger.error('❌', error.message);
      throw error;
    }

    logger.info(`✏️ Mise à jour du loyer #${idLoyer}`);

    return executeApi(
      async () => {
        const result = await loyerService.updateLoyer(idLoyer, loyerData);
        logger.debug('✅ Résultat mise à jour:', result);
        return result;
      },
      () => {
        logger.info(`✅ Loyer #${idLoyer} mis à jour avec succès`);
      },
      (error) => {
        logger.error(`❌ Erreur lors de la mise à jour du loyer #${idLoyer}:`, error);
        throw error;
      }
    );
  };

  /**
   * Supprime un loyer
   * @param {number} idLoyer - ID du loyer à supprimer
   * @returns {Promise<Object>} Résultat de la suppression
   */
  const deleteLoyer = async (idLoyer) => {
    if (!idLoyer) {
      const error = new Error('ID loyer requis pour la suppression');
      logger.error('❌', error.message);
      throw error;
    }

    logger.info(`🗑️ Suppression du loyer #${idLoyer}`);

    return executeApi(
      async () => {
        const result = await loyerService.deleteLoyer(idLoyer);
        logger.debug('✅ Résultat suppression:', result);
        return result;
      },
      () => {
        logger.info(`✅ Loyer #${idLoyer} supprimé avec succès`);
      },
      (error) => {
        logger.error(`❌ Erreur lors de la suppression du loyer #${idLoyer}:`, error);
        throw error;
      }
    );
  };

  /**
   * Lie une facture générée à un loyer.
   * @param {number} idLoyer
   * @param {number} idFacture
   */
  const lierFacture = async (idLoyer, idFacture) => {
    logger.info(`🔗 Liaison loyer #${idLoyer} → facture #${idFacture}`);
    return executeApi(
      async () => {
        const result = await loyerService.lierFacture(idLoyer, idFacture);
        logger.debug('✅ Liaison enregistrée:', result);
        return result;
      },
      () => { logger.info(`✅ Loyer #${idLoyer} lié à la facture #${idFacture}`); },
      (error) => {
        logger.error(`❌ Erreur liaison loyer-facture:`, error);
        throw error;
      }
    );
  };

  /**
   * ✅ CORRIGÉ: Génère le prochain numéro de loyer pour un client
   * @param {number} idClient - ID du client (OBLIGATOIRE)
   * @returns {Promise<string>} Numéro de loyer (ex: "LOY-12-003")
   */
  const genererNumeroLoyer = async (idClient) => {
    if (!idClient) {
      const error = new Error('ID client requis pour générer le numéro');
      logger.error('❌', error.message);
      throw error;
    }

    logger.info(`🔢 Génération du numéro de loyer pour client #${idClient}`);

    return executeApi(
      async () => {
        const numero = await loyerService.genererNumeroLoyer(idClient);
        logger.debug('✅ Numéro généré:', numero);
        return numero;
      },
      (numero) => {
        logger.info(`✅ Numéro généré: ${numero}`);
      },
      (error) => {
        logger.error('❌ Erreur lors de la génération du numéro:', error);
        throw error;
      }
    );
  };

  /**
   * ✅ NOUVEAU : Génère le PDF de confirmation de paiement de loyer
   * @param {number} idLoyer - ID du loyer
   * @returns {Promise<{ success: boolean, pdfUrl: string, message: string }>}
   */
  const genererConfirmationPDF = async (idLoyer) => {
    if (!idLoyer) {
      const error = new Error('ID loyer requis pour générer la confirmation PDF');
      logger.error('❌', error.message);
      throw error;
    }

    logger.info(`📄 Génération confirmation PDF pour loyer #${idLoyer}`);

    return executeApi(
      async () => {
        const result = await loyerService.genererConfirmationPDF(idLoyer);
        logger.debug('✅ Résultat génération confirmation:', result);
        return result;
      },
      (result) => {
        logger.info(`✅ Confirmation PDF générée pour loyer #${idLoyer}:`, result?.pdfUrl);
      },
      (error) => {
        logger.error(`❌ Erreur lors de la génération de la confirmation PDF pour loyer #${idLoyer}:`, error);
        throw error;
      }
    );
  };

  return {
    // Méthodes
    chargerLoyers,
    getLoyer,
    invalidateLoyer,
    createLoyer,
    updateLoyer,
    deleteLoyer,
    lierFacture,
    genererNumeroLoyer,
    genererConfirmationPDF,

    // États
    isLoading,
    error
  };
}

export default useLoyerActions;