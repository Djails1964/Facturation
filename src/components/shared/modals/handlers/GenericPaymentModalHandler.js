// src/components/shared/modals/handlers/GenericPaymentModalHandler.js

import React from 'react';
import ModalComponents from '../../../shared/ModalComponents';
import { createLogger } from '../../../../utils/createLogger';
import { PAYMENT_MODES } from '../../../../constants/paiementConstants';

/**
 * Handler générique pour l'enregistrement de paiements
 * Supporte 3 modes :
 * - from-facture : Depuis la liste des factures (client + facture pré-remplis)
 * - from-client : Depuis la liste des clients (client pré-rempli, choix de facture)
 * - standalone : Depuis le menu Paiements (tout à sélectionner)
 * 
 * ✅ Utilise les CSS unifiées : forms.css, modals.css, buttons.css
 */

export class GenericPaymentModalHandler {
    constructor(dependencies) {
        this.factureActions = dependencies.factureActions;
        this.paiementActions = dependencies.paiementActions;
        this.clientActions = dependencies.clientActions;
        this.showCustom = dependencies.showCustom;
        this.showLoading = dependencies.showLoading;
        this.formatMontant = dependencies.formatMontant;
        this.formatDate = dependencies.formatDate;
        this.onSetNotification = dependencies.onSetNotification;
        this.chargerFactures = dependencies.chargerFactures;
        // ❌ SUPPRIMÉ: this.executeApi (géré dans les hooks actions)

        this.log = createLogger('GenericPaymentModalHandler');
    }

    /**
     * Point d'entrée principal
     * @param {Object} params - Paramètres selon le mode
     * @param {string} params.mode - Mode de paiement (from-facture, from-client, standalone)
     * @param {number} params.idFacture - ID de la facture (requis pour from-facture)
     * @param {number} params.idClient - ID du client (requis pour from-client)
     * @param {string} params.nomClient - Nom du client (optionnel pour from-client)
     * @param {Event} params.event - Événement DOM pour ancrage
     */
    async handle(params) {
        const { mode, idFacture, idClient, nomClient, event } = params;

        if (event) {
            event.stopPropagation();
        }

        const anchorRef = this.createAnchorRef(event);

        try {
            this.log.debug('🎯 GenericPaymentModalHandler.handle appelé avec:', params);

            // Routage selon le mode
            switch (mode) {
                case PAYMENT_MODES.FROM_FACTURE:
                    await this.handleFromFacture(idFacture, anchorRef);
                    break;

                case PAYMENT_MODES.FROM_CLIENT:
                    await this.handleFromClient(idClient, nomClient, anchorRef);
                    break;

                case PAYMENT_MODES.STANDALONE:
                    await this.handleStandalone(anchorRef);
                    break;

                default:
                    throw new Error(`Mode inconnu: ${mode}`);
            }

        } catch (error) {
            this.log.error('❌ Erreur préparation paiement:', error);
            await this.showError(
                `Erreur lors de la préparation du paiement : ${error.message}`,
                null,
                anchorRef
            );
        }
    }

    /**
     * MODE: from-facture
     * Depuis la liste des factures - Client + Facture pré-remplis
     */
    async handleFromFacture(idFacture, anchorRef) {
        this.log.debug('📋 Mode FROM_FACTURE - idFacture:', idFacture);

        // Charger les données de la facture
        const factureData = await this.loadFactureData(idFacture, anchorRef);

        if (!factureData) {
            throw new Error('Erreur lors du chargement de la facture');
        }

        // Vérifications préalables
        if (await this.checkFactureState(factureData, anchorRef)) {
            return; // Facture déjà payée ou annulée
        }

        // Afficher le formulaire de paiement (mode facture)
        const paymentResult = await this.showPaymentModal({
            mode: PAYMENT_MODES.FROM_FACTURE,
            factureData,
            clientData: null,
            factures: null
        }, anchorRef);

        if (paymentResult.action === 'submit') {
            await this.processPayment({
                mode: PAYMENT_MODES.FROM_FACTURE,
                idFacture,
                idClient: factureData.idClient,
                formData: paymentResult.data,
                factureData,
                anchorRef
            });
        }
    }

