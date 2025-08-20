// src/services/api.js - Version avec conversion GET intégrée

import axios from 'axios';
import FieldConverter from '../utils/FieldConverter';
import { API_ENDPOINTS_MAPPING, toApiFormatWithDateHandling } from '../constants/fieldMappings';

console.log('=================DEBUG API.JS-START=================');
console.log("window.APP_CONFIG: ", window.APP_CONFIG);
console.log("process.env.REACT_APP_API_BASE_URL:", process.env.REACT_APP_API_BASE_URL);
console.log("window.location:", window.location);
console.log("window.location.origin:", window.location.origin);
console.log('==================DEBUG API.JS-END==================');

// ============================================
// CONFIGURATION FIELD CONVERTER depuis constants
// ============================================

/**
 * ✅ Configuration utilisant API_ENDPOINTS_MAPPING depuis fieldMappings.js
 */
const ENDPOINT_CONVERSION_CONFIG = { ...API_ENDPOINTS_MAPPING };

/**
 * Détermine si un endpoint doit être converti automatiquement
 */
const shouldConvertEndpoint = (url) => {
  if (!url) return false;
  
  // Vérifier les exclusions
  if (ENDPOINT_CONVERSION_CONFIG.skipConversion.some(skip => url.includes(skip))) {
    return false;
  }
  
  // Vérifier les inclusions
  return ENDPOINT_CONVERSION_CONFIG.autoConvert.some(endpoint => url.includes(endpoint));
};

/**
 * Obtient le contexte de conversion pour un endpoint
 */
const getConversionContext = (url) => {
  if (!url) return null;
  
  for (const [endpoint, context] of Object.entries(ENDPOINT_CONVERSION_CONFIG.contextMapping)) {
    if (url.includes(endpoint)) {
      return context;
    }
  }
  
  return null; // Utiliser les mappings par défaut
};

// ============================================
// GESTION SESSION CENTRALISÉE (existant)
// ============================================

// Fonction pour obtenir la session ID depuis les cookies
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

// Fonction pour ajouter la session à l'URL si nécessaire
const addSessionToUrl = (url) => {
  const sessionId = getSessionIdFromCookies();
  if (sessionId) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}PHPSESSID=${sessionId}`;
  }
  return url;
};

// Déterminer l'URL de base pour les API avec priorité aux variables d'environnement
const determineBaseUrl = () => {
  // Variables d'environnement React (mode séparé)
  if (process.env.REACT_APP_API_BASE_URL) {
    const envUrl = process.env.REACT_APP_API_BASE_URL;
    const finalUrl = envUrl.endsWith('/') ? envUrl : `${envUrl}/`;
    console.log('🌍 Utilisation des variables d\'environnement:', finalUrl);
    return finalUrl;
  }
  
  // Configuration window.APP_CONFIG (mode hybride)
  if (window.APP_CONFIG?.apiEndpoint) {
    const endpoint = window.APP_CONFIG.apiEndpoint;
    const finalUrl = endpoint.endsWith('/') ? endpoint : `${endpoint}/`;
    console.log('🪟 Utilisation de window.APP_CONFIG:', finalUrl);
    return finalUrl;
  }
  
  // URL par défaut selon l'environnement
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 Mode développement - URL par défaut');
    return 'https://localhost/fact-back/api/';
  } else {
    console.log('🚀 Mode production - Chemin relatif');
    return '/api/';
  }
};

const apiBaseUrl = determineBaseUrl();
console.log("🎯 API Base URL finale:", apiBaseUrl);

// Configuration avec CORS pour le mode séparé
const defaultConfig = {
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  },
  // 🔧 Configuration CORS pour mode séparé
  withCredentials: true, // Important pour les cookies de session
  validateStatus: status => status < 500,
  timeout: window.APP_CONFIG?.timeout || 30000
};

// Configuration HTTPS pour certificats auto-signés
if (apiBaseUrl.startsWith('https://localhost')) {
  console.log('🔒 Configuration HTTPS localhost détectée');
  // Pour les certificats auto-signés en développement
  defaultConfig.httpsAgent = new axios.create().defaults.httpsAgent;
}

// Logs de débogage
console.log('📋 Configuration API:', { 
  apiBaseUrl,
  baseURL: defaultConfig.baseURL,
  windowConfig: window.APP_CONFIG,
  environment: process.env.NODE_ENV,
  withCredentials: defaultConfig.withCredentials
});

// Créer l'instance Axios
const apiClient = axios.create(defaultConfig);

// Ajouter le token d'API s'il est disponible
if (window.APP_CONFIG?.apiToken) {
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${window.APP_CONFIG.apiToken}`;
  console.log('🔑 Token API ajouté');
}

