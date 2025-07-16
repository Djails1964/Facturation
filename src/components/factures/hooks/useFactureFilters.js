// src/components/factures/hooks/useFactureFilters.js

import { useState, useEffect, useCallback, useMemo } from 'react';
import ClientService from '../../../services/ClientService';

/**
 * Hook personnalisé pour gérer les filtres des factures
 * 
 * @param {Array} facturesNonFiltrees - Liste de toutes les factures à filtrer
 * @param {Function} chargerFactures - Fonction pour recharger les factures
 * @returns {Object} État et fonctions pour gérer les filtres
 */
export const useFactureFilters = (facturesNonFiltrees, chargerFactures) => {
    // Initialisation du service client
    const clientService = useMemo(() => new ClientService(), []);
    
    // États des filtres
    const [clients, setClients] = useState([]);
    const [clientSelectionne, setClientSelectionne] = useState('');
    const [etatSelectionne, setEtatSelectionne] = useState('');
    const [isLoadingClients, setIsLoadingClients] = useState(false);
    const [anneeSelectionnee, setAnneeSelectionnee] = useState(new Date().getFullYear());
    const [filteredFactures, setFilteredFactures] = useState([]);

    // Listes pour les filtres
    const etats = useMemo(() => ['Tous', 'Payée', 'Éditée', 'En attente', 'Retard', 'Annulée', 'Envoyée'], []);
    
    // Générer les options d'années (année courante - 5 ans)
    const anneesOptions = useMemo(() => {
        const anneeActuelle = new Date().getFullYear();
        const options = [];
        for (let i = 0; i <= 5; i++) {
            options.push(anneeActuelle - i);
        }
        return options;
    }, []);

    // Fonction pour charger les clients
    const chargerClients = useCallback(async () => {
        setIsLoadingClients(true);
        
        try {
            const clientsData = await clientService.chargerClients();
            setClients(clientsData);
        } catch (error) {
            console.error('Erreur lors du chargement des clients:', error);
            setClients([]);
        } finally {
            setIsLoadingClients(false);
        }
    }, [clientService]);

    // Charger les clients au chargement initial
    useEffect(() => {
        chargerClients();
    }, [chargerClients]);

    // Fonction pour appliquer les filtres
    const appliquerFiltres = useCallback(() => {
        let resultats = [...facturesNonFiltrees];
        
        // Filtrer par client
        if (clientSelectionne) {
            resultats = resultats.filter(facture => 
                facture.client.id === parseInt(clientSelectionne)
            );
        }
        
        // Filtrer par état
        if (etatSelectionne && etatSelectionne !== 'Tous') {
            resultats = resultats.filter(facture => 
                facture.etat === etatSelectionne
            );
        }
        
        setFilteredFactures(resultats);
    }, [clientSelectionne, etatSelectionne, facturesNonFiltrees]);

    // Appliquer les filtres quand ils changent
    useEffect(() => {
        appliquerFiltres();
    }, [clientSelectionne, etatSelectionne, facturesNonFiltrees, appliquerFiltres]);

    // Gestionnaires d'événements pour les changements de filtres
    const handleAnneeChange = useCallback((e) => {
        const nouvelleAnnee = parseInt(e.target.value);
        setAnneeSelectionnee(nouvelleAnnee);
        // On peut avoir besoin de recharger les factures avec la nouvelle année
        setTimeout(() => chargerFactures(), 0);
    }, [chargerFactures]);

    const handleClientChange = useCallback((e) => {
        setClientSelectionne(e.target.value);
    }, []);

    const handleEtatChange = useCallback((e) => {
        setEtatSelectionne(e.target.value);
    }, []);

    // Retourner tous les états et fonctions nécessaires
    return {
        clients,
        isLoadingClients,
        anneeSelectionnee,
        clientSelectionne,
        etatSelectionne,
        filteredFactures,
        etats,
        anneesOptions,
        handleAnneeChange,
        handleClientChange,
        handleEtatChange,
        chargerClients
    };
};

export default useFactureFilters;