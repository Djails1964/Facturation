// src/components/shared/filters/UnifiedFilter.jsx
// ✅ VERSION ÉTENDUE avec support complet des tarifs

import React, { useMemo, useCallback, useEffect } from 'react';
import '../../../styles/shared/UnifiedFilter.css';
import { createLogger } from '../../../utils/createLogger';

const log = createLogger('UnifiedFilter');

/**
 * Composant de filtre unifiié réutilisable
 * Supporte : factures, paiements, services, unites, types-tarifs, tarifs-standards, tarifs-speciaux
 */
const UnifiedFilter = ({
  // Configuration
  filterType, // 'factures', 'paiements', 'services', 'unites', 'types-tarifs', 'tarifs-standards', 'tarifs-speciaux'
  
  // Données pour les options
  filterOptions = {},
  
  // État
  filters = {},
  onFilterChange,
  onResetFilters,
  
  // Affichage
  showFilters = false,
  onToggleFilters,
  
  // Options
  className = '',
  totalCount = 0,
  filteredCount = 0
}) => {

  log.debug("totalCount : ", totalCount);
  log.debug("filteredCount : ", filteredCount);

  // Configuration selon le type
  const filterConfig = useMemo(() => {
    switch (filterType) {
      case 'factures':
        return {
          fields: ['annee', 'client', 'etat'],
          labels: {
            annee: 'Année',
            client: 'Client',
            etat: 'État'
          },
          defaultLabels: {
            annee: 'Toutes les années',
            client: 'Tous les clients',
            etat: null // ✅ Pas d'option par défaut pour état (géré par les options)
          }
        };

      case 'paiements':
        return {
          fields: ['annee', 'mois', 'client', 'methode', 'statut'],
          labels: {
            annee: 'Année',
            mois: 'Mois',
            client: 'Client',
            methode: 'Méthode',
            statut: 'Statut'
          },
          defaultLabels: {
            annee: 'Toutes les années',
            mois: 'Tous les mois',
            client: 'Tous les clients',
            methode: 'Toutes les méthodes',
            statut: 'Tous les statuts'
          }
        };

      // ✅ NOUVEAUX TYPES POUR TARIFS
      case 'services':
        return {
          fields: ['code', 'nom', 'description', 'statut'],
          labels: {
            code: 'Code',
            nom: 'Nom',
            description: 'Description',
            statut: 'Statut'
          },
          defaultLabels: {
            code: 'Tous les codes',
            nom: 'Tous les noms',
            description: 'Toutes les descriptions',
            statut: 'Tous les statuts'
          }
        };

      case 'unites':
        return {
          fields: ['code', 'nom', 'description'],
          labels: {
            code: 'Code',
            nom: 'Nom',
            description: 'Description'
          },
          defaultLabels: {
            code: 'Tous les codes',
            nom: 'Tous les noms',
            description: 'Toutes les descriptions'
          }
        };

      case 'types-tarifs':
        return {
          fields: ['code', 'nom', 'description'],
          labels: {
            code: 'Code',
            nom: 'Nom',
            description: 'Description'
          },
          defaultLabels: {
            code: 'Tous les codes',
            nom: 'Tous les noms',
            description: 'Toutes les descriptions'
          }
        };

      case 'tarifs-standards':
      case 'tarifs':
        return {
          fields: ['service', 'unite', 'typeTarif', 'statut'],
          labels: {
            service: 'Service',
            unite: 'Unité',
            typeTarif: 'Type',
            statut: 'État'
          },
          defaultLabels: {
            service: 'Tous les services',
            unite: 'Toutes les unités',
            typeTarif: 'Tous les types',
            statut: 'Tous les états'
          }
        };

      case 'tarifs-speciaux':
        return {
          fields: ['client', 'service', 'unite', 'statut'],
          labels: {
            client: 'Client',
            service: 'Service',
            unite: 'Unité',
            statut: 'État'
          },
          defaultLabels: {
            client: 'Tous les clients',
            service: 'Tous les services',
            unite: 'Toutes les unités',
            statut: 'Tous les états'
          }
        };

      default:
        return { fields: [], labels: {}, defaultLabels: {} };
    }
  }, [filterType]);

  // Vérifier filtres actifs
  const hasActiveFilters = useMemo(() => {
    return Object.entries(filters).some(([key, value]) => {
      // Pour l'état des factures, "Sans annulées" est la valeur par défaut, donc pas considéré comme filtre actif
      if (filterType === 'factures' && key === 'etat' && value === 'Sans annulées') {
        return false;
      }
      return value && value !== '' && value !== 'Tous';
    });
  }, [filters, filterType]);

  // Gestionnaire de changement
  const handleFilterChange = useCallback((field, value) => {
    if (onFilterChange) {
      onFilterChange(field, value);
    }
  }, [onFilterChange]);

  // Rendu d'un filtre
  const renderFilter = useCallback((field) => {
    const options = filterOptions[field] || [];
    const defaultLabel = filterConfig.defaultLabels[field];
    
    return (
      <div key={`filter-${field}`} className="input-group">
        <select
          value={filters[field] || ''}
          onChange={(e) => handleFilterChange(field, e.target.value)}
        >
          {/* ✅ N'afficher l'option par défaut que si elle est définie */}
          {defaultLabel && (
            <option value="">{defaultLabel}</option>
          )}
          {options.map((option, index) => {
            const value = option.value !== undefined ? option.value : option;
            const label = option.label || option;
            return (
              <option key={`${field}-${value}-${index}`} value={value}>
                {label}
              </option>
            );
          })}
        </select>
        <label>{filterConfig.labels[field]}</label>
      </div>
    );
  }, [filters, filterOptions, filterConfig, handleFilterChange]);

  if (!filterConfig.fields.length) return null;

  return (
    <div className={`unified-filters ${className}`}>
      {/* Bouton toggle */}
      <button 
        className="btn-primary filters-toggle"
        onClick={onToggleFilters}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
        </svg>
        Filtres
        
        {hasActiveFilters && (
          <>
          {log.debug('Badge debug:', { filteredCount, totalCount, display: `${filteredCount} sur ${totalCount}` })}
          <span className="filter-active-badge">
            {filteredCount} sur {totalCount}
          </span>
          </>
        )}
      </button>
      
      {/* Panel de filtres */}
      {showFilters && (
        <div className="filters-panel">
          <div className="filter-row">
            {filterConfig.fields.map(field => renderFilter(field))}
            
            <div className="filter-actions">
              <button 
                onClick={onResetFilters} 
                className="btn-secondary"
                disabled={!hasActiveFilters}
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedFilter;