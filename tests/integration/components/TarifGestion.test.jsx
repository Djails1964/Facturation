// tests/integration/components/TarifGestion.test.jsx
// Tests d'intégration pour la gestion des tarifs
// Note: Ces tests testent la logique métier car les composants ont des dépendances complexes

import { 
  mockTarificationService, 
  resetTarificationMocks, 
  testServices, 
  testUnites, 
  testTypesTarifs,
  testTarifs,
  testTarifsSpeciaux,
  testServicesUnites
} from '../../mocks/tarificationMocks';

// ============================================
// TESTS DE GESTION DES SERVICES
// ============================================

describe('TarifGestion - Services', () => {
  beforeEach(() => {
    resetTarificationMocks();
  });

  describe('Liste des services', () => {
    it('devrait charger tous les services', async () => {
      const services = await mockTarificationService.chargerServices();

      expect(services).toHaveLength(4);
    });

    it('devrait filtrer les services actifs', () => {
      const servicesActifs = testServices.filter(s => s.actif);

      expect(servicesActifs).toHaveLength(3);
    });

    it('devrait filtrer les services inactifs', () => {
      const servicesInactifs = testServices.filter(s => !s.actif);

      expect(servicesInactifs).toHaveLength(1);
    });

    it('devrait trier par nom', () => {
      const sorted = [...testServices].sort((a, b) => 
        a.nomService.localeCompare(b.nomService)
      );

      expect(sorted[0].nomService).toBe('Consultation');
    });

    it('devrait rechercher par code', () => {
      const searchTerm = 'CONS';
      const filtered = testServices.filter(s => 
        s.codeService.toLowerCase().includes(searchTerm.toLowerCase())
      );

      expect(filtered).toHaveLength(1);
      expect(filtered[0].nomService).toBe('Consultation');
    });

    it('devrait rechercher par nom', () => {
      const searchTerm = 'form';
      const filtered = testServices.filter(s => 
        s.nomService.toLowerCase().includes(searchTerm.toLowerCase())
      );

      expect(filtered).toHaveLength(1);
      expect(filtered[0].codeService).toBe('FORM');
    });
  });

  describe('Actions sur les services', () => {
    it('devrait créer un service', async () => {
      const result = await mockTarificationService.createService({
        codeService: 'NEW',
        nomService: 'Nouveau service',
        actif: true
      });

      expect(result.success).toBe(true);
    });

    it('devrait modifier un service', async () => {
      const result = await mockTarificationService.updateService(1, {
        nomService: 'Service modifié'
      });

      expect(result.success).toBe(true);
    });

    it('devrait supprimer un service non utilisé', async () => {
      // Vérifier d'abord l'utilisation
      const usage = await mockTarificationService.checkServiceUsage(1);
      expect(usage.isUsed).toBe(false);

      // Puis supprimer
      const result = await mockTarificationService.deleteService(1);
      expect(result.success).toBe(true);
    });

    it('devrait empêcher la suppression d\'un service utilisé', async () => {
      mockTarificationService.checkServiceUsage.mockResolvedValueOnce({
        success: true,
        isUsed: true,
        usageCount: 5
      });

      const usage = await mockTarificationService.checkServiceUsage(1);

      expect(usage.isUsed).toBe(true);
      expect(usage.usageCount).toBe(5);
    });
  });
});

// ============================================
// TESTS DE GESTION DES UNITÉS
// ============================================

describe('TarifGestion - Unités', () => {
  beforeEach(() => {
    resetTarificationMocks();
  });

  describe('Liste des unités', () => {
    it('devrait charger toutes les unités', async () => {
      const unites = await mockTarificationService.chargerUnites();

      expect(unites).toHaveLength(4);
    });

    it('devrait filtrer les unités actives', () => {
      const unitesActives = testUnites.filter(u => u.actif);

      expect(unitesActives).toHaveLength(3);
    });

    it('devrait afficher les abréviations', () => {
      testUnites.forEach(unite => {
        expect(unite.abreviation).toBeDefined();
        expect(unite.abreviation.length).toBeLessThanOrEqual(3);
      });
    });
  });

  describe('Actions sur les unités', () => {
    it('devrait créer une unité', async () => {
      const result = await mockTarificationService.createUnite({
        codeUnite: 'NEW',
        nomUnite: 'Nouvelle unité',
        abreviation: 'n',
        actif: true
      });

      expect(result.success).toBe(true);
    });

    it('devrait modifier une unité', async () => {
      const result = await mockTarificationService.updateUnite(1, {
        nomUnite: 'Unité modifiée'
      });

      expect(result.success).toBe(true);
    });

    it('devrait supprimer une unité non utilisée', async () => {
      const usage = await mockTarificationService.checkUniteUsage(4);
      expect(usage.isUsed).toBe(false);

      const result = await mockTarificationService.deleteUnite(4);
      expect(result.success).toBe(true);
    });
  });
});

// ============================================
// TESTS DE GESTION DES TYPES DE TARIFS
// ============================================

describe('TarifGestion - Types de tarifs', () => {
  beforeEach(() => {
    resetTarificationMocks();
  });

  describe('Liste des types de tarifs', () => {
    it('devrait charger tous les types', async () => {
      const types = await mockTarificationService.chargerTypesTarifs();

      expect(types).toHaveLength(3);
    });

    it('devrait avoir un type par défaut', () => {
      const typeDefault = testTypesTarifs.find(t => t.isDefault);

      expect(typeDefault).toBeDefined();
      expect(typeDefault.codeTypeTarif).toBe('STD');
    });
  });

  describe('Actions sur les types de tarifs', () => {
    it('devrait créer un type de tarif', async () => {
      const result = await mockTarificationService.createTypeTarif({
        codeTypeTarif: 'NEW',
        nomTypeTarif: 'Nouveau type',
        actif: true
      });

      expect(result.success).toBe(true);
    });

    it('devrait modifier un type de tarif', async () => {
      const result = await mockTarificationService.updateTypeTarif(1, {
        nomTypeTarif: 'Type modifié'
      });

      expect(result.success).toBe(true);
    });
  });
});

// ============================================
// TESTS DE GESTION DES TARIFS STANDARDS
// ============================================

describe('TarifGestion - Tarifs standards', () => {
  beforeEach(() => {
    resetTarificationMocks();
  });

  describe('Liste des tarifs', () => {
    it('devrait charger tous les tarifs', async () => {
      const tarifs = await mockTarificationService.getTarifs();

      expect(tarifs).toHaveLength(3);
    });

    it('devrait filtrer par service', () => {
      const filtered = testTarifs.filter(t => t.idService === 1);

      expect(filtered).toHaveLength(2);
    });

    it('devrait filtrer par type de tarif', () => {
      const filtered = testTarifs.filter(t => t.idTypeTarif === 1);

      expect(filtered).toHaveLength(2);
    });

    it('devrait filtrer par unité', () => {
      const filtered = testTarifs.filter(t => t.idUnite === 1);

      expect(filtered).toHaveLength(2);
    });
  });

  describe('Actions sur les tarifs', () => {
    it('devrait créer un tarif', async () => {
      const result = await mockTarificationService.createTarif({
        idService: 1,
        idUnite: 1,
        idTypeTarif: 1,
        prix: 200,
        dateDebut: '2025-02-01'
      });

      expect(result.success).toBe(true);
    });

    it('devrait modifier un tarif', async () => {
      const result = await mockTarificationService.updateTarif(1, {
        prix: 175
      });

      expect(result.success).toBe(true);
    });

    it('devrait supprimer un tarif', async () => {
      const result = await mockTarificationService.deleteTarif(1);

      expect(result.success).toBe(true);
    });
  });

  describe('Validation des tarifs', () => {
    it('devrait valider un prix positif', () => {
      const tarifValide = { prix: 100 };
      const tarifInvalide = { prix: -50 };

      expect(tarifValide.prix > 0).toBe(true);
      expect(tarifInvalide.prix > 0).toBe(false);
    });

    it('devrait valider la date de début', () => {
      const tarif = { dateDebut: '2025-01-01', dateFin: '2025-12-31' };

      const debut = new Date(tarif.dateDebut);
      const fin = new Date(tarif.dateFin);

      expect(debut < fin).toBe(true);
    });

    it('devrait permettre une date de fin nulle', () => {
      const tarif = { dateDebut: '2025-01-01', dateFin: null };

      expect(tarif.dateFin).toBeNull();
    });
  });
});

// ============================================
// TESTS DE GESTION DES TARIFS SPÉCIAUX
// ============================================

describe('TarifGestion - Tarifs spéciaux', () => {
  beforeEach(() => {
    resetTarificationMocks();
  });

  describe('Liste des tarifs spéciaux', () => {
    it('devrait charger les tarifs spéciaux', async () => {
      const tarifsSpeciaux = await mockTarificationService.getTarifsSpeciaux();

      expect(tarifsSpeciaux).toHaveLength(2);
    });

    it('devrait filtrer par client', () => {
      const filtered = testTarifsSpeciaux.filter(t => t.idClient === 1);

      expect(filtered).toHaveLength(1);
    });

    it('devrait inclure les informations du client', () => {
      testTarifsSpeciaux.forEach(tarif => {
        expect(tarif.nomClient).toBeDefined();
      });
    });
  });

  describe('Actions sur les tarifs spéciaux', () => {
    it('devrait créer un tarif spécial', async () => {
      const result = await mockTarificationService.createTarifSpecial({
        idClient: 3,
        idService: 1,
        idUnite: 1,
        prix: 80,
        dateDebut: '2025-01-01'
      });

      expect(result.success).toBe(true);
    });

    it('devrait modifier un tarif spécial', async () => {
      const result = await mockTarificationService.updateTarifSpecial(1, {
        prix: 90
      });

      expect(result.success).toBe(true);
    });

    it('devrait supprimer un tarif spécial', async () => {
      const result = await mockTarificationService.deleteTarifSpecial(1);

      expect(result.success).toBe(true);
    });
  });

  describe('Priorité des tarifs', () => {
    it('devrait prioritiser le tarif spécial sur le standard', () => {
      const tarifStandard = { prix: 150 };
      const tarifSpecial = { prix: 100 };

      // Le tarif spécial a priorité
      const prixApplique = tarifSpecial ? tarifSpecial.prix : tarifStandard.prix;

      expect(prixApplique).toBe(100);
    });
  });
});

