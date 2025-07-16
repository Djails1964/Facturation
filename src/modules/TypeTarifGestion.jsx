import React, { useState } from 'react';
import TypeTarifForm from '../components/forms/TypeTarifForm';
import TypeTarifList from '../components/lists/TypeTarifList';

const TypeTarifGestion = ({
  typesTarifs,
  tarificationService,
  setMessage,
  setMessageType,
  setConfirmModal,
  loadTypesTarifs
}) => {
  // États locaux
  const [editTypeTarif, setEditTypeTarif] = useState(null);
  const [newTypeTarif, setNewTypeTarif] = useState({ 
    code: '', 
    nom: '', 
    description: '' 
  });

  // Gestionnaires pour le nouveau type de tarif
  const handleNewTypeTarifChange = (e) => {
    const { name, value } = e.target;
    setNewTypeTarif(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Gestionnaires pour l'édition de type de tarif
  const handleEditTypeTarifChange = (e) => {
    const { name, value } = e.target;
    setEditTypeTarif(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Soumettre un nouveau type de tarif
  const handleSubmitTypeTarif = async (e) => {
    e.preventDefault();
    try {
      const result = await tarificationService.createTypeTarif(newTypeTarif);
      
      if (result.success) {
        setMessage('Type de tarif créé avec succès');
        setMessageType('success');
        setNewTypeTarif({ code: '', nom: '', description: '' });
        await loadTypesTarifs();
      } else {
        throw new Error(result.message || 'Erreur lors de la création du type de tarif');
      }
    } catch (error) {
      console.error('Erreur lors de la création du type de tarif:', error);
      setMessage('Erreur lors de la création du type de tarif: ' + error.message);
      setMessageType('error');
    }
  };

  // Mettre à jour un type de tarif existant
  const handleUpdateTypeTarif = async (e) => {
    e.preventDefault();
    try {
      const result = await tarificationService.updateTypeTarif(editTypeTarif.id, editTypeTarif);
      
      if (result.success) {
        setMessage('Type de tarif mis à jour avec succès');
        setMessageType('success');
        setEditTypeTarif(null);
        await loadTypesTarifs();
      } else {
        throw new Error(result.message || 'Erreur lors de la mise à jour du type de tarif');
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du type de tarif:', error);
      setMessage('Erreur lors de la mise à jour du type de tarif: ' + error.message);
      setMessageType('error');
    }
  };

  // Préparer l'édition d'un type de tarif
  const handleEditTypeTarifInit = (typeTarif) => {
    setEditTypeTarif({ ...typeTarif });
  };

  // Supprimer un type de tarif
  const handleDeleteTypeTarif = async (id) => {
    const typeTarif = typesTarifs.find(tt => tt.id === id);
    if (!typeTarif) return;
    
    try {
      // Vérifier d'abord si le type de tarif est utilisé dans des tarifs
      const checkResult = await tarificationService.checkTypeTarifUsage(id);
      
      if (checkResult.isUsed) {
        // Si le type de tarif est utilisé, afficher un message d'erreur sans confirmation
        setConfirmModal({
          isOpen: true,
          title: 'Suppression impossible',
          message: `Le type de tarif "${typeTarif.nom}" ne peut pas être supprimé car il est utilisé dans ${checkResult.count} tarif(s).`,
          onConfirm: () => {
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
          },
          type: 'warning',
          confirmText: 'OK',
          entityType: 'typeTarif',
          singleButton: true // Afficher uniquement le bouton OK
        });
      } else {
        // Si le type de tarif n'est pas utilisé, demander confirmation pour le supprimer
        setConfirmModal({
          isOpen: true,
          title: 'Confirmation de suppression',
          message: `Êtes-vous sûr de vouloir supprimer le type de tarif "${typeTarif.nom}" ?`,
          onConfirm: async () => {
            try {
              const result = await tarificationService.deleteTypeTarif(id);
              
              if (result.success) {
                setMessage('Type de tarif supprimé avec succès');
                setMessageType('success');
                await loadTypesTarifs();
              } else {
                throw new Error(result.message || 'Erreur lors de la suppression du type de tarif');
              }
            } catch (error) {
              console.error('Erreur lors de la suppression du type de tarif:', error);
              setMessage('Erreur lors de la suppression du type de tarif: ' + error.message);
              setMessageType('error');
            } finally {
              setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }
          },
          type: 'danger',
          confirmText: 'Supprimer',
          entityType: 'typeTarif'
        });
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'utilisation du type de tarif:', error);
      setMessage('Erreur: ' + error.message);
      setMessageType('error');
    }
  };

  // Annuler l'édition
  const handleCancelEdit = () => {
    setEditTypeTarif(null);
  };

  // ✅ NOUVEAU: Titre dynamique harmonisé
  const getTitle = () => {
    if (editTypeTarif) {
      return `Gestion des types de tarifs - Modifier le type "${editTypeTarif?.nom || ''}"`;
    }
    return "Gestion des types de tarifs - Ajouter un type de tarif";
  };

  return (
    <div className="tarif-tab-content">
      {/* ✅ TITRE HARMONISÉ avec les autres sections */}
      <h3 className="sous-groupe-titre">{getTitle()}</h3>
      
      {/* Formulaire d'ajout/édition de type de tarif */}
      {!editTypeTarif ? (
        <div className="parametre-sous-groupe" style={{ marginBottom: '40px' }}> {/* ✅ ESPACEMENT */}
          <TypeTarifForm
            typeTarif={newTypeTarif}
            onChange={handleNewTypeTarifChange}
            onSubmit={handleSubmitTypeTarif}
            buttonText="Ajouter"
          />
        </div>
      ) : (
        <div className="parametre-sous-groupe" style={{ marginBottom: '40px' }}> {/* ✅ ESPACEMENT */}
          <TypeTarifForm
            typeTarif={editTypeTarif}
            onChange={handleEditTypeTarifChange}
            onSubmit={handleUpdateTypeTarif}
            buttonText="Enregistrer"
            onCancel={handleCancelEdit}
          />
        </div>
      )}

      {/* Liste des types de tarifs */}
      <div className="parametre-sous-groupe">
        <h4>Liste des types de tarifs</h4>
        <TypeTarifList 
          typesTarifs={typesTarifs}
          onEdit={handleEditTypeTarifInit}
          onDelete={handleDeleteTypeTarif}
        />
      </div>
    </div>
  );

};

export default TypeTarifGestion;