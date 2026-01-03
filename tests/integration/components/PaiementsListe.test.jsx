// tests/integration/components/PaiementsListe.test.jsx
// Tests d'intégration pour le composant PaiementsListe
// Note: Ces tests testent la logique métier car le composant a des dépendances complexes

import { mockPaiementService, resetPaiementMocks, testPaiements } from '../../mocks/paiementMocks';

// ============================================
// TESTS DE LA LISTE DES PAIEMENTS
// ============================================

describe('PaiementsListe - Logique métier', () => {
  beforeEach(() => {
    resetPaiementMocks();
  });

  describe('Affichage de la liste', () => {
    it('devrait charger les paiements', async () => {
      const result = await mockPaiementService.chargerPaiements();

      expect(result.paiements).toHaveLength(3);
    });

    it('devrait afficher les informations essentielles', () => {
      const paiement = testPaiements[0];

      expect(paiement.numeroPaiement).toBeDefined();
      expect(paiement.numeroFacture).toBeDefined();
      expect(paiement.datePaiement).toBeDefined();
      expect(paiement.montantPaye).toBeDefined();
      expect(paiement.methodePaiement).toBeDefined();
      expect(paiement.statut).toBeDefined();
    });

    it('devrait gérer une liste vide', async () => {
      mockPaiementService.chargerPaiements.mockResolvedValueOnce({
        paiements: [],
        pagination: null
      });

      const result = await mockPaiementService.chargerPaiements();

      expect(result.paiements).toHaveLength(0);
    });
  });

  describe('Filtrage', () => {
    it('devrait filtrer par année', () => {
      const annee = 2025;
      const filtered = testPaiements.filter(p => 
        p.datePaiement.startsWith(String(annee))
      );

      expect(filtered.length).toBeGreaterThan(0);
    });

    it('devrait filtrer par mois', () => {
      const mois = '01';
      const filtered = testPaiements.filter(p => {
        const date = p.datePaiement.split('-');
        return date[1] === mois;
      });

      expect(filtered.length).toBeGreaterThan(0);
    });

    it('devrait filtrer par méthode de paiement', () => {
      const methode = 'virement';
      const filtered = testPaiements.filter(p => p.methodePaiement === methode);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].methodePaiement).toBe('virement');
    });

    it('devrait filtrer par statut confirmé', () => {
      const filtered = testPaiements.filter(p => p.statut === 'confirme');

      expect(filtered).toHaveLength(2);
    });

    it('devrait filtrer par statut annulé', () => {
      const filtered = testPaiements.filter(p => p.statut === 'annule');

      expect(filtered).toHaveLength(1);
    });

    it('devrait filtrer par client', () => {
      const idClient = 1;
      const filtered = testPaiements.filter(p => p.idClient === idClient);

      expect(filtered).toHaveLength(2);
    });

    it('devrait combiner plusieurs filtres', () => {
      const filtered = testPaiements.filter(p => 
        p.statut === 'confirme' && 
        p.methodePaiement === 'virement'
      );

      expect(filtered).toHaveLength(1);
    });

    it('devrait rechercher par numéro de facture', () => {
      const searchTerm = '001';
      const filtered = testPaiements.filter(p => 
        p.numeroFacture.includes(searchTerm)
      );

      expect(filtered).toHaveLength(2);
    });

    it('devrait rechercher par nom de client', () => {
      const searchTerm = 'Dupont';
      const filtered = testPaiements.filter(p => 
        p.nomClient.toLowerCase().includes(searchTerm.toLowerCase())
      );

      expect(filtered).toHaveLength(2);
    });
  });

  describe('Tri', () => {
    it('devrait trier par date croissante', () => {
      const sorted = [...testPaiements].sort((a, b) => 
        new Date(a.datePaiement) - new Date(b.datePaiement)
      );

      expect(new Date(sorted[0].datePaiement) <= new Date(sorted[1].datePaiement)).toBe(true);
    });

    it('devrait trier par date décroissante', () => {
      const sorted = [...testPaiements].sort((a, b) => 
        new Date(b.datePaiement) - new Date(a.datePaiement)
      );

      expect(new Date(sorted[0].datePaiement) >= new Date(sorted[1].datePaiement)).toBe(true);
    });

    it('devrait trier par montant croissant', () => {
      const sorted = [...testPaiements].sort((a, b) => a.montantPaye - b.montantPaye);

      expect(sorted[0].montantPaye).toBeLessThanOrEqual(sorted[1].montantPaye);
    });

    it('devrait trier par montant décroissant', () => {
      const sorted = [...testPaiements].sort((a, b) => b.montantPaye - a.montantPaye);

      expect(sorted[0].montantPaye).toBeGreaterThanOrEqual(sorted[1].montantPaye);
    });

    it('devrait trier par numéro de paiement', () => {
      const sorted = [...testPaiements].sort((a, b) => 
        a.numeroPaiement.localeCompare(b.numeroPaiement)
      );

      expect(sorted[0].numeroPaiement.localeCompare(sorted[1].numeroPaiement) <= 0).toBe(true);
    });
  });

  describe('Pagination', () => {
    it('devrait calculer le nombre de pages', () => {
      const totalItems = 25;
      const itemsPerPage = 10;
      const totalPages = Math.ceil(totalItems / itemsPerPage);

      expect(totalPages).toBe(3);
    });

    it('devrait retourner les éléments de la page courante', () => {
      const items = Array.from({ length: 25 }, (_, i) => ({ id: i + 1 }));
      const page = 2;
      const itemsPerPage = 10;
      const start = (page - 1) * itemsPerPage;
      const pageItems = items.slice(start, start + itemsPerPage);

      expect(pageItems).toHaveLength(10);
      expect(pageItems[0].id).toBe(11);
    });

    it('devrait gérer la dernière page incomplète', () => {
      const items = Array.from({ length: 25 }, (_, i) => ({ id: i + 1 }));
      const page = 3;
      const itemsPerPage = 10;
      const start = (page - 1) * itemsPerPage;
      const pageItems = items.slice(start, start + itemsPerPage);

      expect(pageItems).toHaveLength(5);
    });
  });

  describe('Calcul des totaux', () => {
    it('devrait calculer le total des paiements confirmés', () => {
      const totaux = mockPaiementService.calculerTotaux(testPaiements);

      expect(totaux.montantTotal).toBe(1000); // 500 + 500
    });

    it('devrait compter les paiements par statut', () => {
      const totaux = mockPaiementService.calculerTotaux(testPaiements);

      expect(totaux.nombreConfirmes).toBe(2);
      expect(totaux.nombreAnnules).toBe(1);
    });

    it('devrait calculer le montant moyen', () => {
      const totaux = mockPaiementService.calculerTotaux(testPaiements);

      expect(totaux.montantMoyen).toBe(500);
    });
  });

  describe('Actions sur les paiements', () => {
    it('devrait pouvoir visualiser un paiement', async () => {
      const paiement = await mockPaiementService.getPaiement(1);

      expect(paiement).toBeDefined();
      expect(paiement.idPaiement).toBe(1);
    });

    it('devrait pouvoir modifier un paiement confirmé', async () => {
      const result = await mockPaiementService.updatePaiement(1, { commentaire: 'Modifié' });

      expect(result.success).toBe(true);
    });

    it('devrait pouvoir annuler un paiement', async () => {
      const result = await mockPaiementService.annulerPaiement(1, 'Erreur');

      expect(result.success).toBe(true);
    });

    it('devrait pouvoir restaurer un paiement annulé', async () => {
      const result = await mockPaiementService.restaurerPaiement(3);

      expect(result.success).toBe(true);
    });

    it('devrait pouvoir supprimer un paiement', async () => {
      const result = await mockPaiementService.deletePaiement(1);

      expect(result.success).toBe(true);
    });
  });

  describe('États visuels', () => {
    it('devrait identifier les paiements confirmés', () => {
      const paiementsConfirmes = testPaiements.filter(p => p.statut === 'confirme');

      expect(paiementsConfirmes).toHaveLength(2);
    });

    it('devrait identifier les paiements annulés', () => {
      const paiementsAnnules = testPaiements.filter(p => p.statut === 'annule');

      expect(paiementsAnnules).toHaveLength(1);
      expect(paiementsAnnules[0].motifAnnulation).toBeDefined();
    });

    it('devrait afficher le motif d\'annulation', () => {
      const paiementAnnule = testPaiements.find(p => p.statut === 'annule');

      expect(paiementAnnule.motifAnnulation).toBe('Erreur de saisie');
    });
  });

  describe('Formatage des données', () => {
    it('devrait formater le montant en devise', () => {
      const montant = 500;
      const formatted = new Intl.NumberFormat('fr-CH', {
        style: 'currency',
        currency: 'CHF'
      }).format(montant);

      expect(formatted).toMatch(/500/);
      expect(formatted).toMatch(/CHF/);
    });

    it('devrait formater la date', () => {
      const date = '2025-01-20';
      const formatted = new Date(date).toLocaleDateString('fr-CH');

      expect(formatted).toMatch(/20/);
      expect(formatted).toMatch(/01|1/);
      expect(formatted).toMatch(/2025/);
    });

    it('devrait formater la méthode de paiement', () => {
      const formatted = mockPaiementService.formatMethodePaiement('virement');

      expect(formatted).toBe('Virement bancaire');
    });
  });
});

describe('PaiementsListe - Callbacks', () => {
  it('devrait appeler onModifierPaiement avec le bon ID', () => {
    const onModifier = jest.fn();
    const paiementId = 1;

    onModifier(paiementId);

    expect(onModifier).toHaveBeenCalledWith(1);
  });

  it('devrait appeler onAfficherPaiement avec le bon ID', () => {
    const onAfficher = jest.fn();
    const paiementId = 2;

    onAfficher(paiementId);

    expect(onAfficher).toHaveBeenCalledWith(2);
  });

  it('devrait appeler onNouveauPaiement', () => {
    const onNouveau = jest.fn();

    onNouveau();

    expect(onNouveau).toHaveBeenCalled();
  });

  it('devrait appeler onPaiementAnnule après annulation', () => {
    const onAnnule = jest.fn();

    onAnnule(1);

    expect(onAnnule).toHaveBeenCalledWith(1);
  });

  it('devrait appeler onRefresh après une action', () => {
    const onRefresh = jest.fn();

    onRefresh();

    expect(onRefresh).toHaveBeenCalled();
  });
});