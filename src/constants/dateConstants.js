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

// ✅ HELPER FUNCTIONS (constantes utilitaires)
export const DATE_HELPERS = {
    isBusinessDay: (date) => {
        const day = date.getDay();
        return day !== 0 && day !== 6; // Pas dimanche (0) ni samedi (6)
    },
    
    isToday: (date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    },
    
    isFuture: (date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date > today;
    },
    
    isPast: (date) => {
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        return date < today;
    }
};

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
    DATEPICKER_CONFIG,
    DATE_LOADING_MESSAGES,
    CONTEXT_CONFIGS,
    DATE_HELPERS,
    VALIDATION_TYPES
};

export default dateConstants;