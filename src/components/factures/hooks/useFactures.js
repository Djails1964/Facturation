// src/components/factures/hooks/useFactures.js
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useApiCall } from '../../../hooks/useApiCall';
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
    
    // ✅ Hook API centralisé
    const { execute, isLoading, error: apiError } = useApiCall();
    
    // États
    const [facturesNonFiltrees, setFacturesNonFiltrees] = useState([]);
    const [factureSelectionnee, setFactureSelectionnee] = useState(nouvelleFactureId || null);
    const [error, setError] = useState(null);
    const [anneeSelectionnee, setAnneeSelectionnee] = useState(new Date().getFullYear());

    // ✅ MODIFIÉ : Fonction pour charger et enrichir les factures
    const chargerFactures = useCallback(async () => {
        await execute(
            async () => {
                console.log(`📥 Chargement des factures pour l'année ${anneeSelectionnee}...`);
                const facturesData = await factureService.chargerFactures(anneeSelectionnee);
                
                console.log(`🔄 Enrichissement de ${facturesData.length} factures avec états calculés (Retard)...`);
                // ✅ Enrichir avec etatAffichage qui inclut le calcul de Retard
                const facturesEnrichies = await factureService.enrichirFacturesAvecEtatAffichage(facturesData);
                
                return facturesEnrichies;
            },
            (facturesEnrichies) => {
                console.log(`✅ ${facturesEnrichies.length} factures enrichies chargées pour l'année ${anneeSelectionnee}`);
                setFacturesNonFiltrees(facturesEnrichies);
                setError(null);
            },
            (err) => {
                console.error('❌ Erreur lors du chargement des factures:', err);
                const errorMessage = 'Une erreur est survenue lors du chargement des factures: ' + err.message;
                setError(errorMessage);
                setFacturesNonFiltrees([]);
            }
        );
    }, [anneeSelectionnee, factureService, execute]);

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
    const handleSelectionFacture = useCallback((idFacture) => {
        setFactureSelectionnee(prevId => {
            const newId = prevId === idFacture ? null : idFacture;
            console.log('🎯 Sélection facture:', prevId, '→', newId);
            return newId;
        });
    }, []);

    // Retourner les états nécessaires
    return {
        facturesNonFiltrees,
        isLoading,
        error: error || apiError, // Combiner les erreurs
        factureSelectionnee,
        anneeSelectionnee,
        chargerFactures,
        setFactureSelectionnee: handleSelectionFacture,
        setAnneeSelectionnee: handleAnneeChange
    };
};

export default useFactures;