// src/components/shared/modals/handlers/DocumentPrintModalHandler.js
// Handler générique pour l'impression/génération de PDF
// ✅ Utilisable pour les factures ET pour la confirmation de paiement de loyer

import React from 'react';
import ModalComponents from '../../ModalComponents';
import { createLogger } from '../../../../utils/createLogger';

/**
 * Handler générique pour la génération et le téléchargement de PDF.
 *
 * Configuration (passée dans le constructeur) :
 *   - printAction      : async (id) => { success, pdfUrl, message }  ← action API à appeler
 *   - openPdfFn        : async (filename) => { success, error }       ← fonction d'ouverture sécurisée
 *   - extractFilename  : (pdfUrl) => string                           ← extraire le nom de fichier depuis l'URL
 *   - titles           : { loading, success, error }                  ← libellés des modals
 *   - messages         : { loading, success }                         ← messages dans les modals
 *   - notifSuccess     : string                                       ← message notification succès
 *   - afterSuccess     : () => void                                   ← callback après succès (ex: recharger liste)
 *
 * Dépendances communes (passées dans le constructeur) :
 *   - showCustom, showLoading, onSetNotification
 *   - impressionEnCours (Set), setImpressionEnCours
 */
export class DocumentPrintModalHandler {
    constructor(dependencies) {
        // Dépendances modales communes
        this.showCustom          = dependencies.showCustom;
        this.showLoading         = dependencies.showLoading;
        this.onSetNotification   = dependencies.onSetNotification;

        // Anti-doublon
        this.impressionEnCours    = dependencies.impressionEnCours    || new Set();
        this.setImpressionEnCours = dependencies.setImpressionEnCours || null;

        // Configuration spécifique au type de document
        this.printAction      = dependencies.printAction;       // async (id) => result
        this.openPdfFn        = dependencies.openPdfFn;         // async (filename) => result
        this.extractFilename  = dependencies.extractFilename    // (pdfUrl) => string
            || ((pdfUrl) => pdfUrl?.split('/').pop()?.split('?')[0] || null);
        this.afterSuccess     = dependencies.afterSuccess       || (() => {});

        // Libellés configurables
        this.titles = {
            loading: 'Génération du PDF',
            success: 'Document généré',
            error:   'Erreur de génération',
            ...(dependencies.titles || {})
        };
        this.messages = {
            loading: 'Génération du PDF en cours...',
            success: 'Le document a été généré avec succès !',
            notifSuccess: 'Document généré avec succès',
            ...(dependencies.messages || {})
        };

        this.log = createLogger('DocumentPrintModalHandler');
    }

    // =========================================================
    // Point d'entrée principal
    // =========================================================
    async handle(id, event) {
        if (event) event.stopPropagation();

        if (this.impressionEnCours.has(id)) {
            this.log.info('⚠️ Génération déjà en cours pour id', id);
            return;
        }

        if (this.setImpressionEnCours) {
            this.setImpressionEnCours(prev => new Set(prev).add(id));
        }

        const anchorRef = this._createAnchorRef(event);

        try {
            this.log.info('🎯 Début génération PDF pour id', id);

            const result = await this.showLoading(
                {
                    title:    this.titles.loading,
                    content:  ModalComponents.createLoadingContent(this.messages.loading),
                    anchorRef,
                    size:     'small',
                    position: 'smart'
                },
                async () => await this.printAction(id)
            );

            this.log.debug('🎯 Résultat génération:', result);

            if (result?.success) {
                await this._showSuccessModal(result, id, anchorRef);
                this.onSetNotification(this.messages.notifSuccess, 'success');
                this.afterSuccess();
            } else {
                throw new Error(result?.message || 'Erreur lors de la génération du PDF');
            }

        } catch (error) {
            this.log.error('❌ Erreur génération PDF:', error);
            await this._showErrorWithRetry(error, id, event, anchorRef);
        } finally {
            if (this.setImpressionEnCours) {
                this.setImpressionEnCours(prev => {
                    const s = new Set(prev);
                    s.delete(id);
                    return s;
                });
            }
            this.log.info('🎯 Génération terminée pour id', id);
        }
    }

    // =========================================================
    // Modal de succès
    // =========================================================
    async _showSuccessModal(result, id, anchorRef) {
        const modalResult = await this.showCustom({
            title:    this.titles.success,
            content:  `<div class="modal-success">${this.messages.success}</div>`,
            anchorRef,
            size:     'medium',
            position: 'smart',
            buttons: [
                { text: 'Télécharger le PDF', action: 'download', className: 'primary'   },
                { text: 'Fermer',             action: 'close',    className: 'secondary' }
            ]
        });

        this.log.debug('📋 Modal fermée avec action:', modalResult.action);

        if (modalResult.action === 'download') {
            await this._handlePdfDownload(result.pdfUrl, id);
        }

        return modalResult;
    }

    // =========================================================
    // Téléchargement / ouverture du PDF
    // =========================================================
    async _handlePdfDownload(pdfUrl, id) {
        try {
            this.log.debug('📥 Début téléchargement PDF:', pdfUrl);

            let filename = pdfUrl ? this.extractFilename(pdfUrl) : null;

            if (!filename) {
                throw new Error('Impossible de déterminer le nom du fichier PDF');
            }

            this.log.debug('📥 Ouverture du PDF:', filename);
            const result = await this.openPdfFn(filename);

            if (result?.success) {
                this.log.debug('✅ PDF ouvert avec succès');
                this.onSetNotification('PDF ouvert dans un nouvel onglet', 'success');
            } else {
                throw new Error(result?.error || 'Impossible d\'ouvrir le PDF');
            }

        } catch (error) {
            this.log.error('❌ Erreur lors du téléchargement:', error);
            this.onSetNotification(`Erreur lors du téléchargement : ${error.message}`, 'error');
        }
    }

    // =========================================================
    // Modal d'erreur avec retry
    // =========================================================
    async _showErrorWithRetry(error, id, originalEvent, anchorRef) {
        const errorResult = await this.showCustom({
            title:    this.titles.error,
            content:  ModalComponents.createWarningSection('', error.message, 'error'),
            anchorRef,
            size:     'medium',
            position: 'smart',
            buttons: [
                { text: 'Réessayer', action: 'retry',  className: 'primary'   },
                { text: 'Annuler',   action: 'cancel', className: 'secondary' }
            ]
        });

        if (errorResult.action === 'retry') {
            setTimeout(() => this.handle(id, originalEvent), 100);
        }
    }

    // =========================================================
    // Helpers
    // =========================================================
    _createAnchorRef(event) {
        if (!event) return null;
        const ref = React.createRef();
        if (event.currentTarget) ref.current = event.currentTarget;
        return ref;
    }
}

export default DocumentPrintModalHandler;