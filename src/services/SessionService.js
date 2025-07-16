// src/services/SessionService.js - VERSION MISE À JOUR avec gestion des booléens
import api from './api';
import { toBoolean, normalizeBooleanFields } from '../utils/booleanHelper'; // ✅ IMPORT du helper

class SessionService {
  constructor() {
    // Bind des méthodes pour éviter les problèmes de contexte 'this'
    this.refreshSession = this.refreshSession.bind(this);
    this.getSessionTimeout = this.getSessionTimeout.bind(this);
    this.getSessionExpiration = this.getSessionExpiration.bind(this);
    this.isSessionExpiring = this.isSessionExpiring.bind(this);
    this.isSessionValid = this.isSessionValid.bind(this);
    this.getSessionInfo = this.getSessionInfo.bind(this);
    this.normalizeSessionData = this.normalizeSessionData.bind(this);
    this.normalizeSessionResponse = this.normalizeSessionResponse.bind(this);
    this.shouldAutoRefresh = this.shouldAutoRefresh.bind(this);
    this.isSessionSecure = this.isSessionSecure.bind(this);
    this.hasSessionChanged = this.hasSessionChanged.bind(this);
    this.getSessionStats = this.getSessionStats.bind(this);
    this.validateSessionSecurity = this.validateSessionSecurity.bind(this);
    
    // ✅ ÉTAT INTERNE POUR LE SUIVI DES SESSIONS
    this.sessionState = {
      lastRefresh: null,
      refreshCount: 0,
      isRefreshing: false,
      autoRefreshEnabled: true,
      securityWarningsEnabled: true,
      trackSessionChanges: true
    };
  }

  /**
   * ✅ NORMALISE LES DONNÉES DE SESSION
   * @param {Object} sessionData - Données de session à normaliser
   * @returns {Object} - Données normalisées
   */
  normalizeSessionData(sessionData) {
    if (!sessionData || typeof sessionData !== 'object') return sessionData;
    
    const booleanFields = [
      'isActive', 'isSecure', 'isExpired', 'isExpiring', 'isValid',
      'autoRefresh', 'rememberMe', 'isAuthenticated', 'hasWarnings',
      'needsRefresh', 'isGuest', 'isAdmin', 'canRefresh'
    ];
    
    const normalized = normalizeBooleanFields(sessionData, booleanFields);
    
    console.log('✅ Données de session normalisées:', normalized);
    return normalized;
  }

  /**
   * ✅ NORMALISE UNE RÉPONSE D'API DE SESSION
   * @param {Object} response - Réponse API à normaliser
   * @returns {Object} - Réponse avec booléens normalisés
   */
  normalizeSessionResponse(response) {
    if (!response || typeof response !== 'object') return response;
    
    const normalized = {
      ...response,
      success: toBoolean(response.success),
      sessionRefreshed: toBoolean(response.sessionRefreshed),
      sessionExtended: toBoolean(response.sessionExtended),
      requiresReauth: toBoolean(response.requiresReauth),
      securityWarning: toBoolean(response.securityWarning),
    };
    
    // Normaliser les données de session si présentes
    if (normalized.sessionData) {
      normalized.sessionData = this.normalizeSessionData(normalized.sessionData);
    }
    
    console.log('✅ Réponse session normalisée:', normalized);
    return normalized;
  }

