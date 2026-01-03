// tests/mocks/tarificationMocks.js
// Mocks pour les tests de tarification

// ============================================
// DONNÉES DE TEST - SERVICES
// ============================================

export const testServices = [
  {
    idService: 1,
    codeService: 'CONS',
    nomService: 'Consultation',
    description: 'Consultation standard',
    actif: true,
    isDefault: true
  },
  {
    idService: 2,
    codeService: 'FORM',
    nomService: 'Formation',
    description: 'Formation groupe',
    actif: true,
    isDefault: false
  },
  {
    idService: 3,
    codeService: 'SUPER',
    nomService: 'Supervision',
    description: 'Supervision individuelle',
    actif: true,
    isDefault: false
  },
  {
    idService: 4,
    codeService: 'INACT',
    nomService: 'Service inactif',
    description: 'Service désactivé',
    actif: false,
    isDefault: false
  }
];

// ============================================
// DONNÉES DE TEST - UNITÉS
// ============================================

export const testUnites = [
  {
    idUnite: 1,
    codeUnite: 'H',
    nomUnite: 'Heure',
    abreviation: 'h',
    actif: true,
    isDefault: true
  },
  {
    idUnite: 2,
    codeUnite: 'DJ',
    nomUnite: 'Demi-journée',
    abreviation: '½j',
    actif: true,
    isDefault: false
  },
  {
    idUnite: 3,
    codeUnite: 'J',
    nomUnite: 'Journée',
    abreviation: 'j',
    actif: true,
    isDefault: false
  },
  {
    idUnite: 4,
    codeUnite: 'INACT',
    nomUnite: 'Unité inactive',
    abreviation: 'x',
    actif: false,
    isDefault: false
  }
];

// ============================================
// DONNÉES DE TEST - TYPES DE TARIFS
// ============================================

export const testTypesTarifs = [
  {
    idTypeTarif: 1,
    codeTypeTarif: 'STD',
    nomTypeTarif: 'Standard',
    description: 'Tarif standard',
    actif: true,
    isDefault: true
  },
  {
    idTypeTarif: 2,
    codeTypeTarif: 'THER',
    nomTypeTarif: 'Thérapeute',
    description: 'Tarif pour thérapeutes',
    actif: true,
    isDefault: false
  },
  {
    idTypeTarif: 3,
    codeTypeTarif: 'PROMO',
    nomTypeTarif: 'Promotion',
    description: 'Tarif promotionnel',
    actif: true,
    isDefault: false
  }
];

// ============================================
// DONNÉES DE TEST - TARIFS STANDARDS
// ============================================

export const testTarifs = [
  {
    idTarif: 1,
    idService: 1,
    idUnite: 1,
    idTypeTarif: 1,
    prix: 150,
    dateDebut: '2025-01-01',
    dateFin: null,
    actif: true,
    nomService: 'Consultation',
    nomUnite: 'Heure',
    nomTypeTarif: 'Standard'
  },
  {
    idTarif: 2,
    idService: 1,
    idUnite: 1,
    idTypeTarif: 2,
    prix: 120,
    dateDebut: '2025-01-01',
    dateFin: null,
    actif: true,
    nomService: 'Consultation',
    nomUnite: 'Heure',
    nomTypeTarif: 'Thérapeute'
  },
  {
    idTarif: 3,
    idService: 2,
    idUnite: 2,
    idTypeTarif: 1,
    prix: 400,
    dateDebut: '2025-01-01',
    dateFin: null,
    actif: true,
    nomService: 'Formation',
    nomUnite: 'Demi-journée',
    nomTypeTarif: 'Standard'
  }
];

// ============================================
// DONNÉES DE TEST - TARIFS SPÉCIAUX
// ============================================

export const testTarifsSpeciaux = [
  {
    idTarifSpecial: 1,
    idClient: 1,
    idService: 1,
    idUnite: 1,
    prix: 100,
    dateDebut: '2025-01-01',
    dateFin: '2025-12-31',
    actif: true,
    nomClient: 'Dupont Jean',
    nomService: 'Consultation',
    nomUnite: 'Heure'
  },
  {
    idTarifSpecial: 2,
    idClient: 2,
    idService: 2,
    idUnite: 2,
    prix: 350,
    dateDebut: '2025-01-01',
    dateFin: null,
    actif: true,
    nomClient: 'Martin Marie',
    nomService: 'Formation',
    nomUnite: 'Demi-journée'
  }
];

