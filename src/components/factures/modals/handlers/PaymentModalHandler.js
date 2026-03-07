// src/components/factures/modals/handlers/PaymentModalHandler.js

import React from 'react';
import ModalComponents from '../../../shared/ModalComponents';
import { createLogger } from '../../../../utils/createLogger';

/**
 * Gestionnaire pour l'enregistrement de paiements
 * ✅ MODIFIÉ : Utilise PaiementService pour l'enregistrement (architecture unifiée)
 * Garde FactureService uniquement pour récupérer les données de facture
 */
export class PaymentModalHandler {
    constructor(dependencies) {
        this.factureActions = dependencies.factureActions; // Pour récupérer les données de facture
        this.paiementActions = dependencies.paiementActions;
        this.showCustom = dependencies.showCustom;
        this.showLoading = dependencies.showLoading;
        this.formatMontant = dependencies.formatMontant;
        this.formatDate = dependencies.formatDate;
        this.onSetNotification = dependencies.onSetNotification;
        this.chargerFactures = dependencies.chargerFactures;

        // ✅ IMPORTANT : Utiliser executeApi du hook useApiCall
        this.executeApi = dependencies.executeApi;

        this.log = createLogger('PaymentModalHandler');
    }

    /**
     * Point d'entrée principal
     */
    async handle(idFacture, event) {
        if (event) {
            event.stopPropagation();
        }
        
        // Stocker l'ID de la facture comme propriété de l'instance
        this.currentFactureId = idFacture;
        
        const anchorRef = this.createAnchorRef(event);
        
        try {
            // Charger les données de la facture
            const factureData = await this.loadFactureData(idFacture, anchorRef);
            
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
                await this.processPayment(idFacture, paymentResult.data, factureData, anchorRef);
            }
            
        } catch (error) {
            this.log.error('❌ Erreur préparation paiement:', error);
            
            // Essayer de récupérer factureData même en cas d'erreur
            let factureData = null;
            try {
                factureData = await this.factureActions.chargerFacture(idFacture);
            } catch (e) {
                this.log.warn('Impossible de récupérer les données de facture pour l\'erreur');
            }
            
            await this.showError(
                `Erreur lors du chargement de la facture : ${error.message}`,
                factureData,
                anchorRef
            );
        }
    }

    /**
     * Charger les données de la facture
     */
    async loadFactureData(idFacture, anchorRef) {
        return await this.showLoading(
            {
                title: "Chargement...",
                content: ModalComponents.createLoadingContent("Chargement des données de la facture..."),
                anchorRef,
                size: 'small',
                position: 'smart'
            },
            async () => await this.factureActions.chargerFacture(idFacture)  // ✅ Ligne modifiée
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
            factureData,
            {
                intro: "",
                warningMessage: `Cette facture a déjà été payée le ${this.formatDate(factureData.date_paiement)}.`,
                warningType: "warning",
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
        const montantNet = parseFloat(factureData.montantTotal);
        const montantBrut = parseFloat(factureData.montantBrut);
        this.log.debug("showPaymentModal - factureData reçue : ", factureData);
        
        return await this.showCustom({
            title: "Enregistrer un paiement",
            anchorRef,
            size: 'medium',
            position: 'smart',
            content: this.createPaymentModalContent(factureData, montantNet, montantBrut),
            buttons: ModalComponents.createModalButtons({
                cancelText: "Annuler",
                submitText: "Enregistrer paiement",
                submitClass: "primary"
            }),
            onMount: (container) => this.setupPaymentModalEvents(container, montantBrut, montantNet)
        });
    }

    /**
     * Contenu de la modal de paiement
     */
    createPaymentModalContent(factureData, montantNet, montantBrut) {
        let content = "";
        
        // Introduction
        content += ModalComponents.createIntroSection(
            "Paiement pour la facture", 
            factureData.numeroFacture
        );
        
        this.log.debug("createPaymentModalContent - factureData : ", factureData);
        // Affichage de l'état des paiements
        const montantPaye = factureData.montantPayeTotal || 0;
        const montantRestant = factureData.montantRestant || 0;
        const nbPaiements = factureData.nbPaiements || 0;
        this.log.debug("createPaymentModalContent - montants payés : ", montantPaye);
        this.log.debug("createPaymentModalContent - montant restant : ", montantRestant);
        this.log.debug("createPaymentModalContent - nombre paiements : ", nbPaiements);
        
        if (nbPaiements > 0) {
            const pourcentagePaye = Math.round((montantPaye / montantNet) * 100);
            
            content += `
                <div class="payment-status-container" style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <h4 style="margin: 0 0 10px 0; color: #495057;">📊 État des paiements</h4>
                    <div class="payment-progress">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <span>Progression</span>
                            <span><strong>${pourcentagePaye}%</strong></span>
                        </div>
                        <div style="background: #e9ecef; border-radius: 10px; height: 8px; overflow: hidden;">
                            <div style="background: ${pourcentagePaye >= 100 ? '#28a745' : '#007bff'}; height: 100%; width: ${pourcentagePaye}%; transition: width 0.3s ease;"></div>
                        </div>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px;">
                        <div>
                            <div style="font-size: 12px; color: #6c757d;">Déjà payé</div>
                            <div style="font-weight: bold; color: #28a745;">${this.formatMontant(montantPaye)} CHF</div>
                        </div>
                        <div>
                            <div style="font-size: 12px; color: #6c757d;">Reste à payer</div>
                            <div style="font-weight: bold; color: ${montantRestant > 0 ? '#dc3545' : '#28a745'};">${this.formatMontant(montantRestant)} CHF</div>
                        </div>
                    </div>
                    ${nbPaiements > 0 ? `<div style="margin-top: 10px; font-size: 12px; color: #6c757d;">Nombre de paiements : ${nbPaiements}</div>` : ''}
                </div>
            `;
        }
        
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
                    <div class="info-value">${this.formatMontant(montantBrut)} CHF</div>
                </div>
                ${factureData.ristourne ? `
                <div class="info-row">
                    <div class="info-label">Ristourne:</div>
                    <div class="info-value">-${this.formatMontant(factureData.ristourne)} CHF</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Montant net:</div>
                    <div class="info-value" style="font-weight: bold; color: var(--color-primary);">${this.formatMontant(montantNet)} CHF</div>
                </div>
                ` : ''}
                ${nbPaiements > 0 ? `
                <div class="info-row">
                    <div class="info-label">Déjà payé:</div>
                    <div class="info-value" style="color: #28a745;">${this.formatMontant(montantPaye)} CHF</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Reste à payer:</div>
                    <div class="info-value" style="font-weight: bold; color: ${montantRestant > 0 ? '#dc3545' : '#28a745'};">${this.formatMontant(montantRestant)} CHF</div>
                </div>
                ` : ''}
            </div>
        `;
        
        // Bouton pour voir l'historique si des paiements existent
        if (nbPaiements > 0) {
            content += `
                <div style="text-align: center; margin: 15px 0;">
                    <button type="button" id="voirHistoriquePaiements" style="
                        background: #6c757d; color: white; border: none; padding: 8px 16px; 
                        border-radius: 5px; cursor: pointer; font-size: 14px;
                    ">
                        📋 Voir l'historique des paiements (${nbPaiements})
                    </button>
                </div>
            `;
        }
        
        // Formulaire de paiement
        content += this.createPaymentForm(montantRestant > 0 ? montantRestant : montantNet);
        
        return content;
    }

    /**
     * Formulaire de paiement
     */
    createPaymentForm(montantNet) {
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
                        value="${montantNet.toFixed(2)}"
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
    setupPaymentModalEvents(container, montantBrut, montantNet) {
        const montantInput = container.querySelector('#montantPaye');
        const dateInput = container.querySelector('#datePaiement');
        const historiqueBtn = container.querySelector('#voirHistoriquePaiements');
        
        // Gestionnaire pour l'historique des paiements
        if (historiqueBtn) {
            historiqueBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                await this.showHistoriquePaiements(this.currentFactureId, e.target);
            });
        }
        
        // Suggestions de montant avec style
        // this.addAmountSuggestions(container, montantInput, montantBrut, montantNet);
        
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
    addAmountSuggestions(container, montantInput, montantBrut, montantNet) {
        const suggestionButtons = document.createElement('div');
        suggestionButtons.style.cssText = 'margin-top: 10px; display: flex; gap: 8px; flex-wrap: wrap;';
        suggestionButtons.innerHTML = `
            <button type="button" class="amount-suggestion" data-amount="${montantNet.toFixed(2)}">
                Montant exact (${this.formatMontant(montantNet)} CHF)
            </button>
            ${montantNet !== montantBrut ? `
            <button type="button" class="amount-suggestion" data-amount="${montantNet.toFixed(2)}">
                Sans ristourne (${this.formatMontant(montantNet)} CHF)
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
    async processPayment(idFacture, formData, factureData, anchorRef) {
        const montantPayeNum = parseFloat(formData.montantPaye);
        
        if (isNaN(montantPayeNum) || montantPayeNum <= 0) {
            await this.showValidationError("Le montant payé doit être un nombre positif.", factureData, anchorRef);
            return;
        }
        
        const datePayment = new Date(formData.datePaiement);
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        
        if (datePayment > today) {
            await this.showValidationError("La date de paiement ne peut pas être dans le futur.", factureData, anchorRef);
            return;
        }
        
        // Calculer le montant restant avec les paiements existants
        const montantNet = parseFloat(factureData.montantTotal);
        const montantDejaPaye = factureData.montantPayeTotal || 0;
        const montantRestant = montantNet - montantDejaPaye;
        
        // Vérifier que le paiement ne dépasse pas le montant restant
        if (montantPayeNum > montantRestant + 0.01) { // +0.01 pour les erreurs d'arrondi
            await this.showValidationError(
                `Le montant saisi (${this.formatMontant(montantPayeNum)} CHF) dépasse le montant restant à payer (${this.formatMontant(montantRestant)} CHF).`,
                factureData, 
                anchorRef
            );
            return;
        }
        
        // Confirmation si paiement partiel
        if (montantPayeNum < montantRestant - 0.01) {
            const pourcentagePaye = Math.round(((montantDejaPaye + montantPayeNum) / montantNet) * 100);
            const shouldContinue = await this.confirmPartialPayment(
                montantPayeNum, 
                montantRestant, 
                pourcentagePaye,
                anchorRef
            );
            if (!shouldContinue) {
                return;
            }
        }
        
        // ✅ MODIFIÉ : Enregistrer le paiement via PaiementService au lieu de FactureService
        await this.savePayment(idFacture, formData, montantPayeNum, factureData, anchorRef);
    }

    // Confirmation pour paiement partiel
    async confirmPartialPayment(montantPaye, montantRestant, pourcentagePaye, anchorRef) {
        const montantRestantApres = montantRestant - montantPaye;
        
        const confirmResult = await this.showCustom({
            title: "Paiement partiel",
            content: ModalComponents.createWarningSection(
                "⚠️ Paiement partiel détecté",
                `Vous allez enregistrer un paiement partiel :<br><br>
                <strong>Montant de ce paiement :</strong> ${this.formatMontant(montantPaye)} CHF<br>
                <strong>Montant restant après :</strong> ${this.formatMontant(montantRestantApres)} CHF<br>
                <strong>Progression :</strong> ${pourcentagePaye}% payé<br><br>
                La facture restera à l'état "Partiellement payée" jusqu'au paiement complet.<br><br>
                Voulez-vous continuer ?`,
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
                    text: "Confirmer le paiement partiel",
                    action: "confirm",
                    className: "primary"
                }
            ]
        });
        
        return confirmResult.action === 'confirm';
    }

    // ✅ MODIFIÉ : Afficher l'historique via FactureService (données) mais on pourrait aussi via PaiementService
    async showHistoriquePaiements(idFacture, anchorRef) {
        try {
            // ✅ MODIFIÉ : Utiliser executeApi pour récupérer les paiements
            const paiements = await this.paiementActions.getPaiementsParFacture(idFacture);

            const historique = {
                success: true,
                paiements: paiements || []
            };
            
            if (!historique.success) {
                throw new Error(historique.message);
            }

            this.log.debug("showHistoriquePaiements - liste des paiements : ", paiements);
            
            
            let content = `
                <div class="historique-paiements">
                    <div style="margin-bottom: 20px;">
                        <h4 style="margin: 0; color: #495057;">📋 Historique des paiements</h4>
                        <p style="margin: 5px 0 0 0; color: #6c757d; font-size: 14px;">
                            ${paiements.length} paiement(s) enregistré(s)
                        </p>
                    </div>
            `;
            
            if (paiements.length === 0) {
                content += `
                    <div style="text-align: center; padding: 40px; color: #6c757d;">
                        <div style="font-size: 48px; margin-bottom: 10px;">💳</div>
                        <div>Aucun paiement enregistré</div>
                    </div>
                `;
            } else {
                content += `<div class="paiements-liste">`;
                
                paiements.forEach((paiement, index) => {
                    const datePaiement = this.formatDate(paiement.datePaiement);
                    const montant = this.formatMontant(paiement.montantPaye);
                    
                    content += `
                        <div class="paiement-item" style="
                            border: 1px solid #e9ecef; border-radius: 8px; padding: 15px; margin-bottom: 10px;
                            background: ${index === paiements.length - 1 ? '#f8f9fa' : 'white'};
                        ">
                            <div style="display: flex; justify-content: space-between; align-items: start;">
                                <div style="flex: 1;">
                                    <div style="font-weight: bold; color: #495057; margin-bottom: 5px;">
                                        💰 Paiement #${paiement.numeroPaiement}
                                        ${index === paiements.length - 1 ? '<span style="font-size: 12px; background: #007bff; color: white; padding: 2px 6px; border-radius: 10px; margin-left: 8px;">DERNIER</span>' : ''}
                                    </div>
                                    <div style="font-size: 14px; color: #6c757d; margin-bottom: 8px;">
                                        📅 ${datePaiement} • 💳 ${this.paiementActions.formatMethodePaiement(paiement.methodePaiement)}
                                    </div>
                                    ${paiement.commentaire ? `
                                    <div style="font-size: 12px; color: #6c757d; font-style: italic; background: #f8f9fa; padding: 5px 8px; border-radius: 4px;">
                                        💬 ${paiement.commentaire}
                                    </div>
                                    ` : ''}
                                </div>
                                <div style="text-align: right;">
                                    <div style="font-size: 18px; font-weight: bold; color: #28a745;">
                                        ${montant} CHF
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                });
                
                content += `</div>`;
                
                // Résumé
                const totalPaye = paiements.reduce((sum, p) => sum + parseFloat(p.montantPaye), 0);
                content += `
                    <div style="border-top: 2px solid #e9ecef; padding-top: 15px; margin-top: 15px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; font-weight: bold; font-size: 16px;">
                            <span>Total payé :</span>
                            <span style="color: #28a745;">${this.formatMontant(totalPaye)} CHF</span>
                        </div>
                    </div>
                `;
            }
            
            content += `</div>`;
            
            await this.showCustom({
                title: "Historique des paiements",
                content,
                anchorRef,
                size: 'large',
                position: 'smart',
                buttons: [
                    {
                        text: "Fermer",
                        action: "close",
                        className: "primary"
                    }
                ]
            });
            
        } catch (error) {
            this.log.error('❌ Erreur historique paiements:', error);
            await this.showError(
                `Erreur lors du chargement de l'historique : ${error.message}`,
                null,
                anchorRef
            );
        }
    }

    /**
     * ✅ MODIFIÉ : Enregistrer le paiement via PaiementService
     */
    async savePayment(idFacture, formData, montantPayeNum, factureData, anchorRef) {
        try {
            const paiementResult = await this.showLoading(
                {
                    title: "Enregistrement...",
                    content: ModalComponents.createLoadingContent("Enregistrement du paiement..."),
                    anchorRef,
                    size: 'small',
                    position: 'smart'
                },
                async () => {
                    // ✅ MODIFIÉ : Utiliser executeApi pour créer le paiement
                    return await this.executeApi(
                        () => this.paiementActions.creerPaiement({
                            idClient: factureData.idClient,
                            idFacture: idFacture,
                            datePaiement: formData.datePaiement,
                            montantPaye: montantPayeNum,
                            methodePaiement: formData.methodePaiement || 'virement',
                            commentaire: formData.commentaire || ''
                        })
                    );
                }
            );
            
            if (paiementResult.success) {

                // ✅ MODIFIÉ : Invalider le cache de FactureService avant de refetcher
                this.factureActions.clearCache();
                
                // Récupérer les données fraîches de la facture après paiement
                const factureDataUpdated = await this.factureActions.chargerFacture(idFacture);

                this.log.debug('✅ Données fraîches de la facture après paiement:', {
                    etat: factureDataUpdated.etat,
                    montantPayeTotal: factureDataUpdated.montantPayeTotal
                });
                
                await this.showPaymentSuccess(formData, montantPayeNum, factureDataUpdated, paiementResult, anchorRef);
                this.onSetNotification('Paiement enregistré avec succès', 'success');
                this.chargerFactures();
            } else {
                throw new Error(paiementResult.message || 'Erreur lors de l\'enregistrement du paiement');
            }
            
        } catch (paymentError) {
            this.log.error('❌ Erreur enregistrement paiement:', paymentError);
            
            let factureData = null;
            try {
                factureData = await this.factureActions.chargerFacture(idFacture);
            } catch (e) {
                this.log.warn('Impossible de récupérer les données de facture pour l\'erreur');
            }
            
            await this.showError(`Erreur lors de l'enregistrement : ${paymentError.message}`, factureData, anchorRef);
        }
    }

    /**
     * Modal de succès de paiement
     */
    async showPaymentSuccess(formData, montantPayeNum, factureData, paiementResult, anchorRef) {
        const config = ModalComponents.createSimpleModalConfig(
            "Paiement enregistré !",
            factureData,
            {
                intro: "",
                content: `<div class="modal-success">
                    💰 Le paiement de ${this.formatMontant(montantPayeNum)} CHF a été enregistré avec succès.
                    <br><br>
                    <strong>📅 Date :</strong> ${this.formatDate(formData.datePaiement)}<br>
                    <strong>💳 Méthode :</strong> ${formData.methodePaiement || 'virement'}<br>
                    ${formData.commentaire ? `<strong>💬 Commentaire :</strong> ${formData.commentaire}<br>` : ''}
                    ${paiementResult.numeroPaiement ? `<strong>📋 N° Paiement :</strong> #${paiementResult.numeroPaiement}<br>` : ''}
                    <br>
                    <div style="background: #f8f9fa; padding: 10px; border-radius: 5px; margin-top: 10px;">
                        <strong>État de la facture :</strong> ${factureData.etat || 'En cours de mise à jour'}
                    </div>
                </div>`,
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
     * Modal d'erreur de validation
     */
    async showValidationError(message, factureData, anchorRef) {
        const config = ModalComponents.createSimpleModalConfig(
            "Erreur de validation",
            factureData,
            {
                intro: "",
                warningMessage: message,
                warningType: "error",
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
     * Modal d'erreur générique
     */
    async showError(message, factureData = null, anchorRef) {
        const config = ModalComponents.createSimpleModalConfig(
            "Erreur",
            factureData || {},
            {
                intro: "",
                warningMessage: message,
                warningType: "error",
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