// ============================================
// NOUVELLE FONCTION : EXTRACTION ET CONVERSION DES PARAMÈTRES D'URL
// ============================================

/**
 * Extrait les paramètres d'une URL et les convertit
 * @param {string} url - URL avec paramètres
 * @returns {Object} { baseUrl, convertedParams }
 */
function extractAndConvertUrlParams(url) {
  if (!url || !url.includes('?')) {
    return { baseUrl: url, convertedParams: {} };
  }
  
  const [baseUrl, queryString] = url.split('?');
  const params = {};
  
  // Parser les paramètres de l'URL
  const searchParams = new URLSearchParams(queryString);
  for (const [key, value] of searchParams.entries()) {
    params[key] = value;
  }
  
  console.log('🔍 Paramètres extraits de l\'URL:', params);
  
  // Convertir les paramètres si l'endpoint doit être converti
  if (shouldConvertEndpoint(baseUrl)) {
    const context = getConversionContext(baseUrl);
    console.log('🔄 Conversion des paramètres d\'URL:', { baseUrl, context, originalParams: params });
    
    const convertedParams = FieldConverter.toApiFormat(params, {
      context,
      preserveUnknown: true
    });
    
    console.log('✅ Paramètres d\'URL convertis:', convertedParams);
    return { baseUrl, convertedParams };
  }
  
  return { baseUrl, convertedParams: params };
}

// ============================================
// INTERCEPTEURS AVEC FIELD CONVERTER ÉTENDU
// ============================================

// 🔧 INTERCEPTEUR AMÉLIORÉ - AVEC CONVERSION GET
apiClient.interceptors.request.use(
  config => {
    // Ajouter un timestamp pour éviter le cache
    const timestamp = new Date().getTime();
    
    // 🔧 NOUVELLE FONCTIONNALITÉ: CONVERSION DES PARAMÈTRES D'URL POUR GET
    if (config.method === 'get' && config.url && config.url.includes('?')) {
      const { baseUrl, convertedParams } = extractAndConvertUrlParams(config.url);
      
      // Remplacer l'URL par la version sans paramètres
      config.url = baseUrl;
      
      // Fusionner les paramètres convertis avec les params existants
      config.params = {
        ...convertedParams,
        ...config.params // Les params explicites ont la priorité
      };
      
      console.log('🔧 URL modifiée:', {
        originalUrl: config.url + '?' + new URLSearchParams(convertedParams).toString(),
        newBaseUrl: baseUrl,
        mergedParams: config.params
      });
    }
    
    // CORRECTION: Ajouter PHPSESSID à l'URL pour tous les fichiers .php
    if (config.url && config.url.includes('.php')) {
      config.url = addSessionToUrl(config.url);
      console.log('🔐 Session ajoutée à l\'URL:', config.url);
    }
    
    // ✅ CONVERSION AUTOMATIQUE DES DONNÉES avec gestion des dates (POST, PUT)
    if ((config.method === 'post' || config.method === 'put') && config.data) {
      if (shouldConvertEndpoint(config.url)) {
        const context = getConversionContext(config.url);
        
        console.log('🔄 Conversion Frontend → API avec gestion dates:', {
          url: config.url,
          context,
          originalData: config.data
        });
        
        // ✅ UTILISATION de la conversion avec gestion des dates
        let convertedData;
        
        if (ENDPOINT_CONVERSION_CONFIG.useDateHandling) {
          // Conversion avec gestion spéciale des dates
          convertedData = toApiFormatWithDateHandling(config.data, {
            context,
            preserveUnknown: true
          });
        } else {
          // Conversion normale
          convertedData = FieldConverter.toApiFormat(config.data, {
            context,
            preserveUnknown: true
          });
        }
        
        config.data = convertedData;
        
        console.log('✅ Données converties avec gestion dates:', convertedData);
      }
    }
    
    // 🔧 CONVERSION DES PARAMÈTRES GET (objets params)
    if (config.method === 'get' && config.params && shouldConvertEndpoint(config.url)) {
      const context = getConversionContext(config.url);
      
      console.log('🔄 Conversion paramètres GET Frontend → API:', {
        url: config.url,
        context,
        originalParams: config.params
      });
      
      // Conversion des paramètres GET en utilisant FieldConverter
      const convertedParams = FieldConverter.toApiFormat(config.params, {
        context,
        preserveUnknown: true
      });
      
      config.params = convertedParams;
      
      console.log('✅ Paramètres GET convertis:', convertedParams);
    }
    
    // Pour les requêtes GET (ajout du timestamp après conversion)
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _ts: timestamp
      };
    }
    
    // Journalisation en mode développement
    const debugMode = window.APP_CONFIG?.debugMode || process.env.REACT_APP_DEBUG === 'true';
    if (debugMode) {
      console.log('📤 Requête API:', config.method.toUpperCase(), config.url, config.params || config.data);
      console.log('🔗 URL complète:', config.baseURL + config.url);
    }
    
    return config;
  },
  error => {
    console.error('❌ Erreur lors de la préparation de la requête:', error);
    return Promise.reject(error);
  }
);

