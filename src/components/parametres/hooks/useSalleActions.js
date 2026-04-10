// src/hooks/useSalleActions.js
// Hook pour gérer les actions sur les salles de location.
// Suit le même pattern que useLoyerActions / useLocationSalleActions.

import { useApiCall } from '../../../hooks/useApiCall';
import SalleService from '../../../services/SalleService';
import { createLogger } from '../../../utils/createLogger';

const logger = createLogger('useSalleActions');

export function useSalleActions() {
    const { execute: executeApi, isLoading, error } = useApiCall();

    /**
     * Retourne toutes les salles actives.
     * @returns {Promise<Array>} [{ id, nom, idService, nomService, typeClientRequis, typeDocument }]
     */
    const listerSalles = async () => {
        logger.info('🚀 Chargement des salles');
        return executeApi(
            async () => {
                const salles = await SalleService.lister();
                logger.debug(`✅ ${salles?.length ?? 0} salles chargées`);
                return salles;
            },
            null,
            (err) => {
                logger.error('❌ Erreur chargement salles:', err);
                throw err;
            }
        );
    };

    /**
     * Retourne une salle par son id.
     * @param {number} id
     * @returns {Promise<Object|null>}
     */
    const getSalle = async (id) => {
        logger.info(`📥 Récupération salle #${id}`);
        return executeApi(
            async () => {
                const salle = await SalleService.getById(id);
                logger.debug('✅ Salle récupérée:', salle);
                return salle;
            },
            null,
            (err) => {
                logger.error(`❌ Erreur récupération salle #${id}:`, err);
                throw err;
            }
        );
    };

    /**
     * Retourne le type_document pour un id_service donné.
     * Utilisé par LoyerGestion et LoyersListe.
     * @param {number} idService
     * @returns {Promise<'facture'|'confirmation'>}
     */
    const getTypeDocument = async (idService) => {
        logger.debug('🔍 type_document pour service:', idService);
        return executeApi(
            async () => {
                const typeDocument = await SalleService.getTypeDocument(idService);
                logger.debug('✅ type_document:', typeDocument);
                return typeDocument;
            },
            null,
            (err) => {
                logger.warn('⚠️ Erreur getTypeDocument, fallback facture:', err);
                return 'facture'; // valeur sûre — ne pas bloquer la génération
            }
        );
    };

    /**
     * Crée une nouvelle salle.
     * @param {{ nom, idService?, typeClientRequis?, typeDocument? }} data
     * @returns {Promise<Object>}
     */
    const creerSalle = async (data) => {
        logger.info('➕ Création salle:', data.nom);
        return executeApi(
            async () => {
                const result = await SalleService.creer(data);
                logger.debug('✅ Salle créée:', result);
                return result;
            },
            null,
            (err) => {
                logger.error('❌ Erreur création salle:', err);
                throw err;
            }
        );
    };

    /**
     * Modifie une salle.
     * @param {number} id
     * @param {{ nom, idService?, typeClientRequis?, typeDocument?, actif? }} data
     * @returns {Promise<Object>}
     */
    const modifierSalle = async (id, data) => {
        logger.info(`🔄 Modification salle #${id}`);
        return executeApi(
            async () => {
                const result = await SalleService.modifier(id, data);
                logger.debug('✅ Salle modifiée:', result);
                return result;
            },
            null,
            (err) => {
                logger.error(`❌ Erreur modification salle #${id}:`, err);
                throw err;
            }
        );
    };

    /**
     * Supprime une salle (bloqué si des locations y font référence).
     * @param {number} id
     * @returns {Promise<Object>}
     */
    const supprimerSalle = async (id) => {
        logger.info(`🗑️ Suppression salle #${id}`);
        return executeApi(
            async () => {
                const result = await SalleService.supprimer(id);
                logger.debug('✅ Salle supprimée:', result);
                return result;
            },
            null,
            (err) => {
                logger.error(`❌ Erreur suppression salle #${id}:`, err);
                throw err;
            }
        );
    };

    return {
        // État
        isLoading,
        error,

        // Actions
        listerSalles,
        getSalle,
        getTypeDocument,
        creerSalle,
        modifierSalle,
        supprimerSalle,
    };
}