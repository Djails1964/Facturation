// src/hooks/useTarifFilter.js
// 🔧 CORRECTION COMPLÈTE du filtre statut pour tarifs-standards

import { useState, useMemo, useCallback } from 'react';
import { getEtatValidite } from '../../../utils/formatters';
import { createLogger } from '../../../utils/createLogger';

const log = createLogger("useTarifFilter");
  


export const useTarifFilter = (data = [], filterType = '', initialFilters = {}) => {
  
  const [filters, setFilters] = useState(initialFilters);
  const [showFilters, setShowFilters] = useState(false);

  const handleFilterChange = useCallback((field, value) => {
    log.debug('🔄 Changement de filtre:', { field, value });
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  const handleToggleFilters = useCallback(() => {
    setShowFilters(prev => !prev);
  }, []);

  // Fonction de filtrage générique
  const applyFilters = useCallback((items, filterConfig) => {
    log.debug('🔍 Application des filtres:', { 
      filterType, 
      filters, 
      itemsCount: items.length,
      items: items 
    });
    
    const filtered = items.filter(item => {
      return Object.entries(filters).every(([field, filterValue]) => {
        if (!filterValue || filterValue === '') return true;

        log.debug(`🔎 Test filtre ${field}:`, { 
          filterValue, 
          itemValue: item[field],
          item 
        });

        switch (field) {
          case 'code':
            return item.code === filterValue;
          
          case 'nom':
            return item.nom === filterValue;
          
          case 'description':
            return item.description === filterValue;
          
          case 'statut':
            // Pour les services: statut = Actif/Inactif
            if (filterType === 'services') {
              const itemStatut = item.actif ? 'Actif' : 'Inactif';
              log.debug('📋 Filtre statut service:', { itemStatut, filterValue });
              return itemStatut === filterValue;
            }
            
            // ✅ CORRECTION CRITIQUE: Pour les tarifs, utiliser directement item.statut
            // NE PAS recalculer l'état depuis les dates !
            if (filterType === 'tarifs-standards' || filterType === 'tarifs-speciaux') {
              log.debug('📋 Filtre statut tarif:', { 
                itemStatut: item.statut,
                filterValue,
                match: item.statut === filterValue
              });
              
              // La propriété 'statut' a été définie lors de la normalisation
              // dans TarifStandardGestion (statut = etat enrichi)
              return item.statut === filterValue;
            }
            
            return true;
          
          case 'service':
            // ✅ Priorité : propriétés normalisées en premier
            const serviceName = item.service || item.nomService || '';
            return serviceName === filterValue;
          
          case 'unite':
            // ✅ Priorité : propriétés normalisées en premier
            const uniteName = item.unite || item.nomUnite || '';
            return uniteName === filterValue;
          
          case 'typeTarif':
            // ✅ Priorité : propriétés normalisées en premier
            const typeTarifName = item.typeTarif || item.nomTypeTarif || '';
            return typeTarifName === filterValue;
          
          case 'client':
            // ✅ CORRECTION: Utiliser les propriétés qui contiennent le nom COMPLET
            const clientName = item.client || item.clientNom || '';
            log.debug('👤 Filtre client:', { 
              filterValue, 
              clientName,
              item_client: item.client,
              item_clientNom: item.clientNom,
              match: clientName === filterValue 
            });
            return clientName === filterValue;
          
          default:
            return String(item[field]) === String(filterValue);
        }
      });
    });
    
    log.debug('✅ Résultat filtrage:', { 
      avant: items.length, 
      après: filtered.length 
    });
    
    return filtered;
  }, [filters, filterType]);

  // Données filtrées selon le type
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) {
      log.debug('⚠️ Pas de données à filtrer');
      return [];
    }
    
    log.debug('📊 Filtrage des données:', { 
      filterType, 
      dataLength: data.length,
      filters 
    });
    
    const filterConfig = {};
    const result = applyFilters(data, filterConfig);
    
    log.debug('📈 Résultat final du filtrage:', {
      entrée: data.length,
      sortie: result.length
    });
    
    return result;
  }, [data, applyFilters, filterType, filters]);

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
    filters,
    showFilters,
    hasActiveFilters,
    filteredData,
    filterStats,
    handleFilterChange,
    handleResetFilters,
    handleToggleFilters,
    setFilters,
    setShowFilters
  };
};

/**
 * Fonction utilitaire pour enrichir les données de tarifs avec leur état
 */
export const enrichTarifsWithEtat = (tarifs, currentDate = null) => {
  if (!Array.isArray(tarifs)) return [];
  
  log.debug('🔧 Enrichissement de', tarifs.length, 'tarifs avec état');
  
  const enriched = tarifs.map(tarif => {
    // ✅ CORRECTION: Chercher toutes les variantes possibles de noms de propriétés
    // Pour tarifs standards ET tarifs spéciaux
    const dateDebut = tarif.dateDebutTarifStandard || 
                      tarif.dateDebutTarifSpecial ||
                      tarif.dateDebut || 
                      tarif.date_debut;
                      
    const dateFin = tarif.dateFinTarifStandard || 
                    tarif.dateFinTarifSpecial ||
                    tarif.dateFin || 
                    tarif.date_fin;
    
    const etatCalcule = getEtatValidite(dateDebut, dateFin, currentDate);
    
    log.debug('📅 Tarif enrichi:', {
      id: tarif.id || tarif.idTarifStandard || tarif.idTarifSpecial,
      type: tarif.idTarifStandard ? 'standard' : 'spécial',
      dateDebut,
      dateFin,
      etatCalcule: etatCalcule.etat,
      // Debug: montrer les propriétés trouvées
      source: {
        dateDebutTarifStandard: tarif.dateDebutTarifStandard,
        dateFinTarifStandard: tarif.dateFinTarifStandard,
        dateDebutTarifSpecial: tarif.dateDebutTarifSpecial,
        dateFinTarifSpecial: tarif.dateFinTarifSpecial
      }
    });
    
    return {
      ...tarif,
      etat: etatCalcule.etat, // ✅ 'valide' ou 'invalide' en minuscules
      // Normaliser aussi les dates pour un accès uniforme
      dateDebut: dateDebut || null,
      dateFin: dateFin || null
    };
  });
  
  const stats = {
    total: enriched.length,
    valides: enriched.filter(t => t.etat === 'valide').length,
    invalides: enriched.filter(t => t.etat === 'invalide').length
  };
  
  log.debug('📊 Stats enrichissement:', stats);
  
  return enriched;
};

/**
 * Fonction utilitaire pour créer les filtres initiaux selon le type
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