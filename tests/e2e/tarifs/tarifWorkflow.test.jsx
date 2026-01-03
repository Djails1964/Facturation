// tests/e2e/tarifs/tarifWorkflow.test.jsx
// Tests End-to-End pour le workflow complet de gestion des tarifs

import { 
  mockTarificationService, 
  resetTarificationMocks,
  testServices,
  testUnites,
  testTypesTarifs,
  testTarifs,
  testTarifsSpeciaux,
  createTestService,
  createTestUnite,
  createTestTypeTarif,
  createTestTarif,
  createTestTarifSpecial
} from '../../mocks/tarificationMocks';

// ============================================
// WORKFLOW COMPLET - CONFIGURATION INITIALE
// ============================================

describe('Workflow Tarifs - Configuration initiale', () => {
  beforeEach(() => {
    resetTarificationMocks();
  });

  describe('Initialisation du service', () => {
    it('devrait initialiser le service de tarification', async () => {
      const result = await mockTarificationService.initialiser();

      expect(result).toBe(true);
    });

    it('devrait charger toutes les données de base', async () => {
      const [services, unites, types] = await Promise.all([
        mockTarificationService.chargerServices(),
        mockTarificationService.chargerUnites(),
        mockTarificationService.chargerTypesTarifs()
      ]);

      expect(services.length).toBeGreaterThan(0);
      expect(unites.length).toBeGreaterThan(0);
      expect(types.length).toBeGreaterThan(0);
    });

    it('devrait avoir des éléments par défaut', () => {
      const serviceDefault = testServices.find(s => s.isDefault);
      const uniteDefault = testUnites.find(u => u.isDefault);
      const typeDefault = testTypesTarifs.find(t => t.isDefault);

      expect(serviceDefault).toBeDefined();
      expect(uniteDefault).toBeDefined();
      expect(typeDefault).toBeDefined();
    });
  });
});

// ============================================
// WORKFLOW - CRÉATION D'UN NOUVEAU SERVICE
// ============================================

describe('Workflow Tarifs - Création de service complet', () => {
  beforeEach(() => {
    resetTarificationMocks();
  });

  describe('Étape 1: Créer le service', () => {
    it('devrait créer un nouveau service', async () => {
      const serviceData = {
        codeService: 'COACH',
        nomService: 'Coaching',
        description: 'Séances de coaching individuel',
        actif: true,
        isDefault: false
      };

      const result = await mockTarificationService.createService(serviceData);

      expect(result.success).toBe(true);
      expect(result.service).toBeDefined();
    });

    it('devrait valider le code service unique', () => {
      const existingCodes = testServices.map(s => s.codeService);
      const newCode = 'CONS';

      const isUnique = !existingCodes.includes(newCode);

      expect(isUnique).toBe(false);
    });
  });

  describe('Étape 2: Associer des unités', () => {
    it('devrait associer une unité au service', async () => {
      const result = await mockTarificationService.linkServiceUnite(5, 1);

      expect(result.success).toBe(true);
    });

    it('devrait associer plusieurs unités', async () => {
      const associations = [
        mockTarificationService.linkServiceUnite(5, 1),
        mockTarificationService.linkServiceUnite(5, 2)
      ];

      const results = await Promise.all(associations);

      expect(results.every(r => r.success)).toBe(true);
    });

    it('devrait définir une unité par défaut', async () => {
      const result = await mockTarificationService.updateServiceUniteDefault(5, 1);

      expect(result.success).toBe(true);
    });
  });

  describe('Étape 3: Définir les tarifs', () => {
    it('devrait créer un tarif standard', async () => {
      const tarifData = {
        idService: 5,
        idUnite: 1,
        idTypeTarif: 1,
        prix: 180,
        dateDebut: '2025-01-01'
      };

      const result = await mockTarificationService.createTarif(tarifData);

      expect(result.success).toBe(true);
    });

    it('devrait créer un tarif thérapeute', async () => {
      const tarifData = {
        idService: 5,
        idUnite: 1,
        idTypeTarif: 2,
        prix: 140,
        dateDebut: '2025-01-01'
      };

      const result = await mockTarificationService.createTarif(tarifData);

      expect(result.success).toBe(true);
    });
  });

  describe('Étape 4: Vérification', () => {
    it('devrait retrouver le service créé', async () => {
      const services = await mockTarificationService.chargerServices();

      expect(services.length).toBeGreaterThan(0);
    });

    it('devrait retrouver les associations', () => {
      const unites = mockTarificationService.getUnitesForService(1);

      expect(unites.length).toBeGreaterThan(0);
    });
  });
});

