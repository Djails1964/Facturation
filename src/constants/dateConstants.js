// src/constants/dateConstants.js - Constantes communes pour la gestion des dates

// ✅ FORMATS DE DATE
export const DATE_FORMATS = {
    INPUT: 'YYYY-MM-DD',           // Format pour inputs HTML
    DISPLAY: 'DD.MM.YYYY',         // Format d'affichage suisse
    DISPLAY_SHORT: 'DD.MM',        // Format court
    DATETIME: 'DD.MM.YYYY HH:mm',  // Format avec heure
    COMPACT: '[DD/DD.MM, DD.MM]',  // Format compact pour multiple dates
    ISO: 'YYYY-MM-DDTHH:mm:ss.sssZ' // Format ISO complet
};

// ✅ LOCALES
export const LOCALES = {
    PRIMARY: 'fr-CH',              // Locale principale (Suisse française)
    FALLBACK: 'fr-FR',             // Locale de secours
    DATE_FNS: 'fr'                 // Locale pour date-fns
};

// ✅ MESSAGES DE VALIDATION COMMUNS
export const DATE_VALIDATION_MESSAGES = {
    REQUIRED: 'La date est obligatoire',
    INVALID_FORMAT: 'Format de date invalide',
    INVALID_DATE: 'Date invalide',
    FUTURE_NOT_ALLOWED: 'Les dates futures ne sont pas autorisées',
    PAST_NOT_ALLOWED: 'Les dates passées ne sont pas autorisées',
    MIN_DATE_ERROR: 'Date antérieure à la date minimum autorisée',
    MAX_DATE_ERROR: 'Date postérieure à la date maximum autorisée',
    WEEKEND_NOT_ALLOWED: 'Les dates de weekend ne sont pas autorisées',
    HOLIDAY_NOT_ALLOWED: 'Les jours fériés ne sont pas autorisés'
};

// ✅ MESSAGES D'ERREUR SPÉCIFIQUES
export const DATE_ERROR_MESSAGES = {
    PARSE_ERROR: 'Erreur lors de l\'analyse de la date',
    FORMAT_ERROR: 'Erreur lors du formatage de la date',
    CONVERSION_ERROR: 'Erreur lors de la conversion de date',
    RANGE_ERROR: 'Date hors de la plage autorisée',
    SERVICE_ERROR: 'Erreur du service de dates'
};

// ✅ MESSAGES D'INFORMATION
export const DATE_INFO_MESSAGES = {
    TODAY: 'Aujourd\'hui',
    YESTERDAY: 'Hier',
    TOMORROW: 'Demain',
    THIS_WEEK: 'Cette semaine',
    LAST_WEEK: 'Semaine dernière',
    NEXT_WEEK: 'Semaine prochaine',
    THIS_MONTH: 'Ce mois',
    LAST_MONTH: 'Mois dernier',
    NEXT_MONTH: 'Mois prochain'
};

// ✅ LABELS POUR COMPOSANTS
export const DATE_LABELS = {
    SELECT_DATE: 'Sélectionner une date',
    SELECT_DATES: 'Sélectionner des dates',
    SELECTED_DATES: 'Dates sélectionnées',
    NO_DATE_SELECTED: 'Aucune date sélectionnée',
    OPEN_CALENDAR: 'Ouvrir le calendrier',
    CLOSE_CALENDAR: 'Fermer le calendrier',
    CONFIRM_SELECTION: 'Confirmer la sélection',
    CANCEL_SELECTION: 'Annuler la sélection',
    CLEAR_SELECTION: 'Effacer la sélection'
};

// ✅ TEXTES DE BOUTONS
export const DATE_BUTTON_TEXTS = {
    CONFIRM: 'Confirmer',
    CANCEL: 'Annuler',
    TODAY: 'Aujourd\'hui',
    CLEAR: 'Effacer',
    APPLY: 'Appliquer',
    RESET: 'Réinitialiser'
};

// ✅ CONFIGURATION DES CONTRAINTES
export const DATE_CONSTRAINTS = {
    MIN_YEAR: 1900,
    MAX_YEAR: 2100,
    DEFAULT_MIN_DATE: null,        // Pas de limite par défaut
    DEFAULT_MAX_DATE: null,        // Pas de limite par défaut
    BUSINESS_DAYS_ONLY: false,     // Autoriser weekends par défaut
    EXCLUDE_HOLIDAYS: false        // Autoriser jours fériés par défaut
};

