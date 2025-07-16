import { useState, useCallback, useMemo } from 'react';

/**
 * Hook personnalisé pour la validation des détails de facture
 * @param {Array} lignes - Les lignes de la facture à valider
 * @param {Object} services - Liste des services disponibles
 * @param {Object} unites - Liste des unités disponibles
 */
export function useFactureDetailsValidation(lignes, services, unites) {
    // État pour stocker les erreurs de validation
    const [validationErrors, setValidationErrors] = useState({});

    /**
     * Valide une ligne individuelle
     * @param {Object} ligne - La ligne à valider
     * @param {number} index - L'index de la ligne
     * @returns {Object} Erreurs de validation pour cette ligne
     */
    const validateLigne = useCallback((ligne, index) => {
        const errors = {};

        // Validation de la description
        if (!ligne.description || ligne.description.trim() === '') {
            errors.description = 'La description est obligatoire';
        } else if (ligne.description.length > 200) {
            errors.description = 'La description ne peut pas dépasser 200 caractères';
        }

        // Validation du service
        if (!ligne.serviceType) {
            errors.serviceType = 'Le type de service est obligatoire';
        } else {
            // Vérifier que le service existe réellement
            const serviceExists = services.some(service => 
                service.code === ligne.serviceType || service.id === ligne.serviceType
            );
            if (!serviceExists) {
                errors.serviceType = 'Le service sélectionné est invalide';
            }
        }

        // Validation de l'unité
        if (!ligne.unite) {
            errors.unite = 'L\'unité est obligatoire';
        } else {
            // Vérifier que l'unité existe réellement
            const uniteExists = unites.some(unite => 
                unite.code === ligne.unite || unite.id === ligne.unite
            );
            if (!uniteExists) {
                errors.unite = 'L\'unité sélectionnée est invalide';
            }
        }

        // Validation de la quantité
        const quantite = parseFloat(ligne.quantite);
        if (isNaN(quantite) || quantite <= 0) {
            errors.quantite = 'La quantité doit être un nombre positif';
        } else if (quantite > 1000000) { // Limite raisonnable pour éviter les erreurs de saisie
            errors.quantite = 'La quantité est trop élevée';
        }

        // Validation du prix unitaire
        const prixUnitaire = parseFloat(ligne.prixUnitaire);
        if (isNaN(prixUnitaire) || prixUnitaire < 0) {
            errors.prixUnitaire = 'Le prix unitaire doit être un nombre positif';
        } else if (prixUnitaire > 1000000) { // Limite raisonnable
            errors.prixUnitaire = 'Le prix unitaire est trop élevé';
        }

        // Validation des dates (si présent)
        if (ligne.descriptionDates) {
            // Optionnel : Ajouter des règles de validation pour les dates
            if (ligne.descriptionDates.length > 100) {
                errors.descriptionDates = 'Les informations de dates sont trop longues';
            }
        }

        // Validation du total
        const total = parseFloat(ligne.total);
        const calculatedTotal = quantite * prixUnitaire;
        if (Math.abs(total - calculatedTotal) > 0.01) { // Tolérance de 1 centime
            errors.total = 'Le total ne correspond pas à la quantité * prix unitaire';
        }

        return Object.keys(errors).length > 0 ? errors : null;
    }, [services, unites]);

    /**
     * Valide toutes les lignes de la facture
     * @returns {Object} Erreurs de validation pour toutes les lignes
     */
    const validateAllLignes = useCallback(() => {
        const allErrors = {};
        
        lignes.forEach((ligne, index) => {
            const ligneErrors = validateLigne(ligne, index);
            if (ligneErrors) {
                allErrors[index] = ligneErrors;
            }
        });

        setValidationErrors(allErrors);
        return allErrors;
    }, [lignes, validateLigne]);

    /**
     * Vérifie si toutes les lignes sont valides
     * @returns {boolean} Indique si toutes les lignes sont valides
     */
    const isAllLignesValid = useMemo(() => {
        return Object.keys(validateAllLignes()).length === 0;
    }, [validateAllLignes]);

    /**
     * Calcule le total général des lignes
     * @returns {number} Total général de la facture
     */
    const calculateTotalGeneral = useMemo(() => {
        return lignes.reduce((total, ligne) => {
            const quantite = parseFloat(ligne.quantite) || 0;
            const prixUnitaire = parseFloat(ligne.prixUnitaire) || 0;
            return total + (quantite * prixUnitaire);
        }, 0);
    }, [lignes]);

    /**
     * Vérifie la cohérence des données entre services, unités et lignes
     * @returns {Object} Problèmes potentiels de cohérence
     */
    const checkDataConsistency = useMemo(() => {
        const inconsistencies = [];

        lignes.forEach((ligne, index) => {
            // Vérifier la correspondance service-unité
            if (ligne.serviceType && ligne.unite) {
                const service = services.find(s => s.code === ligne.serviceType);
                const unite = unites.find(u => u.code === ligne.unite);

                if (service && unite) {
                    // Logique de vérification de la correspondance service-unité
                    // À personnaliser selon vos règles métier
                    const serviceUniteMatches = services.some(s => 
                        s.code === ligne.serviceType && 
                        unites.some(u => u.code === ligne.unite && u.service_code === s.code)
                    );

                    if (!serviceUniteMatches) {
                        inconsistencies.push({
                            index,
                            message: `L'unité ${ligne.unite} n'est pas compatible avec le service ${ligne.serviceType}`
                        });
                    }
                }
            }
        });

        return inconsistencies;
    }, [lignes, services, unites]);

    return {
        validationErrors,
        setValidationErrors,
        validateLigne,
        validateAllLignes,
        isAllLignesValid,
        calculateTotalGeneral,
        checkDataConsistency
    };
}