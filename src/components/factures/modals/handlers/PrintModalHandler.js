// src/components/factures/modals/handlers/PrintModalHandler.js

import React from 'react';
import ModalComponents from '../../../shared/ModalComponents';
import { createLogger } from '../../../../utils/createLogger';
import { openFacturePdf } from '../../../../utils/pdfUtils';

/**
 * Gestionnaire pour l'impression de factures
 * Extrait de FacturesListe.jsx pour réduire la complexité
 */
export class PrintModalHandler {
    constructor(dependencies) {
        this.factureActions = dependencies.factureActions;
        this.showCustom = dependencies.showCustom;
        this.showLoading = dependencies.showLoading;
        this.onSetNotification = dependencies.onSetNotification;
        this.chargerFactures = dependencies.chargerFactures;
        this.impressionEnCours = dependencies.impressionEnCours || new Set();
        this.setImpressionEnCours = dependencies.setImpressionEnCours;


        this.log = createLogger('PrintModalHandler');
    }

    /**
     * Point d'entrée principal
     */
    async handle(idFacture, event) {
        if (event) {
            event.stopPropagation();
        }
        
        if (this.impressionEnCours.has(idFacture)) {
            this.log.info('⚠️ Impression déjà en cours pour facture', idFacture);
            return;
        }
        
        // Ajouter à la liste des impressions en cours
        if (this.setImpressionEnCours) {
            this.setImpressionEnCours(prev => new Set(prev).add(idFacture));
        }
        
        const anchorRef = this.createAnchorRef(event);
        
        try {
            this.log.info('🎯 Début impression facture', idFacture);
            
            // Utiliser showLoading pour l'impression
            const result = await this.showLoading(
                {
                    title: "Impression de facture",
                    content: ModalComponents.createLoadingContent("Génération du PDF en cours..."),
                    anchorRef,
                    size: 'small',
                    position: 'smart'
                },
                async () => await this.factureActions.imprimerFacture(idFacture)
            );
            
            this.log.debug('🎯 Résultat impression:', result);
            
            if (result.success) {
                await this.showSuccessModal(result, idFacture, anchorRef);
                this.onSetNotification('Facture imprimée avec succès', 'success');
                this.chargerFactures();
            } else {
                throw new Error(result.message || 'Erreur lors de l\'impression de la facture');
            }
            
        } catch (error) {
            this.log.error('❌ Erreur impression:', error);
            await this.showErrorWithRetry(error, idFacture, event, anchorRef);
        } finally {
            // Retirer de la liste des impressions en cours
            if (this.setImpressionEnCours) {
                this.setImpressionEnCours(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(idFacture);
                    return newSet;
                });
            }
            this.log.info('🎯 Impression terminée pour facture', idFacture);
        }
    }

    /**
     * ✅ CORRECTION: Modal de succès avec gestion du téléchargement
     */
    async showSuccessModal(result, idFacture, anchorRef) {
        this.log.debug('📋 showSuccessModal - result:', result);
        this.log.debug('📋 showSuccessModal - idFacture:', idFacture);
        this.log.debug('📋 showSuccessModal - pdfUrl:', result.pdfUrl);

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
        this.log.debug('📋 Modal fermée avec action:', modalResult.action);

        if (modalResult.action === 'download') {
            this.log.debug('📥 Action de téléchargement détectée');
            await this.handlePdfDownload(result.pdfUrl, idFacture);
        }

        return modalResult;
    }


    /**
     * ✅ CORRIGÉ: Gestionnaire de téléchargement utilisant l'API sécurisée
     */
    async handlePdfDownload(pdfUrl, idFacture) {
        try {
            this.log.debug('📥 Début téléchargement PDF:', pdfUrl);

            // Extraire le nom de fichier de l'URL ou récupérer via service
            let filename = null;
            
            if (pdfUrl) {
                // pdfUrl peut être:
                // - URL directe: /storage/factures/facture_xxx.pdf
                // - URL API: /api/document-api.php?facture=facture_xxx.pdf
                if (pdfUrl.includes('facture=')) {
                    // URL API: extraire le paramètre facture
                    const urlParams = new URLSearchParams(pdfUrl.split('?')[1]);
                    filename = urlParams.get('facture');
                } else {
                    // URL directe: extraire le nom de fichier
                    filename = pdfUrl.split('/').pop();
                    if (filename.includes('?')) {
                        filename = filename.split('?')[0];
                    }
                }
            }
            
            // Si pas de filename, récupérer via service
            if (!filename) {
                this.log.debug('🔄 Filename manquant, récupération via service...');
                const urlResult = await this.factureActions.getFactureUrl(idFacture);
                this.log.debug('🔄 Résultat getFactureUrl:', urlResult);
                
                if (urlResult.success && urlResult.pdfUrl) {
                    const resultUrl = urlResult.pdfUrl;
                    if (resultUrl.includes('facture=')) {
                        const urlParams = new URLSearchParams(resultUrl.split('?')[1]);
                        filename = urlParams.get('facture');
                    } else {
                        filename = resultUrl.split('/').pop();
                        if (filename.includes('?')) {
                            filename = filename.split('?')[0];
                        }
                    }
                    this.log.debug('✅ Filename récupéré via service:', filename);
                } else {
                    throw new Error('Impossible de récupérer le nom du fichier PDF');
                }
            }

            this.log.debug('📥 Ouverture sécurisée du PDF:', filename);
            
            // ✅ Utiliser openFacturePdf pour ouvrir via l'API sécurisée
            const result = await openFacturePdf(filename);
            
            if (result.success) {
                this.log.debug('✅ PDF ouvert avec succès');
                this.onSetNotification('PDF ouvert dans un nouvel onglet', 'success');
            } else {
                throw new Error(result.error || 'Impossible d\'ouvrir le PDF');
            }

        } catch (error) {
            this.log.error('❌ Erreur lors du téléchargement:', error);
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
            this.log.warn('⚠️ Téléchargement direct échoué:', error);
            return false;
        }
    }

    /**
     * Modal d'erreur avec option de réessayer
     */
    async showErrorWithRetry(error, idFacture, originalEvent, anchorRef) {
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
                this.handle(idFacture, originalEvent);
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