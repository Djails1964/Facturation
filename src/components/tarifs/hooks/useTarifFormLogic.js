import { useCallback } from 'react';

export const useTarifFormLogic = (formState) => {
    const {
        tarif,
        setTarif,
        setHasUnsavedChanges,
        isReadOnly,
        serviceUnites,
        loadServiceUnites
    } = formState;
    
    const handleInputChange = useCallback((event) => {
        if (isReadOnly) return;
        
        const { name, value, type, checked } = event.target;
        
        setTarif(prevTarif => {
            const newTarif = {
                ...prevTarif,
                [name]: type === 'checkbox' ? checked : value
            };
            
            // Si le service change, réinitialiser l'unité et charger les nouvelles unités
            if (name === 'serviceId') {
                newTarif.uniteId = '';
                // Charger les unités pour ce service
                if (value) {
                    loadServiceUnites(value);
                }
            }
            
            return newTarif;
        });
        
        setHasUnsavedChanges(true);
    }, [isReadOnly, setTarif, setHasUnsavedChanges, loadServiceUnites]);
    
    const validateTarif = useCallback(() => {
        const errors = [];
        
        if (!tarif.serviceId) {
            errors.push('Le service est obligatoire');
        }
        
        if (!tarif.uniteId) {
            errors.push('L\'unité est obligatoire');
        }
        
        if (!tarif.typeTarifId) {
            errors.push('Le type de tarif est obligatoire');
        }
        
        if (!tarif.prix || isNaN(parseFloat(tarif.prix)) || parseFloat(tarif.prix) <= 0) {
            errors.push('Le prix doit être un nombre positif');
        }
        
        if (!tarif.date_debut) {
            errors.push('La date de début est obligatoire');
        }
        
        // Validation des dates
        if (tarif.date_debut && tarif.date_fin) {
            const dateDebut = new Date(tarif.date_debut);
            const dateFin = new Date(tarif.date_fin);
            
            if (dateFin <= dateDebut) {
                errors.push('La date de fin doit être postérieure à la date de début');
            }
        }
        
        return errors;
    }, [tarif]);
    
    const isFormValid = useCallback(() => {
        return validateTarif().length === 0;
    }, [validateTarif]);
    
    const resetForm = useCallback(() => {
        setTarif({
            serviceId: '',
            uniteId: '',
            typeTarifId: '',
            prix: '',
            date_debut: '',
            date_fin: ''
        });
        setHasUnsavedChanges(false);
    }, [setTarif, setHasUnsavedChanges]);
    
    return {
        handleInputChange,
        validateTarif,
        isFormValid,
        resetForm
    };
};