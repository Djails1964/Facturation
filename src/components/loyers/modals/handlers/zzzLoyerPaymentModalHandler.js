// src/components/loyers/modals/handlers/LoyerPaymentModalHandler.js
//
// Handler pour la saisie des paiements de loyer (un paiement = un mois).
// Chaque validation crée une vraie ligne dans la table `paiement`
// (avec idLoyer + idLoyerDetail) et met à jour loyer_detail.
//
// Styles : LoyerPaymentModal.css  — aucun style inline dans ce fichier.

import React from 'react';
import ModalComponents from '../../../shared/ModalComponents';
import { createLogger } from '../../../../utils/createLogger';
import { showCustom, showLoading } from '../../../../utils/modalSystem';
import { formatDate } from '../../../../utils/formatters';
import { getTodayIso } from '../../../../utils/dateHelpers';
import { METHODES_PAIEMENT, METHODES_PAIEMENT_LABELS } from '../../../../constants/paiementConstants';


const log = createLogger('LoyerPaymentModalHandler');

// ─── Constantes ───────────────────────────────────────────────────────────────

// Options select générées depuis paiementConstants (source de vérité unique)
const METHODE_OPTIONS = Object.values(METHODES_PAIEMENT).map(value => ({
    value,
    label: METHODES_PAIEMENT_LABELS[value] || value,
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(montant) {
    if (montant === null || montant === undefined || montant === '') return '—';
    return parseFloat(montant).toLocaleString('fr-CH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function fmtDate(dateStr) {
    if (!dateStr) return '—';
    return formatDate(dateStr, 'date') || dateStr;
}

// Aujourd'hui au format YYYY-MM-DD via datehelpers.getTodayIso — format attendu par les inputs date et l'API
function todayISO() {
    return getTodayIso();
}

// ─── HTML : en-tête récapitulatif du loyer ────────────────────────────────────

function buildHeaderHTML(loyer) {
    const details = loyer.montantsMensuels || [];
    const client  = loyer.client
        ? `${loyer.client.prenom || ''} ${loyer.client.nom || ''}`.trim()
        : loyer.nomClient || loyer.nom_client || '—';

    const periode = [loyer.periodeDebut || loyer.periode_debut,
                     loyer.periodeFin   || loyer.periode_fin]
        .filter(Boolean).map(fmtDate).join(' → ');

    const totalDu          = parseFloat(loyer.loyerMontantTotal || 0);
    const montantPayeTotal = parseFloat(loyer.montantPayeTotal || 0)
        || details.filter(d => d.estPaye)
                  .reduce((s, d) => s + parseFloat(d.loyerDetailMontant || 0), 0);
    const solde   = totalDu - montantPayeTotal;
    const nbPayes = details.filter(d => d.estPaye).length;

    const isSolde    = solde <= 0.005;
    const statutMod  = isSolde ? 'lpm-header__value--solde' : 'lpm-header__value--encours';
    const soldeMod   = isSolde ? 'lpm-montant--ok'          : 'lpm-montant--restant';

    return `
    <div class="lpm-header">
      <div class="lpm-header__field">
        <span class="lpm-header__label">N° Loyer</span>
        <span class="lpm-header__value">${loyer.numeroLoyer || loyer.numero_loyer || '—'}</span>
      </div>
      <div class="lpm-header__field">
        <span class="lpm-header__label">Client</span>
        <span class="lpm-header__value">${client}</span>
      </div>
      <div class="lpm-header__field">
        <span class="lpm-header__label">Statut</span>
        <span class="lpm-header__value ${statutMod}">${isSolde ? 'Soldé' : 'En cours'}</span>
      </div>
      <div class="lpm-header__field">
        <span class="lpm-header__label">Période</span>
        <span class="lpm-header__value--normal">${periode}</span>
      </div>
      <div class="lpm-header__field">
        <span class="lpm-header__label">Total dû</span>
        <span class="lpm-header__value--normal">${fmt(totalDu)} CHF</span>
      </div>
      <div class="lpm-header__field">
        <span class="lpm-header__label">Payé / Solde restant</span>
        <span class="lpm-header__value--normal">
          <span class="lpm-montant--ok">${nbPayes}/${details.length} mois · ${fmt(montantPayeTotal)} CHF</span>
          &nbsp;·&nbsp;
          <span class="${soldeMod}">Solde : ${fmt(solde)} CHF</span>
        </span>
      </div>
    </div>`;
}

// ─── HTML : tableau des mois ──────────────────────────────────────────────────

function buildTableHTML(details) {
    if (!details || details.length === 0) {
        return `<p class="lpm-td--muted" style="text-align:center;padding:20px 0;">Aucun détail mensuel.</p>`;
    }

    const methodeOptions = METHODE_OPTIONS
        .map(m => `<option value="${m.value}">${m.label}</option>`)
        .join('');

    const rows = details.map(d => {
        log.debug('🔍 Construction ligne pour détail:', d);
        const idLoyerDetail  = d.idLoyerDetail;
        const estPaye        = !!(d.estPaye);
        const moisLabel      = `${d.loyerMois} ${d.loyerAnnee}`;
        const montantDu      = parseFloat(d.loyerDetailMontant || 0);
        // montantPaye : pour les lignes payées, on affiche le montant dû (soldé)
        // Une future évolution pourra stocker le montant réellement payé
        const montantPaye    = parseFloat(d.montantPaye || d.loyerDetailMontant || 0);

        if (estPaye) {
            // 7 colonnes : Mois | Montant dû | Statut | Date paiement | Montant payé | Méthode | Action
            return `
            <tr data-detail-id="${idLoyerDetail}" class="lpm-row--paye">
              <td class="lpm-td">${moisLabel}</td>
              <td class="lpm-td lpm-td--right">${fmt(montantDu)} CHF</td>
              <td class="lpm-td lpm-td--center">
                <span class="lpm-badge lpm-badge--paye">✓ Payé</span>
              </td>
              <td class="lpm-td lpm-td--center lpm-td--muted">${fmtDate(d.datePaiement)}</td>
              <td class="lpm-td lpm-td--right lpm-montant--ok">${fmt(montantPaye)} CHF</td>
              <td class="lpm-td lpm-td--muted">—</td>
              <td class="lpm-td lpm-td--center">—</td>
            </tr>`;
        }

        return `
        <tr data-detail-id="${idLoyerDetail}" class="lpm-row--impaye">
          <td class="lpm-td">${moisLabel}</td>
          <td class="lpm-td lpm-td--right lpm-td--muted">${fmt(montantDu)} CHF</td>
          <td class="lpm-td lpm-td--center">
            <span class="lpm-badge lpm-badge--attente">⏳ En attente</span>
          </td>
          <td class="lpm-td lpm-td--date">
            <input type="date"
              class="lpm-input lpm-date"
              data-detail-id="${idLoyerDetail}"
              value="${todayISO()}"
              max="${todayISO()}" />
          </td>
          <td class="lpm-td lpm-td--montant">
            <input type="number"
              class="lpm-input lpm-montant"
              data-detail-id="${idLoyerDetail}"
              data-montant-du="${montantDu}"
              value="${montantDu.toFixed(2)}"
              min="0.01" step="0.01" />
          </td>
          <td class="lpm-td lpm-td--methode">
            <select class="lpm-input lpm-methode" data-detail-id="${idLoyerDetail}">
              ${methodeOptions}
            </select>
          </td>
          <td class="lpm-td lpm-td--action">
            <button
              class="lpm-btn-valider"
              data-detail-id="${idLoyerDetail}"
              data-mois="${moisLabel}"
              type="button">
              ✓ Valider
            </button>
          </td>
        </tr>`;
    }).join('');

    return `
    <div class="lpm-table-wrapper">
      <table class="lpm-table">
        <thead>
          <tr>
            <th>Mois</th>
            <th class="lpm-th--right">Montant dû</th>
            <th class="lpm-th--center">Statut</th>
            <th>Date paiement</th>
            <th>Montant payé</th>
            <th>Méthode</th>
            <th class="lpm-th--center">Action</th>
          </tr>
        </thead>
        <tbody id="lpm-tbody">${rows}</tbody>
      </table>
    </div>
    <div id="lpm-feedback" class="lpm-feedback"></div>`;
}

function buildModalContent(loyer) {
    return `
    <div class="loyer-payment-modal">
      ${buildHeaderHTML(loyer)}
      <div class="content-section-title compact">
        <h3>Détail des paiements mensuels</h3>
      </div>
      ${buildTableHTML(loyer.montantsMensuels || [])}
    </div>`;
}

// ─── Classe handler ───────────────────────────────────────────────────────────

export class LoyerPaymentModalHandler {

    constructor(dependencies) {
        this.loyerActions      = dependencies.loyerActions;
        this.paiementActions   = dependencies.paiementActions; // ✅ Création paiement (domaine Paiement)
        this.onSetNotification = dependencies.onSetNotification;
        this.chargerLoyers     = dependencies.chargerLoyers || (() => {});
        this.log = log;
    }

    // ── Point d'entrée ────────────────────────────────────────────────────────
    async handle(idLoyer, event) {
        if (event) event.stopPropagation();
        const anchorRef = this._anchorRef(event);

        try {
            const loyerData = await showLoading(
                {
                    title:    'Chargement...',
                    content:  ModalComponents.createLoadingContent('Chargement du loyer...'),
                    anchorRef, size: 'small', position: 'smart',
                },
                () => this.loyerActions.getLoyer(idLoyer)
            );

            if (!loyerData) throw new Error('Loyer introuvable');

            const details   = loyerData.montantsMensuels || [];
            const tousPayes = details.length > 0 && details.every(d => d.estPaye);

            if (tousPayes) {
                await this._showDejaPayeModal(loyerData, anchorRef);
                return;
            }

            await this._showPaiementModal(loyerData, idLoyer, anchorRef);

        } catch (err) {
            this.log.error('❌ Erreur handle:', err);
            this.onSetNotification?.('Erreur lors du chargement : ' + err.message, 'error');
        }
    }

    // ── Modal "Loyer déjà soldé" ──────────────────────────────────────────────
    async _showDejaPayeModal(loyer, anchorRef) {
        const client = loyer.client
            ? `${loyer.client.prenom || ''} ${loyer.client.nom || ''}`.trim()
            : loyer.nomClient || '';

        await showCustom({
            title:   'Loyer déjà soldé',
            content: `
              <div class="lpm-deja-paye">
                <div class="lpm-deja-paye__icon">✅</div>
                <p class="lpm-deja-paye__titre">Ce loyer est entièrement soldé.</p>
                <p class="lpm-deja-paye__info">
                  ${loyer.numeroLoyer || ''} · ${client}
                </p>
              </div>`,
            anchorRef, size: 'small', position: 'smart',
            buttons: [{ text: 'Fermer', action: 'close', className: 'primary' }],
        });
    }

    // ── Modal principale ──────────────────────────────────────────────────────
    async _showPaiementModal(loyerData, idLoyer, anchorRef) {
        const idClient = loyerData.idClient;

        await showCustom({
            title:               'Saisir les paiements',
            content:             buildModalContent(loyerData),
            anchorRef,
            size:                'large',
            position:            'smart',
            closeOnEscape:       true,
            closeOnOverlayClick: false,
            buttons: [{ text: 'Fermer', action: 'close', className: 'secondary' }],
            onMount: (container) => this._attachListeners(container, loyerData, idLoyer),
        });

        this.chargerLoyers();
    }

    // ── Listeners inline ──────────────────────────────────────────────────────
    _attachListeners(container, loyerData, idLoyer) {
        const tbody    = container.querySelector('#lpm-tbody');
        const feedback = container.querySelector('#lpm-feedback');
        if (!tbody) return;

        const idClient = loyerData.idClient;

        tbody.addEventListener('click', async (e) => {
            // ── Clic sur bouton Valider ────────────────────────────────────────
            const btn = e.target.closest('.lpm-btn-valider');
            if (!btn) return;

            const idLoyerDetail = btn.dataset.detailId;
            const moisLabel     = btn.dataset.mois;
            const row           = btn.closest('tr');
            const dateInput     = row.querySelector('.lpm-date');
            const montantInput  = row.querySelector('.lpm-montant');
            const methodeSelect = row.querySelector('.lpm-methode');

            const datePaiement    = dateInput?.value?.trim();  // YYYY-MM-DD natif
            const montantPaye     = parseFloat(montantInput?.value || '0');
            const methodePaiement = methodeSelect?.value || 'virement';
            const montantDu       = parseFloat(montantInput?.dataset?.montantDu || '0');

            if (!datePaiement) {
                this._feedback(feedback, '⚠️ Veuillez saisir une date de paiement.', 'warning');
                dateInput?.focus();
                return;
            }
            if (isNaN(montantPaye) || montantPaye <= 0) {
                this._feedback(feedback, '⚠️ Le montant doit être supérieur à 0.', 'warning');
                montantInput?.focus();
                return;
            }

            btn.disabled    = true;
            btn.textContent = '...';

            try {
                this._feedback(feedback, `⏳ Enregistrement pour ${moisLabel}...`, 'info');

                const result = await this.paiementActions.creerPaiement({
                    idClient:        idClient,
                    id_loyer:         idLoyer,
                    id_loyer_detail:  idLoyerDetail,
                    date_paiement:    datePaiement,
                    montant_paye:     montantPaye,
                    methode_paiement: methodePaiement,
                });

                const estTotalementPaye = montantPaye >= (montantDu - 0.005);

                if (estTotalementPaye) {
                    this._markRowPaid(row, datePaiement, montantPaye);
                } else {
                    this._markRowPartial(row, montantPaye, montantDu);
                }

                const labelPartiel = estTotalementPaye ? '' : ' (paiement partiel)';
                this._feedback(
                    feedback,
                    `✅ Paiement de ${fmt(montantPaye)} CHF enregistré pour ${moisLabel}${labelPartiel}.`,
                    'success'
                );

                this._refreshHeader(container, idLoyer);
                this.onSetNotification?.(
                    `Paiement ${moisLabel} enregistré (${fmt(montantPaye)} CHF)`,
                    'success'
                );

            } catch (err) {
                this.log.error('❌ Erreur enregistrement:', err);
                btn.disabled    = false;
                btn.textContent = '✓ Valider';
                this._feedback(feedback, `❌ Erreur : ${err.message}`, 'error');
            }
        });
    }

    // ── Mise à jour des lignes ────────────────────────────────────────────────

    _markRowPaid(row, datePaiement, montantPaye = null) {
        row.className = 'lpm-row--paye';
        if (row.cells[2]) row.cells[2].innerHTML =
            `<span class="lpm-badge lpm-badge--paye">✓ Payé</span>`;
        if (row.cells[3]) row.cells[3].innerHTML =
            `<span class="lpm-td--muted">${fmtDate(datePaiement)}</span>`;
        if (row.cells[4]) row.cells[4].innerHTML = montantPaye !== null
            ? `<span class="lpm-montant--ok">${fmt(montantPaye)} CHF</span>`
            : '';
        if (row.cells[5]) row.cells[5].innerHTML = '—';
        if (row.cells[6]) row.cells[6].innerHTML = '—';
    }

    _markRowPartial(row, montantPaye, montantDu) {
        row.className = 'lpm-row--partiel';

        if (row.cells[2]) row.cells[2].innerHTML =
            `<span class="lpm-badge lpm-badge--partiel">◐ Partiel</span>`;

        const montantInput = row.querySelector('.lpm-montant');
        if (montantInput) {
            const reste = (montantDu - montantPaye).toFixed(2);
            montantInput.value             = reste;
            montantInput.dataset.montantDu = reste;
        }
        const dateInput = row.querySelector('.lpm-date');
        if (dateInput) dateInput.value = todayISO();

        const btn = row.querySelector('.lpm-btn-valider');
        if (btn) { btn.disabled = false; btn.textContent = '✓ Valider'; }
    }

    // ── Rafraîchir l'en-tête ─────────────────────────────────────────────────
    async _refreshHeader(container, idLoyer) {
        try {
            const loyerUpdated = await this.loyerActions.getLoyer(idLoyer);
            if (!loyerUpdated) return;
            const headerEl = container.querySelector('.lpm-header');
            if (!headerEl) return;
            const tmp = document.createElement('div');
            tmp.innerHTML = buildHeaderHTML(loyerUpdated);
            const newHeader = tmp.firstElementChild;
            if (newHeader) headerEl.replaceWith(newHeader);
        } catch (e) {
            this.log.warn('⚠️ Refresh en-tête échoué (non critique):', e);
        }
    }

    // ── Feedback ─────────────────────────────────────────────────────────────
    // Utilise les classes .lpm-feedback__msg--{type} de LoyerPaymentModal.css
    // qui reprennent les mêmes tokens que .modal-error/.modal-success (modals.css)
    _feedback(el, msg, type) {
        if (!el) return;
        el.innerHTML = `<div class="lpm-feedback__msg lpm-feedback__msg--${type}">${msg}</div>`;
        if (type === 'success') setTimeout(() => { if (el) el.innerHTML = ''; }, 4500);
    }

    _anchorRef(event) {
        if (!event) return null;
        const ref = React.createRef();
        if (event.currentTarget) ref.current = event.currentTarget;
        return ref;
    }
}

export default LoyerPaymentModalHandler;