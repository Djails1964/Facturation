// src/hooks/useFactureModals.js

import { useCallback } from 'react';
import { useFactureActions } from './useFactureActions';
import { usePaiementActions } from '../../paiements/hooks/usePaiementActions'
import EmailModalHandler from '../modals/handlers/EmailModalHandler';
import DeleteModalHandler from '../modals/handlers/DeleteModalHandler';
import PrintModalHandler from '../modals/handlers/PrintModalHandler';
import PaymentModalHandler from '../modals/handlers/PaymentModalHandler';
import CopyModalHandler from '../modals/handlers/CopyModalHandler';
import { createLogger } from '../../../utils/createLogger';
import { useApiCall } from '../../../hooks/useApiCall';

/**
 * Hook unifié pour la gestion des modales de factures
 * ✅ REFACTORISÉ : Utilise useFactureActions au lieu de useApiCall direct
 * Utilise tous les handlers externalisés pour réduire la complexité de FacturesListe.jsx
 * 
 * @param {Object} dependencies - Toutes les dépendances nécessaires aux handlers
 * @returns {Object} - Tous les handlers de modales prêts à utiliser
 */
export const useFactureModals = (dependencies) => {
    
    const log = createLogger('useFactureModals');

        // Hook useApiCall
    const { execute: executeApi, isLoading: isApiLoading, error: apiError } = useApiCall();

    // ✅ Utilisation de useFactureActions au lieu de useApiCall
    const factureActions = useFactureActions();

    const paiementActions = usePaiementActions();

    // ========== HANDLER EMAIL ==========
    const handleEnvoyerFacture = useCallback(async (idFacture, event) => {
        log.debug('📧 useFactureModals - handleEnvoyerFacture appelé pour:', idFacture);
        
        try {
            // ✅ Passer factureActions au handler
            const emailHandler = new EmailModalHandler({
                ...dependencies,
                factureActions  // ✅ Passer factureActions au lieu de executeApi
            });
            await emailHandler.handle(idFacture, event);
            log.debug('✅ useFactureModals - handleEnvoyerFacture terminé avec succès');
        } catch (error) {
            log.error('❌ Erreur dans handleEnvoyerFacture:', error);
            dependencies.onSetNotification('Erreur lors de l\'envoi de l\'email: ' + error.message, 'error');
        }
    }, [dependencies, factureActions]);

    // ========== HANDLER SUPPRESSION/ANNULATION ==========
    const handleSupprimerFacture = useCallback(async (idFacture, event) => {
        log.debug('🗑️ useFactureModals - handleSupprimerFacture appelé pour:', idFacture);
        
        try {
            // ✅ Passer factureActions au handler
            const deleteHandler = new DeleteModalHandler({
                ...dependencies,
                factureActions  // ✅ Passer factureActions au lieu de executeApi
            });
            await deleteHandler.handle(idFacture, event);
            log.debug('✅ useFactureModals - handleSupprimerFacture terminé avec succès');
        } catch (error) {
            log.error('❌ Erreur dans handleSupprimerFacture:', error);
            log.error('❌ Stack trace:', error.stack);
            dependencies.onSetNotification('Erreur lors de la suppression/annulation: ' + error.message, 'error');
        }
    }, [dependencies, factureActions]);

    // ========== HANDLER IMPRESSION ==========
    const handleImprimerFacture = useCallback(async (idFacture, event) => {
        log.debug('🖨️ useFactureModals - handleImprimerFacture appelé pour:', idFacture);

        try {
            // ✅ Passer factureActions au handler
            const printHandler = new PrintModalHandler({
                ...dependencies,
                factureActions  // ✅ Passer factureActions au lieu de executeApi
            });
            await printHandler.handle(idFacture, event);
            log.debug('✅ useFactureModals - handleImprimerFacture terminé avec succès');
        } catch (error) {
            log.error('❌ Erreur dans handleImprimerFacture:', error);
            dependencies.onSetNotification('Erreur lors de l\'impression', 'error');
        }
    }, [dependencies, factureActions]);

    // ========== HANDLER PAIEMENT ==========
    const handleEnregistrerPaiement = useCallback(async (idFacture, event) => {
        log.debug('💳 useFactureModals - handleEnregistrerPaiement appelé pour:', idFacture);
        
        try {
            // ✅ Passer factureActions au handler
            const paymentHandler = new PaymentModalHandler({
                ...dependencies,
                executeApi,
                factureActions,
                paiementActions  // ✅ Passer factureActions au lieu de executeApi
            });
            await paymentHandler.handle(idFacture, event);
            log.debug('✅ useFactureModals - handleEnregistrerPaiement terminé avec succès');
        } catch (error) {
            log.error('❌ Erreur dans handleEnregistrerPaiement:', error);
            dependencies.onSetNotification('Erreur lors de l\'enregistrement du paiement: ' + error.message, 'error');
        }
    }, [dependencies, factureActions, executeApi]);

    // ========== HANDLER COPIE ==========
    const handleCopierFacture = useCallback(async (idFacture, event) => {
        log.debug('📄 useFactureModals - handleCopierFacture appelé pour:', idFacture);
        
        try {
            // ✅ Passer factureActions au handler
            const copyHandler = new CopyModalHandler({
                ...dependencies,
                factureActions  // ✅ Passer factureActions au lieu de executeApi
            });
            await copyHandler.handle(idFacture, event);
            log.debug('✅ useFactureModals - handleCopierFacture terminé avec succès');
        } catch (error) {
            log.error('❌ Erreur dans handleCopierFacture:', error);
            log.error('❌ Stack trace:', error.stack);
            dependencies.onSetNotification('Erreur lors de la copie de la facture: ' + error.message, 'error');
        }
    }, [dependencies, factureActions]);

    // ========== RETOUR DE TOUS LES HANDLERS ==========
    return {
        // Handlers principaux
        handleEnvoyerFacture,        // EmailModalHandler
        handleSupprimerFacture,      // DeleteModalHandler  
        handleImprimerFacture,       // PrintModalHandler
        handleEnregistrerPaiement,   // PaymentModalHandler
        handleCopierFacture,         // CopyModalHandler

        // État du hook useApiCall (optionnel, peut être utile pour le debugging)
        isApiLoading,
        apiError,
        
        // Alias pour compatibilité avec FacturesListe.jsx
        handlePayerFacture: handleEnregistrerPaiement,
        
        // ✅ Exposer factureActions pour accès direct si besoin
        factureActions
    };
};

export default useFactureModals;