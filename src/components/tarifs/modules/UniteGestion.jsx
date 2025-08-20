// UniteGestion.jsx - Version mise à jour pour intégration avec TarifGestion unifié
import React, { useState, useEffect } from 'react';
import { UniteActions } from '../sections/TarifListActions';
import TableSection from '../sections/TableSection';
import { AddButton } from '../../../components/ui/buttons';
import TarifFormHeader from '../sections/TarifFormHeader';

const UniteGestion = ({ 
  unites = [],
  loadUnites,
  highlightedId,
  tarificationService,
  setMessage,
  setMessageType,
  setConfirmModal,
  // Nouveaux handlers du système unifié
  onCreateUnite,
  onEditUnite,
  onDeleteUnite
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // ===== HANDLERS POUR LE SYSTÈME UNIFIÉ =====
  
  const handleCreateClick = (event) => {
    if (onCreateUnite) {
      // Utiliser le nouveau système unifié
      onCreateUnite(event);
    } else {
      // Fallback vers l'ancien système (deprecated)
      console.warn('⚠️ onCreateUnite non fourni, utilisation du système legacy');
      handleLegacyCreate();
    }
  };
  
  const handleEditClick = (unite, event) => {
    if (onEditUnite) {
      // Utiliser le nouveau système unifié
      onEditUnite(unite.id, event);
    } else {
      // Fallback vers l'ancien système (deprecated)
      console.warn('⚠️ onEditUnite non fourni, utilisation du système legacy');
      handleLegacyEdit(unite);
    }
  };
  
  const handleDeleteClick = (unite, event) => {
    if (onDeleteUnite) {
      // Utiliser le nouveau système unifié
      onDeleteUnite(unite.id, unite.nom, event);
    } else {
      // Fallback vers l'ancien système (deprecated)
      console.warn('⚠️ onDeleteUnite non fourni, utilisation du système legacy');
      handleLegacyDelete(unite);
    }
  };
  
  // ===== ANCIEN SYSTÈME (DEPRECATED - À SUPPRIMER) =====
  
  const handleLegacyCreate = async () => {
    console.log('🚨 Système legacy de création d\'unité utilisé - À MIGRER');
    // Code de l'ancien système...
  };
  
  const handleLegacyEdit = async (unite) => {
    console.log('🚨 Système legacy d\'édition d\'unité utilisé - À MIGRER');
    // Code de l'ancien système...
  };
  
  const handleLegacyDelete = async (unite) => {
    console.log('🚨 Système legacy de suppression d\'unité utilisé - À MIGRER');
    
    if (!unite || !unite.id) {
      console.error('Unité invalide pour suppression');
      return;
    }
    
    setConfirmModal({
      isOpen: true,
      title: 'Supprimer l\'unité',
      message: `Êtes-vous sûr de vouloir supprimer l'unité "${unite.nom}" ?`,
      type: 'danger',
      confirmText: 'Supprimer',
      onConfirm: async () => {
        setIsSubmitting(true);
        try {
          const result = await tarificationService.deleteUnite(unite.id);
          
          if (result.success) {
            setMessage(`Unité "${unite.nom}" supprimée avec succès`);
            setMessageType('success');
            await loadUnites();
          } else {
            throw new Error(result.message || 'Erreur lors de la suppression');
          }
        } catch (error) {
          console.error('Erreur suppression unité:', error);
          setMessage(error.message || 'Erreur lors de la suppression de l\'unité');
          setMessageType('error');
        } finally {
          setIsSubmitting(false);
          setConfirmModal({ isOpen: false });
        }
      }
    });
  };
  
  // ===== ANCIEN FORMULAIRE (DEPRECATED) =====
  
  const handleSubmit = async (event) => {
    event.preventDefault();
    console.log('🚨 handleSubmit legacy appelé - CECI NE DEVRAIT PLUS ARRIVER');
    console.log('👉 Vérifiez que vous utilisez bien le nouveau système TarifGestion unifié');
    
    // Pour éviter les erreurs, on peut rediriger vers le nouveau système
    if (onCreateUnite) {
      onCreateUnite(event);
    } else {
      console.error('❌ Système legacy utilisé mais pas de fallback disponible');
    }
  };
  
  // ===== CONFIGURATION DES COLONNES =====
  
  const columns = [
    {
      label: 'Code',
      field: 'code',
      width: '100px',
      sortable: true,
      render: (unite) => (
        <span className="unite-code">
          {unite.code}
        </span>
      )
    },
    {
      label: 'Nom',
      field: 'nom',
      width: '200px',
      sortable: true,
      render: (unite) => (
        <strong className="unite-nom">
          {unite.nom}
        </strong>
      )
    },
    {
      label: 'Description',
      field: 'description',
      width: '400px',
      sortable: true,
      render: (unite) => (
        <span className="unite-description">
          {unite.description || '-'}
        </span>
      )
    },
    {
      label: '', // ✅ CORRECTION: Pas de libellé pour la colonne Actions
      field: 'actions',
      width: '120px',
      sortable: false,
      render: (unite) => (
        <UniteActions
          unite={unite}
          onEdit={(u, e) => handleEditClick(u, e)}
          onDelete={(u, e) => handleDeleteClick(u, e)}
          disabled={isSubmitting}
        />
      )
    }
  ];
  
  // ===== RENDU PRINCIPAL =====
  
  return (
    <div className="unite-gestion">
      
      {/* Header avec bouton de création */}
      <TarifFormHeader
        titre="Gestion des unités"
        description="Gérez les unités de mesure utilisées dans vos services"
      >
        <AddButton onClick={handleCreateClick}>
          Nouvelle unité
        </AddButton>
      </TarifFormHeader>
      
      {/* Tableau des unités */}
      <TableSection
        title="Liste des unités"
        data={unites}
        columns={columns}
        highlightedId={highlightedId}
        emptyMessage="Aucune unité trouvée"
        className="unite-table-section"
        defaultSort={{ field: 'nom', direction: 'asc' }}
      />
      
      {/* ===== ANCIEN FORMULAIRE - MASQUÉ ET DEPRECATED ===== */}
      <div style={{ display: 'none' }}>
        <form onSubmit={handleSubmit}>
          {/* Ancien formulaire masqué pour éviter les erreurs */}
          <input type="hidden" name="deprecated" value="true" />
        </form>
      </div>
      
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
          <strong>🔧 Debug UniteGestion :</strong><br/>
          - Unités chargées : {unites.length}<br/>
          - Highlighted ID : {highlightedId || 'aucun'}<br/>
          - Système unifié : {onCreateUnite ? '✅ Actif' : '❌ Non connecté'}<br/>
          - Is submitting : {isSubmitting ? 'Oui' : 'Non'}
        </div>
      )}
    </div>
  );
};

export default UniteGestion;