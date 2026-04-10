/**
 * LocationSalleService.js
 *
 * Service frontend pour la gestion des locations de salle.
 * ✅ Architecture maître / détail :
 *      Contrats → clients affichés dans le tableau (persisté en DB)
 *      Détails  → saisies mensuelles de location
 * ✅ Données envoyées en camelCase → converties en snake_case automatiquement par api.js
 * ✅ Données reçues converties en camelCase automatiquement par api.js
 */
import api from './api';
import { createLogger } from '../utils/createLogger';

const log = createLogger('LocationSalleService');

class LocationSalleService {

    // ── Paramètres ────────────────────────────────────────────────────────────

    /**
     * Récupère la liste des salles disponibles (table salle).
     * @returns {Promise<Array>}  [{ id, nom, idService, nomService, typeClientRequis, typeDocument }, ...]
     */
    async getSalles() {
        try {
            const response = await api.get('salle-api.php');
            return response?.salles ?? [];
        } catch (error) {
            log.error('Erreur getSalles:', error);
            return [
                { id: null, nom: 'Cabinet', idService: null, typeClientRequis: 'therapeute', typeDocument: 'facture' },
                { id: null, nom: 'Salle',   idService: null, typeClientRequis: null,          typeDocument: 'facture' },
            ];
        }
    }

    // ── Contrats (clients affichés dans le tableau) ───────────────────────────

    /**
     * Liste les contrats d'une année — résultat en camelCase.
     * @param {number} annee
     * @returns {Promise<Array>}  [{ id, idClient, annee, nomClient }, ...]
     */
    async listerContrats(annee) {
        try {
            const response = await api.get('location-salle-api.php', { action: 'contrats', annee });
            return response?.contrats ?? [];
        } catch (error) {
            log.error('Erreur listerContrats:', error);
            throw error;
        }
    }

    /**
     * Ajoute un client au tableau pour une année (crée le contrat en DB).
     * Idempotent : sans erreur si le contrat existe déjà.
     * @param {number} idClient
     * @param {number} annee
     * @returns {Promise<{ success: boolean, id: number, created: boolean, message: string }>}
     */
    async creerContrat(idClient, annee) {
        try {
            // Envoi en camelCase : api.js convertit vers snake_case automatiquement
            const response = await api.post('location-salle-api.php?action=contrat', {
                idClient,
                annee,
            });
            return response;
        } catch (error) {
            log.error('Erreur creerContrat:', error);
            throw error;
        }
    }

    /**
     * Retire un client du tableau (supprime le contrat et tous ses détails en cascade).
     * @param {number} idContrat
     * @returns {Promise<{ success: boolean, message: string }>}
     */
    async supprimerContrat(idContrat) {
        try {
            const response = await api.delete(
                `location-salle-api.php?action=contrat&id_contrat=${idContrat}`
            );
            return response;
        } catch (error) {
            log.error('Erreur supprimerContrat:', error);
            throw error;
        }
    }

    // ── Détails (saisies mensuelles) ──────────────────────────────────────────

    /**
     * Liste tous les détails de location pour une année — résultat en camelCase.
     * @param {number} annee
     * @returns {Promise<Array>}  [{ id, idContrat, idClient, nomClient, annee, mois, salle, idUnite, idService, motif, quantite, note }, ...]
     */
    async listerDetails(annee) {
        try {
            const response = await api.get('location-salle-api.php', { annee });
            log.debug(`✅ ${response?.details?.length ?? 0} détails chargés pour ${annee}`);
            log.debug('Détails:', response?.details);
            log.debug('response:', response);
            return response?.details ?? [];
        } catch (error) {
            log.error('Erreur listerDetails:', error);
            throw error;
        }
    }

    /**
     * Crée un détail de location (le contrat parent est créé automatiquement côté PHP si absent).
     * @param {Object} data  camelCase : { idClient, idContrat, annee, mois, salle, idUnite, idService, motif, quantite, note? }
     * @returns {Promise<{ success: boolean, id: number, message: string }>}
     */
    async creerDetail(data) {
        try {
            // api.js convertit automatiquement camelCase → snake_case avant envoi
            const response = await api.post('location-salle-api.php', data);
            return response;
        } catch (error) {
            log.error('Erreur creerDetail:', error);
            throw error;
        }
    }

    /**
     * Modifie un détail de location.
     * @param {number} id
     * @param {Object} data  camelCase : { mois, salle, idUnite, idService, motif, quantite, note?, idContrat }
     * @returns {Promise<{ success: boolean, message: string }>}
     */
    async modifierDetail(id, data) {
        try {
            // api.js convertit automatiquement camelCase → snake_case avant envoi
            const response = await api.put(`location-salle-api.php?id=${id}`, data);
            return response;
        } catch (error) {
            log.error('Erreur modifierDetail:', error);
            throw error;
        }
    }

    /**
     * Supprime un détail de location.
     * @param {number} id
     * @returns {Promise<{ success: boolean, message: string }>}
     */
    async supprimerDetail(id) {
        try {
            const response = await api.delete(`location-salle-api.php?id=${id}`);
            return response;
        } catch (error) {
            log.error('Erreur supprimerDetail:', error);
            throw error;
        }
    }
}

export default new LocationSalleService();