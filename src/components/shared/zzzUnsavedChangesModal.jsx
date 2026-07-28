// src/components/shared/UnsavedChangesModal.jsx
import React from 'react';
import { FiAlertTriangle, FiSave, FiX } from 'react-icons/fi';
import GenericModal from './GenericModal';
import '../../styles/shared/UnsavedChangesModal.css';

/**
 * Modal de confirmation pour les modifications non sauvegardées
 */
const UnsavedChangesModal = ({
  isOpen,
  onSave,
  onDiscard,
  onCancel,
  entityType = 'document',
  customMessage = null,
  showSaveOption = true
}) => {
  // Messages par type d'entité
  const getDefaultMessage = () => {
    const messages = {
      facture: 'Vous avez des modifications non sauvegardées dans cette facture.',
      client: 'Vous avez des modifications non sauvegardées pour ce client.',
      document: 'Vous avez des modifications non sauvegardées.',
      tarif: 'Vous avez des modifications non sauvegardées dans les tarifs.',
      parametre: 'Vous avez des modifications non sauvegardées dans les paramètres.'
    };
    return messages[entityType] || messages.document;
  };

  const message = customMessage || getDefaultMessage();

  const renderActions = () => {
    const actions = [];

    // Bouton Annuler (toujours présent)
    actions.push(
      <button
        key="cancel"
        className="modal-action-button modal-action-secondary"
        onClick={onCancel}
      >
        <span>Rester sur la page</span>
      </button>
    );

    // Bouton Sauvegarder (si disponible)
    if (showSaveOption && onSave) {
      actions.push(
        <button
          key="save"
          className="modal-action-button modal-action-primary"
          onClick={onSave}
        >
          <FiSave size={16} style={{ marginRight: '8px' }} />
          <span>Sauvegarder et quitter</span>
        </button>
      );
    }

    // Bouton Quitter sans sauvegarder
    actions.push(
      <button
        key="discard"
        className="modal-action-button modal-action-danger"
        onClick={onDiscard}
      >
        <FiX size={16} style={{ marginRight: '8px' }} />
        <span>Quitter sans sauvegarder</span>
      </button>
    );

    return actions;
  };

  return (
    <GenericModal
      isOpen={isOpen}
      onClose={onCancel}
      title="Modifications non sauvegardées"
      actions={renderActions()}
      className="unsaved-changes-modal"
    >
      <div className="unsaved-changes-content">
        <div className="unsaved-changes-icon">
          <FiAlertTriangle size={48} color="#ff6b35" />
        </div>
        
        <div className="unsaved-changes-message">
          <p className="main-message">{message}</p>
          <p className="sub-message">
            Que souhaitez-vous faire ?
          </p>
        </div>

        <div className="unsaved-changes-options">
          <div className="option-item">
            <strong>Rester sur la page :</strong> Continue l'édition
          </div>
          
          {showSaveOption && onSave && (
            <div className="option-item save-option">
              <strong>Sauvegarder et quitter :</strong> Enregistre les modifications puis quitte
            </div>
          )}
          
          <div className="option-item danger-option">
            <strong>Quitter sans sauvegarder :</strong> Perd toutes les modifications
          </div>
        </div>
      </div>
    </GenericModal>
  );
};

export default UnsavedChangesModal;