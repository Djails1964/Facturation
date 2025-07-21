// src/utils/urlHelper.js - VERSION CORRIGÉE POUR PRODUCTION

// 🔧 CORRECTION: Accès direct aux variables d'environnement injectées par webpack
const getEnvVar = (varName) => {
  console.log(`🔗 UrlHelper - Recherche de la variable d'environnement: ${varName}`);
  
  // React injecte automatiquement les variables REACT_APP_* dans process.env
  const value = process.env[varName];
  
  if (value !== undefined) {
    console.log(`🔗 UrlHelper - ${varName} trouvé:`, value);
    return value;
  }
  
  console.log(`🔗 UrlHelper - ${varName} non trouvé`);
  return undefined;
};


// Configuration des logs
const getInitialLogConfig = () => {
  const isDevelopment = getEnvVar('NODE_ENV') === 'development';
  const debugUrlsEnv = getEnvVar('REACT_APP_DEBUG_URLS');
  
  let enabled = false;
  
  if (debugUrlsEnv !== undefined) {
    enabled = debugUrlsEnv === 'true';
    console.log('🔗 UrlHelper - Configuration logs depuis REACT_APP_DEBUG_URLS:', enabled);
  } else {
    enabled = isDevelopment;
    console.log('🔗 UrlHelper - Configuration logs depuis NODE_ENV (development):', enabled);
  }
  
  return {
    enabled,
    prefix: '🔗 UrlHelper',
    methods: {
      constructor: true,
      detectBackendConfig: true,
      getBackendBaseUrl: true,
      backendUrl: true,
      exports: true
    }
  };
};

const LOG_CONFIG = getInitialLogConfig();

const log = (method, ...args) => {
  if (LOG_CONFIG.enabled && LOG_CONFIG.methods[method]) {
    console.log(`${LOG_CONFIG.prefix}.${method} -`, ...args);
  }
};

class UrlHelper {
  constructor() {
    log('constructor', 'Initialisation');
    
    this.currentUrl = new URL(window.location.href);
    this.protocol = this.currentUrl.protocol;
    this.host = this.currentUrl.host;
    
    log('constructor', 'URL actuelle:', this.currentUrl.href);
    log('constructor', 'Protocole détecté:', this.protocol);
    log('constructor', 'Host détecté:', this.host);
    
    // Configuration backend
    this.backendConfig = this.detectBackendConfig();
    
    log('constructor', 'Configuration backend finale:', this.backendConfig);
    
    this.appBasePath = this.detectAppBasePath();
    
    log('constructor', 'Initialisation terminée');
  }

