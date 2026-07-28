// src/services/TypeContratLocationService.js
import api from './api';
import { createLogger } from '../utils/createLogger';

const log = createLogger('TypeContratLocationService');

class TypeContratLocationService {

    async lister() {
        try {
            const response = await api.get('type-contrat-location-api.php');
            log.debug(`✅ ${response?.types?.length ?? 0} types chargés`);
            return response?.types ?? [];
        } catch (error) {
            log.error('Erreur lister:', error);
            return [];
        }
    }

    async modifier(id, data) {
        try {
            const response = await api.put(`type-contrat-location-api.php?id=${id}`, data);
            if (response?.success === false) {
                throw new Error(response.message || 'Erreur lors de la modification');
            }
            return response;
        } catch (error) {
            log.error('Erreur modifier:', error);
            throw error;
        }
    }
}

export default new TypeContratLocationService();