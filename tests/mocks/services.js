// tests/mocks/services.js
// Mocks des services pour les tests

/**
 * Mock de FactureService
 * Méthodes correspondant à src/services/FactureService.js
 */
export const mockFactureService = {
  // CRUD
  chargerFactures: jest.fn().mockResolvedValue([
    global.createTestFacture ? global.createTestFacture({ idFacture: 1, numeroFacture: '001.2025' }) : { idFacture: 1, numeroFacture: '001.2025' },
    global.createTestFacture ? global.createTestFacture({ idFacture: 2, numeroFacture: '002.2025', etat: 'Payée' }) : { idFacture: 2, numeroFacture: '002.2025', etat: 'Payée' },
  ]),
  
  getFacture: jest.fn().mockResolvedValue(
    global.createTestFacture ? global.createTestFacture() : { idFacture: 1, numeroFacture: '001.2025' }
  ),
  
  createFacture: jest.fn().mockResolvedValue({
    success: true,
    idFacture: 3,
    numeroFacture: '003.2025',
    message: 'Facture créée avec succès'
  }),
  
  updateFacture: jest.fn().mockResolvedValue({
    success: true,
    message: 'Facture modifiée avec succès'
  }),
  
  deleteFacture: jest.fn().mockResolvedValue({
    success: true,
    message: 'Facture supprimée avec succès'
  }),
  
  annulerFacture: jest.fn().mockResolvedValue({
    success: true,
    message: 'Facture annulée avec succès'
  }),
  
  getProchainNumeroFacture: jest.fn().mockResolvedValue('004.2025'),
  
  imprimerFacture: jest.fn().mockResolvedValue({
    success: true,
    url: 'https://example.com/facture.pdf'
  }),
  
  envoyerFactureParEmail: jest.fn().mockResolvedValue({
    success: true,
    message: 'Email envoyé avec succès'
  }),
  
  getFactureUrl: jest.fn().mockResolvedValue({
    success: true,
    url: 'https://example.com/facture.pdf'
  }),
  
  marquerCommePayee: jest.fn().mockResolvedValue({
    success: true,
    message: 'Facture marquée comme payée'
  }),
  
  marquerCommeImprimee: jest.fn().mockResolvedValue({
    success: true,
    message: 'Facture marquée comme imprimée'
  }),
  
  marquerCommeEnvoyee: jest.fn().mockResolvedValue({
    success: true,
    message: 'Facture marquée comme envoyée'
  }),
  
  enrichirFacturesAvecEtatAffichage: jest.fn().mockImplementation((factures) => {
    return Promise.resolve(factures.map(f => ({
      ...f,
      etatAffichage: f.etat || 'En attente'
    })));
  }),
  
  _clearCache: jest.fn()
};

/**
 * Mock de ClientService
 */
export const mockClientService = {
  chargerClients: jest.fn().mockResolvedValue([
    global.createTestClient ? global.createTestClient({ id: 1 }) : { id: 1, nom: 'Dupont' },
    global.createTestClient ? global.createTestClient({ id: 2, nom: 'Martin', prenom: 'Marie' }) : { id: 2, nom: 'Martin' },
  ]),
  
  getClient: jest.fn().mockResolvedValue(
    global.createTestClient ? global.createTestClient() : { id: 1, nom: 'Dupont' }
  ),
  
  creerClient: jest.fn().mockResolvedValue({
    success: true,
    id: 3,
    message: 'Client créé avec succès'
  }),
  
  modifierClient: jest.fn().mockResolvedValue({
    success: true,
    message: 'Client modifié avec succès'
  }),
  
  supprimerClient: jest.fn().mockResolvedValue({
    success: true,
    message: 'Client supprimé avec succès'
  })
};

/**
 * Mock de TarificationService - Version complète
 */
