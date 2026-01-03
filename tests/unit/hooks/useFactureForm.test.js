// tests/unit/hooks/useFactureForm.test.js
// Tests unitaires pour le hook useFactureForm

import React, { useState, useCallback } from 'react';
import { render, act } from '@testing-library/react';

// Mock des constantes
jest.mock('@constants/factureConstants', () => ({
  FORM_MODES: {
    CREATE: 'create',
    EDIT: 'edit',
    VIEW: 'view'
  }
}));

// Helper amélioré pour tester les hooks avec React 18
function renderHook(hookFn) {
  const result = { current: null };
  let rerender;
  
  function TestComponent({ hook }) {
    result.current = hook();
    return null;
  }
  
  const { rerender: rerenderComponent, unmount } = render(
    <TestComponent hook={hookFn} />
  );
  
  rerender = () => rerenderComponent(<TestComponent hook={hookFn} />);
  
  return { result, rerender, unmount };
}

// Import après les mocks
import { useFactureForm } from '@components/factures/hooks/useFactureForm';

describe('useFactureForm', () => {
  describe('État initial', () => {
    it('devrait initialiser avec les valeurs par défaut en mode création', () => {
      const { result } = renderHook(() => useFactureForm('create', null));
      
      expect(result.current.facture).toBeDefined();
      expect(result.current.facture.idFacture).toBe('');
      expect(result.current.facture.numeroFacture).toBe('');
      expect(result.current.facture.idClient).toBeNull();
      expect(result.current.facture.lignes).toEqual([]);
      expect(result.current.facture.ristourne).toBe(0);
      expect(result.current.facture.montantTotal).toBe(0);
    });

    it('devrait être en chargement si idFacture est fourni', () => {
      const { result } = renderHook(() => useFactureForm('edit', 1));
      
      expect(result.current.isLoading).toBe(true);
    });

    it('devrait ne pas être en chargement si idFacture est null', () => {
      const { result } = renderHook(() => useFactureForm('create', null));
      
      expect(result.current.isLoading).toBe(false);
    });

    it('devrait initialiser isSubmitting à false', () => {
      const { result } = renderHook(() => useFactureForm('create', null));
      
      expect(result.current.isSubmitting).toBe(false);
    });

    it('devrait initialiser error à null', () => {
      const { result } = renderHook(() => useFactureForm('create', null));
      
      expect(result.current.error).toBeNull();
    });
  });

  describe('setFacture', () => {
    it('devrait mettre à jour la facture complète', () => {
      const { result } = renderHook(() => useFactureForm('create', null));
      
      const nouvelleFacture = {
        idFacture: 1,
        numeroFacture: '001.2025',
        dateFacture: '2025-01-15',
        idClient: 5,
        montantTotal: 1000,
        montantBrut: 1000,
        montantPayeTotal: 0,
        ristourne: 0,
        totalAvecRistourne: 1000,
        lignes: [{ idLigne: 1 }],
        etat: 'En attente',
        documentPath: null,
        date_annulation: null,
        date_paiement: null
      };
      
      act(() => {
        result.current.setFacture(nouvelleFacture);
      });
      
      expect(result.current.facture).toEqual(nouvelleFacture);
    });

    it('devrait mettre à jour partiellement avec une fonction', () => {
      const { result } = renderHook(() => useFactureForm('create', null));
      
      act(() => {
        result.current.setFacture(prev => ({
          ...prev,
          idClient: 10,
          ristourne: 50
        }));
      });
      
      expect(result.current.facture.idClient).toBe(10);
      expect(result.current.facture.ristourne).toBe(50);
    });
  });

  describe('setIsLoading', () => {
    it('devrait mettre à jour l\'état de chargement', () => {
      const { result } = renderHook(() => useFactureForm('create', null));
      
      act(() => {
        result.current.setIsLoading(true);
      });
      
      expect(result.current.isLoading).toBe(true);
      
      act(() => {
        result.current.setIsLoading(false);
      });
      
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('setIsSubmitting', () => {
    it('devrait mettre à jour l\'état de soumission', () => {
      const { result } = renderHook(() => useFactureForm('create', null));
      
      act(() => {
        result.current.setIsSubmitting(true);
      });
      
      expect(result.current.isSubmitting).toBe(true);
    });
  });

  describe('setError', () => {
    it('devrait définir une erreur', () => {
      const { result } = renderHook(() => useFactureForm('create', null));
      
      act(() => {
        result.current.setError('Une erreur est survenue');
      });
      
      expect(result.current.error).toBe('Une erreur est survenue');
    });

    it('devrait effacer une erreur', () => {
      const { result } = renderHook(() => useFactureForm('create', null));
      
      act(() => {
        result.current.setError('Une erreur');
      });
      
      act(() => {
        result.current.setError(null);
      });
      
      expect(result.current.error).toBeNull();
    });
  });

  describe('setClientData', () => {
    it('devrait stocker les données du client', () => {
      const { result } = renderHook(() => useFactureForm('create', null));
      
      const clientData = {
        id: 1,
        nom: 'Dupont',
        prenom: 'Jean',
        email: 'jean@test.com'
      };
      
      act(() => {
        result.current.setClientData(clientData);
      });
      
      expect(result.current.clientData).toEqual(clientData);
    });
  });

  describe('setIsLignesValid', () => {
    it('devrait mettre à jour la validité des lignes', () => {
      const { result } = renderHook(() => useFactureForm('create', null));
      
      act(() => {
        result.current.setIsLignesValid(true);
      });
      
      expect(result.current.isLignesValid).toBe(true);
    });
  });

  describe('isReadOnly', () => {
    it('devrait être true en mode VIEW', () => {
      const { result } = renderHook(() => useFactureForm('view', 1));
      
      expect(result.current.isReadOnly).toBe(true);
    });

    it('devrait être false en mode CREATE', () => {
      const { result } = renderHook(() => useFactureForm('create', null));
      
      expect(result.current.isReadOnly).toBe(false);
    });

    it('devrait être false en mode EDIT', () => {
      const { result } = renderHook(() => useFactureForm('edit', 1));
      
      expect(result.current.isReadOnly).toBe(false);
    });
  });

  describe('isFormValid', () => {
    it('devrait être true en mode VIEW', () => {
      const { result } = renderHook(() => useFactureForm('view', 1));
      
      expect(result.current.isFormValid).toBe(true);
    });

    it('devrait être falsy si le numéro de facture est vide', () => {
      const { result } = renderHook(() => useFactureForm('create', null));
      
      act(() => {
        result.current.setFacture(prev => ({
          ...prev,
          numeroFacture: '',
          idClient: 1,
          lignes: [{ id: 1 }]
        }));
        result.current.setIsLignesValid(true);
      });
      
      // isFormValid sera falsy (false, '', null, undefined, 0)
      expect(result.current.isFormValid).toBeFalsy();
    });

    it('devrait être falsy si pas de client', () => {
      const { result } = renderHook(() => useFactureForm('create', null));
      
      act(() => {
        result.current.setFacture(prev => ({
          ...prev,
          numeroFacture: '001.2025',
          idClient: null,
          lignes: [{ id: 1 }]
        }));
        result.current.setIsLignesValid(true);
      });
      
      expect(result.current.isFormValid).toBeFalsy();
    });

    it('devrait être falsy si pas de lignes', () => {
      const { result } = renderHook(() => useFactureForm('create', null));
      
      act(() => {
        result.current.setFacture(prev => ({
          ...prev,
          numeroFacture: '001.2025',
          idClient: 1,
          lignes: []
        }));
        result.current.setIsLignesValid(true);
      });
      
      expect(result.current.isFormValid).toBeFalsy();
    });

    it('devrait être falsy si lignes invalides', () => {
      const { result } = renderHook(() => useFactureForm('create', null));
      
      act(() => {
        result.current.setFacture(prev => ({
          ...prev,
          numeroFacture: '001.2025',
          idClient: 1,
          lignes: [{ id: 1 }]
        }));
        result.current.setIsLignesValid(false);
      });
      
      expect(result.current.isFormValid).toBeFalsy();
    });

    it('devrait être truthy si tous les critères sont remplis', () => {
      const { result } = renderHook(() => useFactureForm('create', null));
      
      act(() => {
        result.current.setFacture(prev => ({
          ...prev,
          numeroFacture: '001.2025',
          idClient: 1,
          lignes: [{ id: 1 }]
        }));
        result.current.setIsLignesValid(true);
      });
      
      expect(result.current.isFormValid).toBeTruthy();
    });
  });

  describe('getFormData', () => {
    it('devrait retourner les données du formulaire', () => {
      const { result } = renderHook(() => useFactureForm('create', null));
      
      act(() => {
        result.current.setFacture({
          idFacture: 1,
          numeroFacture: '001.2025',
          dateFacture: '2025-01-15',
          idClient: 5,
          montantTotal: 1000,
          montantBrut: 1000,
          montantPayeTotal: 200,
          ristourne: 50,
          totalAvecRistourne: 950,
          lignes: [{ idLigne: 1, description: 'Test' }],
          etat: 'En attente',
          documentPath: null,
          date_annulation: null,
          date_paiement: null
        });
      });
      
      const formData = result.current.getFormData();
      
      expect(formData.numeroFacture).toBe('001.2025');
      expect(formData.dateFacture).toBe('2025-01-15');
      expect(formData.idClient).toBe(5);
      expect(formData.ristourne).toBe(50);
      expect(formData.montantTotal).toBe(1000);
      expect(formData.lignes).toHaveLength(1);
    });
  });
});