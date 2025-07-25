// src/components/factures/modals/handlers/PaymentModalHandler.js

import React from 'react';
import ModalComponents from '../../../shared/ModalComponents';

/**
 * Gestionnaire pour l'enregistrement de paiements
 * Extrait de FacturesListe.jsx pour réduire la complexité
 */
export class PaymentModalHandler {
    constructor(dependencies) {
        this.factureService = dependencies.factureService;
        this.showCustom = dependencies.showCustom;
        this.showLoading = dependencies.showLoading;
        this.formatMontant = dependencies.formatMontant;
        this.formatDate = dependencies.formatDate;
        this.onSetNotification = dependencies.onSetNotification;
        this.chargerFactures = dependencies.chargerFactures;
    }

    /**
     * Point d'entrée principal
     */
    async handle(factureId, event) {
        if (event) {
            event.stopPropagation();
        }
        
        const anchorRef = this.createAnchorRef(event);
        
        try {
            // Charger les données de la facture
            const factureData = await this.loadFactureData(factureId, anchorRef);
            
            if (!factureData) {
                throw new Error('Erreur lors du chargement de la facture');
            }
            
            // Vérifications préalables
            if (await this.checkFactureState(factureData, anchorRef)) {
                return; // Facture déjà payée ou annulée
            }
            
            // Afficher le formulaire de paiement
            const paymentResult = await this.showPaymentModal(factureData, anchorRef);
            
            if (paymentResult.action === 'submit') {
                await this.processPayment(factureId, paymentResult.data, factureData, anchorRef);
            }
            
        } catch (error) {
            console.error('❌ Erreur préparation paiement:', error);
            
            // ✅ CORRECTION : Essayer de récupérer factureData même en cas d'erreur
            let factureData = null;
            try {
                factureData = await this.factureService.getFacture(factureId);
            } catch (e) {
                console.warn('Impossible de récupérer les données de facture pour l\'erreur');
            }
            
            await this.showError(
                `Erreur lors du chargement de la facture : ${error.message}`,
                factureData, // ✅ Passer factureData
                anchorRef
            );
        }
    }

    /**
     * Charger les données de la facture
     */
    async loadFactureData(factureId, anchorRef) {
        return await this.showLoading(
            {
                title: "Chargement...",
                content: ModalComponents.createLoadingContent("Chargement des données de la facture..."),
                anchorRef,
                size: 'small',
                position: 'smart'
            },
            async () => await this.factureService.getFacture(factureId)
        );
    }

    /**
     * Vérifier l'état de la facture
     */
    async checkFactureState(factureData, anchorRef) {
        if (factureData.etat === 'Payée') {
            await this.showFactureAlreadyPaid(factureData, anchorRef);
            return true;
        }
        
        if (factureData.etat === 'Annulée') {
            await this.showFactureCancelled(anchorRef);
            return true;
        }
        
        return false;
    }

