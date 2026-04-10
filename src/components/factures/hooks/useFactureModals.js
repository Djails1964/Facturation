// src/hooks/useFactureModals.js
//
// Logique MÉTIER factures pour les modales.
// Utilise GenericPaymentModalHandler pour la collecte des données,
// mais reste responsable de :
//   - Charger la facture
//   - Vérifier l'état (payée, annulée)
//   - Valider montantPaye vs montantRestant
//   - Confirmer les paiements partiels
//   - Appeler savePayment

import { useCallback } from 'react';
import { useFactureActions } from './useFactureActions';
import { usePaiementActions } from '../../paiements/hooks/usePaiementActions';
import EmailModalHandler from '../modals/handlers/EmailModalHandler';
import DeleteModalHandler from '../modals/handlers/DeleteModalHandler';
import { DocumentPrintModalHandler } from '../../shared/modals/handlers/DocumentPrintModalHandler';
import { GenericPaymentModalHandler } from '../../shared/modals/handlers/GenericPaymentModalHandler';
import CopyModalHandler from '../modals/handlers/CopyModalHandler';
import { openFacturePdf } from '../../../utils/pdfUtils';
import { createLogger } from '../../../utils/createLogger';
import {
    PAYMENT_MODES,
    FORM_TITLES,
    HELP_TEXTS,
    VALIDATION_MESSAGES,
    BUTTON_TEXTS,
} from '../../../constants/paiementConstants';

