// src/utils/dateHelpers.js
//
// Fonctions pures utilitaires pour la manipulation de dates.
//
// Règles de nommage :
//   getXxx(date)         → extraction d'un composant
//   isXxx(date)          → booléen
//   addXxx(date, n)      → calcul arithmétique → retourne Date
//   toIsoString(date)    → conversion → retourne string 'YYYY-MM-DD'
//   fromIsoString(str)   → parsing  → retourne Date
//   fromDisplayString(s) → parsing format d'affichage → retourne Date
//
// Nouvelles fonctions absentes de DateService :
//   getDayOfWeek(iso)        → jour de la semaine 0-6 depuis string ISO
//   getDaysInMonth(y, m)     → nombre de jours dans un mois
//   shiftIsoDate(iso, n, y, m) → décalage ISO avec contrainte de mois
//   pad2(n)                  → padding 2 chiffres
//
// Migration :
//   DateService.toInputFormat()     → toIsoString()
//   DateService.fromInputFormat()   → fromIsoString()
//   DateService.fromDisplayFormat() → fromDisplayString()
//   DateService.getYearFromDate()   → getYearFromDate()
//   etc.
//
// DateService.js reste en place comme façade de compatibilité.

import {
    DATE_VALIDATION_MESSAGES,
    DATE_ERROR_MESSAGES,
    CONTEXT_CONFIGS,
    VALIDATION_TYPES,
    LOCALES,
} from '../constants/dateConstants';

// ─── Utilitaires bas niveau ───────────────────────────────────────────────────

/**
 * Formate un entier sur 2 chiffres : 3 → '03'
 * @param {number} n
 * @returns {string}
 */
export const pad2 = n => String(n).padStart(2, '0');

/**
 * Normalise une valeur en objet Date.
 * @param {Date|string} date
 * @returns {Date|null}
 */
function toDate(date) {
    if (!date) return null;
    if (date instanceof Date) return isNaN(date.getTime()) ? null : date;
    if (typeof date === 'string') {
        const d = new Date(date);
        return isNaN(d.getTime()) ? null : d;
    }
    return null;
}

// ─── Extraction de composants ─────────────────────────────────────────────────

/**
 * Extrait l'année d'une date.
 * @param {Date|string} date
 * @returns {number|null}
 */
export function getYearFromDate(date) {
    if (!date) return null;
    if (date instanceof Date) return isNaN(date.getTime()) ? null : date.getFullYear();
    if (typeof date === 'string') {
        const parts = date.split(/[-T]/);
        const year  = parseInt(parts[0], 10);
        if (!isNaN(year) && year > 1900 && year < 2200) return year;
        const d = new Date(date);
        return isNaN(d.getTime()) ? null : d.getFullYear();
    }
    return null;
}

/**
 * Extrait le mois d'une date (1-12).
 * @param {Date|string} date
 * @returns {number|null}
 */
export function getMonthFromDate(date) {
    if (!date) return null;
    if (date instanceof Date) return isNaN(date.getTime()) ? null : date.getMonth() + 1;
    if (typeof date === 'string') {
        const match = date.match(/^\d{4}-(\d{2})/);
        if (match) {
            const m = parseInt(match[1], 10);
            if (m >= 1 && m <= 12) return m;
        }
        const d = new Date(date);
        return isNaN(d.getTime()) ? null : d.getMonth() + 1;
    }
    return null;
}

/**
 * Extrait le jour d'une date (1-31).
 * @param {Date|string} date
 * @returns {number|null}
 */
export function getDayFromDate(date) {
    if (!date) return null;
    if (date instanceof Date) return isNaN(date.getTime()) ? null : date.getDate();
    if (typeof date === 'string') {
        const match = date.match(/^\d{4}-\d{2}-(\d{2})/);
        if (match) {
            const d = parseInt(match[1], 10);
            if (d >= 1 && d <= 31) return d;
        }
        const dt = new Date(date);
        return isNaN(dt.getTime()) ? null : dt.getDate();
    }
    return null;
}

/**
 * Extrait année, mois et jour d'une date.
 * @param {Date|string} date
 * @returns {{year:number, month:number, day:number}|null}
 */
export function getDateComponents(date) {
    const year  = getYearFromDate(date);
    const month = getMonthFromDate(date);
    const day   = getDayFromDate(date);
    if (year === null || month === null || day === null) return null;
    return { year, month, day };
}

