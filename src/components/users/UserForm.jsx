

import React, { useState, useEffect, useRef } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { createLogger } from '../../utils/createLogger';
import {
  USER_FORM_MODES,
  USER_ROLES,
  USER_FIELD_LABELS,
  USER_SUCCESS_MESSAGES,
  USER_ERROR_MESSAGES
} from '../../constants/userConstants';
import {
  getUserFormTitle,
  getUserSubmitButtonText,
  validateUserData,
  prepareUserDataForSubmit
} from './helpers/userHelpers';
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges';
import { useAutoNavigationGuard } from '../../hooks/useAutoNavigationGuard';
import { useNavigationGuard } from '../../App';
import { useUsers } from './hooks/useUsers';
import { useNotifications } from '../../services/NotificationService';
import { showConfirm } from '../../utils/modalSystem';
import '../../styles/components/users/UserForm.css';

/**
 * Formulaire pour créer, modifier ou afficher un utilisateur
 * Gère trois modes : CREATE, EDIT, VIEW
 * Inclut la détection des modifications et la protection de navigation
 *
 * @param {string} mode - Mode du formulaire (CREATE, EDIT, VIEW)
 * @param {number} idUser - ID de l'utilisateur (null pour création)
 * @param {Object} userData - Données initiales de l'utilisateur
 * @param {Function} onRetourListe - Callback pour retourner à la liste
 * @param {Function} onUserCreated - Callback après création réussie
 */
