import { useState } from 'react';

export const useServiceForm = () => {
    const [service, setService] = useState({
        codeService: '',
        nomService: '',
        descriptionService: '',
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
        
        if (!service.codeService.trim()) {
            errors.code = 'Le code est obligatoire';
        }
        
        if (!service.nomService.trim()) {
            errors.nom = 'Le nom est obligatoire';
        }
        
        // Validation longueur
        if (service.codeService.length > 10) {
            errors.code = 'Le code ne peut pas dépasser 10 caractères';
        }
        
        if (service.nomService.length > 100) {
            errors.nom = 'Le nom ne peut pas dépasser 100 caractères';
        }
        
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };
    
    const resetForm = () => {
        setService({
            codeService: '',
            nomService: '',
            descriptionService: '',
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