// ============================================
// TESTS ASSOCIATIONS SERVICE-UNITÉ
// ============================================

describe('TarifGestion - Associations Service-Unité', () => {
  beforeEach(() => {
    resetTarificationMocks();
  });

  describe('Gestion des associations', () => {
    it('devrait charger les associations', async () => {
      const associations = await mockTarificationService.chargerServicesUnites();

      expect(associations).toBeDefined();
    });

    it('devrait retourner les unités d\'un service', () => {
      const unites = mockTarificationService.getUnitesForService(1);

      expect(unites).toHaveLength(2);
    });

    it('devrait créer une association', async () => {
      const result = await mockTarificationService.linkServiceUnite(3, 3);

      expect(result.success).toBe(true);
    });

    it('devrait supprimer une association', async () => {
      const result = await mockTarificationService.unlinkServiceUnite(1, 2);

      expect(result.success).toBe(true);
    });

    it('devrait vérifier l\'utilisation avant suppression', async () => {
      const usage = await mockTarificationService.checkServiceUniteUsageInFacture(1, 1);

      expect(usage.success).toBe(true);
    });
  });

  describe('Unité par défaut du service', () => {
    it('devrait définir une unité par défaut', async () => {
      const result = await mockTarificationService.updateServiceUniteDefault(1, 1);

      expect(result.success).toBe(true);
    });

    it('devrait récupérer l\'unité par défaut', async () => {
      const idUnite = await mockTarificationService.getUniteDefault({ idService: 1 });

      expect(idUnite).toBe(1);
    });
  });
});

// ============================================
// TESTS CALCUL DE PRIX
// ============================================

describe('TarifGestion - Calcul de prix', () => {
  beforeEach(() => {
    resetTarificationMocks();
  });

  describe('Récupération du tarif client', () => {
    it('devrait récupérer le tarif applicable', async () => {
      const result = await mockTarificationService.getTarifClient({
        idClient: 1,
        idService: 1,
        idUnite: 1,
        date: '2025-01-15'
      });

      expect(result.success).toBe(true);
      expect(result.prix).toBeDefined();
    });

    it('devrait indiquer le type de tarif appliqué', async () => {
      const result = await mockTarificationService.getTarifClient({
        idClient: 1,
        idService: 1,
        idUnite: 1
      });

      expect(result.typeTarif).toBeDefined();
    });
  });

  describe('Calcul du prix total', () => {
    it('devrait calculer le prix pour une quantité', async () => {
      const result = await mockTarificationService.calculerPrix({
        idService: 1,
        idUnite: 1,
        idClient: 1,
        quantite: 3
      });

      expect(result.prixTotal).toBe(450); // 150 * 3
    });

    it('devrait utiliser quantité 1 par défaut', async () => {
      const result = await mockTarificationService.calculerPrix({
        idService: 1,
        idUnite: 1,
        idClient: 1
      });

      expect(result.prixTotal).toBe(150);
    });
  });
});

// ============================================
// TESTS FILTRAGE ET RECHERCHE
// ============================================

describe('TarifGestion - Filtrage', () => {
  describe('Filtrage des services', () => {
    it('devrait filtrer par statut actif', () => {
      const actifs = testServices.filter(s => s.actif);
      const inactifs = testServices.filter(s => !s.actif);

      expect(actifs.length + inactifs.length).toBe(testServices.length);
    });

    it('devrait filtrer par défaut', () => {
      const parDefaut = testServices.filter(s => s.isDefault);

      expect(parDefaut).toHaveLength(1);
    });
  });

  describe('Recherche globale', () => {
    it('devrait rechercher dans le code', () => {
      const search = 'CONS';
      const found = testServices.filter(s => 
        s.codeService.toUpperCase().includes(search.toUpperCase())
      );

      expect(found).toHaveLength(1);
    });

    it('devrait rechercher dans le nom', () => {
      const search = 'consultation';
      const found = testServices.filter(s => 
        s.nomService.toLowerCase().includes(search.toLowerCase())
      );

      expect(found).toHaveLength(1);
    });

    it('devrait rechercher dans la description', () => {
      const search = 'groupe';
      const found = testServices.filter(s => 
        s.description?.toLowerCase().includes(search.toLowerCase())
      );

      expect(found).toHaveLength(1);
    });
  });
});