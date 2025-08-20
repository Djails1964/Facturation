import React from 'react';
import { SaveButton, CancelButton, FormActionsContainer } from '../../ui/buttons';

const TarifFormActions = ({ 
    mode,
    isReadOnly,
    isSubmitting,
    onCancel,
    isCreate
}) => {
    if (isReadOnly) return null;
    
    return (
        <FormActionsContainer>
            <CancelButton 
                onClick={onCancel}
                disabled={isSubmitting}
            >
                Annuler
            </CancelButton>
            
            <SaveButton 
                type="submit"
                disabled={isSubmitting}
            >
                {isSubmitting ? 'Sauvegarde...' : (isCreate ? 'Créer le tarif' : 'Modifier le tarif')}
            </SaveButton>
        </FormActionsContainer>
    );
};

export default TarifFormActions;