    /**
     * MODE: from-client
     * Depuis la liste des clients - Client pré-rempli, choix de facture
     */
    async handleFromClient(idClient, nomClient, anchorRef) {
        this.log.debug('👤 Mode FROM_CLIENT - idClient:', idClient, 'nomClient:', nomClient);

        // Charger les factures du client
        const factures = await this.loadClientFactures(idClient, anchorRef);

        this.log.debug('📋 Factures chargées pour le client:', {
            count: factures?.length || 0,
            factures: factures
        });

        // Afficher le formulaire de paiement (mode client)
        const paymentResult = await this.showPaymentModal({
            mode: PAYMENT_MODES.FROM_CLIENT,
            factureData: null,
            clientData: { idClient, nomClient },
            factures
        }, anchorRef);

        if (paymentResult.action === 'submit') {
            await this.processPayment({
                mode: PAYMENT_MODES.FROM_CLIENT,
                idFacture: paymentResult.data.idFacture || null,
                idClient,
                formData: paymentResult.data,
                factureData: null,
                anchorRef
            });
        }
    }

    /**
     * MODE: standalone
     * Depuis le menu Paiements - Tout à sélectionner
     */
    async handleStandalone(anchorRef) {
        this.log.debug('🆕 Mode STANDALONE');
        // TODO: À implémenter si nécessaire
        throw new Error('Mode standalone non encore implémenté');
    }

