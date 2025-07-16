import React, { useState, useEffect } from 'react';
import { FiEdit, FiEye, FiTrash2, FiCheck, FiX, FiUser, FiShield } from 'react-icons/fi';
import '../styles/GestionUtilisateurs.css';
import GenericModal from '../GenericModal';
import ConfirmationModal from '../ConfirmationModal';
import api from '../services/api';
import { useNotifications } from '../services/NotificationService';

/**
 * Composant pour le contenu de la gestion des utilisateurs
 * À utiliser dans la structure de FacturationPage
 */
function UsersContent() {
  // États pour les utilisateurs et les formulaires
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userSelectionne, setUserSelectionne] = useState(null);
  
  // État de la modal de formulaire
  const [formModal, setFormModal] = useState({
    isOpen: false,
    title: '',
    mode: 'create', // 'create', 'edit', 'view'
    userData: {
      username: '',
      password: '',
      nom: '',
      prenom: '',
      email: '',
      role: 'standard',
      compte_actif: true
    },
    showPassword: false,
    isSubmitting: false,
    error: null
  });
  
  // État pour la modal de confirmation
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'warning',
    details: null
  });
  
  // Récupérer le service de notifications
  const { showSuccess, showError, showInfo } = useNotifications();
  
  // Effet pour charger les utilisateurs au chargement du composant
  useEffect(() => {
    fetchUtilisateurs();
  }, []);
  
  // Fonction pour récupérer la liste des utilisateurs
  const fetchUtilisateurs = async () => {
    try {
      setLoading(true);
      
      const response = await api.get('auth-api.php?utilisateurs=1');
      
      if (response.success && response.utilisateurs) {
        setUtilisateurs(response.utilisateurs);
      } else {
        throw new Error(response.message || 'Erreur inconnue');
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      setError('Une erreur est survenue lors du chargement des utilisateurs: ' + (error.message || 'Erreur inconnue'));
    } finally {
      setLoading(false);
    }
  };
  
  // Fonction pour ouvrir la modal de confirmation
  const openConfirmModal = (title, message, onConfirm, type = 'warning', details = null) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm,
      type,
      details
    });
  };
  
  // Fonction pour fermer la modal de confirmation
  const closeConfirmModal = () => {
    setConfirmModal({
      ...confirmModal,
      isOpen: false
    });
  };
  
  // Fonction pour ouvrir la modal de création d'utilisateur
  const handleNouvelUtilisateur = () => {
    setFormModal({
      isOpen: true,
      title: 'Nouvel utilisateur',
      mode: 'create',
      userData: {
        username: '',
        password: '',
        nom: '',
        prenom: '',
        email: '',
        role: 'standard',
        compte_actif: true
      },
      showPassword: false,
      isSubmitting: false,
      error: null
    });
  };
  
  // Fonction pour ouvrir la modal d'édition d'utilisateur
  const handleEditerUtilisateur = (user) => {
    setFormModal({
      isOpen: true,
      title: 'Modifier l\'utilisateur',
      mode: 'edit',
      userData: {
        id: user.id_utilisateur,
        username: user.username,
        password: '',
        nom: user.nom || '',
        prenom: user.prenom || '',
        email: user.email || '',
        role: user.role || 'standard',
        compte_actif: user.compte_actif === 1
      },
      showPassword: false,
      isSubmitting: false,
      error: null
    });
  };
  
  // Fonction pour ouvrir la modal de visualisation d'utilisateur
  const handleVoirUtilisateur = (user) => {
    setFormModal({
      isOpen: true,
      title: 'Détails de l\'utilisateur',
      mode: 'view',
      userData: {
        id: user.id_utilisateur,
        username: user.username,
        nom: user.nom || '',
        prenom: user.prenom || '',
        email: user.email || '',
        role: user.role || 'standard',
        compte_actif: user.compte_actif === 1,
        derniere_connexion: user.derniere_connexion || 'Jamais'
      },
      isSubmitting: false,
      error: null
    });
  };
  
  // Fonction pour fermer la modal de formulaire
  const handleCloseFormModal = () => {
    setFormModal({
      ...formModal,
      isOpen: false
    });
  };
  
  // Fonction pour gérer les changements dans le formulaire
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormModal(prev => ({
      ...prev,
      userData: {
        ...prev.userData,
        [name]: type === 'checkbox' ? checked : value
      },
      error: null
    }));
  };
  
  // Fonction pour afficher/masquer le mot de passe
  const togglePasswordVisibility = () => {
    setFormModal(prev => ({
      ...prev,
      showPassword: !prev.showPassword
    }));
  };
  
  // Fonction pour soumettre le formulaire
  const handleSubmitForm = async () => {
    const { mode, userData } = formModal;
    
    // Validation basique
    if (mode === 'create' || (mode === 'edit' && userData.password)) {
      if (userData.password.length < 8) {
        setFormModal(prev => ({
          ...prev,
          error: 'Le mot de passe doit contenir au moins 8 caractères'
        }));
        return;
      }
    }
    
    if (mode === 'create' && !userData.username) {
      setFormModal(prev => ({
        ...prev,
        error: 'Le nom d\'utilisateur est requis'
      }));
      return;
    }
    
    // Marquer comme en cours de soumission
    setFormModal(prev => ({
      ...prev,
      isSubmitting: true,
      error: null
    }));
    
    try {
      let response;
      
      if (mode === 'create') {
        // Création d'un nouvel utilisateur
        response = await api.post('auth-api.php', {
          action: 'createUser',
          ...userData
        });
      } else if (mode === 'edit') {
        // Mise à jour d'un utilisateur existant
        response = await api.put('auth-api.php', userData);
      }
      
      if (response.success) {
        showSuccess(mode === 'create' ? 'Utilisateur créé avec succès' : 'Utilisateur mis à jour avec succès');
        handleCloseFormModal();
        fetchUtilisateurs();
      } else {
        throw new Error(response.message || 'Une erreur est survenue');
      }
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      setFormModal(prev => ({
        ...prev,
        isSubmitting: false,
        error: error.message || 'Une erreur est survenue'
      }));
    }
  };
  
  // Fonction pour changer l'état du compte (actif/inactif)
  const toggleCompteActif = async (user) => {
    const nouveauStatut = user.compte_actif === 1 ? 0 : 1;
    const message = nouveauStatut === 1 
      ? `Êtes-vous sûr de vouloir activer le compte de ${user.prenom} ${user.nom} ?` 
      : `Êtes-vous sûr de vouloir désactiver le compte de ${user.prenom} ${user.nom} ?`;
    
    openConfirmModal(
      nouveauStatut === 1 ? 'Activer le compte' : 'Désactiver le compte',
      message,
      async () => {
        try {
          const response = await api.put('auth-api.php', {
            id: user.id_utilisateur,
            compte_actif: nouveauStatut
          });
          
          if (response.success) {
            showSuccess(`Compte ${nouveauStatut === 1 ? 'activé' : 'désactivé'} avec succès`);
            fetchUtilisateurs();
          } else {
            showError('Erreur: ' + (response.message || 'Erreur inconnue'));
          }
        } catch (error) {
          console.error('Erreur:', error);
          showError('Une erreur est survenue');
        }
        
        closeConfirmModal();
      },
      'warning'
    );
  };
  
  // Fonction pour supprimer un utilisateur
  const handleSupprimerUtilisateur = (user) => {
    openConfirmModal(
      'Confirmer la suppression',
      `Êtes-vous sûr de vouloir supprimer l'utilisateur ${user.prenom} ${user.nom} ?`,
      async () => {
        try {
          const response = await api.delete(`auth-api.php?id=${user.id_utilisateur}`);
          
          if (response.success) {
            showSuccess('Utilisateur supprimé avec succès');
            fetchUtilisateurs();
          } else {
            showError('Erreur: ' + (response.message || 'Erreur inconnue'));
          }
        } catch (error) {
          console.error('Erreur:', error);
          showError('Une erreur est survenue');
        }
        
        closeConfirmModal();
      },
      'danger'
    );
  };
  
  // Fonction pour générer le contenu de la modal de formulaire
  const renderFormContent = () => {
    const { mode, userData, showPassword, error, isSubmitting } = formModal;
    const isViewMode = mode === 'view';
    
    return (
      <div className="user-form-container">
        {error && (
          <div className="user-form-error">
            {error}
          </div>
        )}
        
        <div className="user-form">
          <div className="input-group">
            <input 
              type="text"
              id="username"
              name="username"
              value={userData.username}
              onChange={handleInputChange}
              disabled={mode !== 'create' || isSubmitting}
              placeholder=" "
              required
            />
            <label htmlFor="username" className="required">Nom d'utilisateur</label>
          </div>
          
          {!isViewMode && (
            <div className="input-group password-group">
              <input 
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={userData.password}
                onChange={handleInputChange}
                disabled={isSubmitting}
                placeholder=" "
                required={mode === 'create'}
              />
              <label htmlFor="password" className={mode === 'create' ? 'required' : ''}>
                {mode === 'edit' ? 'Nouveau mot de passe (vide = inchangé)' : 'Mot de passe'}
              </label>
              <button 
                type="button"
                className="toggle-password-btn"
                onClick={togglePasswordVisibility}
                disabled={isSubmitting}
              >
                {showPassword ? <FiEye size={16} /> : <FiEye size={16} />}
              </button>
            </div>
          )}
          
          <div className="form-row">
            <div className="input-group">
              <input 
                type="text"
                id="prenom"
                name="prenom"
                value={userData.prenom}
                onChange={handleInputChange}
                disabled={isViewMode || isSubmitting}
                placeholder=" "
              />
              <label htmlFor="prenom">Prénom</label>
            </div>
            
            <div className="input-group">
              <input 
                type="text"
                id="nom"
                name="nom"
                value={userData.nom}
                onChange={handleInputChange}
                disabled={isViewMode || isSubmitting}
                placeholder=" "
              />
              <label htmlFor="nom">Nom</label>
            </div>
          </div>
          
          <div className="input-group">
            <input 
              type="email"
              id="email"
              name="email"
              value={userData.email}
              onChange={handleInputChange}
              disabled={isViewMode || isSubmitting}
              placeholder=" "
            />
            <label htmlFor="email">Email</label>
          </div>
          
          <div className="input-group select-group">
            <select
              id="role"
              name="role"
              value={userData.role}
              onChange={handleInputChange}
              disabled={isViewMode || isSubmitting}
              required
            >
              <option value="standard">Standard</option>
              <option value="gestionnaire">Gestionnaire</option>
              <option value="admin">Administrateur</option>
            </select>
            <label htmlFor="role" className="required">Rôle</label>
          </div>
          
          {isViewMode && userData.derniere_connexion && (
            <div className="view-info-row">
              <div className="view-info-label">Dernière connexion:</div>
              <div className="view-info-value">{userData.derniere_connexion}</div>
            </div>
          )}
          
          <div className="checkbox-group">
            <input 
              type="checkbox"
              id="compte_actif"
              name="compte_actif"
              checked={userData.compte_actif}
              onChange={handleInputChange}
              disabled={isViewMode || isSubmitting}
            />
            <label htmlFor="compte_actif">Compte actif</label>
          </div>
        </div>
      </div>
    );
  };
  
  // Fonction pour générer les actions de la modal de formulaire
  const renderFormActions = () => {
    const { mode, isSubmitting } = formModal;
    
    if (mode === 'view') {
      return (
        <button 
          className="modal-action-button modal-action-secondary"
          onClick={handleCloseFormModal}
        >
          Fermer
        </button>
      );
    }
    
    return (
      <>
        <button 
          className="modal-action-button modal-action-secondary"
          onClick={handleCloseFormModal}
          disabled={isSubmitting}
        >
          Annuler
        </button>
        <button 
          className="modal-action-button modal-action-primary"
          onClick={handleSubmitForm}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Enregistrement...' : (mode === 'create' ? 'Créer' : 'Enregistrer')}
        </button>
      </>
    );
  };
  
  // Obtenir la classe CSS pour le rôle de l'utilisateur
  const getRoleClass = (role) => {
    switch(role.toLowerCase()) {
      case 'admin':
        return 'user-role-admin';
      case 'gestionnaire':
        return 'user-role-gestionnaire';
      case 'standard':
        return 'user-role-standard';
      default:
        return '';
    }
  };
  
  return (
    <div className="content-section-container">
      <div className="users-table">
        {/* En-tête du tableau */}
        <div className="users-table-header">
          <div className="users-header-cell users-username-cell">Utilisateur</div>
          <div className="users-header-cell users-name-cell">Nom complet</div>
          <div className="users-header-cell users-email-cell">Email</div>
          <div className="users-header-cell users-role-cell">Rôle</div>
          <div className="users-header-cell users-status-cell">Statut</div>
          <div className="users-header-cell users-actions-cell"></div>
        </div>
        
        {/* Corps du tableau */}
        <div className="users-table-body">
          {loading ? (
            <div className="users-loading-message">Chargement des utilisateurs...</div>
          ) : error ? (
            <div className="users-error-message">{error}</div>
          ) : utilisateurs.length === 0 ? (
            <div className="users-empty-message">Aucun utilisateur trouvé</div>
          ) : (
            utilisateurs.map(user => (
              <div 
                key={user.id_utilisateur}
                className={`users-table-row ${userSelectionne === user.id_utilisateur ? 'users-selected' : ''} ${user.compte_actif === 0 ? 'users-inactive' : ''}`}
                onClick={() => setUserSelectionne(user.id_utilisateur === userSelectionne ? null : user.id_utilisateur)}
              >
                <div className="users-table-cell users-username-cell">
                  <FiUser size={16} />
                  <span>{user.username}</span>
                </div>
                <div className="users-table-cell users-name-cell">
                  {`${user.prenom || ''} ${user.nom || ''}`}
                </div>
                <div className="users-table-cell users-email-cell">
                  {user.email || '-'}
                </div>
                <div className="users-table-cell users-role-cell">
                  <FiShield size={16} />
                  <span className={`users-role-badge ${getRoleClass(user.role)}`}>
                    {user.role}
                  </span>
                </div>
                <div className="users-table-cell users-status-cell">
                  <span className={`users-status-badge ${user.compte_actif === 1 ? 'users-status-active' : 'users-status-inactive'}`}>
                    {user.compte_actif === 1 ? 'Actif' : 'Inactif'}
                  </span>
                </div>
                <div className="users-table-cell users-actions-cell">
                  {/* Bouton Voir */}
                  <button 
                    className="bouton-action"
                    aria-label="Voir l'utilisateur"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVoirUtilisateur(user);
                    }}
                  >
                    <FiEye size={20} color="#800000" />
                  </button>
                  
                  {/* Bouton Éditer */}
                  <button 
                    className="bouton-action"
                    aria-label="Éditer l'utilisateur"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditerUtilisateur(user);
                    }}
                  >
                    <FiEdit size={20} color="#800000" />
                  </button>
                  
                  {/* Bouton Activer/Désactiver */}
                  <button 
                    className="bouton-action"
                    aria-label={user.compte_actif === 1 ? "Désactiver l'utilisateur" : "Activer l'utilisateur"}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCompteActif(user);
                    }}
                  >
                    {user.compte_actif === 1 ? 
                      <FiX size={20} color="#800000" /> : 
                      <FiCheck size={20} color="#800000" />
                    }
                  </button>
                  
                  {/* Bouton Supprimer */}
                  <button 
                    className="bouton-action"
                    aria-label="Supprimer l'utilisateur"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSupprimerUtilisateur(user);
                    }}
                  >
                    <FiTrash2 size={20} color="#800000" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Bouton Nouvel utilisateur flottant */}
      <div className="users-floating-button" onClick={handleNouvelUtilisateur}>
        <span>+</span>
        <div className="users-floating-tooltip">Nouvel utilisateur</div>
      </div>
      
      {/* Modal de formulaire */}
      <GenericModal
        isOpen={formModal.isOpen}
        onClose={handleCloseFormModal}
        title={formModal.title}
        actions={renderFormActions()}
      >
        {renderFormContent()}
      </GenericModal>
      
      {/* Modal de confirmation */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeConfirmModal}
        type={confirmModal.type}
        confirmText="Confirmer"
        cancelText="Annuler"
        details={confirmModal.details}
      />
    </div>
  );
}

export default UsersContent;