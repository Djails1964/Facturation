// src/components/tarifs/modules/TarifSpecialGestion.jsx
// ✅ VERSION MIGRÉE vers UnifiedFilter avec normalisation des données

import React, { useState, useEffect, useMemo } from 'react';
import TarifSpecialTableSection from '../sections/TarifSpecialTableSection';
import TarifFormHeader from '../sections/TarifFormHeader';
import { AddButton } from '../../../components/ui/buttons';
import UnifiedFilter from '../../../components/shared/filters/UnifiedFilter';
import { useTarifFilter, createInitialFilters, enrichTarifsWithEtat } from '../hooks/useTarifFilter';

const TarifSpecialGestion = ({ 
  tarifsSpeciaux, 
  setTarifsSpeciaux, 
  services, 
  unites, 
  clients, 
  serviceUnites, 
  loadUnitesByService,
  tarificationService, 
  setSelectedidService, 
  setMessage, 
  setMessageType, 
  setConfirmModal,
  loadTarifsSpeciaux,
  highlightedId,
  onEdit,
  onView,
  onNew,
  onCreateFacture,
  onBulkAction,
  onCreateTarifSpecial,
  onEditTarifSpecial,
  onDeleteTarifSpecial
}) => {
  const [selectedTarifsSpeciaux, setSelectedTarifsSpeciaux] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ===== ENRICHISSEMENT ET NORMALISATION DES DONNÉES =====
  
  // 1. Enrichir les tarifs spéciaux avec leur état (valide/invalide)
  const enrichedTarifsSpeciaux = useMemo(() => {
    // Les tarifs arrivent via props depuis useTarifGestionState
    if (!tarifsSpeciaux || tarifsSpeciaux.length === 0) {
      console.log('⚠️ Aucun tarif spécial à enrichir');
      return [];
    }
    
    // Debug: Afficher les tarifs BRUTS avant enrichissement
    if (tarifsSpeciaux.length > 0) {
      console.log('🔍 TARIF SPÉCIAL BRUT (premier élément):', tarifsSpeciaux[0]);
      console.log('🔍 Propriétés du tarif spécial brut:', Object.keys(tarifsSpeciaux[0]));
    }
    
    return enrichTarifsWithEtat(tarifsSpeciaux);
  }, [tarifsSpeciaux]);

  // 2. Normaliser les tarifs spéciaux pour le filtrage
  const normalizedTarifsSpeciaux = useMemo(() => {
    console.log('🔧 Normalisation des tarifs spéciaux pour filtrage...');
    console.log('📊 Tarifs spéciaux enrichis:', enrichedTarifsSpeciaux.length);
    
    const normalized = enrichedTarifsSpeciaux.map(tarif => {
      // Trouver les entités liées
      const client = clients.find(c => 
        c.id == (tarif.idClient)
      );
      const service = services.find(s => 
        (s.id || s.idService) === tarif.idService
      );
      const unite = unites.find(u => 
        (u.id || u.idUnite) === tarif.idUnite
      );

      // ✅ S'assurer que statut a la bonne valeur
      const tarifStatut = tarif.etat || 'invalide';
      
      const clientNom = client ? `${client.prenom} ${client.nom}` : '';

      console.log('📝 Tarif spécial normalisé:', {
        id: tarif.id || tarif.idTarifSpecial,
        etat: tarif.etat,
        statut: tarifStatut,
        client: clientNom,
        clientOriginal: {
          prenom: client?.prenom,
          nom: client?.nom,
          idClient: tarif.idClient
        },
        service: service?.nomService,
        dates: {
          debut: tarif.dateDebutTarifSpecial,
          fin: tarif.dateFinTarifSpecial
        }
      });

      return {
        ...tarif,
        // Propriétés normalisées pour le filtrage
        client: clientNom,
        service: service?.nomService || '',
        unite: unite?.nomUnite || '',
        statut: tarifStatut, // ✅ 'valide' ou 'invalide'
        
        // Conserver aussi les noms pour l'affichage
        clientNom: clientNom,
        nomService: service?.nomService || '',
        nomUnite: unite?.nomUnite || ''
      };
    });
    
    console.log('✅ Tarifs spéciaux normalisés:', normalized.length);
    console.log('📊 Répartition des statuts:', {
      valides: normalized.filter(t => t.statut === 'valide').length,
      invalides: normalized.filter(t => t.statut === 'invalide').length
    });
    
    return normalized;
  }, [enrichedTarifsSpeciaux, clients, services, unites]);

  // ===== FILTRAGE =====
  const {
    filters,
    showFilters,
    filteredData: tarifsSpeciauxFiltered,
    filterStats,
    handleFilterChange,
    handleResetFilters,
    handleToggleFilters
  } = useTarifFilter(normalizedTarifsSpeciaux, 'tarifs-speciaux', createInitialFilters('tarifs-speciaux'));

  // ===== OPTIONS DE FILTRAGE =====
  const filterOptions = useMemo(() => {
    console.log('🔍 Préparation filterOptions pour tarifs spéciaux');
    
    // ✅ CORRECTION: Extraire uniquement les clients/services/unités UTILISÉS dans les tarifs spéciaux
    const uniqueClients = [...new Set(
      normalizedTarifsSpeciaux.map(t => t.client).filter(Boolean)
    )].sort();
    
    const uniqueServices = [...new Set(
      normalizedTarifsSpeciaux.map(t => t.service).filter(Boolean)
    )].sort();
    
    const uniqueUnites = [...new Set(
      normalizedTarifsSpeciaux.map(t => t.unite).filter(Boolean)
    )].sort();
    
    console.log('📊 Clients utilisés dans les tarifs spéciaux:', uniqueClients);
    console.log('📊 Services utilisés dans les tarifs spéciaux:', uniqueServices);
    console.log('📊 Unités utilisées dans les tarifs spéciaux:', uniqueUnites);
    
    const options = {
      client: uniqueClients,
      service: uniqueServices,
      unite: uniqueUnites,
      statut: ['valide', 'invalide']
    };
    
    console.log('📋 Options de filtrage configurées:', options);
    
    return options;
  }, [normalizedTarifsSpeciaux]);

  // ===== HANDLERS =====
  const handleCreateClick = (event) => {
    if (onCreateTarifSpecial) {
      onCreateTarifSpecial(event);
    } else {
      console.warn('⚠️ onCreateTarifSpecial non fourni');
    }
  };
  
  const handleEditClick = (tarifSpecial, event) => {
    const tarifId = tarifSpecial.id || tarifSpecial.idTarifSpecial;
    if (onEditTarifSpecial) {
      onEditTarifSpecial(tarifId, event);
    } else {
      console.warn('⚠️ onEditTarifSpecial non fourni');
    }
  };
  
  const handleDeleteClick = (tarifSpecial, event) => {
    const tarifId = tarifSpecial.id || tarifSpecial.idTarifSpecial;
    const tarifName = `${tarifSpecial.clientNom} - ${tarifSpecial.nomService}`;
    if (onDeleteTarifSpecial) {
      onDeleteTarifSpecial(tarifId, tarifName, event);
    } else {
      console.warn('⚠️ onDeleteTarifSpecial non fourni');
    }
  };

  // ===== RENDU PRINCIPAL =====
  
  return (
    <div className="tarif-special-gestion">
      
      {/* Header avec bouton de création */}
      <TarifFormHeader
        titre="Gestion des tarifs spéciaux"
        description="Gérez les tarifs personnalisés pour vos clients"
      >
        <AddButton onClick={handleCreateClick}>
          Nouveau tarif spécial
        </AddButton>
      </TarifFormHeader>

      {/* Filtres unifiés */}
      <UnifiedFilter
        filterType="tarifs-speciaux"
        filterOptions={filterOptions}
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        showFilters={showFilters}
        onToggleFilters={handleToggleFilters}
        totalCount={filterStats.totalCount}
        filteredCount={filterStats.filteredCount}
        className="filter-tarifs-speciaux"
      />

      {/* Gestion des états vides */}
      {tarifsSpeciaux.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">⭐</div>
          <h4>Aucun tarif spécial</h4>
          <p>Les tarifs spéciaux que vous créerez apparaîtront ici.</p>
        </div>
      ) : tarifsSpeciauxFiltered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h4>Aucun tarif spécial trouvé</h4>
          <p>Aucun tarif spécial ne correspond aux filtres sélectionnés.</p>
          {filterStats.hasActiveFilters && (
            <button 
              className="btn-secondary"
              onClick={handleResetFilters}
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      ) : (
        <TarifSpecialTableSection
          tarifsSpeciaux={tarifsSpeciauxFiltered}
          services={services}
          unites={unites}
          clients={clients}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
          highlightedId={highlightedId}
          isSubmitting={isSubmitting}
        />
      )}
      
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
          <strong>🔧 Debug TarifSpecialGestion :</strong><br/>
          - Tarifs spéciaux chargés : {tarifsSpeciaux.length}<br/>
          - Tarifs enrichis : {enrichedTarifsSpeciaux.length}<br/>
          - Tarifs normalisés : {normalizedTarifsSpeciaux.length}<br/>
          - Tarifs filtrés : {tarifsSpeciauxFiltered.length}<br/>
          - Filtres actifs : {filterStats.hasActiveFilters ? 'Oui' : 'Non'}<br/>
          - Filtres actuels : {JSON.stringify(filters)}<br/>
          - Clients : {clients.length}<br/>
          - Services : {services.length}<br/>
          - Unités : {unites.length}<br/>
          - Highlighted ID : {highlightedId || 'aucun'}<br/>
          - ✅ MIGRATION UNIFIEDFILTER COMPLÈTE
        </div>
      )}
    </div>
  );
};

export default TarifSpecialGestion;