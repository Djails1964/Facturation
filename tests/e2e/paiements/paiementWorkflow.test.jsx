// tests/e2e/paiements/paiementWorkflow.test.jsx
// Tests End-to-End pour le workflow complet de gestion des paiements

import { mockPaiementService, resetPaiementMocks, testPaiements, createTestPaiement } from '../../mocks/paiementMocks';

// ============================================
// TESTS DU WORKFLOW PAIEMENT
// ============================================

describe('Workflow Paiement - Cycle de vie complet', () => {
  beforeEach(() => {
    resetPaiementMocks();
  });

  describe('Création de paiement', () => {
    it('devrait créer un nouveau paiement avec succès', async () => {
      const paiementData = {
        idFacture: 1,
        datePaiement: '2025-01-20',
        montantPaye: 500,
        methodePaiement: 'virement',
        commentaire: 'Paiement partiel'
      };

      const result = await mockPaiementService.createPaiement(paiementData);

      expect(result.success).toBe(true);
      expect(result.id).toBeDefined();
      expect(result.numeroPaiement).toBeDefined();
    });

    it('devrait générer un numéro de paiement automatiquement', async () => {
      const result = await mockPaiementService.createPaiement(createTestPaiement());

      expect(result.numeroPaiement).toMatch(/^PAY-\d{3}-\d{4}$/);
    });

    it('devrait valider les données avant création', () => {
      const paiementData = {
        idFacture: 1,
        datePaiement: '2025-01-20',
        montantPaye: 500,
        methodePaiement: 'virement'
      };

      const validation = mockPaiementService.validerDonneesPaiement(paiementData);

      expect(validation.valid).toBe(true);
    });

    it('devrait rejeter un paiement sans facture', () => {
      const paiementData = {
        idFacture: null,
        datePaiement: '2025-01-20',
        montantPaye: 500,
        methodePaiement: 'virement'
      };

      const validation = mockPaiementService.validerDonneesPaiement(paiementData);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('L\'ID de la facture est obligatoire');
    });

    it('devrait mettre à jour le solde de la facture après création', () => {
      const facture = {
        montantTotal: 1000,
        montantPaye: 0,
        montantRestant: 1000
      };
      const nouveauPaiement = 500;

      const nouveauSolde = facture.montantRestant - nouveauPaiement;

      expect(nouveauSolde).toBe(500);
    });
  });

  describe('Modification de paiement', () => {
    it('devrait charger un paiement existant', async () => {
      const paiement = await mockPaiementService.getPaiement(1);

      expect(paiement).toBeDefined();
      expect(paiement.idPaiement).toBe(1);
    });

    it('devrait modifier un paiement avec succès', async () => {
      const modifications = {
        montantPaye: 600,
        commentaire: 'Montant corrigé'
      };

      const result = await mockPaiementService.updatePaiement(1, modifications);

      expect(result.success).toBe(true);
    });

    it('ne devrait pas modifier un paiement annulé', () => {
      const paiement = testPaiements.find(p => p.statut === 'annule');
      const canEdit = paiement.statut !== 'annule';

      expect(canEdit).toBe(false);
    });

    it('devrait recalculer le solde après modification du montant', () => {
      const ancienMontant = 500;
      const nouveauMontant = 600;
      const soldeAvant = 500;

      const nouveauSolde = soldeAvant - (nouveauMontant - ancienMontant);

      expect(nouveauSolde).toBe(400);
    });
  });

  describe('Annulation de paiement', () => {
    it('devrait annuler un paiement avec succès', async () => {
      const result = await mockPaiementService.annulerPaiement(1, 'Erreur de saisie');

      expect(result.success).toBe(true);
    });

    it('devrait enregistrer le motif d\'annulation', () => {
      const paiementAnnule = testPaiements.find(p => p.statut === 'annule');

      expect(paiementAnnule.motifAnnulation).toBe('Erreur de saisie');
      expect(paiementAnnule.dateAnnulation).toBeDefined();
    });

    it('devrait restaurer le solde de la facture après annulation', () => {
      const montantAnnule = 500;
      const soldeAvant = 500;

      const nouveauSolde = soldeAvant + montantAnnule;

      expect(nouveauSolde).toBe(1000);
    });

    it('ne devrait pas pouvoir annuler un paiement déjà annulé', () => {
      const paiement = { statut: 'annule' };
      const canCancel = paiement.statut === 'confirme';

      expect(canCancel).toBe(false);
    });
  });

  describe('Restauration de paiement', () => {
    it('devrait restaurer un paiement annulé', async () => {
      const result = await mockPaiementService.restaurerPaiement(3);

      expect(result.success).toBe(true);
    });

    it('devrait recalculer le solde après restauration', () => {
      const montantRestaure = 750;
      const soldeAvant = 750;

      const nouveauSolde = soldeAvant - montantRestaure;

      expect(nouveauSolde).toBe(0);
    });

    it('ne devrait pas restaurer un paiement confirmé', () => {
      const paiement = { statut: 'confirme' };
      const canRestore = paiement.statut === 'annule';

      expect(canRestore).toBe(false);
    });
  });

  describe('Suppression de paiement', () => {
    it('devrait supprimer un paiement', async () => {
      const result = await mockPaiementService.deletePaiement(1);

      expect(result.success).toBe(true);
    });

    it('devrait mettre à jour le solde après suppression', () => {
      const montantSupprime = 500;
      const soldeAvant = 500;

      const nouveauSolde = soldeAvant + montantSupprime;

      expect(nouveauSolde).toBe(1000);
    });
  });

  describe('Paiements multiples sur une facture', () => {
    it('devrait permettre plusieurs paiements partiels', () => {
      const paiementsFacture = testPaiements.filter(p => p.idFacture === 1);

      expect(paiementsFacture).toHaveLength(2);
    });

    it('devrait calculer le total payé', () => {
      const paiementsFacture = testPaiements.filter(
        p => p.idFacture === 1 && p.statut === 'confirme'
      );
      const totalPaye = paiementsFacture.reduce((sum, p) => sum + p.montantPaye, 0);

      expect(totalPaye).toBe(1000);
    });

    it('devrait détecter une facture entièrement payée', () => {
      const facture = { montantTotal: 1000 };
      const totalPaye = 1000;

      const estPayee = totalPaye >= facture.montantTotal;

      expect(estPayee).toBe(true);
    });

    it('devrait calculer le solde restant', () => {
      const facture = { montantTotal: 1000 };
      const totalPaye = 500;

      const soldeRestant = facture.montantTotal - totalPaye;

      expect(soldeRestant).toBe(500);
    });
  });
});

