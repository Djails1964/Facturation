// UniteGestion.jsx - Version avec UniteTableSection et filtre intégré
import React, { useState, useEffect } from 'react';
import UniteTableSection from '../sections/UniteTableSection';
import { AddButton } from '../../../components/ui/buttons';
import TarifFormHeader from '../sections/TarifFormHeader';
import TarifFilter from '../components/TarifFilter';
import { useTarifFilter, createInitialFilters } from '../hooks/useTarifFilter';

const UniteGestion = ({ 
  unites = [],
  loadUnites,
  highlightedId,
  tarificationService,
  setMessage,
  setMessageType,
  setConfirmModal,
  // Nouveaux handlers du système unifié
  onCreateUnite,
  onEditUnite,
  onDeleteUnite
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // ===== INTÉGRATION DU FILTRE =====
  const {
    filters,
    showFilters,
    filteredData: unitesFiltered,
    filterStats,
    handleFilterChange,
    handleResetFilters,
    handleToggleFilters
  } = useTarifFilter(unites, 'unites', createInitialFilters('unites'));

  // ===== HANDLERS POUR LE SYSTÈME UNIFIÉ =====
  
  const handleCreateClick = (event) => {
    if (onCreateUnite) {
      // Utiliser le nouveau système unifié
      onCreateUnite(event);
    } else {
      // Fallback vers l'ancien système (deprecated)
      console.warn('⚠️ onCreateUnite non fourni, utilisation du système legacy');
      handleLegacyCreate();
    }
  };
  
  const handleEditClick = (unite, event) => {
    if (onEditUnite) {
      // Utiliser le nouveau système unifié
      onEditUnite(unite.idUnite || unite.id, event);
    } else {
      // Fallback vers l'ancien système (deprecated)
      console.warn('⚠️ onEditUnite non fourni, utilisation du système legacy');
      handleLegacyEdit(unite);
    }
  };
  
  const handleDeleteClick = (unite, event) => {
    if (onDeleteUnite) {
      // Utiliser le nouveau système unifié
      onDeleteUnite(unite.idUnite || unite.id, unite.nom, event);
    } else {
      // Fallback vers l'ancien système (deprecated)
      console.warn('⚠️ onDeleteUnite non fourni, utilisation du système legacy');
      handleLegacyDelete(unite);
    }
  };
  
  // ===== LEGACY HANDLERS (DEPRECATED) =====
  const handleLegacyCreate = () => {
    console.log('🔧 Legacy create handler appelé');
  };
  
  const handleLegacyEdit = (unite) => {
    console.log('🔧 Legacy edit handler appelé:', unite);
  };
  
  const handleLegacyDelete = (unite) => {
    console.log('🔧 Legacy delete handler appelé:', unite);
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
      
      {/* ===== FILTRE - NOUVELLE INTÉGRATION ===== */}
      <TarifFilter
        filterType="unites"
        data={unites}
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        showFilters={showFilters}
        onToggleFilters={handleToggleFilters}
        totalCount={filterStats.totalCount}
        filteredCount={filterStats.filteredCount}
        className="filter-unites"
      />
      
      {/* Utilisation d'UniteTableSection avec données filtrées */}
      <UniteTableSection
        unites={unitesFiltered}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
        highlightedId={highlightedId}
        isSubmitting={isSubmitting}
      />
      
      {/* Informations de debug en mode développement */}
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
          - Unités filtrées : {unitesFiltered.length}<br/>
          - Filtres actifs : {filterStats.hasActiveFilters ? 'Oui' : 'Non'}<br/>
          - Highlighted ID : {highlightedId || 'aucun'}<br/>
          - Système unifié : {onCreateUnite ? '✅ Actif' : '❌ Non connecté'}<br/>
          - Is submitting : {isSubmitting ? 'Oui' : 'Non'}<br/>
          - Filtres actuels : {JSON.stringify(filters)}
        </div>
      )}
    </div>
  );
};

export default UniteGestion;