  /**
   * ✅ RAFRAÎCHIT LA SESSION AVEC GESTION AMÉLIORÉE
   * @param {Object} options - Options pour le rafraîchissement
   * @returns {Promise} Résultat normalisé
   */
  async refreshSession(options = {}) {
    // ✅ VÉRIFICATION DE L'ÉTAT DE RAFRAÎCHISSEMENT
    if (toBoolean(this.sessionState.isRefreshing)) {
      console.log('✅ Rafraîchissement déjà en cours');
      return { 
        success: false, 
        message: 'Rafraîchissement déjà en cours',
        alreadyRefreshing: true 
      };
    }

    try {
      this.sessionState.isRefreshing = true;
      this.sessionState.refreshCount++;
      
      console.log('✅ Rafraîchissement session (tentative #' + this.sessionState.refreshCount + ')');
      
      const requestData = {
        timestamp: Date.now(),
        refreshCount: this.sessionState.refreshCount,
        ...options
      };
      
      const response = await api.post('refresh-session.php', requestData);
      
      // ✅ NORMALISATION DE LA RÉPONSE
      const normalizedResponse = this.normalizeSessionResponse(response);
      
      if (normalizedResponse.success) {
        this.sessionState.lastRefresh = new Date().toISOString();
        
        // ✅ MISE À JOUR DES DONNÉES GLOBALES SI PRÉSENTES
        if (normalizedResponse.sessionData) {
          if (window.USER_DATA) {
            window.USER_DATA = { ...window.USER_DATA, ...normalizedResponse.sessionData };
          }
        }
        
        console.log('✅ Session rafraîchie avec succès');
      } else {
        console.warn('⚠️ Échec du rafraîchissement session:', normalizedResponse.message);
      }
      
      return normalizedResponse;
      
    } catch (error) {
      console.error('❌ Erreur lors du rafraîchissement de session:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors du rafraîchissement',
        error: true
      };
    } finally {
      this.sessionState.isRefreshing = false;
    }
  }

  /**
   * ✅ OBTIENT LE TIMEOUT DE SESSION AVEC GESTION SÉCURISÉE
   * @returns {number} Timeout en secondes
   */
  getSessionTimeout() {
    const config = window.APP_CONFIG || {};
    const timeout = parseInt(config.sessionTimeout) || 1800; // 30 minutes par défaut
    
    // ✅ VALIDATION DE LA VALEUR
    if (timeout < 60) {
      console.warn('⚠️ Timeout de session très court détecté:', timeout);
      return 300; // 5 minutes minimum
    }
    
    if (timeout > 86400) { // 24 heures
      console.warn('⚠️ Timeout de session très long détecté:', timeout);
      return 86400;
    }
    
    return timeout;
  }
  
  /**
   * ✅ OBTIENT L'EXPIRATION DE SESSION AVEC NORMALISATION
   * @returns {number} Timestamp d'expiration
   */
  getSessionExpiration() {
    const userData = window.USER_DATA || {};
    const expiration = parseInt(userData.sessionExpire) || 0;
    
    console.log('✅ Expiration session récupérée:', {
      raw: userData.sessionExpire,
      parsed: expiration,
      readable: expiration > 0 ? new Date(expiration * 1000).toISOString() : 'Non définie'
    });
    
    return expiration;
  }
  
  /**
   * ✅ VÉRIFIE SI LA SESSION EXPIRE BIENTÔT
   * @param {number} warningTime - Temps d'avertissement en secondes (défaut: 5 minutes)
   * @returns {boolean} True si la session expire bientôt
   */
  isSessionExpiring(warningTime = 300) {
    const expireTime = this.getSessionExpiration();
    const currentTime = Math.floor(Date.now() / 1000);
    
    const isExpiring = expireTime > 0 && (expireTime - currentTime) < warningTime;
    
    console.log('✅ Vérification expiration session:', {
      expireTime,
      currentTime,
      timeLeft: expireTime - currentTime,
      warningTime,
      isExpiring
    });
    
    return toBoolean(isExpiring);
  }

  /**
   * ✅ VÉRIFIE SI LA SESSION EST VALIDE
   * @returns {boolean} True si la session est valide
   */
  isSessionValid() {
    const expireTime = this.getSessionExpiration();
    const currentTime = Math.floor(Date.now() / 1000);
    
    // Session valide si pas d'expiration ou si pas encore expirée
    const isValid = expireTime === 0 || expireTime > currentTime;
    
    console.log('✅ Validation session:', {
      expireTime,
      currentTime,
      isValid,
      status: isValid ? 'VALIDE' : 'EXPIRÉE'
    });
    
    return toBoolean(isValid);
  }

