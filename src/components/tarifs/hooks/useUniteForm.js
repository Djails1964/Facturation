import { useState } from 'react';

export const useUniteForm = () => {
    const [unite, setUnite] = useState({
        code: '',
        nom: '',
        description: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});
    
    const handleInputChange = (event) => {
        const { name, value } = event.target;
        
        setUnite(prev => ({
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
    
    const validateUnite = () => {
        const errors = {};
        
        if (!unite.code.trim()) {
            errors.code = 'Le code est obligatoire';
        }
        
        if (!unite.nom.trim()) {
            errors.nom = 'Le nom est obligatoire';
        }
        
        // Validation longueur
        if (unite.code.length > 10) {
            errors.code = 'Le code ne peut pas dépasser 10 caractères';
        }
        
        if (unite.nom.length > 50) {
            errors.nom = 'Le nom ne peut pas dépasser 50 caractères';
        }
        
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };
    
    const resetForm = () => {
        setUnite({
            code: '',
            nom: '',
            description: ''
        });
        setValidationErrors({});
    };
    
    return {
        unite,
        setUnite,
        isSubmitting,
        setIsSubmitting,
        validationErrors,
        handleInputChange,
        validateUnite,
        resetForm
    };
};