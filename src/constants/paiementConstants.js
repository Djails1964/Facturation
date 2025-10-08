
// src/constants/paiementConstants.js - Constantes spécifiques aux paiements

// ✅ IMPORTATIONS
import { FORM_MODES } from './factureConstants';
import { 
    DATE_VALIDATION_MESSAGES, 
    DATE_LABELS,
    DATE_BUTTON_TEXTS,
    CONTEXT_CONFIGS
} from './dateConstants';

// ✅ RÉEXPORTATION pour compatibilité
export { FORM_MODES };

// ✅ CONSTANTES SPÉCIFIQUES AUX PAIEMENTS
export const PAIEMENT_ETATS = {
    VALIDE: 'confirme',
    ANNULE: 'annule'
};

export const METHODES_PAIEMENT = {
    VIREMENT: 'virement',
    ESPECES: 'especes',
    CHEQUE: 'cheque',
    CARTE: 'carte',
    TWINT: 'twint',
    PAYPAL: 'paypal',
    AUTRE: 'autre'
};

export const METHODES_PAIEMENT_LABELS = {
    [METHODES_PAIEMENT.VIREMENT]: 'Virement bancaire',
    [METHODES_PAIEMENT.ESPECES]: 'Espèces',
    [METHODES_PAIEMENT.CHEQUE]: 'Chèque',
    [METHODES_PAIEMENT.CARTE]: 'Carte bancaire',
    [METHODES_PAIEMENT.TWINT]: 'TWINT',
    [METHODES_PAIEMENT.PAYPAL]: 'PayPal',
    [METHODES_PAIEMENT.AUTRE]: 'Autre'
};

// ✅ MESSAGES DE VALIDATION (avec intégration des dates)
export const VALIDATION_MESSAGES = {
    // Validations spécifiques aux paiements
    FACTURE_REQUIRED: 'Veuillez sélectionner une facture',
    MONTANT_REQUIRED: 'Veuillez saisir un montant valide',
    MONTANT_INVALID: 'Le montant doit être positif',
    METHODE_REQUIRED: 'Veuillez sélectionner une méthode de paiement',
    MONTANT_SUPERIEUR: 'Le montant saisi dépasse le montant restant à payer',
    PAIEMENT_ANNULE: 'Impossible de modifier un paiement annulé',
    PAIEMENT_NON_TROUVE: 'Paiement non trouvé',
    
    // ✅ RÉUTILISATION des messages de date communs
    DATE_REQUIRED: DATE_VALIDATION_MESSAGES.REQUIRED,
    DATE_INVALID: DATE_VALIDATION_MESSAGES.INVALID_DATE,
    DATE_FUTURE_NOT_ALLOWED: DATE_VALIDATION_MESSAGES.FUTURE_NOT_ALLOWED,
    DATE_FORMAT_ERROR: DATE_VALIDATION_MESSAGES.INVALID_FORMAT,
    
    // Messages spécifiques au contexte paiement
    DATE_TOO_OLD: 'La date de paiement ne peut pas être antérieure à 1 an',
    DATE_PAYMENT_CONTEXT: 'La date de paiement doit être réaliste'
};

// ✅ TEXTES DE BOUTONS (avec intégration des dates)
export const BUTTON_TEXTS = {
    CREATE: 'Enregistrer le paiement',
    EDIT: 'Modifier le paiement',
    SAVE: 'Enregistrer',
    CANCEL: 'Annuler',
    BACK: 'Retour à la liste',
    ANNULER_PAIEMENT: 'Annuler le paiement',
    RESTAURER_PAIEMENT: 'Restaurer le paiement',
    SUPPRIMER_PAIEMENT: 'Supprimer le paiement',
    
    // ✅ RÉUTILISATION des boutons de date communs
    DATE_CONFIRM: DATE_BUTTON_TEXTS.CONFIRM,
    DATE_CANCEL: DATE_BUTTON_TEXTS.CANCEL,
    DATE_TODAY: DATE_BUTTON_TEXTS.TODAY
};

// ✅ TITRES DE FORMULAIRES
export const FORM_TITLES = {
    CREATE: 'Nouveau paiement',
    EDIT: 'Modifier le paiement',
    EDIT_CANCELLED: 'Paiement annulé (lecture seule)',
    VIEW: 'Détail du paiement',
    VIEW_CANCELLED: 'Paiement annulé'
};

// ✅ TITRES DE SECTIONS
export const SECTION_TITLES = {
    FACTURE: 'Facture concernée',
    PAIEMENT: 'Détails du paiement',
    SYSTEM_INFO: 'Informations système',
    LOGS: 'Historique des actions'
};

// ✅ LABELS SPÉCIFIQUES AUX PAIEMENTS (avec dates)
export const LABELS = {
    // Labels de champs
    FACTURE: 'Facture',
    DATE_PAIEMENT: 'Date de paiement',
    MONTANT_PAYE: 'Montant payé (CHF)',
    METHODE_PAIEMENT: 'Méthode de paiement',
    COMMENTAIRE: 'Commentaire',
    
    // ✅ RÉUTILISATION des labels de date
    SELECT_PAYMENT_DATE: DATE_LABELS.SELECT_DATE,
    OPEN_DATE_CALENDAR: DATE_LABELS.OPEN_CALENDAR,
    
    // Labels contextuels
    MONTANT_RESTANT: 'Reste à payer',
    MONTANT_TOTAL: 'Montant total',
    DEJA_PAYE: 'Déjà payé'
};

