/**
 * DateService — Façade de compatibilité
 *
 * Les fonctions pures (extraction, comparaison, arithmétique, conversion)
 * ont été migrées dans src/utils/dateHelpers.js.
 * DateService réexporte ces fonctions sous leur ancien nom (méthodes statiques)
 * pour ne pas casser le code existant.
 *
 * Les méthodes de formatage spécifiques à l'application (format compact,
 * verbose, optimisé) restent ici car elles sont propres au domaine métier.
 *
 * Migration progressive :
 *   Ancien : DateService.toInputFormat(date)
 *   Nouveau : import { toIsoString } from '../utils/dateHelpers'
 *
 * getPaymentDateConfig() et getInvoiceDateConfig() ont été supprimées —
 * utiliser PAIEMENT_DATE_CONFIG dans paiementConstants.js.
 */

import {
    getYearFromDate,
    getMonthFromDate,
    getDayFromDate,
    getDateComponents,
    getDayOfWeek,
    getDaysInMonth,
    getToday,
    getTodayIso,
    getCurrentYear,
    getCurrentMonth,
    toIsoString,
    fromIsoString,
    fromDisplayString,
    shiftIsoDate,
    parseIsoArray,
    isoArrayToDates,
    isSameDay,
    isSameYear,
    isSameMonth,
    isStrictlyFuture,
    isPast,
    isFuture,
    isToday,
    isBusinessDay,
    addDays,
    addMonths,
    addYears,
    daysDifference,
    generatePeriods,
    validateDate,
    isValidIsoFormat,
} from './dateHelpers';

import { formatDate, formatDatesCompact, parseDatesFromCompact, formatDatesVerbose, formatDatesWithDayNames, formatDatesOptimized, formatCompactToDisplay, validateDatesString } from './formatters';

class DateService {

    // ── Délégation vers dateHelpers ───────────────────────────────────────────

    static getYearFromDate(date)                           { return getYearFromDate(date); }
    static getMonthFromDate(date)                          { return getMonthFromDate(date); }
    static getDayFromDate(date)                            { return getDayFromDate(date); }
    static getDateComponents(date)                         { return getDateComponents(date); }
    static getDayOfWeek(iso)                               { return getDayOfWeek(iso); }
    static getDaysInMonth(annee, mois)                     { return getDaysInMonth(annee, mois); }
    static getToday()                                      { return getToday(); }
    static getTodayInputFormat()                           { return getTodayIso(); }
    static getCurrentYear()                                { return getCurrentYear(); }
    static getCurrentMonth()                               { return getCurrentMonth(); }
    static toInputFormat(date)                             { return toIsoString(date); }
    static fromInputFormat(dateString)                     { return fromIsoString(dateString); }
    static fromDisplayFormat(dateString)                   { return fromDisplayString(dateString); }
    static shiftIsoDate(iso, delta, annee, mois)           { return shiftIsoDate(iso, delta, annee, mois); }
    static parseISODatesRaw(raw)                           { return parseIsoArray(raw); }
    static parseISODatesToDateObjects(isoArray)            { return isoArrayToDates(isoArray); }
    static isSameDay(d1, d2)                               { return isSameDay(d1, d2); }
    static isSameYear(d1, d2)                              { return isSameYear(d1, d2); }
    static isSameMonth(d1, d2)                             { return isSameMonth(d1, d2); }
    static isStrictlyFuture(date)                          { return isStrictlyFuture(date); }
    static isPast(date)                                    { return isPast(date); }
    static isFuture(date)                                  { return isFuture(date); }
    static isToday(date)                                   { return isToday(date); }
    static isBusinessDay(date)                             { return isBusinessDay(date); }
    static addDays(date, days)                             { return addDays(date, days); }
    static addMonths(date, months)                         { return addMonths(date, months); }
    static addYears(date, years)                           { return addYears(date, years); }
    static daysDifference(d1, d2)                         { return daysDifference(d1, d2); }
    static generatePeriods(date, type, count)              { return generatePeriods(date, type, count); }
    static validateDate(date, context, opts)               { return validateDate(date, context, opts); }
    static isValidDateFormat(dateStr)                      { return isValidIsoFormat(dateStr); }

    // ── Méthodes de formatage spécifiques à l'application ────────────────────
    // Ces méthodes traitent le format compact propriétaire [dd/dd.mm, dd.mm]
    // et restent dans DateService car elles sont propres au domaine métier.

    /**
     * Formate un tableau de Date[] au format compact spécifique.
     * Format de sortie : [09/16/23/30.01, 06/13/20/27.02]
     * @param {Date[]} dates
     * @returns {string}
     */
    // ── Formatage de tableaux de dates (délégation vers formatters) ───────────
    static formatDatesCompact(dates)                               { return formatDatesCompact(dates); }
    static parseDatesFromCompact(str)                              { return parseDatesFromCompact(str); }
    static formatDatesVerbose(dates, locale)                       { return formatDatesVerbose(dates, locale); }
    static formatDatesWithDayNames(dates, locale)                  { return formatDatesWithDayNames(dates, locale); }
    static formatDatesOptimized(dates, useRanges)                  { return formatDatesOptimized(dates, useRanges); }
    static formatCompactToDisplay(str, format)                     { return formatCompactToDisplay(str, format); }
    static formatSingleDate(date, format = 'date')                 { return formatDate(date, format); }
    static validateDatesString(dateString)                         { return validateDatesString(dateString); }
}

export default DateService;