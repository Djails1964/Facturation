// src/components/shared/modals/handlers/DatePickerModalHandler.js
//
// Calendrier universel de l'application.
//
// Contrat :
//   - Entrée  : strings ISO 'YYYY-MM-DD' (ou tableau vide)
//   - Sortie  : { action: 'confirm'|'cancel', dates: string[] }  (strings ISO)
//   - Le formatage (display, compact, enregistrement) est laissé à l'appelant.
//
// Usage :
//   import { showDatePicker } from '.../DatePickerModalHandler';
//
//   const result = await showDatePicker({
//     initialDates: ['2026-01-05'],   // strings ISO
//     multiSelect:  true,
//     allowFuture:  false,
//     title:        'Sélectionner des dates',
//     anchorRef:    ref,              // optionnel
//   });
//   if (result.action === 'confirm') {
//     const isoStrings = result.dates; // ['2026-01-05', '2026-01-12']
//   }
//
// Dépendances :
//   - modalSystem.showCustom  → affichage
//   - calendarHelpers         → construction HTML du calendrier
//   - dateHelpers             → toIsoString, getDaysInMonth, isSameDay
//   - dateConstants           → NOMS_MOIS_LONGS, NOMS_JOURS_MIN

import React from 'react';
import { showCustom }          from '../../../../utils/modalSystem';
import { createLogger }        from '../../../../utils/createLogger';
import { NOMS_MOIS_LONGS, NOMS_JOURS_MIN } from '../../../../constants/dateConstants';
import { toIsoString, getDaysInMonth, pad2 } from '../../../../utils/dateHelpers';
import { formatDate }          from '../../../../utils/formatters';
import '../../../../styles/shared/DatePickerModal.css';

const log = createLogger('DatePickerModalHandler');

// ─── Helpers internes ─────────────────────────────────────────────────────────

/** Convertit 'YYYY-MM-DD' en objet Date local (sans ambiguïté timezone) */
function isoToDate(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
}

/** Retourne 'YYYY-MM-DD' d'aujourd'hui */
function todayIso() {
    return toIsoString(new Date());
}

/** Compare deux strings ISO */
function isoAfterToday(iso) {
    return iso > todayIso();
}

// ─── Construction HTML du calendrier ─────────────────────────────────────────

/**
 * Construit le HTML du calendrier navigable (avec nav mois + grille de jours).
 * Contrairement à buildMiniCalendar (calendrier fixe de saisie rapide),
 * ce calendrier a une navigation mois/année complète.
 *
 * @param {number}   annee
 * @param {number}   mois        1-12
 * @param {string[]} selected    Dates ISO sélectionnées
 * @param {boolean}  allowFuture
 * @param {boolean}  multiSelect
 * @returns {string} HTML string
 */
