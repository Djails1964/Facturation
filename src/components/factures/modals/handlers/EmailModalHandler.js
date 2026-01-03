// src/components/factures/modals/handlers/EmailModalHandler.js

import React from 'react';
import { emailClientSenderUrlWithSession } from '../../../../utils/urlHelper';
import ModalComponents from '../../../shared/ModalComponents';
import { createLogger } from '../../../../utils/createLogger';

/**
 * Gestionnaire pour la modal d'envoi d'email - VERSION FINALE NETTOYÉE
 * Utilise les composants partagés pour réduire la duplication de code
 * SUPPRESSION DÉFINITIVE de showPopupSuccess qui créait la modal indésirable
 */
export class EmailModalHandler {
    constructor(dependencies) {
        this.factureActions = dependencies.factureActions;
        this.showCustom = dependencies.showCustom;
        this.showLoading = dependencies.showLoading;
        this.formatMontant = dependencies.formatMontant;
        this.formatDate = dependencies.formatDate;
        this.formatEmailMessage = dependencies.formatEmailMessage;
        this.emailTemplates = dependencies.emailTemplates;
        this.onSetNotification = dependencies.onSetNotification;
        this.chargerFactures = dependencies.chargerFactures;
        
        this.isDevelopment = this.detectDevelopment();

        this.log = createLogger('EmailModalHandler');
    }

    /**
     * Point d'entrée principal
     */
    async handle(idFacture, event) {
        const anchorRef = this.createAnchorRef(event);
        
        try {
            const [factureData, pdfResult] = await this.loadFactureData(idFacture, anchorRef);
            
            if (!factureData) {
                throw new Error('Erreur lors du chargement de la facture');
            }

            if (!this.validateFactureState(factureData)) {
                await this.showStateError(factureData, anchorRef);
                return;
            }

            const emailResult = await this.showEmailModal(factureData, pdfResult, anchorRef);
            
            if (emailResult.action === 'submit') {
                await this.handleSubmit(idFacture, emailResult.data, factureData, anchorRef);
            }

        } catch (error) {
            this.log.error('❌ Erreur préparation email:', error);
            await this.showError(error.message, anchorRef);
        }
    }

    /**
     * Chargement des données - SIMPLIFIÉ avec composants partagés
     */
    async loadFactureData(idFacture, anchorRef) {
        return await this.showLoading(
            {
                title: "Préparation de l'email...",
                content: ModalComponents.createLoadingContent("Vérification de la facture et du PDF..."),
                anchorRef,
                size: 'small',
                position: 'smart'
            },
            async () => {
                const facture = await this.factureActions.chargerFacture(idFacture);  // ✅
                
                let pdfResult = null;
                try {
                    pdfResult = await this.factureActions.getFactureUrl(idFacture);
                    console.log(`✅ Résultat getFactureUrl:`, pdfResult);
                } catch (error) {
                    console.log(`❌ Erreur getFactureUrl: ${error.message}`);
                    pdfResult = { success: false, message: error.message };
                }
                
                return [facture, pdfResult];
            }
        );
    }

    /**
     * Validation de l'état - INCHANGÉ
     */
    validateFactureState(factureData) {
        return ['Éditée', 'Envoyée', 'Payée', 'Retard'].includes(factureData.etat);
    }

    /**
     * Erreur d'état - SIMPLIFIÉ avec composants partagés
     */
    async showStateError(factureData, anchorRef) {
        const config = ModalComponents.createSimpleModalConfig(
            "Facture non éditable",
            factureData,
            {
                intro: "",
                warningMessage: `Cette facture doit être éditée avant de pouvoir être envoyée par email.\n\nÉtat actuel: ${factureData.etat}\nÉtats requis: Éditée, Envoyée, Payée ou Retard`,
                warningType: "warning",
                formatMontant: this.formatMontant,
                formatDate: this.formatDate,
                buttons: ModalComponents.createModalButtons({
                    submitText: "OK",
                    showCancel: false
                })
            }
        );

        await this.showCustom({
            ...config,
            anchorRef,
            position: 'smart'
        });
    }

