// src/components/clients/hooks/useClientActions.js
// ✅ Hook centralisé pour toutes les actions clients avec useApiCall et createLogger
// ✅ REFACTORISÉ: Suppression des méthodes de validation (isValidEmail, detectPhoneType)
//    Ces méthodes sont maintenant dans clientValidators.js

import { useCallback, useMemo } from 'react';
import { useApiCall } from '../../../hooks/useApiCall';
import ClientService from '../../../services/ClientService';
import { createLogger } from '../../../utils/createLogger';
import { toBoolean, toBooleanInt, normalizeBooleanFields } from '../../../utils/booleanHelper';

/**
 * Hook centralisé pour toutes les actions liées aux clients
 * Utilise useApiCall pour la gestion des erreurs de session
 * Intègre createLogger pour un logging structuré
 * 
 * ⚠️ NOTE: Pour la validation (email, téléphone), utiliser:
 *    - clientValidators.js (fonctions pures)
 *    - useClientValidation.js (hook React)
 */
export function useClientActions() {
  // ✅ Initialisation du logger
  const logger = createLogger('useClientActions');

  // ✅ Service client avec mémorisation
  const clientService = useMemo(() => {
    logger.debug('📦 Création de l\'instance ClientService');
    return new ClientService();
  }, []);

  // ✅ Hook useApiCall pour la gestion automatique des sessions
  const { execute: executeApi, isLoading, error } = useApiCall();

  // ========================================
  // ACTIONS CRUD CLIENTS
  // ========================================

  /**
   * Charge tous les clients
   * @returns {Promise<Array>} Liste des clients normalisés
   */
  const chargerClients = useCallback(async () => {
    logger.info('🚀 Chargement de tous les clients');
    
    return executeApi(
      async () => {
        const clients = await clientService.chargerClients();
        logger.debug(`✅ ${clients.length} clients chargés`);
        logger.debug('📊 Clients chargés:', clients);
        return clients;
      },
      (result) => {
        logger.info(`✅ Succès: ${result?.length || 0} clients chargés`);
      },
      (error) => {
        logger.error('❌ Erreur lors du chargement des clients:', error);
        throw error;
      }
    );
  }, [clientService, executeApi]);

  /**
   * Récupère un client par son ID
   * @param {number|string} idClient - ID du client
   * @returns {Promise<Object>} Client normalisé
   */
  const getClient = useCallback(async (idClient) => {
    if (!idClient) {
      logger.warn('⚠️ getClient appelé sans ID');
      return null;
    }

    logger.info(`📥 Récupération du client #${idClient}`);

    return executeApi(
      async () => {
        const result = await clientService.getClient(idClient);
        logger.debug('✅ Client récupéré:', result);
        return result;
      },
      (result) => {
        logger.info(`✅ Client #${idClient} récupéré avec succès`);
      },
      (error) => {
        logger.error(`❌ Erreur lors de la récupération du client #${idClient}:`, error);
        throw error;
      }
    );
  }, [clientService, executeApi]);

  /**
   * Crée un nouveau client
   * @param {Object} clientData - Données du client
   * @returns {Promise<Object>} Résultat de la création
   */
  const createClient = useCallback(async (clientData) => {
    logger.info('➕ Création d\'un nouveau client', {
      nom: clientData.nom,
      prenom: clientData.prenom
    });

    return executeApi(
      async () => {
        // Normalisation des booléens avant envoi
        const normalizedData = {
          ...clientData,
          estTherapeute: toBooleanInt(clientData.estTherapeute)
        };
        
        logger.debug('📤 Données normalisées:', normalizedData);
        
        const result = await clientService.createClient(normalizedData);
        logger.debug('✅ Résultat création:', result);
        return result;
      },
      (result) => {
        logger.info(`✅ Client créé avec succès - ID: ${result?.idClient}`);
      },
      (error) => {
        logger.error('❌ Erreur lors de la création du client:', error);
        throw error;
      }
    );
  }, [clientService, executeApi]);

  /**
   * Met à jour un client existant
   * @param {number|string} idClient - ID du client
   * @param {Object} clientData - Nouvelles données
   * @returns {Promise<Object>} Résultat de la mise à jour
   */
  const updateClient = useCallback(async (idClient, clientData) => {
    if (!idClient) {
      const error = new Error('ID client requis pour la mise à jour');
      logger.error('❌', error.message);
      throw error;
    }

    logger.info(`✏️ Mise à jour du client #${idClient}`, {
      nom: clientData.nom,
      prenom: clientData.prenom
    });

    return executeApi(
      async () => {
        // Normalisation des booléens avant envoi
        const normalizedData = {
          ...clientData,
          estTherapeute: toBooleanInt(clientData.estTherapeute)
        };
        
        logger.debug('📤 Données normalisées pour mise à jour:', normalizedData);
        
        const result = await clientService.updateClient(idClient, normalizedData);
        logger.debug('✅ Résultat mise à jour:', result);
        return result;
      },
      (result) => {
        logger.info(`✅ Client #${idClient} mis à jour avec succès`);
      },
      (error) => {
        logger.error(`❌ Erreur lors de la mise à jour du client #${idClient}:`, error);
        throw error;
      }
    );
  }, [clientService, executeApi]);

  /**
   * Supprime un client
   * @param {number|string} idClient - ID du client à supprimer
   * @returns {Promise<Object>} Résultat de la suppression
   */
  const deleteClient = useCallback(async (idClient) => {
    if (!idClient) {
      const error = new Error('ID client requis pour la suppression');
      logger.error('❌', error.message);
      throw error;
    }

    logger.info(`🗑️ Suppression du client #${idClient}`);

    return executeApi(
      async () => {
        const result = await clientService.deleteClient(idClient);
        logger.debug('✅ Résultat suppression:', result);
        return result;
      },
      (result) => {
        logger.info(`✅ Client #${idClient} supprimé avec succès`);
      },
      (error) => {
        logger.error(`❌ Erreur lors de la suppression du client #${idClient}:`, error);
        throw error;
      }
    );
  }, [clientService, executeApi]);

  // ========================================
  // VÉRIFICATIONS
  // ========================================

  /**
   * Vérifie si un client peut être supprimé
   * @param {number|string} idClient - ID du client
   * @returns {Promise<Object>} Résultat de la vérification
   */
  const checkClientDeletable = useCallback(async (idClient) => {
    if (!idClient) {
      logger.warn('⚠️ checkClientDeletable appelé sans ID');
      return { success: false, aUneFacture: true };
    }

    logger.debug(`🔍 Vérification si client #${idClient} peut être supprimé`);

    return executeApi(
      async () => {
        const result = await clientService.checkClientDeletable(idClient);
        logger.debug('✅ Résultat vérification:', result);
        return result;
      },
      null,
      (error) => {
        logger.error(`❌ Erreur lors de la vérification du client #${idClient}:`, error);
        return { success: false, aUneFacture: true };
      }
    );
  }, [clientService, executeApi]);

  /**
   * Vérifie si un client a des factures
   * @param {number|string} idClient - ID du client
   * @returns {Promise<boolean>} True si le client a des factures
   */
  const clientHasInvoices = useCallback(async (idClient) => {
    logger.debug(`🔍 Vérification des factures du client #${idClient}`);

    return executeApi(
      async () => {
        const result = await clientService.checkClientDeletable(idClient);
        const hasInvoices = toBoolean(result.aUneFacture);
        logger.debug(`✅ Client #${idClient} ${hasInvoices ? 'a' : 'n\'a pas'} de factures`);
        return hasInvoices;
      },
      null,
      (error) => {
        logger.error(`❌ Erreur lors de la vérification des factures du client #${idClient}:`, error);
        return false;
      }
    );
  }, [clientService, executeApi]);

  // ========================================
  // ACTIONS UTILITAIRES
  // ========================================

  /**
   * Vérifie si un client est thérapeute
   * @param {Object|number} clientOrId - Client ou ID du client
   * @returns {Promise<boolean>} True si le client est thérapeute
   */
  const estTherapeute = useCallback(async (clientOrId) => {
    logger.debug('🔍 Vérification du statut thérapeute', { clientOrId });

    // Si c'est déjà un objet client
    if (clientOrId && typeof clientOrId === 'object' && 'estTherapeute' in clientOrId) {
      const result = toBoolean(clientOrId.estTherapeute);
      logger.debug(`✅ Statut thérapeute (depuis objet): ${result}`);
      return result;
    }

    // Si c'est un ID, charger le client
    if (clientOrId) {
      try {
        const client = await getClient(clientOrId);
        const result = client ? toBoolean(client.estTherapeute) : false;
        logger.debug(`✅ Statut thérapeute (depuis API): ${result}`);
        return result;
      } catch (error) {
        logger.error('❌ Erreur lors de la vérification du statut thérapeute:', error);
        return false;
      }
    }

    logger.debug('⚠️ Pas de client fourni, retour false par défaut');
    return false;
  }, [getClient]);

  /**
   * Recherche des clients par terme
   * @param {Array} clients - Liste des clients
   * @param {string} searchTerm - Terme de recherche
   * @returns {Array} Clients filtrés
   */
  const searchClients = useCallback((clients, searchTerm) => {
    if (!searchTerm || !searchTerm.trim()) {
      logger.debug('🔍 Recherche vide, retour de tous les clients');
      return clients;
    }

    const terme = searchTerm.toLowerCase().trim();
    logger.debug(`🔍 Recherche des clients avec le terme: "${terme}"`);

    const filtered = clients.filter(client => {
      const nomComplet = `${client.nom || ''} ${client.prenom || ''}`.toLowerCase();
      const email = (client.email || '').toLowerCase();
      const telephone = (client.telephone || '').toLowerCase();
      const adresse = (client.adresse || '').toLowerCase();
      const ville = (client.ville || '').toLowerCase();

      return nomComplet.includes(terme) ||
             email.includes(terme) ||
             telephone.includes(terme) ||
             adresse.includes(terme) ||
             ville.includes(terme);
    });

    logger.debug(`✅ ${filtered.length} clients trouvés sur ${clients.length}`);
    return filtered;
  }, []);

  /**
   * Normalise un client (booléens, formats)
   * @param {Object} client - Client à normaliser
   * @returns {Object} Client normalisé
   */
  const normalizeClient = useCallback((client) => {
    if (!client) return null;
    
    logger.debug('🔄 Normalisation du client:', client.id || 'nouveau');
    const normalized = normalizeBooleanFields(client, ['estTherapeute']);
    logger.debug('✅ Client normalisé:', normalized);
    return normalized;
  }, []);

  /**
   * Formate le nom complet d'un client
   * @param {Object} client - Client
   * @returns {string} Nom complet formaté
   */
  const formatNomComplet = useCallback((client) => {
    if (!client) return '';
    const nom = `${client.prenom || ''} ${client.nom || ''}`.trim();
    logger.debug(`📝 Nom formaté: "${nom}"`);
    return nom;
  }, []);

  /**
   * Nettoie le cache du service
   */
  const clearCache = useCallback(() => {
    logger.info('🧹 Nettoyage du cache ClientService');
    clientService._clearCache();
  }, [clientService]);

  // ========================================
  // RETOUR DU HOOK
  // ========================================

  return {
    // État de chargement
    isLoading,
    error,

    // Actions CRUD
    chargerClients,
    getClient,
    createClient,
    updateClient,
    deleteClient,

    // Vérifications
    checkClientDeletable,
    clientHasInvoices,

    // Utilitaires
    estTherapeute,
    searchClients,
    normalizeClient,
    formatNomComplet,
    clearCache,

    // ❌ SUPPRIMÉ: isValidEmail, detectPhoneType
    // ✅ Utiliser à la place:
    //    - import { validateEmail, validatePhone } from '../utils/clientValidators'
    //    - import { useClientValidation } from './useClientValidation'

    // Instance du service (si besoin direct)
    clientService
  };
}

export default useClientActions;