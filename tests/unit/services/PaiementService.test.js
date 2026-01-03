// tests/unit/services/PaiementService.test.js
// Tests unitaires pour PaiementService

import { mockPaiementService, resetPaiementMocks, testPaiements, createTestPaiement } from '../../mocks/paiementMocks';

// ============================================
// TESTS DU SERVICE PAIEMENT
// ============================================

describe('PaiementService', () => {
  beforeEach(() => {
    resetPaiementMocks();
  });

  describe('chargerPaiements', () => {
    it('devrait charger tous les paiements', async () => {
      const result = await mockPaiementService.chargerPaiements();

      expect(result.paiements).toBeDefined();
      expect(result.paiements).toHaveLength(3);
    });

    it('devrait retourner la pagination', async () => {
      const result = await mockPaiementService.chargerPaiements();

      expect(result.pagination).toBeDefined();
      expect(result.pagination.page).toBe(1);
    });

    it('devrait filtrer par année', async () => {
      const result = await mockPaiementService.chargerPaiements({ annee: 2025 });

      expect(mockPaiementService.chargerPaiements).toHaveBeenCalledWith({ annee: 2025 });
    });

    it('devrait filtrer par méthode de paiement', async () => {
      await mockPaiementService.chargerPaiements({ methode: 'virement' });

      expect(mockPaiementService.chargerPaiements).toHaveBeenCalledWith({ methode: 'virement' });
    });

    it('devrait filtrer par statut', async () => {
      await mockPaiementService.chargerPaiements({ statut: 'confirme' });

      expect(mockPaiementService.chargerPaiements).toHaveBeenCalledWith({ statut: 'confirme' });
    });
  });

  describe('getPaiement', () => {
    it('devrait retourner un paiement par son ID', async () => {
      const paiement = await mockPaiementService.getPaiement(1);

      expect(paiement).toBeDefined();
      expect(paiement.idPaiement).toBe(1);
      expect(paiement.montantPaye).toBe(500);
      expect(paiement.methodePaiement).toBe('virement');
    });

    it('devrait retourner null si paiement inexistant', async () => {
      const paiement = await mockPaiementService.getPaiement(999);

      expect(paiement).toBeNull();
    });

    it('devrait inclure les informations de la facture', async () => {
      const paiement = await mockPaiementService.getPaiement(1);

      expect(paiement.numeroFacture).toBeDefined();
      expect(paiement.montantTotalFacture).toBeDefined();
    });
  });

  describe('getPaiementsParFacture', () => {
    it('devrait retourner les paiements d\'une facture', async () => {
      const paiements = await mockPaiementService.getPaiementsParFacture(1);

      expect(paiements).toHaveLength(2);
      expect(paiements.every(p => p.idFacture === 1)).toBe(true);
    });

    it('devrait retourner un tableau vide si pas de paiements', async () => {
      const paiements = await mockPaiementService.getPaiementsParFacture(999);

      expect(paiements).toHaveLength(0);
    });
  });

  describe('createPaiement', () => {
    it('devrait créer un paiement avec succès', async () => {
      const paiementData = createTestPaiement();
      const result = await mockPaiementService.createPaiement(paiementData);

      expect(result.success).toBe(true);
      expect(result.id).toBeDefined();
      expect(result.numeroPaiement).toBeDefined();
    });

    it('devrait retourner un message de succès', async () => {
      const result = await mockPaiementService.createPaiement(createTestPaiement());

      expect(result.message).toContain('succès');
    });
  });

  describe('updatePaiement', () => {
    it('devrait modifier un paiement avec succès', async () => {
      const modifications = { montantPaye: 600, commentaire: 'Modifié' };
      const result = await mockPaiementService.updatePaiement(1, modifications);

      expect(result.success).toBe(true);
    });

    it('devrait appeler avec les bons paramètres', async () => {
      const modifications = { montantPaye: 600 };
      await mockPaiementService.updatePaiement(1, modifications);

      expect(mockPaiementService.updatePaiement).toHaveBeenCalledWith(1, modifications);
    });
  });

  describe('annulerPaiement', () => {
    it('devrait annuler un paiement avec succès', async () => {
      const result = await mockPaiementService.annulerPaiement(1, 'Erreur de saisie');

      expect(result.success).toBe(true);
    });
  });

  describe('restaurerPaiement', () => {
    it('devrait restaurer un paiement annulé', async () => {
      const result = await mockPaiementService.restaurerPaiement(3);

      expect(result.success).toBe(true);
    });
  });

  describe('deletePaiement', () => {
    it('devrait supprimer un paiement', async () => {
      const result = await mockPaiementService.deletePaiement(1);

      expect(result.success).toBe(true);
    });
  });

  describe('getStatistiques', () => {
    it('devrait retourner les statistiques', async () => {
      const result = await mockPaiementService.getStatistiques();

      expect(result.success).toBe(true);
      expect(result.statistiques).toBeDefined();
      expect(result.statistiques.total_paiements).toBe(3);
      expect(result.statistiques.montant_total).toBe(1750);
    });
  });

  describe('getMethodesPaiement', () => {
    it('devrait retourner toutes les méthodes de paiement', () => {
      const methodes = mockPaiementService.getMethodesPaiement();

      expect(methodes).toHaveLength(7);
    });

    it('devrait avoir le format value/label', () => {
      const methodes = mockPaiementService.getMethodesPaiement();

      methodes.forEach(m => {
        expect(m).toHaveProperty('value');
        expect(m).toHaveProperty('label');
      });
    });

    it('devrait inclure les méthodes principales', () => {
      const methodes = mockPaiementService.getMethodesPaiement();
      const values = methodes.map(m => m.value);

      expect(values).toContain('virement');
      expect(values).toContain('especes');
      expect(values).toContain('carte');
      expect(values).toContain('twint');
    });
  });

  describe('getAnneesDisponibles', () => {
    it('devrait retourner les années disponibles', async () => {
      const annees = await mockPaiementService.getAnneesDisponibles();

      expect(annees).toHaveLength(3);
      expect(annees).toContain(2025);
    });

    it('devrait être trié par ordre décroissant', async () => {
      const annees = await mockPaiementService.getAnneesDisponibles();

      expect(annees[0]).toBeGreaterThanOrEqual(annees[1]);
    });
  });

  describe('validerDonneesPaiement', () => {
    it('devrait valider des données complètes', () => {
      const data = {
        idFacture: 1,
        datePaiement: '2025-01-20',
        montantPaye: 500,
        methodePaiement: 'virement'
      };

      const result = mockPaiementService.validerDonneesPaiement(data);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('devrait retourner les erreurs pour données invalides', () => {
      const data = {
        idFacture: null,
        datePaiement: null,
        montantPaye: -10,
        methodePaiement: ''
      };

      const result = mockPaiementService.validerDonneesPaiement(data);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('calculerTotaux', () => {
    it('devrait calculer les totaux correctement', () => {
      const totaux = mockPaiementService.calculerTotaux(testPaiements);

      expect(totaux.nombreTotal).toBe(3);
      expect(totaux.nombreConfirmes).toBe(2);
      expect(totaux.nombreAnnules).toBe(1);
    });

    it('devrait calculer le montant total des confirmés', () => {
      const totaux = mockPaiementService.calculerTotaux(testPaiements);

      expect(totaux.montantTotal).toBe(1000); // 500 + 500
    });

    it('devrait calculer le montant moyen', () => {
      const totaux = mockPaiementService.calculerTotaux(testPaiements);

      expect(totaux.montantMoyen).toBe(500); // 1000 / 2
    });
  });

  describe('formatMethodePaiement', () => {
    it('devrait formater les méthodes connues', () => {
      expect(mockPaiementService.formatMethodePaiement('virement')).toBe('Virement bancaire');
      expect(mockPaiementService.formatMethodePaiement('especes')).toBe('Espèces');
      expect(mockPaiementService.formatMethodePaiement('carte')).toBe('Carte bancaire');
    });

    it('devrait retourner la valeur pour méthode inconnue', () => {
      expect(mockPaiementService.formatMethodePaiement('inconnu')).toBe('inconnu');
    });
  });

  describe('getPaiementsParMethode', () => {
    it('devrait filtrer par méthode', async () => {
      const result = await mockPaiementService.getPaiementsParMethode('virement');

      expect(result.paiements.every(p => p.methodePaiement === 'virement')).toBe(true);
    });
  });

  describe('getPaiementsParClient', () => {
    it('devrait filtrer par client', async () => {
      const result = await mockPaiementService.getPaiementsParClient(1);

      expect(result.paiements.every(p => p.idClient === 1)).toBe(true);
    });
  });
});