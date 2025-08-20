// ServiceGestion.jsx - Version mise à jour pour intégration avec TarifGestion unifié
import React, { useState, useEffect } from 'react';
import { ServiceActions } from '../sections/TarifListActions';
import TableSection from '../sections/TableSection';
import { AddButton } from '../../../components/ui/buttons';
import TarifFormHeader from '../sections/TarifFormHeader';

const ServiceGestion = ({ 
  services = [],
  loadServices,
  highlightedId,
  tarificationService,
  setMessage,
  setMessageType,
  setConfirmModal,
  // Nouveaux handlers du système unifié
  onCreateService,
  onEditService,
  onDeleteService
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // ===== HANDLERS POUR LE SYSTÈME UNIFIÉ =====
  
  const handleCreateClick = (event) => {
    if (onCreateService) {
      // Utiliser le nouveau système unifié
      onCreateService(event);
    } else {
      // Fallback vers l'ancien système (deprecated)
      console.warn('⚠️ onCreateService non fourni, utilisation du système legacy');
      handleLegacyCreate();
    }
  };
  
  const handleEditClick = (service, event) => {
    if (onEditService) {
      // Utiliser le nouveau système unifié
      onEditService(service.id, event);
    } else {
      // Fallback vers l'ancien système (deprecated)
      console.warn('⚠️ onEditService non fourni, utilisation du système legacy');
      handleLegacyEdit(service);
    }
  };
  
  const handleDeleteClick = (service, event) => {
    if (onDeleteService) {
      // Utiliser le nouveau système unifié
      onDeleteService(service.id, service.nom, event);
    } else {
      // Fallback vers l'ancien système (deprecated)
      console.warn('⚠️ onDeleteService non fourni, utilisation du système legacy');
      handleLegacyDelete(service);
    }
  };
  
  // ===== ANCIEN SYSTÈME (DEPRECATED - À SUPPRIMER) =====
  
  const handleLegacyCreate = async () => {
    console.log('🚨 Système legacy de création de service utilisé - À MIGRER');
    // Code de l'ancien système...
  };
  
  const handleLegacyEdit = async (service) => {
    console.log('🚨 Système legacy d\'édition de service utilisé - À MIGRER');
    // Code de l'ancien système...
  };
  
  const handleLegacyDelete = async (service) => {
    console.log('🚨 Système legacy de suppression de service utilisé - À MIGRER');
    
    if (!service || !service.id) {
      console.error('Service invalide pour suppression');
      return;
    }
    
    setConfirmModal({
      isOpen: true,
      title: 'Supprimer le service',
      message: `Êtes-vous sûr de vouloir supprimer le service "${service.nom}" ?`,
      type: 'danger',
      confirmText: 'Supprimer',
      onConfirm: async () => {
        setIsSubmitting(true);
        try {
          const result = await tarificationService.deleteService(service.id);
          
          if (result.success) {
            setMessage(`Service "${service.nom}" supprimé avec succès`);
            setMessageType('success');
            await loadServices();
          } else {
            throw new Error(result.message || 'Erreur lors de la suppression');
          }
        } catch (error) {
          console.error('Erreur suppression service:', error);
          setMessage(error.message || 'Erreur lors de la suppression du service');
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
    if (onCreateService) {
      onCreateService(event);
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
      render: (service) => (
        <span className="service-code">
          {service.code}
        </span>
      )
    },
    {
      label: 'Nom',
      field: 'nom',
      width: '200px',
      sortable: true,
      render: (service) => (
        <strong className="service-nom">
          {service.nom}
        </strong>
      )
    },
    {
      label: 'Description',
      field: 'description',
      width: '300px',
      sortable: true,
      render: (service) => (
        <span className="service-description">
          {service.description || '-'}
        </span>
      )
    },
    {
      label: 'Statut',
      field: 'actif',
      width: '100px',
      sortable: true,
      render: (service) => (
        <span className={`etat-badge ${service.actif ? 'etat-confirme' : 'etat-annulee'}`}>
          {service.actif ? 'Actif' : 'Inactif'}
        </span>
      )
    },
    {
      label: '',
      field: 'actions',
      width: '120px',
      sortable: false,
      render: (service) => (
        <ServiceActions
          service={service}
          onEdit={(s, e) => handleEditClick(s, e)}
          onDelete={(s, e) => handleDeleteClick(s, e)}
          disabled={isSubmitting}
        />
      )
    }
  ];
  
  // ===== RENDU PRINCIPAL =====
  
  return (
    <div className="service-gestion">
      
      {/* Header avec bouton de création */}
      <TarifFormHeader
        titre="Gestion des services"
        description="Gérez les services proposés par votre entreprise"
      >
        <AddButton onClick={handleCreateClick}>
          Nouveau service
        </AddButton>
      </TarifFormHeader>
      
      {/* Tableau des services */}
      <TableSection
        title="Liste des services"
        data={services}
        columns={columns}
        highlightedId={highlightedId}
        emptyMessage="Aucun service trouvé"
        className="service-table-section"
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
          <strong>🔧 Debug ServiceGestion :</strong><br/>
          - Services chargés : {services.length}<br/>
          - Highlighted ID : {highlightedId || 'aucun'}<br/>
          - Système unifié : {onCreateService ? '✅ Actif' : '❌ Non connecté'}<br/>
          - Is submitting : {isSubmitting ? 'Oui' : 'Non'}
        </div>
      )}
    </div>
  );
};

export default ServiceGestion;