/**
 * Retourne le jour de la semaine d'une date ISO (0=dimanche, 6=samedi).
 * Préfère la décomposition directe pour éviter les ambiguïtés de timezone.
 * @param {string} iso  'YYYY-MM-DD'
 * @returns {number} 0–6
 */
export function getDayOfWeek(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d).getDay();
}

/**
 * Retourne le nombre de jours dans un mois.
 * @param {number} annee
 * @param {number} mois  1-12
 * @returns {number}
 */
export function getDaysInMonth(annee, mois) {
    return new Date(annee, mois, 0).getDate();
}

// ─── Dates courantes ──────────────────────────────────────────────────────────

/**
 * Retourne aujourd'hui comme objet Date (00:00:00).
 * @returns {Date}
 */
export function getToday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
}

/**
 * Retourne aujourd'hui au format 'YYYY-MM-DD'.
 * @returns {string}
 */
export function getTodayIso() {
    return toIsoString(new Date());
}

/**
 * Retourne l'année courante.
 * @returns {number}
 */
export function getCurrentYear() {
    return new Date().getFullYear();
}

/**
 * Retourne le mois courant (1-12).
 * @returns {number}
 */
export function getCurrentMonth() {
    return new Date().getMonth() + 1;
}

// ─── Conversion ───────────────────────────────────────────────────────────────

/**
 * Convertit une date en string 'YYYY-MM-DD' (pour les inputs HTML).
 * Remplace DateService.toInputFormat().
 * @param {Date|string} date
 * @returns {string}
 */
export function toIsoString(date) {
    if (!date) return '';
    try {
        const d = typeof date === 'string' ? new Date(date) : date;
        if (isNaN(d.getTime())) return '';
        return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
    } catch {
        return '';
    }
}

/**
 * Parse une string 'YYYY-MM-DD' en objet Date (heure locale).
 * Remplace DateService.fromInputFormat().
 * @param {string} dateString
 * @returns {Date|null}
 */
export function fromIsoString(dateString) {
    if (!dateString || typeof dateString !== 'string') return null;
    if (!dateString.match(/^\d{4}-\d{2}-\d{2}$/)) return null;
    try {
        const [year, month, day] = dateString.split('-').map(Number);
        const d = new Date(year, month - 1, day);
        if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return null;
        return d;
    } catch {
        return null;
    }
}

/**
 * Parse une string au format d'affichage 'DD.MM.YYYY' en objet Date.
 * Remplace DateService.fromDisplayFormat().
 * @param {string} dateString
 * @returns {Date|null}
 */
export function fromDisplayString(dateString) {
    if (!dateString || typeof dateString !== 'string') return null;
    if (!dateString.match(/^\d{2}\.\d{2}\.\d{4}$/)) return null;
    try {
        const [day, month, year] = dateString.split('.').map(Number);
        const d = new Date(year, month - 1, day);
        if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return null;
        return d;
    } catch {
        return null;
    }
}

/**
 * Décale une date ISO de `deltaDays` jours.
 * Retourne null si le résultat sort du mois (annee, mois) — utile pour le
 * calendrier de saisie des locations de salle.
 * @param {string} iso        'YYYY-MM-DD'
 * @param {number} deltaDays
 * @param {number} annee      année de référence
 * @param {number} mois       mois de référence (1-12)
 * @returns {string|null}
 */
export function shiftIsoDate(iso, deltaDays, annee, mois) {
    const [y, m, d] = iso.split('-').map(Number);
    const dt = new Date(y, m - 1, d + deltaDays);
    if (dt.getFullYear() !== annee || dt.getMonth() + 1 !== mois) return null;
    return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
}

// ─── Parsing tableaux ISO ─────────────────────────────────────────────────────

/**
 * Parse un tableau de strings ISO ou un JSON string en string[].
 * Remplace DateService.parseISODatesRaw().
 * @param {string|string[]|null} raw
 * @returns {string[]}
 */
export function parseIsoArray(raw) {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.filter(Boolean);
    try { return JSON.parse(raw).filter(Boolean); } catch { return []; }
}

/**
 * Convertit un tableau de strings ISO en objets Date triés chronologiquement.
 * Remplace DateService.parseISODatesToDateObjects().
 * @param {string[]} isoArray
 * @returns {Date[]}
 */
export function isoArrayToDates(isoArray) {
    if (!Array.isArray(isoArray) || isoArray.length === 0) return [];
    return isoArray
        .map(iso => fromIsoString(iso))
        .filter(Boolean)
        .sort((a, b) => a - b);
}

// ─── Comparaisons ─────────────────────────────────────────────────────────────

