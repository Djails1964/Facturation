import React, { useState, useEffect } from 'react';
import { useTypeTarifForm } from '../hooks/useTypeTarifForm';
import TypeTarifTableSection from '../sections/TypeTarifTableSection';
import TarifFormHeader from '../sections/TarifFormHeader'; // ✅ AJOUT
import { AddButton } from '../../../components/ui/buttons'; // ✅ AJOUT

const TypeTarifGestion = ({ 
  typesTarifs, 
  setTypesTarifs, 
  tarificationService, 
  setMessage, 
  setMessageType, 
  setConfirmModal,
  loadTypesTarifs,
  highlightedId,
  // ✅ AJOUT : Nouveaux handlers du système unifié
  onCreateTypeTarif,
  onEditTypeTarif,
  onDeleteTypeTarif
}) => {
  const [editingTypeTarif, setEditingTypeTarif] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const typeTarifForm = useTypeTarifForm();

  // Filtrer les types de tarifs
  const filteredTypesTarifs = typesTarifs.filter(typeTarif => 
    typeTarif.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    typeTarif.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ===== HANDLERS POUR LE SYSTÈME UNIFIÉ =====
  
  const handleCreateClick = (event) => {
    if (onCreateTypeTarif) {
      // Utiliser le nouveau système unifié
      onCreateTypeTarif(event);
    } else {
      // Fallback vers l'ancien système (deprecated)
      console.warn('⚠️ onCreateTypeTarif non fourni, utilisation du système legacy');
      handleLegacyCreate();
    }
  };
  
  const handleEditClick = (typeTarif, event) => {
    if (onEditTypeTarif) {
      // Utiliser le nouveau système unifié
      onEditTypeTarif(typeTarif.id, event);
    } else {
      // Fallback vers l'ancien système (deprecated)
      console.warn('⚠️ onEditTypeTarif non fourni, utilisation du système legacy');
      handleModifierTypeTarif(typeTarif);
    }
  };
  
  const handleDeleteClick = (typeTarif, event) => {
    if (onDeleteTypeTarif) {
      // Utiliser le nouveau système unifié
      onDeleteTypeTarif(typeTarif.id, typeTarif.nom, event);
    } else {
      // Fallback vers l'ancien système (deprecated)
      console.warn('⚠️ onDeleteTypeTarif non fourni, utilisation du système legacy');
      handleSupprimerTypeTarif(typeTarif);
    }
  };

  // ===== ANCIEN SYSTÈME (DEPRECATED - À SUPPRIMER) =====

  const handleLegacyCreate = async () => {
    console.log('🚨 Système legacy de création de type de tarif utilisé - À MIGRER');
    // Code de l'ancien système...
  };

  // Reset du formulaire lors de l'édition
  useEffect(() => {
    if (editingTypeTarif) {
      typeTarifForm.setTypeTarif({
        code: editingTypeTarif.code || '',
        nom: editingTypeTarif.nom || '',
        description: editingTypeTarif.description || ''
      });
    } else {
      typeTarifForm.resetForm();
    }
  }, [editingTypeTarif, typeTarifForm]);

  // Handlers (legacy - à supprimer progressivement)
  const handleModifierTypeTarif = (typeTarif) => {
    setEditingTypeTarif(typeTarif);
  };

  const handleAnnuler = () => {
    setEditingTypeTarif(null);
    typeTarifForm.resetForm();
  };

  const handleSupprimerTypeTarif = (typeTarif) => {
    setConfirmModal({
      isOpen: true,
      title: 'Confirmer la suppression',
      message: `Êtes-vous sûr de vouloir supprimer le type de tarif "${typeTarif.nom}" ?`,
      type: 'danger',
      confirmText: 'Supprimer',
      onConfirm: () => confirmerSuppression(typeTarif.id),
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

  const handleSubmitTypeTarif = async (e) => {
    e.preventDefault();
    console.log('🚨 handleSubmitTypeTarif legacy appelé - CECI NE DEVRAIT PLUS ARRIVER');
    console.log('👉 Vérifiez que vous utilisez bien le nouveau système TarifGestion unifié');
    
    // Pour éviter les erreurs, on peut rediriger vers le nouveau système
    if (onCreateTypeTarif) {
      onCreateTypeTarif(e);
    } else {
      console.error('❌ Système legacy utilisé mais pas de fallback disponible');
    }
  };

  return (
    <div className="type-tarif-gestion">
      {/* ✅ EN-TÊTE UNIFIÉ AVEC BOUTON D'ACTION */}
      <TarifFormHeader
        titre="Types de tarifs"
        description="Définissez les différents types de tarification (normal, urgent, weekend, etc.)"
      >
        <AddButton onClick={handleCreateClick}>
          Nouveau type de tarif
        </AddButton>
      </TarifFormHeader>

      {/* ✅ SUPPRESSION DU FORMULAIRE INTÉGRÉ - Remplacé par modal unifiée */}
      
      {/* ===== SECTION LISTE AVEC TABLE SECTION ===== */}
      <TypeTarifTableSection
        typesTarifs={filteredTypesTarifs}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
        highlightedId={highlightedId}
        isSubmitting={isSubmitting}
      />
      
      {/* ===== ANCIEN FORMULAIRE - MASQUÉ ET DEPRECATED ===== */}
      <div style={{ display: 'none' }}>
        <form onSubmit={handleSubmitTypeTarif}>
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
          <strong>🔧 Debug TypeTarifGestion :</strong><br/>
          - Types de tarifs chargés : {typesTarifs.length}<br/>
          - Highlighted ID : {highlightedId || 'aucun'}<br/>
          - Système unifié : {onCreateTypeTarif ? '✅ Actif' : '❌ Non connecté'}<br/>
          - Is submitting : {isSubmitting ? 'Oui' : 'Non'}
        </div>
      )}
    </div>
  );
};

export default TypeTarifGestion;