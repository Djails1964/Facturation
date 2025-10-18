import React, { useState, useEffect } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { useLogger } from '../../hooks/useLogger';
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
import { showConfirm } from '../../utils/modalSystem';
import '../../styles/components/users/UserForm.css';

/**
 * Formulaire pour créer, modifier ou afficher un utilisateur
 * Gère trois modes : CREATE, EDIT, VIEW
 * Inclut la détection des modifications et la protection de navigation
 * Utilise le logging centralisé pour tracer toutes les actions
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
  const { log } = useLogger('UserForm');

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
  const { hasUnsavedChanges, markAsSaved, requestNavigation } = useUnsavedChanges(
    userData || {},
    formData,
    isSubmitting,
    false
  );

  // Protéger la navigation en cas de modifications non sauvegardées
  useAutoNavigationGuard(hasUnsavedChanges, {
    isActive: !isViewMode && isInitialized,
    guardId: `user-form-${idUser || 'new'}`,
    debug: false
  });

  /**
   * Initialiser le formulaire avec les données
   */
  useEffect(() => {
    log.info('Montage formulaire', { mode, idUser });

    if (userData) {
      log.debug('Initialisation avec données', { username: userData.username });
      setFormData(userData);
    }

    setIsInitialized(true);

    return () => {
      log.debug('Démontage formulaire');
      unregisterGuard(`user-form-${idUser || 'new'}`);
    };
  }, [mode, idUser, userData, log, unregisterGuard]);

  /**
   * Gère les changements dans les champs du formulaire
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    log.debug('Changement champ', { field: name });
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Effacer l'erreur pour ce champ
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  /**
   * Gère le changement de checkbox pour compte_actif
   */
  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    log.debug('Changement checkbox', { field: name, checked });
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  /**
   * Toggle visibilité du mot de passe
   */
  const togglePasswordVisibility = () => {
    log.debug('Toggle visibilité mot de passe');
    setShowPassword(prev => !prev);
  };

  /**
   * Valide les données du formulaire
   * @returns {boolean} True si validation réussie
   */
  const validateForm = () => {
    log.debug('Validation du formulaire', { mode });
    
    const validation = validateUserData(formData, mode);

    if (!validation.isValid) {
      log.warn('Validation échouée', { errors: validation.errors });
      setValidationErrors(validation.errors);
      return false;
    }

    log.debug('Validation réussie');
    setValidationErrors({});
    return true;
  };

  /**
   * Soumet le formulaire (création ou modification)
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    log.info('Soumission formulaire', { mode });

    if (!validateForm()) {
      log.debug('Soumission annulée : validation échouée');
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
      setValidationErrors({ general: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Gère le retour à la liste
   */
  const handleRetour = () => {
    log.debug('Retour à la liste');

    if (hasUnsavedChanges && !isViewMode) {
      requestNavigation(() => onRetourListe?.());
    } else {
      onRetourListe?.();
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
        {/* Message d'erreur général */}
        {validationErrors.general && (
          <div className="form-error-message">
            {validationErrors.general}
          </div>
        )}

        {/* Champ : Nom d'utilisateur */}
        <div className="input-group">
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleInputChange}
            disabled={isViewMode || isEditMode}
            placeholder=" "
            className={validationErrors.username ? 'input-error' : ''}
          />
          <label htmlFor="username" className={validationErrors.username ? 'error' : ''}>
            {USER_FIELD_LABELS.USERNAME}
          </label>
          {validationErrors.username && (
            <span className="error-message">{validationErrors.username}</span>
          )}
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
            </label>
            <button
              type="button"
              className="password-toggle"
              onClick={togglePasswordVisibility}
              tabIndex="-1"
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
            className={validationErrors.nom ? 'input-error' : ''}
          />
          <label htmlFor="nom" className={validationErrors.nom ? 'error' : ''}>
            {USER_FIELD_LABELS.NOM}
          </label>
          {validationErrors.nom && (
            <span className="error-message">{validationErrors.nom}</span>
          )}
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
            className={validationErrors.prenom ? 'input-error' : ''}
          />
          <label htmlFor="prenom" className={validationErrors.prenom ? 'error' : ''}>
            {USER_FIELD_LABELS.PRENOM}
          </label>
          {validationErrors.prenom && (
            <span className="error-message">{validationErrors.prenom}</span>
          )}
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
            className={validationErrors.email ? 'input-error' : ''}
          />
          <label htmlFor="email" className={validationErrors.email ? 'error' : ''}>
            {USER_FIELD_LABELS.EMAIL}
          </label>
          {validationErrors.email && (
            <span className="error-message">{validationErrors.email}</span>
          )}
        </div>

        {/* Champ : Rôle */}
        <div className="input-group">
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleInputChange}
            disabled={isViewMode}
            className={validationErrors.role ? 'input-error' : ''}
          >
            {Object.entries(USER_ROLES).map(([key, value]) => (
              <option key={value} value={value}>
                {USER_FIELD_LABELS.ROLE_OPTIONS[key] || value}
              </option>
            ))}
          </select>
          <label htmlFor="role">{USER_FIELD_LABELS.ROLE}</label>
          {validationErrors.role && (
            <span className="error-message">{validationErrors.role}</span>
          )}
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