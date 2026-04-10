// src/components/shared/modals/handlers/GenericPaymentModalHandler.js
//
// Handler GÉNÉRIQUE de collecte de paiement.
// Utilise les constantes de paiementConstants pour tous les textes et valeurs.
//
// Responsabilités :
//   - Afficher le formulaire de saisie (date, montant, méthode, commentaire)
//   - Validation de FORME uniquement (montant > 0, date présente, méthode présente)
//   - Enregistrer le paiement via paiementActions
//   - Feedback UI (succès, erreur)
//
// NON responsable de :
//   - Vérifier l'état de la facture (payée, annulée) → appelant
//   - Vérifier montantPaye vs montantRestant → appelant
//   - Charger les données de facture ou client → appelant

import React from 'react';
import ModalComponents, { createDateInputWithModal, createCalendarIcon } from '../../../shared/ModalComponents';
import { createLogger } from '../../../../utils/createLogger';
import {
    PAYMENT_MODES,
    METHODES_PAIEMENT,
    METHODES_PAIEMENT_LABELS,
    LABELS,
    BUTTON_TEXTS,
    FORM_TITLES,
    LOADING_MESSAGES,
    NOTIFICATIONS,
    HELP_TEXTS,
    VALIDATION_MESSAGES,
} from '../../../../constants/paiementConstants';
import { showDatePicker } from './DatePickerModalHandler';
import { formatDate } from '../../../../utils/formatters';
import { toIsoString, fromDisplayString, fromIsoString } from '../../../../utils/dateHelpers';

export class GenericPaymentModalHandler {
    constructor(dependencies) {
        this.paiementActions   = dependencies.paiementActions;
        this.factureActions    = dependencies.factureActions;
        this.clientActions     = dependencies.clientActions;
        this.showCustom        = dependencies.showCustom;
        this.showLoading       = dependencies.showLoading;
        this.formatMontant     = dependencies.formatMontant;
        this.formatDate        = dependencies.formatDate;
        this.onSetNotification = dependencies.onSetNotification;
        this.chargerFactures   = dependencies.chargerFactures;
        this.log = createLogger('GenericPaymentModalHandler');
    }

    // =========================================================================
    // API PUBLIQUE
    // =========================================================================

    /**
     * Affiche le formulaire de saisie et retourne les données brutes.
     * La validation métier est faite par l'appelant.
     *
     * @param {Object} context  { mode, factureData, clientData, factures, montantDefaut }
     * @param {Object} anchorRef
     * @returns {{ action: 'submit'|'cancel', data: Object }}
     */
    async showPaymentForm(context, anchorRef) {
        const { mode, factureData, clientData, montantDefaut } = context;

        let title = FORM_TITLES.MODAL_ENREGISTRER;
        if (mode === PAYMENT_MODES.FROM_FACTURE && factureData) {
            title = `${FORM_TITLES.MODAL_ENREGISTRER} — Facture ${factureData.numeroFacture}`;
        } else if (mode === PAYMENT_MODES.FROM_CLIENT && clientData) {
            title = `${FORM_TITLES.MODAL_ENREGISTRER} — ${clientData.nomClient}`;
        }

        return await this.showCustom({
            title,
            anchorRef,
            size:     'medium',
            position: 'smart',
            content:  this._buildFormContent(context),
            buttons:  ModalComponents.createModalButtons({
                cancelText:  BUTTON_TEXTS.CANCEL,
                submitText:  BUTTON_TEXTS.MODAL_SUBMIT,
                submitClass: 'primary',
            }),
            onMount: (container) => this._setupFormEvents(container, context),
        });
    }

