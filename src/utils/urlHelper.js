// src/utils/urlHelper.js - VERSION SIMPLIFIÉE POUR ARCHITECTURE PROXY (même domaine)

// Configuration des logs
const getEnvVar = (varName) => {
  const value = process.env[varName];
  return value !== undefined ? value : undefined;
};

const isDevelopment = getEnvVar('NODE_ENV') === 'development';
const debugUrls = getEnvVar('REACT_APP_DEBUG_URLS') === 'true';

const LOG_ENABLED = isDevelopment || debugUrls;

const log = (method, ...args) => {
  if (LOG_ENABLED) {
    console.log(`🔗 UrlHelper.${method} -`, ...args);
  }
};

class UrlHelper {
  constructor() {
    log('constructor', 'Initialisation');
    
    this.currentUrl = new URL(window.location.href);
    this.protocol = this.currentUrl.protocol;
    this.host = this.currentUrl.host;
    this.origin = this.currentUrl.origin;
    
    // Configuration pour l'architecture proxy
    this.backendConfig = this.detectBackendConfig();
    this.appBasePath = this.detectAppBasePath();
    
    log('constructor', 'Configuration finale:', {
      origin: this.origin,
      backendConfig: this.backendConfig,
      appBasePath: this.appBasePath
    });
  }

  detectBackendConfig() {
    log('detectBackendConfig', 'Détection de la configuration backend');
    
    // PRIORITÉ 1: Variable d'environnement REACT_APP_BACKEND_URL (URL complète)
    const envBackendUrl = getEnvVar('REACT_APP_BACKEND_URL');
    if (envBackendUrl) {
      log('detectBackendConfig', 'REACT_APP_BACKEND_URL trouvé:', envBackendUrl);
      
      // Si c'est une URL relative (commence par /), utiliser l'origin actuel
      if (envBackendUrl.startsWith('/')) {
        return {
          baseUrl: this.origin,
          apiPath: envBackendUrl.replace(/\/$/, ''),
          isRelative: true
        };
      }
      
      // URL absolue
      try {
        const url = new URL(envBackendUrl);
        return {
          baseUrl: url.origin,
          apiPath: url.pathname.replace(/\/$/, ''),
          isRelative: false
        };
      } catch (e) {
        log('detectBackendConfig', 'Erreur parsing URL:', e.message);
      }
    }
    
    // PRIORITÉ 2: Variable d'environnement REACT_APP_API_BASE_URL
    const envApiBaseUrl = getEnvVar('REACT_APP_API_BASE_URL');
    if (envApiBaseUrl) {
      log('detectBackendConfig', 'REACT_APP_API_BASE_URL trouvé:', envApiBaseUrl);
      
      // URL relative (recommandée pour architecture proxy)
      if (envApiBaseUrl.startsWith('/')) {
        return {
          baseUrl: this.origin,
          apiPath: envApiBaseUrl.replace(/\/$/, ''),
          isRelative: true
        };
      }
      
      // URL absolue
      try {
        const url = new URL(envApiBaseUrl);
        return {
          baseUrl: url.origin,
          apiPath: url.pathname.replace(/\/$/, ''),
          isRelative: false
        };
      } catch (e) {
        log('detectBackendConfig', 'Erreur parsing URL:', e.message);
      }
    }
    
    // FALLBACK: Utiliser le même domaine avec /api
    log('detectBackendConfig', 'Fallback: même domaine avec /api');
    return {
      baseUrl: this.origin,
      apiPath: '/api',
      isRelative: true
    };
  }

  detectAppBasePath() {
    const envBasePath = getEnvVar('REACT_APP_BASE_PATH');
    if (envBasePath) {
      return envBasePath;
    }
    return '';
  }

  /**
   * Construit l'URL de base du backend
   */
  getBackendBaseUrl() {
    const { baseUrl, apiPath, isRelative } = this.backendConfig;
    
    if (isRelative) {
      // Architecture proxy: même domaine
      return this.origin;
    }
    
    return baseUrl;
  }

  /**
   * Construit une URL vers le backend
   * @param {string} path - Chemin relatif (ex: 'api/client-api.php')
   * @param {object} params - Paramètres query string
   */
  backendUrl(path = '', params = {}) {
    log('backendUrl', 'Construction URL pour:', path);
    
    // Normaliser le path
    if (path && !path.startsWith('/')) {
      path = '/' + path;
    }
    
    const { baseUrl, isRelative } = this.backendConfig;
    let fullUrl;
    
    if (isRelative) {
      // Architecture proxy: URL relative au même domaine
      fullUrl = `${this.origin}${path}`;
    } else {
      // Cross-domain: URL absolue
      fullUrl = `${baseUrl}${path}`;
    }
    
    // Ajouter les paramètres query string
    if (Object.keys(params).length > 0) {
      const queryString = new URLSearchParams(params).toString();
      fullUrl = `${fullUrl}?${queryString}`;
    }
    
    log('backendUrl', 'URL finale:', fullUrl);
    return fullUrl;
  }

