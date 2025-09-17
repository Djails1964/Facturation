import React, { useState, useEffect, useMemo } from 'react';
import { useTarifList } from '../hooks/useTarifList';
import TarifTableSection from '../sections/TarifTableSection';
import TarifFormHeader from '../sections/TarifFormHeader';
import { AddButton } from '../../../components/ui/buttons';
import TarifFilter from '../components/TarifFilter';
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
  // Nouveaux handlers du système unifié
  onCreateTarif,
  onEditTarif,
  onDeleteTarif
}) => {
  const [selectedTarifs, setSelectedTarifs] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ===== INTÉGRATION DU NOUVEAU FILTRE CENTRALISÉ =====
  
  // Enrichir les tarifs avec leur état calculé
  const enrichedTarifs = useMemo(() => {
    return enrichTarifsWithEtat(tarifs || []);
  }, [tarifs]);

  // Utiliser le hook de filtrage centralisé
  const {
    filters,
    showFilters,
    filteredData: tarifsFiltered,
    filterStats,
    handleFilterChange,
    handleResetFilters,
    handleToggleFilters
  } = useTarifFilter(enrichedTarifs, 'tarifs-standards', createInitialFilters('tarifs-standards'));

  // ===== HANDLERS POUR LE SYSTÈME UNIFIÉ =====
  
  const handleCreateClick = (event) => {
    if (onCreateTarif) {
      onCreateTarif(event);
    } else {
      console.warn('⚠️ onCreateTarif non fourni, utilisation du système legacy');
      handleLegacyCreate();
    }
  };
  
  const handleEditClick = (tarif, event) => {
    if (onEditTarif) {
      onEditTarif(tarif.id || tarif.idTarifStandard, event);
    } else {
      console.warn('⚠️ onEditTarif non fourni, utilisation du système legacy');
      handleLegacyEdit(tarif);
    }
  };
  
  const handleDeleteClick = (tarif, event) => {
    if (onDeleteTarif) {
      onDeleteTarif(tarif.id || tarif.idTarifStandard, getTarifDisplayName(tarif), event);
    } else {
      console.warn('⚠️ onDeleteTarif non fourni, utilisation du système legacy');
      handleSupprimerTarif(tarif);
    }
  };

  // ===== ANCIEN SYSTÈME (DEPRECATED - À SUPPRIMER) =====

  const handleLegacyCreate = async () => {
    console.log('🚨 Système legacy de création de tarif utilisé - À MIGRER');
  };

  const handleLegacyEdit = async (tarif) => {
    console.log('🚨 Système legacy d\'édition de tarif utilisé - À MIGRER');
  };

  // Utilitaire pour obtenir le nom d'affichage d'un tarif
  const getTarifDisplayName = (tarif) => {
    const service = services.find(s => s.id === (tarif.idService));
    const unite = unites.find(u => u.id === (tarif.idUnite));
    const typeTarif = typesTarifs.find(t => t.id === (tarif.type_tarif_id || tarif.typeTarifId));
    
    return `${service?.nomService || 'Service'} - ${unite?.nomUnite || 'Unité'} - ${typeTarif?.nomTypeTarif || 'Type'}`;
  };

  // Actions legacy (à supprimer progressivement)
  const handleSupprimerTarif = (tarif) => {
    setConfirmModal({
      isOpen: true,
      title: 'Confirmer la suppression',
      message: `Êtes-vous sûr de vouloir supprimer ce tarif ?`,
      type: 'danger',
      confirmText: 'Supprimer',
      onConfirm: () => confirmerSuppression(tarif.id),
      entityType: 'tarif'
    });
  };

  const confirmerSuppression = async (tarifId) => {
    try {
      const result = await tarificationService.supprimerTarif(tarifId);
      
      if (result.success) {
        setMessage('Tarif supprimé avec succès');
        setMessageType('success');
        loadTarifs();
      } else {
        throw new Error(result.message || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur suppression tarif:', error);
      setMessage('Erreur lors de la suppression: ' + error.message);
      setMessageType('error');
    }
  };

  // Actions groupées
  const handleBulkDelete = () => {
    if (selectedTarifs.length === 0) return;
    
    setConfirmModal({
      isOpen: true,
      title: 'Confirmer la suppression groupée',
      message: `Êtes-vous sûr de vouloir supprimer ${selectedTarifs.length} tarif(s) ?`,
      type: 'danger',
      confirmText: 'Supprimer tout',
      onConfirm: () => confirmerSuppressionGroupee(),
      entityType: 'tarifs'
    });
  };

  const confirmerSuppressionGroupee = async () => {
    try {
      const result = await tarificationService.supprimerTarifsGroupes(selectedTarifs);
      
      if (result.success) {
        setMessage(`${selectedTarifs.length} tarif(s) supprimé(s) avec succès`);
        setMessageType('success');
        setSelectedTarifs([]);
        loadTarifs();
      } else {
        throw new Error(result.message || 'Erreur lors de la suppression groupée');
      }
    } catch (error) {
      console.error('Erreur suppression groupée:', error);
      setMessage('Erreur lors de la suppression groupée: ' + error.message);
      setMessageType('error');
    }
  };

  const handleBulkExport = () => {
    if (onBulkAction) {
      const tarifsToExport = tarifsFiltered.filter(t => 
        selectedTarifs.includes(t.id)
      );
      onBulkAction('export', tarifsToExport);
    }
  };

  // Rendu des actions de liste
  const renderListActions = () => (
    <div className="list-actions">
      <div className="bulk-controls">
        {selectedTarifs.length > 0 && (
          <>
            <span className="selection-count">
              {selectedTarifs.length} sélectionné(s)
            </span>
            <button 
              className="btn btn-outline-danger"
              onClick={handleBulkDelete}
            >
              🗑️ Supprimer
            </button>
            <button 
              className="btn btn-outline-primary"
              onClick={handleBulkExport}
            >
              📊 Exporter
            </button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="tarif-standard-gestion">
      {/* EN-TÊTE UNIFIÉ AVEC BOUTON D'ACTION */}
      <TarifFormHeader
        titre="Tarifs standards"
        description="Tarifs de base appliqués par défaut à tous vos clients"
      >
        <AddButton onClick={handleCreateClick}>
          Nouveau tarif standard
        </AddButton>
      </TarifFormHeader>

      <div className="gestion-header">
        {renderListActions()}
      </div>

      {/* ===== NOUVEAU FILTRE CENTRALISÉ ===== */}
      <TarifFilter
        filterType="tarifs-standards"
        data={enrichedTarifs}
        services={services}
        unites={unites}
        typesTarifs={typesTarifs}
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        showFilters={showFilters}
        onToggleFilters={handleToggleFilters}
        totalCount={filterStats.totalCount}
        filteredCount={filterStats.filteredCount}
        className="filter-tarifs-standards"
      />

      {tarifsFiltered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💰</div>
          <h4>
            {(tarifs?.length || 0) === 0 
              ? "Aucun tarif standard"
              : "Aucun tarif trouvé"
            }
          </h4>
          <p>
            {(tarifs?.length || 0) === 0 
              ? "Les tarifs que vous créerez apparaîtront ici"
              : "Aucun tarif ne correspond aux filtres sélectionnés"
            }
          </p>
          {(tarifs?.length || 0) > 0 && filterStats.hasActiveFilters && (
            <button 
              className="btn-secondary"
              onClick={handleResetFilters}
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      ) : (
        <>
          <TarifTableSection
            tarifs={tarifsFiltered}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
            highlightedId={highlightedId}
            isSubmitting={false}
          />
        </>
      )}
      
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
          <strong>🔧 Debug TarifStandardGestion :</strong><br/>
          - Tarifs chargés : {tarifs?.length || 0}<br/>
          - Tarifs filtrés : {tarifsFiltered.length}<br/>
          - Filtres actifs : {filterStats.hasActiveFilters ? 'Oui' : 'Non'}<br/>
          - Highlighted ID : {highlightedId || 'aucun'}<br/>
          - Système unifié : {onCreateTarif ? '✅ Actif' : '❌ Non connecté'}<br/>
          - Is submitting : {isSubmitting ? 'Oui' : 'Non'}<br/>
          - Filtres actuels : {JSON.stringify(filters)}
        </div>
      )}
    </div>
  );
};

export default TarifStandardGestion;