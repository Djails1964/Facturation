// src/components/loyers/hooks/useLoyerModals.js
// Hook unifié pour la gestion des modales des loyers
// ✅ Structure symétrique à useFactureModals.js

import { useCallback, useState } from 'react';
import { useLoyerActions } from './useLoyerActions';
import { usePaiementActions } from '../../paiements/hooks/usePaiementActions';
import { DocumentPrintModalHandler } from '../../shared/modals/handlers/DocumentPrintModalHandler';
import { LoyerPaymentModalHandler } from '../modals/handlers/LoyerPaymentModalHandler';
import { showCustom, showLoading } from '../../../utils/modalSystem';
import { openFacturePdf } from '../../../utils/pdfUtils';
import { createLogger } from '../../../utils/createLogger';

const log = createLogger('useLoyerModals');

/**
 * Extrait le nom de fichier depuis une URL de confirmation de loyer.
 * Adapté au format retourné par loyer-api.php.
 */
function extractLoyerPdfFilename(pdfUrl) {
    if (!pdfUrl) return null;

    // URL API : ...?loyer=confirmation_loyer_xxx.pdf
    if (pdfUrl.includes('loyer=')) {
        const urlParams = new URLSearchParams(pdfUrl.split('?')[1]);
        return urlParams.get('loyer') || null;
    }
    // URL API : ...?file=...
    if (pdfUrl.includes('file=')) {
        const urlParams = new URLSearchParams(pdfUrl.split('?')[1]);
        return urlParams.get('file') || null;
    }

    // URL directe
    let filename = pdfUrl.split('/').pop();
    if (filename?.includes('?')) filename = filename.split('?')[0];
    return filename || null;
}

/**
 * Ouvre un PDF de confirmation de loyer via l'API sécurisée (document-api.php).
 * Les fichiers de confirmation sont stockés dans le même dossier que les factures,
 * donc on réutilise le même endpoint ?facture= qui est déjà authentifié.
 */
async function openLoyerPdf(filename) {
    return await openFacturePdf(filename);
}

/**
 * Hook unifié pour toutes les modales de la gestion des loyers.
 *
 * @param {Object} options
 * @param {Function} options.onSetNotification - (message, type) => void
 * @param {Function} [options.chargerLoyers]   - callback après succès (recharger la liste)
 */
export const useLoyerModals = ({ onSetNotification, chargerLoyers } = {}) => {

    // Anti-doublon pour les impressions en cours
    const [impressionEnCours, setImpressionEnCours] = useState(new Set());

    // Actions loyer (accès aux méthodes API)
    const loyerActions    = useLoyerActions();
    const paiementActions = usePaiementActions();

    // ========== HANDLER : SAISIR PAIEMENT LOYER ==========
    const handleSaisirPaiement = useCallback(async (idLoyer, event) => {
        log.debug('💰 useLoyerModals - handleSaisirPaiement pour loyer:', idLoyer);

        try {
            const paymentHandler = new LoyerPaymentModalHandler({
                loyerActions,
                paiementActions,
                onSetNotification,
                chargerLoyers: chargerLoyers || (() => {}),
            });
            await paymentHandler.handle(idLoyer, event);
            log.debug('✅ useLoyerModals - handleSaisirPaiement terminé');

        } catch (error) {
            log.error('❌ Erreur dans handleSaisirPaiement:', error);
            onSetNotification?.(
                'Erreur lors de la saisie du paiement : ' + error.message,
                'error'
            );
        }
    }, [loyerActions, paiementActions, onSetNotification, chargerLoyers]);

    // ========== HANDLER : GÉNÉRER PDF CONFIRMATION ==========
    const handleGenererConfirmationPDF = useCallback(async (idLoyer, event) => {
        log.debug('🖨️ useLoyerModals - handleGenererConfirmationPDF pour loyer:', idLoyer);

        try {
            const printHandler = new DocumentPrintModalHandler({
                // ✅ Fonctions importées directement depuis utils/modalSystem
                showCustom,
                showLoading,
                onSetNotification,
                impressionEnCours,
                setImpressionEnCours,

                // Action API : générer la confirmation PDF du loyer
                printAction: async (id) => {
                    return await loyerActions.genererConfirmationPDF(id);
                },

                // Ouverture du PDF
                openPdfFn: openLoyerPdf,

                // Extraction du nom de fichier
                extractFilename: extractLoyerPdfFilename,

                // Rechargement après succès
                afterSuccess: chargerLoyers || (() => {}),

                // Libellés
                titles: {
                    loading: 'Confirmation de paiement',
                    success: 'Confirmation de paiement',
                    error:   'Erreur de génération',
                },
                messages: {
                    loading:      'Génération de la confirmation en cours...',
                    success:      'La confirmation de paiement a été générée avec succès !',
                    notifSuccess: 'Confirmation générée avec succès',
                }
            });

            await printHandler.handle(idLoyer, event);
            log.debug('✅ useLoyerModals - handleGenererConfirmationPDF terminé');

        } catch (error) {
            log.error('❌ Erreur dans handleGenererConfirmationPDF:', error);
            onSetNotification?.(
                'Erreur lors de la génération de la confirmation : ' + error.message,
                'error'
            );
        }
    }, [loyerActions, impressionEnCours, onSetNotification, chargerLoyers]);

    // ========== RETOUR ==========
    return {
        // Handlers principaux
        handleSaisirPaiement,         // LoyerPaymentModalHandler
        handleGenererConfirmationPDF, // DocumentPrintModalHandler

        // État anti-doublon (utile pour désactiver les boutons PDF)
        impressionEnCours,

        // Accès aux actions si nécessaire
        loyerActions,
    };
};

export default useLoyerModals;