// src/services/authService.js - VERSION MISE À JOUR avec gestion des booléens
import api from './api';
import { toBoolean, normalizeBooleanFields, normalizeBooleanFieldsArray, toBooleanInt } from '../utils/booleanHelper'; // ✅ IMPORT du helper
import { createLogger } from '../utils/createLogger';

const log = createLogger('authService');

log.info('🔐 AuthService configuré avec api.js centralisé et gestion des booléens');

const authService = {
  // ====================================
  // ✅ MÉTHODES DE NORMALISATION
  // ====================================

  /**
   * Normalise un utilisateur avec ses propriétés booléennes
   * @param {Object} user - Utilisateur à normaliser
   * @returns {Object} - Utilisateur avec propriétés booléennes normalisées
   */
  normalizeUser: (user) => {
    if (!user || typeof user !== 'object') return user;
    
    const booleanFields = [
      'actif', 'est_admin', 'est_gestionnaire', 'est_employe', 
      'peut_modifier', 'peut_supprimer', 'peut_creer',
      'notifications_email', 'premiere_connexion'
    ];
    
    return normalizeBooleanFields(user, booleanFields);
  },

  /**
   * Normalise un tableau d'utilisateurs
   * @param {Array} users - Tableau d'utilisateurs à normaliser
   * @returns {Array} - Utilisateurs avec propriétés booléennes normalisées
   */
  normalizeUsers: (users) => {
    if (!Array.isArray(users)) return users;
    
    const booleanFields = [
      'actif', 'compte_actif', 'est_admin', 'est_gestionnaire', 'est_employe',
      'peut_modifier', 'peut_supprimer', 'peut_creer',
      'notifications_email', 'premiere_connexion'
    ];
    
    return normalizeBooleanFieldsArray(users, booleanFields);
  },

  /**
   * Normalise une réponse d'API d'authentification
   * @param {Object} response - Réponse API à normaliser
   * @returns {Object} - Réponse avec booléens normalisés
   */
  normalizeAuthResponse: (response) => {
    if (!response || typeof response !== 'object') return response;
    
    const normalized = {
      ...response,
      // ✅ NORMALISATION DU SUCCESS
      success: toBoolean(response.success),
    };
    
    // ✅ NORMALISATION DE L'UTILISATEUR SI PRÉSENT
    if (normalized.user) {
      normalized.user = authService.normalizeUser(normalized.user);
    }
    
    // ✅ NORMALISATION DES UTILISATEURS SI PRÉSENT (pour getUsers)
    if (normalized.utilisateurs) {
      normalized.utilisateurs = authService.normalizeUsers(normalized.utilisateurs);
    }
    
    return normalized;
  },

  /**
   * Prépare les données utilisateur pour l'API
   * @param {Object} userData - Données utilisateur
   * @returns {Object} - Données préparées pour l'API
   */
  prepareUserDataForApi: (userData) => {
    if (!userData || typeof userData !== 'object') return userData;
    
    const prepared = { ...userData };
    
    // Convertir les booléens en entiers pour l'API si nécessaire
    const booleanFields = [
      'actif', 'est_admin', 'est_gestionnaire', 'est_employe',
      'peut_modifier', 'peut_supprimer', 'peut_creer',
      'notifications_email', 'premiere_connexion'
    ];
    
    booleanFields.forEach(field => {
      if (prepared[field] !== undefined) {
        prepared[field] = toBooleanInt(prepared[field]);
        log.debug(`✅ Conversion ${field}:`, userData[field], '→', prepared[field]);
      }
    });
    
    return prepared;
  },

  // ====================================
  // MÉTHODES D'AUTHENTIFICATION
  // ====================================
  
  login: async (username, password) => {
    try {
      log.info('🔐 Tentative de connexion pour:', username);
      
      const response = await api.post('auth-api.php?login=1', {
        username, 
        password
      });

      log.debug('✅ Réponse login brute:', response);
      
      // ✅ NORMALISATION DE LA RÉPONSE
      const normalizedResponse = authService.normalizeAuthResponse(response);
      log.debug('✅ Réponse login normalisée:', normalizedResponse);
      
      if (normalizedResponse.success) {
        localStorage.setItem('user', JSON.stringify(normalizedResponse.user));
        log.info('✅ Connexion réussie:', normalizedResponse.user);
        
        // TEST: Vérifier immédiatement la session après connexion
        try {
          log.debug('🔍 Test de session immédiatement après connexion...');
          const sessionTest = await api.get('auth-api.php?check_session=1');
          const normalizedSessionTest = authService.normalizeAuthResponse(sessionTest);
          log.debug('🔍 Test session après login (normalisé):', normalizedSessionTest);
        } catch (sessionError) {
          log.error('❌ Session test échoué:', sessionError);
        }
      }
      
      return normalizedResponse;
    } catch (error) {
      log.error('❌ Erreur de connexion:', error);
      throw error;
    }
  },

  checkAuth: async () => {
    try {
      log.info('🔍 Vérification de session...');
      
      const response = await api.get('auth-api.php?check_session=1');
      
      log.debug('🔍 Réponse check auth brute:', response);
      
      // ✅ NORMALISATION DE LA RÉPONSE
      const normalizedResponse = authService.normalizeAuthResponse(response);
      log.debug('🔍 Réponse check auth normalisée:', normalizedResponse);
      
      if (normalizedResponse.success && normalizedResponse.user) {
        localStorage.setItem('user', JSON.stringify(normalizedResponse.user));
        return normalizedResponse;
      } else {
        localStorage.removeItem('user');
        return null;
      }
    } catch (error) {
      log.debug('🔍 Vérification d\'auth échouée:', error.message);
      localStorage.removeItem('user');
      return null;
    }
  },

  logout: async () => {
    try {
      log.info('🚪 Déconnexion...');
      
      const response = await api.delete('auth-api.php?logout=1');
      
      // ✅ NORMALISATION DE LA RÉPONSE
      const normalizedResponse = authService.normalizeAuthResponse(response);
      log.debug('✅ Déconnexion API réussie (normalisée):', normalizedResponse);
      
      return normalizedResponse.success;
    } catch (error) {
      log.error('❌ Erreur de déconnexion', error);
      return false;
    } finally {
      localStorage.removeItem('user');
      
      if (process.env.NODE_ENV === 'development' || process.env.REACT_APP_API_BASE_URL) {
        window.location.reload();
      } else {
        window.location.href = '/';
      }
    }
  },

  getCurrentUser: () => {
    const userString = localStorage.getItem('user');
    if (userString) {
      try {
        const user = JSON.parse(userString);
        // ✅ NORMALISATION PRÉVENTIVE DE L'UTILISATEUR DU CACHE
        return authService.normalizeUser(user);
      } catch (error) {
        log.error('Erreur lors du parsing de l\'utilisateur du localStorage:', error);
        localStorage.removeItem('user');
        return null;
      }
    }
    return null;
  },

  isAuthenticated: () => {
    const user = authService.getCurrentUser();
    // ✅ VÉRIFICATION SÉCURISÉE AVEC BOOLÉEN NORMALISÉ
    return !!(user && toBoolean(user.actif));
  },

  // ====================================
  // MÉTHODES DE GESTION DES UTILISATEURS
  // ====================================

  // Obtenir tous les utilisateurs (admin/gestionnaire)
  getUsers: async () => {
    try {
      log.debug('📋 Récupération des utilisateurs...');
      
      const response = await api.get('auth-api.php?action=utilisateurs');
      
      log.debug('📋 Réponse getUsers brute:', response);
      
      // ✅ NORMALISATION DE LA RÉPONSE
      const normalizedResponse = authService.normalizeAuthResponse(response);
      log.debug('📋 Réponse getUsers normalisée:', normalizedResponse);
      
      return normalizedResponse;
    } catch (error) {
      log.error('❌ Erreur récupération utilisateurs:', error);
      throw error;
    }
  },

  // Créer un nouvel utilisateur (admin/gestionnaire)
  createUser: async (userData) => {
    try {
      log.debug('👤 Création utilisateur (données brutes):', userData);
      
      // ✅ PRÉPARATION DES DONNÉES POUR L'API
      const preparedData = authService.prepareUserDataForApi(userData);
      log.debug('👤 Création utilisateur (données préparées):', preparedData);
      
      const response = await api.post('auth-api.php?action=creer_utilisateur', preparedData);
      
      log.debug('👤 Réponse création brute:', response);
      
      // ✅ NORMALISATION DE LA RÉPONSE
      const normalizedResponse = authService.normalizeAuthResponse(response);
      log.debug('👤 Réponse création normalisée:', normalizedResponse);
      
      return normalizedResponse;
    } catch (error) {
      log.error('❌ Erreur création utilisateur:', error);
      throw error;
    }
  },

  // Modifier un utilisateur existant (admin/gestionnaire)
  updateUser: async (userId, userData) => {
    try {
      log.debug('✏️ Modification utilisateur ID:', userId, 'Data brute:', userData);
      
      // ✅ PRÉPARATION DES DONNÉES POUR L'API
      const preparedData = authService.prepareUserDataForApi(userData);
      log.debug('✏️ Modification utilisateur (données préparées):', preparedData);
      
      const response = await api.put(`auth-api.php?action=modifier_utilisateur&id=${userId}`, preparedData);
      
      log.debug('✏️ Réponse modification brute:', response);
      
      // ✅ NORMALISATION DE LA RÉPONSE
      const normalizedResponse = authService.normalizeAuthResponse(response);
      log.debug('✏️ Réponse modification normalisée:', normalizedResponse);
      
      return normalizedResponse;
    } catch (error) {
      log.error('❌ Erreur modification utilisateur:', error);
      throw error;
    }
  },

  // Supprimer un utilisateur (admin/gestionnaire)
  deleteUser: async (userId) => {
    try {
      log.debug('🗑️ Suppression utilisateur ID:', userId);
      
      const response = await api.delete(`auth-api.php?action=supprimer_utilisateur&id=${userId}`);
      
      log.debug('🗑️ Réponse suppression brute:', response);
      
      // ✅ NORMALISATION DE LA RÉPONSE
      const normalizedResponse = authService.normalizeAuthResponse(response);
      log.debug('🗑️ Réponse suppression normalisée:', normalizedResponse);
      
      return normalizedResponse;
    } catch (error) {
      log.error('❌ Erreur suppression utilisateur:', error);
      throw error;
    }
  },

  // Obtenir un utilisateur spécifique par ID (admin/gestionnaire)
  getUserById: async (userId) => {
    try {
      log.debug('👤 Récupération utilisateur ID:', userId);
      
      const response = await api.get(`auth-api.php?action=utilisateur&id=${userId}`);
      
      log.debug('👤 Réponse getUserById brute:', response);
      
      // ✅ NORMALISATION DE LA RÉPONSE
      const normalizedResponse = authService.normalizeAuthResponse(response);
      log.debug('👤 Réponse getUserById normalisée:', normalizedResponse);
      
      return normalizedResponse;
    } catch (error) {
      log.error('❌ Erreur récupération utilisateur:', error);
      throw error;
    }
  },

  // ====================================
  // MÉTHODES POUR CHANGEMENT DE MOT DE PASSE
  // ====================================

  // Changer le mot de passe (utilisateur connecté)
  changePassword: async (userId, oldPassword, newPassword) => {
    try {
      log.debug('🔑 Changement de mot de passe pour utilisateur ID:', userId);
      
      const response = await api.post('auth-api.php', {
        action: 'changePassword',
        id: userId,
        oldPassword,
        newPassword
      });
      
      log.debug('🔑 Réponse changement mot de passe brute:', response);
      
      // ✅ NORMALISATION DE LA RÉPONSE
      const normalizedResponse = authService.normalizeAuthResponse(response);
      log.debug('🔑 Réponse changement mot de passe normalisée:', normalizedResponse);
      
      return normalizedResponse;
    } catch (error) {
      log.error('❌ Erreur changement mot de passe:', error);
      throw error;
    }
  },

  // ====================================
  // MÉTHODES POUR RESET PASSWORD
  // ====================================

  // Demander une réinitialisation de mot de passe
  requestPasswordReset: async (email) => {
    try {
      log.debug('📧 Demande de réinitialisation pour:', email);
      
      const response = await api.post('auth-api.php?reset_password=1', {
        email: email
      });
      
      log.debug('📧 Réponse réinitialisation brute:', response);
      
      // ✅ NORMALISATION DE LA RÉPONSE
      const normalizedResponse = authService.normalizeAuthResponse(response);
      log.debug('📧 Réponse réinitialisation normalisée:', normalizedResponse);
      
      return normalizedResponse;
    } catch (error) {
      log.error('❌ Erreur demande réinitialisation:', error);
      throw error;
    }
  },

  // Vérifier un token de réinitialisation
  verifyResetToken: async (token) => {
    try {
      log.debug('🔍 Vérification token:', token);
      
      const response = await api.get(`auth-api.php?verify_token=1&token=${encodeURIComponent(token)}`);
      
      log.debug('🔍 Réponse vérification token brute:', response);
      
      // ✅ NORMALISATION DE LA RÉPONSE
      const normalizedResponse = authService.normalizeAuthResponse(response);
      log.debug('🔍 Réponse vérification token normalisée:', normalizedResponse);
      
      return normalizedResponse;
    } catch (error) {
      log.error('❌ Erreur vérification token:', error);
      throw error;
    }
  },

  // Réinitialiser le mot de passe avec un token
  resetPasswordWithToken: async (token, newPassword) => {
    try {
      log.debug('🔄 Réinitialisation avec token:', token);
      
      const response = await api.post('auth-api.php?verify_token=1', {
        token: token,
        password: newPassword
      });
      
      log.debug('🔄 Réponse réinitialisation brute:', response);
      
      // ✅ NORMALISATION DE LA RÉPONSE
      const normalizedResponse = authService.normalizeAuthResponse(response);
      log.debug('🔄 Réponse réinitialisation normalisée:', normalizedResponse);
      
      return normalizedResponse;
    } catch (error) {
      log.error('❌ Erreur réinitialisation:', error);
      throw error;
    }
  },

  // ====================================
  // MÉTHODES ADMIN - DASHBOARD
  // ====================================

  // Récupérer les données du dashboard (admin/gestionnaire)
  getDashboardData: async () => {
    try {
      log.debug('📊 Récupération données dashboard...');
      
      const response = await api.get('auth-api.php?action=dashboard');
      
      log.debug('📊 Réponse dashboard brute:', response);
      
      // ✅ NORMALISATION DE LA RÉPONSE
      const normalizedResponse = authService.normalizeAuthResponse(response);
      log.debug('📊 Réponse dashboard normalisée:', normalizedResponse);
      
      return normalizedResponse;
    } catch (error) {
      log.error('❌ Erreur récupération dashboard:', error);
      throw error;
    }
  },

  // ====================================
  // ✅ MÉTHODES UTILITAIRES POUR PERMISSIONS
  // ====================================

  /**
   * Vérifie si l'utilisateur actuel est admin
   * @returns {boolean} True si l'utilisateur est admin
   */
  isAdmin: () => {
    const user = authService.getCurrentUser();
    return user ? toBoolean(user.est_admin) : false;
  },

  /**
   * Vérifie si l'utilisateur actuel est gestionnaire
   * @returns {boolean} True si l'utilisateur est gestionnaire
   */
  isGestionnaire: () => {
    const user = authService.getCurrentUser();
    return user ? toBoolean(user.est_gestionnaire) : false;
  },

  /**
   * Vérifie si l'utilisateur actuel peut modifier
   * @returns {boolean} True si l'utilisateur peut modifier
   */
  canModify: () => {
    const user = authService.getCurrentUser();
    return user ? toBoolean(user.peut_modifier) : false;
  },

  /**
   * Vérifie si l'utilisateur actuel peut supprimer
   * @returns {boolean} True si l'utilisateur peut supprimer
   */
  canDelete: () => {
    const user = authService.getCurrentUser();
    return user ? toBoolean(user.peut_supprimer) : false;
  },

  /**
   * Vérifie si l'utilisateur actuel peut créer
   * @returns {boolean} True si l'utilisateur peut créer
   */
  canCreate: () => {
    const user = authService.getCurrentUser();
    return user ? toBoolean(user.peut_creer) : false;
  },

  // ====================================
  // MÉTHODES DE DEBUG
  // ====================================

  // Debug des cookies et session
  debugSession: () => {
    log.debug('🍪 DEBUG SESSION:');
    log.debug('document.cookie:', document.cookie);
    
    // Fonction helper pour obtenir PHPSESSID
    const getSessionIdFromCookies = () => {
      const cookies = document.cookie.split(';');
      for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'PHPSESSID') {
          return value;
        }
      }
      return null;
    };
    
    // Vérifier spécifiquement PHPSESSID
    const sessionId = getSessionIdFromCookies();
    if (sessionId) {
      log.debug('✅ PHPSESSID trouvé:', sessionId);
    } else {
      log.debug('❌ PHPSESSID manquant');
    }
    
    return { sessionId };
  },

  // Test de session après login
  testSessionAfterLogin: async () => {
    try {
      log.debug('🔍 Test session immédiatement après login...');
      
      // Debug cookies
      const debugInfo = authService.debugSession();
      
      // Test checkAuth
      const sessionCheck = await authService.checkAuth();
      log.debug('🔍 Session check result:', sessionCheck);
      
      return {
        success: true,
        debugInfo,
        sessionCheck
      };
    } catch (error) {
      log.error('❌ Test session échoué:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  testSessionComplete: async () => {
    log.debug('🧪 === TEST COMPLET DE SESSION ===');
    
    try {
      // 1. État initial
      log.debug('📋 1. État initial:');
      log.debug('   - Cookies:', document.cookie);
      log.debug('   - localStorage user:', localStorage.getItem('user'));
      
      // 2. Debug session côté PHP
      log.debug('📋 2. Debug session PHP:');
      const debugResult = await api.get('auth-api.php?debug_session=1');
      const normalizedDebug = authService.normalizeAuthResponse(debugResult);
      log.debug('   - Réponse debug (normalisée):', normalizedDebug);
      
      // 3. Test de login
      log.debug('📋 3. Test de login:');
      const loginResult = await api.post('auth-api.php?login=1', {
        username: 'test_admin', // Remplace par tes identifiants
        password: 'Test123!'
      });
      const normalizedLogin = authService.normalizeAuthResponse(loginResult);
      log.debug('   - Réponse login (normalisée):', normalizedLogin);
      
      // 4. Attendre que les cookies se propagent
      log.debug('📋 4. Attente propagation cookies (1s)...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 5. Vérifier les cookies après login
      log.debug('📋 5. Cookies après login:');
      log.debug('   - document.cookie:', document.cookie);
      
      // Parser les cookies pour debug
      const cookies = {};
      document.cookie.split(';').forEach(cookie => {
        const [name, value] = cookie.trim().split('=');
        if (name && value) cookies[name] = value;
      });
      log.debug('   - Cookies parsés:', cookies);
      log.debug('   - PHPSESSID trouvé:', cookies.PHPSESSID ? 'OUI' : 'NON');
      
      // 6. Re-debug session après login
      log.debug('📋 6. Re-debug session après login:');
      const debugResult2 = await api.get('auth-api.php?debug_session=1');
      const normalizedDebug2 = authService.normalizeAuthResponse(debugResult2);
      log.debug('   - Session après login (normalisée):', normalizedDebug2);
      
      // 7. Test check_session
      log.debug('📋 7. Test check_session:');
      const checkResult = await api.get('auth-api.php?check_session=1');
      const normalizedCheck = authService.normalizeAuthResponse(checkResult);
      log.debug('   - Check session (normalisée):', normalizedCheck);
      
      // 8. Test getUsers
      log.debug('📋 8. Test getUsers:');
      try {
        const usersResult = await authService.getUsers();
        log.debug('   - Users récupérés:', usersResult.success ? 'OUI' : 'NON');
        log.debug('   - Nombre d\'utilisateurs:', usersResult.utilisateurs?.length || 0);
      } catch (userError) {
        log.debug('   - Erreur getUsers:', userError.message);
      }
      
      // 9. Résumé
      log.debug('📋 9. RÉSUMÉ:');
      log.debug('   - Login:', normalizedLogin.success ? '✅' : '❌');
      log.debug('   - Cookie PHPSESSID:', cookies.PHPSESSID ? '✅' : '❌');
      log.debug('   - Check session:', normalizedCheck.success ? '✅' : '❌');
      
      return {
        success: true,
        results: {
          login: normalizedLogin,
          cookies: cookies,
          debug: normalizedDebug2,
          check: normalizedCheck
        }
      };
      
    } catch (error) {
      log.error('❌ Test complet échoué:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

export default authService;