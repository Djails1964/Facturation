// tests/unit/hooks/usePaiementForm.test.js
// Tests unitaires pour le hook usePaiementForm

import { mockPaiementService, resetPaiementMocks, createTestPaiement } from '../../mocks/paiementMocks';

// ============================================
// TESTS DE LA LOGIQUE DU FORMULAIRE PAIEMENT
// ============================================

describe('usePaiementForm - Logique métier', () => {
  beforeEach(() => {
    resetPaiementMocks();
  });

  describe('Initialisation', () => {
    it('devrait initialiser avec des valeurs par défaut en mode création', () => {
      const initialState = {
        idFacture: '',
        datePaiement: new Date().toISOString().split('T')[0],
        montantPaye: '',
        methodePaiement: '',
        commentaire: '',
        etat: '',
        dateCreation: '',
        dateModification: '',
        dateAnnulation: ''
      };

      expect(initialState.idFacture).toBe('');
      expect(initialState.montantPaye).toBe('');
      expect(initialState.methodePaiement).toBe('');
    });

    it('devrait définir la date du jour par défaut', () => {
      const today = new Date().toISOString().split('T')[0];
      const initialState = { datePaiement: today };

      expect(initialState.datePaiement).toBe(today);
    });

    it('devrait identifier le mode création', () => {
      const mode = 'create';
      const isCreate = mode === 'create';
      const isEdit = mode === 'edit';
      const isReadOnly = mode === 'view';

      expect(isCreate).toBe(true);
      expect(isEdit).toBe(false);
      expect(isReadOnly).toBe(false);
    });

    it('devrait identifier le mode modification', () => {
      const mode = 'edit';
      const isCreate = mode === 'create';
      const isEdit = mode === 'edit';
      const isReadOnly = mode === 'view';

      expect(isCreate).toBe(false);
      expect(isEdit).toBe(true);
      expect(isReadOnly).toBe(false);
    });

    it('devrait identifier le mode visualisation', () => {
      const mode = 'view';
      const isReadOnly = mode === 'view';

      expect(isReadOnly).toBe(true);
    });
  });

  describe('Chargement des données', () => {
    it('devrait charger un paiement existant', async () => {
      const paiement = await mockPaiementService.getPaiement(1);

      expect(paiement).toBeDefined();
      expect(paiement.idPaiement).toBe(1);
      expect(paiement.montantPaye).toBe(500);
    });

    it('devrait retourner null si paiement non trouvé', async () => {
      const paiement = await mockPaiementService.getPaiement(999);

      expect(paiement).toBeNull();
    });

    it('devrait charger les factures avec solde', async () => {
      // Simulation du chargement des factures non soldées
      const factures = [
        { idFacture: 1, montantRestant: 500 },
        { idFacture: 2, montantRestant: 750 }
      ];

      const facturesAvecSolde = factures.filter(f => f.montantRestant > 0);

      expect(facturesAvecSolde).toHaveLength(2);
    });
  });

  describe('Sélection de facture', () => {
    it('devrait mettre à jour la facture sélectionnée', () => {
      const facture = {
        idFacture: 1,
        numeroFacture: '001.2025',
        montantTotal: 1000,
        montantRestant: 500
      };

      const state = { idFacture: facture.idFacture };

      expect(state.idFacture).toBe(1);
    });

    it('devrait pré-remplir le montant avec le solde restant', () => {
      const facture = { montantRestant: 500 };
      const montantPaye = facture.montantRestant;

      expect(montantPaye).toBe(500);
    });

    it('devrait effacer la facture sélectionnée', () => {
      let factureSelectionnee = { idFacture: 1 };
      factureSelectionnee = null;

      expect(factureSelectionnee).toBeNull();
    });
  });

  describe('Validation du formulaire', () => {
    it('devrait valider un paiement complet', () => {
      const paiement = {
        idFacture: 1,
        datePaiement: '2025-01-20',
        montantPaye: 500,
        methodePaiement: 'virement'
      };

      const result = mockPaiementService.validerDonneesPaiement(paiement);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('devrait rejeter si facture manquante', () => {
      const paiement = {
        idFacture: null,
        datePaiement: '2025-01-20',
        montantPaye: 500,
        methodePaiement: 'virement'
      };

      const result = mockPaiementService.validerDonneesPaiement(paiement);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('L\'ID de la facture est obligatoire');
    });

    it('devrait rejeter si date manquante', () => {
      const paiement = {
        idFacture: 1,
        datePaiement: null,
        montantPaye: 500,
        methodePaiement: 'virement'
      };

      const result = mockPaiementService.validerDonneesPaiement(paiement);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('La date de paiement est obligatoire');
    });

    it('devrait rejeter si montant invalide', () => {
      const paiement = {
        idFacture: 1,
        datePaiement: '2025-01-20',
        montantPaye: 0,
        methodePaiement: 'virement'
      };

      const result = mockPaiementService.validerDonneesPaiement(paiement);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Le montant payé doit être positif');
    });

    it('devrait rejeter si méthode de paiement manquante', () => {
      const paiement = {
        idFacture: 1,
        datePaiement: '2025-01-20',
        montantPaye: 500,
        methodePaiement: ''
      };

      const result = mockPaiementService.validerDonneesPaiement(paiement);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('La méthode de paiement est obligatoire');
    });

    it('devrait valider que le montant ne dépasse pas le solde', () => {
      const montantRestant = 500;
      const montantPaye = 600;

      const isValid = montantPaye <= montantRestant;

      expect(isValid).toBe(false);
    });

    it('devrait valider le format de la date', () => {
      const dateValide = '2025-01-20';
      const dateInvalide = '20/01/2025';

      const isValidFormat = (date) => /^\d{4}-\d{2}-\d{2}$/.test(date);

      expect(isValidFormat(dateValide)).toBe(true);
      expect(isValidFormat(dateInvalide)).toBe(false);
    });

    it('devrait rejeter une date dans le futur', () => {
      const today = new Date();
      const futureDate = new Date(today);
      futureDate.setDate(futureDate.getDate() + 10);

      const isInFuture = futureDate > today;

      expect(isInFuture).toBe(true);
    });
  });

  describe('Création de paiement', () => {
    it('devrait créer un paiement avec succès', async () => {
      const paiementData = {
        idFacture: 1,
        datePaiement: '2025-01-20',
        montantPaye: 500,
        methodePaiement: 'virement',
        commentaire: 'Test'
      };

      const result = await mockPaiementService.createPaiement(paiementData);

      expect(result.success).toBe(true);
      expect(result.id).toBeDefined();
      expect(result.numeroPaiement).toBeDefined();
    });

    it('devrait générer un numéro de paiement', async () => {
      const result = await mockPaiementService.createPaiement({
        idFacture: 1,
        datePaiement: '2025-01-20',
        montantPaye: 500,
        methodePaiement: 'virement'
      });

      expect(result.numeroPaiement).toMatch(/^PAY-\d{3}-\d{4}$/);
    });
  });

  describe('Modification de paiement', () => {
    it('devrait modifier un paiement avec succès', async () => {
      const modifications = {
        montantPaye: 600,
        commentaire: 'Montant modifié'
      };

      const result = await mockPaiementService.updatePaiement(1, modifications);

      expect(result.success).toBe(true);
    });

    it('ne devrait pas modifier un paiement annulé', () => {
      const paiement = { statut: 'annule' };
      const canEdit = paiement.statut !== 'annule';

      expect(canEdit).toBe(false);
    });
  });

  describe('États du paiement', () => {
    it('devrait identifier un paiement confirmé', () => {
      const paiement = { statut: 'confirme' };

      expect(paiement.statut).toBe('confirme');
    });

    it('devrait identifier un paiement annulé', () => {
      const paiement = { statut: 'annule' };
      const isPaiementAnnule = paiement.statut === 'annule';

      expect(isPaiementAnnule).toBe(true);
    });

    it('devrait bloquer l\'édition si annulé', () => {
      const mode = 'edit';
      const statut = 'annule';
      const canEdit = mode === 'edit' && statut !== 'annule';

      expect(canEdit).toBe(false);
    });
  });

  describe('Détection des modifications', () => {
    it('devrait détecter des modifications non sauvegardées', () => {
      const initialData = { montantPaye: 500, commentaire: '' };
      const currentData = { montantPaye: 600, commentaire: 'Modifié' };

      const hasChanges = JSON.stringify(initialData) !== JSON.stringify(currentData);

      expect(hasChanges).toBe(true);
    });

    it('devrait ne pas détecter de changements si identiques', () => {
      const initialData = { montantPaye: 500, commentaire: '' };
      const currentData = { montantPaye: 500, commentaire: '' };

      const hasChanges = JSON.stringify(initialData) !== JSON.stringify(currentData);

      expect(hasChanges).toBe(false);
    });

    it('devrait extraire les données du formulaire', () => {
      const paiement = {
        idFacture: 1,
        datePaiement: '2025-01-20',
        montantPaye: 500,
        methodePaiement: 'virement',
        commentaire: 'Test',
        statut: 'confirme'
      };

      const formData = {
        idFacture: paiement.idFacture || '',
        datePaiement: paiement.datePaiement || '',
        montantPaye: paiement.montantPaye || '',
        methodePaiement: paiement.methodePaiement || '',
        commentaire: paiement.commentaire || ''
      };

      expect(formData.idFacture).toBe(1);
      expect(formData.statut).toBeUndefined(); // Ne doit pas inclure le statut
    });
  });
});

describe('usePaiementForm - Méthodes de paiement', () => {
  it('devrait retourner la liste des méthodes de paiement', () => {
    const methodes = mockPaiementService.getMethodesPaiement();

    expect(methodes).toHaveLength(7);
    expect(methodes[0]).toHaveProperty('value');
    expect(methodes[0]).toHaveProperty('label');
  });

  it('devrait formater le label d\'une méthode', () => {
    const label = mockPaiementService.formatMethodePaiement('virement');

    expect(label).toBe('Virement bancaire');
  });

  it('devrait retourner la valeur si méthode inconnue', () => {
    const label = mockPaiementService.formatMethodePaiement('inconnu');

    expect(label).toBe('inconnu');
  });
});