// tests/mocks/paiementMocks.js
// Mocks pour les tests de paiements

// ============================================
// DONNÉES DE TEST
// ============================================

export const testPaiements = [
  {
    idPaiement: 1,
    idFacture: 1,
    numeroFacture: '001.2025',
    idClient: 1,
    nomClient: 'Dupont Jean',
    datePaiement: '2025-01-20',
    montantPaye: 500,
    methodePaiement: 'virement',
    commentaire: 'Paiement partiel',
    numeroPaiement: 'PAY-001-2025',
    dateCreation: '2025-01-20 10:30:00',
    statut: 'confirme',
    dateModification: null,
    dateAnnulation: null,
    motifAnnulation: null,
    montantTotalFacture: 1000,
    ristourneFacture: 0
  },
  {
    idPaiement: 2,
    idFacture: 1,
    numeroFacture: '001.2025',
    idClient: 1,
    nomClient: 'Dupont Jean',
    datePaiement: '2025-01-25',
    montantPaye: 500,
    methodePaiement: 'especes',
    commentaire: 'Solde',
    numeroPaiement: 'PAY-002-2025',
    dateCreation: '2025-01-25 14:00:00',
    statut: 'confirme',
    dateModification: null,
    dateAnnulation: null,
    motifAnnulation: null,
    montantTotalFacture: 1000,
    ristourneFacture: 0
  },
  {
    idPaiement: 3,
    idFacture: 2,
    numeroFacture: '002.2025',
    idClient: 2,
    nomClient: 'Martin Marie',
    datePaiement: '2025-01-15',
    montantPaye: 750,
    methodePaiement: 'carte',
    commentaire: '',
    numeroPaiement: 'PAY-003-2025',
    dateCreation: '2025-01-15 09:00:00',
    statut: 'annule',
    dateModification: '2025-01-16 10:00:00',
    dateAnnulation: '2025-01-16 10:00:00',
    motifAnnulation: 'Erreur de saisie',
    montantTotalFacture: 750,
    ristourneFacture: 0
  }
];

export const testFacturesAvecSolde = [
  {
    idFacture: 1,
    numeroFacture: '001.2025',
    dateFacture: '2025-01-10',
    montantTotal: 1000,
    montantPaye: 500,
    montantRestant: 500,
    idClient: 1,
    nomClient: 'Dupont Jean'
  },
  {
    idFacture: 2,
    numeroFacture: '002.2025',
    dateFacture: '2025-01-12',
    montantTotal: 750,
    montantPaye: 0,
    montantRestant: 750,
    idClient: 2,
    nomClient: 'Martin Marie'
  },
  {
    idFacture: 3,
    numeroFacture: '003.2025',
    dateFacture: '2025-01-14',
    montantTotal: 500,
    montantPaye: 500,
    montantRestant: 0,
    idClient: 3,
    nomClient: 'Durand Pierre'
  }
];

// ============================================
// MOCK DU SERVICE PAIEMENT
// ============================================