// ✅ MOIS DE L'ANNÉE (fr-CH)
// Source de vérité unique pour les noms de mois en français.
// Remplace les tableaux locaux éparpillés dans les composants (MOIS_COURTS, MOIS_LONGS, MOIS_LABELS…).
export const MOIS_ANNEE = [
    { numero: 1,  nom: 'Janvier',   nomCourt: 'Jan' },
    { numero: 2,  nom: 'Février',   nomCourt: 'Fév' },
    { numero: 3,  nom: 'Mars',      nomCourt: 'Mar' },
    { numero: 4,  nom: 'Avril',     nomCourt: 'Avr' },
    { numero: 5,  nom: 'Mai',       nomCourt: 'Mai' },
    { numero: 6,  nom: 'Juin',      nomCourt: 'Jun' },
    { numero: 7,  nom: 'Juillet',   nomCourt: 'Jul' },
    { numero: 8,  nom: 'Août',      nomCourt: 'Aoû' },
    { numero: 9,  nom: 'Septembre', nomCourt: 'Sep' },
    { numero: 10, nom: 'Octobre',   nomCourt: 'Oct' },
    { numero: 11, nom: 'Novembre',  nomCourt: 'Nov' },
    { numero: 12, nom: 'Décembre',  nomCourt: 'Déc' },
];

// Dérivés pratiques (générés depuis MOIS_ANNEE — ne pas dupliquer manuellement)
export const NOMS_MOIS_COURTS = MOIS_ANNEE.map(m => m.nomCourt); // ['Jan', 'Fév', ...]
export const NOMS_MOIS_LONGS  = MOIS_ANNEE.map(m => m.nom);      // ['Janvier', 'Février', ...]

/**
 * Retourne le nom long d'un mois (1-based).
 * @param {number} numero  1 = Janvier … 12 = Décembre
 * @returns {string}
 */
export function getNomMois(numero) {
    return MOIS_ANNEE[numero - 1]?.nom ?? `Mois ${numero}`;
}

/**
 * Retourne le nom court d'un mois (1-based).
 * @param {number} numero  1 = Jan … 12 = Déc
 * @returns {string}
 */
export function getNomMoisCourt(numero) {
    return MOIS_ANNEE[numero - 1]?.nomCourt ?? `M${numero}`;
}

// ✅ JOURS DE LA SEMAINE (fr-CH)
// Source de vérité unique pour les noms de jours en français.
// Ordre : lundi=0 … dimanche=6 (convention calendrier ISO 8601).
// Note : JS natif utilise dimanche=0 — convertir avec (getDay() + 6) % 7.
export const JOURS_SEMAINE = [
    { iso: 0, jsDay: 1, nom: 'Lundi',    nomCourt: 'Lu', nomMin: 'L' },
    { iso: 1, jsDay: 2, nom: 'Mardi',    nomCourt: 'Ma', nomMin: 'M' },
    { iso: 2, jsDay: 3, nom: 'Mercredi', nomCourt: 'Me', nomMin: 'M' },
    { iso: 3, jsDay: 4, nom: 'Jeudi',    nomCourt: 'Je', nomMin: 'J' },
    { iso: 4, jsDay: 5, nom: 'Vendredi', nomCourt: 'Ve', nomMin: 'V' },
    { iso: 5, jsDay: 6, nom: 'Samedi',   nomCourt: 'Sa', nomMin: 'S' },
    { iso: 6, jsDay: 0, nom: 'Dimanche', nomCourt: 'Di', nomMin: 'D' },
];

// Dérivés pratiques
export const NOMS_JOURS_COURTS = JOURS_SEMAINE.map(j => j.nomCourt); // ['Lu', 'Ma', ...]
export const NOMS_JOURS_LONGS  = JOURS_SEMAINE.map(j => j.nom);      // ['Lundi', 'Mardi', ...]
export const NOMS_JOURS_MIN    = JOURS_SEMAINE.map(j => j.nomMin);   // ['L', 'M', ...]

/**
 * Retourne le nom long d'un jour (ordre ISO : 0=lundi … 6=dimanche).
 * @param {number} isoDay  0 = Lundi … 6 = Dimanche
 * @returns {string}
 */
export function getNomJour(isoDay) {
    return JOURS_SEMAINE[isoDay]?.nom ?? `Jour ${isoDay}`;
}

