// src/hooks/paiement/usePaiementFormValidation.js
import { useCallback } from 'react';
import { fromIsoString, isStrictlyFuture } from '../../../utils/dateHelpers';
import { VALIDATION_MESSAGES } from '../../../constants/paiementConstants';

export const usePaiementFormValidation = (formState) => {
    const { paiement, factureSelectionnee, isCreate, clientSelectionne } = formState;

    /**
     * Valider le client (obligatoire en mode CREATE)
     */
    const validateClient = useCallback((idClient) => {
        if (!idClient) {
            return { isValid: false, error: VALIDATION_MESSAGES.CLIENT_REQUIRED || 'Le client est obligatoire' };
        }
        return { isValid: true };
    }, []);

    /**
     * Valider la date de paiement
     */
    const validateDatePaiement = useCallback((datePaiement) => {
        if (!datePaiement) {
            return { isValid: false, error: VALIDATION_MESSAGES.DATE_REQUIRED };
        }
        
        const dateObj = fromIsoString(datePaiement);
        if (!dateObj) {
            return { isValid: false, error: 'Format de date invalide' };
        }
        
        if (isStrictlyFuture(dateObj)) {
            return { 
                isValid: false, 
                error: 'Les dates futures ne sont pas autorisées pour les paiements' 
            };
        }
        
        // Calcul manuel des jours au lieu d'utiliser getDaysFromDate
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
     * La vérification montant vs montant restant ne s'effectue QUE si une facture est sélectionnée
     */
    const validateMontant = useCallback((montantPaye) => {
        const montant = parseFloat(montantPaye);
        if (!montant || montant <= 0) {
            return { isValid: false, error: VALIDATION_MESSAGES.MONTANT_REQUIRED };
        }

        // Vérifier que le montant ne dépasse pas ce qui reste à payer — seulement si facture liée
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
     * Valider la méthode de paiement
     */
    const validateMethodePaiement = useCallback((methodePaiement) => {
        if (!methodePaiement || methodePaiement.trim() === '') {
            return { isValid: false, error: VALIDATION_MESSAGES.METHODE_REQUIRED };
        }

        // Liste des méthodes valides
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
            return { isValid: false, error: 'Méthode de paiement non valide' };
        }

        return { isValid: true };
    }, []);

    /**
     * Valider tous les champs du formulaire
     * En CREATE : client obligatoire, facture optionnelle
     * En EDIT/VIEW : pas de validation client (déjà fixé)
     */
    const validateForm = useCallback(() => {
        // Validation du client — obligatoire en mode CREATE
        if (isCreate) {
            const clientValidation = validateClient(paiement.idClient);
            if (!clientValidation.isValid) {
                return clientValidation;
            }
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
    }, [paiement, isCreate, validateClient, validateDatePaiement, validateMontant, validateMethodePaiement]);

    /**
     * Vérifier si le formulaire est valide (booléen simple pour désactiver le bouton)
     * En CREATE : client obligatoire, facture n'est pas requise
     */
    const isFormValid = useCallback(() => {
        // En CREATE : client + facture obligatoires (plus de paiement libre)
        if (isCreate && !paiement.idClient) return false;
        if (isCreate && !paiement.idFacture) return false;
        // Champs toujours obligatoires
        if (!paiement.datePaiement) return false;
        if (!paiement.montantPaye || parseFloat(paiement.montantPaye) <= 0) return false;
        if (!paiement.methodePaiement || paiement.methodePaiement.trim() === '') return false;
        return true;
    }, [paiement, isCreate]);

    return {
        validateClient,
        validateDatePaiement,
        validateMontant,
        validateMethodePaiement,
        validateForm,
        isFormValid
    };
};