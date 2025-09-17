import React, { useState, useEffect, useMemo } from 'react';
import TarifSpecialTableSection from '../sections/TarifSpecialTableSection';
import TarifFormHeader from '../sections/TarifFormHeader';
import { AddButton } from '../../../components/ui/buttons';
import TarifFilter from '../components/TarifFilter';
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
  // Nouveaux handlers du système unifié
  onCreateTarifSpecial,
  onEditTarifSpecial,
  onDeleteTarifSpecial
}) => {
  const [selectedTarifsSpeciaux, setSelectedTarifsSpeciaux] = useState([]);
  const [allTarifsSpeciaux, setAllTarifsSpeciaux] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchAllTarifsSpeciaux = async () => {
      console.log('fetchAllTarifsSpeciaux - Chargement de tous les tarifs spéciaux...');
      try {
        const result = await tarificationService.getAllTarifsSpeciaux({});
        setAllTarifsSpeciaux(result);
      } catch (error) {
        console.error('Erreur lors du chargement de tous les tarifs spéciaux:', error);
        setMessage('Erreur lors du chargement des tarifs spéciaux: ' + error.message);
        setMessageType('error');
      }
    };
    
    fetchAllTarifsSpeciaux();
    console.log('fetchAllTarifsSpeciaux - Chargement terminé');
  }, [tarificationService, setMessage, setMessageType]);

  const reloadAllTarifsSpeciaux = async () => {
    try {
      const result = await tarificationService.getAllTarifsSpeciaux({});
      setAllTarifsSpeciaux(result);
    } catch (error) {
      console.error('Erreur lors du rechargement:', error);
    }
  };

  // ===== INTÉGRATION DU NOUVEAU FILTRE CENTRALISÉ =====
  
  // Enrichir les tarifs spéciaux avec leur état calculé et les noms des entités liées
  const enrichedTarifsSpeciaux = useMemo(() => {
    const tarifsWithEtat = enrichTarifsWithEtat(allTarifsSpeciaux);
    
    // Enrichir avec les noms des entités liées pour le filtrage
    return tarifsWithEtat.map(tarif => {
      const client = clients.find(c => c.id == (tarif.client_id || tarif.clientId));
      const service = services.find(s => s.id == (tarif.idService));
      const unite = unites.find(u => u.id == (tarif.idUnite));
      
      return {
        ...tarif,
        client_nom: client ? `${client.prenom} ${client.nom}` : '',
        clientNom: client ? `${client.prenom} ${client.nom}` : '',
        nomService: service?.nomService || '',
        uniteNom: unite?.nomUnite || '',
        statut: tarif.etat // Mapper etat vers statut pour le filtre
      };
    });
  }, [allTarifsSpeciaux, clients, services, unites]);

  // Utiliser le hook de filtrage centralisé
  const {
    filters,
    showFilters,
    filteredData: tarifsSpeciauxFiltered,
    filterStats,
    handleFilterChange,
    handleResetFilters,
    handleToggleFilters
  } = useTarifFilter(enrichedTarifsSpeciaux, 'tarifs-speciaux', createInitialFilters('tarifs-speciaux'));

  // ===== HANDLERS POUR LE SYSTÈME UNIFIÉ =====
  
  const handleCreateClick = (event) => {
    if (onCreateTarifSpecial) {
      onCreateTarifSpecial(event);
    } else {
      console.warn('⚠️ onCreateTarifSpecial non fourni, utilisation du système legacy');
      handleLegacyCreate();
    }
  };
  
  const handleEditClick = (tarifSpecial, event) => {
    if (onEditTarifSpecial) {
      onEditTarifSpecial(tarifSpecial.id || tarifSpecial.idTarifSpecial, event);
    } else {
      console.warn('⚠️ onEditTarifSpecial non fourni, utilisation du système legacy');
      handleLegacyEdit(tarifSpecial);
    }
  };
  
  const handleDeleteClick = (tarifSpecial, event) => {
    if (onDeleteTarifSpecial) {
      onDeleteTarifSpecial(
        tarifSpecial.id || tarifSpecial.idTarifSpecial, 
        getTarifSpecialDisplayName(tarifSpecial), 
        event
      );
    } else {
      console.warn('⚠️ onDeleteTarifSpecial non fourni, utilisation du système legacy');
      handleSupprimerTarifSpecial(tarifSpecial);
    }
  };

  // ===== ANCIEN SYSTÈME (DEPRECATED - À SUPPRIMER) =====

  const handleLegacyCreate = async () => {
    console.log('🚨 Système legacy de création de tarif spécial utilisé - À MIGRER');
  };

  const handleLegacyEdit = async (tarifSpecial) => {
    console.log('🚨 Système legacy d\'édition de tarif spécial utilisé - À MIGRER');
  };

  // Utilitaire pour obtenir le nom d'affichage d'un tarif spécial
  const getTarifSpecialDisplayName = (tarifSpecial) => {
    const client = clients.find(c => c.id == (tarifSpecial.client_id || tarifSpecial.clientId));
    const service = services.find(s => s.id == (tarifSpecial.idService));
    
    const clientName = client ? `${client.prenom} ${client.nom}` : 'Client introuvable';
    const serviceName = service?.nomService || 'Service introuvable';
    
    return `${clientName} - ${serviceName}`;
  };

  // Actions legacy (à supprimer progressivement)
  const handleSupprimerTarifSpecial = (tarifSpecial) => {
    const displayData = getTarifSpecialDisplayName(tarifSpecial);
    setConfirmModal({
      isOpen: true,
      title: 'Confirmer la suppression',
      message: `Êtes-vous sûr de vouloir supprimer le tarif spécial pour "${displayData}" ?`,
      type: 'danger',
      confirmText: 'Supprimer',
      onConfirm: () => confirmerSuppression(tarifSpecial.id),
      entityType: 'tarifSpecial'
    });
  };

  const confirmerSuppression = async (tarifSpecialId) => {
    try {
      const result = await tarificationService.supprimerTarifSpecial(tarifSpecialId);
      
      if (result.success) {
        setMessage('Tarif spécial supprimé avec succès');
        setMessageType('success');
        reloadAllTarifsSpeciaux();
      } else {
        throw new Error(result.message || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur suppression tarif spécial:', error);
      setMessage('Erreur lors de la suppression: ' + error.message);
      setMessageType('error');
    }
  };

  // Gestion de la sélection multiple
  const handleSelectTarifSpecial = (tarifSpecialId, isSelected) => {
    if (isSelected) {
      setSelectedTarifsSpeciaux(prev => [...prev, tarifSpecialId]);
    } else {
      setSelectedTarifsSpeciaux(prev => prev.filter(id => id !== tarifSpecialId));
    }
  };

  const handleSelectAll = (isSelected) => {
    if (isSelected) {
      setSelectedTarifsSpeciaux(tarifsSpeciauxFiltered.map(t => t.id));
    } else {
      setSelectedTarifsSpeciaux([]);
    }
  };

  // Actions groupées
  const handleBulkDelete = () => {
    if (selectedTarifsSpeciaux.length === 0) return;
    
    setConfirmModal({
      isOpen: true,
      title: 'Confirmer la suppression groupée',
      message: `Êtes-vous sûr de vouloir supprimer ${selectedTarifsSpeciaux.length} tarif(s) spéciaux ?`,
      type: 'danger',
      confirmText: 'Supprimer tout',
      onConfirm: () => confirmerSuppressionGroupee(),
      entityType: 'tarifsSpeciaux'
    });
  };

  const confirmerSuppressionGroupee = async () => {
    try {
      const result = await tarificationService.supprimerTarifsSpeciauxGroupes(selectedTarifsSpeciaux);
      
      if (result.success) {
        setMessage(`${selectedTarifsSpeciaux.length} tarif(s) spéciaux supprimé(s) avec succès`);
        setMessageType('success');
        setSelectedTarifsSpeciaux([]);
        reloadAllTarifsSpeciaux();
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
      const tarifsToExport = tarifsSpeciauxFiltered.filter(t => 
        selectedTarifsSpeciaux.includes(t.id)
      );
      onBulkAction('export', tarifsToExport);
    }
  };

  // Rendu des actions de liste
  const renderListActions = () => (
    <div className="list-actions">
      <div className="bulk-controls">
        {selectedTarifsSpeciaux.length > 0 && (
          <>
            <span className="selection-count">
              {selectedTarifsSpeciaux.length} sélectionné(s)
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
    <div className="tarif-special-gestion">
      {/* EN-TÊTE UNIFIÉ AVEC BOUTON D'ACTION */}
      <TarifFormHeader
        titre="Tarifs spéciaux"
        description="Tarifs personnalisés pour des clients ou des conditions spécifiques"
      >
        <AddButton onClick={handleCreateClick}>
          Nouveau tarif spécial
        </AddButton>
      </TarifFormHeader>

      <div className="gestion-header">
        {renderListActions()}
      </div>

      {/* ===== NOUVEAU FILTRE CENTRALISÉ ===== */}
      <TarifFilter
        filterType="tarifs-speciaux"
        data={enrichedTarifsSpeciaux}
        services={services}
        unites={unites}
        clients={clients}
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        showFilters={showFilters}
        onToggleFilters={handleToggleFilters}
        totalCount={filterStats.totalCount}
        filteredCount={filterStats.filteredCount}
        className="filter-tarifs-speciaux"
      />

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
        <>
          <TarifSpecialTableSection
            tarifsSpeciaux={tarifsSpeciauxFiltered}
            services={services}
            unites={unites}
            clients={clients}
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
          <strong>🔧 Debug TarifSpecialGestion :</strong><br/>
          - Tarifs spéciaux chargés : {allTarifsSpeciaux.length}<br/>
          - Tarifs spéciaux filtrés : {tarifsSpeciauxFiltered.length}<br/>
          - Filtres actifs : {filterStats.hasActiveFilters ? 'Oui' : 'Non'}<br/>
          - Highlighted ID : {highlightedId || 'aucun'}<br/>
          - Système unifié : {onCreateTarifSpecial ? '✅ Actif' : '❌ Non connecté'}<br/>
          - Is submitting : {isSubmitting ? 'Oui' : 'Non'}<br/>
          - Filtres actuels : {JSON.stringify(filters)}
        </div>
      )}
    </div>
  );
};

export default TarifSpecialGestion;