/**
 * Retourne le nom court d'un jour (ordre ISO).
 * @param {number} isoDay  0 = Lundi … 6 = Dimanche
 * @returns {string}
 */
export function getNomJourCourt(isoDay) {
    return JOURS_SEMAINE[isoDay]?.nomCourt ?? `J${isoDay}`;
}

/**
 * Convertit un jour JS (0=dim … 6=sam) en index ISO (0=lun … 6=dim).
 * @param {number} jsDay
 * @returns {number}
 */
export function jsJourToIso(jsDay) {
    return (jsDay + 6) % 7;
}

// ✅ CONFIGURATION DU DATEPICKER
export const DATEPICKER_CONFIG = {
    DEFAULT_TITLE: 'Sélectionner une date',
    MULTI_SELECT_TITLE: 'Sélectionner des dates',
    SHOW_MONTH_DROPDOWN: true,
    SHOW_YEAR_DROPDOWN: true,
    DROPDOWN_MODE: 'select',
    CALENDAR_START_DAY: 1,         // Commencer par lundi
    HIGHLIGHT_TODAY: true,
    SHOW_WEEK_NUMBERS: false
};

// ✅ MESSAGES DE CHARGEMENT
export const DATE_LOADING_MESSAGES = {
    LOADING_CALENDAR: 'Chargement du calendrier...',
    PROCESSING_DATES: 'Traitement des dates...',
    VALIDATING_DATE: 'Validation de la date...',
    SAVING_DATE: 'Enregistrement de la date...'
};

// ✅ CONFIGURATION POUR DIFFÉRENTS CONTEXTES
export const CONTEXT_CONFIGS = {
    PAYMENT: {
        ALLOW_FUTURE: false,       // Pas de paiements futurs
        ALLOW_WEEKENDS: true,      // Paiements possibles le weekend
        MAX_PAST_DAYS: 365,       // Maximum 1 an dans le passé
        DEFAULT_VALUE: 'today'     // Valeur par défaut = aujourd'hui
    },
    INVOICE: {
        ALLOW_FUTURE: true,        // Factures futures autorisées
        ALLOW_WEEKENDS: true,      // Facturation weekend autorisée
        MAX_FUTURE_DAYS: 365,     // Maximum 1 an dans le futur
        DEFAULT_VALUE: 'today'     // Valeur par défaut = aujourd'hui
    },
    APPOINTMENT: {
        ALLOW_FUTURE: true,        // Rendez-vous futurs
        ALLOW_WEEKENDS: false,     // Pas de RDV le weekend
        BUSINESS_HOURS_ONLY: true, // Heures ouvrables seulement
        MIN_ADVANCE_DAYS: 1        // Minimum 1 jour à l'avance
    }
};

// ⚠️  DATE_HELPERS supprimé — les fonctions utilitaires de date appartiennent
//     à DateService.js (méthodes statiques), pas à un fichier de constantes.
//
//     Remplacements :
//       DATE_HELPERS.isBusinessDay(d) → DateService.isBusinessDay(d)
//       DATE_HELPERS.isToday(d)       → DateService.isToday(d)
//       DATE_HELPERS.isFuture(d)      → DateService.isFuture(d)
//       DATE_HELPERS.isPast(d)        → DateService.isPast(d)

// ✅ TYPES DE VALIDATION
export const VALIDATION_TYPES = {
    REQUIRED: 'required',
    FORMAT: 'format',
    RANGE: 'range',
    BUSINESS_DAY: 'businessDay',
    FUTURE: 'future',
    PAST: 'past',
    CUSTOM: 'custom'
};

// ✅ EXPORT PAR DÉFAUT
const dateConstants = {
    DATE_FORMATS,
    LOCALES,
    DATE_VALIDATION_MESSAGES,
    DATE_ERROR_MESSAGES,
    DATE_INFO_MESSAGES,
    DATE_LABELS,
    DATE_BUTTON_TEXTS,
    DATE_CONSTRAINTS,
    MOIS_ANNEE,
    NOMS_MOIS_COURTS,
    NOMS_MOIS_LONGS,
    JOURS_SEMAINE,
    NOMS_JOURS_COURTS,
    NOMS_JOURS_LONGS,
    NOMS_JOURS_MIN,
    DATEPICKER_CONFIG,
    DATE_LOADING_MESSAGES,
    CONTEXT_CONFIGS,
    VALIDATION_TYPES
};

export default dateConstants;