  detectBackendConfig() {
    log('detectBackendConfig', 'Détection de la configuration backend');
    
    // 🚨 DEBUG TEMPORAIRE - À ajouter au début de detectBackendConfig()
    console.log('🚨 DEBUG DIRECT - Test variables:');
    console.log('🚨 process available:', typeof process !== 'undefined');
    console.log('🚨 process.env available:', typeof process !== 'undefined' && process.env);
    
    // Test direct des variables webpack
    try {
        // eslint-disable-next-line no-undef
        console.log('🚨 REACT_APP_BACKEND_URL direct:', typeof REACT_APP_BACKEND_URL !== 'undefined' ? REACT_APP_BACKEND_URL : 'UNDEFINED');
    } catch (e) {
        console.log('🚨 REACT_APP_BACKEND_URL ERROR:', e.message);
    }
    
    try {
        // eslint-disable-next-line no-undef
        console.log('🚨 REACT_APP_API_BASE_URL direct:', typeof REACT_APP_API_BASE_URL !== 'undefined' ? REACT_APP_API_BASE_URL : 'UNDEFINED');
    } catch (e) {
        console.log('🚨 REACT_APP_API_BASE_URL ERROR:', e.message);
    }
    
    if (typeof process !== 'undefined' && process.env) {
        console.log('🚨 process.env.REACT_APP_BACKEND_URL:', process.env.REACT_APP_BACKEND_URL);
        console.log('🚨 process.env.REACT_APP_API_BASE_URL:', process.env.REACT_APP_API_BASE_URL);
    }
    // 🚨 FIN DEBUG TEMPORAIRE
    
    // Variables d'environnement avec méthode améliorée
    const envBackendUrl = getEnvVar('REACT_APP_BACKEND_URL');
    const isDevelopment = getEnvVar('NODE_ENV') === 'development';
    const isLocalhost = this.host.includes('localhost') || this.host.includes('127.0.0.1');
    
    log('detectBackendConfig', 'Variables détectées:', {
      envBackendUrl,
      isDevelopment,
      isLocalhost,
      host: this.host
    });
    
    // PRIORITÉ ABSOLUE: Si REACT_APP_BACKEND_URL est défini, l'utiliser TOUJOURS
    if (envBackendUrl) {
      console.log('✅ UrlHelper - REACT_APP_BACKEND_URL trouvé, utilisation prioritaire:', envBackendUrl);
      try {
        const backendUrl = new URL(envBackendUrl);
        const config = {
          protocol: backendUrl.protocol.replace(':', ''),
          host: backendUrl.host,
          basePath: backendUrl.pathname.replace(/\/$/, '')
        };
        
        console.log('✅ UrlHelper - Configuration extraite:', config);
        return config;
      } catch (error) {
        console.error('❌ UrlHelper - Erreur parsing REACT_APP_BACKEND_URL:', envBackendUrl, error);
      }
    }
    
    // FALLBACK AMÉLIORÉ: Si pas de REACT_APP_BACKEND_URL, essayer d'utiliser REACT_APP_API_BASE_URL
    const apiBaseUrl = getEnvVar('REACT_APP_API_BASE_URL');
    if (apiBaseUrl) {
      console.log('⚠️ UrlHelper - REACT_APP_BACKEND_URL non trouvé, utilisation de REACT_APP_API_BASE_URL:', apiBaseUrl);
      try {
        const apiUrl = new URL(apiBaseUrl);
        // Retirer /api de la fin pour obtenir l'URL de base
        let basePath = apiUrl.pathname.replace(/\/api\/?$/, '');
        
        const config = {
          protocol: apiUrl.protocol.replace(':', ''),
          host: apiUrl.host,
          basePath: basePath
        };
        
        console.log('✅ UrlHelper - Configuration extraite de REACT_APP_API_BASE_URL:', config);
        return config;
      } catch (error) {
        console.error('❌ UrlHelper - Erreur parsing REACT_APP_API_BASE_URL:', apiBaseUrl, error);
      }
    }
    
    // Fallback final
    console.warn('🚨 UrlHelper: Aucune variable d\'environnement backend trouvée');
    
    if (isDevelopment || isLocalhost) {
      console.log('UrlHelper - Mode développement détecté');
      return {
        protocol: 'https',
        host: 'localhost',
        basePath: '/fact-back'
      };
    } else {
      console.log('UrlHelper - Mode production par défaut');
      const currentHost = this.host;
      const currentProtocol = this.protocol.replace(':', '');
      
      return {
        protocol: currentProtocol,
        host: currentHost,
        basePath: ''
      };
    }
  }

  detectAppBasePath() {
    const envBasePath = getEnvVar('REACT_APP_BASE_PATH');
    if (envBasePath) {
      return envBasePath;
    }
    
    const pathname = this.currentUrl.pathname;
    const pathParts = pathname.split('/').filter(part => part.length > 0);
    
    if (pathParts.length > 0 && pathParts[0] !== 'static') {
      return '/' + pathParts[0];
    }
    
    return '';
  }

  getBackendBaseUrl() {
    log('getBackendBaseUrl', 'Construction de l\'URL backend');
    log('getBackendBaseUrl', 'Configuration backend:', this.backendConfig);
    
    const { protocol, host, basePath } = this.backendConfig;
    const backendBaseUrl = `${protocol}://${host}${basePath}`;
    
    log('getBackendBaseUrl', 'URL backend finale:', backendBaseUrl);
    
    return backendBaseUrl;
  }

  appUrl(path = '') {
    if (path && !path.startsWith('/')) {
      path = '/' + path;
    }
    
    return `${this.protocol}//${this.host}${this.appBasePath}${path}`;
  }