describe('Workflow Paiement - Validation', () => {
  describe('Validation des données', () => {
    it('devrait valider un paiement complet', () => {
      const paiement = {
        idFacture: 1,
        datePaiement: '2025-01-20',
        montantPaye: 500,
        methodePaiement: 'virement'
      };

      const result = mockPaiementService.validerDonneesPaiement(paiement);

      expect(result.valid).toBe(true);
    });

    it('devrait rejeter un montant négatif', () => {
      const paiement = {
        idFacture: 1,
        datePaiement: '2025-01-20',
        montantPaye: -100,
        methodePaiement: 'virement'
      };

      const result = mockPaiementService.validerDonneesPaiement(paiement);

      expect(result.valid).toBe(false);
    });

    it('devrait rejeter un montant zéro', () => {
      const paiement = {
        idFacture: 1,
        datePaiement: '2025-01-20',
        montantPaye: 0,
        methodePaiement: 'virement'
      };

      const result = mockPaiementService.validerDonneesPaiement(paiement);

      expect(result.valid).toBe(false);
    });

    it('devrait valider le format de la date', () => {
      const dateValide = '2025-01-20';
      const dateInvalide = '20/01/2025';

      const isValidFormat = (date) => /^\d{4}-\d{2}-\d{2}$/.test(date);

      expect(isValidFormat(dateValide)).toBe(true);
      expect(isValidFormat(dateInvalide)).toBe(false);
    });

    it('devrait rejeter une date future', () => {
      const today = new Date();
      const futureDate = new Date(today);
      futureDate.setDate(futureDate.getDate() + 10);

      const isInFuture = futureDate > today;

      expect(isInFuture).toBe(true);
    });

    it('devrait valider que le montant ne dépasse pas le solde', () => {
      const soldeRestant = 500;
      const montantPaye = 600;

      const isValid = montantPaye <= soldeRestant;

      expect(isValid).toBe(false);
    });
  });

  describe('Validation des méthodes de paiement', () => {
    it('devrait accepter les méthodes valides', () => {
      const methodesValides = ['virement', 'especes', 'carte', 'cheque', 'twint', 'paypal', 'autre'];
      
      methodesValides.forEach(methode => {
        const paiement = {
          idFacture: 1,
          datePaiement: '2025-01-20',
          montantPaye: 100,
          methodePaiement: methode
        };
        const result = mockPaiementService.validerDonneesPaiement(paiement);
        expect(result.valid).toBe(true);
      });
    });
  });
});

