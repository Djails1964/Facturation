// tests/unit/hooks/useFactureActions.test.js
// Tests unitaires pour le hook useFactureActions

import React from 'react';
import { render, act, waitFor } from '@testing-library/react';
import { mockFactureService, resetAllMocks, mockServiceError } from '../../mocks/services';

// Mock de FactureService (classe)
jest.mock('@services/FactureService', () => {
  return jest.fn().mockImplementation(() => mockFactureService);
});

// Mock de useApiCall
jest.mock('@hooks/useApiCall', () => ({
  useApiCall: () => ({
    execute: jest.fn((fn, onSuccess, onError) => {
      return fn().catch(err => {
        if (onError) onError(err);
        throw err;
      });
    }),
    isLoading: false,
    error: null
  })
}));

// Mock de createLogger
jest.mock('@utils/createLogger', () => ({
  createLogger: () => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  })
}));

// Helper pour tester les hooks avec React 18
function renderHook(hookFn) {
  const result = { current: null };
  
  function TestComponent({ hook }) {
    result.current = hook();
    return null;
  }
  
  const { rerender, unmount } = render(<TestComponent hook={hookFn} />);
  
  return {
    result,
    rerender: () => rerender(<TestComponent hook={hookFn} />),
    unmount
  };
}

// Import après les mocks
import { useFactureActions } from '@components/factures/hooks/useFactureActions';