function buildCalendarHTML(annee, mois, selected, allowFuture, multiSelect) {
    const todayStr    = todayIso();
    const selectedSet = new Set(selected);
    const nbJours     = getDaysInMonth(annee, mois);
    const premierJour = (new Date(annee, mois - 1, 1).getDay() + 6) % 7; // lundi=0
    const moisLabel   = NOMS_MOIS_LONGS[mois - 1] ?? '';

    // Mois adjacents pour les jours de remplissage
    const moisPrecAnnee   = mois === 1  ? annee - 1 : annee;
    const moisPrecNum     = mois === 1  ? 12 : mois - 1;
    const moisSuivAnnee   = mois === 12 ? annee + 1 : annee;
    const moisSuivNum     = mois === 12 ? 1  : mois + 1;
    const nbJoursMoisPrec = getDaysInMonth(moisPrecAnnee, moisPrecNum);

    // ── Grille ───────────────────────────────────────────────────────────────
    let grid = '';

    // En-têtes (L M M J V S D)
    NOMS_JOURS_MIN.forEach(j => { grid += `<div class="dpm-dow">${j}</div>`; });

    // Jours du mois précédent
    for (let i = premierJour - 1; i >= 0; i--) {
        const jour = nbJoursMoisPrec - i;
        const iso  = `${moisPrecAnnee}-${pad2(moisPrecNum)}-${pad2(jour)}`;
        const isSel    = selectedSet.has(iso);
        const isFuture = iso > todayStr;
        const disabled = isFuture && !allowFuture;
        const classes  = ['dpm-day', 'dpm-day--adjacent'];
        if (isSel) classes.push('dpm-day--selected');
        grid += `<button type="button" class="${classes.join(' ')}"
                    data-iso="${iso}" ${disabled ? 'disabled' : ''}>${jour}</button>`;
    }

    // Jours du mois courant
    for (let j = 1; j <= nbJours; j++) {
        const iso      = `${annee}-${pad2(mois)}-${pad2(j)}`;
        const isToday  = iso === todayStr;
        const isFuture = iso > todayStr;
        const isSel    = selectedSet.has(iso);
        const disabled = isFuture && !allowFuture;
        const classes  = ['dpm-day'];
        if (isSel)                          classes.push('dpm-day--selected');
        if (isToday)                        classes.push('dpm-day--today');
        if (isFuture && !allowFuture)       classes.push('dpm-day--disabled');
        if (isFuture &&  allowFuture)       classes.push('dpm-day--future');
        const title = disabled ? 'Date future non autorisée' : isToday ? "Aujourd'hui" : '';
        grid += `<button type="button" class="${classes.join(' ')}"
                    data-iso="${iso}"
                    ${disabled ? 'disabled' : ''}
                    ${title ? `title="${title}"` : ''}>${j}</button>`;
    }

    // Jours du mois suivant — compléter la dernière ligne jusqu'à 7
    const totalCells = premierJour + nbJours;
    const reste      = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let j = 1; j <= reste; j++) {
        const iso      = `${moisSuivAnnee}-${pad2(moisSuivNum)}-${pad2(j)}`;
        const isSel    = selectedSet.has(iso);
        const isFuture = iso > todayStr;
        const disabled = isFuture && !allowFuture;
        const classes  = ['dpm-day', 'dpm-day--adjacent'];
        if (isSel) classes.push('dpm-day--selected');
        grid += `<button type="button" class="${classes.join(' ')}"
                    data-iso="${iso}" ${disabled ? 'disabled' : ''}>${j}</button>`;
    }

    // ── Résumé ───────────────────────────────────────────────────────────────
    const resumeText = selected.length === 0
        ? 'Aucune date sélectionnée'
        : selected.length === 1
            ? formatDate(selected[0], 'date')
            : `${selected.length} dates sélectionnées`;

    return `
    <div class="dpm-calendar" data-annee="${annee}" data-mois="${mois}"
         data-allow-future="${allowFuture}" data-multi="${multiSelect}">

      <div class="dpm-nav">
        <button type="button" class="dpm-nav-btn" data-dir="-1" title="Mois précédent">‹</button>
        <span class="dpm-nav-label">${moisLabel} ${annee}</span>
        <button type="button" class="dpm-nav-btn" data-dir="1" title="Mois suivant">›</button>
      </div>

      <div class="dpm-grid">${grid}</div>

      <div class="dpm-resume" id="dpm-resume">${resumeText}</div>

      ${!allowFuture ? `<div class="dpm-hint">Seules les dates passées et du jour sont disponibles.</div>` : ''}
      ${multiSelect  ? `<div class="dpm-hint">Cliquez sur les dates pour les sélectionner / désélectionner.</div>` : ''}
    </div>`;
}

// ─── Attachement des événements ───────────────────────────────────────────────

/**
 * Attache les listeners sur le calendrier injecté dans la modale.
 * Mutates `state.selected` et met à jour le DOM.
 *
 * @param {HTMLElement} container  Conteneur de la modale
 * @param {{ selected: string[], allowFuture: boolean, multiSelect: boolean }} state
 */
function attachCalendarEvents(container, state) {
    const cal = container.querySelector('.dpm-calendar');
    if (!cal) return;

    // ── Clic sur un jour ─────────────────────────────────────────────────────
    cal.addEventListener('click', (e) => {
        const btn = e.target.closest('.dpm-day');
        if (!btn || btn.disabled) return;

        const iso = btn.dataset.iso;
        if (!iso) return;

        if (isoAfterToday(iso) && !state.allowFuture) return;

        if (state.multiSelect) {
            const idx = state.selected.indexOf(iso);
            if (idx >= 0) {
                state.selected.splice(idx, 1);
            } else {
                state.selected.push(iso);
                state.selected.sort();
            }
        } else {
            state.selected.splice(0, state.selected.length, iso);
        }

        // Mettre à jour les classes des boutons
        cal.querySelectorAll('.dpm-day').forEach(b => {
            const d = b.dataset.iso;
            b.classList.toggle('dpm-day--selected', state.selected.includes(d));
        });

        // Mettre à jour le résumé
        const resume = cal.querySelector('#dpm-resume');
        if (resume) {
            resume.textContent = state.selected.length === 0
                ? 'Aucune date sélectionnée'
                : state.selected.length === 1
                    ? formatDate(state.selected[0], 'date')
                    : `${state.selected.length} dates sélectionnées`;
        }

        // Activer/désactiver le bouton Confirmer
        const confirmBtn = container.querySelector('[data-action="confirm"]');
        if (confirmBtn) {
            confirmBtn.disabled = state.selected.length === 0;
            confirmBtn.textContent = state.selected.length > 1
                ? `Confirmer (${state.selected.length})`
                : 'Confirmer';
        }
    });

    // ── Navigation mois ──────────────────────────────────────────────────────
    cal.addEventListener('click', (e) => {
        const btn = e.target.closest('.dpm-nav-btn');
        if (!btn) return;
        e.stopPropagation();

        let annee = parseInt(cal.dataset.annee, 10);
        let mois  = parseInt(cal.dataset.mois,  10);

        mois += parseInt(btn.dataset.dir, 10);
        if (mois > 12) { mois = 1;  annee++; }
        if (mois < 1)  { mois = 12; annee--; }

        cal.insertAdjacentHTML('afterend',
            buildCalendarHTML(annee, mois, state.selected, state.allowFuture, state.multiSelect)
        );
        cal.remove();

        // Réattacher les events sur le nouveau calendrier
        attachCalendarEvents(container, state);
    });
}