// ✅ CONFIGURATION SPÉCIFIQUE AU CONTEXTE PAIEMENT
export const PAIEMENT_DATE_CONFIG = {
    ...CONTEXT_CONFIGS.PAYMENT,
    TITLE: 'Sélectionner la date de paiement',
    CONFIRM_TEXT: 'Confirmer cette date',
    MAX_PAST_DAYS: 365,
    ALLOW_FUTURE: false,
    DEFAULT_TO_TODAY: true
};

// ✅ ACTIONS DE LOG
export const LOG_ACTIONS = {
    PAIEMENT_CREATE: 'paiement_create',
    PAIEMENT_UPDATE: 'paiement_update',
    PAIEMENT_CANCEL: 'paiement_cancel',
    PAIEMENT_RESTORE: 'paiement_restore',
    PAIEMENT_DELETE: 'paiement_delete',
    PAIEMENT_VIEW: 'paiement_view'
};

// ✅ NOTIFICATIONS
export const NOTIFICATIONS = {
    SUCCESS: {
        CREATE: 'Paiement créé avec succès',
        UPDATE: 'Paiement modifié avec succès',
        CANCEL: 'Paiement annulé avec succès',
        RESTORE: 'Paiement restauré avec succès',
        DELETE: 'Paiement supprimé avec succès'
    },
    ERROR: {
        CREATE: 'Erreur lors de la création du paiement',
        UPDATE: 'Erreur lors de la modification du paiement',
        CANCEL: 'Erreur lors de l\'annulation du paiement',
        RESTORE: 'Erreur lors de la restauration du paiement',
        DELETE: 'Erreur lors de la suppression du paiement',
        LOAD: 'Erreur lors du chargement du paiement',
        DATE_VALIDATION: 'Erreur de validation de date'
    },
    WARNING: {
        CANCEL_CONFIRM: 'Êtes-vous sûr de vouloir annuler ce paiement ?',
        RESTORE_CONFIRM: 'Êtes-vous sûr de vouloir restaurer ce paiement ?',
        DELETE_CONFIRM: 'Êtes-vous sûr de vouloir supprimer définitivement ce paiement ?',
        UNSAVED_CHANGES: 'Vous avez des modifications non sauvegardées. Voulez-vous quitter ?',
        OLD_PAYMENT_DATE: 'Cette date de paiement semble ancienne. Voulez-vous continuer ?'
    }
};

// ✅ MESSAGES DE CHARGEMENT
export const LOADING_MESSAGES = {
    LOADING_PAIEMENT: 'Chargement des données du paiement...',
    LOADING_FACTURES: 'Chargement des factures...',
    LOADING_LOGS: 'Chargement de l\'historique...',
    SAVING: 'Enregistrement en cours...',
    CANCELLING: 'Annulation en cours...',
    VALIDATING_DATE: 'Validation de la date...'
};

// ✅ TEXTES D'AIDE
export const HELP_TEXTS = {
    NO_LOGS: 'Aucune action enregistrée pour ce paiement.',
    CANCELLED_WARNING: 'Ce paiement a été annulé et ne peut plus être modifié.',
    AMOUNT_HELP: 'Saisissez le montant effectivement payé par le client.',
    METHOD_HELP: 'Sélectionnez la méthode de paiement utilisée par le client.',
    DATE_HELP: 'Date à laquelle le paiement a été effectué (pas de dates futures).',
    DATE_REALISTIC: 'Choisissez une date réaliste correspondant au paiement effectif.'
};

// ✅ LIMITES ET CONTRAINTES
export const LIMITS = {
    MIN_AMOUNT: 0.01,
    MAX_AMOUNT: 999999.99,
    MAX_COMMENT_LENGTH: 500,
    MAX_REASON_LENGTH: 250
};

export const DEFAULT_VALUES = {
    METHODE_PAIEMENT: METHODES_PAIEMENT.ESPECES, // 'virement' par défaut
    DATE_PAIEMENT: null, // Sera initialisé par DateService.getTodayInputFormat()
    MONTANT_PAYE: '',
    COMMENTAIRE: ''
};

// ✅ EXPORT PAR DÉFAUT
const paiementConstants = {
    FORM_MODES,
    PAIEMENT_ETATS,
    METHODES_PAIEMENT,
    METHODES_PAIEMENT_LABELS,
    VALIDATION_MESSAGES,
    BUTTON_TEXTS,
    FORM_TITLES,
    SECTION_TITLES,
    LABELS,
    PAIEMENT_DATE_CONFIG,
    LOG_ACTIONS,
    NOTIFICATIONS,
    LOADING_MESSAGES,
    HELP_TEXTS,
    LIMITS,
    DEFAULT_VALUES
};

export default paiementConstants;