  /**
   * Construit une URL vers l'API
   * @param {string} endpoint - Endpoint API (ex: 'client-api.php')
   * @param {object} params - Paramètres query string
   */
  apiUrl(endpoint, params = {}) {
    const { apiPath } = this.backendConfig;
    const path = `${apiPath}/${endpoint}`.replace(/\/+/g, '/');
    return this.backendUrl(path, params);
  }

  /**
   * Construit une URL vers l'application frontend
   */
  appUrl(path = '') {
    if (path && !path.startsWith('/')) {
      path = '/' + path;
    }
    return `${this.origin}${this.appBasePath}${path}`;
  }

  /**
   * Construit une URL vers un fichier facture
   */
  facturesUrl(filename) {
    if (!filename) {
      console.warn('⚠️ facturesUrl: filename manquant');
      return this.backendUrl('/storage/factures/');
    }
    
    const encodedFilename = encodeURIComponent(filename);
    return this.backendUrl(`/storage/factures/${encodedFilename}`);
  }

  /**
   * Construit l'URL pour l'envoi d'email via client
   */
  emailClientSenderUrl(requestIdOrResult, additionalParams = {}) {
    // Si c'est un objet avec newWindowUrl, l'utiliser directement
    if (typeof requestIdOrResult === 'object' && requestIdOrResult.newWindowUrl) {
      const newWindowUrl = requestIdOrResult.newWindowUrl;
      if (newWindowUrl.startsWith('http')) {
        return newWindowUrl;
      }
      return this.apiUrl(newWindowUrl.replace(/^\//, '')); // CORRECTION: apiUrl
    }
    
    // Sinon, construire l'URL avec le requestId
    let requestId;
    let params = { ...additionalParams };
    
    if (typeof requestIdOrResult === 'string') {
      requestId = requestIdOrResult;
    } else if (typeof requestIdOrResult === 'object' && requestIdOrResult.requestId) {
      requestId = requestIdOrResult.requestId;
    } else {
      console.error('emailClientSenderUrl: paramètre invalide', requestIdOrResult);
      return this.apiUrl('email_client_sender.php'); // CORRECTION: apiUrl
    }
    
    if (requestId) {
      params.request_id = requestId;
    }
    
    return this.apiUrl('email_client_sender.php', params); // CORRECTION: apiUrl
  }

  emailClientSenderUrlWithSession(requestIdOrResult, additionalParams = {}) {
    return this.emailClientSenderUrl(requestIdOrResult, additionalParams);
  }

  /**
   * Retourne les informations de debug
   */
  getDebugInfo() {
    return {
      currentUrl: this.currentUrl.href,
      origin: this.origin,
      backendConfig: this.backendConfig,
      appBasePath: this.appBasePath,
      envVars: {
        NODE_ENV: getEnvVar('NODE_ENV'),
        REACT_APP_BACKEND_URL: getEnvVar('REACT_APP_BACKEND_URL'),
        REACT_APP_API_BASE_URL: getEnvVar('REACT_APP_API_BASE_URL'),
        REACT_APP_DEBUG_URLS: getEnvVar('REACT_APP_DEBUG_URLS')
      }
    };
  }

  /**
   * Configure le niveau de log
   */
  static setLogging(enabled) {
    // Note: Dans cette version simplifiée, on ne peut pas changer dynamiquement
    console.log(`🔗 UrlHelper - Logging ${enabled ? 'activé' : 'désactivé'}`);
  }
}

// Instance singleton
const urlHelper = new UrlHelper();

// Exports
export const appUrl = (path) => urlHelper.appUrl(path);
export const backendUrl = (path, params) => urlHelper.backendUrl(path, params);
export const apiUrl = (endpoint, params) => urlHelper.apiUrl(endpoint, params);
export const facturesUrl = (filename) => urlHelper.facturesUrl(filename);
export const emailClientSenderUrl = (requestId, params) => urlHelper.emailClientSenderUrl(requestId, params);
export const emailClientSenderUrlWithSession = (requestIdOrResult, params) => urlHelper.emailClientSenderUrlWithSession(requestIdOrResult, params);
export const setUrlLogging = (enabled) => UrlHelper.setLogging(enabled);

export const configureUrlHelperForEnvironment = () => {
  const debugInfo = urlHelper.getDebugInfo();
  console.log('🔗 UrlHelper configuration:', debugInfo);
};

export { UrlHelper };
export default urlHelper;