    /**
     * Enregistre le paiement via l'API et affiche le feedback.
     * @param {{ idClient, idFacture, montantPaye, datePaiement, methodePaiement,
     *           commentaire, anchorRef, factureData }} params
     */
    async savePayment(params) {
        const {
            idClient, idFacture, montantPaye, datePaiement,
            methodePaiement, commentaire, anchorRef, factureData,
        } = params;

        try {
            const result = await this.showLoading(
                {
                    title:    FORM_TITLES.MODAL_ENREGISTREMENT,
                    content:  ModalComponents.createLoadingContent(LOADING_MESSAGES.SAVING),
                    anchorRef,
                    size:     'small',
                    position: 'smart',
                },
                async () => await this.paiementActions.creerPaiement({
                    idClient,
                    idFacture:       idFacture || null,
                    datePaiement,
                    montantPaye,
                    methodePaiement,
                    commentaire,
                })
            );

            if (!result.success) {
                throw new Error(result.message || NOTIFICATIONS.ERROR.CREATE);
            }

            // Données fraîches après enregistrement
            let factureDataFraiche = factureData || null;
            if (idFacture && this.factureActions) {
                this.factureActions.clearCache?.();
                try {
                    factureDataFraiche = await this.factureActions.chargerFacture(idFacture);
                } catch { /* garder données initiales */ }
            }

            await this._showSuccess({
                montantPaye, datePaiement, methodePaiement, commentaire,
                numeroPaiement: result.numeroPaiement,
                factureData:    factureDataFraiche,
                anchorRef,
            });

            this.onSetNotification(NOTIFICATIONS.SUCCESS.ENREGISTRE, 'success');
            this.chargerFactures?.();

        } catch (err) {
            this.log.error('❌ Erreur savePayment:', err);
            await this.showInfo(
                `${NOTIFICATIONS.ERROR.CREATE} : ${err.message}`,
                FORM_TITLES.MODAL_ERREUR,
                anchorRef
            );
        }
    }

    /**
     * Affiche une modale d'information / erreur générique.
     */
    async showInfo(message, title = FORM_TITLES.MODAL_ERREUR, anchorRef = null, type = 'error') {
        const config = ModalComponents.createSimpleModalConfig(
            title, {},
            {
                intro: '',
                warningMessage: message,
                warningType:    type,
                buttons: ModalComponents.createModalButtons({
                    submitText: BUTTON_TEXTS.MODAL_OK,
                    showCancel: false,
                }),
            }
        );
        await this.showCustom({ ...config, anchorRef, position: 'smart' });
    }

    /**
     * Normalise les données du formulaire avant validation/sauvegarde.
     * Convertit datePaiement DD.MM.YYYY → ISO YYYY-MM-DD.
     * @param {Object} data  Données brutes de FormData
     * @returns {Object}     Données normalisées
     */
    normalizeFormData(data) {
        const normalized = { ...data };
        if (normalized.datePaiement) {
            const d = fromDisplayString(normalized.datePaiement)
                   || fromIsoString(normalized.datePaiement);
            if (d) normalized.datePaiement = toIsoString(d);
        }
        return normalized;
    }

    /**
     * Validation de forme (indépendant du domaine métier).
     * @returns {string|null} Message d'erreur ou null si valide
     */
    validateForme(data) {
        const montant = parseFloat(data.montantPaye);
        if (!montant || montant <= 0) return VALIDATION_MESSAGES.MONTANT_REQUIRED;
        if (!data.datePaiement)       return VALIDATION_MESSAGES.DATE_REQUIRED;
        if (!data.methodePaiement)    return VALIDATION_MESSAGES.METHODE_REQUIRED;
        return null;
    }

    /**
     * Charge les factures payables d'un client.
     */
    async loadClientFactures(idClient, anchorRef) {
        return await this.showLoading(
            {
                title:    FORM_TITLES.MODAL_CHARGEMENT,
                content:  ModalComponents.createLoadingContent(LOADING_MESSAGES.LOADING_FACTURES),
                anchorRef,
                size:     'small',
                position: 'smart',
            },
            async () => {
                const toutes = await this.factureActions.chargerFacturesClient(idClient);
                if (!toutes?.length) return [];
                return toutes.filter(f => {
                    const restant = parseFloat(f.montantRestant || 0);
                    const etat    = (f.etat || '').toLowerCase().trim();
                    return (etat === 'envoyée' || etat === 'envoyee' ||
                            etat === 'partiellement payée' || etat === 'partiellement payee')
                           && restant > 0;
                });
            }
        );
    }

    createAnchorRef(event) {
        if (!event) return null;
        const ref = React.createRef();
        if (event.currentTarget) ref.current = event.currentTarget;
        return ref;
    }

    // =========================================================================
    // CONSTRUCTION DU FORMULAIRE
    // =========================================================================