// ─── Fonction publique ────────────────────────────────────────────────────────

/**
 * Ouvre le sélecteur de dates universel.
 *
 * @param {Object}    config
 * @param {string[]}  [config.initialDates=[]]   Dates ISO pré-sélectionnées
 * @param {boolean}   [config.multiSelect=false]  Sélection multiple
 * @param {boolean}   [config.allowFuture=true]   Autoriser les dates futures
 * @param {string}    [config.title]              Titre de la modale
 * @param {Object}    [config.anchorRef]          Ref pour positionnement smart
 *
 * @returns {Promise<{ action: 'confirm'|'cancel', dates: string[] }>}
 *          dates = tableau de strings ISO 'YYYY-MM-DD', trié chronologiquement
 */
export async function showDatePicker({
    initialDates = [],
    multiSelect  = false,
    allowFuture  = true,
    title,
    anchorRef    = null,
} = {}) {
    const today = new Date();
    const moisInit = initialDates.length > 0
        ? parseInt(initialDates[0].split('-')[1], 10)
        : today.getMonth() + 1;
    const anneeInit = initialDates.length > 0
        ? parseInt(initialDates[0].split('-')[0], 10)
        : today.getFullYear();

    const titleFinal = title
        ?? (multiSelect ? 'Sélectionner des dates' : 'Sélectionner une date');

    // État partagé entre le HTML initial et les events
    const state = {
        selected:    [...initialDates].sort(),
        allowFuture,
        multiSelect,
    };

    log.debug('📅 showDatePicker', { multiSelect, allowFuture, initialDates });

    const result = await showCustom({
        title:               titleFinal,
        size:                'small',
        position:            anchorRef ? 'smart' : 'center',
        anchorRef,
        closeOnEscape:       true,
        closeOnOverlayClick: false,
        content: buildCalendarHTML(anneeInit, moisInit, state.selected, allowFuture, multiSelect),
        buttons: [
            { text: 'Annuler',    action: 'cancel',  className: 'secondary' },
            { text: state.selected.length > 1 ? `Confirmer (${state.selected.length})` : 'Confirmer',
              action: 'confirm', className: 'primary',
              disabled: state.selected.length === 0 },
        ],
        onMount: (container) => {
            attachCalendarEvents(container, state);
        },
    });

    if (result?.action === 'confirm') {
        log.debug('✅ Dates confirmées:', state.selected);
        return { action: 'confirm', dates: state.selected };
    }

    log.debug('↩️ Annulé');
    return { action: 'cancel', dates: [] };
}

// ─── Export classe pour compatibilité ascendante ──────────────────────────────

/**
 * @deprecated Utiliser showDatePicker() directement.
 * Conservé pour ne pas casser le code existant.
 */
export class DatePickerModalHandler {
    constructor(dependencies) {
        this._showCustom  = dependencies.showCustom  ?? showCustom;
        this._showError   = dependencies.showError   ?? (() => {});
        this.log = log;
    }

    async handle(config = {}, event = null) {
        const anchorRef = config.anchorRef ?? this._createAnchorRef(event);
        const context   = config.context ?? 'default';
        const allowFuture = context === 'payment' ? false
                          : context === 'invoice'  ? false
                          : config.allowFuture ?? true;

        // Convertir les Date[] en ISO strings si nécessaire
        const initialDates = (config.initialDates ?? []).map(d =>
            d instanceof Date ? toIsoString(d) : d
        ).filter(Boolean);

        const result = await showDatePicker({
            initialDates,
            multiSelect:  config.multiSelect  ?? false,
            allowFuture,
            title:        config.title,
            anchorRef,
        });

        // Rétrocompatibilité : convertir ISO → Date[]
        const dates = result.dates.map(isoToDate);
        return { action: result.action, dates, count: dates.length };
    }

    _createAnchorRef(event) {
        if (!event) return null;
        const ref = React.createRef();
        if (event.currentTarget) ref.current = event.currentTarget;
        return ref;
    }
}

export default DatePickerModalHandler;