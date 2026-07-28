export const FORM_MODES = {
  VIEW: 'view',
  CREATE: 'create',
  EDIT: 'edit'
};

export const VALIDATION_MESSAGES = {
  NUMERO_REQUIRED: 'Le numéro de facture est obligatoire.',
  CLIENT_REQUIRED: 'Veuillez sélectionner un client.',
  LIGNES_REQUIRED: 'Veuillez ajouter au moins une ligne de facture.',
  LIGNES_INVALID: 'Veuillez compléter correctement toutes les lignes de facture.'
};

export const BUTTON_TEXTS = {
  CREATE: 'Créer facture',
  EDIT: 'Modifier facture',
  SAVE: 'Enregistrer',
  CANCEL: 'Annuler',
  BACK: 'Retour à la liste'
};

export const FORM_TITLES = {
  CREATE: 'Nouvelle facture',
  EDIT: 'Modification de facture',
  VIEW: 'Détail de facture'
};

// ✅ TITRES DE COLONNES DU TABLEAU DES FACTURES
export const COLUMN_LABELS = {
  NUMERO:  'N° facture',
  CLIENT:  'Client',
  DATE:    'Date facture',
  MONTANT: 'Montant',
  ETAT:    'État',
};

// ✅ Libellé court par état — réutilisable pour composer n'importe quel
// tooltip de facture (Payer, Supprimer/Annuler, Envoyer, etc.).
export const LIBELLES_ETAT_FACTURE = {
  'En attente':            'Facture en attente',
  'Éditée':                'Facture éditée',
  'Envoyée':               'Facture envoyée',
  'Retard':                'Facture en retard',
  'Payée':                 'Facture payée',
  'Partiellement payée':   'Facture partiellement payée',
  'Annulée':               'Facture annulée',
};

// ✅ Libellé affiché (tooltip + notification) quand l'état de la facture
// bloque la modification OU l'impression — les deux actions partagent
// exactement les mêmes états autorisés (En attente / Éditée), donc le même
// regroupement simplifié. Les états absents retombent sur un message
// générique — voir FactureActions.jsx.
export const LIBELLES_ETAT_BLOQUANT_MODIFICATION = {
  'Envoyée':               'Facture envoyée',
  'Retard':                'Facture envoyée',
  'Payée':                 'Facture avec paiements',
  'Partiellement payée':   'Facture avec paiements',
};