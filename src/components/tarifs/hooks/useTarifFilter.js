import { useState, useMemo, useCallback } from 'react';
import { getEtatValidite } from '../../../utils/formatters';

/**
 * Hook personnalisé pour gérer les filtres des listes de tarification
 * @param {Array} data - Données à filtrer
 * @param {string} filterType - Type de filtre ('services', 'unites', etc.)
 * @param {Object} initialFilters - Filtres initiaux
 */
export const useTarifFilter = (data = [], filterType = '', initialFilters = {}) => {
  
  // État des filtres
  const [filters, setFilters] = useState(initialFilters);
  const [showFilters, setShowFilters] = useState(false);

  // Gestionnaire de changement de filtre
  const handleFilterChange = useCallback((field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Gestionnaire de reset des filtres
  const handleResetFilters = useCallback(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  // Gestionnaire de basculement d'affichage des filtres
  const handleToggleFilters = useCallback(() => {
    setShowFilters(prev => !prev);
  }, []);

  // Fonction de filtrage générique
  const applyFilters = useCallback((items, filterConfig) => {
    return items.filter(item => {
      return Object.entries(filters).every(([field, filterValue]) => {
        if (!filterValue || filterValue === '') return true;

        switch (field) {
          case 'code':
            return item.code === filterValue;
          
          case 'nom':
            return item.nom === filterValue;
          
          case 'description':
            return item.description === filterValue;
          
          case 'statut':
            // Statut uniquement pour les services (pas pour les unités)
            if (filterType === 'services') {
              const itemStatut = item.actif ? 'Actif' : 'Inactif';
              return itemStatut === filterValue;
            }
            // Pour les tarifs avec état valide/invalide basé sur les dates
            if (filterType === 'tarifs-standards' || filterType === 'tarifs-speciaux') {
              const dateDebut = item.dateDebut || item.date_debut;
              const dateFin = item.dateFin || item.date_fin;
              const etatCalcule = getEtatValidite(dateDebut, dateFin);
              
              if (filterValue === 'valide') {
                return etatCalcule.etat === 'valide';
              } else if (filterValue === 'invalide') {
                return etatCalcule.etat === 'invalide';
              }
            }
            return true;
          
          case 'service':
            const serviceName = item.nom_service || item.nomService;
            return serviceName === filterValue;
          
          case 'unite':
            const uniteName = item.nom_unite || item.nomUnite;
            return uniteName === filterValue;
          
          case 'typeTarif':
            const typeTarifName = item.nom_type_tarif || item.nomTypeTarif;
            return typeTarifName === filterValue;
          
          case 'client':
            const clientName = item.client_nom || item.clientNom || 
                              (item.client_prenom && item.client_nom ? 
                               `${item.client_prenom} ${item.client_nom}` : '');
            return clientName === filterValue;
          
          default:
            return String(item[field]) === String(filterValue);
        }
      });
    });
  }, [filters, filterType]);

  // Données filtrées selon le type
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // Configuration spécifique selon le type
    const filterConfig = {};
    
    switch (filterType) {
      case 'services':
        return applyFilters(data, filterConfig);
      
      case 'unites':
        return applyFilters(data, filterConfig);
      
      case 'types-tarifs':
        return applyFilters(data, filterConfig);
      
      case 'tarifs-standards':
        console.log('Applying filters for types-tarifs with config:', filterConfig);
        console.log('Current filters:', filters);
        console.log('Data before filtering:', data);
        return applyFilters(data, filterConfig);
      
      case 'tarifs-speciaux':
        return applyFilters(data, filterConfig);
      
      default:
        return data;
    }
  }, [data, applyFilters, filterType]);

  // Vérifier s'il y a des filtres actifs
  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some(value => value && value !== '');
  }, [filters]);

  // Statistiques de filtrage
  const filterStats = useMemo(() => {
    return {
      totalCount: data.length,
      filteredCount: filteredData.length,
      hasActiveFilters,
      isFiltered: filteredData.length !== data.length
    };
  }, [data.length, filteredData.length, hasActiveFilters]);

  return {
    // État des filtres
    filters,
    showFilters,
    hasActiveFilters,
    
    // Données filtrées
    filteredData,
    filterStats,
    
    // Gestionnaires
    handleFilterChange,
    handleResetFilters,
    handleToggleFilters,
    
    // Utilities
    setFilters,
    setShowFilters
  };
};

/**
 * Fonction utilitaire pour enrichir les données de tarifs avec leur état
 * @param {Array} tarifs - Tableau de tarifs
 * @param {string} currentDate - Date actuelle
 * @returns {Array} Tarifs enrichis avec la propriété 'etat'
 */
export const enrichTarifsWithEtat = (tarifs, currentDate = null) => {
  if (!Array.isArray(tarifs)) return [];
  
  return tarifs.map(tarif => {
    const dateDebut = tarif.dateDebut || tarif.date_debut;
    const dateFin = tarif.dateFin || tarif.date_fin;
    const etatCalcule = getEtatValidite(dateDebut, dateFin, currentDate);
    
    return {
      ...tarif,
      etat: etatCalcule.etat // 'valide' ou 'invalide'
    };
  });
};

/**
 * Fonction utilitaire pour créer les filtres initiaux selon le type
 * @param {string} filterType - Type de filtre
 * @returns {Object} Filtres initiaux
 */
export const createInitialFilters = (filterType) => {
  const baseFilters = {};
  
  switch (filterType) {
    case 'services':
      return {
        code: '',
        nom: '',
        description: '',
        statut: ''
      };
    
    case 'unites':
      // PAS DE STATUT POUR LES UNITÉS
      return {
        code: '',
        nom: '',
        description: ''
      };
    
    case 'types-tarifs':
      return {
        code: '',
        nom: '',
        description: ''
      };
    
    case 'tarifs-standards':
      return {
        service: '',
        unite: '',
        typeTarif: '',
        statut: ''
      };
    
    case 'tarifs-speciaux':
      return {
        client: '',
        service: '',
        unite: '',
        statut: ''
      };
    
    default:
      return baseFilters;
  }
};

export default useTarifFilter;