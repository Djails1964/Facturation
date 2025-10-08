// src/components/tarifs/modules/TarifStandardGestion.jsx
// ✅ VERSION COMPLÈTE avec UnifiedFilter et normalisation

import React, { useState, useMemo } from 'react';
import TarifTableSection from '../sections/TarifTableSection';
import TarifFormHeader from '../sections/TarifFormHeader';
import { AddButton } from '../../../components/ui/buttons';
import UnifiedFilter from '../../../components/shared/filters/UnifiedFilter';
import { useTarifFilter, createInitialFilters, enrichTarifsWithEtat } from '../hooks/useTarifFilter';

const TarifStandardGestion = ({ 
  tarifs, 
  setTarifs, 
  services, 
  unites, 
  typesTarifs, 
  serviceUnites, 
  loadUnitesByService,
  tarificationService, 
  setSelectedidService, 
  setMessage, 
  setMessageType, 
  setConfirmModal,
  loadTarifs,
  highlightedId,
  onEdit,
  onView,
  onNew,
  onCreateFacture,
  onBulkAction,
  onCreateTarif,
  onEditTarif,
  onDeleteTarif
}) => {
  const [selectedTarifs, setSelectedTarifs] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ===== ENRICHISSEMENT ET NORMALISATION DES DONNÉES =====
  
  // 1. Enrichir les tarifs avec leur état (valide/invalide)
  const enrichedTarifs = useMemo(() => {
    if (!tarifs || tarifs.length === 0) {
      console.log('⚠️ Aucun tarif à enrichir');
      return [];
    }
    
    // Debug: Afficher les tarifs BRUTS avant enrichissement
    if (tarifs.length > 0) {
      console.log('🔍 TARIF BRUT (premier élément):', tarifs[0]);
      console.log('🔍 Propriétés du tarif brut:', Object.keys(tarifs[0]));
    }
    
    return enrichTarifsWithEtat(tarifs || []);
  }, [tarifs]);

  // 2. Normaliser les tarifs pour le filtrage
  const normalizedTarifs = useMemo(() => {
    console.log('🔧 Normalisation des tarifs pour filtrage...');
    console.log('📊 Tarifs enrichis:', enrichedTarifs.length);
    
    const normalized = enrichedTarifs.map(tarif => {
      // Trouver les entités liées
      const service = services.find(s => 
        (s.id || s.idService) === (tarif.idService)
      );
      const unite = unites.find(u => 
        (u.id || u.idUnite) === (tarif.idUnite)
      );
      const typeTarif = typesTarifs.find(t => 
        (t.id || t.idTypeTarif) === (tarif.idTypeTarif || tarif.type_tarif_id)
      );

      // S'assurer que statut a la bonne valeur
      const tarifStatut = tarif.etat || 'invalide';
      
      console.log('📝 Tarif normalisé:', {
        id: tarif.id || tarif.idTarifStandard,
        etat: tarif.etat,
        statut: tarifStatut,
        service: service?.nomService,
        dates: {
          debut: tarif.dateDebutTarifStandard || tarif.date_debut,
          fin: tarif.dateFinTarifStandard || tarif.date_fin
        }
      });

      return {
        ...tarif,
        // Propriétés normalisées pour le filtrage
        service: service?.nomService || '',
        unite: unite?.nomUnite || '',
        typeTarif: typeTarif?.nomTypeTarif || '',
        statut: tarifStatut, // 'valide' ou 'invalide'
        
        // Conserver aussi les noms pour l'affichage
        nomService: service?.nomService || '',
        nomUnite: unite?.nomUnite || '',
        nomTypeTarif: typeTarif?.nomTypeTarif || ''
      };
    });
    
    console.log('✅ Tarifs normalisés:', normalized.length);
    console.log('📊 Répartition des statuts:', {
      valides: normalized.filter(t => t.statut === 'valide').length,
      invalides: normalized.filter(t => t.statut === 'invalide').length
    });
    
    return normalized;
  }, [enrichedTarifs, services, unites, typesTarifs]);

  // ===== FILTRAGE =====
  const {
    filters,
    showFilters,
    filteredData: tarifsFiltered,
    filterStats,
    handleFilterChange,
    handleResetFilters,
    handleToggleFilters
  } = useTarifFilter(normalizedTarifs, 'tarifs-standards', createInitialFilters('tarifs-standards'));

  // ===== OPTIONS DE FILTRAGE =====
  const filterOptions = useMemo(() => {
    console.log('🔍 Préparation filterOptions pour tarifs standards');
    
    // ✅ CORRECTION: Extraire uniquement les services/unités/types UTILISÉS dans les tarifs
    const uniqueServices = [...new Set(
      normalizedTarifs.map(t => t.service).filter(Boolean)
    )].sort();
    
    const uniqueUnites = [...new Set(
      normalizedTarifs.map(t => t.unite).filter(Boolean)
    )].sort();
    
    const uniqueTypesTarifs = [...new Set(
      normalizedTarifs.map(t => t.typeTarif).filter(Boolean)
    )].sort();
    
    console.log('📊 Services utilisés dans les tarifs:', uniqueServices);
    console.log('📊 Unités utilisées dans les tarifs:', uniqueUnites);
    console.log('📊 Types de tarifs utilisés:', uniqueTypesTarifs);
    
    const options = {
      service: uniqueServices,
      unite: uniqueUnites,
      typeTarif: uniqueTypesTarifs,
      statut: ['valide', 'invalide']
    };
    
    console.log('📋 Options de filtrage configurées:', options);
    
    return options;
  }, [normalizedTarifs]);

  // ===== HANDLERS POUR LE SYSTÈME UNIFIÉ =====
  
  const handleCreateClick = (event) => {
    if (onCreateTarif) {
      onCreateTarif(event);
    } else {
      console.warn('⚠️ onCreateTarif non fourni');
    }
  };
  
  const handleEditClick = (tarif, event) => {
    const tarifId = tarif.id || tarif.idTarifStandard;
    if (onEditTarif) {
      onEditTarif(tarifId, event);
    } else {
      console.warn('⚠️ onEditTarif non fourni');
    }
  };
  
  const handleDeleteClick = (tarif, event) => {
    const tarifId = tarif.id || tarif.idTarifStandard;
    const tarifName = `${tarif.nomService} - ${tarif.nomUnite} - ${tarif.nomTypeTarif}`;
    if (onDeleteTarif) {
      onDeleteTarif(tarifId, tarifName, event);
    } else {
      console.warn('⚠️ onDeleteTarif non fourni');
    }
  };

  // ===== HANDLERS DE SÉLECTION =====
  const handleSelectTarif = (tarifId) => {
    setSelectedTarifs(prev => 
      prev.includes(tarifId)
        ? prev.filter(id => id !== tarifId)
        : [...prev, tarifId]
    );
  };

  const handleSelectAll = (selected) => {
    if (selected) {
      setSelectedTarifs(tarifsFiltered.map(t => t.id || t.idTarifStandard));
    } else {
      setSelectedTarifs([]);
    }
  };

  // ===== RENDU PRINCIPAL =====
  
  return (
    <div className="tarif-standard-gestion">
      
      {/* Header avec bouton de création */}
      <TarifFormHeader
        titre="Gestion des tarifs standards"
        description="Gérez les tarifs standards applicables à tous les clients"
      >
        <AddButton onClick={handleCreateClick}>
          Nouveau tarif
        </AddButton>
      </TarifFormHeader>

      {/* Filtres unifiés */}
      <UnifiedFilter
        filterType="tarifs-standards"
        filterOptions={filterOptions}
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        showFilters={showFilters}
        onToggleFilters={handleToggleFilters}
        totalCount={filterStats.totalCount}
        filteredCount={filterStats.filteredCount}
        className="filter-tarifs-standards"
      />

      {/* Tableau des tarifs */}
      <TarifTableSection
        tarifs={tarifsFiltered}
        services={services}
        unites={unites}
        typesTarifs={typesTarifs}
        selectedTarifs={selectedTarifs}
        onSelectTarif={handleSelectTarif}
        onSelectAll={handleSelectAll}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
        onView={onView}
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
          <strong>🔧 Debug TarifStandardGestion :</strong><br/>
          - Tarifs chargés : {tarifs?.length || 0}<br/>
          - Tarifs enrichis : {enrichedTarifs.length}<br/>
          - Tarifs normalisés : {normalizedTarifs.length}<br/>
          - Tarifs filtrés : {tarifsFiltered.length}<br/>
          - Filtres actifs : {filterStats.hasActiveFilters ? 'Oui' : 'Non'}<br/>
          - Filtres actuels : {JSON.stringify(filters)}<br/>
          - Services : {services?.length || 0}<br/>
          - Unités : {unites?.length || 0}<br/>
          - Types de tarifs : {typesTarifs?.length || 0}<br/>
          - Sélectionnés : {selectedTarifs.length}<br/>
          - Highlighted ID : {highlightedId || 'aucun'}<br/>
          - ✅ MIGRATION UNIFIEDFILTER COMPLÈTE
        </div>
      )}
    </div>
  );
};

export default TarifStandardGestion;