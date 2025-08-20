import { useState } from 'react';

export const useServiceForm = () => {
    const [service, setService] = useState({
        code: '',
        nom: '',
        description: '',
        actif: true,
        isDefault: false
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});
    
    const handleInputChange = (event) => {
        const { name, value, type, checked } = event.target;
        
        setService(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        
        // Effacer l'erreur de validation pour ce champ
        if (validationErrors[name]) {
            setValidationErrors(prev => ({
                ...prev,
                [name]: undefined
            }));
        }
    };
    
    const validateService = () => {
        const errors = {};
        
        if (!service.code.trim()) {
            errors.code = 'Le code est obligatoire';
        }
        
        if (!service.nom.trim()) {
            errors.nom = 'Le nom est obligatoire';
        }
        
        // Validation longueur
        if (service.code.length > 10) {
            errors.code = 'Le code ne peut pas dépasser 10 caractères';
        }
        
        if (service.nom.length > 100) {
            errors.nom = 'Le nom ne peut pas dépasser 100 caractères';
        }
        
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };
    
    const resetForm = () => {
        setService({
            code: '',
            nom: '',
            description: '',
            actif: true,
            isDefault: false
        });
        setValidationErrors({});
    };
    
    return {
        service,
        setService,
        isSubmitting,
        setIsSubmitting,
        validationErrors,
        handleInputChange,
        validateService,
        resetForm
    };
};