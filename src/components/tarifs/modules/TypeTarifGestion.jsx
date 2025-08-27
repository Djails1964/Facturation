import React, { useState, useEffect } from 'react';
import TypeTarifTableSection from '../sections/TypeTarifTableSection';
import TarifFormHeader from '../sections/TarifFormHeader';
import { AddButton } from '../../../components/ui/buttons';
import TarifFilter from '../components/TarifFilter';
import { useTarifFilter, createInitialFilters } from '../hooks/useTarifFilter';

const TypeTarifGestion = ({ 
  typesTarifs, 
  setTypesTarifs, 
  tarificationService, 
  setMessage, 
  setMessageType, 
  setConfirmModal,
  loadTypesTarifs,
  highlightedId,
  onCreateTypeTarif,
  onEditTypeTarif,
  onDeleteTypeTarif
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // ===== NORMALISATION DES DONNÉES =====
  // Les types de tarifs arrivent avec les propriétés : idTypeTarif, codeTypeTarif, nomTypeTarif, descriptionTypeTarif
  // On doit les normaliser pour le système de filtrage et d'affichage
  const normalizedTypesTarifs = React.useMemo(() => {
    if (!typesTarifs || !Array.isArray(typesTarifs)) return [];
    
    return typesTarifs.map(typeTarif => {
      if (!typeTarif) return null;
      
      return {
        ...typeTarif,
        // Normalisation vers les propriétés attendues
        id: typeTarif.idTypeTarif || typeTarif.id,
        code: typeTarif.codeTypeTarif || typeTarif.code,
        nom: typeTarif.nomTypeTarif || typeTarif.nom,
        description: typeTarif.descriptionTypeTarif || typeTarif.description || ''
      };
    }).filter(Boolean);
  }, [typesTarifs]);

  // ===== INTÉGRATION DU FILTRE CENTRALISÉ =====
  const {
    filters,
    showFilters,
    filteredData: typeTarifsFiltered,
    filterStats,
    handleFilterChange,
    handleResetFilters,
    handleToggleFilters
  } = useTarifFilter(normalizedTypesTarifs, 'types-tarifs', createInitialFilters('types-tarifs'));

  // ===== HANDLERS POUR LE SYSTÈME UNIFIÉ =====
  
  const handleCreateClick = (event) => {
    if (onCreateTypeTarif) {
      onCreateTypeTarif(event);
    } else {
      console.warn('⚠️ onCreateTypeTarif non fourni, utilisation du système legacy');
      handleLegacyCreate();
    }
  };
  
  const handleEditClick = (typeTarif, event) => {
    if (onEditTypeTarif) {
      // Utiliser l'ID normalisé
      const id = typeTarif.idTypeTarif || typeTarif.id;
      onEditTypeTarif(id, event);
    } else {
      console.warn('⚠️ onEditTypeTarif non fourni, utilisation du système legacy');
      handleLegacyEdit(typeTarif);
    }
  };
  
  const handleDeleteClick = (typeTarif, event) => {
    if (onDeleteTypeTarif) {
      // Utiliser les valeurs normalisées
      const id = typeTarif.idTypeTarif || typeTarif.id;
      const nom = typeTarif.nom || typeTarif.nomTypeTarif;
      onDeleteTypeTarif(id, nom, event);
    } else {
      console.warn('⚠️ onDeleteTypeTarif non fourni, utilisation du système legacy');
      handleSupprimerTypeTarif(typeTarif);
    }
  };

  // ===== ANCIEN SYSTÈME (DEPRECATED - À SUPPRIMER) =====

  const handleLegacyCreate = async () => {
    console.log('🚨 Système legacy de création de type de tarif utilisé - À MIGRER');
  };

  const handleLegacyEdit = async (typeTarif) => {
    console.log('🚨 Système legacy d\'édition de type de tarif utilisé - À MIGRER');
  };

  const handleSupprimerTypeTarif = (typeTarif) => {
    const nom = typeTarif.nom || typeTarif.nomTypeTarif;
    const id = typeTarif.idTypeTarif || typeTarif.id;
    
    setConfirmModal({
      isOpen: true,
      title: 'Confirmer la suppression',
      message: `Êtes-vous sûr de vouloir supprimer le type de tarif "${nom}" ?`,
      type: 'danger',
      confirmText: 'Supprimer',
      onConfirm: () => confirmerSuppression(id),
      entityType: 'typeTarif'
    });
  };

  const confirmerSuppression = async (typeTarifId) => {
    try {
      const result = await tarificationService.supprimerTypeTarif(typeTarifId);
      
      if (result.success) {
        setMessage('Type de tarif supprimé avec succès');
        setMessageType('success');
        loadTypesTarifs();
      } else {
        throw new Error(result.message || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur suppression type tarif:', error);
      setMessage('Erreur lors de la suppression: ' + error.message);
      setMessageType('error');
    }
  };

  return (
    <div className="type-tarif-gestion">
      {/* Header avec bouton de création */}
      <TarifFormHeader
        titre="Types de tarifs"
        description="Définissez les différents types de tarification (normal, urgent, weekend, etc.)"
      >
        <AddButton onClick={handleCreateClick}>
          Nouveau type de tarif
        </AddButton>
      </TarifFormHeader>

      {/* ===== FILTRE CENTRALISÉ ===== */}
      <TarifFilter
        filterType="types-tarifs"
        data={normalizedTypesTarifs}
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        showFilters={showFilters}
        onToggleFilters={handleToggleFilters}
        totalCount={filterStats.totalCount}
        filteredCount={filterStats.filteredCount}
        className="filter-types-tarifs"
      />

      {/* Table des types de tarifs filtrés */}
      <TypeTarifTableSection
        typesTarifs={typeTarifsFiltered}
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
          <strong>🔧 Debug TypeTarifGestion :</strong><br/>
          - Types de tarifs chargés : {typesTarifs.length}<br/>
          - Types normalisés : {normalizedTypesTarifs.length}<br/>
          - Types filtrés : {typeTarifsFiltered.length}<br/>
          - Filtres actifs : {filterStats.hasActiveFilters ? 'Oui' : 'Non'}<br/>
          - Highlighted ID : {highlightedId || 'aucun'}<br/>
          - Système unifié : {onCreateTypeTarif ? '✅ Actif' : '❌ Non connecté'}<br/>
          - Is submitting : {isSubmitting ? 'Oui' : 'Non'}<br/>
          - Premier type : {typesTarifs[0] ? JSON.stringify(Object.keys(typesTarifs[0])) : 'aucun'}<br/>
          - Filtres actuels : {JSON.stringify(filters)}
        </div>
      )}
    </div>
  );
};

export default TypeTarifGestion;