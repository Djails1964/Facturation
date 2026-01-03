// src/components/paiements/hooks/usePaiementsFiltres.js
// ✅ REFACTORISÉ : Utilise useClientActions au lieu de ClientService direct
// ✅ Utilise usePaiementActions pour les années disponibles

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePaiementActions } from './usePaiementActions';
import { useClientActions } from '../../clients/hooks/useClientActions';
import { createLogger } from '../../../utils/createLogger';

/**
 * Hook pour gérer les filtres de la liste des paiements
 * ✅ REFACTORISÉ : Utilise usePaiementActions et useClientActions
 */
export function usePaiementsFiltres(initialFilter = {}) {
    const log = createLogger("usePaiementsFiltres");

    const [filtres, setFiltres] = useState({
        annee: new Date().getFullYear(),
        mois: '',
        methode: '',
        idClient: '',
        statut: 'confirme',
        ...initialFilter
    });
    
    const [showFilters, setShowFilters] = useState(false);
    const [anneesOptions, setAnneesOptions] = useState([]);
    const [clients, setClients] = useState([]);
    const [isLoadingClients, setIsLoadingClients] = useState(false);

    // ✅ Utilisation des hooks d'actions
    const paiementActions = usePaiementActions();
    const { chargerClients: chargerClientsApi } = useClientActions();

    // ✅ Refs pour éviter les appels multiples
    const isLoadingClientsRef = useRef(false);
    const isLoadingAnneesRef = useRef(false);

    // Charger les années disponibles
    const chargerAnneesDisponibles = useCallback(async () => {
        if (isLoadingAnneesRef.current) {
            log.debug('⏳ Chargement des années déjà en cours, ignoré');
            return;
        }

        isLoadingAnneesRef.current = true;
        try {
            log.debug('📥 Chargement des années disponibles via usePaiementActions');
            const annees = await paiementActions.getAnneesDisponibles();
            setAnneesOptions(annees || []);
            log.debug('✅ Années chargées:', annees?.length || 0);
        } catch (error) {
            log.error('❌ Erreur lors du chargement des années:', error);
        } finally {
            isLoadingAnneesRef.current = false;
        }
    }, [paiementActions, log]);

    // ✅ MODIFIÉ : Charger les clients via useClientActions
    const chargerClients = useCallback(async () => {
        if (isLoadingClientsRef.current) {
            log.debug('⏳ Chargement des clients déjà en cours, ignoré');
            return;
        }

        isLoadingClientsRef.current = true;
        setIsLoadingClients(true);
        try {
            log.debug('📥 Chargement des clients via useClientActions');
            const clientsData = await chargerClientsApi();
            setClients(clientsData || []);
            log.debug('✅ Clients chargés:', clientsData?.length || 0);
        } catch (error) {
            log.error('❌ Erreur lors du chargement des clients:', error);
        } finally {
            setIsLoadingClients(false);
            isLoadingClientsRef.current = false;
        }
    }, [chargerClientsApi, log]);

    // Charger les données au montage du composant uniquement
    useEffect(() => {
        chargerAnneesDisponibles();
        chargerClients();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const updateFiltres = useCallback((nouveauxFiltres) => {
        setFiltres(prev => ({ ...prev, ...nouveauxFiltres }));
    }, []);

    const resetFiltres = useCallback(() => {
        setFiltres({
            annee: new Date().getFullYear(),
            mois: '',
            methode: '',
            idClient: '',
            statut: 'confirme'
        });
    }, []);

    return {
        filtres,
        setFiltres: updateFiltres,
        resetFiltres,
        showFilters,
        setShowFilters,
        anneesOptions,
        clients,
        isLoadingClients
    };
}