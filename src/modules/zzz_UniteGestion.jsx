import React, { useState } from 'react';
import UniteForm from '../components/forms/UniteForm';
import UniteList from '../components/lists/UniteList';

const UniteGestion = ({
  unites,
  tarificationService,
  setMessage,
  setMessageType,
  setConfirmModal,
  loadUnites
}) => {
  // États locaux
  const [editUnite, setEditUnite] = useState(null);
  const [newUnite, setNewUnite] = useState({
    code: '',
    nom: '',
    description: ''
  });

  // Gestionnaires pour la nouvelle unité
  const handleNewUniteChange = (e) => {
    const { name, value } = e.target;
    setNewUnite(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Gestionnaires pour l'édition d'unité
  const handleEditUniteChange = (e) => {
    const { name, value } = e.target;
    setEditUnite(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Soumettre une nouvelle unité
  const handleSubmitUnite = async (e) => {
    e.preventDefault();
    try {
      const result = await tarificationService.createUnite(newUnite);
      
      if (result.success) {
        setMessage('Unité créée avec succès');
        setMessageType('success');
        setNewUnite({ code: '', nom: '', description: '' });
        await loadUnites();
      } else {
        throw new Error(result.message || 'Erreur lors de la création de l\'unité');
      }
    } catch (error) {
      console.error('Erreur lors de la création de l\'unité:', error);
      setMessage('Erreur lors de la création de l\'unité: ' + error.message);
      setMessageType('error');
    }
  };

  // Mettre à jour une unité existante
  const handleUpdateUnite = async (e) => {
    e.preventDefault();
    try {
      const result = await tarificationService.updateUnite(editUnite.id, editUnite);
      
      if (result.success) {
        setMessage('Unité mise à jour avec succès');
        setMessageType('success');
        setEditUnite(null);
        await loadUnites();
      } else {
        throw new Error(result.message || 'Erreur lors de la mise à jour de l\'unité');
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'unité:', error);
      setMessage('Erreur lors de la mise à jour de l\'unité: ' + error.message);
      setMessageType('error');
    }
  };

  // Préparer l'édition d'une unité
  const handleEditUniteInit = (unite) => {
    setEditUnite({ ...unite });
  };

  // Supprimer une unité
  const handleDeleteUnite = async (id) => {
    const unite = unites.find(u => u.id === id);
    if (!unite) return;
    
    try {
      // Vérifier si l'unité est utilisée dans des factures ou ailleurs
      const checkResult = await tarificationService.checkUniteUsage(id);
      
      if (checkResult.isUsed) {
        // Si l'unité est utilisée, afficher un message d'erreur sans confirmation
        setConfirmModal({
          isOpen: true,
          title: 'Suppression impossible',
          message: `L'unité "${unite.nomUnite}" ne peut pas être supprimée car elle est utilisée dans des factures ou des tarifs.`,
          onConfirm: () => {
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
          },
          type: 'info',
          confirmText: 'OK',
          entityType: 'unite',
          singleButton: true // Afficher uniquement le bouton OK
        });
      } else {
        // Si l'unité n'est pas utilisée, demander confirmation pour la supprimer
        setConfirmModal({
          isOpen: true,
          title: 'Confirmation de suppression',
          message: `Êtes-vous sûr de vouloir supprimer l'unité "${unite.nomUnite}" ?`,
          onConfirm: async () => {
            try {
              const result = await tarificationService.deleteUnite(id);
              
              if (result.success) {
                setMessage('Unité supprimée avec succès');
                setMessageType('success');
                await loadUnites();
              } else {
                throw new Error(result.message || 'Erreur lors de la suppression de l\'unité');
              }
            } catch (error) {
              console.error('Erreur lors de la suppression de l\'unité:', error);
              setMessage('Erreur lors de la suppression de l\'unité: ' + error.message);
              setMessageType('error');
            } finally {
              setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }
          },
          type: 'danger',
          confirmText: 'Supprimer',
          entityType: 'unite'
        });
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'utilisation de l\'unité:', error);
      setMessage('Erreur: ' + error.message);
      setMessageType('error');
    }
  };

  // Annuler l'édition
  const handleCancelEdit = () => {
    setEditUnite(null);
  };

    // ✅ Titre dynamique sur une seule ligne
  const getTitle = () => {
    if (editUnite) {
      return `Gestion des unités - Modifier l'unité "${editUnite?.nomUnite || ''}"`;
    }
    return "Gestion des unités - Ajouter une unité";
  };


  return (
    <div className="tarif-tab-content">
      <h3 className="sous-groupe-titre">{getTitle()}</h3>
      
      {/* Formulaire d'ajout/édition d'unité */}
      {!editUnite ? (
        <div className="parametre-sous-groupe" style={{ marginBottom: '40px' }}> {/* ✅ AJOUT */}
          <UniteForm
            unite={newUnite}
            onChange={handleNewUniteChange}
            onSubmit={handleSubmitUnite}
            buttonText="Ajouter"
          />
        </div>
      ) : (
        <div className="parametre-sous-groupe" style={{ marginBottom: '40px' }}> {/* ✅ AJOUT */}
          <UniteForm
            unite={editUnite}
            onChange={handleEditUniteChange}
            onSubmit={handleUpdateUnite}
            buttonText="Enregistrer"
            onCancel={handleCancelEdit}
          />
        </div>
      )}

      {/* Liste des unités */}
      <div className="parametre-sous-groupe">
        <h4>Liste des unités</h4>
        <UniteList 
          unites={unites}
          onEdit={handleEditUniteInit}
          onDelete={handleDeleteUnite}
        />
      </div>
    </div>
  );
};

export default UniteGestion;