  backendUrl(path = '', params = {}) {
    console.log('🔍 backendUrl INPUT - path:', path);
    console.log('🔍 backendUrl INPUT - params:', params);
    console.log('🔍 path contains %3F?', path.includes('%3F'));
    log('backendUrl', 'Début Construction de l\'URL backend');
    log('backendUrl', 'Construction URL backend');
    log('backendUrl', 'Path d\'entrée:', path);
    log('backendUrl', 'Paramètres:', params);
    
    // 🚨 DEBUG TEMPORAIRE - À ajouter dans backendUrl()
    console.log('🚨 DEBUG DANS BACKENDURL - Variables disponibles:');
    console.log('🚨 process available:', typeof process !== 'undefined');
    console.log('🚨 process.env available:', typeof process !== 'undefined' && process.env);
    
    // Test direct des variables webpack
    try {
        // eslint-disable-next-line no-undef
        console.log('🚨 REACT_APP_BACKEND_URL direct:', typeof REACT_APP_BACKEND_URL !== 'undefined' ? REACT_APP_BACKEND_URL : 'UNDEFINED');
    } catch (e) {
        console.log('🚨 REACT_APP_BACKEND_URL ERROR:', e.message);
    }
    
    try {
        // eslint-disable-next-line no-undef
        console.log('🚨 REACT_APP_API_BASE_URL direct:', typeof REACT_APP_API_BASE_URL !== 'undefined' ? REACT_APP_API_BASE_URL : 'UNDEFINED');
    } catch (e) {
        console.log('🚨 REACT_APP_API_BASE_URL ERROR:', e.message);
    }
    
    if (typeof process !== 'undefined' && process.env) {
        console.log('🚨 process.env.REACT_APP_BACKEND_URL:', process.env.REACT_APP_BACKEND_URL);
        console.log('🚨 process.env.REACT_APP_API_BASE_URL:', process.env.REACT_APP_API_BASE_URL);
    }
    
    // Test de getEnvVar
    console.log('🚨 getEnvVar(REACT_APP_BACKEND_URL):', getEnvVar('REACT_APP_BACKEND_URL'));
    console.log('🚨 getEnvVar(REACT_APP_API_BASE_URL):', getEnvVar('REACT_APP_API_BASE_URL'));
    
    console.log('🚨 Configuration backend actuelle:', this.backendConfig);
    // 🚨 FIN DEBUG TEMPORAIRE
    
    if (path && !path.startsWith('/')) {
      path = '/' + path;
      log('backendUrl', 'Path ajusté avec /:', path);
    }
    
    const baseUrl = this.getBackendBaseUrl() + path;
    log('backendUrl', 'URL de base construite:', baseUrl);
    
    if (Object.keys(params).length > 0) {
      const queryString = new URLSearchParams(params).toString();
      console.log('🔍 queryString generated:', queryString);
      log('backendUrl', 'Query string construite:', queryString);
      const finalUrl = `${baseUrl}?${queryString}`;
      console.log('🔍 finalUrl before return:', finalUrl);
      console.log('🔍 finalUrl contains %3F?', finalUrl.includes('%3F'));
      log('backendUrl', 'URL finale avec paramètres:', finalUrl);
      return finalUrl;
    }
    
    console.log('🔍 baseUrl without params:', baseUrl);
    log('backendUrl', 'URL finale sans paramètres:', baseUrl);
    return baseUrl;
  }

