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
     * Retourne les types de contrat disponibles.
     * @returns {Promise<Array>} [{ id, nom, typeDocument, typeClientRequis }]
     */
    async getTypesContrat() {
        try {
            const response = await api.get('location-salle-api.php', { action: 'types_contrat' });
            return response?.typesContrat ?? [];
        } catch (error) {
            log.error('Erreur getTypesContrat:', error);
            return [];
        }
    }

    /**
     * Crée un contrat de location pour un client/année/salle/type.
     * @param {number} idClient
     * @param {number} annee
     * @param {number} idSalle
     * @param {number} idTypeContrat
     */
    async creerContrat(idClient, annee, idSalle, idTypeContrat) {
        try {
            const response = await api.post('location-salle-api.php?action=contrat', {
                idClient,
                annee,
                idSalle,
                idTypeContrat,
            });
            if (response?.success === false) {
                throw new Error(response.message || "Erreur lors de la création du contrat");
            }
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
            const response = await api.post('location-salle-api.php', data);
            if (response?.success === false) {
                throw new Error(response.message || 'Erreur lors de la création de la location');
            }
            return response;
        } catch (error) {
            log.error('Erreur creerDetail:', error);
            throw error;
        }
    }

    async modifierDetail(id, data) {
        try {
            const response = await api.put(`location-salle-api.php?id=${id}`, data);
            if (response?.success === false) {
                throw new Error(response.message || 'Erreur lors de la modification de la location');
            }
            return response;
        } catch (error) {
            log.error('Erreur modifierDetail:', error);
            throw error;
        }
    }

    async supprimerDetail(id) {
        try {
            const response = await api.delete(`location-salle-api.php?id=${id}`);
            if (response?.success === false) {
                throw new Error(response.message || 'Erreur lors de la suppression de la location');
            }
            return response;
        } catch (error) {
            log.error('Erreur supprimerDetail:', error);
            throw error;
        }
    }
}

export default new LocationSalleService();