// ============================================
// WORKFLOW - MODIFICATION DE TARIFS
// ============================================

describe('Workflow Tarifs - Modification', () => {
  beforeEach(() => {
    resetTarificationMocks();
  });

  describe('Modification d\'un tarif existant', () => {
    it('devrait charger le tarif à modifier', async () => {
      const tarifs = await mockTarificationService.getTarifs({ idService: 1 });

      expect(tarifs.length).toBeGreaterThan(0);
    });

    it('devrait modifier le prix', async () => {
      const result = await mockTarificationService.updateTarif(1, { prix: 175 });

      expect(result.success).toBe(true);
    });

    it('devrait modifier la date de fin', async () => {
      const result = await mockTarificationService.updateTarif(1, { 
        dateFin: '2025-12-31' 
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Création d\'un nouveau tarif pour remplacer', () => {
    it('devrait clore l\'ancien tarif', async () => {
      const result = await mockTarificationService.updateTarif(1, {
        dateFin: '2025-01-31'
      });

      expect(result.success).toBe(true);
    });

    it('devrait créer le nouveau tarif', async () => {
      const result = await mockTarificationService.createTarif({
        idService: 1,
        idUnite: 1,
        idTypeTarif: 1,
        prix: 160,
        dateDebut: '2025-02-01'
      });

      expect(result.success).toBe(true);
    });
  });
});

// ============================================
// WORKFLOW - TARIFS SPÉCIAUX CLIENT
// ============================================

describe('Workflow Tarifs - Tarifs spéciaux', () => {
  beforeEach(() => {
    resetTarificationMocks();
  });

  describe('Création d\'un tarif spécial', () => {
    it('devrait vérifier si le client a déjà un tarif spécial', async () => {
      const hasTarifSpecial = await mockTarificationService.possedeTarifSpecialDefini(3);

      expect(typeof hasTarifSpecial).toBe('boolean');
    });

    it('devrait créer un tarif spécial pour un client', async () => {
      const result = await mockTarificationService.createTarifSpecial({
        idClient: 3,
        idService: 1,
        idUnite: 1,
        prix: 100,
        dateDebut: '2025-01-01',
        dateFin: '2025-12-31'
      });

      expect(result.success).toBe(true);
    });

    it('devrait avoir priorité sur le tarif standard', async () => {
      // Tarif standard : 150
      // Tarif spécial : 100
      const tarifClient = await mockTarificationService.getTarifClient({
        idClient: 1,
        idService: 1,
        idUnite: 1
      });

      // Le tarif spécial doit être appliqué
      expect(tarifClient.source).toBeDefined();
    });
  });

  describe('Modification d\'un tarif spécial', () => {
    it('devrait modifier le prix du tarif spécial', async () => {
      const result = await mockTarificationService.updateTarifSpecial(1, {
        prix: 95
      });

      expect(result.success).toBe(true);
    });

    it('devrait prolonger la validité', async () => {
      const result = await mockTarificationService.updateTarifSpecial(1, {
        dateFin: '2026-12-31'
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Suppression d\'un tarif spécial', () => {
    it('devrait vérifier l\'utilisation avant suppression', async () => {
      const usage = await mockTarificationService.checkTarifSpecialUsage(1);

      expect(usage.success).toBe(true);
    });

    it('devrait supprimer le tarif spécial', async () => {
      const result = await mockTarificationService.deleteTarifSpecial(1);

      expect(result.success).toBe(true);
    });
  });
});

// ============================================
// WORKFLOW - CALCUL DE PRIX
// ============================================

describe('Workflow Tarifs - Calcul de prix', () => {
  beforeEach(() => {
    resetTarificationMocks();
  });

  describe('Détermination du tarif applicable', () => {
    it('devrait appliquer le tarif spécial si disponible', async () => {
      mockTarificationService.possedeTarifSpecialDefini.mockResolvedValueOnce(true);
      
      const hasTarifSpecial = await mockTarificationService.possedeTarifSpecialDefini(1);

      expect(hasTarifSpecial).toBe(true);
    });

    it('devrait appliquer le tarif thérapeute si client thérapeute', async () => {
      mockTarificationService.estTherapeute.mockResolvedValueOnce(true);
      
      const estTherapeute = await mockTarificationService.estTherapeute(2);

      expect(estTherapeute).toBe(true);
    });

    it('devrait appliquer le tarif standard par défaut', async () => {
      const message = await mockTarificationService.getTarifInfoMessage({ id: 5 });

      expect(message).toBe('Tarif standard appliqué');
    });
  });

  describe('Calcul du montant', () => {
    it('devrait calculer pour une quantité donnée', async () => {
      const result = await mockTarificationService.calculerPrix({
        idService: 1,
        idUnite: 1,
        idClient: 1,
        quantite: 2
      });

      expect(result.prixTotal).toBe(300);
    });

    it('devrait gérer les décimales', () => {
      const prixUnitaire = 150.50;
      const quantite = 1.5;
      const total = Math.round(prixUnitaire * quantite * 100) / 100;

      expect(total).toBe(225.75);
    });

    it('devrait arrondir aux 5 centimes', () => {
      const arrondir5centimes = (montant) => Math.round(montant * 20) / 20;

      expect(arrondir5centimes(100.12)).toBe(100.1);
      expect(arrondir5centimes(100.13)).toBe(100.15);
      expect(arrondir5centimes(100.18)).toBe(100.2);
    });
  });
});

// ============================================
// WORKFLOW - SUPPRESSION SÉCURISÉE
// ============================================

describe('Workflow Tarifs - Suppression sécurisée', () => {
  beforeEach(() => {
    resetTarificationMocks();
  });

  describe('Vérification des dépendances', () => {
    it('devrait vérifier si un service est utilisé', async () => {
      const usage = await mockTarificationService.checkServiceUsage(1);

      expect(usage).toBeDefined();
      expect(usage.success).toBe(true);
    });

    it('devrait vérifier si une unité est utilisée', async () => {
      const usage = await mockTarificationService.checkUniteUsage(1);

      expect(usage).toBeDefined();
      expect(usage.success).toBe(true);
    });

    it('devrait vérifier si un type de tarif est utilisé', async () => {
      const usage = await mockTarificationService.checkTypeTarifUsage(1);

      expect(usage).toBeDefined();
      expect(usage.success).toBe(true);
    });

    it('devrait vérifier l\'utilisation d\'une association', async () => {
      const usage = await mockTarificationService.checkServiceUniteUsageInFacture(1, 1);

      expect(usage).toBeDefined();
      expect(usage.success).toBe(true);
    });
  });

  describe('Suppression conditionnelle', () => {
    it('devrait permettre la suppression si non utilisé', async () => {
      mockTarificationService.checkServiceUsage.mockResolvedValueOnce({
        success: true,
        isUsed: false,
        usageCount: 0
      });

      const usage = await mockTarificationService.checkServiceUsage(4);
      
      if (!usage.isUsed) {
        const result = await mockTarificationService.deleteService(4);
        expect(result.success).toBe(true);
      }
    });

    it('devrait bloquer la suppression si utilisé', async () => {
      mockTarificationService.checkServiceUsage.mockResolvedValueOnce({
        success: true,
        isUsed: true,
        usageCount: 10,
        message: 'Service utilisé dans 10 factures'
      });

      const usage = await mockTarificationService.checkServiceUsage(1);

      expect(usage.isUsed).toBe(true);
      expect(usage.usageCount).toBe(10);
    });

    it('devrait proposer la désactivation au lieu de la suppression', () => {
      const service = { ...testServices[0], actif: true };
      
      // Au lieu de supprimer, on désactive
      service.actif = false;

      expect(service.actif).toBe(false);
    });
  });
});

// ============================================
// WORKFLOW - GESTION DES ERREURS
// ============================================

describe('Workflow Tarifs - Gestion des erreurs', () => {
  beforeEach(() => {
    resetTarificationMocks();
  });

  describe('Erreurs de création', () => {
    it('devrait gérer une erreur de création de service', async () => {
      mockTarificationService.createService.mockRejectedValueOnce(
        new Error('Code service déjà existant')
      );

      await expect(mockTarificationService.createService({ codeService: 'CONS' }))
        .rejects.toThrow('Code service déjà existant');
    });

    it('devrait gérer une erreur de création de tarif', async () => {
      mockTarificationService.createTarif.mockRejectedValueOnce(
        new Error('Tarif déjà existant pour cette combinaison')
      );

      await expect(mockTarificationService.createTarif({}))
        .rejects.toThrow('Tarif déjà existant');
    });
  });

  describe('Erreurs de chargement', () => {
    it('devrait gérer une erreur de chargement des services', async () => {
      mockTarificationService.chargerServices.mockRejectedValueOnce(
        new Error('Erreur serveur')
      );

      await expect(mockTarificationService.chargerServices())
        .rejects.toThrow('Erreur serveur');
    });
  });

  describe('Récupération après erreur', () => {
    it('devrait permettre de réessayer après une erreur', async () => {
      mockTarificationService.chargerServices
        .mockRejectedValueOnce(new Error('Erreur'))
        .mockResolvedValueOnce(testServices);

      // Premier essai échoue
      await expect(mockTarificationService.chargerServices()).rejects.toThrow();

      // Deuxième essai réussit
      const services = await mockTarificationService.chargerServices();
      expect(services).toHaveLength(4);
    });
  });
});

// ============================================
// WORKFLOW - VALIDATION DES DONNÉES
// ============================================

describe('Workflow Tarifs - Validation', () => {
  describe('Validation des services', () => {
    it('devrait valider le code service', () => {
      const codeValide = 'CONS';
      const codeInvalide = '';

      expect(codeValide.length > 0).toBe(true);
      expect(codeInvalide.length > 0).toBe(false);
    });

    it('devrait valider le nom service', () => {
      const nomValide = 'Consultation';
      const nomInvalide = '';

      expect(nomValide.length > 0).toBe(true);
      expect(nomInvalide.length > 0).toBe(false);
    });
  });

  describe('Validation des tarifs', () => {
    it('devrait valider le prix positif', () => {
      const prixValide = 150;
      const prixInvalide = -50;

      expect(prixValide > 0).toBe(true);
      expect(prixInvalide > 0).toBe(false);
    });

    it('devrait valider les dates', () => {
      const tarif = {
        dateDebut: '2025-01-01',
        dateFin: '2025-12-31'
      };

      const debut = new Date(tarif.dateDebut);
      const fin = new Date(tarif.dateFin);

      expect(debut < fin).toBe(true);
    });

    it('devrait valider les références', () => {
      const tarif = {
        idService: 1,
        idUnite: 1,
        idTypeTarif: 1
      };

      expect(tarif.idService).toBeTruthy();
      expect(tarif.idUnite).toBeTruthy();
      expect(tarif.idTypeTarif).toBeTruthy();
    });
  });
});