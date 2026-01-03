// src/components/factures/hooks/useFactureFormActions.js
// VERSION REFACTORISEE - Orchestre les différents hooks d'actions
// Gère l'enrichissement des données de facture avec tarification
// Utilise useFactureActions, useClientActions, useTarifActions

import { useCallback, useMemo } from 'react';
import { createLogger } from '../../../utils/createLogger';
import { useFactureActions } from './useFactureActions';
import { useClientActions } from '../../clients/hooks/useClientActions';
import { useTarifActions } from '../../tarifs/hooks/useTarifActions';
import TarificationService from '../../../services/TarificationService';

/**
 * Hook d'orchestration pour les actions du formulaire de facture
 * Orchestre useFactureActions, useClientActions, useTarifActions
 * Gère l'enrichissement des données
 * Fournit des fonctions avec gestion des setters pour le formulaire
 * 
 * @returns {Object} Actions orchestrées pour le formulaire de facture
 */
export const useFactureFormActions = () => {
  const log = createLogger('useFactureFormActions');

  // Créer TarificationService en interne pour useTarifActions
  const tarificationService = useMemo(() => new TarificationService(), []);

  // Utilisation des hooks d'actions spécialisés
  const factureActions = useFactureActions();
  const clientActions = useClientActions();
  const tarifActions = useTarifActions(tarificationService);

  /**
   * Charge une facture par son ID avec enrichissement complet
   * @param {number} id - ID de la facture
   * @param {Object} setters - Fonctions de mise à jour d'état
   * @returns {Promise<Object>} Facture chargée et enrichie
   */
  const chargerFacture = useCallback(async (id, setters) => {
    const { 
      setIsLoading = () => {}, 
      setError = () => {}, 
      setFacture = () => {}, 
      setIsLignesValid = () => {}, 
      fetchClientDetails 
    } = setters || {};

    try {
      setIsLoading(true);
      setError(null);

      log.debug('Chargement facture:', id);
      
      // Charger la facture brute via useFactureActions
      const factureData = await factureActions.chargerFacture(id);

      if (!factureData) {
        throw new Error('Aucune donnée de facture trouvée');
      }

      // Enrichir les lignes avec les données de tarification via useTarifActions
      let lignesEnrichies = [];
      if (factureData.lignes && Array.isArray(factureData.lignes)) {
        try {
          const servicesData = await tarifActions.charger('service');
          const unitesData = await tarifActions.charger('unite');

          const services_list = Array.isArray(servicesData) ? servicesData : [];
          const unites_list = Array.isArray(unitesData) ? unitesData : [];

          log.debug('Services chargés:', services_list.length);
          log.debug('Unités chargées:', unites_list.length);

          lignesEnrichies = factureData.lignes.map(ligne => {
            const service = services_list.find(s => s.idService === ligne.idService);
            const unite = unites_list.find(u => u.idUnite === ligne.idUnite);

            return {
              ...ligne,
              service: service || ligne.service,
              unite: unite || ligne.unite
            };
          });

          log.debug('Lignes enrichies:', lignesEnrichies.length);
        } catch (enrichError) {
          log.warn('Erreur enrichissement lignes:', enrichError);
          lignesEnrichies = factureData.lignes;
        }
      } else {
        lignesEnrichies = factureData.lignes || [];
      }

      // Construction de la facture finale enrichie
      const ristourne = factureData.ristourne || 0;
      const totalNet = factureData.totalAvecRistourne || 0;
      const totalBrut = totalNet + ristourne;

      const factureFinale = {
        idFacture: factureData.idFacture,
        numeroFacture: factureData.numeroFacture,
        dateFacture: factureData.dateFacture,
        idClient: factureData.idClient,
        montantTotal: factureData.montantTotal,
        montantFacture: factureData.montantTotal,
        montantBrut: factureData.montantBrut,
        ristourne: ristourne,
        montantPayeTotal: factureData.montantPayeTotal,
        montantRestantDu: factureData.montantRestant,
        nbPaiements: factureData.nbPaiements,
        totalAvecRistourne: totalNet,
        totalBrut: totalBrut,
        lignes: lignesEnrichies,
        etat: factureData.etat,
        etatAffichage: factureData.etatAffichage,
        dateEcheance: factureData.dateEcheance,
        datePaiement: factureData.datePaiement || null,
        estImprimee: factureData.estImprimee || false,
        estEnvoyee: factureData.estEnvoyee || false,
        estAnnulee: factureData.estAnnulee || false,
        estPayee: factureData.estPayee || false,
        client: factureData.client || null,
        documentPath: factureData.documentPath || null,
        factfilename: factureData.factfilename || null
      };

      log.debug('Facture chargée et enrichie:', {
        idFacture: factureFinale.idFacture,
        numeroFacture: factureFinale.numeroFacture,
        lignesCount: factureFinale.lignes?.length,
        documentPath: factureFinale.documentPath
      });

      setFacture(factureFinale);
      setIsLignesValid(true);

      // Charger détails client si nécessaire
      if (fetchClientDetails && factureFinale.idClient) {
        fetchClientDetails(factureFinale.idClient);
      }

      setIsLoading(false);
      return factureFinale;

    } catch (error) {
      log.error('Erreur chargement facture:', error);
      setError('Erreur lors du chargement de la facture: ' + error.message);
      setIsLoading(false);
      return null;
    }
  }, [factureActions, tarifActions, log]);

  /**
   * Récupère les détails d'un client via useClientActions
   * @param {number} idClient - ID du client
   * @param {Object} setters - Fonctions de mise à jour d'état
   * @returns {Promise<Object>} Client chargé
   */
  const fetchClientDetails = useCallback(async (idClient, setters) => {
    const { setClientLoading, setClientData } = setters || {};

    if (!idClient) {
      log.debug('Pas d\'ID client fourni');
      if (setClientData) setClientData(null);
      return null;
    }

    try {
      if (setClientLoading) setClientLoading(true);

      log.debug('Chargement client:', idClient);
      const client = await clientActions.getClient(idClient);

      if (client) {
        log.debug('Client chargé:', client.nom, client.prenom);
        if (setClientData) setClientData(client);
      }

      if (setClientLoading) setClientLoading(false);
      return client;

    } catch (error) {
      log.error('Erreur chargement client:', error);
      if (setClientLoading) setClientLoading(false);
      return null;
    }
  }, [clientActions, log]);

  /**
   * Récupère le prochain numéro de facture via useFactureActions
   * @param {number} annee - Année pour le numéro
   * @param {Object} setters - Fonctions de mise à jour d'état
   * @returns {Promise<string>} Prochain numéro de facture
   */
  const fetchProchainNumeroFacture = useCallback(async (annee, setters) => {
    const { setFacture } = setters || {};

    try {
      log.debug('Récupération prochain numéro facture pour année:', annee);
      const numero = await factureActions.getProchainNumeroFacture(annee);

      if (numero && setFacture) {
        setFacture(prev => ({ ...prev, numeroFacture: numero }));
      }

      log.debug('Prochain numéro:', numero);
      return numero;

    } catch (error) {
      log.error('Erreur récupération numéro:', error);
      return null;
    }
  }, [factureActions, log]);

  /**
   * Charge la liste des clients via useClientActions
   * @returns {Promise<Array>} Liste des clients
   */
  const chargerClients = useCallback(async () => {
    try {
      log.debug('Chargement liste clients');
      const clients = await clientActions.chargerClients();
      log.debug('Clients chargés:', clients?.length);
      return clients || [];
    } catch (error) {
      log.error('Erreur chargement clients:', error);
      return [];
    }
  }, [clientActions, log]);

  /**
   * Sauvegarde une facture (création ou modification)
   * @param {Object} factureData - Données de la facture
   * @param {boolean} isModification - True si modification
   * @param {Object} setters - Fonctions de mise à jour d'état
   * @returns {Promise<Object>} Résultat de la sauvegarde
   */
  const sauvegarderFacture = useCallback(async (factureData, isModification, setters) => {
    const { setIsSubmitting, setError } = setters || {};

    try {
      if (setIsSubmitting) setIsSubmitting(true);
      if (setError) setError(null);

      log.debug('Sauvegarde facture:', { isModification, idFacture: factureData.idFacture });

      let result;
      if (isModification) {
        result = await factureActions.modifierFacture(factureData.idFacture, factureData);
      } else {
        result = await factureActions.creerFacture(factureData);
      }

      log.debug('Résultat sauvegarde:', result);

      if (setIsSubmitting) setIsSubmitting(false);
      return result;

    } catch (error) {
      log.error('Erreur sauvegarde facture:', error);
      if (setError) setError('Erreur lors de la sauvegarde: ' + error.message);
      if (setIsSubmitting) setIsSubmitting(false);
      throw error;
    }
  }, [factureActions, log]);

  /**
   * Calcule un tarif pour une ligne de facture
   * @param {Object} params - Paramètres du calcul
   * @returns {Promise<Object>} Résultat du calcul
   */
  const calculerTarif = useCallback(async (params) => {
    try {
      log.debug('Calcul tarif:', params);
      const result = await tarifActions.calculer(params);
      return result;
    } catch (error) {
      log.error('Erreur calcul tarif:', error);
      throw error;
    }
  }, [tarifActions, log]);

  /**
   * Charge les données de tarification (services, unités, etc.)
   * @param {string} type - Type de données à charger
   * @returns {Promise<Array>} Données chargées
   */
  const chargerDonneesTarification = useCallback(async (type) => {
    try {
      log.debug('Chargement données tarification:', type);
      const data = await tarifActions.charger(type);
      return data || [];
    } catch (error) {
      log.error('Erreur chargement tarification:', error);
      return [];
    }
  }, [tarifActions, log]);

  /**
   * Annule une facture
   * @param {number} idFacture - ID de la facture
   * @param {string} motif - Motif d'annulation
   * @returns {Promise<Object>} Résultat
   */
  const annulerFacture = useCallback(async (idFacture, motif) => {
    try {
      log.debug('Annulation facture:', idFacture, motif);
      const result = await factureActions.annulerFacture(idFacture, motif);
      return result;
    } catch (error) {
      log.error('Erreur annulation facture:', error);
      throw error;
    }
  }, [factureActions, log]);

  /**
   * Supprime une facture
   * @param {number} idFacture - ID de la facture
   * @returns {Promise<Object>} Résultat
   */
  const supprimerFacture = useCallback(async (idFacture) => {
    try {
      log.debug('Suppression facture:', idFacture);
      const result = await factureActions.supprimerFacture(idFacture);
      return result;
    } catch (error) {
      log.error('Erreur suppression facture:', error);
      throw error;
    }
  }, [factureActions, log]);

  return {
    // Actions principales
    chargerFacture,
    fetchClientDetails,
    fetchProchainNumeroFacture,
    chargerClients,
    sauvegarderFacture,
    
    // Actions tarification
    calculerTarif,
    chargerDonneesTarification,
    
    // Actions facture
    annulerFacture,
    supprimerFacture,
    
    // Accès direct aux hooks sous-jacents si nécessaire
    factureActions,
    clientActions,
    tarifActions
  };
};

export default useFactureFormActions;