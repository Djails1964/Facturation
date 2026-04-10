// src/components/tarifs/modules/UniteGestion.jsx
// ✅ VERSION MIGRÉE vers UnifiedFilter avec normalisation des données

import React, { useState, useMemo } from 'react';
import UniteTableSection from '../sections/UniteTableSection';
import { FloatingAddButton } from '../../../components/ui/buttons/ActionButtons';
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
      code:                  unite.codeUnite,
      nom:                   unite.nomUnite,
      abreviationUnite:      unite.abreviationUnite || '',
      descriptionUnite:      unite.descriptionUnite || '',
      permetMultiplicateur:  !!unite.permet_multiplicateur,
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

      {/* Bouton flottant ajout */}
      <FloatingAddButton onClick={handleCreateClick} tooltip="Nouvelle unité" />
    </div>
  );
};

export default UniteGestion;