export const mockPaiementService = {
  // Chargement des paiements
  chargerPaiements: jest.fn().mockResolvedValue({
    paiements: testPaiements,
    pagination: { page: 1, totalPages: 1, totalItems: 3 }
  }),

  // Récupération d'un paiement
  getPaiement: jest.fn().mockImplementation((id) => {
    const paiement = testPaiements.find(p => p.idPaiement === id);
    return Promise.resolve(paiement || null);
  }),

  // Paiements par facture
  getPaiementsParFacture: jest.fn().mockImplementation((idFacture) => {
    const paiements = testPaiements.filter(p => p.idFacture === idFacture);
    return Promise.resolve(paiements);
  }),

  // Création de paiement
  createPaiement: jest.fn().mockResolvedValue({
    success: true,
    id: 4,
    numeroPaiement: 'PAY-004-2025',
    message: 'Paiement enregistré avec succès'
  }),

  // Modification de paiement
  updatePaiement: jest.fn().mockResolvedValue({
    success: true,
    message: 'Paiement modifié avec succès'
  }),

  // Annulation de paiement
  annulerPaiement: jest.fn().mockResolvedValue({
    success: true,
    message: 'Paiement annulé avec succès'
  }),

  // Restauration de paiement
  restaurerPaiement: jest.fn().mockResolvedValue({
    success: true,
    message: 'Paiement restauré avec succès'
  }),

  // Suppression de paiement
  deletePaiement: jest.fn().mockResolvedValue({
    success: true,
    message: 'Paiement supprimé avec succès'
  }),

  // Statistiques
  getStatistiques: jest.fn().mockResolvedValue({
    success: true,
    statistiques: {
      total_paiements: 3,
      montant_total: 1750,
      paiements_confirmes: 2,
      paiements_annules: 1,
      evolution_mensuelle: [
        { annee: 2025, mois: 1, montant: 1750 }
      ]
    }
  }),

  // Méthodes de paiement
  getMethodesPaiement: jest.fn().mockReturnValue([
    { value: 'virement', label: 'Virement bancaire' },
    { value: 'especes', label: 'Espèces' },
    { value: 'cheque', label: 'Chèque' },
    { value: 'carte', label: 'Carte bancaire' },
    { value: 'twint', label: 'TWINT' },
    { value: 'paypal', label: 'PayPal' },
    { value: 'autre', label: 'Autre' }
  ]),

  // Années disponibles
  getAnneesDisponibles: jest.fn().mockResolvedValue([2025, 2024, 2023]),

  // Validation des données
  validerDonneesPaiement: jest.fn().mockImplementation((data) => {
    const errors = [];
    if (!data.idFacture) errors.push('L\'ID de la facture est obligatoire');
    if (!data.datePaiement) errors.push('La date de paiement est obligatoire');
    if (!data.montantPaye || data.montantPaye <= 0) errors.push('Le montant payé doit être positif');
    if (!data.methodePaiement) errors.push('La méthode de paiement est obligatoire');
    return { valid: errors.length === 0, errors };
  }),

  // Calcul des totaux
  calculerTotaux: jest.fn().mockImplementation((paiements) => {
    const confirmes = paiements.filter(p => p.statut === 'confirme');
    const annules = paiements.filter(p => p.statut === 'annule');
    return {
      nombreTotal: paiements.length,
      nombreConfirmes: confirmes.length,
      nombreAnnules: annules.length,
      montantTotal: confirmes.reduce((sum, p) => sum + p.montantPaye, 0),
      montantAnnule: annules.reduce((sum, p) => sum + p.montantPaye, 0),
      montantMoyen: confirmes.length > 0 
        ? confirmes.reduce((sum, p) => sum + p.montantPaye, 0) / confirmes.length 
        : 0
    };
  }),

  // Format méthode paiement
  formatMethodePaiement: jest.fn().mockImplementation((methode) => {
    const labels = {
      'virement': 'Virement bancaire',
      'especes': 'Espèces',
      'cheque': 'Chèque',
      'carte': 'Carte bancaire',
      'twint': 'TWINT',
      'paypal': 'PayPal',
      'autre': 'Autre'
    };
    return labels[methode] || methode;
  }),

  // Paiements par méthode
  getPaiementsParMethode: jest.fn().mockImplementation((methode) => {
    const paiements = testPaiements.filter(p => p.methodePaiement === methode);
    return Promise.resolve({ paiements, pagination: null });
  }),

  // Paiements par client
  getPaiementsParClient: jest.fn().mockImplementation((idClient) => {
    const paiements = testPaiements.filter(p => p.idClient === idClient);
    return Promise.resolve({ paiements, pagination: null });
  }),

  // Paiements par période
  getPaiementsParPeriode: jest.fn().mockResolvedValue({
    paiements: testPaiements,
    pagination: null
  }),

  // Recherche avancée
  rechercherPaiements: jest.fn().mockResolvedValue({
    paiements: testPaiements,
    pagination: null
  }),

  // Nettoyage cache
  _clearCache: jest.fn()
};

// ============================================
// RESET DES MOCKS
// ============================================

export const resetPaiementMocks = () => {
  Object.values(mockPaiementService).forEach(mock => {
    if (typeof mock.mockClear === 'function') {
      mock.mockClear();
    }
  });
};

// ============================================
// HELPERS DE TEST
// ============================================

export const createTestPaiement = (overrides = {}) => ({
  idPaiement: null,
  idFacture: 1,
  numeroFacture: '001.2025',
  idClient: 1,
  nomClient: 'Dupont Jean',
  datePaiement: new Date().toISOString().split('T')[0],
  montantPaye: 100,
  methodePaiement: 'virement',
  commentaire: '',
  numeroPaiement: null,
  dateCreation: null,
  statut: 'confirme',
  dateModification: null,
  dateAnnulation: null,
  motifAnnulation: null,
  montantTotalFacture: 1000,
  ristourneFacture: 0,
  ...overrides
});