// ============================================
// DONNÉES DE TEST - SERVICES-UNITÉS
// ============================================

export const testServicesUnites = {
  1: [1, 2], // Service 1 lié aux unités 1 et 2
  2: [2, 3], // Service 2 lié aux unités 2 et 3
  3: [1]     // Service 3 lié à l'unité 1
};

// ============================================
// MOCK DU SERVICE TARIFICATION
// ============================================

export const mockTarificationService = {
  // ========== SERVICES ==========
  chargerServices: jest.fn().mockResolvedValue(testServices),
  
  createService: jest.fn().mockResolvedValue({
    success: true,
    service: { idService: 5, codeService: 'NEW', nomService: 'Nouveau service' },
    message: 'Service créé avec succès'
  }),
  
  updateService: jest.fn().mockResolvedValue({
    success: true,
    message: 'Service modifié avec succès'
  }),
  
  deleteService: jest.fn().mockResolvedValue({
    success: true,
    message: 'Service supprimé avec succès'
  }),
  
  checkServiceUsage: jest.fn().mockResolvedValue({
    success: true,
    isUsed: false,
    usageCount: 0
  }),
  
  getServiceDefault: jest.fn().mockReturnValue(testServices[0]),
  
  isServiceDefault: jest.fn().mockImplementation((id) => id === 1),

  // ========== UNITÉS ==========
  chargerUnites: jest.fn().mockResolvedValue(testUnites),
  
  createUnite: jest.fn().mockResolvedValue({
    success: true,
    unite: { idUnite: 5, codeUnite: 'NEW', nomUnite: 'Nouvelle unité' },
    message: 'Unité créée avec succès'
  }),
  
  updateUnite: jest.fn().mockResolvedValue({
    success: true,
    message: 'Unité modifiée avec succès'
  }),
  
  deleteUnite: jest.fn().mockResolvedValue({
    success: true,
    message: 'Unité supprimée avec succès'
  }),
  
  checkUniteUsage: jest.fn().mockResolvedValue({
    success: true,
    isUsed: false,
    usageCount: 0
  }),
  
  getUniteDefault: jest.fn().mockResolvedValue(1),
  
  isUniteDefault: jest.fn().mockImplementation((id) => id === 1),

  // ========== TYPES DE TARIFS ==========
  chargerTypesTarifs: jest.fn().mockResolvedValue(testTypesTarifs),
  
  createTypeTarif: jest.fn().mockResolvedValue({
    success: true,
    typeTarif: { idTypeTarif: 4, codeTypeTarif: 'NEW', nomTypeTarif: 'Nouveau type' },
    message: 'Type de tarif créé avec succès'
  }),
  
  updateTypeTarif: jest.fn().mockResolvedValue({
    success: true,
    message: 'Type de tarif modifié avec succès'
  }),
  
  deleteTypeTarif: jest.fn().mockResolvedValue({
    success: true,
    message: 'Type de tarif supprimé avec succès'
  }),
  
  checkTypeTarifUsage: jest.fn().mockResolvedValue({
    success: true,
    isUsed: false,
    usageCount: 0
  }),

  // ========== TARIFS STANDARDS ==========
  getTarifs: jest.fn().mockResolvedValue(testTarifs),
  
  getAllTarifs: jest.fn().mockResolvedValue(testTarifs),
  
  createTarif: jest.fn().mockResolvedValue({
    success: true,
    tarif: { idTarif: 4 },
    message: 'Tarif créé avec succès'
  }),
  
  updateTarif: jest.fn().mockResolvedValue({
    success: true,
    message: 'Tarif modifié avec succès'
  }),
  
  deleteTarif: jest.fn().mockResolvedValue({
    success: true,
    message: 'Tarif supprimé avec succès'
  }),
  
  checkTarifUsage: jest.fn().mockResolvedValue({
    success: true,
    isUsed: false,
    usageCount: 0
  }),

  // ========== TARIFS SPÉCIAUX ==========
  getTarifsSpeciaux: jest.fn().mockResolvedValue(testTarifsSpeciaux),
  
  getAllTarifsSpeciaux: jest.fn().mockResolvedValue(testTarifsSpeciaux),
  
  createTarifSpecial: jest.fn().mockResolvedValue({
    success: true,
    tarifSpecial: { idTarifSpecial: 3 },
    message: 'Tarif spécial créé avec succès'
  }),
  
  updateTarifSpecial: jest.fn().mockResolvedValue({
    success: true,
    message: 'Tarif spécial modifié avec succès'
  }),
  
  deleteTarifSpecial: jest.fn().mockResolvedValue({
    success: true,
    message: 'Tarif spécial supprimé avec succès'
  }),
  
  checkTarifSpecialUsage: jest.fn().mockResolvedValue({
    success: true,
    isUsed: false,
    usageCount: 0
  }),

  // ========== ASSOCIATIONS SERVICE-UNITÉ ==========
  chargerServicesUnites: jest.fn().mockResolvedValue(testServicesUnites),
  
  linkServiceUnite: jest.fn().mockResolvedValue({
    success: true,
    message: 'Association créée avec succès'
  }),
  
  unlinkServiceUnite: jest.fn().mockResolvedValue({
    success: true,
    message: 'Association supprimée avec succès'
  }),
  
  checkServiceUniteUsageInFacture: jest.fn().mockResolvedValue({
    success: true,
    isUsed: false,
    usageCount: 0
  }),
  
  updateServiceUniteDefault: jest.fn().mockResolvedValue({
    success: true,
    message: 'Unité par défaut mise à jour'
  }),
  
  getUnitesForService: jest.fn().mockImplementation((idService) => {
    const uniteIds = testServicesUnites[idService] || [];
    return testUnites.filter(u => uniteIds.includes(u.idUnite));
  }),

  // ========== CALCUL DE PRIX ==========
  getTarifClient: jest.fn().mockResolvedValue({
    success: true,
    prix: 150,
    typeTarif: 'Standard',
    source: 'tarif_standard'
  }),
  
  calculerPrix: jest.fn().mockImplementation(({ idService, idUnite, idClient, quantite }) => {
    const prixUnitaire = 150;
    return Promise.resolve({
      success: true,
      prixUnitaire,
      prixTotal: prixUnitaire * (quantite || 1),
      typeTarif: 'Standard'
    });
  }),
  
  getPrix: jest.fn().mockResolvedValue({
    success: true,
    prix: 150
  }),

  // ========== UTILITAIRES ==========
  estTherapeute: jest.fn().mockResolvedValue(false),
  
  possedeTarifSpecialDefini: jest.fn().mockResolvedValue(false),
  
  getTarifInfoMessage: jest.fn().mockResolvedValue('Tarif standard appliqué'),
  
  getUnitesApplicablesPourClient: jest.fn().mockResolvedValue(testUnites.filter(u => u.actif)),
  
  getTypesServices: jest.fn().mockReturnValue(['Consultation', 'Formation', 'Supervision']),
  
  initialiser: jest.fn().mockResolvedValue(true),
  
  clearCache: jest.fn()
};