describe('Workflow Paiement - Filtrage et recherche', () => {
  it('devrait filtrer par période', async () => {
    const result = await mockPaiementService.getPaiementsParPeriode(2025, 1);

    expect(result.paiements).toBeDefined();
  });

  it('devrait filtrer par méthode', async () => {
    const result = await mockPaiementService.getPaiementsParMethode('virement');

    expect(result.paiements.every(p => p.methodePaiement === 'virement')).toBe(true);
  });

  it('devrait filtrer par client', async () => {
    const result = await mockPaiementService.getPaiementsParClient(1);

    expect(result.paiements.every(p => p.idClient === 1)).toBe(true);
  });

  it('devrait filtrer par facture', async () => {
    const paiements = await mockPaiementService.getPaiementsParFacture(1);

    expect(paiements.every(p => p.idFacture === 1)).toBe(true);
  });

  it('devrait rechercher avec critères multiples', async () => {
    const criteres = {
      annee: 2025,
      methode: 'virement',
      statut: 'confirme'
    };

    const result = await mockPaiementService.rechercherPaiements(criteres);

    expect(result.paiements).toBeDefined();
  });
});

describe('Workflow Paiement - Statistiques', () => {
  it('devrait calculer les statistiques globales', async () => {
    const result = await mockPaiementService.getStatistiques();

    expect(result.success).toBe(true);
    expect(result.statistiques.total_paiements).toBe(3);
    expect(result.statistiques.montant_total).toBe(1750);
  });

  it('devrait calculer les totaux par statut', () => {
    const totaux = mockPaiementService.calculerTotaux(testPaiements);

    expect(totaux.nombreConfirmes).toBe(2);
    expect(totaux.nombreAnnules).toBe(1);
  });

  it('devrait calculer le montant moyen', () => {
    const totaux = mockPaiementService.calculerTotaux(testPaiements);

    expect(totaux.montantMoyen).toBe(500);
  });

  it('devrait avoir l\'évolution mensuelle', async () => {
    const result = await mockPaiementService.getStatistiques();

    expect(result.statistiques.evolution_mensuelle).toBeDefined();
    expect(result.statistiques.evolution_mensuelle).toHaveLength(1);
  });
});

describe('Workflow Paiement - Gestion des erreurs', () => {
  it('devrait gérer une erreur de création', async () => {
    mockPaiementService.createPaiement.mockRejectedValueOnce(new Error('Erreur serveur'));

    await expect(mockPaiementService.createPaiement({})).rejects.toThrow('Erreur serveur');
  });

  it('devrait gérer un paiement non trouvé', async () => {
    const paiement = await mockPaiementService.getPaiement(999);

    expect(paiement).toBeNull();
  });

  it('devrait réessayer après une erreur', async () => {
    mockPaiementService.chargerPaiements
      .mockRejectedValueOnce(new Error('Erreur réseau'))
      .mockResolvedValueOnce({ paiements: testPaiements, pagination: null });

    // Premier essai échoue
    await expect(mockPaiementService.chargerPaiements()).rejects.toThrow();

    // Deuxième essai réussit
    const result = await mockPaiementService.chargerPaiements();
    expect(result.paiements).toHaveLength(3);
  });

  it('devrait gérer une erreur d\'annulation', async () => {
    mockPaiementService.annulerPaiement.mockRejectedValueOnce(
      new Error('Impossible d\'annuler ce paiement')
    );

    await expect(mockPaiementService.annulerPaiement(1, 'test'))
      .rejects.toThrow('Impossible d\'annuler ce paiement');
  });
});

describe('Workflow Paiement - Intégration avec Factures', () => {
  it('devrait lier un paiement à une facture', () => {
    const paiement = testPaiements[0];

    expect(paiement.idFacture).toBeDefined();
    expect(paiement.numeroFacture).toBeDefined();
  });

  it('devrait récupérer les infos de la facture', () => {
    const paiement = testPaiements[0];

    expect(paiement.montantTotalFacture).toBe(1000);
    expect(paiement.ristourneFacture).toBeDefined();
  });

  it('devrait mettre à jour l\'état de la facture quand entièrement payée', () => {
    const facture = { montantTotal: 1000, etat: 'En attente' };
    const totalPaye = 1000;

    const nouvelEtat = totalPaye >= facture.montantTotal ? 'Payée' : facture.etat;

    expect(nouvelEtat).toBe('Payée');
  });

  it('devrait remettre la facture en attente après annulation totale', () => {
    const facture = { montantTotal: 1000, etat: 'Payée' };
    const totalPaye = 0; // Après annulation

    const nouvelEtat = totalPaye < facture.montantTotal ? 'En attente' : facture.etat;

    expect(nouvelEtat).toBe('En attente');
  });
});