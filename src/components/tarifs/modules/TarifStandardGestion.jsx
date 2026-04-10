// src/components/tarifs/modules/TarifStandardGestion.jsx
// ✅ VERSION COMPLÈTE avec UnifiedFilter et normalisation

import React, { useState, useMemo } from 'react';
import TarifTableSection from '../sections/TarifTableSection';
import TarifFormHeader from '../sections/TarifFormHeader';
import UnifiedFilter from '../../../components/shared/filters/UnifiedFilter';
import { useTarifFilter, createInitialFilters, enrichTarifsWithEtat } from '../hooks/useTarifFilter';
import { createLogger } from '../../../utils/createLogger';
import { FloatingAddButton } from '../../../components/ui/buttons/ActionButtons';

const TarifStandardGestion = ({ 
  tarifs, 
  services, 
  unites, 
  typesTarifs, 
  highlightedId,
  onCreateTarif,
  onEditTarif,
  onDeleteTarif
}) => {

  const log = createLogger('TarifStandardGestion');

  const [selectedTarifs, setSelectedTarifs] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ===== ENRICHISSEMENT ET NORMALISATION DES DONNÉES =====
  
  // 1. Enrichir les tarifs avec leur état (valide/invalide)
  const enrichedTarifs = useMemo(() => {
    if (!tarifs || tarifs.length === 0) {
      log.debug('⚠️ Aucun tarif à enrichir');
      return [];
    }
    
    // Debug: Afficher les tarifs BRUTS avant enrichissement
    if (tarifs.length > 0) {
      log.debug('🔍 TARIF BRUT (premier élément):', tarifs[0]);
      log.debug('🔍 Propriétés du tarif brut:', Object.keys(tarifs[0]));
    }
    
    return enrichTarifsWithEtat(tarifs || []);
  }, [tarifs]);

  // 2. Normaliser les tarifs pour le filtrage
  const normalizedTarifs = useMemo(() => {
    log.debug('🔧 Normalisation des tarifs pour filtrage...');
    log.debug('📊 Tarifs enrichis:', enrichedTarifs.length);
    
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
      
      log.debug('📝 Tarif normalisé:', {
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
    
    log.debug('✅ Tarifs normalisés:', normalized.length);
    log.debug('📊 Répartition des statuts:', {
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
    log.debug('🔍 Préparation filterOptions pour tarifs standards');
    
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
    
    log.debug('📊 Services utilisés dans les tarifs:', uniqueServices);
    log.debug('📊 Unités utilisées dans les tarifs:', uniqueUnites);
    log.debug('📊 Types de tarifs utilisés:', uniqueTypesTarifs);
    
    const options = {
      service: uniqueServices,
      unite: uniqueUnites,
      typeTarif: uniqueTypesTarifs,
      statut: ['valide', 'invalide']
    };
    
    log.debug('📋 Options de filtrage configurées:', options);
    
    return options;
  }, [normalizedTarifs]);

  // ===== HANDLERS POUR LE SYSTÈME UNIFIÉ =====
  
  const handleCreateClick = (event) => {
    if (onCreateTarif) {
      onCreateTarif(event);
    } else {
      log.warn('⚠️ onCreateTarif non fourni');
    }
  };
  
  const handleEditClick = (tarif, event) => {
    const tarifId = tarif.id || tarif.idTarifStandard;
    if (onEditTarif) {
      onEditTarif(tarifId, event);
    } else {
      log.warn('⚠️ onEditTarif non fourni');
    }
  };
  
  const handleDeleteClick = (tarif, event) => {
    const tarifId = tarif.id || tarif.idTarifStandard;
    const tarifName = `${tarif.nomService} - ${tarif.nomUnite} - ${tarif.nomTypeTarif}`;
    if (onDeleteTarif) {
      onDeleteTarif(tarifId, tarifName, event);
    } else {
      log.warn('⚠️ onDeleteTarif non fourni');
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
      ></TarifFormHeader>

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
        highlightedId={highlightedId}
        isSubmitting={isSubmitting}
      />
      {/* Bouton flottant ajout */}
      <FloatingAddButton onClick={handleCreateClick} tooltip="Nouveau tarif standard" />
    </div>
  );
};

export default TarifStandardGestion;