const UserForm = ({
  mode = USER_FORM_MODES.VIEW,
  idUser = null,
  userData = null,
  onRetourListe,
  onUserCreated
}) => {
  const log = createLogger('UserForm');

  // États du formulaire
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    nom: '',
    prenom: '',
    email: '',
    role: USER_ROLES.STANDARD,
    compte_actif: true
  });

  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Déterminer le mode du formulaire
  const isViewMode = mode === USER_FORM_MODES.VIEW;
  const isCreateMode = mode === USER_FORM_MODES.CREATE;
  const isEditMode = mode === USER_FORM_MODES.EDIT;

  // Hooks
  const { createUser, updateUser } = useUsers();
  const { unregisterGuard } = useNavigationGuard();
  const { showError, showSuccess } = useNotifications();

  // ✅ Hook de détection des modifications
  const {
    hasUnsavedChanges,
    markAsSaved,
    requestNavigation,
    resetChanges
  } = useUnsavedChanges(
    userData || {},
    formData,
    isSubmitting,
    false
  );

  // ✅ Protection automatique navigation globale
  const guardId = `user-form-${idUser || 'new'}`;
  log.info('🛡️ Enregistrement du guard avec ID:', guardId);
  const { guardId: registeredGuardId, isProtected } = useAutoNavigationGuard(hasUnsavedChanges, {
    isActive: !isViewMode && isInitialized,
    customGuardId: guardId,
    debug: true
  });
  log.info('✅ Guard enregistré:', { guardId, registeredGuardId, isProtected, hasUnsavedChanges, isViewMode, isInitialized });

  /**
   * Initialiser le formulaire avec les données
   * ⚠️ IMPORTANT: Ne pas inclure `log` dans les dépendances pour éviter les réinitialisations
   */
  useEffect(() => {
    if (!isInitialized) {
      log.info('Montage formulaire', { mode, idUser });

      if (userData) {
        log.debug('Initialisation avec données', { username: userData.username });
        setFormData(userData);
      }

      setIsInitialized(true);
    }

    return () => {
      log.debug('Démontage formulaire');
      unregisterGuard(guardId);
    };
  }, [mode, idUser, userData, unregisterGuard, guardId]); // ✅ log SUPPRIMÉ des dépendances

  /**
   * Gérer le changement d'un champ input
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  /**
   * Gérer le changement du checkbox "compte actif"
   */
  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  /**
   * Valider le formulaire
   * ✅ RETOURNE les erreurs au lieu de seulement les mettre dans le state
   */
  const validateForm = () => {
    const validation = validateUserData(formData, isCreateMode);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      log.warn('Validation échouée', { errors: validation.errors });
      return validation; // ✅ Retourner l'objet validation complet
    }
    setValidationErrors({});
    return validation;
  };

  /**
   * Soumettre le formulaire
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    log.info('Soumission formulaire', { mode });

    // ✅ Récupérer les erreurs directement depuis validateForm()
    const validation = validateForm();
    if (!validation.isValid) {
      log.debug('Soumission annulée : validation échouée');
      // ✅ Utiliser les erreurs retournées par validateForm()
      const firstError = Object.values(validation.errors).find(err => err);
      if (firstError) {
        showError(firstError);
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const preparedData = prepareUserDataForSubmit(formData, mode);
      log.debug('Données préparées pour l\'API', { fields: Object.keys(preparedData) });

      let result;

      if (isCreateMode) {
        log.info('Création utilisateur', { username: formData.username });
        result = await createUser(preparedData);
      } else if (isEditMode) {
        log.info('Modification utilisateur', { userId: idUser, username: formData.username });
        result = await updateUser(idUser, preparedData);
      }

      if (result?.success) {
        log.info('Opération réussie', { mode, userId: result.id_utilisateur });
        markAsSaved();
        showSuccess(isCreateMode ? USER_SUCCESS_MESSAGES.CREATE : USER_SUCCESS_MESSAGES.UPDATE);

        if (isCreateMode && onUserCreated) {
          onUserCreated(result.id_utilisateur, USER_SUCCESS_MESSAGES.CREATE);
        } else if (isEditMode && onRetourListe) {
          onRetourListe(idUser, true, USER_SUCCESS_MESSAGES.UPDATE, 'success');
        }
      } else {
        throw new Error(result?.message || 'Erreur lors de l\'opération');
      }
    } catch (error) {
      log.error('Erreur soumission formulaire', { error: error.message });
      // ✅ Afficher l'erreur via les notifications
      showError(error.message || USER_ERROR_MESSAGES.CREATE_FAILED);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ Écouter l'événement navigation-blocked pour afficher la modale
  useEffect(() => {
    const handleNavigationBlocked = async (event) => {
      log.info('🌐 USER - Événement navigation-blocked reçu:', event.detail);
      
      if (event.detail && event.detail.callback) {
        try {
          log.info('📋 USER - Affichage de la modale de confirmation');
          const result = await showConfirm({
            title: "Modifications non sauvegardées",
            message: "Vous avez des modifications non sauvegardées. Souhaitez-vous vraiment quitter sans sauvegarder ?",
            confirmText: "Quitter sans sauvegarder",
            cancelText: "Continuer l'édition",
            type: 'warning'
          });
          
          if (result.action === 'confirm') {
            log.info('✅ USER - Navigation confirmée, exécution du callback');
            resetChanges();
            unregisterGuard(guardId);
            event.detail.callback();
          } else {
            log.info('❌ USER - Navigation annulée par l\'utilisateur');
          }
        } catch (error) {
          log.error('❌ Erreur modal globale:', error);
        }
      }
    };

    log.info('🔌 USER - Enregistrement event listener pour navigation-blocked');
    window.addEventListener('navigation-blocked', handleNavigationBlocked);
    
    return () => {
      window.removeEventListener('navigation-blocked', handleNavigationBlocked);
    };
  }, [resetChanges, guardId, unregisterGuard, log]);

  /**
   * Gérer le retour à la liste
   * ✅ Utiliser requestNavigation qui gère la modale via le modal system
   */
  const handleRetour = async () => {
    log.debug('Retour à la liste', { hasUnsavedChanges, isViewMode });

    // Cas 1 : Mode VIEW → retour direct
    if (isViewMode) {
      log.debug('✅ Mode VIEW - Retour direct');
      onRetourListe?.();
      return;
    }

    // Cas 2 : Pas de modifications → retour direct
    if (!hasUnsavedChanges) {
      log.debug('✅ Pas de modifications - Retour direct');
      unregisterGuard(guardId);
      onRetourListe?.();
      return;
    }

    // Cas 3 : Modifications détectées
    // ✅ Afficher directement showConfirm (pas requestNavigation)
    log.debug('⚠️ Modifications détectées - showConfirm');
    
    try {
      const result = await showConfirm({
        title: "Modifications non sauvegardées",
        message: "Vous avez des modifications non sauvegardées. Souhaitez-vous vraiment quitter sans sauvegarder ?",
        confirmText: "Quitter sans sauvegarder",
        cancelText: "Continuer l'édition",
        type: 'warning'
      });
      
      if (result.action === 'confirm') {
        log.info('✅ Confirmation locale - Nettoyage et retour');
        resetChanges();
        unregisterGuard(guardId);
        // ✅ Appeler directement onRetourListe sans await
        onRetourListe?.();
      } else {
        log.info('❌ Annulation locale - Reste sur le formulaire');
      }
    } catch (error) {
      log.error('❌ Erreur confirmation locale:', error);
    }
  };

  return (
    <div className="content-section-container">
      {/* En-tête */}
      <div className="content-section-title">
        <h2>{getUserFormTitle(mode)}</h2>
      </div>

      {/* Formulaire */}
      <form className="user-form-container" onSubmit={handleSubmit}>

        {/* Champ : Nom d'utilisateur */}
        <div className="input-group">
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleInputChange}
            disabled={isViewMode}
            placeholder=" "
          />
          <label htmlFor="username">
            {USER_FIELD_LABELS.USERNAME}
          </label>
        </div>

        {/* Champ : Mot de passe */}
        {!isViewMode && (
          <div className="input-group password-field">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder=" "
              className={validationErrors.password ? 'input-error' : ''}
            />
            <label htmlFor="password" className={validationErrors.password ? 'error' : ''}>
              {USER_FIELD_LABELS.PASSWORD}
              {isCreateMode && ' *'}
            </label>
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            >
              {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
            </button>
            {validationErrors.password && (
              <span className="error-message">{validationErrors.password}</span>
            )}
          </div>
        )}

        {/* Champ : Nom */}
        <div className="input-group">
          <input
            type="text"
            id="nom"
            name="nom"
            value={formData.nom}
            onChange={handleInputChange}
            disabled={isViewMode}
            placeholder=" "
          />
          <label htmlFor="nom">
            {USER_FIELD_LABELS.NOM}
          </label>
        </div>

        {/* Champ : Prénom */}
        <div className="input-group">
          <input
            type="text"
            id="prenom"
            name="prenom"
            value={formData.prenom}
            onChange={handleInputChange}
            disabled={isViewMode}
            placeholder=" "
          />
          <label htmlFor="prenom">
            {USER_FIELD_LABELS.PRENOM}
          </label>
        </div>

        {/* Champ : Email */}
        <div className="input-group">
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            disabled={isViewMode}
            placeholder=" "
          />
          <label htmlFor="email">
            {USER_FIELD_LABELS.EMAIL}
          </label>
        </div>

        {/* Champ : Rôle */}
        <div className="input-group">
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleInputChange}
            disabled={isViewMode}
          >
            <option value="">-- Sélectionner un rôle --</option>
            {Object.entries(USER_ROLES).map(([key, value]) => (
              <option key={value} value={value}>
                {USER_FIELD_LABELS.ROLE_OPTIONS?.[key] || value}
              </option>
            ))}
          </select>
          <label htmlFor="role">{USER_FIELD_LABELS.ROLE}</label>
        </div>

        {/* Champ : Compte actif */}
        <div className="checkbox-group">
          <input
            type="checkbox"
            id="compte_actif"
            name="compte_actif"
            checked={formData.compte_actif}
            onChange={handleCheckboxChange}
            disabled={isViewMode}
          />
          <label htmlFor="compte_actif">{USER_FIELD_LABELS.COMPTE_ACTIF}</label>
        </div>

        {/* Boutons d'action */}
        <div className="form-actions">
          <button
            type="submit"
            disabled={isSubmitting || isViewMode}
            className="btn-primary"
          >
            {isSubmitting ? 'En cours...' : getUserSubmitButtonText(mode)}
          </button>
          <button
            type="button"
            onClick={handleRetour}
            disabled={isSubmitting}
            className="btn-secondary"
          >
            Retour à la liste
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserForm;