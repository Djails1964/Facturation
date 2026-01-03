// src/components/factures/utils/factureValidation.js
// ✅ VERSION REFACTORISÉE - Utilise le système de validation unifié

import { ValidationRules, validateField, validateForm } from '../../shared/utils/validationService';

/**
 * Règles de validation spécifiques aux factures
 */
export const FactureValidationRules = {
    /**
     * Vérifie qu'une ligne de facture est valide
     */
    ligneFull: (ligne, message = 'Ligne incomplète') => {
        if (!ligne) return message;
        
        const hasService = ligne.serviceType || ligne.idService || ligne.service;
        const hasUnite = ligne.unite || ligne.idUnite || ligne.uniteCode;
        const hasDescription = ligne.description?.trim();
        const hasQuantite = parseFloat(ligne.quantite) > 0;
        const hasPrix = parseFloat(ligne.prixUnitaire) > 0;
        
        if (!hasService || !hasUnite || !hasDescription || !hasQuantite || !hasPrix) {
            return message;
        }
        return null;
    },

    /**
     * Vérifie que le service est sélectionné
     */
    serviceRequired: (value, ligne, message = 'Le service est requis') => {
        const hasService = value || ligne?.serviceType || ligne?.idService || ligne?.service;
        return hasService ? null : message;
    },

    /**
     * Vérifie que l'unité est sélectionnée
     */
    uniteRequired: (value, ligne, message = 'L\'unité est requise') => {
        const hasUnite = value || ligne?.unite || ligne?.idUnite || ligne?.uniteCode;
        return hasUnite ? null : message;
    },

    /**
     * Vérifie que le numéro de facture est valide
     */
    numeroFacture: (value, message = 'Numéro de facture invalide') => {
        if (!value) return 'Le numéro de facture est requis';
        if (!/^\d{3}\.\d{4}$/.test(value)) {
            return message;
        }
        return null;
    },

    /**
     * Vérifie qu'un client est sélectionné
     */
    clientRequired: (value, message = 'Veuillez sélectionner un client') => {
        if (!value || value === '' || value === '0') {
            return message;
        }
        return null;
    },

    /**
     * Vérifie que la date de facture n'est pas dans le futur
     */
    dateFactureValid: (value, message = 'La date ne peut pas être dans le futur') => {
        if (!value) return 'La date de facture est requise';
        const date = new Date(value);
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        if (date > today) {
            return message;
        }
        return null;
    },

    /**
     * Vérifie que la ristourne est valide
     */
    ristourneValid: (value, totalFacture, message = 'La ristourne ne peut pas dépasser le total') => {
        if (value === undefined || value === null || value === '') return null;
        const ristourne = parseFloat(value);
        if (isNaN(ristourne) || ristourne < 0) {
            return 'La ristourne doit être un nombre positif';
        }
        if (ristourne > totalFacture) {
            return message;
        }
        return null;
    }
};

/**
 * Valide une ligne de facture individuelle
 * @param {Object} ligne - La ligne à valider
 * @param {number} index - L'index de la ligne
 * @returns {Object} - { isValid: boolean, errors: { field: message } }
 */
export const validateLigneFacture = (ligne, index = 0) => {
    const errors = {};
    
    // Validation du service
    const hasService = ligne.serviceType || ligne.idService || ligne.service;
    if (!hasService) {
        errors.serviceType = 'Le service est requis';
    }
    
    // Validation de l'unité
    const hasUnite = ligne.unite || ligne.idUnite || ligne.uniteCode;
    if (!hasUnite) {
        errors.unite = 'L\'unité est requise';
    }
    
    // Validation de la description
    if (!ligne.description?.trim()) {
        errors.description = 'La description est requise';
    }
    
    // Validation de la quantité
    const quantite = parseFloat(ligne.quantite);
    if (isNaN(quantite) || quantite <= 0) {
        errors.quantite = 'La quantité doit être supérieure à 0';
    }
    
    // Validation du prix unitaire
    const prixUnitaire = parseFloat(ligne.prixUnitaire);
    if (isNaN(prixUnitaire) || prixUnitaire <= 0) {
        errors.prixUnitaire = 'Le prix unitaire doit être supérieur à 0';
    }
    
    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

/**
 * Valide toutes les lignes d'une facture
 * @param {Array} lignes - Les lignes à valider
 * @returns {boolean} - true si toutes les lignes sont valides
 */
export const validateFactureLines = (lignes) => {
    if (!lignes || lignes.length === 0) return false;
    
    return lignes.every(ligne => {
        const result = validateLigneFacture(ligne);
        return result.isValid;
    });
};

/**
 * Valide toutes les lignes et retourne les erreurs détaillées
 * @param {Array} lignes - Les lignes à valider
 * @returns {Object} - { isValid: boolean, errors: { [index]: { field: message } } }
 */
export const validateAllLignes = (lignes) => {
    if (!lignes || lignes.length === 0) {
        return {
            isValid: false,
            errors: {},
            message: 'Au moins une ligne est requise'
        };
    }
    
    const allErrors = {};
    let hasErrors = false;
    
    lignes.forEach((ligne, index) => {
        const result = validateLigneFacture(ligne, index);
        if (!result.isValid) {
            allErrors[index] = result.errors;
            hasErrors = true;
        }
    });
    
    return {
        isValid: !hasErrors,
        errors: allErrors
    };
};

/**
 * Valide le formulaire de facture complet
 * @param {Object} facture - Les données de la facture
 * @param {boolean} isLignesValid - État de validation des lignes
 * @returns {Object} - { isValid: boolean, errors: { field: message } }
 */
export const validateFactureForm = (facture, isLignesValid = true) => {
    const errors = {};
    
    // Validation du numéro de facture
    if (!facture.numeroFacture) {
        errors.numeroFacture = 'Le numéro de facture est requis';
    }
    
    // Validation du client
    if (!facture.idClient) {
        errors.idClient = 'Veuillez sélectionner un client';
    }
    
    // Validation de la date
    if (!facture.dateFacture) {
        errors.dateFacture = 'La date de facture est requise';
    } else {
        const dateError = FactureValidationRules.dateFactureValid(facture.dateFacture);
        if (dateError) {
            errors.dateFacture = dateError;
        }
    }
    
    // Validation des lignes
    if (!facture.lignes || facture.lignes.length === 0) {
        errors.lignes = 'Au moins une ligne est requise';
    } else if (!isLignesValid) {
        errors.lignes = 'Certaines lignes contiennent des erreurs';
    }
    
    // Validation de la ristourne
    if (facture.ristourne !== undefined && facture.ristourne !== null) {
        const ristourneError = FactureValidationRules.ristourneValid(
            facture.ristourne, 
            facture.totalFacture || 0
        );
        if (ristourneError) {
            errors.ristourne = ristourneError;
        }
    }
    
    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

/**
 * Schéma de validation pour le formulaire de facture (compatible avec useFormValidation)
 */
export const factureValidationSchema = {
    numeroFacture: [
        (value) => ValidationRules.required(value, 'Le numéro de facture est requis')
    ],
    idClient: [
        (value) => FactureValidationRules.clientRequired(value)
    ],
    dateFacture: [
        (value) => ValidationRules.required(value, 'La date de facture est requise'),
        (value) => FactureValidationRules.dateFactureValid(value)
    ]
};

/**
 * Schéma de validation pour une ligne de facture (compatible avec useFormValidation)
 */
export const ligneValidationSchema = {
    serviceType: [
        (value) => ValidationRules.required(value, 'Le service est requis')
    ],
    unite: [
        (value) => ValidationRules.required(value, 'L\'unité est requise')
    ],
    description: [
        (value) => ValidationRules.required(value, 'La description est requise'),
        ValidationRules.minLength(3, 'Minimum 3 caractères')
    ],
    quantite: [
        (value) => ValidationRules.required(value, 'La quantité est requise'),
        (value) => ValidationRules.strictlyPositive(value, 'La quantité doit être supérieure à 0')
    ],
    prixUnitaire: [
        (value) => ValidationRules.required(value, 'Le prix unitaire est requis'),
        (value) => ValidationRules.strictlyPositive(value, 'Le prix doit être supérieur à 0')
    ]
};

export default {
    FactureValidationRules,
    validateLigneFacture,
    validateFactureLines,
    validateAllLignes,
    validateFactureForm,
    factureValidationSchema,
    ligneValidationSchema
};