// src/components/clients/sections/ClientFormActions.jsx
// Section des boutons d'action du formulaire client

import React from 'react';
import { FORM_MODES } from '../../../constants/clientConstants';
import { getSubmitButtonText } from '../utils/clientHelpers';
import { createLogger } from '../../../utils/createLogger';

/**
 * Section des boutons d'action avec gestion contextuelle selon le mode
 */
function ClientFormActions({ 
  mode,
  isSubmitting = false,
  hasErrors = false,
  handleRetour,
  onSubmit,
  isFormValid = true,
  className = '',
  customActions = null
}) {

  // ✅ Initialisation du logger
  const logger = createLogger('ClientFormActions');
  
  const actionsClasses = ['form-actions'];
  if (className) actionsClasses.push(className);

  const isReadOnly = mode === FORM_MODES.VIEW;
  const canSubmit = !isSubmitting && isFormValid; // Supprimé hasErrors de la condition

  // Debug pour voir l'état du bouton
  logger.debug('🔘 État du bouton submit:', {
    isSubmitting,
    hasErrors,
    isFormValid,
    canSubmit,
    mode
  });

  return (
    <div className={actionsClasses.join(' ')}>
      
      {/* Bouton principal */}
      {isReadOnly ? (
        <ReturnButton onClick={handleRetour} />
      ) : (
        <SubmitButton
          mode={mode}
          isSubmitting={isSubmitting}
          disabled={!canSubmit}
          onClick={onSubmit}
        />
      )}
      
      {/* Bouton secondaire (Annuler) - seulement en mode édition */}
      {!isReadOnly && (
        <CancelButton
          onClick={handleRetour}
          disabled={isSubmitting}
        />
      )}
      
      {/* Actions personnalisées */}
      {customActions && (
        <div className="custom-actions">
          {customActions}
        </div>
      )}
      
    </div>
  );
}

/**
 * Bouton de soumission du formulaire
 */
function SubmitButton({ mode, isSubmitting, disabled, onClick }) {
  const handleClick = (e) => {
    e.preventDefault();
    if (!disabled && onClick) {
      onClick(e);
    }
  };

  return (
    <button
      type="submit"
      className="btn-primary"
      disabled={disabled}
      onClick={handleClick}
      aria-describedby={disabled ? 'submit-help' : undefined}
    >
      {getSubmitButtonText(mode, isSubmitting)}
      
      {/* Indicateur de chargement */}
      {isSubmitting && (
        <span className="loading-indicator" aria-hidden="true">
          ...
        </span>
      )}
    </button>
  );
}

/**
 * Bouton d'annulation
 */
function CancelButton({ onClick, disabled }) {
  return (
    <button
      type="button"
      className="btn-secondary"
      disabled={disabled}
      onClick={onClick}
      aria-label="Annuler les modifications et retourner à la liste"
    >
      Annuler
    </button>
  );
}

/**
 * Bouton de retour (mode visualisation)
 */
function ReturnButton({ onClick }) {
  return (
    <button
      type="button"
      className="btn-primary"
      onClick={onClick}
      aria-label="Retourner à la liste des clients"
    >
      Retour à la liste
    </button>
  );
}

/**
 * Actions avancées avec indicateurs de statut
 */
function AdvancedClientFormActions({ 
  mode,
  isSubmitting = false,
  hasErrors = false,
  hasUnsavedChanges = false,
  validationStats = null,
  handleRetour,
  onSubmit,
  onSaveAndContinue = null,
  onReset = null,
  className = ''
}) {
  
  const actionsClasses = ['form-actions', 'advanced-actions'];
  if (className) actionsClasses.push(className);

  const isReadOnly = mode === FORM_MODES.VIEW;
  const canSubmit = !isSubmitting && !hasErrors;

  return (
    <div className={actionsClasses.join(' ')}>
      
      {/* Indicateur de progression */}
      {validationStats && !isReadOnly && (
        <div className="form-progress" aria-live="polite">
          <span className="progress-text">
            Completion: {validationStats.completionPercentage}%
          </span>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${validationStats.completionPercentage}%` }}
              aria-hidden="true"
            />
          </div>
        </div>
      )}
      
      {/* Groupe de boutons principaux */}
      <div className="primary-actions">
        {isReadOnly ? (
          <ReturnButton onClick={handleRetour} />
        ) : (
          <>
            <SubmitButton
              mode={mode}
              isSubmitting={isSubmitting}
              disabled={!canSubmit}
              onClick={onSubmit}
            />
            
            {/* Sauvegarder et continuer (mode création) */}
            {mode === FORM_MODES.CREATE && onSaveAndContinue && (
              <button
                type="button"
                className="btn-secondary"
                disabled={!canSubmit}
                onClick={onSaveAndContinue}
                title="Sauvegarder ce client et créer un nouveau"
              >
                Sauvegarder et nouveau
              </button>
            )}
          </>
        )}
      </div>
      
      {/* Groupe de boutons secondaires */}
      {!isReadOnly && (
        <div className="secondary-actions">
          <CancelButton
            onClick={handleRetour}
            disabled={isSubmitting}
          />
          
          {/* Reset formulaire */}
          {onReset && hasUnsavedChanges && (
            <button
              type="button"
              className="btn-outline"
              disabled={isSubmitting}
              onClick={onReset}
              title="Annuler les modifications en cours"
            >
              Reset
            </button>
          )}
        </div>
      )}
      
      {/* Indicateurs de statut */}
      <div className="status-indicators">
        {hasUnsavedChanges && (
          <span className="status-unsaved" title="Modifications non sauvegardées">
            <span className="status-dot" aria-hidden="true">●</span>
            Non sauvegardé
          </span>
        )}
        
        {hasErrors && (
          <span className="status-error" title="Le formulaire contient des erreurs">
            <span className="status-icon" aria-hidden="true">⚠️</span>
            Erreurs détectées
          </span>
        )}
      </div>
      
    </div>
  );
}

export { AdvancedClientFormActions };
export default ClientFormActions;