    /**
     * Modal pour facture déjà payée
     */
    async showFactureAlreadyPaid(factureData, anchorRef) {
        const config = ModalComponents.createSimpleModalConfig(
            "Facture déjà payée",
            factureData, // ✅ CORRECTION : passer factureData au lieu de {}
            {
                intro: "",
                warningMessage: `Cette facture a déjà été payée le ${this.formatDate(factureData.date_paiement)}.`,
                warningType: "warning",
                formatDate: this.formatDate, // ✅ Ajouter formatDate
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
     * Modal pour facture annulée
     */
    async showFactureCancelled(anchorRef) {
        const config = ModalComponents.createSimpleModalConfig(
            "Facture annulée",
            {},
            {
                intro: "",
                warningMessage: "Cette facture a été annulée et ne peut pas être payée.",
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

    /**
     * Modal principale de paiement
     */
    async showPaymentModal(factureData, anchorRef) {
        const montantFacture = parseFloat(factureData.totalFacture);
        const montantAvecRistourne = factureData.ristourne 
            ? montantFacture - parseFloat(factureData.ristourne || 0)
            : montantFacture;
        
        return await this.showCustom({
            title: "Enregistrer un paiement",
            anchorRef,
            size: 'medium',
            position: 'smart',
            content: this.createPaymentModalContent(factureData, montantFacture, montantAvecRistourne),
            buttons: ModalComponents.createModalButtons({
                cancelText: "Annuler",
                submitText: "Enregistrer paiement",
                submitClass: "primary"
            }),
            onMount: (container) => this.setupPaymentModalEvents(container, montantAvecRistourne, montantFacture)
        });
    }

    /**
     * Contenu de la modal de paiement
     */
    createPaymentModalContent(factureData, montantFacture, montantAvecRistourne) {
        let content = "";
        
        // Introduction
        content += ModalComponents.createIntroSection(
            "Paiement pour la facture", 
            factureData.numeroFacture
        );
        
        // Détails de la facture
        content += `
            <div class="details-container">
                <div class="info-row">
                    <div class="info-label">N° Facture:</div>
                    <div class="info-value">${factureData.numeroFacture}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Client:</div>
                    <div class="info-value">${factureData.client.prenom} ${factureData.client.nom}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Montant facture:</div>
                    <div class="info-value">${this.formatMontant(montantFacture)} CHF</div>
                </div>
                ${factureData.ristourne ? `
                <div class="info-row">
                    <div class="info-label">Ristourne:</div>
                    <div class="info-value">-${this.formatMontant(factureData.ristourne)} CHF</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Montant à payer:</div>
                    <div class="info-value" style="font-weight: bold; color: var(--color-primary);">${this.formatMontant(montantAvecRistourne)} CHF</div>
                </div>
                ` : ''}
            </div>
        `;
        
        // Formulaire de paiement
        content += this.createPaymentForm(montantAvecRistourne);
        
        return content;
    }

    /**
     * Formulaire de paiement
     */
    createPaymentForm(montantAvecRistourne) {
        return `
            <form id="paymentForm">
                <div class="input-group date-input">
                    <input 
                        type="date" 
                        name="datePaiement" 
                        id="datePaiement"
                        value="${new Date().toISOString().split('T')[0]}"
                        required 
                        placeholder=" "
                    />
                    <label for="datePaiement" class="required">Date de paiement</label>
                    <span class="calendar-icon">📅</span>
                </div>
                
                <div class="input-group">
                    <input 
                        type="number" 
                        name="montantPaye" 
                        id="montantPaye"
                        value="${montantAvecRistourne.toFixed(2)}"
                        required 
                        placeholder=" "
                        step="0.01"
                        min="0"
                    />
                    <label for="montantPaye" class="required">Montant payé (CHF)</label>
                </div>
                
                <div class="input-group">
                    <select name="methodePaiement" id="methodePaiement">
                        <option value="virement">Virement bancaire</option>
                        <option value="especes">Espèces</option>
                        <option value="carte">Carte de crédit</option>
                        <option value="cheque">Chèque</option>
                        <option value="autre">Autre</option>
                    </select>
                    <label for="methodePaiement">Méthode de paiement</label>
                </div>
                
                <div class="input-group">
                    <textarea 
                        name="commentaire" 
                        id="commentaire"
                        rows="3"
                        placeholder=" "
                    ></textarea>
                    <label for="commentaire">Commentaire (optionnel)</label>
                </div>
            </form>
        `;
    }

    /**
     * Configuration des événements de la modal de paiement
     */
    setupPaymentModalEvents(container, montantAvecRistourne, montantFacture) {
        const montantInput = container.querySelector('#montantPaye');
        const dateInput = container.querySelector('#datePaiement');
        
        // Suggestions de montant avec style
        this.addAmountSuggestions(container, montantInput, montantAvecRistourne, montantFacture);
        
        // Validation montant
        montantInput.addEventListener('blur', (e) => {
            const value = parseFloat(e.target.value);
            if (isNaN(value) || value <= 0) {
                e.target.classList.add('error');
                e.target.style.borderBottomColor = '#dc3545';
            } else {
                e.target.classList.remove('error');
                e.target.style.borderBottomColor = '';
            }
        });
        
        // Validation date
        dateInput.addEventListener('change', (e) => {
            const selectedDate = new Date(e.target.value);
            const today = new Date();
            today.setHours(23, 59, 59, 999);
            
            if (selectedDate > today) {
                e.target.classList.add('error');
                e.target.style.borderBottomColor = '#dc3545';
                
                let helpText = container.querySelector('.date-help');
                if (!helpText) {
                    helpText = document.createElement('small');
                    helpText.className = 'date-help';
                    helpText.style.cssText = 'color: #dc3545; font-size: 11px; margin-top: 5px; display: block;';
                    helpText.textContent = 'La date ne peut pas être dans le futur';
                    e.target.parentNode.appendChild(helpText);
                }
            } else {
                e.target.classList.remove('error');
                e.target.style.borderBottomColor = '';
                const helpText = container.querySelector('.date-help');
                if (helpText) {
                    helpText.remove();
                }
            }
        });
    }

    /**
     * Ajouter les suggestions de montant
     */
    addAmountSuggestions(container, montantInput, montantAvecRistourne, montantFacture) {
        const suggestionButtons = document.createElement('div');
        suggestionButtons.style.cssText = 'margin-top: 10px; display: flex; gap: 8px; flex-wrap: wrap;';
        suggestionButtons.innerHTML = `
            <button type="button" class="amount-suggestion" data-amount="${montantAvecRistourne.toFixed(2)}">
                Montant exact (${this.formatMontant(montantAvecRistourne)} CHF)
            </button>
            ${montantFacture !== montantAvecRistourne ? `
            <button type="button" class="amount-suggestion" data-amount="${montantFacture.toFixed(2)}">
                Sans ristourne (${this.formatMontant(montantFacture)} CHF)
            </button>` : ''}
        `;
        
        // Style des boutons suggestions
        suggestionButtons.querySelectorAll('.amount-suggestion').forEach(btn => {
            btn.style.cssText = `
                padding: 6px 12px; 
                font-size: 12px; 
                background: var(--color-secondary, #f0f0f0); 
                border: 1px solid var(--color-border, #ccc); 
                border-radius: 4px; 
                cursor: pointer; 
                transition: background-color 0.2s ease;
            `;
            
            btn.addEventListener('mouseover', () => {
                btn.style.backgroundColor = '#e0e0e0';
            });
            
            btn.addEventListener('mouseout', () => {
                btn.style.backgroundColor = 'var(--color-secondary, #f0f0f0)';
            });
            
            btn.addEventListener('click', (e) => {
                montantInput.value = e.target.dataset.amount;
                montantInput.focus();
                montantInput.dispatchEvent(new Event('blur'));
            });
        });
        
        montantInput.parentNode.appendChild(suggestionButtons);
    }

    /**
     * Traiter le paiement
     */
    async processPayment(factureId, formData, factureData, anchorRef) {
        const montantPayeNum = parseFloat(formData.montantPaye);
        
        if (isNaN(montantPayeNum) || montantPayeNum <= 0) {
            await this.showValidationError("Le montant payé doit être un nombre positif.", factureData, anchorRef); // ✅ Ajouter factureData
            return;
        }
        
        const datePayment = new Date(formData.datePaiement);
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        
        if (datePayment > today) {
            await this.showValidationError("La date de paiement ne peut pas être dans le futur.", factureData, anchorRef); // ✅ Ajouter factureData
            return;
        }
        
        // Confirmation si montant différent
        const montantFacture = parseFloat(factureData.totalFacture);
        const montantAvecRistourne = factureData.ristourne 
            ? montantFacture - parseFloat(factureData.ristourne || 0)
            : montantFacture;
            
        if (Math.abs(montantPayeNum - montantAvecRistourne) > 0.01) {
            const shouldContinue = await this.confirmDifferentAmount(montantPayeNum, montantAvecRistourne, anchorRef);
            if (!shouldContinue) {
                return;
            }
        }
        
        // Enregistrer le paiement
        await this.savePayment(factureId, formData, montantPayeNum, anchorRef);
    }

    /**
     * Confirmation pour montant différent
     */
    async confirmDifferentAmount(montantPayeNum, montantAvecRistourne, anchorRef) {
        const difference = montantPayeNum - montantAvecRistourne;
        const confirmationMessage = difference > 0
            ? `Le montant payé (${this.formatMontant(montantPayeNum)} CHF) est supérieur au montant à payer (${this.formatMontant(montantAvecRistourne)} CHF). Différence: +${this.formatMontant(difference)} CHF.`
            : `Le montant payé (${this.formatMontant(montantPayeNum)} CHF) est inférieur au montant à payer (${this.formatMontant(montantAvecRistourne)} CHF). Différence: ${this.formatMontant(difference)} CHF.`;
        
        const confirmResult = await this.showCustom({
            title: "Confirmer le montant",
            content: ModalComponents.createWarningSection(
                "",
                `${confirmationMessage}<br><br>Voulez-vous continuer avec ce montant ?`,
                "warning"
            ),
            anchorRef,
            size: 'medium',
            position: 'smart',
            buttons: [
                {
                    text: "Annuler",
                    action: "cancel",
                    className: "secondary"
                },
                {
                    text: "Confirmer",
                    action: "confirm",
                    className: "primary"
                }
            ]
        });
        
        return confirmResult.action === 'confirm';
    }

    /**
     * Enregistrer le paiement
     */
    async savePayment(factureId, formData, montantPayeNum, anchorRef) {
        try {
            const paiementResult = await this.showLoading(
                {
                    title: "Enregistrement...",
                    content: ModalComponents.createLoadingContent("Enregistrement du paiement..."),
                    anchorRef,
                    size: 'small',
                    position: 'smart'
                },
                async () => await this.factureService.enregistrerPaiement(factureId, {
                    datePaiement: formData.datePaiement,
                    montantPaye: montantPayeNum,
                    methodePaiement: formData.methodePaiement || 'virement',
                    commentaire: formData.commentaire || ''
                })
            );
            
            if (paiementResult.success) {
                // ✅ CORRECTION : Récupérer les données fraîches de la facture après paiement
                const factureData = await this.factureService.getFacture(factureId);
                
                await this.showPaymentSuccess(formData, montantPayeNum, factureData, anchorRef); // ✅ Passer factureData
                this.onSetNotification('Paiement enregistré avec succès', 'success');
                this.chargerFactures();
            } else {
                throw new Error(paiementResult.message || 'Erreur lors de l\'enregistrement du paiement');
            }
            
        } catch (paymentError) {
            console.error('❌ Erreur enregistrement paiement:', paymentError);
            
            // ✅ CORRECTION : Récupérer factureData pour l'affichage d'erreur
            let factureData = null;
            try {
                factureData = await this.factureService.getFacture(factureId);
            } catch (e) {
                console.warn('Impossible de récupérer les données de facture pour l\'erreur');
            }
            
            await this.showError(`Erreur lors de l'enregistrement : ${paymentError.message}`, factureData, anchorRef);
        }
    }

    /**
     * Modal de succès de paiement
     */
    async showPaymentSuccess(formData, montantPayeNum, factureData, anchorRef) { // ✅ Ajouter factureData en paramètre
        const config = ModalComponents.createSimpleModalConfig(
            "Paiement enregistré !",
            factureData, // ✅ CORRECTION : passer les données de la facture
            {
                intro: "",
                content: `<div class="modal-success">
                    Le paiement de ${this.formatMontant(montantPayeNum)} CHF a été enregistré avec succès.
                    <br><br>
                    <strong>Méthode:</strong> ${formData.methodePaiement || 'virement'}
                    <br>
                    <strong>Date:</strong> ${this.formatDate(formData.datePaiement)}
                </div>`,
                formatMontant: this.formatMontant, // ✅ Ajouter les fonctions de formatage
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
     * Modal d'erreur de validation
     */
    async showValidationError(message, factureData, anchorRef) { // ✅ Ajouter factureData en paramètre
        const config = ModalComponents.createSimpleModalConfig(
            "Erreur de validation",
            factureData, // ✅ CORRECTION : passer les données de la facture
            {
                intro: "",
                warningMessage: message,
                warningType: "error",
                formatMontant: this.formatMontant, // ✅ Ajouter les fonctions de formatage
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
     * Modal d'erreur générique
     */
    async showError(message, factureData = null, anchorRef) { // ✅ Ajouter factureData (optionnel)
        const config = ModalComponents.createSimpleModalConfig(
            "Erreur",
            factureData || {}, // ✅ CORRECTION : utiliser factureData si disponible
            {
                intro: "",
                warningMessage: message,
                warningType: "error",
                formatMontant: this.formatMontant, // ✅ Ajouter les fonctions de formatage
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

export default PaymentModalHandler;