// src/components/locationSalle/hooks/useLocationSalleActions.js
// Hook pour gérer les actions sur les locations de salle.
// ✅ Architecture maître / détail :
//      Contrats → ajouter/retirer un client du tableau (persisté en DB)
//      Détails  → CRUD des saisies mensuelles de location
// ✅ Actions API pures, pas de state UI (pattern useLoyerActions)
// ✅ Données reçues en camelCase (conversion automatique via api.js + fieldMappings)

import { useApiCall } from '../../../hooks/useApiCall';
import LocationSalleService from '../../../services/LocationSalleService';
import { createLogger } from '../../../utils/createLogger';

const logger = createLogger('useLocationSalleActions');

export function useLocationSalleActions() {
    const { execute: executeApi, isLoading, error } = useApiCall();

    // ── Paramètres ────────────────────────────────────────────────────────────

    /**
     * Récupère les salles disponibles (depuis la table paramètres).
     * @returns {Promise<Array>}  [{ id, nom }, ...]
     */
    const getSalles = async () => {
        logger.info('🚀 Chargement salles disponibles');
        return executeApi(
            async () => {
                const salles = await LocationSalleService.getSalles();
                logger.debug(`✅ ${salles?.length ?? 0} salles chargées`);
                return salles ?? [];
            },
            null,
            (err) => { logger.error('❌ Erreur getSalles:', err); throw err; }
        );
    };

    // ── Contrats ──────────────────────────────────────────────────────────────

    /**
     * Charge les contrats (clients affichés) pour une année.
     * Retourne des objets camelCase : { id, idClient, annee, nomClient }
     * @param {number} annee
     * @returns {Promise<Array>}
     */
    const chargerContrats = async (annee) => {
        logger.info(`🚀 Chargement contrats ${annee}`);
        return executeApi(
            async () => {
                const liste = await LocationSalleService.listerContrats(annee);
                logger.debug(`✅ ${liste?.length ?? 0} contrats chargés`);
                return liste ?? [];
            },
            null,
            (err) => { logger.error('❌ Erreur chargerContrats:', err); throw err; }
        );
    };

    /**
     * Ajoute un client au tableau de l'année (crée le contrat en DB).
     * @param {number} idClient
     * @param {number} annee
     * @returns {Promise<{ success: boolean, id: number, created: boolean, message: string }>}
     */
    const creerContrat = async (idClient, annee) => {
        logger.info(`➕ Ajout client #${idClient} au tableau ${annee}`);
        return executeApi(
            async () => {
                const result = await LocationSalleService.creerContrat(idClient, annee);
                logger.debug('✅ Contrat créé:', result);
                return result;
            },
            (result) => { logger.info(`✅ Contrat créé - ID: ${result?.id}`); },
            (err) => { logger.error('❌ Erreur creerContrat:', err); throw err; }
        );
    };

    /**
     * Retire un client du tableau (supprime le contrat et tous ses détails en cascade).
     * @param {number} idContrat
     * @returns {Promise<{ success: boolean, message: string }>}
     */
    const supprimerContrat = async (idContrat) => {
        if (!idContrat) throw new Error('idContrat requis pour la suppression');
        logger.info(`🗑️ Suppression contrat #${idContrat}`);
        return executeApi(
            async () => {
                const result = await LocationSalleService.supprimerContrat(idContrat);
                logger.debug('✅ Contrat supprimé:', result);
                return result;
            },
            () => { logger.info(`✅ Contrat #${idContrat} supprimé`); },
            (err) => { logger.error(`❌ Erreur supprimerContrat #${idContrat}:`, err); throw err; }
        );
    };

    // ── Détails ───────────────────────────────────────────────────────────────

    /**
     * Charge tous les détails de location pour une année.
     * Retourne des objets camelCase : { id, idContrat, idClient, mois, salle, idUnite, idService, motif, quantite, note }
     * @param {number} annee
     * @returns {Promise<Array>}
     */
    const chargerDetails = async (annee) => {
        logger.info(`🚀 Chargement détails ${annee}`);
        return executeApi(
            async () => {
                const liste = await LocationSalleService.listerDetails(annee);
                logger.debug(`✅ ${liste?.length ?? 0} détails chargés`);
                return liste ?? [];
            },
            null,
            (err) => { logger.error('❌ Erreur chargerDetails:', err); throw err; }
        );
    };

    /**
     * Récupère les détails directement sans passer par executeApi.
     * ✅ N'appelle PAS setIsLoading → pas de re-render React.
     * Utilisé pendant la navigation modale pour rafraîchir tousDetailsMut
     * sans interrompre la boucle async while.
     */
    const fetchDetails = async (annee) => {
        const liste = await LocationSalleService.listerDetails(annee);
        return liste ?? [];
    };

    /**
     * Crée un détail de location (crée aussi le contrat parent si nécessaire).
     * @param {Object} data  camelCase : { idClient, idContrat, annee, mois, salle, idUnite, idService, motif, quantite, note? }
     * @returns {Promise<{ success: boolean, id: number, message: string }>}
     */
    const creerDetail = async (data) => {
        logger.info('➕ Création détail', { client: data.idClient, mois: data.mois, salle: data.salle });
        return executeApi(
            async () => {
                const result = await LocationSalleService.creerDetail(data);
                logger.debug('✅ Détail créé:', result);
                return result;
            },
            (result) => { logger.info(`✅ Détail créé - ID: ${result?.id}`); },
            (err) => { logger.error('❌ Erreur creerDetail:', err); throw err; }
        );
    };

    /**
     * Modifie un détail de location.
     * @param {number} id
     * @param {Object} data  camelCase : { mois, salle, idUnite, idService, motif, quantite, note?, idContrat }
     * @returns {Promise<Object>}
     */
    const modifierDetail = async (id, data) => {
        if (!id) throw new Error('ID requis pour la modification');
        logger.info(`✏️ Modification détail #${id}`);
        return executeApi(
            async () => {
                const result = await LocationSalleService.modifierDetail(id, data);
                logger.debug('✅ Détail modifié:', result);
                return result;
            },
            () => { logger.info(`✅ Détail #${id} modifié`); },
            (err) => { logger.error(`❌ Erreur modifierDetail #${id}:`, err); throw err; }
        );
    };

    /**
     * Supprime un détail de location.
     * @param {number} id
     * @returns {Promise<Object>}
     */
    const supprimerDetail = async (id) => {
        if (!id) throw new Error('ID requis pour la suppression');
        logger.info(`🗑️ Suppression détail #${id}`);
        return executeApi(
            async () => {
                const result = await LocationSalleService.supprimerDetail(id);
                logger.debug('✅ Détail supprimé:', result);
                return result;
            },
            () => { logger.info(`✅ Détail #${id} supprimé`); },
            (err) => { logger.error(`❌ Erreur supprimerDetail #${id}:`, err); throw err; }
        );
    };

    return {
        // Paramètres
        getSalles,
        // Contrats
        chargerContrats,
        creerContrat,
        supprimerContrat,
        // Détails
        chargerDetails,
        fetchDetails,
        creerDetail,
        modifierDetail,
        supprimerDetail,
        // État
        isLoading,
        error,
    };
}

export default useLocationSalleActions;