import React, { useState, useEffect, useMemo } from 'react';
import TarifSpecialTableSection from '../sections/TarifSpecialTableSection';
import TarifFormHeader from '../sections/TarifFormHeader'; // ✅ AJOUT
import { AddButton } from '../../../components/ui/buttons'; // ✅ AJOUT

const TarifSpecialGestion = ({ 
  tarifsSpeciaux, 
  setTarifsSpeciaux, 
  services, 
  unites, 
  clients, 
  serviceUnites, 
  loadUnitesByService,
  tarificationService, 
  setSelectedServiceId, 
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
  // ✅ AJOUT : Nouveaux handlers du système unifié
  onCreateTarifSpecial,
  onEditTarifSpecial,
  onDeleteTarifSpecial
}) => {
  const [selectedTarifsSpeciaux, setSelectedTarifsSpeciaux] = useState([]);
  const [allTarifsSpeciaux, setAllTarifsSpeciaux] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filters, setFilters] = useState({
    client: '',
    service: '',
    unite: '',
    etat: ''
  });
  const [searchTerm, setSearchTerm] = useState('');

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

  // ===== HANDLERS POUR LE SYSTÈME UNIFIÉ =====
  
  const handleCreateClick = (event) => {
    if (onCreateTarifSpecial) {
      // Utiliser le nouveau système unifié
      onCreateTarifSpecial(event);
    } else {
      // Fallback vers l'ancien système (deprecated)
      console.warn('⚠️ onCreateTarifSpecial non fourni, utilisation du système legacy');
      handleLegacyCreate();
    }
  };
  
  const handleEditClick = (tarifSpecial, event) => {
    if (onEditTarifSpecial) {
      // Utiliser le nouveau système unifié
      onEditTarifSpecial(tarifSpecial.id, event);
    } else {
      // Fallback vers l'ancien système (deprecated)
      console.warn('⚠️ onEditTarifSpecial non fourni, utilisation du système legacy');
      handleLegacyEdit(tarifSpecial);
    }
  };
  
  const handleDeleteClick = (tarifSpecial, event) => {
    if (onDeleteTarifSpecial) {
      // Utiliser le nouveau système unifié
      onDeleteTarifSpecial(tarifSpecial.id, getTarifSpecialDisplayName(tarifSpecial), event);
    } else {
      // Fallback vers l'ancien système (deprecated)
      console.warn('⚠️ onDeleteTarifSpecial non fourni, utilisation du système legacy');
      handleSupprimerTarifSpecial(tarifSpecial);
    }
  };

  // ===== ANCIEN SYSTÈME (DEPRECATED - À SUPPRIMER) =====

  const handleLegacyCreate = async () => {
    console.log('🚨 Système legacy de création de tarif spécial utilisé - À MIGRER');
    // Code de l'ancien système...
  };

  const handleLegacyEdit = async (tarifSpecial) => {
    console.log('🚨 Système legacy d\'édition de tarif spécial utilisé - À MIGRER');
    // Code de l'ancien système...
  };

  // Utilitaire pour obtenir le nom d'affichage d'un tarif spécial
  const getTarifSpecialDisplayName = (tarifSpecial) => {
    const client = clients.find(c => c.id == tarifSpecial.client_id);
    const service = services.find(s => s.id == tarifSpecial.service_id);
    
    const clientName = client ? `${client.prenom} ${client.nom}` : 'Client introuvable';
    const serviceName = service?.nom || 'Service introuvable';
    
    return `${clientName} - ${serviceName}`;
  };

  // Fonction pour calculer si un tarif spécial est valide
  const isTarifSpecialValid = (tarifSpecial) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dateDebut = tarifSpecial.date_debut ? new Date(tarifSpecial.date_debut) : null;
    const dateFin = tarifSpecial.date_fin ? new Date(tarifSpecial.date_fin) : null;
    
    if (!dateDebut) return false;
    
    dateDebut.setHours(0, 0, 0, 0);
    
    return dateDebut <= today && (!dateFin || dateFin >= today);
  };

  // Formatage des données d'affichage
  const getDisplayData = (tarifSpecial) => {
    const client = clients.find(c => c.id == tarifSpecial.client_id);
    const service = services.find(s => s.id == tarifSpecial.service_id);
    const unite = unites.find(u => u.id == tarifSpecial.unite_id);
    
    return {
      ...tarifSpecial,
      client_nom: client ? `${client.prenom} ${client.nom}` : 'Client introuvable',
      service_nom: service?.nom || 'Service introuvable',
      unite_nom: unite?.nom || 'Unité introuvable',
      isValid: isTarifSpecialValid(tarifSpecial)
    };
  };

  // Filtrage et tri
  const filteredAndSortedTarifsSpeciaux = useMemo(() => {
    let filtered = allTarifsSpeciaux.filter(tarifSpecial => {
      const displayData = getDisplayData(tarifSpecial);
      
      // Filtre par terme de recherche
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          displayData.client_nom.toLowerCase().includes(searchLower) ||
          displayData.service_nom.toLowerCase().includes(searchLower) ||
          displayData.unite_nom.toLowerCase().includes(searchLower) ||
          (tarifSpecial.note && tarifSpecial.note.toLowerCase().includes(searchLower));
        
        if (!matchesSearch) return false;
      }
      
      // Filtre par client
      if (filters.client && tarifSpecial.client_id != filters.client) {
        return false;
      }
      
      // Filtre par service
      if (filters.service && tarifSpecial.service_id != filters.service) {
        return false;
      }
      
      // Filtre par unité
      if (filters.unite && tarifSpecial.unite_id != filters.unite) {
        return false;
      }
      
      // Filtre par état
      if (filters.etat) {
        const isValid = displayData.isValid;
        if ((filters.etat === 'valid' && !isValid) || (filters.etat === 'invalid' && isValid)) {
          return false;
        }
      }
      
      return true;
    });
    
    return filtered;
  }, [allTarifsSpeciaux, filters, searchTerm, clients, services, unites]);

  // Actions legacy (à supprimer progressivement)
  const handleSupprimerTarifSpecial = (tarifSpecial) => {
    const displayData = getDisplayData(tarifSpecial);
    setConfirmModal({
      isOpen: true,
      title: 'Confirmer la suppression',
      message: `Êtes-vous sûr de vouloir supprimer le tarif spécial pour "${displayData.client_nom}" ?`,
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

  // Gestion des filtres
  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      client: '',
      service: '',
      unite: '',
      etat: ''
    });
    setSearchTerm('');
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
      setSelectedTarifsSpeciaux(filteredAndSortedTarifsSpeciaux.map(t => t.id));
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
      const tarifsToExport = filteredAndSortedTarifsSpeciaux.filter(t => 
        selectedTarifsSpeciaux.includes(t.id)
      );
      onBulkAction('export', tarifsToExport);
    }
  };

  // Rendu des filtres
  const renderFilters = () => (
    <div className="tarifs-speciaux-filters">
      <div className="filters-row">
        <div className="search-group">
          <input
            type="text"
            placeholder="Rechercher un tarif spécial..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-group">
          <select
            name="client"
            value={filters.client}
            onChange={handleFilterChange}
            className="filter-select"
          >
            <option value="">Tous les clients</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>
                {client.prenom} {client.nom}
              </option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <select
            name="service"
            value={filters.service}
            onChange={handleFilterChange}
            className="filter-select"
          >
            <option value="">Tous les services</option>
            {services.map(service => (
              <option key={service.id} value={service.id}>
                {service.nom}
              </option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <select
            name="unite"
            value={filters.unite}
            onChange={handleFilterChange}
            className="filter-select"
          >
            <option value="">Toutes les unités</option>
            {unites.map(unite => (
              <option key={unite.id} value={unite.id}>
                {unite.nom}
              </option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <select
            name="etat"
            value={filters.etat}
            onChange={handleFilterChange}
            className="filter-select"
          >
            <option value="">Tous les états</option>
            <option value="valid">Valides</option>
            <option value="invalid">Invalides</option>
          </select>
        </div>
        
        <button 
          className="btn btn-secondary"
          onClick={handleResetFilters}
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
      {/* ✅ EN-TÊTE UNIFIÉ AVEC BOUTON D'ACTION */}
      <TarifFormHeader
        titre="Tarifs spéciaux"
        description="Tarifs personnalisés pour des clients ou des conditions spécifiques"
      >
        <AddButton onClick={handleCreateClick}>
          Nouveau tarif spécial
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

      {tarifsSpeciaux.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">⭐</div>
          <h4>Aucun tarif spécial</h4>
          <p>Les tarifs spéciaux que vous créerez apparaîtront ici.</p>
        </div>
      ) : filteredAndSortedTarifsSpeciaux.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h4>Aucun tarif spécial trouvé</h4>
          <p>Aucun tarif spécial ne correspond aux filtres sélectionnés.</p>
          <button 
            className="btn-secondary"
            onClick={handleResetFilters}
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <>
          <TarifSpecialTableSection
            tarifsSpeciaux={filteredAndSortedTarifsSpeciaux}
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
          - Highlighted ID : {highlightedId || 'aucun'}<br/>
          - Système unifié : {onCreateTarifSpecial ? '✅ Actif' : '❌ Non connecté'}<br/>
          - Is submitting : {isSubmitting ? 'Oui' : 'Non'}
        </div>
      )}
    </div>
  );
};

export default TarifSpecialGestion;