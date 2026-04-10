// src/components/tarifs/modules/TypeTarifGestion.jsx
// ✅ VERSION MIGRÉE vers UnifiedFilter avec normalisation des données

import React, { useState, useMemo } from 'react';
import TypeTarifTableSection from '../sections/TypeTarifTableSection';
import TarifFormHeader from '../sections/TarifFormHeader';
import { FloatingAddButton } from '../../../components/ui/buttons/ActionButtons';
import UnifiedFilter from '../../../components/shared/filters/UnifiedFilter';
import { useTarifFilter, createInitialFilters } from '../hooks/useTarifFilter';
import { createLogger } from '../../../utils/createLogger';

const TypeTarifGestion = ({ 
  typesTarifs = [], 
  highlightedId,
  onCreateTypeTarif,
  onEditTypeTarif,
  onDeleteTypeTarif
}) => {

  const log = createLogger('TypeTarifGestion');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // ===== NORMALISATION DES DONNÉES =====
  // Les types de tarifs arrivent avec : idTypeTarif, codeTypeTarif, nomTypeTarif, descriptionTypeTarif
  // On les normalise pour le système de filtrage
  const normalizedTypesTarifs = useMemo(() => {
    if (!typesTarifs || !Array.isArray(typesTarifs)) return [];
    
    return typesTarifs.map(typeTarif => {
      if (!typeTarif) return null;
      
      return {
        ...typeTarif,
        // Normalisation vers les propriétés attendues par useTarifFilter
        id: typeTarif.idTypeTarif || typeTarif.id,
        code: typeTarif.codeTypeTarif || typeTarif.code,
        nom: typeTarif.nomTypeTarif || typeTarif.nom,
        description: typeTarif.descriptionTypeTarif || typeTarif.description || ''
      };
    }).filter(Boolean);
  }, [typesTarifs]);

  // ===== FILTRAGE =====
  const {
    filters,
    showFilters,
    filteredData: typeTarifsFiltered,
    filterStats,
    handleFilterChange,
    handleResetFilters,
    handleToggleFilters
  } = useTarifFilter(normalizedTypesTarifs, 'types-tarifs', createInitialFilters('types-tarifs'));

  // ===== OPTIONS DE FILTRAGE =====
  const filterOptions = useMemo(() => {
    log.debug('🔍 Préparation filterOptions pour types de tarifs:', typesTarifs.length);
    
    // Extraire les valeurs uniques pour chaque champ
    const uniqueCodes = [...new Set(
      typesTarifs.map(t => t.codeTypeTarif).filter(Boolean)
    )].sort();
    
    const uniqueNoms = [...new Set(
      typesTarifs.map(t => t.nomTypeTarif).filter(Boolean)
    )].sort();
    
    const uniqueDescriptions = [...new Set(
      typesTarifs.map(t => t.descriptionTypeTarif).filter(Boolean)
    )].sort();
    
    log.debug('📊 Codes uniques:', uniqueCodes);
    log.debug('📊 Noms uniques:', uniqueNoms);
    log.debug('📊 Descriptions uniques:', uniqueDescriptions);
    
    return {
      code: uniqueCodes,
      nom: uniqueNoms,
      description: uniqueDescriptions
      // Note: Pas de statut pour les types de tarifs
    };
  }, [typesTarifs]);

  // ===== HANDLERS POUR LE SYSTÈME UNIFIÉ =====
  
  const handleCreateClick = (event) => {
    if (onCreateTypeTarif) {
      onCreateTypeTarif(event);
    } else {
      log.warn('⚠️ onCreateTypeTarif non fourni');
    }
  };
  
  const handleEditClick = (typeTarif, event) => {
    const typeTarifId = typeTarif.id || typeTarif.idTypeTarif;
    if (onEditTypeTarif) {
      onEditTypeTarif(typeTarifId, event);
    } else {
      log.warn('⚠️ onEditTypeTarif non fourni');
    }
  };
  
  const handleDeleteClick = (typeTarif, event) => {
    const typeTarifId = typeTarif.id || typeTarif.idTypeTarif;
    const typeTarifName = typeTarif.nomTypeTarif || typeTarif.nom;
    if (onDeleteTypeTarif) {
      onDeleteTypeTarif(typeTarifId, typeTarifName, event);
    } else {
      log.warn('⚠️ onDeleteTypeTarif non fourni');
    }
  };

  // ===== RENDU PRINCIPAL =====
  
  return (
    <div className="type-tarif-gestion">
      
      {/* Header avec bouton de création */}
      <TarifFormHeader
        titre="Gestion des types de tarifs"
        description="Gérez les différents types de tarification (Normal, Étudiant, Thérapeutique, etc.)"
      >
      </TarifFormHeader>

      {/* Filtres unifiés */}
      <UnifiedFilter
        filterType="types-tarifs"
        filterOptions={filterOptions}
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        showFilters={showFilters}
        onToggleFilters={handleToggleFilters}
        totalCount={filterStats.totalCount}
        filteredCount={filterStats.filteredCount}
        className="filter-types-tarifs"
      />

      {/* Tableau des types de tarifs filtrés */}
      <TypeTarifTableSection
        typesTarifs={typeTarifsFiltered}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
        highlightedId={highlightedId}
        isSubmitting={isSubmitting}
      />
      {/* Bouton flottant ajout */}
      <FloatingAddButton onClick={handleCreateClick} tooltip="Nouveau type de tarif" />
    </div>
  );
};

export default TypeTarifGestion;