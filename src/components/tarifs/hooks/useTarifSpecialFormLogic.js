import { useCallback } from 'react';

export const useTarifSpecialFormLogic = (formState) => {
    const {
        tarifSpecial,
        setTarifSpecial,
        setHasUnsavedChanges,
        isReadOnly,
        serviceUnites,
        loadServiceUnites
    } = formState;
    
    const handleInputChange = useCallback((event) => {
        if (isReadOnly) return;
        
        const { name, value, type, checked } = event.target;
        
        setTarifSpecial(prevTarifSpecial => {
            const newTarifSpecial = {
                ...prevTarifSpecial,
                [name]: type === 'checkbox' ? checked : value
            };
            
            // Si le service change, réinitialiser l'unité et charger les nouvelles unités
            if (name === 'idService') {
                newTarifSpecial.idUnite = '';
                // Charger les unités pour ce service
                if (value) {
                    loadServiceUnites(value);
                }
            }
            
            return newTarifSpecial;
        });
        
        setHasUnsavedChanges(true);
    }, [isReadOnly, setTarifSpecial, setHasUnsavedChanges, loadServiceUnites]);
    
    const validateTarifSpecial = useCallback(() => {
        const errors = [];
        
        if (!tarifSpecial.idClient) {
            errors.push('Le client est obligatoire');
        }
        
        if (!tarifSpecial.idService) {
            errors.push('Le service est obligatoire');
        }
        
        if (!tarifSpecial.idUnite) {
            errors.push('L\'unité est obligatoire');
        }
        
        if (!tarifSpecial.prix || isNaN(parseFloat(tarifSpecial.prix)) || parseFloat(tarifSpecial.prix) <= 0) {
            errors.push('Le prix doit être un nombre positif');
        }
        
        if (!tarifSpecial.date_debut) {
            errors.push('La date de début est obligatoire');
        }
        
        if (!tarifSpecial.note || tarifSpecial.note.trim() === '') {
            errors.push('La note est obligatoire');
        }
        
        // Validation des dates
        if (tarifSpecial.date_debut && tarifSpecial.date_fin) {
            const dateDebut = new Date(tarifSpecial.date_debut);
            const dateFin = new Date(tarifSpecial.date_fin);
            
            if (dateFin <= dateDebut) {
                errors.push('La date de fin doit être postérieure à la date de début');
            }
        }
        
        return errors;
    }, [tarifSpecial]);
    
    const isFormValid = useCallback(() => {
        return validateTarifSpecial().length === 0;
    }, [validateTarifSpecial]);
    
    const resetForm = useCallback(() => {
        setTarifSpecial({
            idClient: '',
            idService: '',
            idUnite: '',
            prix: '',
            date_debut: '',
            date_fin: '',
            note: ''
        });
        setHasUnsavedChanges(false);
    }, [setTarifSpecial, setHasUnsavedChanges]);
    
    return {
        handleInputChange,
        validateTarifSpecial,
        isFormValid,
        resetForm
    };
};