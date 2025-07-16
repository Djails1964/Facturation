// src/components/factures/hooks/useFactures.js - VERSION CORRIGÉE

import { useState, useEffect, useCallback, useMemo } from 'react';
import FactureService from '../../../services/FactureService';

/**
 * Hook personnalisé pour gérer les factures
 * 
 * @param {number|string|null} nouvelleFactureId - ID d'une nouvelle facture à sélectionner
 * @param {boolean} factureModified - Indique si une facture a été modifiée
 * @param {Function|null} onResetFactureModified - Fonction pour réinitialiser l'indicateur de modification
 * @returns {Object} État et fonctions pour gérer les factures
 */
export const useFactures = (nouvelleFactureId, factureModified, onResetFactureModified) => {
    // Initialisation du service facture
    const factureService = useMemo(() => new FactureService(), []);
    
    // ✅ CORRECTION : Un seul état pour les factures (suppression du doublon)
    const [facturesNonFiltrees, setFacturesNonFiltrees] = useState([]);
    const [factureSelectionnee, setFactureSelectionnee] = useState(nouvelleFactureId || null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [anneeSelectionnee, setAnneeSelectionnee] = useState(new Date().getFullYear());

    // Fonction pour charger les factures
    const chargerFactures = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            const facturesData = await factureService.chargerFactures(anneeSelectionnee);
            
            // ✅ CORRECTION : Un seul setState au lieu de deux
            setFacturesNonFiltrees(facturesData);
            
            console.log(`✅ ${facturesData.length} factures chargées pour l'année ${anneeSelectionnee}`);
        } catch (error) {
            console.error('Erreur lors du chargement des factures:', error);
            setError('Une erreur est survenue lors du chargement des factures: ' + error.message);
            
            // ✅ CORRECTION : Un seul setState au lieu de deux
            setFacturesNonFiltrees([]);
        } finally {
            setIsLoading(false);
        }
    }, [anneeSelectionnee, factureService]);

    // Effet pour recharger les factures si une a été modifiée
    useEffect(() => {
        if (factureModified) {
            console.log('🔄 Rechargement des factures (facture modifiée)');
            chargerFactures();
            if (onResetFactureModified) {
                onResetFactureModified();
            }
        }
    }, [factureModified, onResetFactureModified, chargerFactures]);

    // Effet pour sélectionner la nouvelle facture
    useEffect(() => {
        if (nouvelleFactureId) {
            console.log('🎯 Sélection de la nouvelle facture:', nouvelleFactureId);
            setFactureSelectionnee(nouvelleFactureId);
        }
    }, [nouvelleFactureId]);

    // Effet pour charger les factures au chargement initial ou quand l'année change
    useEffect(() => {
        chargerFactures();
    }, [anneeSelectionnee, chargerFactures]);

    // Fonction pour changer l'année
    const handleAnneeChange = useCallback((annee) => {
        console.log('📅 Changement d\'année:', annee);
        setAnneeSelectionnee(annee);
        setFactureSelectionnee(null);
    }, []);

    // Fonction pour sélectionner/désélectionner une facture
    const handleSelectionFacture = useCallback((factureId) => {
        setFactureSelectionnee(prevId => {
            const newId = prevId === factureId ? null : factureId;
            console.log('🎯 Sélection facture:', prevId, '→', newId);
            return newId;
        });
    }, []);

    // ✅ CORRECTION : Retourner seulement les états nécessaires
    return {
        // factures supprimé car doublon de facturesNonFiltrees
        facturesNonFiltrees,
        isLoading,
        error,
        factureSelectionnee,
        anneeSelectionnee,
        chargerFactures,
        setFactureSelectionnee: handleSelectionFacture,
        setAnneeSelectionnee: handleAnneeChange
    };
};

export default useFactures;