// src/hooks/paiement/usePaiementFormValidation.js
import { useCallback } from 'react';
import DateService from '../../../utils/DateService';
import { VALIDATION_MESSAGES } from '../../../constants/paiementConstants';

export const usePaiementFormValidation = (formState) => {
    const { paiement, factureSelectionnee, isCreate } = formState;

    /**
     * Valider la date de paiement
     */
    const validateDatePaiement = useCallback((datePaiement) => {
        if (!datePaiement) {
            return { isValid: false, error: VALIDATION_MESSAGES.DATE_REQUIRED };
        }
        
        const dateObj = DateService.fromInputFormat(datePaiement);
        if (!dateObj) {
            return { isValid: false, error: 'Format de date invalide' };
        }
        
        if (DateService.isStrictlyFuture(dateObj)) {
            return { 
                isValid: false, 
                error: 'Les dates futures ne sont pas autorisÃ©es pour les paiements' 
            };
        }
        
        // Calcul manuel des jours au lieu d'utiliser getDaysFromDate
        const today = new Date();
        const diffTime = today.getTime() - dateObj.getTime();
        const daysAgo = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (daysAgo > 365) {
            return { 
                isValid: false, 
                error: 'La date de paiement ne peut pas Ãªtre antÃ©rieure Ã  un an' 
            };
        }
        
        return { isValid: true };
    }, []);

    /**
     * Valider le montant
     */
    const validateMontant = useCallback((montantPaye) => {
        const montant = parseFloat(montantPaye);
        if (!montant || montant <= 0) {
            return { isValid: false, error: VALIDATION_MESSAGES.MONTANT_REQUIRED };
        }

        // VÃ©rifier que le montant ne dÃ©passe pas ce qui reste Ã  payer
        if (factureSelectionnee && isCreate) {
            const montantRestant = factureSelectionnee.montantRestant || 
                (factureSelectionnee.totalAvecRistourne - (factureSelectionnee.montantPayeTotal || 0));
            
            if (montant > montantRestant + 0.01) { // +0.01 pour les erreurs d'arrondi
                return { isValid: false, error: VALIDATION_MESSAGES.MONTANT_SUPERIEUR };
            }
        }

        return { isValid: true, montant };
    }, [factureSelectionnee, isCreate]);

    /**
     * âœ… AJOUT: Valider la mÃ©thode de paiement
     */
    const validateMethodePaiement = useCallback((methodePaiement) => {
        if (!methodePaiement || methodePaiement.trim() === '') {
            return { isValid: false, error: VALIDATION_MESSAGES.METHODE_REQUIRED };
        }

        // Liste des mÃ©thodes valides
        const methodesValides = [
            'virement',
            'especes',
            'cheque',
            'carte',
            'twint',
            'paypal',
            'autre'
        ];

        if (!methodesValides.includes(methodePaiement)) {
            return { isValid: false, error: 'MÃ©thode de paiement non valide' };
        }

        return { isValid: true };
    }, []);

    /**
     * Valider tous les champs du formulaire
     */
    const validateForm = useCallback(() => {
        // Validation de la facture
        if (!paiement.idFacture) {
            return { isValid: false, error: VALIDATION_MESSAGES.FACTURE_REQUIRED };
        }
        
        // Validation de la date
        const dateValidation = validateDatePaiement(paiement.datePaiement);
        if (!dateValidation.isValid) {
            return dateValidation;
        }
        
        // Validation du montant
        const montantValidation = validateMontant(paiement.montantPaye);
        if (!montantValidation.isValid) {
            return montantValidation;
        }
        
        // Validation de la méthode de paiement
        const methodeValidation = validateMethodePaiement(paiement.methodePaiement);
        if (!methodeValidation.isValid) {
            return methodeValidation;
        }
        
        return { isValid: true };
    }, [paiement, validateDatePaiement, validateMontant, validateMethodePaiement]);

    /**
     * Vérifier si le formulaire est valide (booléen simple pour désactiver le bouton)
     */
    const isFormValid = useCallback(() => {
        // Vérification rapide des champs obligatoires
        if (!paiement.idFacture) return false;
        if (!paiement.datePaiement) return false;
        if (!paiement.montantPaye || parseFloat(paiement.montantPaye) <= 0) return false;
        if (!paiement.methodePaiement || paiement.methodePaiement.trim() === '') return false;
        
        return true;
    }, [paiement]);

    return {
        validateDatePaiement,
        validateMontant,
        validateMethodePaiement,
        validateForm,
        isFormValid
    };
};