export const useFactureModals = (dependencies) => {

    const log = createLogger('useFactureModals');
    const factureActions  = useFactureActions();
    const paiementActions = usePaiementActions();

    // ── Helper : instancier le handler générique ──────────────────────────────
    const makePaymentHandler = () => new GenericPaymentModalHandler({
        ...dependencies,
        factureActions,
        paiementActions,
    });

    // ── Helper : calculer montantRestant fiable ───────────────────────────────
    const getMontantRestant = (factureData) => {
        if (factureData.montantRestant != null) return parseFloat(factureData.montantRestant);
        const net     = parseFloat(factureData.montantTotal || factureData.montantBrut || 0);
        const paye    = parseFloat(factureData.montantPayeTotal || 0);
        return Math.max(0, net - paye);
    };

    // =========================================================================
    // HANDLER EMAIL
    // =========================================================================
    const handleEnvoyerFacture = useCallback(async (idFacture, event) => {
        try {
            const h = new EmailModalHandler({ ...dependencies, factureActions });
            await h.handle(idFacture, event);
        } catch (err) {
            log.error('❌ handleEnvoyerFacture:', err);
            dependencies.onSetNotification("Erreur lors de l'envoi : " + err.message, 'error');
        }
    }, [dependencies, factureActions]);

    // =========================================================================
    // HANDLER SUPPRESSION
    // =========================================================================
    const handleSupprimerFacture = useCallback(async (idFacture, event) => {
        try {
            const h = new DeleteModalHandler({ ...dependencies, factureActions });
            await h.handle(idFacture, event);
        } catch (err) {
            log.error('❌ handleSupprimerFacture:', err);
            dependencies.onSetNotification("Erreur lors de la suppression : " + err.message, 'error');
        }
    }, [dependencies, factureActions]);

    // =========================================================================
    // HANDLER IMPRESSION
    // =========================================================================
    const handleImprimerFacture = useCallback(async (idFacture, event) => {
        try {
            const h = new DocumentPrintModalHandler({
                ...dependencies,
                printAction:     (id) => factureActions.imprimerFacture(id),
                openPdfFn:       openFacturePdf,
                extractFilename: (pdfUrl) => {
                    if (!pdfUrl) return null;
                    if (pdfUrl.includes('facture='))
                        return new URLSearchParams(pdfUrl.split('?')[1]).get('facture');
                    return pdfUrl.split('/').pop()?.split('?')[0] || null;
                },
                afterSuccess: () => dependencies.chargerFactures?.(),
                titles:   { loading: 'Impression de facture', success: 'Impression de facture', error: "Erreur d'impression" },
                messages: { loading: 'Génération du PDF en cours...', success: 'La facture a été générée avec succès !', notifSuccess: 'Facture imprimée avec succès' },
            });
            await h.handle(idFacture, event);
        } catch (err) {
            log.error('❌ handleImprimerFacture:', err);
            dependencies.onSetNotification("Erreur lors de l'impression", 'error');
        }
    }, [dependencies, factureActions]);

    // =========================================================================
    // HANDLER PAIEMENT — logique métier facture ici
    // =========================================================================
    const handleEnregistrerPaiement = useCallback(async (idFacture, event) => {
        log.debug('💳 handleEnregistrerPaiement - idFacture:', idFacture);

        const handler   = makePaymentHandler();
        const anchorRef = handler.createAnchorRef(event);

        try {
            // ── 1. Charger la facture ─────────────────────────────────────────
            const factureData = await dependencies.showLoading(
                { title: 'Chargement...', content: 'Chargement de la facture...', anchorRef, size: 'small', position: 'smart' },
                () => factureActions.chargerFacture(idFacture)
            );
            if (!factureData) throw new Error('Facture introuvable');

            // ── 2. Vérifier état ──────────────────────────────────────────────
            const etat = (factureData.etat || '').toLowerCase();
            if (etat === 'payée' || etat === 'payee') {
                await handler.showInfo(HELP_TEXTS.FACTURE_PAYEE, FORM_TITLES.MODAL_ERREUR, anchorRef, 'warning');
                return;
            }
            if (etat === 'annulée' || etat === 'annulee') {
                await handler.showInfo(HELP_TEXTS.FACTURE_ANNULEE, FORM_TITLES.MODAL_ERREUR, anchorRef, 'error');
                return;
            }

            // ── 3. Calculer montant restant ───────────────────────────────────
            const montantRestant = getMontantRestant(factureData);
            const montantDefaut  = montantRestant > 0 ? montantRestant
                : parseFloat(factureData.montantTotal || 0);

            // ── 4. Afficher le formulaire ─────────────────────────────────────
            const result = await handler.showPaymentForm({
                mode:        PAYMENT_MODES.FROM_FACTURE,
                factureData,
                montantDefaut,
            }, anchorRef);

            if (result?.action !== 'submit') return;

            const formData = handler.normalizeFormData(result.data);

            // ── 5. Validation forme ───────────────────────────────────────────
            const errForme = handler.validateForme(formData);
            if (errForme) {
                await handler.showInfo(errForme, FORM_TITLES.MODAL_ERREUR, anchorRef);
                return;
            }

            const montantPaye = parseFloat(formData.montantPaye);

            // ── 6. Validation métier : montant vs restant ─────────────────────
            if (montantRestant > 0 && montantPaye > montantRestant + 0.01) {
                await handler.showInfo(
                    `${VALIDATION_MESSAGES.MONTANT_SUPERIEUR} (${dependencies.formatMontant(montantRestant)} CHF restant).`,
                    FORM_TITLES.MODAL_ERREUR, anchorRef
                );
                return;
            }

            // ── 7. Confirmer paiement partiel ─────────────────────────────────
            if (montantRestant > 0 && montantPaye < montantRestant - 0.01) {
                const restantApres = montantRestant - montantPaye;
                const confirmation = await dependencies.showCustom({
                    title:    FORM_TITLES.MODAL_PARTIEL,
                    content:  `<div>${HELP_TEXTS.PARTIEL_INTRO}<br><br>
                        <strong>${HELP_TEXTS.PARTIEL_MONTANT}</strong> ${dependencies.formatMontant(montantPaye)} CHF<br>
                        <strong>${HELP_TEXTS.PARTIEL_RESTE}</strong> ${dependencies.formatMontant(restantApres)} CHF<br><br>
                        ${HELP_TEXTS.PARTIEL_QUESTION}</div>`,
                    anchorRef,
                    size:     'small',
                    position: 'smart',
                    buttons: [
                        { text: BUTTON_TEXTS.CANCEL,         action: 'cancel',  className: 'secondary' },
                        { text: BUTTON_TEXTS.MODAL_CONFIRM,  action: 'confirm', className: 'primary'   },
                    ],
                });
                if (confirmation?.action !== 'confirm') return;
            }

            // ── 8. Enregistrer ────────────────────────────────────────────────
            await handler.savePayment({
                idClient:        factureData.idClient,
                idFacture,
                montantPaye,
                datePaiement:    formData.datePaiement,
                methodePaiement: formData.methodePaiement,
                commentaire:     formData.commentaire || '',
                factureData,     // données initiales — savePayment récupère les fraîches
                anchorRef,
            });

        } catch (err) {
            log.error('❌ handleEnregistrerPaiement:', err);
            dependencies.onSetNotification("Erreur lors du paiement : " + err.message, 'error');
        }
    }, [dependencies, factureActions, paiementActions]);

    // =========================================================================
    // HANDLER COPIE
    // =========================================================================
    const handleCopierFacture = useCallback(async (idFacture, event) => {
        try {
            const h = new CopyModalHandler({ ...dependencies, factureActions });
            await h.handle(idFacture, event);
        } catch (err) {
            log.error('❌ handleCopierFacture:', err);
            dependencies.onSetNotification("Erreur lors de la copie : " + err.message, 'error');
        }
    }, [dependencies, factureActions]);

    return {
        handleEnvoyerFacture,
        handleSupprimerFacture,
        handleImprimerFacture,
        handleEnregistrerPaiement,
        handleCopierFacture,
        handlePayerFacture: handleEnregistrerPaiement,  // alias compatibilité
        factureActions,
    };
};

export default useFactureModals;