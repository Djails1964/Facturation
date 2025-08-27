// ServiceGestion.jsx - Version avec filtre intégré
import React, { useState, useEffect } from 'react';
import ServiceTableSection from '../sections/ServiceTableSection';
import { AddButton } from '../../../components/ui/buttons';
import TarifFormHeader from '../sections/TarifFormHeader';
import TarifFilter from '../components/TarifFilter';
import { useTarifFilter, createInitialFilters } from '../hooks/useTarifFilter';

const ServiceGestion = ({ 
  services = [],
  loadServices,
  highlightedId,
  tarificationService,
  setMessage,
  setMessageType,
  setConfirmModal,
  // Nouveaux handlers du système unifié
  onCreateService,
  onEditService,
  onDeleteService
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // ===== HANDLERS POUR LE SYSTÈME UNIFIÉ =====
  
  const handleCreateClick = (event) => {
    if (onCreateService) {
      // Utiliser le nouveau système unifié
      onCreateService(event);
    } else {
      // Fallback vers l'ancien système (deprecated)
      console.warn('⚠️ onCreateService non fourni, utilisation du système legacy');
      handleLegacyCreate();
    }
  };
  
  const handleEditClick = (service, event) => {
    if (onEditService) {
      // Utiliser le nouveau système unifié
      onEditService(service.idService || service.id, event);
    } else {
      // Fallback vers l'ancien système (deprecated)
      console.warn('⚠️ onEditService non fourni, utilisation du système legacy');
      handleLegacyEdit(service);
    }
  };
  
  const handleDeleteClick = (service, event) => {
    if (onDeleteService) {
      // Utiliser le nouveau système unifié
      onDeleteService(service.idService || service.id, service.nom, event);
    } else {
      // Fallback vers l'ancien système (deprecated)
      console.warn('⚠️ onDeleteService non fourni, utilisation du système legacy');
      handleLegacyDelete(service);
    }
  };
  
  // ===== LEGACY HANDLERS (DEPRECATED) =====
  const handleLegacyCreate = () => {
    console.log('🔧 Legacy create handler appelé');
  };
  
  const handleLegacyEdit = (service) => {
    console.log('🔧 Legacy edit handler appelé:', service);
  };
  
  const handleLegacyDelete = (service) => {
    console.log('🔧 Legacy delete handler appelé:', service);
  };
  // ===== INTÉGRATION DU FILTRE =====
  const {
    filters,
    showFilters,
    filteredData: servicesFiltered,
    filterStats,
    handleFilterChange,
    handleResetFilters,
    handleToggleFilters
  } = useTarifFilter(services, 'services', createInitialFilters('services'));

  // ===== RENDU PRINCIPAL =====
  
  return (
    <div className="service-gestion">
      
      {/* Header avec bouton de création */}
      <TarifFormHeader
        titre="Gestion des services"
        description="Gérez les services proposés par votre entreprise"
      >
        <AddButton onClick={handleCreateClick}>
          Nouveau service
        </AddButton>
      </TarifFormHeader>
      
      {/* ===== FILTRE - NOUVELLE INTÉGRATION ===== */}
      <TarifFilter
        filterType="services"
        data={services}
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        showFilters={showFilters}
        onToggleFilters={handleToggleFilters}
        totalCount={filterStats.totalCount}
        filteredCount={filterStats.filteredCount}
        className="filter-services"
      />
      
      {/* Utilisation de ServiceTableSection avec données filtrées */}
      <ServiceTableSection
        services={servicesFiltered}
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
          <strong>🔧 Debug ServiceGestion :</strong><br/>
          - Services chargés : {services.length}<br/>
          - Services filtrés : {servicesFiltered.length}<br/>
          - Filtres actifs : {filterStats.hasActiveFilters ? 'Oui' : 'Non'}<br/>
          - Highlighted ID : {highlightedId || 'aucun'}<br/>
          - Système unifié : {onCreateService ? '✅ Actif' : '❌ Non connecté'}<br/>
          - Is submitting : {isSubmitting ? 'Oui' : 'Non'}<br/>
          - Filtres actuels : {JSON.stringify(filters)}
        </div>
      )}
    </div>
  );
};

export default ServiceGestion;