    /**
     * Modal email - FORTEMENT SIMPLIFIÉ avec composants partagés
     */
    async showEmailModal(factureData, pdfResult, anchorRef) {
        const pdfExiste = pdfResult && pdfResult.success && pdfResult.pdfUrl;
        const emailDefaut = this.createDefaultEmailData(factureData);
        
        const content = this.createEmailModalContent(factureData, pdfExiste, pdfResult, emailDefaut);
        
        return await this.showCustom({
            title: "Envoyer la facture par email",
            anchorRef,
            size: 'large',
            position: 'smart',
            content,
            buttons: ModalComponents.createModalButtons({
                cancelText: "Annuler",
                submitText: "Envoyer l'email",
                submitDisabled: !pdfExiste
            }),
            onMount: (container) => this.setupEmailModalEvents(
                container, 
                factureData, 
                pdfExiste, 
                pdfResult?.pdfUrl, 
                anchorRef
            )
        });
    }

    /**
     * Contenu modal email - TRÈS SIMPLIFIÉ avec composants partagés
     */
    createEmailModalContent(factureData, pdfExiste, pdfResult, emailDefaut) {
        let content = "";
        
        // Introduction
        content += ModalComponents.createIntroSection(
            "Envoi de la facture", 
            factureData.numeroFacture
        );
        
        // Détails de la facture
        content += ModalComponents.createFactureDetailsSection(
            factureData, 
            this.formatMontant, 
            this.formatDate
        );
        
        // Section PDF
        content += ModalComponents.createPieceJointeSection(
            pdfExiste, 
            pdfResult, 
            factureData, 
            true
        );
        
        // Avertissement si pas de PDF
        if (!pdfExiste) {
            content += ModalComponents.createWarningSection(
                "⚠️ Attention :",
                `Le PDF de cette facture n'a pas été trouvé. Veuillez d'abord imprimer/générer la facture avant de pouvoir l'envoyer par email.<br><br><strong>Détail de l'erreur :</strong> ${pdfResult?.message || 'Fichier PDF non accessible'}`,
                "error"
            );
        }
        
        // Formulaire email
        content += this.createEmailForm(emailDefaut, pdfExiste);
        
        // Section développement
        if (this.isDevelopment && pdfExiste) {
            content += ModalComponents.createDevBypassSection(
                "Simuler l'envoi sans réellement envoyer l'email (développement uniquement)"
            );
        }
        
        return content;
    }

    /**
     * Formulaire email - SIMPLIFIÉ avec composants partagés
     */
    createEmailForm(emailDefaut, pdfExiste) {
        let form = '<form id="emailForm">';
        
        // Champ expéditeur
        form += ModalComponents.createEmailInput(
            "from", 
            "De (expéditeur)", 
            emailDefaut.from, 
            true, 
            !pdfExiste
        );
        
        // Champ destinataire
        form += ModalComponents.createEmailInput(
            "to", 
            "À (destinataire)", 
            emailDefaut.to, 
            true, 
            !pdfExiste
        );
        
        // Champ sujet
        form += ModalComponents.createTextInput(
            "subject", 
            "Sujet", 
            emailDefaut.subject, 
            "text", 
            true, 
            !pdfExiste
        );
        
        // Type de corps
        form += ModalComponents.createSelect(
            "typeCorps",
            "Type de message",
            [
                { value: "tu", text: "Tutoiement" },
                { value: "vous", text: "Vouvoiement" },
                { value: "personnalise", text: "Personnalisé" }
            ],
            emailDefaut.typeCorps,
            false,
            !pdfExiste
        );
        
        // Message
        form += ModalComponents.createTextarea(
            "message", 
            "Message", 
            emailDefaut.message, 
            8, 
            true, 
            !pdfExiste
        );
        
        form += '</form>';
        
        return form;
    }

