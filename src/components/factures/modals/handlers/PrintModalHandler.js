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
                await this.showSuccessModal(result, factureId, anchorRef);
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
     * ✅ CORRECTION: Modal de succès avec gestion du téléchargement
     */
    async showSuccessModal(result, factureId, anchorRef) {
        console.log('📋 showSuccessModal - result:', result);
        console.log('📋 showSuccessModal - factureId:', factureId);
        console.log('📋 showSuccessModal - pdfUrl:', result.pdfUrl);

        const modalResult = await this.showCustom({
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
            ]
        });

        // ✅ CORRECTION: Gérer l'action après la fermeture de la modal
        console.log('📋 Modal fermée avec action:', modalResult.action);

        if (modalResult.action === 'download') {
            console.log('📥 Action de téléchargement détectée');
            await this.handlePdfDownload(result.pdfUrl, factureId);
        }

        return modalResult;
    }

    /**
     * ✅ NOUVEAU: Gestionnaire de téléchargement séparé
     */
    async handlePdfDownload(pdfUrl, factureId) {
        try {
            let finalPdfUrl = pdfUrl;
            console.log('📥 Début téléchargement PDF:', finalPdfUrl);

            // Vérification et récupération d'URL si nécessaire
            if (!finalPdfUrl) {
                console.log('🔄 URL manquante, récupération via service...');
                const urlResult = await this.factureService.getFactureUrl(factureId);
                console.log('🔄 Résultat getFactureUrl:', urlResult);
                
                if (urlResult.success && urlResult.pdfUrl) {
                    finalPdfUrl = urlResult.pdfUrl;
                    console.log('✅ URL récupérée via service:', finalPdfUrl);
                } else {
                    throw new Error('Impossible de récupérer l\'URL du PDF');
                }
            }

            console.log('📥 URL finale pour téléchargement:', finalPdfUrl);
            
            // ✅ MÉTHODE PRINCIPALE: Ouverture dans un nouvel onglet (fonctionne mieux que le téléchargement forcé)
            const newWindow = window.open(finalPdfUrl, '_blank');
            
            if (newWindow) {
                console.log('✅ PDF ouvert dans un nouvel onglet');
                this.onSetNotification('PDF ouvert dans un nouvel onglet', 'success');
            } else {
                // Fallback: essayer le téléchargement direct
                console.log('🔄 Pop-up bloqué, essai téléchargement direct...');
                if (this.tryDirectDownload(finalPdfUrl)) {
                    console.log('✅ Téléchargement direct lancé');
                    this.onSetNotification('Téléchargement du PDF lancé', 'success');
                } else {
                    throw new Error('Impossible d\'ouvrir ou de télécharger le PDF. Veuillez autoriser les pop-ups pour ce site.');
                }
            }

        } catch (error) {
            console.error('❌ Erreur lors du téléchargement:', error);
            this.onSetNotification(`Erreur lors du téléchargement: ${error.message}`, 'error');
        }
    }

    /**
     * ✅ NOUVEAU: Tentative de téléchargement direct
     */
    tryDirectDownload(url) {
        try {
            // Créer un élément <a> pour forcer le téléchargement
            const link = document.createElement('a');
            link.href = url;
            link.download = ''; // Utiliser le nom de fichier depuis l'URL
            link.target = '_blank';
            
            // Ajouter temporairement au DOM et cliquer
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            return true;
        } catch (error) {
            console.warn('⚠️ Téléchargement direct échoué:', error);
            return false;
        }
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