    /**
     * Charger les données d'une facture
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
            async () => await this.factureActions.chargerFacture(idFacture)
        );
    }

    /**
     * Charger les factures payables d'un client
     * ✅ Définition : Facture payable = état "Envoyée" OU "Partiellement payée" ET montant_restant > 0
     */
    async loadClientFactures(idClient, anchorRef) {
        return await this.showLoading(
            {
                title: "Chargement...",
                content: ModalComponents.createLoadingContent("Chargement des factures du client..."),
                anchorRef,
                size: 'small',
                position: 'smart'
            },
            async () => {
                // Charger toutes les factures du client
                const toutesFactures = await this.factureActions.chargerFacturesClient(idClient);
                
                this.log.info(`📥 Client #${idClient} : ${toutesFactures?.length || 0} factures chargées`);
                
                if (!toutesFactures || toutesFactures.length === 0) {
                    this.log.warn('⚠️ Aucune facture trouvée pour ce client');
                    return [];
                }
                
                // ✅ FILTRER : Ne garder QUE les factures payables
                // Définition stricte : État = "Envoyée" OU "Partiellement payée" ET montant_restant > 0
                const facturesPayables = toutesFactures.filter(facture => {
                    const montantRestant = parseFloat(facture.montantRestant || 0);
                    const etat = (facture.etat || '').trim();
                    
                    // Normaliser les états possibles (avec/sans accents)
                    const estEnvoyee = etat.toLowerCase() === 'envoyée' || 
                                      etat.toLowerCase() === 'envoyee';
                    const estPartiellementPayee = etat.toLowerCase() === 'partiellement payée' || 
                                                  etat.toLowerCase() === 'partiellement payee';
                    const aUnRestant = montantRestant > 0;
                    
                    // Une facture est payable SI ET SEULEMENT SI :
                    // (État = Envoyée OU Partiellement payée) ET montant_restant > 0
                    const estPayable = (estEnvoyee || estPartiellementPayee) && aUnRestant;
                    
                    this.log.debug(`Facture ${facture.numeroFacture}: état="${etat}", restant=${montantRestant.toFixed(2)}, payable=${estPayable ? '✅' : '❌'}`);
                    
                    return estPayable;
                });
                
                this.log.info(`✅ ${facturesPayables.length} factures payables (Envoyée ou Partiellement payée) sur ${toutesFactures.length} total`);
                
                // Log des factures exclues pour debug
                const facturesExclues = toutesFactures.filter(f => !facturesPayables.includes(f));
                if (facturesExclues.length > 0) {
                    this.log.debug('🚫 Factures exclues (non payables):', 
                        facturesExclues.map(f => `${f.numeroFacture} (${f.etat}, restant: ${f.montantRestant})`).join(', ')
                    );
                }
                
                return facturesPayables;
            }
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
     * Modal principale de paiement
     */
    async showPaymentModal(context, anchorRef) {
        const { mode, factureData, clientData, factures } = context;

        this.log.debug('🎨 showPaymentModal - context:', context);

        // Titre selon le mode
        let title = "Enregistrer un paiement";
        if (mode === PAYMENT_MODES.FROM_FACTURE) {
            title = `Paiement - Facture ${factureData.numeroFacture}`;
        } else if (mode === PAYMENT_MODES.FROM_CLIENT) {
            title = `Nouveau paiement - ${clientData.nomClient}`;
        }

        return await this.showCustom({
            title,
            anchorRef,
            size: 'medium',
            position: 'smart',
            content: this.createPaymentModalContent(context),
            buttons: ModalComponents.createModalButtons({
                cancelText: "Annuler",
                submitText: "Enregistrer paiement",
                submitClass: "primary"
            }),
            onMount: (container) => this.setupPaymentModalEvents(container, context)
        });
    }

    /**
     * Contenu de la modal de paiement
     */
    createPaymentModalContent(context) {
        const { mode, factureData, clientData, factures } = context;

        let content = "";

        // === SECTION CLIENT (readonly pour tous les modes sauf standalone) ===
        if (mode === PAYMENT_MODES.FROM_FACTURE) {
            content += this.createClientReadonlySection(factureData.nomClient || `${factureData.client.prenom} ${factureData.client.nom}`);
        } else if (mode === PAYMENT_MODES.FROM_CLIENT) {
            content += this.createClientReadonlySection(clientData.nomClient);
        }

        // === SECTION FACTURE ===
        if (mode === PAYMENT_MODES.FROM_FACTURE) {
            // Détails de la facture (style unifié avec PaymentModalHandler)
            content += this.createFactureDetailsSection(factureData);
            
            // Afficher l'état des paiements si nécessaire
            if (factureData.nbPaiements > 0) {
                content += this.createPaymentStatusSection(factureData);
            }
        } else if (mode === PAYMENT_MODES.FROM_CLIENT) {
            // Dropdown de sélection de facture (ou paiement libre)
            content += this.createFactureDropdownSection(factures);
        }

        // === SECTION FORMULAIRE PAIEMENT (commune à tous les modes) ===
        content += this.createPaymentFormSection(
            mode === PAYMENT_MODES.FROM_FACTURE ? factureData.montantRestant : null
        );

        return content;
    }

    /**
     * Section Client (readonly) - Style unifié
     */
    createClientReadonlySection(nomClient) {
        return `
            <div class="input-group">
                <input 
                    type="text" 
                    id="clientNom"
                    value="${nomClient || ''}"
                    readonly
                    style="background-color: #f8f9fa; cursor: not-allowed;"
                />
                <label for="clientNom">Client</label>
            </div>
        `;
    }

    /**
     * Section Détails Facture - Style unifié avec PaymentModalHandler
     */
    createFactureDetailsSection(factureData) {
        const montantNet = parseFloat(factureData.montantTotal);
        const montantPaye = factureData.montantPayeTotal || 0;
        const montantRestant = factureData.montantRestant || 0;
        const nbPaiements = factureData.nbPaiements || 0;

        return `
            <div class="details-container">
                <div class="info-row">
                    <div class="info-label">N° Facture:</div>
                    <div class="info-value">${factureData.numeroFacture}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Client:</div>
                    <div class="info-value">${factureData.nomClient || `${factureData.client?.prenom} ${factureData.client?.nom}`}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Montant facture:</div>
                    <div class="info-value">${this.formatMontant(montantNet)} CHF</div>
                </div>
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
    }

    /**
     * Section État des paiements - Style unifié
     */
    createPaymentStatusSection(factureData) {
        const montantNet = parseFloat(factureData.montantTotal);
        const montantPaye = factureData.montantPayeTotal || 0;
        const montantRestant = factureData.montantRestant || 0;
        const nbPaiements = factureData.nbPaiements || 0;
        const pourcentagePaye = Math.round((montantPaye / montantNet) * 100);

        return `
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

    /**
     * Section Dropdown Facture - Pour mode FROM_CLIENT - Style unifié
     */
    createFactureDropdownSection(factures) {
        this.log.debug(`📝 createFactureDropdownSection - ${factures?.length || 0} factures à afficher`);

        let options = '<option value="">💰 Paiement libre (sans facture)</option>';
        let message = '';

        if (factures && factures.length > 0) {
            factures.forEach(facture => {
                const montantRestant = parseFloat(facture.montantRestant || 0);
                const montantInfo = `(${this.formatMontant(montantRestant)} CHF à payer)`;
                
                options += `<option value="${facture.id || facture.idFacture}" data-montant="${montantRestant.toFixed(2)}">
                    Facture ${facture.numeroFacture} ${montantInfo}
                </option>`;
            });
            
            message = `<small style="color: #6c757d; margin-top: -15px; margin-bottom: 20px; display: block; font-size: 12px;">
                ${factures.length} facture${factures.length > 1 ? 's' : ''} en attente de paiement
            </small>`;
        } else {
            message = `<small style="color: #ff9800; margin-top: -15px; margin-bottom: 20px; display: block; font-size: 12px;">
                ℹ️ Ce client n'a aucune facture en attente de paiement. Vous pouvez enregistrer un paiement libre.
            </small>`;
        }

        return `
            <div class="input-group">
                <select id="payment-facture-select">
                    ${options}
                </select>
                <label for="payment-facture-select">Facture (optionnel)</label>
            </div>
            ${message}
        `;
    }

    /**
     * Section Formulaire de paiement (commune) - Style unifié avec PaymentModalHandler
     */
    createPaymentFormSection(montantDefault = null) {
        const today = new Date().toISOString().split('T')[0];
        
        return `
            <form id="paymentForm">
                <div class="input-group date-input">
                    <input 
                        type="date" 
                        id="payment-date" 
                        name="datePaiement"
                        value="${today}"
                        max="${today}"
                        required
                        placeholder=" "
                    />
                    <label for="payment-date" class="required">Date de paiement</label>
                    <span class="calendar-icon">📅</span>
                </div>

                <div class="input-group">
                    <input 
                        type="number" 
                        id="payment-amount" 
                        name="montantPaye"
                        placeholder=" "
                        step="0.01"
                        min="0"
                        required
                        ${montantDefault ? `value="${montantDefault.toFixed(2)}"` : ''}
                    />
                    <label for="payment-amount" class="required">Montant payé (CHF)</label>
                </div>

                <div class="input-group">
                    <select id="payment-method" name="methodePaiement">
                        <option value="virement">Virement bancaire</option>
                        <option value="especes">Espèces</option>
                        <option value="cheque">Chèque</option>
                        <option value="carte">Carte bancaire</option>
                        <option value="twint">TWINT</option>
                        <option value="paypal">PayPal</option>
                        <option value="autre">Autre</option>
                    </select>
                    <label for="payment-method">Méthode de paiement</label>
                </div>

                <div class="input-group">
                    <textarea 
                        id="payment-comment" 
                        name="commentaire"
                        rows="3"
                        placeholder=" "
                    ></textarea>
                    <label for="payment-comment">Commentaire (optionnel)</label>
                </div>
            </form>
        `;
    }

    /**
     * Configuration des événements de la modal
     */
    setupPaymentModalEvents(container, context) {
        const { mode, factureData } = context;

        // Gestion du changement de facture (mode FROM_CLIENT uniquement)
        if (mode === PAYMENT_MODES.FROM_CLIENT) {
            const factureSelect = container.querySelector('#payment-facture-select');
            const amountInput = container.querySelector('#payment-amount');

            if (factureSelect && amountInput) {
                factureSelect.addEventListener('change', (e) => {
                    const selectedOption = e.target.options[e.target.selectedIndex];
                    const montant = selectedOption.dataset.montant;

                    if (montant && parseFloat(montant) > 0) {
                        amountInput.value = montant;
                    } else {
                        amountInput.value = '';
                    }
                });
            }
        }

        // Validation du montant
        const amountInput = container.querySelector('#payment-amount');
        if (amountInput) {
            amountInput.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                if (value < 0) {
                    e.target.value = 0;
                }
            });
        }

        // Stocker les données de contexte pour la soumission
        container.dataset.paymentContext = JSON.stringify(context);
    }

    /**
     * Traiter le paiement
     */
    async processPayment(params) {
        const { mode, idFacture, idClient, formData, factureData, anchorRef } = params;

        this.log.debug('💾 processPayment appelé avec:', params);

        // Récupérer les valeurs du formulaire
        const montantPaye = parseFloat(formData.montantPaye);
        const datePaiement = formData.datePaiement;
        const methodePaiement = formData.methodePaiement;
        const commentaire = formData.commentaire;

        // Validation
        if (!montantPaye || montantPaye <= 0) {
            await this.showValidationError("Le montant doit être supérieur à 0", factureData, anchorRef);
            return;
        }

        if (!datePaiement) {
            await this.showValidationError("La date de paiement est requise", factureData, anchorRef);
            return;
        }

        if (!methodePaiement) {
            await this.showValidationError("La méthode de paiement est requise", factureData, anchorRef);
            return;
        }

        // Validation spécifique pour mode FROM_FACTURE
        if (mode === PAYMENT_MODES.FROM_FACTURE && factureData) {
            const montantRestant = parseFloat(factureData.montantRestant || 0);
            if (montantPaye > montantRestant) {
                await this.showValidationError(
                    `Le montant saisi (${this.formatMontant(montantPaye)} CHF) dépasse le montant restant à payer (${this.formatMontant(montantRestant)} CHF)`,
                    factureData,
                    anchorRef
                );
                return;
            }
        }

        // Enregistrer le paiement
        await this.savePayment({
            idClient,
            idFacture,
            montantPaye,
            datePaiement,
            methodePaiement,
            commentaire,
            factureData,
            anchorRef
        });
    }

    /**
     * Enregistrer le paiement
     */
    async savePayment(params) {
        const { idClient, idFacture, montantPaye, datePaiement, methodePaiement, commentaire, factureData, anchorRef } = params;

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
                    // ✅ Appel direct à paiementActions (qui gère déjà executeApi en interne)
                    return await this.paiementActions.creerPaiement({
                        idClient,
                        idFacture: idFacture || null,
                        datePaiement,
                        montantPaye,
                        methodePaiement,
                        commentaire
                    });
                }
            );

