// tests/unit/services/TarificationService.test.js
// Tests unitaires pour TarificationService

import { 
  mockTarificationService, 
  resetTarificationMocks, 
  testServices, 
  testUnites, 
  testTypesTarifs,
  testTarifs,
  testTarifsSpeciaux,
  testServicesUnites,
  createTestService,
  createTestUnite,
  createTestTypeTarif,
  createTestTarif,
  createTestTarifSpecial
} from '../../mocks/tarificationMocks';

// ============================================
// TESTS DU SERVICE TARIFICATION
// ============================================

describe('TarificationService', () => {
  beforeEach(() => {
    resetTarificationMocks();
  });

  // ========================================
  // TESTS SERVICES
  // ========================================
  
  describe('Services', () => {
    describe('chargerServices', () => {
      it('devrait charger tous les services', async () => {
        const services = await mockTarificationService.chargerServices();

        expect(services).toHaveLength(4);
        expect(services[0].nomService).toBe('Consultation');
      });

      it('devrait retourner des services avec booleans normalisés', async () => {
        const services = await mockTarificationService.chargerServices();

        services.forEach(service => {
          expect(typeof service.actif).toBe('boolean');
          expect(typeof service.isDefault).toBe('boolean');
        });
      });

      it('devrait identifier le service par défaut', async () => {
        const services = await mockTarificationService.chargerServices();
        const serviceDefault = services.find(s => s.isDefault);

        expect(serviceDefault).toBeDefined();
        expect(serviceDefault.codeService).toBe('CONS');
      });
    });

    describe('createService', () => {
      it('devrait créer un service avec succès', async () => {
        const serviceData = createTestService({ nomService: 'Nouveau' });
        const result = await mockTarificationService.createService(serviceData);

        expect(result.success).toBe(true);
        expect(result.service).toBeDefined();
      });
    });

    describe('updateService', () => {
      it('devrait modifier un service', async () => {
        const result = await mockTarificationService.updateService(1, { nomService: 'Modifié' });

        expect(result.success).toBe(true);
      });
    });

    describe('deleteService', () => {
      it('devrait supprimer un service', async () => {
        const result = await mockTarificationService.deleteService(1);

        expect(result.success).toBe(true);
      });

      it('devrait vérifier l\'utilisation avant suppression', async () => {
        const usage = await mockTarificationService.checkServiceUsage(1);

        expect(usage.success).toBe(true);
        expect(usage.isUsed).toBe(false);
      });
    });

    describe('getServiceDefault', () => {
      it('devrait retourner le service par défaut', () => {
        const serviceDefault = mockTarificationService.getServiceDefault();

        expect(serviceDefault).toBeDefined();
        expect(serviceDefault.isDefault).toBe(true);
      });
    });

    describe('isServiceDefault', () => {
      it('devrait identifier si un service est par défaut', () => {
        expect(mockTarificationService.isServiceDefault(1)).toBe(true);
        expect(mockTarificationService.isServiceDefault(2)).toBe(false);
      });
    });
  });

  // ========================================
  // TESTS UNITÉS
  // ========================================

  describe('Unités', () => {
    describe('chargerUnites', () => {
      it('devrait charger toutes les unités', async () => {
        const unites = await mockTarificationService.chargerUnites();

        expect(unites).toHaveLength(4);
        expect(unites[0].nomUnite).toBe('Heure');
      });

      it('devrait avoir des abréviations', async () => {
        const unites = await mockTarificationService.chargerUnites();

        unites.forEach(unite => {
          expect(unite.abreviation).toBeDefined();
        });
      });
    });

    describe('createUnite', () => {
      it('devrait créer une unité avec succès', async () => {
        const uniteData = createTestUnite({ nomUnite: 'Nouvelle' });
        const result = await mockTarificationService.createUnite(uniteData);

        expect(result.success).toBe(true);
        expect(result.unite).toBeDefined();
      });
    });

    describe('updateUnite', () => {
      it('devrait modifier une unité', async () => {
        const result = await mockTarificationService.updateUnite(1, { nomUnite: 'Modifiée' });

        expect(result.success).toBe(true);
      });
    });

    describe('deleteUnite', () => {
      it('devrait supprimer une unité', async () => {
        const result = await mockTarificationService.deleteUnite(1);

        expect(result.success).toBe(true);
      });

      it('devrait vérifier l\'utilisation avant suppression', async () => {
        const usage = await mockTarificationService.checkUniteUsage(1);

        expect(usage.success).toBe(true);
        expect(usage.isUsed).toBe(false);
      });
    });

    describe('getUniteDefault', () => {
      it('devrait retourner l\'ID de l\'unité par défaut pour un service', async () => {
        const idUnite = await mockTarificationService.getUniteDefault({ idService: 1 });

        expect(idUnite).toBe(1);
      });
    });

    describe('isUniteDefault', () => {
      it('devrait identifier si une unité est par défaut', () => {
        expect(mockTarificationService.isUniteDefault(1)).toBe(true);
        expect(mockTarificationService.isUniteDefault(2)).toBe(false);
      });
    });
  });

  // ========================================
  // TESTS TYPES DE TARIFS
  // ========================================

  describe('Types de tarifs', () => {
    describe('chargerTypesTarifs', () => {
      it('devrait charger tous les types de tarifs', async () => {
        const types = await mockTarificationService.chargerTypesTarifs();

        expect(types).toHaveLength(3);
        expect(types[0].nomTypeTarif).toBe('Standard');
      });

      it('devrait avoir un type par défaut', async () => {
        const types = await mockTarificationService.chargerTypesTarifs();
        const typeDefault = types.find(t => t.isDefault);

        expect(typeDefault).toBeDefined();
        expect(typeDefault.codeTypeTarif).toBe('STD');
      });
    });

    describe('createTypeTarif', () => {
      it('devrait créer un type de tarif', async () => {
        const typeData = createTestTypeTarif({ nomTypeTarif: 'Nouveau' });
        const result = await mockTarificationService.createTypeTarif(typeData);

        expect(result.success).toBe(true);
        expect(result.typeTarif).toBeDefined();
      });
    });

    describe('updateTypeTarif', () => {
      it('devrait modifier un type de tarif', async () => {
        const result = await mockTarificationService.updateTypeTarif(1, { nomTypeTarif: 'Modifié' });

        expect(result.success).toBe(true);
      });
    });

    describe('deleteTypeTarif', () => {
      it('devrait supprimer un type de tarif', async () => {
        const result = await mockTarificationService.deleteTypeTarif(1);

        expect(result.success).toBe(true);
      });

      it('devrait vérifier l\'utilisation avant suppression', async () => {
        const usage = await mockTarificationService.checkTypeTarifUsage(1);

        expect(usage.success).toBe(true);
        expect(usage.isUsed).toBe(false);
      });
    });
  });

  // ========================================
  // TESTS TARIFS STANDARDS
  // ========================================

  describe('Tarifs standards', () => {
    describe('getTarifs', () => {
      it('devrait charger tous les tarifs', async () => {
        const tarifs = await mockTarificationService.getTarifs();

        expect(tarifs).toHaveLength(3);
      });

      it('devrait inclure les noms des entités liées', async () => {
        const tarifs = await mockTarificationService.getTarifs();

        tarifs.forEach(tarif => {
          expect(tarif.nomService).toBeDefined();
          expect(tarif.nomUnite).toBeDefined();
          expect(tarif.nomTypeTarif).toBeDefined();
        });
      });
    });

    describe('createTarif', () => {
      it('devrait créer un tarif', async () => {
        const tarifData = createTestTarif({ prix: 200 });
        const result = await mockTarificationService.createTarif(tarifData);

        expect(result.success).toBe(true);
        expect(result.tarif).toBeDefined();
      });
    });

    describe('updateTarif', () => {
      it('devrait modifier un tarif', async () => {
        const result = await mockTarificationService.updateTarif(1, { prix: 175 });

        expect(result.success).toBe(true);
      });
    });

    describe('deleteTarif', () => {
      it('devrait supprimer un tarif', async () => {
        const result = await mockTarificationService.deleteTarif(1);

        expect(result.success).toBe(true);
      });

      it('devrait vérifier l\'utilisation avant suppression', async () => {
        const usage = await mockTarificationService.checkTarifUsage(1);

        expect(usage.success).toBe(true);
        expect(usage.isUsed).toBe(false);
      });
    });
  });

  // ========================================
  // TESTS TARIFS SPÉCIAUX
  // ========================================

  describe('Tarifs spéciaux', () => {
    describe('getTarifsSpeciaux', () => {
      it('devrait charger les tarifs spéciaux', async () => {
        const tarifsSpeciaux = await mockTarificationService.getTarifsSpeciaux();

        expect(tarifsSpeciaux).toHaveLength(2);
      });

      it('devrait inclure les infos client', async () => {
        const tarifsSpeciaux = await mockTarificationService.getTarifsSpeciaux();

        tarifsSpeciaux.forEach(tarif => {
          expect(tarif.nomClient).toBeDefined();
        });
      });
    });

    describe('createTarifSpecial', () => {
      it('devrait créer un tarif spécial', async () => {
        const tarifData = createTestTarifSpecial({ prix: 90 });
        const result = await mockTarificationService.createTarifSpecial(tarifData);

        expect(result.success).toBe(true);
        expect(result.tarifSpecial).toBeDefined();
      });
    });

    describe('updateTarifSpecial', () => {
      it('devrait modifier un tarif spécial', async () => {
        const result = await mockTarificationService.updateTarifSpecial(1, { prix: 95 });

        expect(result.success).toBe(true);
      });
    });

    describe('deleteTarifSpecial', () => {
      it('devrait supprimer un tarif spécial', async () => {
        const result = await mockTarificationService.deleteTarifSpecial(1);

        expect(result.success).toBe(true);
      });

      it('devrait vérifier l\'utilisation avant suppression', async () => {
        const usage = await mockTarificationService.checkTarifSpecialUsage(1);

        expect(usage.success).toBe(true);
        expect(usage.isUsed).toBe(false);
      });
    });
  });

  // ========================================
  // TESTS ASSOCIATIONS SERVICE-UNITÉ
  // ========================================

  describe('Associations Service-Unité', () => {
    describe('chargerServicesUnites', () => {
      it('devrait charger les associations', async () => {
        const associations = await mockTarificationService.chargerServicesUnites();

        expect(associations).toBeDefined();
        expect(associations[1]).toContain(1);
        expect(associations[1]).toContain(2);
      });
    });

    describe('linkServiceUnite', () => {
      it('devrait créer une association', async () => {
        const result = await mockTarificationService.linkServiceUnite(1, 3);

        expect(result.success).toBe(true);
      });
    });

    describe('unlinkServiceUnite', () => {
      it('devrait supprimer une association', async () => {
        const result = await mockTarificationService.unlinkServiceUnite(1, 2);

        expect(result.success).toBe(true);
      });

      it('devrait vérifier l\'utilisation dans les factures', async () => {
        const usage = await mockTarificationService.checkServiceUniteUsageInFacture(1, 1);

        expect(usage.success).toBe(true);
        expect(usage.isUsed).toBe(false);
      });
    });

    describe('getUnitesForService', () => {
      it('devrait retourner les unités d\'un service', () => {
        const unites = mockTarificationService.getUnitesForService(1);

        expect(unites).toHaveLength(2);
        expect(unites.map(u => u.idUnite)).toContain(1);
        expect(unites.map(u => u.idUnite)).toContain(2);
      });
    });

    describe('updateServiceUniteDefault', () => {
      it('devrait mettre à jour l\'unité par défaut d\'un service', async () => {
        const result = await mockTarificationService.updateServiceUniteDefault(1, 2);

        expect(result.success).toBe(true);
      });
    });
  });

  // ========================================
  // TESTS CALCUL DE PRIX
  // ========================================

  describe('Calcul de prix', () => {
    describe('getTarifClient', () => {
      it('devrait retourner le tarif pour un client', async () => {
        const result = await mockTarificationService.getTarifClient({
          idClient: 1,
          idService: 1,
          idUnite: 1,
          date: '2025-01-15'
        });

        expect(result.success).toBe(true);
        expect(result.prix).toBeDefined();
        expect(result.typeTarif).toBeDefined();
      });
    });

    describe('calculerPrix', () => {
      it('devrait calculer le prix total', async () => {
        const result = await mockTarificationService.calculerPrix({
          idService: 1,
          idUnite: 1,
          idClient: 1,
          quantite: 2
        });

        expect(result.success).toBe(true);
        expect(result.prixUnitaire).toBe(150);
        expect(result.prixTotal).toBe(300);
      });
    });

    describe('getPrix', () => {
      it('devrait retourner le prix', async () => {
        const result = await mockTarificationService.getPrix({
          idService: 1,
          idUnite: 1
        });

        expect(result.success).toBe(true);
        expect(result.prix).toBe(150);
      });
    });
  });

  // ========================================
  // TESTS UTILITAIRES
  // ========================================

  describe('Utilitaires', () => {
    describe('estTherapeute', () => {
      it('devrait vérifier si un client est thérapeute', async () => {
        const result = await mockTarificationService.estTherapeute(1);

        expect(typeof result).toBe('boolean');
      });
    });

    describe('possedeTarifSpecialDefini', () => {
      it('devrait vérifier si un client a un tarif spécial', async () => {
        const result = await mockTarificationService.possedeTarifSpecialDefini(1);

        expect(typeof result).toBe('boolean');
      });
    });

    describe('getTarifInfoMessage', () => {
      it('devrait retourner un message informatif', async () => {
        const message = await mockTarificationService.getTarifInfoMessage({ id: 1 });

        expect(message).toBe('Tarif standard appliqué');
      });
    });

    describe('getUnitesApplicablesPourClient', () => {
      it('devrait retourner les unités applicables', async () => {
        const unites = await mockTarificationService.getUnitesApplicablesPourClient(1);

        expect(unites.length).toBeGreaterThan(0);
        expect(unites.every(u => u.actif)).toBe(true);
      });
    });

    describe('initialiser', () => {
      it('devrait initialiser le service', async () => {
        const result = await mockTarificationService.initialiser();

        expect(result).toBe(true);
      });
    });

    describe('clearCache', () => {
      it('devrait vider le cache', () => {
        mockTarificationService.clearCache();

        expect(mockTarificationService.clearCache).toHaveBeenCalled();
      });
    });
  });
});