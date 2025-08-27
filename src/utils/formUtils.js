/**
 * Compare deux IDs de manière sécurisée, en gérant les types mixtes (nombre/chaîne)
 * @param {any} id1 - Premier ID à comparer
 * @param {any} id2 - Second ID à comparer
 * @returns {boolean} - True si les IDs sont équivalents
 */
export function compareIds(id1, id2) {
    // Si l'un des deux est null/undefined, ils doivent être tous les deux null/undefined
    if (id1 === null || id1 === undefined || id2 === null || id2 === undefined) {
        return id1 === id2;
    }
    
    // Conversion en nombre pour comparaison
    const num1 = Number(id1);
    const num2 = Number(id2);
    
    // Si l'un des deux n'est pas un nombre valide, comparaison en string
    if (isNaN(num1) || isNaN(num2)) {
        return String(id1) === String(id2);
    }
    
    // Comparaison numérique
    return num1 === num2;
}

/**
 * Valide qu'un ID est utilisable (non null, non undefined, convertible en nombre)
 * @param {any} id - ID à valider
 * @returns {boolean} - True si l'ID est valide
 */
export function isValidId(id) {
    if (id === null || id === undefined) {
        return false;
    }
    
    const num = Number(id);
    return !isNaN(num) && num > 0;
}

/**
 * Normalise un ID en nombre entier positif
 * @param {any} id - ID à normaliser
 * @returns {number|null} - ID normalisé ou null si invalide
 */
export function normalizeId(id) {
    if (!isValidId(id)) {
        return null;
    }
    return parseInt(id, 10);
}

/**
 * Obtient la classe CSS d'erreur pour un champ
 */
export function getErrorClass(validationErrors, index, field) {
    return validationErrors[index] && validationErrors[index][field] 
        ? 'fdf_error-validation' 
        : '';
}

/**
 * Vérifie si un champ a une valeur
 */
export function hasValue(value) {
    return value !== undefined && value !== '' && value !== null;
}

/**
 * Met à jour la classe CSS d'un élément pour indiquer qu'il a une valeur
 */
export function updateFieldClass(elementId, hasValue) {
    setTimeout(() => {
        const element = document.getElementById(elementId);
        if (element && element.parentElement) {
            if (hasValue) {
                element.parentElement.classList.add('has-value');
            } else {
                element.parentElement.classList.remove('has-value');
            }
        }
    }, 10);
}

/**
 * Valide un champ individuel selon des règles
 */
export function validateField(value, rules = {}) {
    const errors = [];
    
    if (rules.required && !hasValue(value)) {
        errors.push(rules.requiredMessage || 'Ce champ est obligatoire');
    }
    
    if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
        errors.push(`Maximum ${rules.maxLength} caractères`);
    }
    
    if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
        errors.push(`Minimum ${rules.minLength} caractères`);
    }
    
    if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
        errors.push(rules.patternMessage || 'Format invalide');
    }
    
    if (rules.min !== undefined && typeof value === 'number' && value < rules.min) {
        errors.push(`Valeur minimum: ${rules.min}`);
    }
    
    if (rules.max !== undefined && typeof value === 'number' && value > rules.max) {
        errors.push(`Valeur maximum: ${rules.max}`);
    }
    
    return errors;
}

/**
 * Formatage des options pour les sélecteurs
 */
export function formatSelectOptions(items, valueKey = 'id', labelKey = 'nom') {
    return items
        .filter(item => item && item[valueKey] && item[labelKey])
        .map(item => ({
            key: `${valueKey}-${item[valueKey]}`,
            value: item[valueKey],
            label: item[labelKey],
            data: item
        }));
}

/**
 * Nettoie les données d'un formulaire
 */
export function sanitizeFormData(data) {
    const cleaned = {};
    
    Object.keys(data).forEach(key => {
        const value = data[key];
        
        if (typeof value === 'string') {
            cleaned[key] = value.trim();
        } else if (typeof value === 'number' && !isNaN(value)) {
            cleaned[key] = value;
        } else if (value !== null && value !== undefined) {
            cleaned[key] = value;
        }
    });
    
    return cleaned;
}