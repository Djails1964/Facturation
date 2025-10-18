// src/components/users/GestionUtilisateurs.jsx
/**
 * Composant principal de gestion des utilisateurs
 * ✅ Passe le logger aux hooks de modales
 * Gère la navigation entre la vue liste et la vue formulaire
 * Coordonne les opérations CRUD sur les utilisateurs
 */

import React, { useState, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { FiUserPlus } from 'react-icons/fi';
import '../../styles/components/users/GestionUtilisateurs.css';

// Hooks personnalisés
import { useLogger } from '../../hooks/useLogger';
import { useUsers } from './hooks/useUsers';
import { useNotifications } from '../../services/NotificationService';
import { useUserModals } from './hooks/useUserModals';

// Composants
import UserListTable from './UserListTable';
import UserForm from './UserForm';

// Services
import authService from '../../services/authService';
import { showCustom, showLoading } from '../../utils/modalSystem';

// Constantes et helpers
import { 
  USER_FORM_MODES,
  USER_ERROR_MESSAGES,
  USER_SUCCESS_MESSAGES
} from '../../constants/userConstants';
import { 
  canManageUsers, 
  userToFormData,
  createEmptyUser 
} from './helpers/userHelpers';

/**
 * Composant de gestion des utilisateurs
 * ✅ Navigation liste ↔ formulaire
 * ✅ UserForm s'affiche dans la section principale
 * ✅ DeleteUserHandler pour la suppression via modal
 */
function GestionUtilisateurs() {
  // Logger pour ce composant
  const { log } = useLogger('GestionUtilisateurs');

  const userContext = useOutletContext();
  const user = userContext?.user;
  
  const {
    users,
    loading,
    error,
    fetchUsers
  } = useUsers();

  const { showSuccess, showError, showWarning } = useNotifications();
  const addButtonRef = useRef(null);

  // Gestion de l'affichage : 'liste' ou 'formulaire'
  const [activeView, setActiveView] = useState('liste');
  const [currentMode, setCurrentMode] = useState(USER_FORM_MODES.VIEW);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserData, setCurrentUserData] = useState(null);

  const canManage = canManageUsers(user);

  // ✅ Configuration des dépendances pour les handlers de suppression
  // Inclut maintenant le logger
  const modalDependencies = {
    authService,
    showCustom,
    showLoading,
    log,  // ✅ Passer le logger ici
    onSetNotification: (message, type) => {
      if (type === 'success') showSuccess(message);
      else if (type === 'error') showError(message);
      else showWarning(message);
    },
    onUserDeleted: (userId) => {
      log.info('Utilisateur supprimé avec succès', { userId });
      fetchUsers();
    },
    fetchUsers
  };

  // Hook pour gérer la suppression d'utilisateurs
  const { handleSupprimerUtilisateur } = useUserModals(modalDependencies);

  /**
   * Ouvre le formulaire de création d'un nouvel utilisateur
   */
  const handleNouvelUtilisateur = () => {
    if (!canManage) {
      log.warn('Tentative de création sans permissions');
      showError(USER_ERROR_MESSAGES.ACCESS_DENIED);
      return;
    }

    log.info('Ouverture formulaire création utilisateur');
    setCurrentMode(USER_FORM_MODES.CREATE);
    setCurrentUserId(null);
    setCurrentUserData(createEmptyUser());
    setActiveView('formulaire');
  };

  /**
   * Ouvre le formulaire de modification
   */
  const handleModifier = (userData) => {
    if (!canManage) {
      log.warn('Tentative de modification sans permissions', { userId: userData.id_utilisateur });
      showError(USER_ERROR_MESSAGES.ACCESS_DENIED);
      return;
    }

    log.info('Ouverture formulaire modification', { 
      userId: userData.id_utilisateur, 
      username: userData.username 
    });
    
    setCurrentMode(USER_FORM_MODES.EDIT);
    setCurrentUserId(userData.id_utilisateur);
    setCurrentUserData(userToFormData(userData));
    setActiveView('formulaire');
  };

  /**
   * Ouvre le formulaire en mode visualisation
   */
  const handleVoir = (userData) => {
    log.info('Ouverture formulaire visualisation', { 
      userId: userData.id_utilisateur,
      username: userData.username 
    });

    setCurrentMode(USER_FORM_MODES.VIEW);
    setCurrentUserId(userData.id_utilisateur);
    setCurrentUserData(userToFormData(userData));
    setActiveView('formulaire');
  };

  /**
   * Gère la suppression (affiche modal de confirmation)
   */
  const handleSupprimer = (userData) => {
    if (!canManage) {
      log.warn('Tentative de suppression sans permissions', { userId: userData.id_utilisateur });
      showError(USER_ERROR_MESSAGES.ACCESS_DENIED);
      return;
    }

    log.info('Demande de suppression utilisateur', { 
      userId: userData.id_utilisateur,
      username: userData.username 
    });

    // Passer au handler qui gère la modal
    handleSupprimerUtilisateur(userData.id_utilisateur, userData.username);
  };

  /**
   * Revenir à la liste
   */
  const handleRetourListe = () => {
    log.debug('Retour à la liste');
    setActiveView('liste');
    setCurrentMode(USER_FORM_MODES.VIEW);
    setCurrentUserId(null);
    setCurrentUserData(null);
  };

  /**
   * Gère la sauvegarde du formulaire (création/modification)
   */
  const handleSauvegarder = async (formData) => {
    log.info('Sauvegarde formulaire utilisateur', { 
      mode: currentMode,
      userId: currentUserId 
    });

    try {
      if (currentMode === USER_FORM_MODES.CREATE) {
        log.debug('Création nouvel utilisateur');
        // Appel API création
        showSuccess(USER_SUCCESS_MESSAGES.USER_CREATED);
      } else if (currentMode === USER_FORM_MODES.EDIT) {
        log.debug('Modification utilisateur', { userId: currentUserId });
        // Appel API modification
        showSuccess(USER_SUCCESS_MESSAGES.USER_UPDATED);
      }

      // Recharger la liste et revenir
      await fetchUsers();
      handleRetourListe();
    } catch (err) {
      log.error('Erreur lors de la sauvegarde', { error: err.message });
      showError(USER_ERROR_MESSAGES.SAVE_FAILED);
    }
  };

  return (
    <div className="gestion-utilisateurs-container">
      {activeView === 'liste' ? (
        // VUE LISTE
        <div className="users-list-section">
          <div className="users-header">
            <h2>Gestion des utilisateurs</h2>
            {canManage && (
              <button 
                ref={addButtonRef}
                className="btn-primary"
                onClick={handleNouvelUtilisateur}
              >
                <FiUserPlus size={18} />
                <span>Nouvel utilisateur</span>
              </button>
            )}
          </div>

          <UserListTable
            users={users}
            loading={loading}
            error={error}
            currentUser={user}
            onView={handleVoir}
            onEdit={handleModifier}
            onDelete={handleSupprimer}
          />
        </div>
      ) : (
        // VUE FORMULAIRE
        <div className="users-form-section">
          <UserForm
            mode={currentMode}
            userData={currentUserData}
            userId={currentUserId}
            onSave={handleSauvegarder}
            onCancel={handleRetourListe}
          />
        </div>
      )}
    </div>
  );
}

export default GestionUtilisateurs;