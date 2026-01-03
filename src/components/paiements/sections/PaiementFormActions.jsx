import React from 'react';
import { FORM_MODES, BUTTON_TEXTS, LOADING_MESSAGES } from '../../../constants/paiementConstants';

const PaiementFormActions = ({ 
    mode,
    isReadOnly, 
    isPaiementAnnule, 
    isSubmitting, 
    onCancel,
    isCreate,
    isFormValid = true
}) => {
    
    // Le bouton est désactivé si en cours de soumission OU si le formulaire n'est pas valide
    const isSubmitDisabled = isSubmitting || !isFormValid;
    
    return (
        <div className="form-actions">
            {!isReadOnly && !isPaiementAnnule && (
                <button 
                    type="submit" 
                    disabled={isSubmitDisabled}
                    className={`btn-primary ${!isFormValid ? 'btn-disabled' : ''}`}
                    title={!isFormValid ? 'Veuillez remplir tous les champs obligatoires' : ''}
                >
                    {isSubmitting ? LOADING_MESSAGES.SAVING : 
                     isCreate ? BUTTON_TEXTS.CREATE : 
                     BUTTON_TEXTS.EDIT}
                </button>
            )}
            
            <button 
                type="button" 
                onClick={onCancel}
                className={isReadOnly || isPaiementAnnule ? "btn-primary" : "btn-secondary"}
                disabled={isSubmitting}
            >
                {isReadOnly || isPaiementAnnule ? BUTTON_TEXTS.BACK : BUTTON_TEXTS.CANCEL}
            </button>
        </div>
    );
};

export default PaiementFormActions;