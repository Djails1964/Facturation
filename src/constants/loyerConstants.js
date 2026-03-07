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
    MONTANT_TOTAL: 'Montant total',
    MONTANT_PAYE: 'Payé',
    MONTANT_RESTANT: 'Restant',
    STATUT: 'Statut',
    ETATS_PAIEMENT: 'État paiement',
    ACTIONS: 'Actions',
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
    { numero: 12, nom: 'Décembre',  nomCourt: 'Déc' }
];

export const DUREES_LOYER = [
    { value: 1, label: '1 mois' },
    { value: 3, label: '3 mois (trimestre)' },
    { value: 6, label: '6 mois (semestre)' },
    { value: 12, label: '12 mois (année)' },
    { value: 24, label: '24 mois (2 ans)' },
    { value: 36, label: '36 mois (3 ans)' }
];

export const MOTIFS_LOYER_DEFAUT = [
    "Location d'un cabinet de consultation",
    "Location d'une salle de thérapie",
    "Location d'un espace de coworking",
    "Location d'un bureau individuel",
    "Location d'une salle de formation"
];