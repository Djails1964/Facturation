import React, { useEffect } from 'react';
import { createLogger } from '../../../utils/createLogger';
import { showConfirm, showError, showWarning, showInfo } from '../../../utils/modalSystem';
import { UNSAVED_CHANGES_CONFIRM_CONFIG, UNSAVED_CHANGES_MESSAGES } from '../../../constants/appConstants';

const log = createLogger('FactureFormModals');

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
  
  // Gérer la modal de modifications non sauvegardées (navigation locale)
  // ✅ VRAIE CONFIRMATION = 2 boutons
  useEffect(() => {
    if (showUnsavedModal) {
      showConfirm(UNSAVED_CHANGES_CONFIRM_CONFIG(UNSAVED_CHANGES_MESSAGES.FACTURE))
        .then((result) => {
          if (result.action === 'confirm') {
            confirmNavigation();
          } else {
            cancelNavigation();
          }
        });
    }
  }, [showUnsavedModal, confirmNavigation, cancelNavigation]);

  // Gérer la modal de modifications non sauvegardées (navigation externe)
  // ✅ VRAIE CONFIRMATION = 2 boutons
  useEffect(() => {
    if (showGlobalModal) {
      showConfirm(UNSAVED_CHANGES_CONFIRM_CONFIG(UNSAVED_CHANGES_MESSAGES.FACTURE))
        .then((result) => {
          if (result.action === 'confirm') {
            onConfirmGlobal();
          } else {
            onCancelGlobal();
          }
        });
    }
  }, [showGlobalModal, onConfirmGlobal, onCancelGlobal]);

  // Gérer les modales d'information/erreur/avertissement
  // ✅ INFORMATION = 1 bouton (OK seulement)
  useEffect(() => {
    if (confirmModal?.isOpen) {
      let modalPromise;
      
      // Choisir la bonne fonction selon le type
      switch (confirmModal.type) {
        case 'error':
          modalPromise = showError(confirmModal.message, confirmModal.title);
          break;
        case 'warning':
          modalPromise = showWarning(confirmModal.message, confirmModal.title);
          break;
        case 'info':
        default:
          modalPromise = showInfo(confirmModal.message, confirmModal.title);
          break;
      }
      
      modalPromise.then(() => {
        onCloseConfirmModal();
      });
    }
  }, [confirmModal, onCloseConfirmModal]);

  // Ce composant ne rend rien dans le DOM, tout est géré par le système modal unifié
  return null;
};