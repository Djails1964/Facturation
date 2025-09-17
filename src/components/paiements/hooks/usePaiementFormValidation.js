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
                error: 'Les dates futures ne sont pas autorisées pour les paiements' 
            };
        }
        
        // ✅ CORRECTION: Calcul manuel des jours au lieu d'utiliser getDaysFromDate
        const today = new Date();
        const diffTime = today.getTime() - dateObj.getTime();
        const daysAgo = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (daysAgo > 365) {
            return { 
                isValid: false, 
                error: 'La date de paiement ne peut pas être antérieure à un an' 
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

        // Vérifier que le montant ne dépasse pas ce qui reste à payer
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
        if (!paiement.methodePaiement) {
            return { isValid: false, error: VALIDATION_MESSAGES.METHODE_REQUIRED };
        }
        
        return { isValid: true };
    }, [paiement, validateDatePaiement, validateMontant]);

    return {
        validateDatePaiement,
        validateMontant,
        validateForm
    };
};