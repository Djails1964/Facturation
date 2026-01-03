// src/components/factures/hooks/useFactures.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { useFactureActions } from './useFactureActions';
import { createLogger } from '../../../utils/createLogger';

/**
 * Hook personnalisé pour gérer les factures
 * ✅ CORRIGÉ : Ajout de refs pour éviter les boucles infinies
 */
export const useFactures = (nouvelleFactureId, factureModified, onResetFactureModified) => {

    const log = createLogger("useFactures");

    // ✅ Utilisation de useFactureActions
    const factureActions = useFactureActions();
    
    // États
    const [facturesNonFiltrees, setFacturesNonFiltrees] = useState([]);
    const [factureSelectionnee, setFactureSelectionnee] = useState(nouvelleFactureId || null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [anneeSelectionnee, setAnneeSelectionnee] = useState(new Date().getFullYear());

    // ✅ AJOUT : Ref pour éviter les appels multiples
    const isLoadingRef = useRef(false);
    const lastLoadedYearRef = useRef(null);

    // ✅ CORRIGÉ : Fonction pour charger et enrichir les factures
    // Utilise une ref pour éviter les appels multiples
    const chargerFactures = useCallback(async (forceReload = false) => {
        // ✅ Protection contre les appels multiples
        if (isLoadingRef.current) {
            log.debug('⏳ Chargement déjà en cours, ignoré');
            return;
        }
        
        // ✅ Éviter de recharger la même année (sauf si forcé)
        if (!forceReload && lastLoadedYearRef.current === anneeSelectionnee && facturesNonFiltrees.length > 0) {
            log.debug('📦 Données déjà chargées pour cette année, ignoré');
            return;
        }

        isLoadingRef.current = true;
        setIsLoading(true);
        setError(null);
        
        try {
            log.debug(`📥 Chargement des factures pour l'année ${anneeSelectionnee}...`);
            const facturesEnrichies = await factureActions.chargerFactures(anneeSelectionnee);
            
            log.debug(`✅ ${facturesEnrichies.length} factures enrichies chargées pour l'année ${anneeSelectionnee}`);
            setFacturesNonFiltrees(facturesEnrichies);
            lastLoadedYearRef.current = anneeSelectionnee;
        } catch (err) {
            log.error('❌ Erreur lors du chargement des factures:', err);
            const errorMessage = 'Une erreur est survenue lors du chargement des factures: ' + err.message;
            setError(errorMessage);
            setFacturesNonFiltrees([]);
        } finally {
            setIsLoading(false);
            isLoadingRef.current = false;
        }
    // ✅ IMPORTANT : Ne pas inclure factureActions dans les dépendances pour éviter la boucle
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [anneeSelectionnee]);

    // Effet pour recharger les factures si une a été modifiée
    useEffect(() => {
        if (factureModified) {
            log.debug('🔄 Rechargement des factures (facture modifiée)');
            chargerFactures(true); // ✅ Forcer le rechargement
            if (onResetFactureModified) {
                onResetFactureModified();
            }
        }
    }, [factureModified, onResetFactureModified, chargerFactures]);

    // Effet pour sélectionner la nouvelle facture
    useEffect(() => {
        if (nouvelleFactureId) {
            log.debug('🎯 Sélection de la nouvelle facture:', nouvelleFactureId);
            setFactureSelectionnee(nouvelleFactureId);
        }
    }, [nouvelleFactureId]);

    // ✅ CORRIGÉ : Effet pour charger les factures au chargement initial ou quand l'année change
    useEffect(() => {
        chargerFactures();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [anneeSelectionnee]); // ✅ Ne dépend que de anneeSelectionnee

    // Fonction pour changer l'année
    const handleAnneeChange = useCallback((annee) => {
        log.debug('📅 Changement d\'année:', annee);
        setAnneeSelectionnee(annee);
        setFactureSelectionnee(null);
        lastLoadedYearRef.current = null; // ✅ Réinitialiser pour permettre le chargement
    }, []);

    // Fonction pour sélectionner/désélectionner une facture
    const handleSelectionFacture = useCallback((idFacture) => {
        setFactureSelectionnee(prevId => {
            const newId = prevId === idFacture ? null : idFacture;
            log.debug('🎯 Sélection facture:', prevId, '→', newId);
            return newId;
        });
    }, []);

    // Retourner les états nécessaires
    return {
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