// Intercepteur pour les réponses - AVEC CONVERSION AUTOMATIQUE
apiClient.interceptors.response.use(
  response => {
    // ✅ CONVERSION AUTOMATIQUE DES RÉPONSES
    if (response.data && shouldConvertEndpoint(response.config.url)) {
      const context = getConversionContext(response.config.url);
      
      console.log('🔄 Conversion API → Frontend:', {
        url: response.config.url,
        context,
        originalData: response.data
      });
      
      // Convertir les données de réponse
      const convertedData = convertApiResponse(response.data, context);
      response.data = convertedData;
      
      console.log('✅ Réponse convertie:', convertedData);
    }
    
    // Journalisation en mode développement
    const debugMode = window.APP_CONFIG?.debugMode || process.env.REACT_APP_DEBUG === 'true';
    if (debugMode) {
      console.log('📥 Réponse API:', response.status, response.config.url, response.data);
    }
    
    return response;
  },
  error => {
    // Journalisation des erreurs (code existant)
    const debugMode = window.APP_CONFIG?.debugMode || process.env.REACT_APP_DEBUG === 'true';
    if (debugMode) {
      console.error('❌ Erreur API:', 
        error.response ? `${error.response.status} ${error.response.config.url}` : error.message,
        error
      );
    }
    
    // Gestion des erreurs de session (code existant)
    if (error.response && error.response.status === 401) {
      console.warn('🚨 Session expirée ou non authentifiée');
      
      if (process.env.REACT_APP_API_BASE_URL || process.env.NODE_ENV === 'development') {
        console.log('🔄 Mode séparé - Gestion auth côté React');
        window.dispatchEvent(new CustomEvent('auth-expired'));
        return Promise.reject(new Error('Session expirée. Veuillez vous reconnecter.'));
      } else {
        console.log('🔄 Mode hybride - Redirection vers PHP');
        window.location.href = 'index.php?session_expired=1';
        return Promise.reject(new Error('Session expirée. Veuillez vous reconnecter.'));
      }
    }
    
    // Autres gestions d'erreur (code existant)
    if (error.response && error.response.status === 404) {
      console.error('❌ Ressource non trouvée:', error.response.config.url);
      return Promise.reject(new Error(`La ressource demandée n'a pas été trouvée (${error.response.config.url})`));
    }
    
    if (error.response && error.response.status >= 500) {
      console.error('❌ Erreur serveur:', error.response.status, error.response.data);
      return Promise.reject(new Error('Une erreur est survenue sur le serveur. Veuillez réessayer plus tard.'));
    }
    
    if (!error.response) {
      console.error('❌ Erreur réseau/CORS:', error.message);
      
      if (error.message.includes('Network Error') && process.env.NODE_ENV === 'development') {
        return Promise.reject(new Error('Erreur de connexion. Vérifiez que le serveur backend est démarré et que CORS est configuré.'));
      }
      
      return Promise.reject(new Error('Erreur de connexion au serveur. Veuillez vérifier votre connexion internet.'));
    }
    
    if (error.response.data && error.response.data.message) {
      return Promise.reject(new Error(error.response.data.message));
    }
    
    return Promise.reject(error);
  }
);

// ============================================
// FONCTIONS UTILITAIRES POUR CONVERSION
// ============================================

/**
 * Convertit intelligemment une réponse d'API
 * @param {any} data - Données de réponse à convertir
 * @param {string} context - Contexte de conversion
 * @returns {any} Données converties
 */
function convertApiResponse(data, context = null) {
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  // Si c'est un tableau, convertir chaque élément
  if (Array.isArray(data)) {
    return FieldConverter.convertArray(data, 'toFrontend', { context });
  }
  
  // Si c'est un objet avec des propriétés contenant des tableaux/objets
  const converted = { ...data };
  
  // Convertir les propriétés communes qui contiennent des données métier
  const dataProperties = [
    'services', 'unites', 'typesTarifs', 'tarifs', 'tarifsSpeciaux',
    'clients', 'factures', 'users', 'items', 'data', 'result'
  ];
  
  dataProperties.forEach(prop => {
    if (converted[prop]) {
      if (Array.isArray(converted[prop])) {
        converted[prop] = FieldConverter.convertArray(converted[prop], 'toFrontend', { context });
      } else if (typeof converted[prop] === 'object') {
        converted[prop] = FieldConverter.toFrontendFormat(converted[prop], { context });
      }
    }
  });
  
  // Si c'est un objet simple (pas une réponse wrapper), le convertir directement
  if (!converted.success && !converted.error && !dataProperties.some(prop => converted[prop])) {
    return FieldConverter.toFrontendFormat(data, { context });
  }
  
  return converted;
}

