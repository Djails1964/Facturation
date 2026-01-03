// src/components/factures/hooks/useFactureFilters.js
// ✅ REFACTORISÉ : Utilise useClientActions pour les clients (séparation des responsabilités)

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useClientActions } from '../../clients/hooks/useClientActions';
import { createLogger } from '../../../utils/createLogger';

/**
 * Hook personnalisé pour gérer les filtres de factures
 * ✅ REFACTORISÉ : Utilise useClientActions au lieu de useFactureActions pour les clients
 */
export const useFactureFilters = (facturesNonFiltrees, chargerFactures, anneeSelectionneeFromParent, setAnneeSelectionneeFromParent) => {
    
    const log = createLogger("useFactureFilters");

    // ✅ MODIFIÉ : Utilisation de useClientActions pour les clients
    const { chargerClients: chargerClientsApi } = useClientActions();
    
    // États des filtres (SANS anneeSelectionnee qui vient du parent)
    const [clients, setClients] = useState([]);
    const [clientSelectionne, setClientSelectionne] = useState('');
    const [etatSelectionne, setEtatSelectionne] = useState('Sans annulées'); // ✅ Valeur par défaut
    const [isLoadingClients, setIsLoadingClients] = useState(false);

    // ✅ Ref pour éviter les appels multiples
    const isLoadingClientsRef = useRef(false);
    const clientsLoadedRef = useRef(false);

    // Listes pour les filtres
    const etats = useMemo(() => [
        { value: 'Sans annulées', label: 'Sans annulées' },
        { value: 'Tous les états', label: 'Tous les états' },
        { value: 'Payée', label: 'Payée' }, 
        { value: 'Partiellement payée', label: 'Partiellement payée' },
        { value: 'Éditée', label: 'Éditée' }, 
        { value: 'En attente', label: 'En attente' }, 
        { value: 'Retard', label: 'Retard' }, 
        { value: 'Annulée', label: 'Annulée' }, 
        { value: 'Envoyée', label: 'Envoyée' }
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

    // ✅ MODIFIÉ : Charger les clients via useClientActions
    const chargerClients = useCallback(async () => {
        // ✅ Protection contre les appels multiples
        if (isLoadingClientsRef.current || clientsLoadedRef.current) {
            log.debug('⏳ Chargement des clients déjà en cours ou terminé, ignoré');
            return;
        }
        
        isLoadingClientsRef.current = true;
        setIsLoadingClients(true);
        
        try {
            log.debug('📥 Chargement des clients via useClientActions...');
            const clientsData = await chargerClientsApi();
            
            log.debug('✅ Clients chargés:', clientsData?.length || 0);
            setClients(clientsData || []);
            clientsLoadedRef.current = true;
        } catch (error) {
            log.error('❌ Erreur chargement clients:', error);
            setClients([]);
        } finally {
            setIsLoadingClients(false);
            isLoadingClientsRef.current = false;
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // ✅ Pas de dépendances pour éviter les recréations

    // Charger les clients au montage uniquement
    useEffect(() => {
        chargerClients();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Fonction pour appliquer les filtres (client et état uniquement)
    const filteredFactures = useMemo(() => {
        let resultats = [...facturesNonFiltrees];
        log.debug('📊 Filtrage - Factures initiales:', resultats.length);
        
        // Filtrer par client
        if (clientSelectionne) {
            resultats = resultats.filter(facture => 
                facture.client?.idClient === parseInt(clientSelectionne)
            );
            log.debug('📊 Après filtre client:', resultats.length);
        }
        
        // ✅ Filtrer par état - utiliser etatAffichage pour gérer "Retard"
        if (etatSelectionne === 'Tous les états') {
            // Afficher toutes les factures (y compris annulées)
            log.debug('📊 Filtre "Tous les états" - aucun filtrage par état');
        } else if (etatSelectionne === 'Sans annulées' || !etatSelectionne) {
            // Par défaut : exclure les factures annulées
            resultats = resultats.filter(facture => {
                const etat = facture.etatAffichage || facture.etat;
                return etat !== 'Annulée';
            });
            log.debug('📊 Après exclusion des annulées:', resultats.length);
        } else {
            // Filtre sur un état spécifique
            resultats = resultats.filter(facture => {
                const etatAComparer = facture.etatAffichage || facture.etat;
                return etatAComparer === etatSelectionne;
            });
            log.debug(`📊 Après filtre état "${etatSelectionne}":`, resultats.length);
        }
        
        return resultats;
    }, [clientSelectionne, etatSelectionne, facturesNonFiltrees]);

    // useEffect(() => {
    //     appliquerFiltres();
    // }, [clientSelectionne, etatSelectionne, facturesNonFiltrees, appliquerFiltres]);

    // ✅ Gestionnaire d'année - appelle setAnneeSelectionneeFromParent
    const handleAnneeChange = useCallback((e) => {
        const nouvelleAnnee = parseInt(e.target.value);
        log.debug('📅 Changement d\'année:', nouvelleAnnee);
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