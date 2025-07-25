import React from 'react';
import { FORM_MODES } from '../../../constants/factureConstants';

export const FactureFormButtons = ({ 
  mode, 
  isSubmitting, 
  isFormValid, 
  getSubmitButtonText,
  onSubmit,
  onCancel 
}) => {
  const getSubmitButtonClass = () => "btn-primary";
  const getCancelButtonClass = () => mode === FORM_MODES.VIEW ? "btn-primary" : "btn-secondary";
  const getButtonsContainerClass = () => "ff-boutons-container";

  if (mode === FORM_MODES.VIEW) {
    return (
      <div className="ff-facture-actions">
        <button type="button" className={getCancelButtonClass()} onClick={onCancel}>
          Retour à la liste
        </button>
      </div>
    );
  }

  return (
    <div className={getButtonsContainerClass()}>
      <button
        type="submit"
        className={`${getSubmitButtonClass()} ${!isFormValid ? 'ff-button-disabled' : ''}`}
        disabled={isSubmitting || !isFormValid}
        onClick={onSubmit}
      >
        {isSubmitting ? 'Enregistrement en cours...' : getSubmitButtonText(mode)}
      </button>
      <button
        type="button"
        className={getCancelButtonClass()}
        onClick={onCancel}
        disabled={isSubmitting}
      >
        Annuler
      </button>
    </div>
  );
};