import React from 'react';
import { FORM_MODES, BUTTON_TEXTS, LOADING_MESSAGES } from '../../../constants/paiementConstants';

const PaiementFormActions = ({ 
    mode,
    isReadOnly, 
    isPaiementAnnule, 
    isSubmitting, 
    onCancel,
    isCreate 
}) => {
    
    return (
        <div className="form-actions">
            {!isReadOnly && !isPaiementAnnule && (
                <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="btn-primary"
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