// src/components/clients/sections/ClientFormModals.jsx
// Gestion des modales pour le formulaire client - VERSION CORRIGÉE

import React, { useEffect } from 'react';
import { showConfirm } from '../../../utils/modalSystem';

/**
 * Composant pour gérer toutes les modales du formulaire client
 * ✅ CORRECTION FINALE : Utilise bien le système modal unifié pour les deux types de navigation
 */
function ClientFormModals({
  showUnsavedModal = false,
  showGlobalModal = false,
  confirmNavigation,
  cancelNavigation,
  handleConfirmGlobalNavigation,
  handleCancelGlobalNavigation,
  hasUnsavedChanges = false,
  clientName = '',
  modalOptions = {},
  navigation = null,
  onRetourListe = null
}) {

  console.log('📋 ClientFormModals - Props reçues:', {
    showUnsavedModal,
    showGlobalModal,
    hasUnsavedChanges,
    clientName
  });

  // ================================
  // ✅ MODAL POUR MODIFICATIONS NON SAUVEGARDÉES (Navigation locale - bouton Retour)
  // ================================
  
  useEffect(() => {
    if (showUnsavedModal) {
      console.log('🎭 ClientFormModals - Affichage modal locale (bouton Retour)');
      
      const modalConfig = {
        title: "Modifications non sauvegardées",
        message: `Vous avez des modifications non sauvegardées${clientName ? ` pour ${clientName}` : ''}. Souhaitez-vous vraiment quitter sans sauvegarder ?`,
        confirmText: "Quitter sans sauvegarder",
        cancelText: "Continuer l'édition",
        type: 'warning',
        size: 'medium',
        ...modalOptions.unsaved
      };

      showConfirm(modalConfig)
        .then((result) => {
          console.log('🎭 Modal locale - Résultat:', result);
          
          if (result.action === 'confirm') {
            console.log('✅ Modal locale confirmée - exécution callback');
            confirmNavigation?.();
          } else {
            console.log('❌ Modal locale annulée');
            cancelNavigation?.();
          }
        })
        .catch((error) => {
          console.error('❌ Erreur modal locale:', error);
          cancelNavigation?.();
        });
    }
  }, [showUnsavedModal, confirmNavigation, cancelNavigation, clientName, modalOptions]);

  // ================================
  // ✅ MODAL POUR NAVIGATION GLOBALE (Menu → Paiements, etc.)
  // ================================
  
  useEffect(() => {
    if (showGlobalModal) {
      console.log('🎭 ClientFormModals - Affichage modal globale (navigation menu)');
      
      const modalConfig = {
        title: "Modifications non sauvegardées",
        message: `Vous avez des modifications non sauvegardées${clientName ? ` pour ${clientName}` : ''}. Souhaitez-vous vraiment quitter sans sauvegarder ?`,
        confirmText: "Quitter sans sauvegarder",
        cancelText: "Continuer l'édition",
        type: 'warning',
        size: 'medium',
        ...modalOptions.global
      };

      showConfirm(modalConfig)
        .then((result) => {
          console.log('🎭 Modal globale - Résultat:', result);
          
          if (result.action === 'confirm') {
            console.log('✅ Modal globale confirmée - exécution callback de navigation');
            handleConfirmGlobalNavigation?.();
          } else {
            console.log('❌ Modal globale annulée');
            handleCancelGlobalNavigation?.();
          }
        })
        .catch((error) => {
          console.error('❌ Erreur modal globale:', error);
          handleCancelGlobalNavigation?.();
        });
    }
  }, [showGlobalModal, handleConfirmGlobalNavigation, handleCancelGlobalNavigation, clientName, modalOptions]);

  // ================================
  // RENDU
  // ================================

  // Ce composant ne rend rien car il utilise le modalSystem via useEffect
  // Les modales sont créées directement par showConfirm()
  return null;
}

export default ClientFormModals;