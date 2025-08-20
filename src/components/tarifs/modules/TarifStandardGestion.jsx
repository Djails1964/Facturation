import React, { useState, useEffect, useMemo } from 'react';
import { useTarifList } from '../hooks/useTarifList';
import TarifTableSection from '../sections/TarifTableSection';
import TarifFormHeader from '../sections/TarifFormHeader'; // ✅ AJOUT
import { AddButton } from '../../../components/ui/buttons'; // ✅ AJOUT

const TarifStandardGestion = ({ 
  tarifs, 
  setTarifs, 
  services, 
  unites, 
  typesTarifs, 
  serviceUnites, 
  loadUnitesByService,
  tarificationService, 
  setSelectedServiceId, 
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
  // ✅ AJOUT : Nouveaux handlers du système unifié
  onCreateTarif,
  onEditTarif,
  onDeleteTarif
}) => {
  const [selectedTarifs, setSelectedTarifs] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Utiliser le hook corrigé
  const tarifList = useTarifList(tarifs, services, unites, typesTarifs);

  // ===== HANDLERS POUR LE SYSTÈME UNIFIÉ =====
  
  const handleCreateClick = (event) => {
    if (onCreateTarif) {
      // Utiliser le nouveau système unifié
      onCreateTarif(event);
    } else {
      // Fallback vers l'ancien système (deprecated)
      console.warn('⚠️ onCreateTarif non fourni, utilisation du système legacy');
      handleLegacyCreate();
    }
  };
  
  const handleEditClick = (tarif, event) => {
    if (onEditTarif) {
      // Utiliser le nouveau système unifié
      onEditTarif(tarif.id, event);
    } else {
      // Fallback vers l'ancien système (deprecated)
      console.warn('⚠️ onEditTarif non fourni, utilisation du système legacy');
      handleLegacyEdit(tarif);
    }
  };
  
  const handleDeleteClick = (tarif, event) => {
    if (onDeleteTarif) {
      // Utiliser le nouveau système unifié
      onDeleteTarif(tarif.id, getTarifDisplayName(tarif), event);
    } else {
      // Fallback vers l'ancien système (deprecated)
      console.warn('⚠️ onDeleteTarif non fourni, utilisation du système legacy');
      handleSupprimerTarif(tarif);
    }
  };

  // ===== ANCIEN SYSTÈME (DEPRECATED - À SUPPRIMER) =====

  const handleLegacyCreate = async () => {
    console.log('🚨 Système legacy de création de tarif utilisé - À MIGRER');
    // Code de l'ancien système...
  };

  const handleLegacyEdit = async (tarif) => {
    console.log('🚨 Système legacy d\'édition de tarif utilisé - À MIGRER');
    // Code de l'ancien système...
  };

  // Utilitaire pour obtenir le nom d'affichage d'un tarif
  const getTarifDisplayName = (tarif) => {
    console.tlog('TarifStandardGestion - getTarifDisplayName - données entrantes : ', tarif);
    const service = services.find(s => s.id === tarif.service_id);
    const unite = unites.find(u => u.id === tarif.unite_id);
    const typeTarif = typesTarifs.find(t => t.id === tarif.type_tarif_id);
    
    return `${service?.nom || 'Service'} - ${unite?.nom || 'Unité'} - ${typeTarif?.nom || 'Type'}`;
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

  const handleDuplicateTarif = async (tarif) => {
    try {
      const result = await tarificationService.dupliquerTarif(tarif.id);
      
      if (result.success) {
        setMessage('Tarif dupliqué avec succès');
        setMessageType('success');
        loadTarifs();
      } else {
        throw new Error(result.message || 'Erreur lors de la duplication');
      }
    } catch (error) {
      console.error('Erreur duplication tarif:', error);
      setMessage('Erreur lors de la duplication: ' + error.message);
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
      const tarifsToExport = tarifList.filteredAndSortedTarifs.filter(t => 
        selectedTarifs.includes(t.id)
      );
      onBulkAction('export', tarifsToExport);
    }
  };

  // Rendu des filtres
  const renderFilters = () => (
    <div className="tarifs-filters">
      <div className="filters-row">
        <div className="filter-group">
          <select
            name="service"
            value={tarifList.filters?.service || ''}
            onChange={tarifList.handleFilterChange}
            className="filter-select"
          >
            <option value="">Tous les services</option>
            {services?.map(service => (
              <option key={service.id} value={service.id}>
                {service.nom}
              </option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <select
            name="unite"
            value={tarifList.filters?.unite || ''}
            onChange={tarifList.handleFilterChange}
            className="filter-select"
          >
            <option value="">Toutes les unités</option>
            {unites?.map(unite => (
              <option key={unite.id} value={unite.id}>
                {unite.nom}
              </option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <select
            name="typeTarif"
            value={tarifList.filters?.typeTarif || ''}
            onChange={tarifList.handleFilterChange}
            className="filter-select"
          >
            <option value="">Tous les types</option>
            {typesTarifs?.map(type => (
              <option key={type.id} value={type.id}>
                {type.nom}
              </option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <select
            name="etat"
            value={tarifList.filters?.etat || ''}
            onChange={tarifList.handleFilterChange}
            className="filter-select"
          >
            <option value="">Tous les états</option>
            <option value="valid">Valides</option>
            <option value="invalid">Invalides</option>
          </select>
        </div>
        
        <button 
          className="btn btn-secondary"
          onClick={tarifList.handleResetFilters}
        >
          Réinitialiser
        </button>
      </div>
    </div>
  );

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
      {/* ✅ EN-TÊTE UNIFIÉ AVEC BOUTON D'ACTION */}
      <TarifFormHeader
        titre="Tarifs standards"
        description="Tarifs de base appliqués par défaut à tous vos clients"
      >
        <AddButton onClick={handleCreateClick}>
          Nouveau tarif standard
        </AddButton>
      </TarifFormHeader>

      {/* ✅ SUPPRESSION DU FORMULAIRE INTÉGRÉ - Remplacé par modal unifiée */}

      <div className="gestion-header">
        <div className="header-title">
          {/* Titre déplacé dans TarifFormHeader */}
        </div>
        {renderListActions()}
      </div>

      {renderFilters()}

      {tarifList.filteredAndSortedTarifs.length === 0 ? (
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
          {(tarifs?.length || 0) > 0 && (
            <button 
              className="btn-secondary"
              onClick={tarifList.handleResetFilters}
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      ) : (
        <>
          <TarifTableSection
            tarifs={tarifList.filteredAndSortedTarifs}
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
          - Highlighted ID : {highlightedId || 'aucun'}<br/>
          - Système unifié : {onCreateTarif ? '✅ Actif' : '❌ Non connecté'}<br/>
          - Is submitting : {isSubmitting ? 'Oui' : 'Non'}
        </div>
      )}
    </div>
  );
};

export default TarifStandardGestion;