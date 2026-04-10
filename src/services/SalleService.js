// src/services/SalleService.js
// Service frontend pour la gestion des salles de location.
// Remplace les appels à LocationSalleService.getSalles() qui lisaient parametres.

import api from './api';
import { createLogger } from '../utils/createLogger';

const log = createLogger('SalleService');

class SalleService {

    /**
     * Retourne toutes les salles actives.
     * La conversion snake_case → camelCase est gérée automatiquement par api.js
     * (salle-api.php est dans autoConvert avec le contexte locationSalle).
     * @returns {Promise<Array>} [{ id, nom, idService, nomService, typeClientRequis, typeDocument, actif }]
     */
    async lister(actifSeulement = true) {
        try {
            const params = actifSeulement ? {} : { actif: '0' };
            const response = await api.get('salle-api.php', params);
            return response?.salles ?? [];
        } catch (error) {
            log.error('Erreur lister salles:', error);
            return [];
        }
    }

    /**
     * Retourne une salle par son id.
     * @param {number} id
     * @returns {Promise<Object|null>}
     */
    async getById(id) {
        try {
            const response = await api.get('salle-api.php', { id });
            return response?.salle ?? null;
        } catch (error) {
            log.error('Erreur getById salle:', error);
            return null;
        }
    }

    /**
     * Retourne le type_document pour un id_service donné.
     * @param {number} idService
     * @returns {Promise<'facture'|'confirmation'>}
     */
    async getTypeDocument(idService) {
        try {
            const response = await api.get('salle-api.php', {
                type_document: 1,
                id_service: idService,
            });
            return response?.typeDocument ?? response?.type_document ?? 'facture';
        } catch (error) {
            log.warn('Impossible de lire type_document, fallback facture:', error);
            return 'facture';
        }
    }

    /**
     * Crée une nouvelle salle.
     * Les données camelCase sont converties automatiquement en snake_case par api.js.
     * @param {{ nom, idService?, typeClientRequis?, typeDocument? }} data
     */
    async creer(data) {
        try {
            const response = await api.post('salle-api.php', data);
            return response;
        } catch (error) {
            log.error('Erreur creer salle:', error);
            throw error;
        }
    }

    /**
     * Modifie une salle.
     * @param {number} id
     * @param {{ nom, idService?, typeClientRequis?, typeDocument?, actif? }} data
     */
    async modifier(id, data) {
        try {
            const response = await api.put(`salle-api.php?id=${id}`, data);
            return response;
        } catch (error) {
            log.error('Erreur modifier salle:', error);
            throw error;
        }
    }

    /**
     * Supprime une salle (bloqué si des locations y font référence).
     * @param {number} id
     */
    async supprimer(id) {
        try {
            const response = await api.delete(`salle-api.php?id=${id}`);
            return response;
        } catch (error) {
            log.error('Erreur supprimer salle:', error);
            throw error;
        }
    }
}

export default new SalleService();