// ============================================
// MÉTHODES UTILITAIRES (modifiées)
// ============================================

const api = {
  get: async (url, params = {}) => {
    try {
      // 🔧 GESTION TRANSPARENTE: URL avec paramètres OU objet params
      const response = await apiClient.get(url, { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  post: async (url, data = {}) => {
    try {
      console.log('📤 API.js -- POST -- Données envoyées (avant conversion):', data);
      console.log('📤 API.js -- POST -- URL:', url);
      const response = await apiClient.post(url, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  put: async (url, data = {}) => {
    try {
      const response = await apiClient.put(url, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  delete: async (url, params = {}) => {
    try {
      // 🔧 AMÉLIORATION: Support des paramètres pour DELETE
      if (Object.keys(params).length > 0) {
        const response = await apiClient.delete(url, { params });
        return response.data;
      } else {
        const response = await apiClient.delete(url);
        return response.data;
      }
    } catch (error) {
      throw error;
    }
  },
  
  // ✅ NOUVELLES MÉTHODES pour contrôle manuel de la conversion
  
  postRaw: async (url, data = {}) => {
    // POST sans conversion automatique
    const originalConfig = { ...ENDPOINT_CONVERSION_CONFIG };
    ENDPOINT_CONVERSION_CONFIG.autoConvert = [];
    
    try {
      const response = await apiClient.post(url, data);
      return response.data;
    } finally {
      Object.assign(ENDPOINT_CONVERSION_CONFIG, originalConfig);
    }
  },
  
  getRaw: async (url, params = {}) => {
    // GET sans conversion automatique
    const originalConfig = { ...ENDPOINT_CONVERSION_CONFIG };
    ENDPOINT_CONVERSION_CONFIG.autoConvert = [];
    
    try {
      const response = await apiClient.get(url, { params });
      return response.data;
    } finally {
      Object.assign(ENDPOINT_CONVERSION_CONFIG, originalConfig);
    }
  },
  
  postWithContext: async (url, data = {}, context = null) => {
    // POST avec contexte spécifique
    const convertedData = FieldConverter.toApiFormat(data, { context });
    const response = await apiClient.post(url, convertedData);
    
    // Conversion manuelle de la réponse
    if (response.data) {
      response.data = convertApiResponse(response.data, context);
    }
    
    return response.data;
  }
};

// ============================================
// CONFIGURATION ET EXPORT
// ============================================

// Fonction pour configurer les endpoints de conversion
export const configureFieldConversion = (config) => {
  Object.assign(ENDPOINT_CONVERSION_CONFIG, config);
  console.log('🔧 Configuration FieldConverter mise à jour:', ENDPOINT_CONVERSION_CONFIG);
};

// Fonction pour désactiver temporairement la conversion
export const disableFieldConversion = () => {
  ENDPOINT_CONVERSION_CONFIG.autoConvert = [];
  console.log('⏸️ Conversion automatique désactivée');
};

// Fonction pour réactiver la conversion
export const enableFieldConversion = () => {
  ENDPOINT_CONVERSION_CONFIG.autoConvert = [
    'tarif-api.php',
    'client-api.php', 
    'facture-api.php',
    'user-api.php'
  ];
  console.log('▶️ Conversion automatique réactivée');
};

// ============================================
// UTILITAIRES DE TEST
// ============================================

/**
 * Teste la conversion d'URL avec paramètres
 * @param {string} testUrl - URL de test
 */
function testUrlConversion(testUrl) {
  console.group('🧪 Test conversion URL');
  console.log('URL originale:', testUrl);
  
  const result = extractAndConvertUrlParams(testUrl);
  console.log('Résultat:', result);
  
  // Reconstituer l'URL finale
  const finalUrl = result.baseUrl + '?' + new URLSearchParams(result.convertedParams).toString();
  console.log('URL finale:', finalUrl);
  
  console.groupEnd();
}

// ✅ Fonctions utilitaires pour debug
export const getConversionEndpoints = () => ENDPOINT_CONVERSION_CONFIG;


// Export de la fonction de test pour debug
export { testUrlConversion };

export { apiClient };
export default api;