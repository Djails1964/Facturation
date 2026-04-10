// src/constants/loyerConstants.js
// Constantes pour la gestion des loyers

export const FORM_MODES = {
    VIEW: 'view',
    CREATE: 'create',
    EDIT: 'edit'
};

// ✅ STATUTS (correspond à ENUM statut dans table loyer)
export const STATUTS_LOYER = {
    ACTIF: 'actif',
    TERMINE: 'termine',
    SUSPENDU: 'suspendu',
    ANNULE: 'annule'
};

// ✅ ÉTATS DE PAIEMENT (correspond à ENUM etat_paiement dans table loyer)
export const ETATS_PAIEMENT = {
    NON_PAYE: 'non_paye',
    PARTIELLEMENT_PAYE: 'partiellement_paye',
    PAYE: 'paye'
};

// ✅ Labels pour affichage
export const LABELS_STATUTS = {
    actif: 'Actif',
    termine: 'Terminé',
    suspendu: 'Suspendu',
    annule: 'Annulé'
};

export const LABELS_ETATS_PAIEMENT = {
    non_paye: 'Non payé',
    partiellement_paye: 'Part. payé',
    paye: 'Payé'
};

// ✅ NOUVEAU : Labels des colonnes pour la liste
export const COLUMN_LABELS = {
    NUMERO: 'Numéro',
    CLIENT: 'Client',
    PERIODE: 'Période',
    MONTANT_TOTAL: 'Montant total (CHF)',
    MONTANT_PAYE: 'Payé',
    MONTANT_RESTANT: 'Restant',
    STATUT: 'État',
    ETATS_PAIEMENT: 'État paiement',
    ACTIONS: '',
    DATE_CREATION: 'Date de création',
    DUREE: 'Durée',
    MOTIF: 'Motif'
};

// ✅ NOUVEAU : Configuration des colonnes pour UnifiedTable
export const TABLE_COLUMNS_CONFIG = {
    NUMERO: {
        flex: '0 0 13%',
        minWidth: '100px'
    },
    CLIENT: {
        flex: '1',
        minWidth: '150px'
    },
    PERIODE: {
        flex: '0 0 18%',
        minWidth: '180px'
    },
    MONTANT_TOTAL: {
        flex: '0 0 12%',
        minWidth: '110px',
        align: 'right'
    },
    MONTANT_PAYE: {
        flex: '0 0 12%',
        minWidth: '110px',
        align: 'right'
    },
    MONTANT_RESTANT: {
        flex: '0 0 12%',
        minWidth: '110px',
        align: 'right'
    },
    STATUT: {
        flex: '0 0 12%',
        minWidth: '100px',
        align: 'center'
    },
    ACTIONS: {
        flex: '0 0 170px',
        minWidth: '170px',
        maxWidth: '170px',
        className: 'actions-cell'
    }
};

export const DUREES_LOYER = [
    { value: 1, label: '1 mois' },
    { value: 3, label: '3 mois (trimestre)' },
    { value: 6, label: '6 mois (semestre)' },
    { value: 12, label: '12 mois (année)' },
    { value: 24, label: '24 mois (2 ans)' },
    { value: 36, label: '36 mois (3 ans)' }
];

// Les motifs de loyer sont gérés dans les paramètres de l'application.
// groupe='Loyer', sous_groupe='Motifs', categorie='Cabinet'|'Salle'
// Utiliser useMotifsLoyer() pour les charger dynamiquement.