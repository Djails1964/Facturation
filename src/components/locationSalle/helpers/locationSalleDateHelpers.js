// src/components/locationSalle/helpers/locationSalleDateHelpers.js
//
// Helpers spécifiques aux locations de salle.
//
// Fonctions génériques réexportées depuis dateHelpers :
//   getDayOfWeek, getDaysInMonth, shiftIsoDate, pad2
//
// buildMiniCalendar réexporté depuis calendarHelpers (utils/) — disponible
// ici pour compatibilité, mais utilisable directement depuis calendarHelpers.
//
// Fonction spécifique location salle :
//   isWeekendUnite → détecte les unités de type week-end depuis un <option> DOM

import { buildMiniCalendar } from '../../../utils/calendarHelpers';
import { getDayOfWeek, getDaysInMonth, shiftIsoDate, pad2 } from '../../../utils/dateHelpers';

export { getDayOfWeek, getDaysInMonth, shiftIsoDate, pad2 };

// ─── Détection week-end ───────────────────────────────────────────────────────

/**
 * Retourne true si l'option <select> correspond à une unité week-end.
 * Critères : nom contient "week-end" ou "weekend" (insensible casse)
 *            OU abréviation = "we" (insensible casse)
 * @param {HTMLOptionElement|null} opt
 * @returns {boolean}
 */
export function isWeekendUnite(opt) {
    if (!opt) return false;
    const nom   = (opt.dataset?.nom   ?? opt.getAttribute?.('data-nom')   ?? '').toLowerCase();
    const abrev = (opt.dataset?.abrev ?? opt.getAttribute?.('data-abrev') ?? '').toLowerCase();
    return nom.includes('week-end') || nom.includes('weekend') || abrev === 'we';
}

// Réexporter buildMiniCalendar depuis calendarHelpers pour compatibilité
export { buildMiniCalendar };