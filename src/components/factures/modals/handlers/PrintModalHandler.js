// src/components/factures/modals/handlers/PrintModalHandler.js

import React from 'react';
import ModalComponents from '../../../shared/ModalComponents';

/**
 * Gestionnaire pour l'impression de factures
 * Extrait de FacturesListe.jsx pour réduire la complexité
 */
export class PrintModalHandler {
    constructor(dependencies) {
        this.factureService = dependencies.factureService;
        this.showCustom = dependencies.showCustom;
        this.showLoading = dependencies.showLoading;
        this.onSetNotification = dependencies.onSetNotification;
        this.chargerFactures = dependencies.chargerFactures;
        this.impressionEnCours = dependencies.impressionEnCours || new Set();
        this.setImpressionEnCours = dependencies.setImpressionEnCours;
    }

    /**
     * Point d'entrée principal
     */
    async handle(factureId, event) {
        if (event) {
            event.stopPropagation();
        }
        
        if (this.impressionEnCours.has(factureId)) {
            console.log('⚠️ Impression déjà en cours pour facture', factureId);
            return;
        }
        
        // Ajouter à la liste des impressions en cours
        if (this.setImpressionEnCours) {
            this.setImpressionEnCours(prev => new Set(prev).add(factureId));
        }
        
        const anchorRef = this.createAnchorRef(event);
        
        try {
            console.log('🎯 Début impression facture', factureId);
            
            // Utiliser showLoading pour l'impression
            const result = await this.showLoading(
                {
                    title: "Impression de facture",
                    content: ModalComponents.createLoadingContent("Génération du PDF en cours..."),
                    anchorRef,
                    size: 'small',
                    position: 'smart'
                },
                async () => await this.factureService.imprimerFacture(factureId)
            );
            
            console.log('🎯 Résultat impression:', result);
            
            if (result.success) {
                await this.showSuccessModal(result, anchorRef);
                this.onSetNotification('Facture imprimée avec succès', 'success');
                this.chargerFactures();
            } else {
                throw new Error(result.message || 'Erreur lors de l\'impression de la facture');
            }
            
        } catch (error) {
            console.error('❌ Erreur impression:', error);
            await this.showErrorWithRetry(error, factureId, event, anchorRef);
        } finally {
            // Retirer de la liste des impressions en cours
            if (this.setImpressionEnCours) {
                this.setImpressionEnCours(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(factureId);
                    return newSet;
                });
            }
            console.log('🎯 Impression terminée pour facture', factureId);
        }
    }

    /**
     * Modal de succès avec option de téléchargement
     */
    async showSuccessModal(result, anchorRef) {
        return await this.showCustom({
            title: "Impression de facture",
            content: `
                <div class="modal-success">
                    La facture a été générée avec succès !
                </div>
            `,
            anchorRef,
            size: 'medium',
            position: 'smart',
            buttons: [
                {
                    text: "Télécharger le PDF",
                    action: "download",
                    className: "primary"
                },
                {
                    text: "Fermer",
                    action: "close",
                    className: "secondary"
                }
            ],
            onMount: (container) => {
                const downloadBtn = container.querySelector('[data-action="download"]');
                if (downloadBtn && result.pdfUrl) {
                    downloadBtn.addEventListener('click', () => {
                        console.log('📥 Ouverture du PDF:', result.pdfUrl);
                        window.open(result.pdfUrl, '_blank');
                    });
                }
            }
        });
    }

    /**
     * Modal d'erreur avec option de réessayer
     */
    async showErrorWithRetry(error, factureId, originalEvent, anchorRef) {
        const errorResult = await this.showCustom({
            title: "Erreur d'impression",
            content: ModalComponents.createWarningSection("", error.message, "error"),
            anchorRef,
            size: 'medium',
            position: 'smart',
            buttons: [
                {
                    text: "Réessayer",
                    action: "retry",
                    className: "primary"
                },
                {
                    text: "Annuler",
                    action: "cancel",
                    className: "secondary"
                }
            ]
        });
        
        if (errorResult.action === 'retry') {
            // Délai court puis relancer
            setTimeout(() => {
                this.handle(factureId, originalEvent);
            }, 100);
        }
    }

    /**
     * Créer une référence d'ancrage pour le positionnement
     */
    createAnchorRef(event) {
        if (!event) return null;
        const anchorRef = React.createRef();
        if (event.currentTarget) {
            anchorRef.current = event.currentTarget;
        }
        return anchorRef;
    }
}

export default PrintModalHandler;