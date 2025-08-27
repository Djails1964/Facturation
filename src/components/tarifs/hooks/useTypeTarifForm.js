import { useState } from 'react';

export const useTypeTarifForm = () => {
    const [typeTarif, setTypeTarif] = useState({
        code: '',
        nom: '',
        description: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});
    
    const handleInputChange = (event) => {
        const { name, value } = event.target;
        
        setTypeTarif(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Effacer l'erreur de validation pour ce champ
        if (validationErrors[name]) {
            setValidationErrors(prev => ({
                ...prev,
                [name]: undefined
            }));
        }
    };
    
    const validateTypeTarif = () => {
        const errors = {};
        
        if (!typeTarif.codeTypeTarif.trim()) {
            errors.code = 'Le code est obligatoire';
        }
        
        if (!typeTarif.nomTypeTarif.trim()) {
            errors.nom = 'Le nom est obligatoire';
        }
        
        // Validation longueur
        if (typeTarif.codeTypeTarif.length > 20) {
            errors.code = 'Le code ne peut pas dépasser 20 caractères';
        }
        
        if (typeTarif.nomTypeTarif.length > 100) {
            errors.nom = 'Le nom ne peut pas dépasser 100 caractères';
        }
        
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };
    
    const resetForm = () => {
        setTypeTarif({
            code: '',
            nom: '',
            description: ''
        });
        setValidationErrors({});
    };
    
    return {
        typeTarif,
        setTypeTarif,
        isSubmitting,
        setIsSubmitting,
        validationErrors,
        handleInputChange,
        validateTypeTarif,
        resetForm
    };
};