            if (paiementResult.success) {
                // Invalider le cache
                this.factureActions.clearCache();

                // Récupérer les données fraîches si facture
                let factureDataUpdated = factureData;
                if (idFacture) {
                    factureDataUpdated = await this.factureActions.chargerFacture(idFacture);
                }

                await this.showPaymentSuccess({
                    montantPaye,
                    datePaiement,
                    methodePaiement,
                    commentaire,
                    numeroPaiement: paiementResult.numeroPaiement,
                    factureData: factureDataUpdated
                }, anchorRef);

                this.onSetNotification('Paiement enregistré avec succès', 'success');
                
                // Recharger les factures
                if (this.chargerFactures) {
                    this.chargerFactures();
                }
            } else {
                throw new Error(paiementResult.message || 'Erreur lors de l\'enregistrement du paiement');
            }

        } catch (paymentError) {
            this.log.error('❌ Erreur enregistrement paiement:', paymentError);
            await this.showError(`Erreur lors de l'enregistrement : ${paymentError.message}`, factureData, anchorRef);
        }
    }

    /**
     * Modal de succès de paiement
     */
    async showPaymentSuccess(data, anchorRef) {
        const { montantPaye, datePaiement, methodePaiement, commentaire, numeroPaiement, factureData } = data;

        const content = `
            <div class="modal-success">
                💰 Le paiement de ${this.formatMontant(montantPaye)} CHF a été enregistré avec succès.
                <br><br>
                <strong>📅 Date :</strong> ${this.formatDate(datePaiement)}<br>
                <strong>💳 Méthode :</strong> ${methodePaiement}<br>
                ${commentaire ? `<strong>💬 Commentaire :</strong> ${commentaire}<br>` : ''}
                ${numeroPaiement ? `<strong>📋 N° Paiement :</strong> #${numeroPaiement}<br>` : ''}
                ${factureData ? `
                    <br>
                    <div style="background: #f8f9fa; padding: 10px; border-radius: 5px; margin-top: 10px;">
                        <strong>État de la facture :</strong> ${factureData.etat || 'En cours de mise à jour'}
                    </div>
                ` : ''}
            </div>
        `;

        const config = ModalComponents.createSimpleModalConfig(
            "Paiement enregistré !",
            {},
            {
                intro: "",
                content,
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
     * Modal facture déjà payée
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
     * Modal facture annulée
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
     * Modal d'erreur de validation
     */
    async showValidationError(message, factureData, anchorRef) {
        const config = ModalComponents.createSimpleModalConfig(
            "Erreur de validation",
            factureData || {},
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

export default GenericPaymentModalHandler;