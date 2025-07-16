// src/services/activityLogsService.js - Service frontend pour les logs d'activité avec gestion des booléens

import api from './api'; // Utilise votre api.js existant
import { toBoolean, normalizeBooleanFields, normalizeBooleanFieldsArray } from '../utils/booleanHelper'; // ✅ IMPORT du helper

const activityLogsService = {
  // ====================================
  // ✅ MÉTHODES DE NORMALISATION
  // ====================================

  /**
   * Normalise un log d'activité avec ses propriétés booléennes
   * @param {Object} log - Log à normaliser
   * @returns {Object} - Log avec propriétés booléennes normalisées
   */
  normalizeLog: (log) => {
    if (!log || typeof log !== 'object') return log;
    
    const booleanFields = [
      'success', 'is_critical', 'is_resolved', 'is_archived',
      'requires_attention', 'auto_generated', 'is_system'
    ];
    
    return normalizeBooleanFields(log, booleanFields);
  },

  /**
   * Normalise un tableau de logs
   * @param {Array} logs - Tableau de logs à normaliser
   * @returns {Array} - Logs avec propriétés booléennes normalisées
   */
  normalizeLogs: (logs) => {
    if (!Array.isArray(logs)) return logs;
    
    const booleanFields = [
      'success', 'is_critical', 'is_resolved', 'is_archived',
      'requires_attention', 'auto_generated', 'is_system'
    ];
    
    return normalizeBooleanFieldsArray(logs, booleanFields);
  },

  /**
   * Normalise une réponse d'API des logs
   * @param {Object} response - Réponse API à normaliser
   * @returns {Object} - Réponse avec booléens normalisés
   */
  normalizeLogsResponse: (response) => {
    if (!response || typeof response !== 'object') return response;
    
    const normalized = {
      ...response,
      // ✅ NORMALISATION DU SUCCESS
      success: toBoolean(response.success),
    };
    
    // ✅ NORMALISATION DES LOGS SI PRÉSENTS
    if (normalized.logs) {
      normalized.logs = activityLogsService.normalizeLogs(normalized.logs);
    }
    
    // ✅ NORMALISATION DES STATISTIQUES SI PRÉSENTES
    if (normalized.stats) {
      normalized.stats = {
        ...normalized.stats,
        has_critical: toBoolean(normalized.stats.has_critical),
        has_unresolved: toBoolean(normalized.stats.has_unresolved),
        auto_cleanup_enabled: toBoolean(normalized.stats.auto_cleanup_enabled),
      };
    }
    
    return normalized;
  },

  /**
   * Récupère les logs d'activité avec filtres et pagination
   * 
   * @param {Object} filters - Filtres à appliquer
   * @param {number} page - Numéro de page (défaut: 1)
   * @param {number} limit - Nombre d'éléments par page (défaut: 50)
   * @returns {Promise} Résultat de l'API avec booléens normalisés
   */
  getLogs: async (filters = {}, page = 1, limit = 50) => {
    try {
      console.log('📋 Récupération logs d\'activité...');
      console.log('📋 Filtres:', filters);
      console.log('📋 Page:', page, 'Limit:', limit);
      
      // Construire les paramètres de requête
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters
      });
      
      const response = await api.get(`activity-logs-api.php?${params}`);
      
      console.log('📋 Réponse logs brute:', response);
      
      // ✅ NORMALISATION DE LA RÉPONSE
      const normalizedResponse = activityLogsService.normalizeLogsResponse(response);
      console.log('📋 Réponse logs normalisée:', normalizedResponse);
      
      return normalizedResponse;
    } catch (error) {
      console.error('❌ Erreur récupération logs:', error);
      throw error;
    }
  },

  /**
   * Export des logs en CSV
   * 
   * @param {Object} filters - Filtres à appliquer pour l'export
   * @returns {Promise} URL de téléchargement
   */
  exportToCsv: async (filters = {}) => {
    try {
      console.log('📥 Export logs vers CSV...');
      console.log('📥 Filtres export:', filters);
      
      // Construire les paramètres avec export=csv
      const params = new URLSearchParams({
        export: 'csv',
        ...filters
      });
      
      // Utiliser l'API helper pour construire l'URL complète
      const { apiUrl } = await import('../utils/urlHelper');
      const downloadUrl = apiUrl(`activity-logs-api.php?${params}`);
      
      console.log('📥 URL export:', downloadUrl);
      
      // Déclencher le téléchargement
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `activity-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      return { 
        success: true, 
        message: 'Export initié',
        downloadUrl: downloadUrl
      };
    } catch (error) {
      console.error('❌ Erreur export logs:', error);
      throw error;
    }
  },

  /**
   * Récupère les logs pour un utilisateur spécifique
   * 
   * @param {number} userId - ID de l'utilisateur
   * @param {Object} additionalFilters - Filtres additionnels
   * @returns {Promise} Logs de l'utilisateur normalisés
   */
  getUserLogs: async (userId, additionalFilters = {}) => {
    return activityLogsService.getLogs({
      user_id: userId,
      ...additionalFilters
    });
  },

  /**
   * Récupère les logs par type d'action
   * 
   * @param {string} actionType - Type d'action à filtrer
   * @param {Object} additionalFilters - Filtres additionnels
   * @returns {Promise} Logs filtrés par action normalisés
   */
  getLogsByAction: async (actionType, additionalFilters = {}) => {
    return activityLogsService.getLogs({
      action_type: actionType,
      ...additionalFilters
    });
  },

  /**
   * Récupère les logs par sévérité
   * 
   * @param {string} severity - Niveau de sévérité (info, warning, error, critical)
   * @param {Object} additionalFilters - Filtres additionnels
   * @returns {Promise} Logs filtrés par sévérité normalisés
   */
  getLogsBySeverity: async (severity, additionalFilters = {}) => {
    return activityLogsService.getLogs({
      severity: severity,
      ...additionalFilters
    });
  },

  /**
   * ✅ NOUVELLES MÉTHODES AVEC FILTRES BOOLÉENS
   */

  /**
   * Récupère uniquement les logs critiques
   * @param {Object} additionalFilters - Filtres additionnels
   * @returns {Promise} Logs critiques
   */
  getCriticalLogs: async (additionalFilters = {}) => {
    return activityLogsService.getLogs({
      is_critical: true,
      ...additionalFilters
    });
  },

  /**
   * Récupère les logs non résolus
   * @param {Object} additionalFilters - Filtres additionnels
   * @returns {Promise} Logs non résolus
   */
  getUnresolvedLogs: async (additionalFilters = {}) => {
    return activityLogsService.getLogs({
      is_resolved: false,
      ...additionalFilters
    });
  },

  /**
   * Récupère les logs système uniquement
   * @param {Object} additionalFilters - Filtres additionnels
   * @returns {Promise} Logs système
   */
  getSystemLogs: async (additionalFilters = {}) => {
    return activityLogsService.getLogs({
      is_system: true,
      ...additionalFilters
    });
  },

  /**
   * Récupère les logs d'échec uniquement
   * @param {Object} additionalFilters - Filtres additionnels
   * @returns {Promise} Logs d'échec
   */
  getFailedLogs: async (additionalFilters = {}) => {
    return activityLogsService.getLogs({
      success: false,
      ...additionalFilters
    });
  },

  /**
   * Récupère les logs d'aujourd'hui
   * 
   * @param {Object} additionalFilters - Filtres additionnels
   * @returns {Promise} Logs du jour normalisés
   */
  getTodayLogs: async (additionalFilters = {}) => {
    const today = new Date().toISOString().split('T')[0];
    return activityLogsService.getLogs({
      date_from: today,
      date_to: today,
      ...additionalFilters
    });
  },

  /**
   * Récupère les logs des 7 derniers jours
   * 
   * @param {Object} additionalFilters - Filtres additionnels
   * @returns {Promise} Logs de la semaine normalisés
   */
  getLastWeekLogs: async (additionalFilters = {}) => {
    const today = new Date();
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    return activityLogsService.getLogs({
      date_from: lastWeek.toISOString().split('T')[0],
      date_to: today.toISOString().split('T')[0],
      ...additionalFilters
    });
  },

  /**
   * ✅ MÉTHODES D'ACTIONS SUR LES LOGS
   */

  /**
   * Marque un log comme résolu
   * @param {number} logId - ID du log
   * @returns {Promise} Résultat de l'action
   */
  markAsResolved: async (logId) => {
    try {
      console.log('✅ Marquage log comme résolu:', logId);
      
      const response = await api.post('activity-logs-api.php', {
        action: 'mark_resolved',
        log_id: logId
      });
      
      console.log('✅ Réponse mark resolved brute:', response);
      
      // ✅ NORMALISATION DE LA RÉPONSE
      const normalizedResponse = activityLogsService.normalizeLogsResponse(response);
      console.log('✅ Réponse mark resolved normalisée:', normalizedResponse);
      
      return normalizedResponse;
    } catch (error) {
      console.error('❌ Erreur marquage résolu:', error);
      throw error;
    }
  },

  /**
   * Archive un log
   * @param {number} logId - ID du log
   * @returns {Promise} Résultat de l'action
   */
  archiveLog: async (logId) => {
    try {
      console.log('📦 Archivage log:', logId);
      
      const response = await api.post('activity-logs-api.php', {
        action: 'archive',
        log_id: logId
      });
      
      console.log('📦 Réponse archive brute:', response);
      
      // ✅ NORMALISATION DE LA RÉPONSE
      const normalizedResponse = activityLogsService.normalizeLogsResponse(response);
      console.log('📦 Réponse archive normalisée:', normalizedResponse);
      
      return normalizedResponse;
    } catch (error) {
      console.error('❌ Erreur archivage log:', error);
      throw error;
    }
  },

  /**
   * Obtient les statistiques des logs
   * @param {Object} filters - Filtres pour les statistiques
   * @returns {Promise} Statistiques avec booléens normalisés
   */
  getLogsStatistics: async (filters = {}) => {
    try {
      console.log('📊 Récupération statistiques logs...');
      
      const params = new URLSearchParams({
        action: 'statistics',
        ...filters
      });
      
      const response = await api.get(`activity-logs-api.php?${params}`);
      
      console.log('📊 Réponse stats brute:', response);
      
      // ✅ NORMALISATION DE LA RÉPONSE
      const normalizedResponse = activityLogsService.normalizeLogsResponse(response);
      console.log('📊 Réponse stats normalisée:', normalizedResponse);
      
      return normalizedResponse;
    } catch (error) {
      console.error('❌ Erreur récupération stats:', error);
      throw error;
    }
  },

  /**
   * Constantes pour les types d'actions et sévérités
   */
  ACTION_TYPES: {
    AUTH_LOGIN: 'auth_login',
    AUTH_LOGOUT: 'auth_logout',
    AUTH_FAILED: 'auth_failed',
    AUTH_PASSWORD_RESET: 'auth_password_reset',
    USER_CREATE: 'user_create',
    USER_UPDATE: 'user_update',
    USER_DELETE: 'user_delete',
    USER_ROLE_CHANGE: 'user_role_change',
    FACTURE_CREATE: 'facture_create',
    FACTURE_UPDATE: 'facture_update',
    FACTURE_DELETE: 'facture_delete',
    FACTURE_SEND: 'facture_send',
    CLIENT_CREATE: 'client_create',
    CLIENT_UPDATE: 'client_update',
    CLIENT_DELETE: 'client_delete',
    SYSTEM_ERROR: 'system_error',
    SYSTEM_BACKUP: 'system_backup',
    SYSTEM_MAINTENANCE: 'system_maintenance',
    ACCESS_DENIED: 'access_denied'
  },

  SEVERITIES: {
    INFO: 'info',
    WARNING: 'warning',
    ERROR: 'error',
    CRITICAL: 'critical'
  },

  /**
   * ✅ MÉTHODES UTILITAIRES AVEC GESTION DES BOOLÉENS
   */

  /**
   * Vérifie si un log est critique
   * @param {Object} log - Log à vérifier
   * @returns {boolean} True si le log est critique
   */
  isLogCritical: (log) => {
    return log ? toBoolean(log.is_critical) : false;
  },

  /**
   * Vérifie si un log est résolu
   * @param {Object} log - Log à vérifier
   * @returns {boolean} True si le log est résolu
   */
  isLogResolved: (log) => {
    return log ? toBoolean(log.is_resolved) : false;
  },

  /**
   * Vérifie si un log nécessite une attention
   * @param {Object} log - Log à vérifier
   * @returns {boolean} True si le log nécessite une attention
   */
  requiresAttention: (log) => {
    return log ? toBoolean(log.requires_attention) : false;
  },

  /**
   * Vérifie si un log est un log système
   * @param {Object} log - Log à vérifier
   * @returns {boolean} True si c'est un log système
   */
  isSystemLog: (log) => {
    return log ? toBoolean(log.is_system) : false;
  },

  /**
   * Vérifie si une action a réussi
   * @param {Object} log - Log à vérifier
   * @returns {boolean} True si l'action a réussi
   */
  wasSuccessful: (log) => {
    return log ? toBoolean(log.success) : false;
  },

  /**
   * Labels traduits pour l'affichage
   */
  getActionTypeLabel: (actionType) => {
    const labels = {
      'auth_login': 'Connexion',
      'auth_logout': 'Déconnexion',
      'auth_failed': 'Échec connexion',
      'auth_password_reset': 'Reset mot de passe',
      'user_create': 'Création utilisateur',
      'user_update': 'Modification utilisateur',
      'user_delete': 'Suppression utilisateur',
      'user_role_change': 'Changement rôle',
      'facture_create': 'Création facture',
      'facture_update': 'Modification facture',
      'facture_delete': 'Suppression facture',
      'facture_send': 'Envoi facture',
      'client_create': 'Création client',
      'client_update': 'Modification client',
      'client_delete': 'Suppression client',
      'system_error': 'Erreur système',
      'system_backup': 'Sauvegarde',
      'system_maintenance': 'Maintenance',
      'access_denied': 'Accès refusé'
    };
    
    return labels[actionType] || actionType;
  },

  getSeverityLabel: (severity) => {
    const labels = {
      'info': 'Info',
      'warning': 'Avertissement',
      'error': 'Erreur',
      'critical': 'Critique'
    };
    
    return labels[severity] || severity;
  },

  /**
   * ✅ NOUVEAUX HELPERS POUR L'AFFICHAGE
   */

  /**
   * Obtient la classe CSS selon la sévérité et l'état
   * @param {Object} log - Log à analyser
   * @returns {string} Classe CSS appropriée
   */
  getLogDisplayClass: (log) => {
    if (!log) return 'log-default';
    
    const isCritical = activityLogsService.isLogCritical(log);
    const isResolved = activityLogsService.isLogResolved(log);
    const wasSuccessful = activityLogsService.wasSuccessful(log);
    
    if (isCritical && !isResolved) return 'log-critical-unresolved';
    if (isCritical && isResolved) return 'log-critical-resolved';
    if (!wasSuccessful) return 'log-failed';
    if (log.severity === 'warning') return 'log-warning';
    if (log.severity === 'error') return 'log-error';
    
    return 'log-info';
  },

  /**
   * Obtient l'icône appropriée pour un log
   * @param {Object} log - Log à analyser
   * @returns {string} Nom de l'icône
   */
  getLogIcon: (log) => {
    if (!log) return 'info';
    
    const isCritical = activityLogsService.isLogCritical(log);
    const wasSuccessful = activityLogsService.wasSuccessful(log);
    const isSystem = activityLogsService.isSystemLog(log);
    
    if (isCritical) return 'alert-triangle';
    if (!wasSuccessful) return 'x-circle';
    if (isSystem) return 'settings';
    if (log.severity === 'warning') return 'alert-circle';
    if (log.severity === 'error') return 'x-octagon';
    
    return 'info';
  }
};

export default activityLogsService;