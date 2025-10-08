import { useState, useEffect } from 'react';
import PaiementService from '../../../services/PaiementService';
import ClientService from '../../../services/ClientService';

export function usePaiementsFiltres(initialFilter = {}) {
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
    
    const paiementService = new PaiementService();
    const clientService = new ClientService();

    // Charger les années disponibles
    const chargerAnneesDisponibles = async () => {
        try {
            const annees = await paiementService.chargerAnneesDisponibles();
            setAnneesOptions(annees);
        } catch (error) {
            console.error('Erreur lors du chargement des années:', error);
        }
    };

    // Charger les clients
    const chargerClients = async () => {
        setIsLoadingClients(true);
        try {
            const clientsData = await clientService.chargerClients();
            setClients(clientsData);
        } catch (error) {
            console.error('Erreur lors du chargement des clients:', error);
        } finally {
            setIsLoadingClients(false);
        }
    };

    useEffect(() => {
        chargerAnneesDisponibles();
        chargerClients();
    }, []);

    const updateFiltres = (nouveauxFiltres) => {
        setFiltres(prev => ({ ...prev, ...nouveauxFiltres }));
    };

    const resetFiltres = () => {
        setFiltres({
            annee: new Date().getFullYear(),
            mois: '',
            methode: '',
            idClient: '',
            statut: 'confirme'
        });
    };

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