    _buildFormContent(context) {
        const { mode, factureData, clientData, factures, montantDefaut } = context;
        let content = '';

        if (mode === PAYMENT_MODES.FROM_FACTURE && factureData) {
            const nom = factureData.nomClient
                || `${factureData.client?.prenom || ''} ${factureData.client?.nom || ''}`.trim();
            content += this._sectionClientReadonly(nom);
            content += this._sectionFactureDetails(factureData);
        } else if (mode === PAYMENT_MODES.FROM_CLIENT && clientData) {
            content += this._sectionClientReadonly(clientData.nomClient);
            content += this._sectionFactureDropdown(factures);
        }

        content += this._sectionFormulaire(montantDefaut);
        return content;
    }

    _sectionClientReadonly(nomClient) {
        return `
            <div class="input-group">
                <input type="text" id="clientNom" value="${nomClient || ''}" readonly
                    style="background-color:var(--color-secondary,#f0f0f0);cursor:not-allowed;" />
                <label for="clientNom">Client</label>
            </div>`;
    }

    _sectionFactureDetails(factureData) {
        const montantNet  = parseFloat(factureData.montantTotal || 0);
        const dejaPaye    = parseFloat(factureData.montantPayeTotal || 0);
        const restant     = factureData.montantRestant != null
            ? parseFloat(factureData.montantRestant)
            : montantNet - dejaPaye;
        const nbPaiements = factureData.nbPaiements || 0;

        return `
            <div class="details-container">
                <div class="info-row">
                    <div class="info-label">${LABELS.NUMERO_FACTURE}</div>
                    <div class="info-value">${factureData.numeroFacture}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">${LABELS.MONTANT_FACTURE}</div>
                    <div class="info-value">${this.formatMontant(montantNet)} CHF</div>
                </div>
                ${nbPaiements > 0 ? `
                <div class="info-row">
                    <div class="info-label">${LABELS.DEJA_PAYE}</div>
                    <div class="info-value" style="color:var(--color-success-text,#155724);">${this.formatMontant(dejaPaye)} CHF</div>
                </div>
                <div class="info-row">
                    <div class="info-label">${LABELS.MONTANT_RESTANT}</div>
                    <div class="info-value" style="font-weight:bold;color:${restant > 0 ? 'var(--color-error-text,#721c24)' : 'var(--color-success-text,#155724)'};">
                        ${this.formatMontant(restant)} CHF
                    </div>
                </div>` : ''}
            </div>`;
    }

    _sectionFactureDropdown(factures) {
        let options = `<option value="">${HELP_TEXTS.PAIEMENT_LIBRE}</option>`;
        factures?.forEach(f => {
            const restant = parseFloat(f.montantRestant || 0);
            options += `<option value="${f.id || f.idFacture}" data-montant="${restant.toFixed(2)}">
                Facture ${f.numeroFacture} (${this.formatMontant(restant)} CHF à payer)
            </option>`;
        });
        const msg = (!factures?.length)
            ? `<small class="field-description" style="color:var(--color-warning-text,#856404);">${HELP_TEXTS.AUCUNE_FACTURE}</small>`
            : `<small class="field-description">${factures.length} facture(s) en attente</small>`;
        return `
            <div class="input-group">
                <select id="payment-facture-select">${options}</select>
                <label for="payment-facture-select">${LABELS.FACTURE} (optionnel)</label>
            </div>${msg}`;
    }

    _sectionFormulaire(montantDefaut = null) {
        const today = toIsoString(new Date());

        return `
            <form id="paymentForm">
                ${createDateInputWithModal('datePaiement', LABELS.DATE_PAIEMENT, today, true, {
                    readOnly: false,
                    helpText: null,
                })}

                <div class="input-group">
                    <input type="number" id="payment-amount" name="montantPaye"
                        placeholder=" " step="0.01" min="0" required
                        ${montantDefaut ? `value="${parseFloat(montantDefaut).toFixed(2)}"` : ''} />
                    <label for="payment-amount" class="required">${LABELS.MONTANT_PAYE}</label>
                </div>

                <div class="input-group">
                    <select id="payment-method" name="methodePaiement">
                        ${Object.entries(METHODES_PAIEMENT_LABELS)
                            .map(([value, label]) => `<option value="${value}">${label}</option>`)
                            .join('')}
                    </select>
                    <label for="payment-method">${LABELS.METHODE_PAIEMENT}</label>
                </div>

                <div class="input-group">
                    <textarea id="payment-comment" name="commentaire"
                        rows="3" placeholder=" "></textarea>
                    <label for="payment-comment">${LABELS.COMMENTAIRE}</label>
                </div>
            </form>`;
    }

