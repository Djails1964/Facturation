// src/components/tarifs/modules/UniteGestion.jsx
// ✅ VERSION MIGRÉE vers UnifiedFilter avec normalisation des données

import React, { useState, useMemo } from 'react';
import UniteTableSection from '../sections/UniteTableSection';
import { AddButton } from '../../../components/ui/buttons';
import TarifFormHeader from '../sections/TarifFormHeader';
import UnifiedFilter from '../../../components/shared/filters/UnifiedFilter';
import { useTarifFilter, createInitialFilters } from '../hooks/useTarifFilter';
import { createLogger } from '../../../utils/createLogger';

const UniteGestion = ({ 
  unites = [],
  highlightedId,
  onCreateUnite,
  onEditUnite,
  onDeleteUnite
}) => {

  const log = createLogger('UniteGestion');

  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // ===== NORMALISATION DES DONNÉES =====
  // 🔧 Normaliser les unités pour que le filtrage fonctionne
  const normalizedUnites = useMemo(() => {
    return unites.map(unite => ({
      ...unite,
      // Ajouter les propriétés normalisées attendues par useTarifFilter
      code: unite.codeUnite,
      nom: unite.nomUnite,
      description: unite.descriptionUnite || ''
      // Note: Les unités n'ont pas de statut actif/inactif
    }));
  }, [unites]);
  
  // ===== FILTRAGE =====
  const {
    filters,
    showFilters,
    filteredData: unitesFiltered,
    filterStats,
    handleFilterChange,
    handleResetFilters,
    handleToggleFilters
  } = useTarifFilter(normalizedUnites, 'unites', createInitialFilters('unites'));

  // ===== OPTIONS DE FILTRAGE =====
  const filterOptions = useMemo(() => {
    log.debug('🔍 Préparation filterOptions pour unités:', unites.length);
    
    // Extraire les valeurs uniques pour chaque champ
    const uniqueCodes = [...new Set(
      unites.map(u => u.codeUnite).filter(Boolean)
    )].sort();
    
    const uniqueNoms = [...new Set(
      unites.map(u => u.nomUnite).filter(Boolean)
    )].sort();
    
    const uniqueDescriptions = [...new Set(
      unites.map(u => u.descriptionUnite).filter(Boolean)
    )].sort();
    
    log.debug('📊 Codes uniques:', uniqueCodes);
    log.debug('📊 Noms uniques:', uniqueNoms);
    log.debug('📊 Descriptions uniques:', uniqueDescriptions);
    
    return {
      code: uniqueCodes,
      nom: uniqueNoms,
      description: uniqueDescriptions
      // Note: Pas de statut pour les unités
    };
  }, [unites]);

  // ===== HANDLERS POUR LE SYSTÈME UNIFIÉ =====
  
  const handleCreateClick = (event) => {
    if (onCreateUnite) {
      onCreateUnite(event);
    } else {
      log.warn('⚠️ onCreateUnite non fourni');
    }
  };
  
  const handleEditClick = (unite, event) => {
    const idUnite = unite.id || unite.idUnite;
    if (onEditUnite) {
      onEditUnite(idUnite, event);
    } else {
      log.warn('⚠️ onEditUnite non fourni');
    }
  };
  
  const handleDeleteClick = (unite, event) => {
    const idUnite = unite.id || unite.idUnite;
    const uniteName = unite.nomUnite || unite.nom;
    if (onDeleteUnite) {
      onDeleteUnite(idUnite, uniteName, event);
    } else {
      log.warn('⚠️ onDeleteUnite non fourni');
    }
  };

  // ===== RENDU PRINCIPAL =====
  
  return (
    <div className="unite-gestion">
      
      {/* Header avec bouton de création */}
      <TarifFormHeader
        titre="Gestion des unités"
        description="Gérez les unités de mesure utilisées dans vos services"
      >
        <AddButton onClick={handleCreateClick}>
          Nouvelle unité
        </AddButton>
      </TarifFormHeader>
      
      {/* Filtres unifiés */}
      <UnifiedFilter
        filterType="unites"
        filterOptions={filterOptions}
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        showFilters={showFilters}
        onToggleFilters={handleToggleFilters}
        totalCount={filterStats.totalCount}
        filteredCount={filterStats.filteredCount}
        className="filter-unites"
      />
      
      {/* Tableau des unités */}
      <UniteTableSection
        unites={unitesFiltered}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
        highlightedId={highlightedId}
        isSubmitting={isSubmitting}
      />
      
      {/* Informations de debug */}
      {process.env.NODE_ENV === 'development' && (
        <div className="debug-info" style={{
          marginTop: '20px',
          padding: '10px',
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          <strong>🔧 Debug UniteGestion :</strong><br/>
          - Unités chargées : {unites.length}<br/>
          - Unités normalisées : {normalizedUnites.length}<br/>
          - Unités filtrées : {unitesFiltered.length}<br/>
          - Filtres actifs : {filterStats.hasActiveFilters ? 'Oui' : 'Non'}<br/>
          - Filtres actuels : {JSON.stringify(filters)}<br/>
          - Highlighted ID : {highlightedId || 'aucun'}<br/>
          - ✅ MIGRATION UNIFIEDFILTER COMPLÈTE
        </div>
      )}
    </div>
  );
};

export default UniteGestion;