/**
 * Vérifie si deux dates correspondent au même jour calendaire.
 * @param {Date} date1
 * @param {Date} date2
 * @returns {boolean}
 */
export function isSameDay(date1, date2) {
    if (!date1 || !date2 || !(date1 instanceof Date) || !(date2 instanceof Date)) return false;
    if (isNaN(date1.getTime()) || isNaN(date2.getTime())) return false;
    return date1.getDate()     === date2.getDate()     &&
           date1.getMonth()    === date2.getMonth()    &&
           date1.getFullYear() === date2.getFullYear();
}

/**
 * Vérifie si deux dates sont dans la même année.
 * @param {Date|string} date1
 * @param {Date|string} date2
 * @returns {boolean}
 */
export function isSameYear(date1, date2) {
    const y1 = getYearFromDate(date1);
    const y2 = getYearFromDate(date2);
    return y1 !== null && y2 !== null && y1 === y2;
}

/**
 * Vérifie si deux dates sont dans le même mois et la même année.
 * @param {Date|string} date1
 * @param {Date|string} date2
 * @returns {boolean}
 */
export function isSameMonth(date1, date2) {
    return isSameYear(date1, date2) &&
           getMonthFromDate(date1) === getMonthFromDate(date2);
}

/**
 * Vérifie si une date est strictement dans le futur (après aujourd'hui).
 * @param {Date|string} date
 * @returns {boolean}
 */
export function isStrictlyFuture(date) {
    if (!date) return false;
    try {
        const d = typeof date === 'string' ? fromIsoString(date) : date;
        if (!d) return false;
        const today = new Date();
        const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const dateOnly  = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        return dateOnly > todayOnly;
    } catch { return false; }
}

/**
 * Vérifie si une date est dans le passé.
 * @param {Date|string} date
 * @returns {boolean}
 */
export function isPast(date) {
    if (!date) return false;
    try {
        const d = toDate(date);
        if (!d) return false;
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        return d < today;
    } catch { return false; }
}

/**
 * Vérifie si une date est dans le futur (inclut aujourd'hui si après minuit).
 * @param {Date|string} date
 * @returns {boolean}
 */
export function isFuture(date) {
    if (!date) return false;
    try {
        const d = toDate(date);
        if (!d) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return d > today;
    } catch { return false; }
}

/**
 * Vérifie si une date correspond à aujourd'hui.
 * @param {Date|string} date
 * @returns {boolean}
 */
export function isToday(date) {
    if (!date) return false;
    try {
        const d = toDate(date);
        return d ? d.toDateString() === new Date().toDateString() : false;
    } catch { return false; }
}

/**
 * Vérifie si une date est un jour ouvrable (lundi–vendredi).
 * @param {Date|string} date
 * @returns {boolean}
 */
export function isBusinessDay(date) {
    if (!date) return false;
    try {
        const d = toDate(date);
        if (!d) return false;
        const dow = d.getDay();
        return dow !== 0 && dow !== 6;
    } catch { return false; }
}

// ─── Arithmétique ─────────────────────────────────────────────────────────────

/**
 * Ajoute ou soustrait des jours à une date.
 * @param {Date|string} date
 * @param {number} days
 * @returns {Date|null}
 */
export function addDays(date, days) {
    if (!date || typeof days !== 'number') return null;
    try {
        const d = new Date(toDate(date));
        d.setDate(d.getDate() + days);
        return d;
    } catch { return null; }
}

/**
 * Ajoute ou soustrait des mois à une date.
 * @param {Date|string} date
 * @param {number} months
 * @returns {Date|null}
 */
export function addMonths(date, months) {
    if (!date || typeof months !== 'number') return null;
    try {
        const d = new Date(toDate(date));
        d.setMonth(d.getMonth() + months);
        return d;
    } catch { return null; }
}

/**
 * Ajoute ou soustrait des années à une date.
 * @param {Date|string} date
 * @param {number} years
 * @returns {Date|null}
 */
export function addYears(date, years) {
    if (!date || typeof years !== 'number') return null;
    try {
        const d = new Date(toDate(date));
        d.setFullYear(d.getFullYear() + years);
        return d;
    } catch { return null; }
}

/**
 * Calcule la différence en jours entre deux dates (date2 - date1).
 * @param {Date|string} date1
 * @param {Date|string} date2
 * @returns {number}
 */
export function daysDifference(date1, date2) {
    if (!date1 || !date2) return 0;
    try {
        const d1 = toDate(date1);
        const d2 = toDate(date2);
        return Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
    } catch { return 0; }
}

