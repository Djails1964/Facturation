// src/components/users/hooks/useUsers.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { useLogger } from '../../../hooks/useLogger';
import authService from '../../../services/authService';

/**
 * Hook personnalisé pour la gestion des utilisateurs
 * Centralise les appels API et l'état local des utilisateurs
 * Les notifications sont gérées par les composants parents
 *
 * @returns {Object} { users, loading, error, fetchUsers, createUser, updateUser, deleteUser }
 */
export const useUsers = () => {
  const { log } = useLogger('useUsers');

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // ✅ Track si le hook est déjà monté pour éviter la boucle infinie
  const hasInitialized = useRef(false);

  /**
   * Récupère la liste complète des utilisateurs depuis l'API
   */
  const fetchUsers = useCallback(async () => {
    log.info('Chargement de la liste des utilisateurs');
    setLoading(true);
    setError(null);
    
    try {
      const response = await authService.getUsers();
      
      if (response?.success && response?.utilisateurs) {
        log.info('Utilisateurs récupérés', { count: response.utilisateurs.length });
        setUsers(response.utilisateurs);
      } else {
        log.warn('Réponse API invalide');
        setUsers([]);
      }
    } catch (err) {
      log.error('Erreur lors du chargement', { error: err.message });
      setError(err.message || 'Erreur lors du chargement des utilisateurs');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [log]);

  /**
   * Crée un nouvel utilisateur
   * @param {Object} userData - Données du nouvel utilisateur
   * @returns {Promise<Object>} Réponse de l'API
   */
  const createUser = useCallback(async (userData) => {
    log.info('Création d\'un utilisateur', { username: userData.username });
    setLoading(true);
    setError(null);
    
    try {
      const response = await authService.createUser(userData);
      
      if (response?.success) {
        log.info('Utilisateur créé avec succès', { userId: response.userId });
        await fetchUsers();
        return response;
      } else {
        const message = response?.message || 'Erreur lors de la création';
        log.error('Création échouée', { message });
        throw new Error(message);
      }
    } catch (err) {
      log.error('Erreur création utilisateur', { error: err.message });
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [log, fetchUsers]);

  /**
   * Modifie un utilisateur existant
   * @param {number} userId - ID de l'utilisateur
   * @param {Object} userData - Données à modifier
   * @returns {Promise<Object>} Réponse de l'API
   */
  const updateUser = useCallback(async (userId, userData) => {
    log.info('Modification d\'un utilisateur', { userId });
    setLoading(true);
    setError(null);
    
    try {
      const response = await authService.updateUser(userId, userData);
      
      if (response?.success) {
        log.info('Utilisateur modifié avec succès', { userId });
        await fetchUsers();
        return response;
      } else {
        const message = response?.message || 'Erreur lors de la modification';
        log.error('Modification échouée', { message });
        throw new Error(message);
      }
    } catch (err) {
      log.error('Erreur modification utilisateur', { error: err.message });
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [log, fetchUsers]);

  /**
   * Supprime un utilisateur
   * @param {number} userId - ID de l'utilisateur à supprimer
   * @returns {Promise<Object>} Réponse de l'API
   */
  const deleteUser = useCallback(async (userId) => {
    log.info('Suppression d\'un utilisateur', { userId });
    setLoading(true);
    setError(null);
    
    try {
      const response = await authService.deleteUser(userId);
      
      if (response?.success) {
        log.info('Utilisateur supprimé avec succès', { userId });
        await fetchUsers();
        return response;
      } else {
        const message = response?.message || 'Erreur lors de la suppression';
        log.error('Suppression échouée', { message });
        throw new Error(message);
      }
    } catch (err) {
      log.error('Erreur suppression utilisateur', { error: err.message });
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [log, fetchUsers]);

  /**
   * ✅ CORRECTION : Charge les utilisateurs UNIQUEMENT au montage du hook
   * Utilise useRef pour éviter la boucle infinie
   */
  useEffect(() => {
    // Vérifier que c'est le premier rendu
    if (!hasInitialized.current) {
      log.info('Montage du hook useUsers - Chargement initial');
      hasInitialized.current = true;
      fetchUsers();
    }
    
    // Pas de dépendance sur fetchUsers pour éviter la boucle !
    // fetchUsers lui-même dépend de [log], ce qui changerait à chaque rendu
  }, []); // ✅ Tableau de dépendance vide = une seule exécution au montage

  return {
    users,
    loading,
    error,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser
  };
};

export default useUsers;