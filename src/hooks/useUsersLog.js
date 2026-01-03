// src/hooks/useUsersLog.js
// Hook centralisé pour tous les logs de la gestion des utilisateurs
// Utilise useLogger en interne pour afficher les messages selon leur niveau

import { useLogger } from './useLogger';

export const useUsersLog = () => {
  const { log } = useLogger('GestionUtilisateurs');

  return {
    // ===== GESTION DE LISTE =====
    listLoading: () => {
      log.debug('📋 Chargement de la liste des utilisateurs');
    },

    listLoaded: (count) => {
      log.info(`✅ Liste chargée : ${count} utilisateurs`);
    },

    listError: (error) => {
      log.error('❌ Erreur chargement liste', { error: error.message });
    },

    // ===== CRÉATION =====
    createStart: (userData) => {
      log.info('🆕 Création nouvel utilisateur', { username: userData.username });
    },

    createSuccess: (userId, username) => {
      log.info('✅ Utilisateur créé avec succès', { userId, username });
    },

    createError: (error) => {
      log.error('❌ Erreur création utilisateur', { error: error.message });
    },

    createPermissionDenied: () => {
      log.warn('🚫 Création refusée : permissions insuffisantes');
    },

    // ===== MODIFICATION =====
    editStart: (userId, username) => {
      log.info('✏️ Modification utilisateur', { userId, username });
    },

    editSuccess: (userId, username) => {
      log.info('✅ Utilisateur modifié avec succès', { userId, username });
    },

    editError: (error) => {
      log.error('❌ Erreur modification utilisateur', { error: error.message });
    },

    editPermissionDenied: (userId) => {
      log.warn('🚫 Modification refusée : permissions insuffisantes', { userId });
    },

    // ===== SUPPRESSION =====
    deleteStart: (userId, username) => {
      log.info('🗑️ Suppression utilisateur demandée', { userId, username });
    },

    deleteSuccess: (userId, username) => {
      log.info('✅ Utilisateur supprimé avec succès', { userId, username });
    },

    deleteError: (error) => {
      log.error('❌ Erreur suppression utilisateur', { error: error.message });
    },

    deletePermissionDenied: (userId) => {
      log.warn('🚫 Suppression refusée : permissions insuffisantes', { userId });
    },

    // ===== NAVIGATION =====
    openForm: (mode, userId = null) => {
      log.debug(`📋 Ouverture formulaire (mode: ${mode})`, { userId });
    },

    closeForm: () => {
      log.debug('📋 Retour à la liste');
    },

    navigationBlocked: (hasChanges) => {
      if (hasChanges) {
        log.warn('⚠️ Navigation bloquée : modifications non sauvegardées');
      }
    },

    navigationConfirmed: () => {
      log.info('✅ Navigation confirmée sans sauvegarde');
    },

    // ===== VALIDATION =====
    validationError: (errors) => {
      log.warn('⚠️ Erreurs de validation', errors);
    },

    validationSuccess: () => {
      log.debug('✅ Validation réussie');
    },

    // ===== PERMISSIONS =====
    checkPermission: (permission, hasPermission) => {
      log.debug(`🔐 Vérification permission: ${permission}`, { 
        hasPermission 
      });
    }
  };
};