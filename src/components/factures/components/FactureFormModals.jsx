import React from 'react';
import ConfirmationModal from '../../shared/ConfirmationModal';

export const FactureFormModals = ({
  showUnsavedModal,
  showGlobalModal,
  confirmNavigation,
  cancelNavigation,
  onConfirmGlobal,
  onCancelGlobal,
  confirmModal,
  onCloseConfirmModal
}) => {
  return (
    <>
      {/* Modal pour les modifications non sauvegardées (navigation locale via bouton Annuler) */}
      <ConfirmationModal
        isOpen={showUnsavedModal}
        title="Modifications non sauvegardées"
        message="Vous avez des modifications non sauvegardées dans le formulaire de facture. Souhaitez-vous vraiment quitter sans sauvegarder ?"
        type="warning"
        onConfirm={confirmNavigation}
        onCancel={cancelNavigation}
        confirmText="Quitter sans sauvegarder"
        cancelText="Continuer l'édition"
        singleButton={false}
      />

      {/* Modal pour les modifications non sauvegardées (navigation externe via menu/déconnexion) */}
      <ConfirmationModal
        isOpen={showGlobalModal}
        title="Modifications non sauvegardées"
        message="Vous avez des modifications non sauvegardées dans le formulaire de facture. Souhaitez-vous vraiment quitter sans sauvegarder ?"
        type="warning"
        onConfirm={onConfirmGlobal}
        onCancel={onCancelGlobal}
        confirmText="Quitter sans sauvegarder"
        cancelText="Continuer l'édition"
        singleButton={false}
      />

      {/* Modal pour les erreurs générales */}
      {confirmModal && (
        <ConfirmationModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          type={confirmModal.type}
          onConfirm={onCloseConfirmModal}
          onCancel={onCloseConfirmModal}
          singleButton={true}
        />
      )}
    </>
  );
};