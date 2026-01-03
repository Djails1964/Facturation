// src/components/shared/utils/validationService.js
// ✅ Service de validation centralisé avec règles réutilisables

/**
 * Règles de validation prédéfinies
 */
export const ValidationRules = {
    /**
     * Vérifie si une valeur est requise (non vide)
     */
    required: (value, message = 'Ce champ est requis') => {
        if (value === undefined || value === null || value === '') {
            return message;
        }
        if (typeof value === 'string' && value.trim() === '') {
            return message;
        }
        return null;
    },

    /**
     * Vérifie la longueur minimale
     */
    minLength: (min, message) => (value) => {
        if (!value) return null;
        if (value.length < min) {
            return message || `Minimum ${min} caractères requis`;
        }
        return null;
    },

    /**
     * Vérifie la longueur maximale
     */
    maxLength: (max, message) => (value) => {
        if (!value) return null;
        if (value.length > max) {
            return message || `Maximum ${max} caractères autorisés`;
        }
        return null;
    },

    /**
     * Vérifie le format email
     */
    email: (value, message = 'Format email invalide') => {
        if (!value) return null;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            return message;
        }
        return null;
    },

    /**
     * Vérifie le format téléphone suisse
     */
    phoneSwiss: (value, message = 'Format téléphone invalide (ex: +41 79 123 45 67)') => {
        if (!value) return null;
        // Accepte les formats: +41791234567, 0791234567, +41 79 123 45 67, etc.
        const cleaned = value.replace(/[\s\-\.]/g, '');
        const phoneRegex = /^(\+41|0041|0)?[1-9]\d{8}$/;
        if (!phoneRegex.test(cleaned)) {
            return message;
        }
        return null;
    },

    /**
     * Vérifie le format téléphone générique
     */
    phone: (value, message = 'Format téléphone invalide') => {
        if (!value) return null;
        const cleaned = value.replace(/[\s\-\.()]/g, '');
        if (!/^\+?\d{8,15}$/.test(cleaned)) {
            return message;
        }
        return null;
    },

    /**
     * Vérifie un montant positif
     */
    positiveNumber: (value, message = 'Le montant doit être positif') => {
        if (value === undefined || value === null || value === '') return null;
        const num = parseFloat(value);
        if (isNaN(num) || num < 0) {
            return message;
        }
        return null;
    },

    /**
     * Vérifie un montant strictement positif (> 0)
     */
    strictlyPositive: (value, message = 'Le montant doit être supérieur à 0') => {
        if (value === undefined || value === null || value === '') return null;
        const num = parseFloat(value);
        if (isNaN(num) || num <= 0) {
            return message;
        }
        return null;
    },

    /**
     * Vérifie une valeur minimale
     */
    min: (minValue, message) => (value) => {
        if (value === undefined || value === null || value === '') return null;
        const num = parseFloat(value);
        if (isNaN(num) || num < minValue) {
            return message || `La valeur minimale est ${minValue}`;
        }
        return null;
    },

    /**
     * Vérifie une valeur maximale
     */
    max: (maxValue, message) => (value) => {
        if (value === undefined || value === null || value === '') return null;
        const num = parseFloat(value);
        if (isNaN(num) || num > maxValue) {
            return message || `La valeur maximale est ${maxValue}`;
        }
        return null;
    },

    /**
     * Vérifie un nombre entier
     */
    integer: (value, message = 'Nombre entier requis') => {
        if (value === undefined || value === null || value === '') return null;
        if (!Number.isInteger(parseFloat(value))) {
            return message;
        }
        return null;
    },

    /**
     * Vérifie une date valide
     */
    date: (value, message = 'Date invalide') => {
        if (!value) return null;
        const date = new Date(value);
        if (isNaN(date.getTime())) {
            return message;
        }
        return null;
    },

    /**
     * Vérifie que la date n'est pas dans le passé
     */
    futureDate: (value, message = 'La date doit être dans le futur') => {
        if (!value) return null;
        const date = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (date < today) {
            return message;
        }
        return null;
    },

    /**
     * Vérifie que la date n'est pas dans le futur
     */
    pastDate: (value, message = 'La date doit être dans le passé') => {
        if (!value) return null;
        const date = new Date(value);
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        if (date > today) {
            return message;
        }
        return null;
    },

    /**
     * Vérifie un code postal suisse
     */
    postalCodeSwiss: (value, message = 'Code postal invalide (4 chiffres)') => {
        if (!value) return null;
        if (!/^\d{4}$/.test(value)) {
            return message;
        }
        return null;
    },

    /**
     * Vérifie un IBAN
     */
    iban: (value, message = 'IBAN invalide') => {
        if (!value) return null;
        const cleaned = value.replace(/\s/g, '').toUpperCase();
        if (!/^[A-Z]{2}\d{2}[A-Z0-9]{4,30}$/.test(cleaned)) {
            return message;
        }
        return null;
    },

    /**
     * Vérifie une URL
     */
    url: (value, message = 'URL invalide') => {
        if (!value) return null;
        try {
            new URL(value);
            return null;
        } catch {
            return message;
        }
    },

    /**
     * Vérifie avec une expression régulière personnalisée
     */
    pattern: (regex, message = 'Format invalide') => (value) => {
        if (!value) return null;
        if (!regex.test(value)) {
            return message;
        }
        return null;
    },

    /**
     * Validation personnalisée avec une fonction
     */
    custom: (validateFn, message = 'Valeur invalide') => (value, allValues) => {
        if (!validateFn(value, allValues)) {
            return message;
        }
        return null;
    },

    /**
     * Vérifie que deux valeurs sont identiques (ex: confirmation mot de passe)
     */
    matches: (fieldName, message) => (value, allValues) => {
        if (!value) return null;
        if (value !== allValues?.[fieldName]) {
            return message || `Les valeurs ne correspondent pas`;
        }
        return null;
    }
};

