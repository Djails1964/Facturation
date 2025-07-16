import React, { useState } from 'react';
import ServiceForm from '../components/forms/ServiceForm';
import ServiceList from '../components/lists/ServiceList';

const ServiceGestion = ({ 
  services, 
  tarificationService, 
  setMessage, 
  setMessageType, 
  setConfirmModal,
  loadServices
}) => {
  // États locaux
  const [editService, setEditService] = useState(null);
  const [newService, setNewService] = useState({ 
    code: '', 
    nom: '', 
    description: '', 
    actif: true,
    isDefault: false 
  });

  // Gestionnaires pour le nouveau service
  const handleNewServiceChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewService(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Gestionnaires pour l'édition de service
  const handleEditServiceChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditService(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleDeleteService = async (id) => {
    const service = services.find(s => s.id === id);
    if (!service) return;
    
    try {
      // Vérifier si le service est utilisé dans des factures ou ailleurs
      const checkResult = await tarificationService.checkServiceUsage(id);
      
      if (checkResult.isUsed) {
        // Si le service est utilisé, afficher un message d'erreur sans confirmation
        setConfirmModal({
          isOpen: true,
          title: 'Suppression impossible',
          message: `Le service "${service.nom}" ne peut pas être supprimé car il est utilisé dans des factures ou des tarifs.`,
          onConfirm: () => {
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
          },
          type: 'info',
          confirmText: 'OK',
          entityType: 'service',
          singleButton: true // Afficher uniquement le bouton OK
        });
      } else {
        // Si le service n'est pas utilisé, demander confirmation pour le supprimer
        setConfirmModal({
          isOpen: true,
          title: 'Confirmation de suppression',
          message: `Êtes-vous sûr de vouloir supprimer le service "${service.nom}" ?`,
          onConfirm: async () => {
            try {
              const result = await tarificationService.deleteService(id);
              
              if (result.success) {
                setMessage('Service supprimé avec succès');
                setMessageType('success');
                await loadServices();
              } else {
                throw new Error(result.message || 'Erreur lors de la suppression du service');
              }
            } catch (error) {
              console.error('Erreur lors de la suppression du service:', error);
              setMessage('Erreur lors de la suppression du service: ' + error.message);
              setMessageType('error');
            } finally {
              setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }
          },
          type: 'danger',
          confirmText: 'Supprimer',
          entityType: 'service'
        });
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'utilisation du service:', error);
      setMessage('Erreur: ' + error.message);
      setMessageType('error');
    }
  };

  // Soumettre un nouveau service
  const handleSubmitService = async (e) => {
    e.preventDefault();
    try {
      const result = await tarificationService.createService(newService);
      
      if (result.success) {
        setMessage('Service créé avec succès');
        setMessageType('success');
        setNewService({ code: '', nom: '', description: '', actif: true, isDefault: false });
        await loadServices();
      } else {
        throw new Error(result.message || 'Erreur lors de la création du service');
      }
    } catch (error) {
      console.error('Erreur lors de la création du service:', error);
      setMessage('Erreur lors de la création du service: ' + error.message);
      setMessageType('error');
    }
  };

  // Mettre à jour un service existant
  const handleUpdateService = async (e) => {
    e.preventDefault();
    try {
      const result = await tarificationService.updateService(editService.id, editService);
      
      if (result.success) {
        setMessage('Service mis à jour avec succès');
        setMessageType('success');
        setEditService(null);
        await loadServices();
      } else {
        throw new Error(result.message || 'Erreur lors de la mise à jour du service');
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du service:', error);
      setMessage('Erreur lors de la mise à jour du service: ' + error.message);
      setMessageType('error');
    }
  };

  // Préparer l'édition d'un service
  const handleEditServiceInit = (service) => {
    setEditService({ ...service });
  };

  // Annuler l'édition
  const handleCancelEdit = () => {
    setEditService(null);
  };

  // ✅ Titre dynamique sur une seule ligne
  const getTitle = () => {
    if (editService) {
      return `Gestion des services - Modifier le service "${editService?.nom || ''}"`;
    }
    return "Gestion des services - Ajouter un service";
  };


  return (
    <div className="tarif-tab-content">
      <h3 className="sous-groupe-titre">{getTitle()}</h3>
      
      {/* Formulaire d'ajout/édition de service */}
      {!editService ? (
        <div className="parametre-sous-groupe">
          <ServiceForm
            service={newService}
            onChange={handleNewServiceChange}
            onSubmit={handleSubmitService}
            buttonText="Ajouter"
          />
        </div>
      ) : (
        <div className="parametre-sous-groupe">
          <ServiceForm
            service={editService}
            onChange={handleEditServiceChange}
            onSubmit={handleUpdateService}
            buttonText="Enregistrer"
            onCancel={handleCancelEdit}
          />
        </div>
      )}

      {/* Liste des services */}
      <div className="parametre-sous-groupe">
        <h4>Liste des services</h4>
        <ServiceList 
          services={services}
          onEdit={handleEditServiceInit}
          onDelete={handleDeleteService}
        />
      </div>
    </div>
  );
};

export default ServiceGestion;