// src/services/MotifLocationService.js
import api from './api';
import { createLogger } from '../utils/createLogger';

const log = createLogger('MotifLocationService');

class MotifLocationService {

    async listerParTypeContrat(idTypeContrat, actifSeulement = true) {
        try {
            const url = `motif-location-api.php?id_type_contrat=${encodeURIComponent(idTypeContrat)}${!actifSeulement ? '&tous=1' : ''}`;
            const response = await api.get(url);
            log.debug('listerParTypeContrat response:', JSON.stringify(response));
            const motifs = response?.motifs ?? [];
            return Array.isArray(motifs) ? motifs : Object.values(motifs).flat();
        } catch (error) {
            log.error('Erreur listerParTypeContrat:', error);
            return [];
        }
    }

    async listerTous(actifSeulement = true) {
        try {
            const url = `motif-location-api.php${!actifSeulement ? '?tous=1' : ''}`;
            const response = await api.get(url);
            return response?.motifs ?? {};
        } catch (error) {
            log.error('Erreur listerTous:', error);
            return {};
        }
    }

    async creer(data) {
        try {
            const response = await api.post('motif-location-api.php', data);
            if (response?.success === false) {
                throw new Error(response.message || 'Erreur création motif');
            }
            return response;
        } catch (error) {
            log.error('Erreur creer:', error);
            throw error;
        }
    }

    async modifier(id, data) {
        try {
            const response = await api.put(`motif-location-api.php?id=${id}`, data);
            if (response?.success === false) {
                throw new Error(response.message || 'Erreur modification motif');
            }
            return response;
        } catch (error) {
            log.error('Erreur modifier:', error);
            throw error;
        }
    }

    async supprimer(id) {
        try {
            const response = await api.delete(`motif-location-api.php?id=${id}`);
            if (response?.success === false) {
                throw new Error(response.message || 'Erreur suppression motif');
            }
            return response;
        } catch (error) {
            log.error('Erreur supprimer:', error);
            throw error;
        }
    }
}

export default new MotifLocationService();