  /**
   * ✅ VÉRIFIE SI LA SESSION EST SÉCURISÉE
   * @returns {boolean} True si la session est sécurisée
   */
  isSessionSecure() {
    const userData = window.USER_DATA || {};
    const config = window.APP_CONFIG || {};
    
    // Vérifications de sécurité
    const hasSecureConnection = window.location.protocol === 'https:';
    const hasSecureSession = toBoolean(userData.isSecure);
    const hasCSRFToken = Boolean(userData.csrfToken || config.csrfToken);
    const hasValidFingerprint = Boolean(userData.fingerprint);
    
    const isSecure = hasSecureConnection && hasSecureSession && hasCSRFToken;
    
    console.log('✅ Vérification sécurité session:', {
      hasSecureConnection,
      hasSecureSession,
      hasCSRFToken,
      hasValidFingerprint,
      isSecure
    });
    
    return toBoolean(isSecure);
  }

  /**
   * ✅ DÉTERMINE SI UN RAFRAÎCHISSEMENT AUTO EST NÉCESSAIRE
   * @returns {boolean} True si doit auto-rafraîchir
   */
  shouldAutoRefresh() {
    const config = window.APP_CONFIG || {};
    const userData = window.USER_DATA || {};
    
    const autoRefreshEnabled = toBoolean(
      this.sessionState.autoRefreshEnabled && 
      (config.autoRefreshSession !== false) &&
      (userData.autoRefresh !== false)
    );
    
    const isExpiringSoon = this.isSessionExpiring(600); // 10 minutes
    const isValid = this.isSessionValid();
    const notCurrentlyRefreshing = !toBoolean(this.sessionState.isRefreshing);
    
    const shouldRefresh = autoRefreshEnabled && isExpiringSoon && isValid && notCurrentlyRefreshing;
    
    console.log('✅ Évaluation auto-rafraîchissement:', {
      autoRefreshEnabled,
      isExpiringSoon,
      isValid,
      notCurrentlyRefreshing,
      shouldRefresh
    });
    
    return toBoolean(shouldRefresh);
  }

  /**
   * ✅ VÉRIFIE SI LA SESSION A CHANGÉ
   * @param {Object} previousSessionData - Données de session précédentes
   * @returns {boolean} True si la session a changé
   */
  hasSessionChanged(previousSessionData) {
    if (!toBoolean(this.sessionState.trackSessionChanges)) {
      return false;
    }
    
    const currentData = window.USER_DATA || {};
    const prevData = previousSessionData || {};
    
    // Vérifier les changements importants
    const importantFields = ['sessionExpire', 'isAuthenticated', 'isSecure', 'userId', 'userRole'];
    
    const hasChanged = importantFields.some(field => 
      currentData[field] !== prevData[field]
    );
    
    if (hasChanged) {
      console.log('✅ Changement de session détecté:', {
        previous: prevData,
        current: currentData,
        changedFields: importantFields.filter(field => currentData[field] !== prevData[field])
      });
    }
    
    return toBoolean(hasChanged);
  }

  /**
   * ✅ VALIDE LA SÉCURITÉ DE LA SESSION
   * @returns {Object} Rapport de sécurité
   */
  validateSessionSecurity() {
    const isSecure = this.isSessionSecure();
    const isValid = this.isSessionValid();
    const isExpiring = this.isSessionExpiring();
    
    const securityReport = {
      isSecure,
      isValid,
      isExpiring,
      overall: isSecure && isValid && !isExpiring,
      warnings: [],
      recommendations: []
    };
    
    // Ajouter des avertissements si nécessaire
    if (!isSecure) {
      securityReport.warnings.push('Session non sécurisée');
      securityReport.recommendations.push('Utiliser HTTPS et vérifier les tokens CSRF');
    }
    
    if (isExpiring) {
      securityReport.warnings.push('Session expire bientôt');
      securityReport.recommendations.push('Rafraîchir la session ou se reconnecter');
    }
    
    if (!isValid) {
      securityReport.warnings.push('Session expirée');
      securityReport.recommendations.push('Reconnexion requise');
    }
    
    console.log('✅ Rapport de sécurité session:', securityReport);
    return securityReport;
  }

