// src/components/users/UserListTable.jsx
/**
 * Tableau d'affichage de la liste des utilisateurs
*/

import React, { useState } from 'react';
import { createLogger } from '../../utils/createLogger';
import { FiUser, FiShield } from 'react-icons/fi';
import {
  EditActionButton,
  ViewActionButton,
  DeleteActionButton
} from '../ui/buttons';
import {
  isCompteActif,
  getUserRoleClass,
  getFullName
} from './helpers/userHelpers';
import { 
  getBadgeClasses, 
  formatEtatText 
} from '../../utils/formatters';
import { USER_STATE_MESSAGES } from '../../constants/userConstants';
import '../../styles/components/users/UserListTable.css';

/**
 * Tableau d'affichage de la liste des utilisateurs
 * Affiche les utilisateurs avec leurs informations et actions (voir, modifier, supprimer)
 * Supporte la sélection de lignes et le logging des interactions
 *
 * @param {Array} users - Liste des utilisateurs à afficher
 * @param {boolean} loading - Indique si le chargement est en cours
 * @param {string} error - Message d'erreur si applicable
 * @param {Object} currentUser - Utilisateur connecté (pour vérifier les permissions)
 * @param {Function} onView - Callback pour voir un utilisateur
 * @param {Function} onEdit - Callback pour modifier un utilisateur
 * @param {Function} onDelete - Callback pour supprimer un utilisateur
 */
const UserListTable = ({
  users = [],
  loading = false,
  error = null,
  currentUser,
  onView,
  onEdit,
  onDelete
}) => {
  const log = createLogger('UserListTable');
  const [selectedUserId, setSelectedUserId] = useState(null);

  log.debug('Rendu tableau', { userCount: users.length, loading, hasError: !!error });

  // Gère la sélection/déselection d'une ligne
  const handleRowClick = (userId) => {
    const newSelectedId = selectedUserId === userId ? null : userId;
    log.debug('Sélection ligne utilisateur', { userId, selected: newSelectedId !== null });
    setSelectedUserId(newSelectedId);
  };

  // Affichage : État de chargement
  if (loading) {
    log.debug('État chargement tableau');
    return (
      <div className="users-loading-message">
        {USER_STATE_MESSAGES.LOADING}
      </div>
    );
  }

  // Affichage : État d'erreur
  if (error) {
    log.warn('Erreur affichage tableau', { error });
    return (
      <div className="users-error-message">
        {error}
      </div>
    );
  }

  // Affichage : Liste vide
  if (!users || users.length === 0) {
    log.debug('Tableau vide');
    return (
      <div className="users-empty-message">
        {USER_STATE_MESSAGES.EMPTY}
      </div>
    );
  }

  // Handlers pour les actions
  const handleViewClick = (userObj) => {
    log.info('Affichage utilisateur', { userId: userObj.id_utilisateur, username: userObj.username });
    onView?.(userObj);
  };

  const handleEditClick = (userObj) => {
    log.info('Modification utilisateur', { userId: userObj.id_utilisateur, username: userObj.username });
    onEdit?.(userObj);
  };

  const handleDeleteClick = (userObj) => {
    log.info('Suppression utilisateur', { userId: userObj.id_utilisateur, username: userObj.username });
    onDelete?.(userObj);
  };

  // Déterminer le statut de l'utilisateur
  const getUserStatus = (user) => {
    return isCompteActif(user.compte_actif) ? 'Actif' : 'Inactif';
  };

  return (
    <div className="users-table">
      {/* En-tête du tableau */}
      <div className="users-table-header">
        <div className="users-header-cell">Username</div>
        <div className="users-header-cell">Nom complet</div>
        <div className="users-header-cell">Email</div>
        <div className="users-header-cell">Rôle</div>
        <div className="users-header-cell">Statut</div>
        <div className="users-header-cell">Actions</div>
      </div>

      {/* Corps du tableau */}
      <div className="users-table-body">
        {users.map((user) => {
          const userStatus = getUserStatus(user);
          const isInactive = !isCompteActif(user);
          
          return (
            <div
              key={user.id_utilisateur}
              className={`users-table-row ${selectedUserId === user.id_utilisateur ? 'users-selected' : ''} ${
                isInactive ? 'users-inactive' : ''
              }`}
              onClick={() => handleRowClick(user.id_utilisateur)}
            >
              {/* Username */}
              <div className="users-table-cell users-username-cell">
                <FiUser size={16} />
                <span>{user.username}</span>
              </div>

              {/* Nom complet */}
              <div className="users-table-cell users-name-cell">
                {getFullName(user)}
              </div>

              {/* Email */}
              <div className="users-table-cell users-email-cell">
                {user.email}
              </div>

              {/* Rôle */}
              <div className="users-table-cell users-role-cell">
                <FiShield size={14} />
                <span>{user.role || 'Non défini'}</span>
              </div>

              {/* ✅ Statut avec Badge - utilise getBadgeClasses() et formatEtatText() */}
              <div className="users-table-cell users-status-cell">
                <span className={getBadgeClasses(userStatus)}>
                  {formatEtatText(userStatus)}
                </span>
              </div>

              {/* Actions */}
              <div className="users-table-cell users-actions-cell">
                <div className="users-action-buttons">
                  <ViewActionButton
                    onClick={() => handleViewClick(user)}
                    disabled={false}
                  />
                  <EditActionButton
                    onClick={() => handleEditClick(user)}
                    disabled={false}
                  />
                  <DeleteActionButton
                    onClick={() => handleDeleteClick(user)}
                    disabled={false}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UserListTable;