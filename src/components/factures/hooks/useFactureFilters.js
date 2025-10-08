// src/components/factures/hooks/useFactureFilters.js

import { useState, useEffect, useCallback, useMemo } from 'react';
import ClientService from '../../../services/ClientService';

export const useFactureFilters = (facturesNonFiltrees, chargerFactures, anneeSelectionneeFromParent, setAnneeSelectionneeFromParent) => {
    const clientService = useMemo(() => new ClientService(), []);
    
    // États des filtres (SANS anneeSelectionnee qui vient du parent)
    const [clients, setClients] = useState([]);
    const [clientSelectionne, setClientSelectionne] = useState('');
    const [etatSelectionne, setEtatSelectionne] = useState('');
    const [isLoadingClients, setIsLoadingClients] = useState(false);
    const [filteredFactures, setFilteredFactures] = useState([]);

    // Listes pour les filtres
    const etats = useMemo(() => [
        'Tous', 
        'Payée', 
        'Partiellement payée',
        'Éditée', 
        'En attente', 
        'Retard', 
        'Annulée', 
        'Envoyée'
    ], []);
    
    // Générer les options d'années
    const anneesOptions = useMemo(() => {
        const anneeActuelle = new Date().getFullYear();
        const options = [];
        for (let i = 0; i <= 5; i++) {
            options.push(anneeActuelle - i);
        }
        return options;
    }, []);

    // Charger les clients
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

    useEffect(() => {
        chargerClients();
    }, [chargerClients]);

    // Fonction pour appliquer les filtres (client et état uniquement)
    const appliquerFiltres = useCallback(() => {
        let resultats = [...facturesNonFiltrees];
        console.log('📊 Filtrage - Factures initiales:', resultats.length);
        
        // Filtrer par client
        if (clientSelectionne) {
            resultats = resultats.filter(facture => 
                facture.client.idClient === parseInt(clientSelectionne)
            );
            console.log('📊 Après filtre client:', resultats.length);
        }
        
        // ✅ Filtrer par état - utiliser etatAffichage pour gérer "Retard"
        if (etatSelectionne && etatSelectionne !== 'Tous') {
            resultats = resultats.filter(facture => {
                const etatAComparer = facture.etatAffichage || facture.etat;
                return etatAComparer === etatSelectionne;
            });
            console.log(`📊 Après filtre état "${etatSelectionne}":`, resultats.length);
        }
        
        setFilteredFactures(resultats);
    }, [clientSelectionne, etatSelectionne, facturesNonFiltrees]);

    useEffect(() => {
        appliquerFiltres();
    }, [clientSelectionne, etatSelectionne, facturesNonFiltrees, appliquerFiltres]);

    // ✅ Gestionnaire d'année - appelle setAnneeSelectionneeFromParent
    const handleAnneeChange = useCallback((e) => {
        const nouvelleAnnee = parseInt(e.target.value);
        console.log('📅 Changement d\'année:', nouvelleAnnee);
        setAnneeSelectionneeFromParent(nouvelleAnnee);
    }, [setAnneeSelectionneeFromParent]);

    const handleClientChange = useCallback((e) => {
        setClientSelectionne(e.target.value);
    }, []);

    const handleEtatChange = useCallback((e) => {
        setEtatSelectionne(e.target.value);
    }, []);

    return {
        clients,
        isLoadingClients,
        anneeSelectionnee: anneeSelectionneeFromParent, // ✅ Retourner celle du parent
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