// ─── Génération de périodes ───────────────────────────────────────────────────

/**
 * Génère des périodes (jours, semaines, mois) autour d'une date de référence.
 * @param {Date}   date   Date de référence
 * @param {'day'|'week'|'month'} type
 * @param {number} count  Nombre de périodes avant et après
 * @returns {{ before: Date[], after: Date[] }}
 */
export function generatePeriods(date, type = 'day', count = 5) {
    const result = { before: [], after: [] };
    if (!date || !(date instanceof Date)) return result;
    for (let i = 1; i <= count; i++) {
        const before = new Date(date);
        const after  = new Date(date);
        if (type === 'day') {
            before.setDate(before.getDate() - i);
            after.setDate(after.getDate() + i);
        } else if (type === 'week') {
            before.setDate(before.getDate() - i * 7);
            after.setDate(after.getDate() + i * 7);
        } else if (type === 'month') {
            before.setMonth(before.getMonth() - i);
            after.setMonth(after.getMonth() + i);
        }
        result.before.unshift(before);
        result.after.push(after);
    }
    return result;
}

// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * Valide une date selon un contexte métier ('payment', 'invoice', 'default').
 * Utilise CONTEXT_CONFIGS de dateConstants.
 * @param {Date|string} date
 * @param {string}      context
 * @param {Object}      customOptions
 * @returns {{ isValid: boolean, error: string, errorType: string|null }}
 */
export function validateDate(date, context = 'default', customOptions = {}) {
    const result = { isValid: true, error: '', errorType: null };
    if (!date) {
        return { isValid: false, error: DATE_VALIDATION_MESSAGES.REQUIRED, errorType: VALIDATION_TYPES.REQUIRED };
    }
    const d = toDate(date);
    if (!d) {
        return { isValid: false, error: DATE_VALIDATION_MESSAGES.INVALID_DATE, errorType: VALIDATION_TYPES.FORMAT };
    }
    const config = { ...CONTEXT_CONFIGS[context.toUpperCase()], ...customOptions };
    if (!config.ALLOW_FUTURE && isFuture(d)) {
        return { isValid: false, error: DATE_VALIDATION_MESSAGES.FUTURE_NOT_ALLOWED, errorType: VALIDATION_TYPES.FUTURE };
    }
    return result;
}

/**
 * Vérifie si une string est au format 'YYYY-MM-DD'.
 * @param {string} dateStr
 * @returns {boolean}
 */
export function isValidIsoFormat(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return false;
    return /^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim());
}
// ─── Durées hh:mm (multiplicateur de quantité) ────────────────────────────────

/**
 * Parse une durée au format 'h:mm' ou 'hh:mm' en nombre décimal d'heures.
 *   '1:15'  → 1.25
 *   '0:45'  → 0.75
 *   '2:30'  → 2.5
 *   '0:00'  → null  (durée nulle = invalide)
 *   ''      → null
 * @param {string} str
 * @returns {number|null}
 */
export function parseDureeHHMM(str) {
    if (!str || typeof str !== 'string') return null;
    const match = str.trim().match(/^(\d{1,2}):([0-5]\d)$/);
    if (!match) return null;
    const heures  = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    if (heures === 0 && minutes === 0) return null;
    return Math.round((heures + minutes / 60) * 10000) / 10000;
}

/**
 * Formate un nombre décimal d'heures en string 'Xh mm' lisible.
 *   1.25  → '1h15'
 *   0.75  → '0h45'
 *   5.0   → '5h00'
 *   null  → ''
 * @param {number|null} decimal
 * @returns {string}
 */
export function formatDureeDecimale(decimal) {
    if (decimal === null || decimal === undefined || isNaN(decimal)) return '';
    const heures  = Math.floor(decimal);
    const minutes = Math.round((decimal - heures) * 60);
    return `${heures}h${pad2(minutes)}`;
}

/**
 * Valide une saisie de durée au format 'h:mm' ou 'hh:mm'.
 * Retourne un message d'erreur ou '' si valide.
 * @param {string} str
 * @returns {string}  message d'erreur, '' si OK
 */
export function validateDureeHHMM(str) {
    if (!str || str.trim() === '') return 'La durée est obligatoire';
    if (!/^\d{1,2}:[0-5]\d$/.test(str.trim())) return 'Format invalide — saisir hh:mm (ex: 1:15)';
    const val = parseDureeHHMM(str);
    if (val === null) return 'La durée ne peut pas être nulle';
    return '';
}