// ============================================
// RESET DES MOCKS
// ============================================

export const resetTarificationMocks = () => {
  Object.values(mockTarificationService).forEach(mock => {
    if (typeof mock.mockClear === 'function') {
      mock.mockClear();
    }
  });
};

// ============================================
// HELPERS DE TEST
// ============================================

export const createTestService = (overrides = {}) => ({
  idService: null,
  codeService: 'TEST',
  nomService: 'Service test',
  description: 'Description test',
  actif: true,
  isDefault: false,
  ...overrides
});

export const createTestUnite = (overrides = {}) => ({
  idUnite: null,
  codeUnite: 'TEST',
  nomUnite: 'Unité test',
  abreviation: 't',
  actif: true,
  isDefault: false,
  ...overrides
});

export const createTestTypeTarif = (overrides = {}) => ({
  idTypeTarif: null,
  codeTypeTarif: 'TEST',
  nomTypeTarif: 'Type test',
  description: 'Description test',
  actif: true,
  isDefault: false,
  ...overrides
});

export const createTestTarif = (overrides = {}) => ({
  idTarif: null,
  idService: 1,
  idUnite: 1,
  idTypeTarif: 1,
  prix: 100,
  dateDebut: new Date().toISOString().split('T')[0],
  dateFin: null,
  actif: true,
  ...overrides
});

export const createTestTarifSpecial = (overrides = {}) => ({
  idTarifSpecial: null,
  idClient: 1,
  idService: 1,
  idUnite: 1,
  prix: 80,
  dateDebut: new Date().toISOString().split('T')[0],
  dateFin: null,
  actif: true,
  ...overrides
});