    /**
     * Données email par défaut - INCHANGÉ
     */
    createDefaultEmailData(factureData) {
        const typeCorpsDefaut = 'tu';
        const messageFormatte = this.formatEmailMessage(this.emailTemplates[typeCorpsDefaut] || '', factureData);
        
        return {
            from: 'contact@lagrange.ch',
            to: factureData.client && factureData.client.email ? factureData.client.email : '',
            subject: `Facture ${factureData.numeroFacture} - Centre La Grange`,
            message: messageFormatte,
            typeCorps: typeCorpsDefaut
        };
    }

    /**
     * Events modal - SIMPLIFIÉ
     */
    setupEmailModalEvents(container, factureData, pdfExiste, pdfUrl, anchorRef) {
        // Bouton visualisation PDF
        const previewBtn = container.querySelector('#previewPdfBtn');
        if (previewBtn && pdfExiste && pdfUrl) {
            previewBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                try {
                    window.open(pdfUrl, '_blank');
                } catch (error) {
                    await this.showError('Erreur lors de l\'ouverture du PDF.', anchorRef);
                }
            });
        }
        
        if (!pdfExiste) {
            this.disableSubmitButton(container);
            return;
        }
        
        this.setupFormInteractions(container, factureData);
    }

    /**
     * Interactions formulaire - SIMPLIFIÉ
     */
    setupFormInteractions(container, factureData) {
        const typeCorpsSelect = container.querySelector('#typeCorps');
        const messageTextarea = container.querySelector('#message');
        
        // Changement type de corps
        typeCorpsSelect?.addEventListener('change', (e) => {
            const newType = e.target.value;
            if (newType !== 'personnalise' && this.emailTemplates[newType]) {
                const newMessage = this.formatEmailMessage(this.emailTemplates[newType], factureData);
                messageTextarea.value = newMessage;
            }
        });
        
        // Validation email temps réel
        container.querySelectorAll('input[type="email"]').forEach(input => {
            input.addEventListener('blur', (e) => {
                const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.target.value);
                e.target.style.borderBottomColor = isValid ? '' : '#dc3545';
            });
        });
    }

    /**
     * Désactiver bouton submit
     */
    disableSubmitButton(container) {
        const sendButton = container.querySelector('[data-action="submit"]');
        if (sendButton) {
            sendButton.disabled = true;
            sendButton.style.opacity = '0.6';
            sendButton.style.cursor = 'not-allowed';
            sendButton.title = 'PDF requis pour envoyer l\'email';
        }
    }

    /**
     * Soumission - SIMPLIFIÉ avec composants partagés pour les erreurs
     */
    async handleSubmit(idFacture, formData, factureData, anchorRef) {
        if (!formData.to || !formData.subject || !formData.message) {
            await this.showValidationError(anchorRef);
            return;
        }
        
        const emailDataToSend = {
            from: formData.from,
            to: formData.to,
            subject: formData.subject,
            message: formData.message
        };
        
        if (this.isDevelopment && formData.bypassCapture === 'on') {
            emailDataToSend.bypassCapture = true;
        }
        
        try {
            const sendResult = await this.showLoading(
                {
                    title: "Envoi en cours...",
                    content: ModalComponents.createLoadingContent(
                        formData.bypassCapture === 'on' ? 
                        '🛠️ Envoi simulé en cours (mode développement)...' : 
                        'Envoi de l\'email avec pièce jointe...'
                    ),
                    anchorRef,
                    size: 'small',
                    position: 'smart'
                },
                async () => await this.factureActions.envoyerFactureParEmail(idFacture, emailDataToSend) 
            );
            
            if (sendResult.success) {
                await this.handleSuccessfulSend(sendResult, formData, anchorRef);
            } else {
                throw new Error(sendResult.message || 'Erreur lors de l\'envoi de l\'email');
            }
            
        } catch (sendError) {
            await this.handleSendError(sendError, idFacture, anchorRef);
        }
    }

    /**
     * Gestion succès - NETTOYÉE DÉFINITIVEMENT
     */
    async handleSuccessfulSend(sendResult, formData, anchorRef) {
        if (sendResult.shouldOpenNewWindow && sendResult.newWindowUrl) {
            const clientPageUrl = emailClientSenderUrlWithSession(sendResult);
            await this.openEmailClientPopup(clientPageUrl, sendResult, formData, anchorRef);
        } else {
            await this.showDirectSendSuccess(formData, anchorRef);
        }
        
        this.chargerFactures();
    }

    /**
     * Popup client - VERSION FINALE AVEC AUTO-FERMETURE
     */
    async openEmailClientPopup(clientPageUrl, sendResult, formData, anchorRef) {
        try {
            const popup = window.open(
                clientPageUrl, 
                'emailClientSender', 
                'width=1000,height=700,scrollbars=yes,resizable=yes,menubar=no,toolbar=no,location=no,status=no'
            );
            
            if (popup && !popup.closed) {
                this.log.debug('✅ Popup ouverte avec succès');
                
                // ✅ AMÉLIORATION: Surveiller la fermeture de la popup
                this.monitorPopupClosure(popup, formData);
                
                // // ✅ Notification discrète
                // this.onSetNotification('Interface email moderne préparée', 'success');
                
            } else {
                this.log.warn('❌ Popup bloquée par le navigateur');
                await this.handleBlockedPopup(clientPageUrl, sendResult, formData, anchorRef);
            }
        } catch (error) {
            this.log.error('❌ Erreur ouverture popup:', error);
            await this.handlePopupError(clientPageUrl, sendResult, formData, anchorRef);
        }
    }

    /**
     * ✅ NOUVEAU: Surveillance de la fermeture de popup
     */
    monitorPopupClosure(popup, formData) {
        // Vérifier périodiquement si la popup est fermée
        const checkClosed = setInterval(() => {
            if (popup.closed) {
                clearInterval(checkClosed);
                this.log.debug('✅ Popup fermée automatiquement');
                
                // Notification de succès finale
                this.onSetNotification(
                    `Email préparé pour ${formData.to}`, 
                    'success'
                );
                
                // Recharger la liste des factures au cas où l'état aurait changé
                this.chargerFactures();
            }
        }, 1000); // Vérifier toutes les secondes
        
        // Nettoyage après 10 minutes pour éviter les fuites mémoire
        setTimeout(() => {
            if (!popup.closed) {
                clearInterval(checkClosed);
                this.log.debug('⚠️ Arrêt de la surveillance popup (timeout)');
            }
        }, 600000); // 10 minutes
    }

    /**
     * Gestion popup bloquée
     */
    async handleBlockedPopup(clientPageUrl, sendResult, formData, anchorRef) {
        const manualResult = await this.showCustom({
            title: "Popup bloquée",
            content: `
                ${ModalComponents.createWarningSection(
                    "⚠️ Popup bloquée",
                    `Votre navigateur a bloqué l'ouverture automatique.<br><br>📧 <strong>Destinataire :</strong> ${formData.to}<br>📄 <strong>Pièce jointe :</strong> ${sendResult.attachmentName || 'Facture PDF'}<br><br>Que voulez-vous faire ?`,
                    "warning"
                )}
            `,
            anchorRef,
            size: 'medium',
            position: 'smart',
            buttons: [
                {
                    text: "🪟 Ouvrir popup manuellement",
                    action: "popup",
                    className: "primary"
                },
                {
                    text: "🔗 Ouvrir dans cet onglet",
                    action: "redirect",
                    className: "secondary"
                },
                {
                    text: "❌ Annuler",
                    action: "cancel",
                    className: "secondary"
                }
            ]
        });
        
        if (manualResult.action === 'popup') {
            window.open(clientPageUrl, '_blank');
            this.onSetNotification('Popup ouverte manuellement', 'success');
        } else if (manualResult.action === 'redirect') {
            window.location.href = clientPageUrl;
        }
    }

    /**
     * Gestion erreur popup
     */
    async handlePopupError(clientPageUrl, sendResult, formData, anchorRef) {
        const fallbackResult = await this.showCustom({
            title: "Erreur popup",
            content: `
                ${ModalComponents.createWarningSection(
                    "❌ Impossible d'ouvrir la popup",
                    `📧 <strong>Destinataire :</strong> ${formData.to}<br>📄 <strong>Pièce jointe :</strong> ${sendResult.attachmentName || 'Facture PDF'}<br><br>Voulez-vous ouvrir l'interface dans cet onglet ?`,
                    "error"
                )}
            `,
            anchorRef,
            size: 'medium',
            position: 'smart',
            buttons: [
                {
                    text: "🔗 Ouvrir dans cet onglet",
                    action: "redirect",
                    className: "primary"
                },
                {
                    text: "❌ Annuler",
                    action: "cancel",
                    className: "secondary"
                }
            ]
        });
        
        if (fallbackResult.action === 'redirect') {
            window.location.href = clientPageUrl;
        }
    }

    /**
     * Succès envoi direct
     */
    async showDirectSendSuccess(formData, anchorRef) {
        const message = formData.bypassCapture === 'on' ? 
            `🛠️ <strong>Email simulé</strong> envoyé avec succès à ${formData.to}.<br><small>(Mode développement - aucun email réel envoyé)</small>` :
            `L'email avec la facture PDF a été envoyé avec succès à ${formData.to}.`;

        const config = ModalComponents.createSimpleModalConfig(
            "Email envoyé !",
            {},
            {
                intro: "",
                content: `<div class="modal-success">${message}</div>`,
                buttons: ModalComponents.createModalButtons({
                    submitText: "OK",
                    showCancel: false
                })
            }
        );

        await this.showCustom({
            ...config,
            anchorRef,
            position: 'smart'
        });
        
        this.onSetNotification(
            formData.bypassCapture === 'on' ? 
                'Email simulé envoyé (développement)' : 
                'Email envoyé avec succès', 
            'success'
        );
    }

    /**
     * Gestion erreur envoi
     */
    async handleSendError(sendError, idFacture, anchorRef) {
        const errorResult = await this.showCustom({
            title: "Erreur d'envoi",
            content: ModalComponents.createWarningSection("", sendError.message, "error"),
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
            setTimeout(() => {
                this.handle(idFacture, null);
            }, 100);
        }
    }

    // ========== MÉTHODES UTILITAIRES SIMPLIFIÉES ==========

    detectDevelopment() {
        return process.env.NODE_ENV === 'development' || 
               window.location.hostname === 'localhost' || 
               window.location.hostname === '127.0.0.1' ||
               window.location.port === '3000';
    }

    createAnchorRef(event) {
        if (!event) return null;
        const anchorRef = React.createRef();
        if (event.currentTarget) {
            anchorRef.current = event.currentTarget;
        }
        return anchorRef;
    }

    async showValidationError(anchorRef) {
        const config = ModalComponents.createSimpleModalConfig(
            "Erreur de validation",
            {},
            {
                intro: "",
                warningMessage: "Veuillez remplir tous les champs obligatoires.",
                warningType: "error",
                buttons: ModalComponents.createModalButtons({
                    submitText: "OK",
                    showCancel: false
                })
            }
        );

        await this.showCustom({
            ...config,
            anchorRef,
            position: 'smart'
        });
    }

    async showError(message, anchorRef) {
        const config = ModalComponents.createSimpleModalConfig(
            "Erreur",
            {},
            {
                intro: "",
                warningMessage: message,
                warningType: "error",
                buttons: ModalComponents.createModalButtons({
                    submitText: "OK",
                    showCancel: false
                })
            }
        );

        await this.showCustom({
            ...config,
            anchorRef,
            position: 'smart'
        });
    }
}

export default EmailModalHandler;