/**
 * Valide un champ avec une ou plusieurs règles
 * @param {any} value - La valeur à valider
 * @param {Array|Function} rules - Les règles de validation
 * @param {Object} allValues - Toutes les valeurs du formulaire (pour les validations croisées)
 * @returns {string|null} - Message d'erreur ou null si valide
 */
export const validateField = (value, rules, allValues = {}) => {
    if (!rules) return null;
    
    const rulesArray = Array.isArray(rules) ? rules : [rules];
    
    for (const rule of rulesArray) {
        const error = typeof rule === 'function' 
            ? rule(value, allValues)
            : null;
        
        if (error) {
            return error;
        }
    }
    
    return null;
};

/**
 * Valide un formulaire complet
 * @param {Object} values - Les valeurs du formulaire
 * @param {Object} validationSchema - Le schéma de validation { fieldName: [rules] }
 * @returns {Object} - { isValid: boolean, errors: { fieldName: errorMessage } }
 */
export const validateForm = (values, validationSchema) => {
    const errors = {};
    
    for (const [fieldName, rules] of Object.entries(validationSchema)) {
        const error = validateField(values[fieldName], rules, values);
        if (error) {
            errors[fieldName] = error;
        }
    }
    
    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

/**
 * Crée un schéma de validation à partir d'une configuration simplifiée
 * @param {Object} config - Configuration { fieldName: { required, email, minLength, ... } }
 * @returns {Object} - Schéma de validation
 */
export const createValidationSchema = (config) => {
    const schema = {};
    
    for (const [fieldName, fieldConfig] of Object.entries(config)) {
        const rules = [];
        
        if (fieldConfig.required) {
            const message = typeof fieldConfig.required === 'string' 
                ? fieldConfig.required 
                : undefined;
            rules.push((value) => ValidationRules.required(value, message));
        }
        
        if (fieldConfig.email) {
            const message = typeof fieldConfig.email === 'string' 
                ? fieldConfig.email 
                : undefined;
            rules.push((value) => ValidationRules.email(value, message));
        }
        
        if (fieldConfig.minLength) {
            const [min, message] = Array.isArray(fieldConfig.minLength) 
                ? fieldConfig.minLength 
                : [fieldConfig.minLength, undefined];
            rules.push(ValidationRules.minLength(min, message));
        }
        
        if (fieldConfig.maxLength) {
            const [max, message] = Array.isArray(fieldConfig.maxLength) 
                ? fieldConfig.maxLength 
                : [fieldConfig.maxLength, undefined];
            rules.push(ValidationRules.maxLength(max, message));
        }
        
        if (fieldConfig.min !== undefined) {
            const [minVal, message] = Array.isArray(fieldConfig.min) 
                ? fieldConfig.min 
                : [fieldConfig.min, undefined];
            rules.push(ValidationRules.min(minVal, message));
        }
        
        if (fieldConfig.max !== undefined) {
            const [maxVal, message] = Array.isArray(fieldConfig.max) 
                ? fieldConfig.max 
                : [fieldConfig.max, undefined];
            rules.push(ValidationRules.max(maxVal, message));
        }
        
        if (fieldConfig.pattern) {
            const [regex, message] = Array.isArray(fieldConfig.pattern) 
                ? fieldConfig.pattern 
                : [fieldConfig.pattern, undefined];
            rules.push(ValidationRules.pattern(regex, message));
        }
        
        if (fieldConfig.phone) {
            rules.push((value) => ValidationRules.phone(value));
        }
        
        if (fieldConfig.phoneSwiss) {
            rules.push((value) => ValidationRules.phoneSwiss(value));
        }
        
        if (fieldConfig.postalCode) {
            rules.push((value) => ValidationRules.postalCodeSwiss(value));
        }
        
        if (fieldConfig.date) {
            rules.push((value) => ValidationRules.date(value));
        }
        
        if (fieldConfig.positiveNumber) {
            rules.push((value) => ValidationRules.positiveNumber(value));
        }
        
        if (fieldConfig.custom) {
            rules.push(fieldConfig.custom);
        }
        
        if (rules.length > 0) {
            schema[fieldName] = rules;
        }
    }
    
    return schema;
};

export default {
    ValidationRules,
    validateField,
    validateForm,
    createValidationSchema
};