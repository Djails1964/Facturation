// src/components/paiements/hooks/usePaiementsData.js
// ✅ VERSION REFACTORISÉE - Utilise usePaiementActions au lieu de PaiementService

import { useState, useEffect, useCallback, useMemo } from 'react';
import { usePaiementActions } from './usePaiementActions'; // ✅ CHANGÉ
import { createLogger } from '../../../utils/createLogger';

/**
 * Hook personnalisé pour gérer les données des paiements
 * 
 * Responsabilités :
 * - Charge les paiements depuis l'API (filtrage par année côté serveur)
 * - Applique les filtres supplémentaires côté client (statut, méthode, client, mois)
 * - Gère l'état de chargement et les erreurs
 * - Maintient la sélection du paiement actif
 * 
 * ✅ REFACTORISÉ : Utilise usePaiementActions au lieu de PaiementService direct
 * 
 * @param {Object} filtres - Filtres à appliquer (annee, mois, methode, idClient, statut)
 * @param {number|null} nouveauPaiementId - ID d'un paiement nouvellement créé à sélectionner
 * @returns {Object} État des paiements et fonctions de gestion
 */
export function usePaiementsData(filtres, nouveauPaiementId) {

    const log = createLogger('usePaiementsData');
    // ============================================
    // ÉTAT LOCAL
    // ============================================
    
    // Liste complète des paiements chargés depuis l'API (filtrés par année uniquement)
    const [paiements, setPaiements] = useState([]);
    
    // Indicateur de chargement en cours
    const [isLoading, setIsLoading] = useState(true);
    
    // Message d'erreur éventuel
    const [error, setError] = useState(null);
    
    // Informations de pagination retournées par l'API
    const [pagination, setPagination] = useState(null);
    
    // ID du paiement actuellement sélectionné dans l'interface
    const [paiementSelectionne, setPaiementSelectionne] = useState(null);
    
    // ✅ Utilisation de usePaiementActions
    const paiementActions = usePaiementActions();

    // ============================================
    // CHARGEMENT DES DONNÉES DEPUIS L'API
    // ============================================
    
    /**
     * Charge les paiements depuis l'API
     * Filtre uniquement par année côté serveur pour optimiser les performances
     * Les autres filtres (statut, méthode, etc.) sont appliqués côté client
     * 
     * ✅ REFACTORISÉ : Utilise paiementActions.chargerPaiements()
     */
    const chargerPaiements = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            // Préparer les options pour l'API
            // Seule l'année est envoyée au serveur pour limiter la quantité de données
            const options = {
                annee: filtres.annee || undefined,
                page: 1,
                limit: 50
            };
            
            // ✅ Appel à l'API via paiementActions
            const result = await paiementActions.chargerPaiements(options);
            
            // Mise à jour de l'état avec les données reçues
            setPaiements(result.paiements || []);
            setPagination(result.pagination);
            
        } catch (err) {
            log.error('Erreur lors du chargement des paiements:', err);
            setError('Erreur lors du chargement des paiements: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    }, [filtres.annee, paiementActions]); // ✅ AJOUTÉ paiementActions dans les dépendances

    // ============================================
    // FILTRAGE CÔTÉ CLIENT
    // ============================================
    
    /**
     * Applique les filtres côté client sur les paiements chargés
     * Permet un filtrage instantané sans appeler l'API à chaque changement
     * 
     * Filtres appliqués :
     * - statut : état du paiement (confirmé, annulé)
     * - methode : moyen de paiement (espèces, carte, virement, etc.)
     * - idClient : ID du client
     * - mois : mois de la date de paiement
     */
    const filteredPaiements = useMemo(() => {
        return paiements.filter(paiement => {
            // Filtre par statut (ex: "confirmé", "annulé")
            if (filtres.statut && paiement.statut !== filtres.statut) {
                return false;
            }
            
            // Filtre par méthode de paiement (ex: "especes", "carte", "virement")
            if (filtres.methode && paiement.methodePaiement !== filtres.methode) {
                return false;
            }
            
            // Filtre par client
            if (filtres.idClient && paiement.idClient !== parseInt(filtres.idClient)) {
                return false;
            }
            
            // Filtre par mois (extraire le mois de la date de paiement)
            if (filtres.mois) {
                const moisPaiement = new Date(paiement.datePaiement).getMonth() + 1;
                if (moisPaiement !== parseInt(filtres.mois)) {
                    return false;
                }
            }
            
            // Le paiement passe tous les filtres
            return true;
        });
    }, [paiements, filtres]); // Recalculer si les paiements ou les filtres changent

    // ============================================
    // EFFETS DE BORD
    // ============================================
    
    /**
     * Recharger les paiements quand la fonction chargerPaiements change
     * (c'est-à-dire quand l'année change)
     */
    useEffect(() => {
        chargerPaiements();
    }, [chargerPaiements]);

    /**
     * Sélectionner automatiquement un paiement nouvellement créé
     * Utilisé après la création d'un nouveau paiement pour le mettre en évidence
     */
    useEffect(() => {
        if (nouveauPaiementId) {
            setPaiementSelectionne(nouveauPaiementId);
        }
    }, [nouveauPaiementId]);

    // ============================================
    // RETOUR DES DONNÉES ET FONCTIONS
    // ============================================
    
    return {
        paiements,              // Tous les paiements chargés (filtrés par année uniquement)
        filteredPaiements,      // Paiements après application de tous les filtres
        isLoading,              // Indicateur de chargement
        error,                  // Message d'erreur éventuel
        pagination,             // Informations de pagination
        paiementSelectionne,    // ID du paiement sélectionné
        setPaiementSelectionne, // Fonction pour changer la sélection
        chargerPaiements        // Fonction pour recharger manuellement les données
    };
}