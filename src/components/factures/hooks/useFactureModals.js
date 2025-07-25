// src/hooks/useFactureModals.js

import { useCallback } from 'react';
import EmailModalHandler from '../modals/handlers/EmailModalHandler';
import DeleteModalHandler from '../modals/handlers/DeleteModalHandler';
import PrintModalHandler from '../modals/handlers/PrintModalHandler';
import PaymentModalHandler from '../modals/handlers/PaymentModalHandler';
import CopyModalHandler from '../modals/handlers/CopyModalHandler';

/**
 * Hook unifié pour la gestion des modales de factures
 * Utilise tous les handlers externalisés pour réduire la complexité de FacturesListe.jsx
 * 
 * @param {Object} dependencies - Toutes les dépendances nécessaires aux handlers
 * @returns {Object} - Tous les handlers de modales prêts à utiliser
 */
export const useFactureModals = (dependencies) => {
    
    // ========== HANDLER EMAIL ==========
    const handleEnvoyerFacture = useCallback(async (factureId, event) => {
        try {
            const emailHandler = new EmailModalHandler(dependencies);
            await emailHandler.handle(factureId, event);
        } catch (error) {
            console.error('❌ Erreur dans handleEnvoyerFacture:', error);
            dependencies.onSetNotification('Erreur lors de l\'envoi de l\'email', 'error');
        }
    }, [dependencies]);

    // ========== HANDLER SUPPRESSION/ANNULATION ==========
    const handleSupprimerFacture = useCallback(async (factureId, event) => {
        try {
            const deleteHandler = new DeleteModalHandler(dependencies);
            await deleteHandler.handle(factureId, event);
        } catch (error) {
            console.error('❌ Erreur dans handleSupprimerFacture:', error);
            dependencies.onSetNotification('Erreur lors de la suppression/annulation', 'error');
        }
    }, [dependencies]);

    // ========== HANDLER IMPRESSION ==========
    const handleImprimerFacture = useCallback(async (factureId, event) => {
        try {
            const printHandler = new PrintModalHandler(dependencies);
            await printHandler.handle(factureId, event);
        } catch (error) {
            console.error('❌ Erreur dans handleImprimerFacture:', error);
            dependencies.onSetNotification('Erreur lors de l\'impression', 'error');
        }
    }, [dependencies]);

    // ========== HANDLER PAIEMENT ==========
    const handleEnregistrerPaiement = useCallback(async (factureId, event) => {
        try {
            const paymentHandler = new PaymentModalHandler(dependencies);
            await paymentHandler.handle(factureId, event);
        } catch (error) {
            console.error('❌ Erreur dans handleEnregistrerPaiement:', error);
            dependencies.onSetNotification('Erreur lors de l\'enregistrement du paiement', 'error');
        }
    }, [dependencies]);

    // ========== HANDLER COPIE ==========
    const handleCopierFacture = useCallback(async (factureId, event) => {
        console.log('🔄 useFactureModals - handleCopierFacture appelé pour:', factureId);
        
        try {
            const copyHandler = new CopyModalHandler(dependencies);
            await copyHandler.handle(factureId, event);
            console.log('✅ useFactureModals - handleCopierFacture terminé avec succès');
        } catch (error) {
            console.error('❌ Erreur dans handleCopierFacture:', error);
            console.error('❌ Stack trace:', error.stack);
            dependencies.onSetNotification('Erreur lors de la copie de la facture: ' + error.message, 'error');
        }
    }, [dependencies]);

    // ========== RETOUR DE TOUS LES HANDLERS ==========
    return {
        // Handlers principaux
        handleEnvoyerFacture,        // EmailModalHandler
        handleSupprimerFacture,      // DeleteModalHandler  
        handleImprimerFacture,       // PrintModalHandler
        handleEnregistrerPaiement,   // PaymentModalHandler
        handleCopierFacture,         // CopyModalHandler
        
        // Alias pour compatibilité avec FacturesListe.jsx
        handlePayerFacture: handleEnregistrerPaiement
    };
};

export default useFactureModals;