  /**
   * ✅ OBTIENT LES INFORMATIONS COMPLÈTES DE SESSION
   * @returns {Object} Informations détaillées de session
   */
  getSessionInfo() {
    const expireTime = this.getSessionExpiration();
    const currentTime = Math.floor(Date.now() / 1000);
    const timeoutDuration = this.getSessionTimeout();
    
    const sessionInfo = {
      // Temps
      currentTime,
      expireTime,
      timeoutDuration,
      timeLeft: expireTime > 0 ? Math.max(0, expireTime - currentTime) : -1,
      
      // États booléens normalisés
      isValid: this.isSessionValid(),
      isExpiring: this.isSessionExpiring(),
      isSecure: this.isSessionSecure(),
      shouldAutoRefresh: this.shouldAutoRefresh(),
      
      // État du service
      refreshCount: this.sessionState.refreshCount,
      lastRefresh: this.sessionState.lastRefresh,
      isRefreshing: toBoolean(this.sessionState.isRefreshing),
      
      // Configuration
      autoRefreshEnabled: toBoolean(this.sessionState.autoRefreshEnabled),
      securityWarningsEnabled: toBoolean(this.sessionState.securityWarningsEnabled),
      trackSessionChanges: toBoolean(this.sessionState.trackSessionChanges),
      
      // Formatage lisible
      timeLeftFormatted: this.formatTimeLeft(expireTime > 0 ? expireTime - currentTime : 0),
      expirationFormatted: expireTime > 0 ? new Date(expireTime * 1000).toISOString() : 'Non définie'
    };
    
    console.log('✅ Informations session complètes:', sessionInfo);
    return sessionInfo;
  }

  /**
   * ✅ OBTIENT LES STATISTIQUES DE SESSION
   * @returns {Object} Statistiques détaillées
   */
  getSessionStats() {
    const info = this.getSessionInfo();
    const securityReport = this.validateSessionSecurity();
    
    return {
      ...info,
      security: securityReport,
      performance: {
        refreshCount: this.sessionState.refreshCount,
        averageRefreshTime: this.sessionState.refreshCount > 0 ? 
          (Date.now() - new Date(this.sessionState.lastRefresh || Date.now()).getTime()) / this.sessionState.refreshCount : 0
      }
    };
  }

  /**
   * ✅ FORMATE LE TEMPS RESTANT DE MANIÈRE LISIBLE
   * @param {number} seconds - Secondes restantes
   * @returns {string} Temps formaté
   */
  formatTimeLeft(seconds) {
    if (seconds <= 0) return 'Expiré';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }

  /**
   * ✅ MÉTHODES DE CONFIGURATION
   */
  
  /**
   * Configure le service de session
   * @param {Object} config - Nouvelle configuration
   */
  updateConfig(config) {
    const normalizedConfig = normalizeBooleanFields(config, [
      'autoRefreshEnabled', 'securityWarningsEnabled', 'trackSessionChanges'
    ]);
    
    this.sessionState = { ...this.sessionState, ...normalizedConfig };
    console.log('✅ Configuration session mise à jour:', this.sessionState);
  }

  /**
   * Remet à zéro les statistiques
   */
  resetStats() {
    this.sessionState.refreshCount = 0;
    this.sessionState.lastRefresh = null;
    console.log('✅ Statistiques session remises à zéro');
  }
}

export default new SessionService();