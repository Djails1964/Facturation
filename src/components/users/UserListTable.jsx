import React, { useState } from 'react';
import { useLogger } from '../../hooks/useLogger';
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
  const { log } = useLogger('UserListTable');
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
    log.info('Demande de suppression', { userId: userObj.id_utilisateur, username: userObj.username });
    onDelete?.(userObj);
  };

  return (
    <div className="users-table">
      {/* En-tête du tableau */}
      <div className="users-table-header">
        <div className="users-header-cell users-username-cell">Utilisateur</div>
        <div className="users-header-cell users-name-cell">Nom complet</div>
        <div className="users-header-cell users-email-cell">Email</div>
        <div className="users-header-cell users-role-cell">Rôle</div>
        <div className="users-header-cell users-status-cell">Statut</div>
        <div className="users-header-cell users-actions-cell">Actions</div>
      </div>

      {/* Corps du tableau */}
      <div className="users-table-body">
        {users.map(user => {
          const isActive = isCompteActif(user.compte_actif);
          const isSelected = selectedUserId === user.id_utilisateur;
          const fullName = getFullName(user);
          const roleClass = getUserRoleClass(user.role);

          // Vérifier si la suppression est autorisée (pas soi-même, et admin uniquement)
          const canDelete = currentUser?.id_utilisateur !== user.id_utilisateur &&
                           currentUser?.role === 'admin';

          return (
            <div
              key={user.id_utilisateur}
              className={`users-table-row ${isSelected ? 'users-selected' : ''} ${!isActive ? 'users-inactive' : ''}`}
              onClick={() => handleRowClick(user.id_utilisateur)}
            >
              {/* Colonne : Utilisateur */}
              <div className="users-cell users-username-cell">
                <div className="users-avatar">
                  <FiUser size={16} />
                </div>
                <span className="users-username">{user.username}</span>
              </div>

              {/* Colonne : Nom complet */}
              <div className="users-cell users-name-cell">
                {fullName}
              </div>

              {/* Colonne : Email */}
              <div className="users-cell users-email-cell">
                {user.email || '-'}
              </div>

              {/* Colonne : Rôle */}
              <div className="users-cell users-role-cell">
                <span className={`users-role-badge ${roleClass}`}>
                  <FiShield size={14} />
                  {user.role}
                </span>
              </div>

              {/* Colonne : Statut */}
              <div className="users-cell users-status-cell">
                <span className={`users-status-badge ${isActive ? 'active' : 'inactive'}`}>
                  {isActive ? 'Actif' : 'Inactif'}
                </span>
              </div>

              {/* Colonne : Actions */}
              <div className="users-cell users-actions-cell" onClick={e => e.stopPropagation()}>
                <ViewActionButton
                  onClick={() => handleViewClick(user)}
                  title="Voir"
                />
                <EditActionButton
                  onClick={() => handleEditClick(user)}
                  title="Modifier"
                />
                <DeleteActionButton
                  onClick={() => handleDeleteClick(user)}
                  disabled={!canDelete}
                  title={canDelete ? 'Supprimer' : 'Suppression non autorisée'}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UserListTable;