    // =========================================================================
    // ÉVÉNEMENTS DU FORMULAIRE
    // =========================================================================

    _setupFormEvents(container, context) {
        const { mode } = context;


        // ── Icône calendrier → showDatePicker ─────────────────────────────────
        // createDateInputWithModal génère input#datePaiement avec data-iso
        // et .calendar-icon[data-date-trigger="datePaiement"]
        const calIcon      = container.querySelector('[data-date-trigger="datePaiement"]');
        const displayInput = container.querySelector('#datePaiement');

        if (calIcon && displayInput) {
            calIcon.addEventListener('click', async () => {
                const currentIso = displayInput.dataset.iso || toIsoString(new Date());
                const result = await showDatePicker({
                    initialDates: [currentIso],
                    multiSelect:  false,
                    allowFuture:  false,
                    title:        LABELS.CALENDRIER_TITRE,
                    anchorRef:    { current: calIcon },
                });
                if (result.action === 'confirm' && result.dates.length > 0) {
                    displayInput.value       = formatDate(result.dates[0], 'date');
                    displayInput.dataset.iso  = result.dates[0];
                    displayInput.closest('.input-group')?.classList.add('has-value');
                }
            });

            // Saisie manuelle DD.MM.YYYY → mise à jour data-iso
            displayInput.addEventListener('blur', () => {
                const val   = displayInput.value.trim();
                const match = val.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
                if (match) {
                    const iso = `${match[3]}-${match[2].padStart(2,'0')}-${match[1].padStart(2,'0')}`;
                    if (!isNaN(new Date(iso).getTime())) {
                        displayInput.dataset.iso = iso;
                        displayInput.value       = formatDate(iso, 'date');
                    }
                }
            });

            displayInput.addEventListener('input', () => {
                displayInput.closest('.input-group')
                    ?.classList.toggle('has-value', !!displayInput.value);
            });
        }


        // ── Dropdown facture (mode FROM_CLIENT) ───────────────────────────────
        if (mode === PAYMENT_MODES.FROM_CLIENT) {
            const sel    = container.querySelector('#payment-facture-select');
            const amount = container.querySelector('#payment-amount');
            sel?.addEventListener('change', (e) => {
                const montant = e.target.options[e.target.selectedIndex].dataset.montant;
                if (amount && montant && parseFloat(montant) > 0) amount.value = montant;
            });
        }

        // ── Validation montant >= 0 ───────────────────────────────────────────
        container.querySelector('#payment-amount')
            ?.addEventListener('input', (e) => { if (parseFloat(e.target.value) < 0) e.target.value = 0; });
    }

    // =========================================================================
    // FEEDBACK UI
    // =========================================================================

    async _showSuccess({ montantPaye, datePaiement, methodePaiement, commentaire,
                         numeroPaiement, factureData, anchorRef }) {
        const successText = HELP_TEXTS.SUCCESS_INTRO
            .replace('{montant}', this.formatMontant(montantPaye));

        const content = `
            <div class="modal-success">
                💰 ${successText}
                <br><br>
                <strong>${LABELS.DATE_PAIEMENT} :</strong> ${this.formatDate(datePaiement)}<br>
                <strong>💳 ${LABELS.METHODE_PAIEMENT} :</strong> ${METHODES_PAIEMENT_LABELS[methodePaiement] || methodePaiement}<br>
                ${commentaire    ? `<strong>💬 ${LABELS.COMMENTAIRE} :</strong> ${commentaire}<br>` : ''}
                ${numeroPaiement ? `<strong>📋 N° Paiement :</strong> #${numeroPaiement}<br>` : ''}
            </div>`;

        const config = ModalComponents.createSimpleModalConfig(
            FORM_TITLES.MODAL_SUCCESS,
            factureData || null,
            {
                intro:         '',
                content,
                formatMontant: this.formatMontant,
                formatDate:    this.formatDate,
                buttons:       ModalComponents.createModalButtons({
                    submitText: BUTTON_TEXTS.MODAL_OK,
                    showCancel: false,
                }),
            }
        );
        await this.showCustom({ ...config, anchorRef, position: 'smart' });
    }
}

export default GenericPaymentModalHandler;