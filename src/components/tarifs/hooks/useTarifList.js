import { useState, useEffect, useMemo, useCallback } from 'react';

export const useTarifList = (tarifs = [], services = [], unites = [], typesTarifs = []) => {
    const [filters, setFilters] = useState({
        service: '',
        unite: '',
        typeTarif: '',
        etat: ''
    });
    const [sorting, setSorting] = useState({
        field: 'service',
        direction: 'asc'
    });
    
    // 🔧 FIX: Éviter les logs excessifs avec useEffect contrôlé
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            console.log('🔍 useTarifList - Données mises à jour:', {
                tarifsCount: tarifs?.length || 0,
                servicesCount: services?.length || 0,
                unitesCount: unites?.length || 0,
                typesTarifsCount: typesTarifs?.length || 0
            });
        }
    }, [tarifs?.length, services?.length, unites?.length, typesTarifs?.length]);
    
    // 🔧 FIX: Fonctions stables avec useCallback
    const handleFilterChange = useCallback((event) => {
        const { name, value } = event.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    }, []);
    
    const handleResetFilters = useCallback(() => {
        setFilters({
            service: '',
            unite: '',
            typeTarif: '',
            etat: ''
        });
    }, []);
    
    const handleSortChange = useCallback((field) => {
        setSorting(prev => ({
            field,
            direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    }, []);
    
    // 🔧 FIX: Fonction de validation stable
    const isTarifValid = useCallback((tarif) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Support camelCase ET snake_case
        const dateDebut = tarif.dateDebut || tarif.date_debut ? 
            new Date(tarif.dateDebut || tarif.date_debut) : null;
        const dateFin = tarif.dateFin || tarif.date_fin ? 
            new Date(tarif.dateFin || tarif.date_fin) : null;
        
        if (!dateDebut) return false;
        
        dateDebut.setHours(0, 0, 0, 0);
        
        return dateDebut <= today && (!dateFin || dateFin >= today);
    }, []);
    
    // 🔧 FIX: Fonction d'enrichissement stable avec support des deux formats
    const enrichTarif = useCallback((tarif) => {
        // Support camelCase ET snake_case pour les IDs
        const idService = tarif.idService;
        const idUnite = tarif.idUnite;
        const typeTarifId = tarif.typeTarifId || tarif.type_tarif_id;
        
        const service = services.find(s => s.id == idService);
        const unite = unites.find(u => u.id == idUnite);
        const typeTarif = typesTarifs.find(t => t.id == typeTarifId);
        
        return {
            ...tarif,
            // 🔧 FIX: Créer les noms en camelCase pour compatibilité
            nomService: service?.nomService || `Service ${idService}`,
            uniteNom: unite?.nomUnite || `Unité ${idUnite}`,
            typeTarifNom: typeTarif?.nom || `Type ${typeTarifId}`,
            // Garder aussi les versions snake_case si elles n'existent pas
            nomService: tarif.nomService || (service?.nomService || `Service ${idService}`),
            uniteNom: tarif.uniteNom || (unite?.nomUnite || `Unité ${idUnite}`),
            typeTarifNom: tarif.typeTarifNom || (typeTarif?.nom || `Type ${typeTarifId}`),
            isValid: isTarifValid(tarif)
        };
    }, [services, unites, typesTarifs, isTarifValid]);
    
    // 🔧 FIX: Filtrage et tri optimisés avec useMemo
    const filteredAndSortedTarifs = useMemo(() => {
        // Vérification avec logs contrôlés
        if (!Array.isArray(tarifs) || tarifs.length === 0) {
            return [];
        }
        
        // Enrichir tous les tarifs
        const enrichedTarifs = tarifs.map(tarif => enrichTarif(tarif));
        
        // Filtrer
        let filtered = enrichedTarifs.filter(tarif => {
            // Support camelCase ET snake_case pour les filtres
            const idService = tarif.idService;
            const idUnite = tarif.idUnite;
            const typeTarifId = tarif.typeTarifId || tarif.type_tarif_id;
            
            // Filtre par service
            if (filters.service && idService != filters.service) {
                return false;
            }
            
            // Filtre par unité
            if (filters.unite && idUnite != filters.unite) {
                return false;
            }
            
            // Filtre par type de tarif
            if (filters.typeTarif && typeTarifId != filters.typeTarif) {
                return false;
            }
            
            // Filtre par état
            if (filters.etat) {
                const isValid = tarif.isValid;
                if ((filters.etat === 'valid' && !isValid) || (filters.etat === 'invalid' && isValid)) {
                    return false;
                }
            }
            
            return true;
        });
        
        // Tri avec support des deux formats
        filtered.sort((a, b) => {
            let aValue, bValue;
            
            switch (sorting.field) {
                case 'service':
                case 'nomService':
                    aValue = a.nomService || '';
                    bValue = b.nomService || '';
                    break;
                case 'unite':
                case 'uniteNom':
                    aValue = a.uniteNom || '';
                    bValue = b.uniteNom || '';
                    break;
                case 'typeTarif':
                case 'typeTarifNom':
                    aValue = a.typeTarifNom || '';
                    bValue = b.typeTarifNom || '';
                    break;
                case 'prix':
                    aValue = parseFloat(a.prix) || 0;
                    bValue = parseFloat(b.prix) || 0;
                    break;
                case 'dateDebut':
                case 'date_debut':
                    aValue = new Date(a.dateDebut || a.date_debut || '');
                    bValue = new Date(b.dateDebut || b.date_debut || '');
                    break;
                case 'etat':
                    aValue = a.isValid ? 'valide' : 'invalide';
                    bValue = b.isValid ? 'valide' : 'invalide';
                    break;
                default:
                    aValue = a[sorting.field] || '';
                    bValue = b[sorting.field] || '';
            }
            
            // Gestion du tri pour différents types
            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return sorting.direction === 'asc' ? aValue - bValue : bValue - aValue;
            } else if (aValue instanceof Date && bValue instanceof Date) {
                return sorting.direction === 'asc' ? aValue - bValue : bValue - aValue;
            } else {
                // Tri alphabétique
                const aStr = String(aValue).toLowerCase();
                const bStr = String(bValue).toLowerCase();
                if (sorting.direction === 'asc') {
                    return aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
                } else {
                    return aStr > bStr ? -1 : aStr < bStr ? 1 : 0;
                }
            }
        });
        
        return filtered;
    }, [tarifs, enrichTarif, filters, sorting]);
    
    return {
        filters,
        sorting,
        filteredAndSortedTarifs,
        handleFilterChange,
        handleResetFilters,
        handleSortChange,
        isTarifValid,
        enrichTarif
    };
};