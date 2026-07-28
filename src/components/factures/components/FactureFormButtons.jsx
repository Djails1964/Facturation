import React from 'react';
import { createLogger } from '../../../utils/createLogger';
import { FORM_MODES } from '../../../constants/factureConstants';
import { BUTTON_LABELS, FORM_MESSAGES } from '../../../constants/appConstants';

const log = createLogger('FactureFormButtons');

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
          {BUTTON_LABELS.BACK_TO_LIST}
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
        {isSubmitting ? FORM_MESSAGES.SAVING : getSubmitButtonText(mode)}
      </button>
      <button
        type="button"
        className={getCancelButtonClass()}
        onClick={onCancel}
        disabled={isSubmitting}
      >
        {BUTTON_LABELS.CANCEL}
      </button>
    </div>
  );
};