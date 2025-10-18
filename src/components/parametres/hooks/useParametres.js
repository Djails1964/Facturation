// src/components/parametres/hooks/useParametres.js
/**
 * Hook personnalisé pour la gestion des paramètres
 * Centralise toute la logique métier
 */

import { useState, useCallback, useMemo } from 'react';
import ParametreService from '../../../services/ParametreService';
import { useNotifications } from '../../../services/NotificationService';
import {
  PARAMETRE_SUCCESS_MESSAGES,
  PARAMETRE_ERROR_MESSAGES,
  PARAMETRE_STATE_MESSAGES
} from '../../../constants/parametreConstants';
import {
  normalizeParametresStructure,
  prepareParametresForSubmit
} from '../helpers/parametreHelpers';

export const useParametres = () => {
  const [parametresStructure, setParametresStructure] = useState({});
  const [modifiedValues, setModifiedValues] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // ✅ Créer le service une seule fois
  const parametreService = useMemo(() => new ParametreService(), []);
  const { showSuccess, showError, showInfo } = useNotifications();

  /**
   * Charge tous les paramètres
   */
  const fetchParametres = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🚀 Chargement des paramètres...');
      const result = await parametreService.getAllParametres();
      
      if (!result.success) {
        throw new Error(result.message || PARAMETRE_ERROR_MESSAGES.LOAD_FAILED);
      }

      const parametres = result.parametres;
      
      if (!parametres || Object.keys(parametres).length === 0) {
        showInfo(PARAMETRE_STATE_MESSAGES.EMPTY);
        return;
      }

      console.log('✅ Paramètres chargés:', parametres);
      const normalized = normalizeParametresStructure(parametres);
      setParametresStructure(normalized);
      
    } catch (err) {
      console.error('❌ Erreur chargement paramètres:', err);
      setError(err.message);
      showError(err.message || PARAMETRE_ERROR_MESSAGES.LOAD_FAILED);
    } finally {
      setLoading(false);
    }
  }, [parametreService, showInfo, showError]); // ✅ Dépendances stables

  /**
   * Modifie la valeur d'un paramètre
   */
  const updateParametreValue = useCallback((parametreId, updates) => {
    setModifiedValues(prev => ({
      ...prev,
      [parametreId]: {
        ...prev[parametreId],
        ...updates
      }
    }));
  }, []);

  /**
   * Sauvegarde les modifications
   */
  const saveParametres = useCallback(async () => {
    if (Object.keys(modifiedValues).length === 0) {
      showInfo('Aucune modification à enregistrer');
      return { success: true };
    }

    setLoading(true);
    
    try {
      console.log('💾 Sauvegarde des paramètres:', modifiedValues);
      
      const parametresToSave = prepareParametresForSubmit(modifiedValues);
      console.log('📤 Données préparées:', parametresToSave);
      
      const results = await Promise.all(
        parametresToSave.map(param => parametreService.updateParametre(param))
      );
      
      const allSuccess = results.every(res => res.success);
      
      if (allSuccess) {
        showSuccess(PARAMETRE_SUCCESS_MESSAGES.SAVE);
        setModifiedValues({});
        await fetchParametres(); // Recharger
        return { success: true };
      } else {
        const errorMessages = results
          .filter(res => !res.success)
          .map(res => res.message || 'Erreur inconnue')
          .join(', ');
        
        throw new Error(errorMessages);
      }
    } catch (err) {
      console.error('❌ Erreur sauvegarde:', err);
      showError(err.message || PARAMETRE_ERROR_MESSAGES.SAVE_FAILED);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [modifiedValues, parametreService, showSuccess, showError, showInfo, fetchParametres]);

  /**
   * Réinitialise les modifications
   */
  const resetModifications = useCallback(() => {
    setModifiedValues({});
  }, []);

  /**
   * Vérifie s'il y a des modifications
   */
  const hasModifications = useCallback(() => {
    return Object.keys(modifiedValues).length > 0;
  }, [modifiedValues]);

  return {
    // État
    parametresStructure,
    modifiedValues,
    loading,
    error,
    
    // Actions
    fetchParametres,
    updateParametreValue,
    saveParametres,
    resetModifications,
    
    // Utilitaires
    hasModifications
  };
};