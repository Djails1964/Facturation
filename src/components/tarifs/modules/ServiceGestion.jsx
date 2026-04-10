// src/components/tarifs/modules/ServiceGestion.jsx
// ✅ VERSION CORRIGÉE avec normalisation des données pour le filtrage

import React, { useState, useMemo } from 'react';
import ServiceTableSection from '../sections/ServiceTableSection';
import { FloatingAddButton } from '../../../components/ui/buttons/ActionButtons';
import TarifFormHeader from '../sections/TarifFormHeader';
import UnifiedFilter from '../../../components/shared/filters/UnifiedFilter';
import { useTarifFilter, createInitialFilters } from '../hooks/useTarifFilter';
import { createLogger } from '../../../utils/createLogger';

const ServiceGestion = ({ 
  services = [],
  highlightedId,
  onCreateService,
  onEditService,
  onDeleteService
}) => {
  const log = createLogger('ServiceGestion');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ SOLUTION: N'afficher le composant que quand les données sont prêtes
  const isDataReady = services.length > 0;
  
  
  // ===== NORMALISATION DES DONNÉES =====
  // 🔧 CORRECTION: Normaliser les services pour que le filtrage fonctionne
  const normalizedServices = useMemo(() => {
    return services.map(service => ({
      ...service,
      // Ajouter les propriétés normalisées attendues par useTarifFilter
      code: service.codeService,
      nom: service.nomService,
      description: service.descriptionService,
      // Le statut est basé sur la propriété 'actif'
      statut: service.actif ? 'Actif' : 'Inactif'
    }));
  }, [services]);
  
  // ===== FILTRAGE =====
  const {
    filters,
    showFilters,
    filteredData: servicesFiltered,
    filterStats,
    handleFilterChange,
    handleResetFilters,
    handleToggleFilters
  } = useTarifFilter(normalizedServices, 'services', createInitialFilters('services'));

  // ===== OPTIONS DE FILTRAGE =====
  const filterOptions = useMemo(() => {
    log.debug('🔍 Préparation filterOptions pour services:', services.length);
    
    // Extraire les valeurs uniques pour chaque champ
    const uniqueCodes = [...new Set(
      services.map(s => s.codeService).filter(Boolean)
    )].sort();
    
    const uniqueNoms = [...new Set(
      services.map(s => s.nomService).filter(Boolean)
    )].sort();
    
    const uniqueDescriptions = [...new Set(
      services.map(s => s.descriptionService).filter(Boolean)
    )].sort();
    
    log.debug('📊 Codes uniques:', uniqueCodes);
    log.debug('📊 Noms uniques:', uniqueNoms);
    log.debug('📊 Descriptions uniques:', uniqueDescriptions);
    
    return {
      code: uniqueCodes,
      nom: uniqueNoms,
      description: uniqueDescriptions,
      statut: ['Actif', 'Inactif']
    };
  }, [services]);

  // ✅ AJOUT: État de chargement pendant l'initialisation
  if (!isDataReady) {
    return (
      <div className="service-gestion">
        <TarifFormHeader
          titre="Gestion des services"
          description="Chargement des services..."
        />
        <div className="loading-container" style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '40px',
          minHeight: '300px'
        }}>
          <div className="spinner"></div>
          <span style={{ marginLeft: '10px' }}>Chargement des données...</span>
        </div>
      </div>
    );
  }

  // ===== HANDLERS =====
  const handleCreateClick = (event) => {
    if (onCreateService) {
      onCreateService(event);
    } else {
      log.warn('⚠️ onCreateService non fourni');
    }
  };
  
  const handleEditClick = (service, event) => {
    const idService = service.id || service.idService;
    if (onEditService) {
      onEditService(idService, event);
    } else {
      log.warn('⚠️ onEditService non fourni');
    }
  };
  
  const handleDeleteClick = (service, event) => {
    const idService = service.id || service.idService;
    const serviceName = service.nomService || service.nom;
    if (onDeleteService) {
      onDeleteService(idService, serviceName, event);
    } else {
      log.warn('⚠️ onDeleteService non fourni');
    }
  };

  return (
    <div className="service-gestion">
      
      {/* Header avec bouton de création */}
      <TarifFormHeader
        titre="Gestion des services"
        description="Gérez les services proposés par votre entreprise"
      >
      </TarifFormHeader>
      
      {/* Filtres unifiés */}
      <UnifiedFilter
        filterType="services"
        filterOptions={filterOptions}
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        showFilters={showFilters}
        onToggleFilters={handleToggleFilters}
        totalCount={filterStats.totalCount}
        filteredCount={filterStats.filteredCount}
        className="filter-services"
      />
      
      {/* Tableau des services */}
      <ServiceTableSection
        services={servicesFiltered}
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
          <strong>🔧 Debug ServiceGestion :</strong><br/>
          - Services chargés : {services.length}<br/>
          - Services normalisés : {normalizedServices.length}<br/>
          - Services filtrés : {servicesFiltered.length}<br/>
          - Filtres actifs : {filterStats.hasActiveFilters ? 'Oui' : 'Non'}<br/>
          - Filtres actuels : {JSON.stringify(filters)}<br/>
          - Highlighted ID : {highlightedId || 'aucun'}<br/>
          - ✅ NORMALISATION ACTIVE
        </div>
      )}

      {/* Bouton flottant ajout */}
      <FloatingAddButton onClick={handleCreateClick} tooltip="Nouveau service" />
    </div>
  );
};

export default ServiceGestion;