describe('useFactureActions', () => {
  beforeEach(() => {
    resetAllMocks();
  });

  describe('chargerFactures', () => {
    it('devrait charger les factures avec succès', async () => {
      const { result } = renderHook(() => useFactureActions());
      
      let factures;
      await act(async () => {
        factures = await result.current.chargerFactures(2025);
      });
      
      expect(mockFactureService.chargerFactures).toHaveBeenCalledWith(2025);
      expect(factures).toBeDefined();
      expect(Array.isArray(factures)).toBe(true);
    });

    it('devrait enrichir les factures avec les états d\'affichage', async () => {
      const { result } = renderHook(() => useFactureActions());
      
      await act(async () => {
        await result.current.chargerFactures(2025);
      });
      
      expect(mockFactureService.enrichirFacturesAvecEtatAffichage).toHaveBeenCalled();
    });

    it('devrait gérer les erreurs de chargement', async () => {
      mockServiceError(mockFactureService, 'chargerFactures', 'Erreur réseau');
      
      const { result } = renderHook(() => useFactureActions());
      
      await expect(async () => {
        await act(async () => {
          await result.current.chargerFactures(2025);
        });
      }).rejects.toThrow('Erreur réseau');
    });
  });

  describe('chargerFacture', () => {
    it('devrait charger une facture spécifique', async () => {
      const { result } = renderHook(() => useFactureActions());
      
      let facture;
      await act(async () => {
        facture = await result.current.chargerFacture(1);
      });
      
      expect(mockFactureService.getFacture).toHaveBeenCalledWith(1);
      expect(facture).toBeDefined();
    });

    it('devrait gérer une facture non trouvée', async () => {
      mockFactureService.getFacture.mockResolvedValueOnce(null);
      
      const { result } = renderHook(() => useFactureActions());
      
      await expect(async () => {
        await act(async () => {
          await result.current.chargerFacture(999);
        });
      }).rejects.toThrow('Aucune donnée de facture trouvée');
    });
  });

  describe('creerFacture', () => {
    it('devrait créer une facture avec succès', async () => {
      const { result } = renderHook(() => useFactureActions());
      
      const factureData = {
        idClient: 1,
        dateFacture: '2025-01-15',
        lignes: [{ idService: 1, quantite: 2, prixUnitaire: 100 }]
      };
      
      let response;
      await act(async () => {
        response = await result.current.creerFacture(factureData);
      });
      
      expect(mockFactureService.createFacture).toHaveBeenCalledWith(factureData);
      expect(response.success).toBe(true);
    });

    it('devrait gérer les erreurs de création', async () => {
      mockServiceError(mockFactureService, 'createFacture', 'Erreur création');
      
      const { result } = renderHook(() => useFactureActions());
      
      await expect(async () => {
        await act(async () => {
          await result.current.creerFacture({});
        });
      }).rejects.toThrow('Erreur création');
    });
  });

  describe('modifierFacture', () => {
    it('devrait modifier une facture avec succès', async () => {
      const { result } = renderHook(() => useFactureActions());
      
      const modifications = { ristourne: 50 };
      
      let response;
      await act(async () => {
        response = await result.current.modifierFacture(1, modifications);
      });
      
      expect(mockFactureService.updateFacture).toHaveBeenCalledWith(1, modifications);
      expect(response.success).toBe(true);
    });
  });

  describe('supprimerFacture', () => {
    it('devrait supprimer une facture avec succès', async () => {
      const { result } = renderHook(() => useFactureActions());
      
      let response;
      await act(async () => {
        response = await result.current.supprimerFacture(1);
      });
      
      expect(mockFactureService.deleteFacture).toHaveBeenCalledWith(1);
      expect(response).toBe(true);
    });
  });

  describe('annulerFacture', () => {
    it('devrait annuler une facture avec succès', async () => {
      const { result } = renderHook(() => useFactureActions());
      
      let response;
      await act(async () => {
        response = await result.current.annulerFacture(1);
      });
      
      expect(mockFactureService.annulerFacture).toHaveBeenCalledWith(1);
      expect(response.success).toBe(true);
    });
  });

  describe('getProchainNumeroFacture', () => {
    it('devrait récupérer le prochain numéro de facture', async () => {
      const { result } = renderHook(() => useFactureActions());
      
      let numero;
      await act(async () => {
        numero = await result.current.getProchainNumeroFacture(2025);
      });
      
      expect(mockFactureService.getProchainNumeroFacture).toHaveBeenCalledWith(2025);
      expect(numero).toBe('004.2025');
    });
  });

  describe('enrichirFacturesAvecEtat', () => {
    it('devrait enrichir les factures avec les états', async () => {
      const { result } = renderHook(() => useFactureActions());
      
      const factures = [
        { idFacture: 1, etat: 'En attente' },
        { idFacture: 2, etat: 'Payée' }
      ];
      
      let enrichies;
      await act(async () => {
        enrichies = await result.current.enrichirFacturesAvecEtat(factures);
      });
      
      expect(mockFactureService.enrichirFacturesAvecEtatAffichage).toHaveBeenCalledWith(factures);
      expect(enrichies).toBeDefined();
      expect(enrichies[0].etatAffichage).toBeDefined();
    });
  });

  describe('imprimerFacture', () => {
    it('devrait imprimer une facture', async () => {
      const { result } = renderHook(() => useFactureActions());
      
      let response;
      await act(async () => {
        response = await result.current.imprimerFacture(1);
      });
      
      expect(mockFactureService.imprimerFacture).toHaveBeenCalledWith(1);
      expect(response.success).toBe(true);
    });
  });

  describe('envoyerFactureParEmail', () => {
    it('devrait envoyer une facture par email', async () => {
      const { result } = renderHook(() => useFactureActions());
      
      const emailData = {
        destinataire: 'test@example.com',
        sujet: 'Votre facture',
        message: 'Veuillez trouver ci-joint...'
      };
      
      let response;
      await act(async () => {
        response = await result.current.envoyerFactureParEmail(1, emailData);
      });
      
      expect(mockFactureService.envoyerFactureParEmail).toHaveBeenCalledWith(1, emailData);
      expect(response.success).toBe(true);
    });
  });

  describe('getFactureUrl', () => {
    it('devrait récupérer l\'URL d\'une facture', async () => {
      const { result } = renderHook(() => useFactureActions());
      
      let response;
      await act(async () => {
        response = await result.current.getFactureUrl(1);
      });
      
      expect(mockFactureService.getFactureUrl).toHaveBeenCalledWith(1);
      expect(response.success).toBe(true);
    });
  });

  describe('marquerCommePayee', () => {
    it('devrait marquer une facture comme payée', async () => {
      const { result } = renderHook(() => useFactureActions());
      
      const paiementData = { montant: 500, datePaiement: '2025-01-20' };
      
      let response;
      await act(async () => {
        response = await result.current.marquerCommePayee(1, paiementData);
      });
      
      expect(mockFactureService.marquerCommePayee).toHaveBeenCalledWith(1, paiementData);
      expect(response.success).toBe(true);
    });
  });

  describe('clearCache', () => {
    it('devrait vider le cache', () => {
      const { result } = renderHook(() => useFactureActions());
      
      act(() => {
        result.current.clearCache();
      });
      
      expect(mockFactureService._clearCache).toHaveBeenCalled();
    });
  });

  describe('retourne toutes les actions', () => {
    it('devrait retourner toutes les actions nécessaires', () => {
      const { result } = renderHook(() => useFactureActions());
      
      // Actions CRUD
      expect(result.current.chargerFactures).toBeDefined();
      expect(result.current.chargerFacture).toBeDefined();
      expect(result.current.creerFacture).toBeDefined();
      expect(result.current.modifierFacture).toBeDefined();
      expect(result.current.supprimerFacture).toBeDefined();
      
      // Actions d'état
      expect(result.current.marquerCommePayee).toBeDefined();
      expect(result.current.annulerFacture).toBeDefined();
      expect(result.current.marquerCommeImprimee).toBeDefined();
      expect(result.current.marquerCommeEnvoyee).toBeDefined();
      
      // Actions documents
      expect(result.current.getFactureUrl).toBeDefined();
      expect(result.current.imprimerFacture).toBeDefined();
      expect(result.current.envoyerFactureParEmail).toBeDefined();
      
      // Numérotation
      expect(result.current.getProchainNumeroFacture).toBeDefined();
      
      // Utilitaires
      expect(result.current.enrichirFacturesAvecEtat).toBeDefined();
      expect(result.current.clearCache).toBeDefined();
    });
  });
});