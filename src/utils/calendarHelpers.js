// src/utils/calendarHelpers.js
//
// Constructeurs HTML de composants calendrier réutilisables.
//
// Ces fonctions génèrent du markup HTML (string) destiné à être injecté
// dans des modales ou des composants DOM-based (non-React).
// Pour les composants React, préférer les composants JSX dédiés.

import { NOMS_JOURS_COURTS, NOMS_MOIS_LONGS } from '../constants/dateConstants';
import { getDaysInMonth, pad2 } from './dateHelpers';

/**
 * Construit le HTML d'un mini-calendrier fixe pour un mois donné.
 *
 * Caractéristiques :
 *   - Semaine commençant le lundi (ISO 8601)
 *   - Dates sélectionnées marquées avec la classe `lsm-day--selected`
 *   - Chaque jour est un <button> avec `data-date="YYYY-MM-DD"`
 *   - Input caché `#lsm-dates-value` contenant le tableau JSON des dates sélectionnées
 *
 * @param {number}   annee
 * @param {number}   mois           1-12
 * @param {string[]} selectedDates  Dates ISO déjà sélectionnées ['YYYY-MM-DD', ...]
 * @returns {string} HTML string
 */
export function buildMiniCalendar(annee, mois, selectedDates = []) {
    const isoMois     = `${annee}-${pad2(mois)}`;
    const nbJours     = getDaysInMonth(annee, mois);
    const selectedSet = new Set(selectedDates);
    // Décalage lundi=0 : JS donne 0=dim → (dow + 6) % 7
    const premierJour = (new Date(annee, mois - 1, 1).getDay() + 6) % 7;
    const moisLabel   = NOMS_MOIS_LONGS[mois - 1] ?? '';

    let html = `<div class="lsm-cal" id="lsm-days-grid">`;
    html += `<div class="lsm-cal-header">${moisLabel} ${annee}</div>`;
    html += `<div class="lsm-cal-grid">`;

    NOMS_JOURS_COURTS.forEach(j => { html += `<div class="lsm-cal-dow">${j}</div>`; });

    for (let i = 0; i < premierJour; i++) {
        html += `<div class="lsm-cal-empty"></div>`;
    }

    for (let j = 1; j <= nbJours; j++) {
        const iso = `${isoMois}-${pad2(j)}`;
        const sel = selectedSet.has(iso) ? ' lsm-day--selected' : '';
        html += `<button type="button" class="lsm-day${sel}" data-date="${iso}">${j}</button>`;
    }

    html += `</div></div>`;
    html += `<input type="hidden" id="lsm-dates-value" name="lsm-dates" value='${JSON.stringify(selectedDates)}' />`;
    return html;
}