export const mockTarificationService = {
  // ========== SERVICES ==========
  chargerServices: jest.fn().mockResolvedValue([
    { idService: 1, codeService: 'CONS', nomService: 'Consultation', actif: true, isDefault: true },
    { idService: 2, codeService: 'FORM', nomService: 'Formation', actif: true, isDefault: false }
  ]),
  
  createService: jest.fn().mockResolvedValue({
    success: true,
    service: { idService: 3 },
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
  
  getServiceDefault: jest.fn().mockReturnValue({ idService: 1, nomService: 'Consultation', isDefault: true }),
  
  isServiceDefault: jest.fn().mockImplementation((id) => id === 1),

  // ========== UNITÉS ==========
  chargerUnites: jest.fn().mockResolvedValue([
    { idUnite: 1, codeUnite: 'H', nomUnite: 'Heure', abreviation: 'h', actif: true, isDefault: true },
    { idUnite: 2, codeUnite: 'DJ', nomUnite: 'Demi-journée', abreviation: '½j', actif: true, isDefault: false }
  ]),
  
  createUnite: jest.fn().mockResolvedValue({
    success: true,
    unite: { idUnite: 3 },
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
  chargerTypesTarifs: jest.fn().mockResolvedValue([
    { idTypeTarif: 1, codeTypeTarif: 'STD', nomTypeTarif: 'Standard', actif: true, isDefault: true },
    { idTypeTarif: 2, codeTypeTarif: 'THER', nomTypeTarif: 'Thérapeute', actif: true, isDefault: false }
  ]),
  
  createTypeTarif: jest.fn().mockResolvedValue({ success: true }),
  updateTypeTarif: jest.fn().mockResolvedValue({ success: true }),
  deleteTypeTarif: jest.fn().mockResolvedValue({ success: true }),
  checkTypeTarifUsage: jest.fn().mockResolvedValue({ success: true, isUsed: false }),

  // ========== TARIFS ==========
  getTarifs: jest.fn().mockResolvedValue([
    { idTarif: 1, idService: 1, idUnite: 1, idTypeTarif: 1, prix: 150, dateDebut: '2025-01-01' }
  ]),
  
  getAllTarifs: jest.fn().mockResolvedValue([]),
  createTarif: jest.fn().mockResolvedValue({ success: true, tarif: { idTarif: 2 } }),
  updateTarif: jest.fn().mockResolvedValue({ success: true }),
  deleteTarif: jest.fn().mockResolvedValue({ success: true }),
  checkTarifUsage: jest.fn().mockResolvedValue({ success: true, isUsed: false }),

  // ========== TARIFS SPÉCIAUX ==========
  getTarifsSpeciaux: jest.fn().mockResolvedValue([]),
  getAllTarifsSpeciaux: jest.fn().mockResolvedValue([]),
  createTarifSpecial: jest.fn().mockResolvedValue({ success: true }),
  updateTarifSpecial: jest.fn().mockResolvedValue({ success: true }),
  deleteTarifSpecial: jest.fn().mockResolvedValue({ success: true }),
  checkTarifSpecialUsage: jest.fn().mockResolvedValue({ success: true, isUsed: false }),

  // ========== ASSOCIATIONS ==========
  chargerServicesUnites: jest.fn().mockResolvedValue({ 1: [1, 2], 2: [2] }),
  linkServiceUnite: jest.fn().mockResolvedValue({ success: true }),
  unlinkServiceUnite: jest.fn().mockResolvedValue({ success: true }),
  checkServiceUniteUsageInFacture: jest.fn().mockResolvedValue({ success: true, isUsed: false }),
  updateServiceUniteDefault: jest.fn().mockResolvedValue({ success: true }),
  getUnitesForService: jest.fn().mockReturnValue([]),

  // ========== CALCUL DE PRIX ==========
  getTarifClient: jest.fn().mockResolvedValue({ success: true, prix: 150, typeTarif: 'Standard' }),
  calculerPrix: jest.fn().mockResolvedValue({ prixUnitaire: 100, tarifApplique: 'standard' }),
  getPrix: jest.fn().mockResolvedValue({ success: true, prix: 150 }),

  // ========== UTILITAIRES ==========
  estTherapeute: jest.fn().mockResolvedValue(false),
  possedeTarifSpecialDefini: jest.fn().mockResolvedValue(false),
  getTarifInfoMessage: jest.fn().mockResolvedValue('Tarif standard appliqué'),
  getUnitesApplicablesPourClient: jest.fn().mockResolvedValue([]),
  getTypesServices: jest.fn().mockReturnValue([]),
  initialiser: jest.fn().mockResolvedValue(true),
  clearCache: jest.fn()
};

/**
 * Mock de PaiementService - Version complète
 */
export const mockPaiementService = {
  // Chargement des paiements
  chargerPaiements: jest.fn().mockResolvedValue({
    paiements: [
      {
        idPaiement: 1,
        idFacture: 1,
        numeroFacture: '001.2025',
        idClient: 1,
        nomClient: 'Dupont Jean',
        datePaiement: '2025-01-20',
        montantPaye: 500,
        methodePaiement: 'virement',
        statut: 'confirme'
      }
    ],
    pagination: { page: 1, totalPages: 1, totalItems: 1 }
  }),

  // Récupération d'un paiement
  getPaiement: jest.fn().mockResolvedValue({
    idPaiement: 1,
    idFacture: 1,
    numeroFacture: '001.2025',
    datePaiement: '2025-01-20',
    montantPaye: 500,
    methodePaiement: 'virement',
    statut: 'confirme'
  }),

  // Paiements par facture
  getPaiementsParFacture: jest.fn().mockResolvedValue([]),

  // Création
  createPaiement: jest.fn().mockResolvedValue({
    success: true,
    id: 1,
    numeroPaiement: 'PAY-001-2025',
    message: 'Paiement enregistré avec succès'
  }),

  // Modification
  updatePaiement: jest.fn().mockResolvedValue({
    success: true,
    message: 'Paiement modifié avec succès'
  }),

  // Annulation
  annulerPaiement: jest.fn().mockResolvedValue({
    success: true,
    message: 'Paiement annulé avec succès'
  }),

  // Restauration
  restaurerPaiement: jest.fn().mockResolvedValue({
    success: true,
    message: 'Paiement restauré avec succès'
  }),

  // Suppression
  deletePaiement: jest.fn().mockResolvedValue({
    success: true,
    message: 'Paiement supprimé avec succès'
  }),

  // Statistiques
  getStatistiques: jest.fn().mockResolvedValue({
    success: true,
    statistiques: {
      total_paiements: 1,
      montant_total: 500,
      paiements_confirmes: 1,
      paiements_annules: 0,
      evolution_mensuelle: []
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

  // Validation
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

  // Formatage
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

  // Filtres avancés
  getPaiementsParMethode: jest.fn().mockResolvedValue({ paiements: [], pagination: null }),
  getPaiementsParClient: jest.fn().mockResolvedValue({ paiements: [], pagination: null }),
  getPaiementsParPeriode: jest.fn().mockResolvedValue({ paiements: [], pagination: null }),
  rechercherPaiements: jest.fn().mockResolvedValue({ paiements: [], pagination: null }),

  // Cache
  _clearCache: jest.fn()
};

/**
 * Helper pour reset tous les mocks
 */
export const resetAllMocks = () => {
  Object.values(mockFactureService).forEach(mock => {
    if (typeof mock.mockClear === 'function') mock.mockClear();
  });
  Object.values(mockClientService).forEach(mock => {
    if (typeof mock.mockClear === 'function') mock.mockClear();
  });
  Object.values(mockTarificationService).forEach(mock => {
    if (typeof mock.mockClear === 'function') mock.mockClear();
  });
  Object.values(mockPaiementService).forEach(mock => {
    if (typeof mock.mockClear === 'function') mock.mockClear();
  });
};

/**
 * Helper pour configurer un mock avec une erreur
 */
export const mockServiceError = (service, methodName, errorMessage = 'Erreur de test') => {
  service[methodName].mockRejectedValueOnce(new Error(errorMessage));
};

/**
 * Helper pour configurer un mock avec une réponse personnalisée
 */
export const mockServiceResponse = (service, methodName, response) => {
  service[methodName].mockResolvedValueOnce(response);
};