  emailClientSenderUrlWithSession(requestIdOrResult, additionalParams = {}) {
    console.log('🔍 emailClientSenderUrlWithSession INPUT:', requestIdOrResult);
    if (typeof requestIdOrResult === 'object' && requestIdOrResult.newWindowUrl) {
      console.log('🔍 newWindowUrl detected:', requestIdOrResult.newWindowUrl);
      if (requestIdOrResult.newWindowUrl.startsWith('http')) {
          return requestIdOrResult.newWindowUrl;
      }
        
        const completeUrl = this.getBackendBaseUrl() + '/' + requestIdOrResult.newWindowUrl.replace(/^\//, '');
        console.log('🔍 URL construite:', completeUrl);
        console.log('🔍 Contains %3F?', completeUrl.includes('%3F'));
        return completeUrl;
    }
    
    let requestId;
    let params = { ...additionalParams };
    
    if (typeof requestIdOrResult === 'string') {
      requestId = requestIdOrResult;
    } else if (typeof requestIdOrResult === 'object' && requestIdOrResult.requestId) {
      requestId = requestIdOrResult.requestId;
      if (requestIdOrResult.debug) {
        params.debug = true;
        params.session_transmitted = requestIdOrResult.debug.session_id ? 'yes' : 'no';
      }
    } else {
      console.error('emailClientSenderUrlWithSession: paramètre invalide', requestIdOrResult);
      return this.backendUrl('email_client_sender.php');
    }
    
    if (!requestId) {
      console.error('emailClientSenderUrlWithSession: requestId manquant');
      return this.backendUrl('email_client_sender.php');
    }
    
    params.request_id = requestId;
    return this.backendUrl('email_client_sender.php', params);
  }

  emailClientSenderUrl(requestId, additionalParams = {}) {
    return this.emailClientSenderUrlWithSession(requestId, additionalParams);
  }

  apiUrl(endpoint, params = {}) {
    return this.backendUrl(`api/${endpoint}`, params);
  }

  // 🔧 AJOUT DE LA MÉTHODE MANQUANTE
  facturesUrl(filename) {
    log('facturesUrl', 'Construction URL facture pour:', filename);
    
    if (!filename) {
      console.warn('⚠️ facturesUrl: filename manquant');
      return this.backendUrl('storage/factures/');
    }
    
    // Encoder le nom de fichier pour gérer les caractères spéciaux
    const encodedFilename = encodeURIComponent(filename);
    const factureUrl = this.backendUrl(`storage/factures/${encodedFilename}`);
    
    log('facturesUrl', 'URL facture construite:', factureUrl);
    return factureUrl;
  }

  static setLogging(enabled, methods = null) {
    LOG_CONFIG.enabled = enabled;
    if (methods && Array.isArray(methods)) {
      Object.keys(LOG_CONFIG.methods).forEach(method => {
        LOG_CONFIG.methods[method] = false;
      });
      methods.forEach(method => {
        if (LOG_CONFIG.methods.hasOwnProperty(method)) {
          LOG_CONFIG.methods[method] = true;
        }
      });
    } else if (methods === null) {
      Object.keys(LOG_CONFIG.methods).forEach(method => {
        LOG_CONFIG.methods[method] = enabled;
      });
    }
    
    console.log('🔗 UrlHelper - Configuration des logs mise à jour:', LOG_CONFIG);
  }

  getDebugInfo() {
    return {
      currentUrl: this.currentUrl.href,
      protocol: this.protocol,
      host: this.host,
      appBasePath: this.appBasePath,
      backendBaseUrl: this.getBackendBaseUrl(),
      backendConfig: this.backendConfig,
      envVars: {
        NODE_ENV: getEnvVar('NODE_ENV'),
        REACT_APP_BACKEND_URL: getEnvVar('REACT_APP_BACKEND_URL'),
        REACT_APP_API_BASE_URL: getEnvVar('REACT_APP_API_BASE_URL'),
        REACT_APP_DEBUG_URLS: getEnvVar('REACT_APP_DEBUG_URLS')
      },
      logConfig: LOG_CONFIG
    };
  }
}

// Créer une instance singleton
log('exports', 'Création de l\'instance singleton');
const urlHelper = new UrlHelper();
log('exports', 'Instance singleton créée');

// Exports
export const appUrl = (path) => {
  const result = urlHelper.appUrl(path);
  return result;
};

export const backendUrl = (path, params) => {
  // Encoder automatiquement les segments de chemin problématiques
  if (path) {
    const parts = path.split('/');
    const encodedParts = parts.map((part, index) => {
      // Ne pas encoder les premiers segments (dossiers API standards)
      if (index === 0 && (part === 'api' || part === 'storage')) {
        return part;
      }
      
      // Encoder les noms de fichiers et tout contenu non-ASCII
      if (part.includes('.') || /[^\x00-\x7F]/.test(part) || part.includes(' ')) {
        return encodeURIComponent(part);
      }
      
      return part;
    });
    path = encodedParts.join('/');
  }
  
  const result = urlHelper.backendUrl(path, params);
  return result;
};

export const facturesUrl = (filename) => {
  const result = urlHelper.facturesUrl(filename);
  return result;
};

export const emailClientSenderUrl = (requestId, params) => {
  const result = urlHelper.emailClientSenderUrl(requestId, params);
  return result;
};

export const emailClientSenderUrlWithSession = (requestIdOrResult, params) => {
  const result = urlHelper.emailClientSenderUrlWithSession(requestIdOrResult, params);
  return result;
};

export const apiUrl = (endpoint, params) => {
  const result = urlHelper.apiUrl(endpoint, params);
  return result;
};

export const setUrlLogging = (enabled, methods = null) => {
  UrlHelper.setLogging(enabled, methods);
};

export const configureUrlHelperForEnvironment = () => {
  const isDevelopment = getEnvVar('NODE_ENV') === 'development';
  const isLocalhost = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1';
  const debugUrlsEnv = getEnvVar('REACT_APP_DEBUG_URLS');
  
  if (debugUrlsEnv !== undefined) {
    const enableLogs = debugUrlsEnv === 'true';
    setUrlLogging(enableLogs);
    console.log(`🔗 UrlHelper configuré selon REACT_APP_DEBUG_URLS=${debugUrlsEnv} -> logs=${enableLogs}`);
  } else {
    if (isDevelopment || isLocalhost) {
      setUrlLogging(true);
      console.log('🔗 UrlHelper configuré en mode développement avec logs détaillés');
    } else {
      setUrlLogging(false);
      console.log('🔗 UrlHelper configuré en mode production sans logs');
    }
  }
};

export { UrlHelper };
export default urlHelper;