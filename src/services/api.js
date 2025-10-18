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

/**
 * Convertit récursivement les données de requête (camelCase vers snake_case)
 * Similaire à convertApiResponse mais dans l'autre sens
 */
function convertRequestDataRecursively(data, context = null) {
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  console.log('🔄 convertRequestDataRecursively - Données entrantes:', data);
  console.log('🔄 convertRequestDataRecursively - Contexte:', context);
  
  // Si c'est un tableau, convertir chaque élément
  if (Array.isArray(data)) {
    const converted = FieldConverter.convertArray(data, 'toApi', { context });
    console.log('✅ Tableau converti vers API:', converted);
    return converted;
  }
  
  // Convertir l'objet avec FieldConverter
  const converted = FieldConverter.toApiFormat(data, { context });
  console.log('🔄 Objet converti initial:', converted);
  
  // Propriétés spécifiques qui contiennent des données imbriquées
  const nestedDataProperties = [
    'lignes', 'lines', 'items', 'data', 'services', 'unites', 
    'clients', 'factures', 'paiements', 'details'
  ];
  
  // Convertir récursivement les propriétés imbriquées
  nestedDataProperties.forEach(prop => {
    if (converted[prop]) {
      console.log(`🔄 Conversion récursive de la propriété '${prop}':`, converted[prop]);
      
      if (Array.isArray(converted[prop])) {
        // Convertir chaque élément du tableau
        converted[prop] = converted[prop].map(item => {
          if (typeof item === 'object' && item !== null) {
            return convertRequestDataRecursively(item, context);
          }
          return item;
        });
        console.log(`✅ Tableau '${prop}' converti récursivement:`, converted[prop]);
      } else if (typeof converted[prop] === 'object' && converted[prop] !== null) {
        // Convertir l'objet récursivement
        converted[prop] = convertRequestDataRecursively(converted[prop], context);
        console.log(`✅ Objet '${prop}' converti récursivement:`, converted[prop]);
      }
    }
  });
  
  // Parcourir toutes les autres propriétés pour traiter les objets imbriqués
  Object.keys(converted).forEach(key => {
    if (!nestedDataProperties.includes(key) && converted[key]) {
      if (Array.isArray(converted[key])) {
        // Convertir les tableaux imbriqués
        converted[key] = converted[key].map(item => {
          if (typeof item === 'object' && item !== null) {
            return convertRequestDataRecursively(item, context);
          }
          return item;
        });
      } else if (typeof converted[key] === 'object' && converted[key] !== null) {
        // Traitement spécial pour les objets unite/service dans les lignes
        if (key === 'unite' || key === 'service') {
          // Si c'est un objet unite/service, extraire seulement le code
          if (converted[key].code) {
            console.log(`🔄 Simplification objet ${key}:`, converted[key], '→', converted[key].code);
            converted[key] = converted[key].code;
          } else if (converted[key].nom) {
            console.log(`🔄 Simplification objet ${key}:`, converted[key], '→', converted[key].nom);
            converted[key] = converted[key].nom;
          }
        } else {
          // Pour les autres objets, conversion récursive normale
          converted[key] = convertRequestDataRecursively(converted[key], context);
        }
      }
    }
  });
  
  console.log('✅ Objet final converti récursivement:', converted);
  return converted;
}

// ============================================
// INTERCEPTEURS AVEC FIELD CONVERTER ÉTENDU
// ============================================

// 🔧 INTERCEPTEUR AMÉLIORÉ - AVEC CONVERSION GET
apiClient.interceptors.request.use(
  config => {
    // Ajouter un timestamp pour éviter le cache
    const timestamp = new Date().getTime();
    
    // 🔧 NOUVELLE FONCTIONNALITÉ: CONVERSION DES PARAMÈTRES D'URL
    if (config.url && config.url.includes('?')) {
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
        
        console.log('🔄 Conversion Frontend → API avec récursion complète:', {
          url: config.url,
          context,
          originalData: config.data
        });
        
        // Utiliser la nouvelle fonction de conversion récursive
        let convertedData;
        
        if (ENDPOINT_CONVERSION_CONFIG.useDateHandling) {
          // Première passe : conversion avec gestion des dates
          convertedData = toApiFormatWithDateHandling(config.data, {
            context,
            preserveUnknown: true
          });
          // Deuxième passe : conversion récursive pour les objets imbriqués
          convertedData = convertRequestDataRecursively(convertedData, context);
        } else {
          // Conversion récursive directe
          convertedData = convertRequestDataRecursively(config.data, context);
        }
        
        config.data = convertedData;
        
        console.log('✅ Données converties avec récursion complète:', convertedData);
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

// ✅ FONCTION DE GESTION SESSION EXPIRÉE
function handleSessionExpired() {
  console.warn('🚨 Gestion de session expirée...');
  
  // Nettoyer l'authentification locale
  localStorage.removeItem('user');
  
  // Déclencher l'événement global pour informer l'app
  const event = new CustomEvent('auth-expired', {
    detail: { 
      message: 'Votre session a expiré. Veuillez vous reconnecter.',
      timestamp: Date.now()
    }
  });
  window.dispatchEvent(event);
  
  // Rediriger vers login après un court délai
  setTimeout(() => {
    window.location.hash = '#/login?session_expired=true';
  }, 100);
}

// Intercepteur pour les réponses - AVEC CONVERSION AUTOMATIQUE
apiClient.interceptors.response.use(
  response => {
    console.log('📥 Intercepteur réponse - URL:', response.config.url);
    console.log('📥 Intercepteur réponse - Données brutes:', response.data);
    
    // ✅ VÉRIFICATION SESSION EXPIRÉE
    if (response.data) {
      const data = response.data;
      
      // Vérifier les différents indicateurs de session expirée
      if (data.session_expired === true || 
          data.error === 'Session expirée' || 
          data.error === 'Non authentifié' ||
          data.message === 'Session expirée' ||
          data.message === 'Non authentifié') {
        
        console.warn('🚨 Session expirée détectée dans la réponse API');
        handleSessionExpired();
        return Promise.reject(new Error('SESSION_EXPIRED'));
      }
    }
    
    // Conversion automatique des réponses (code existant)
    if (response.data && shouldConvertEndpoint(response.config.url)) {
      const context = getConversionContext(response.config.url);
      
      // console.log('🔄 Conversion API → Frontend:', {
      //   url: response.config.url,
      //   context,
      //   shouldConvert: true,
      //   originalData: response.data
      // });
      
      const convertedData = convertApiResponse(response.data, context);
      response.data = convertedData;
      
      console.log('✅ Réponse convertie:', convertedData);
    } else {
      console.log('⭐️ Pas de conversion pour:', response.config.url);
    }
    
    // Journalisation en mode développement
    const debugMode = window.APP_CONFIG?.debugMode || process.env.REACT_APP_DEBUG === 'true';
    if (debugMode) {
      console.log('📥 Réponse API:', response.status, response.config.url, response.data);
    }
    
    return response;
  },
  error => {
    // Journalisation des erreurs
    const debugMode = window.APP_CONFIG?.debugMode || process.env.REACT_APP_DEBUG === 'true';
    if (debugMode) {
      console.error('❌ Erreur API:', 
        error.response ? `${error.response.status} ${error.response.config.url}` : error.message,
        error
      );
    }
    
    // ✅ GESTION DES ERREURS 401 - Session expirée
    if (error.response && error.response.status === 401) {
      console.warn('🚨 Session expirée ou non authentifiée');
      
      // Nettoyer le localStorage
      localStorage.removeItem('user');
      
      // Émettre un événement personnalisé pour que App.js puisse gérer la déconnexion
      window.dispatchEvent(new CustomEvent('auth-expired', {
        detail: { message: 'Votre session a expiré. Veuillez vous reconnecter.' }
      }));
      
      // Empêcher l'affichage du message générique "Erreur de connexion"
      return Promise.reject({
        response: {
          status: 401,
          data: {
            success: false,
            message: 'Session expirée',
            code: 401
          }
        },
        isAuthError: true // ✅ Flag pour identifier les erreurs d'authentification
      });
    }
    
    // Pour toutes les autres erreurs, retourner l'erreur normale
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
  
  console.log('🔄 convertApiResponse - Données entrantes:', data);
  console.log('typeof data:', typeof data);
  console.log('🔄 convertApiResponse - Contexte:', context);
  
  // Si c'est un tableau, convertir chaque élément
  if (Array.isArray(data)) {
    const converted = FieldConverter.convertArray(data, 'toFrontend', { context });
    console.log('✅ Tableau converti:', converted);
    return converted;
  }
  
  // ✅ CORRECTION: Traiter les objets de réponse wrap (success, paiement, etc.)
  const converted = { ...data };
  console.log('🔄 Objet converti initial:', converted);
  
  // ✅ NOUVEAU: Propriétés spécifiques aux paiements
  const paiementProperties = [
    'paiement', 'paiements'
  ];

  const factureProperties = ['facture', 'factures'];

  const parametreProperties = ['parametres', 'parametre'];

  // ✅ AJOUT: Propriété spécifique aux lignes de facture
  const lignesProperties = ['lignes'];

  // ✅ NOUVEAU: Propriétés spécifiques aux autres entités
  const dataProperties = [
    'services', 'unites', 'servicesUnites', 'typesTarifs', 'tarifs', 'tarifsSpeciaux',
    'clients', 'users', 'items', 'data', 'result',
    ...paiementProperties,
    ...factureProperties,
    ...lignesProperties,
    ...parametreProperties
  ];
  
  // Convertir les propriétés qui contiennent des données métier
  dataProperties.forEach(prop => {
    if (converted[prop]) {
      console.log(`🔄 Conversion de la propriété '${prop}':`, converted[prop]);
      
      if (Array.isArray(converted[prop])) {
        converted[prop] = FieldConverter.convertArray(converted[prop], 'toFrontend', { context });
        console.log(`✅ Tableau '${prop}' converti:`, converted[prop]);
      } else if (typeof converted[prop] === 'object') {
        // ✅ CORRECTION PRINCIPALE: Conversion récursive complète des objets
        converted[prop] = convertObjectRecursively(converted[prop], context);
        console.log(`✅ Objet '${prop}' converti:`, converted[prop]);
      }
    }
  });
  
  // ✅ NOUVELLE LOGIQUE: Convertir TOUJOURS les objets simples avec snake_case
  const hasSnakeCaseFields = Object.keys(converted).some(key => key.includes('_') && key !== 'success' && key !== 'error');
  const isSimpleDataObject = !dataProperties.some(prop => converted[prop]);
  
  if (isSimpleDataObject && hasSnakeCaseFields) {
    console.log('🔄 Conversion objet simple avec snake_case:', converted);
    // ✅ CORRECTION: Convertir l'objet entier, pas seulement data
    const directConverted = FieldConverter.toFrontendFormat(converted, { context });
    console.log('✅ Objet simple converti:', directConverted);
    return directConverted;
  }
  
  console.log('✅ Réponse finale convertie:', converted);
  return converted;
}

/**
 * ✅ NOUVELLE FONCTION: Conversion récursive complète d'un objet
 * Cette fonction s'assure que tous les tableaux imbriqués sont aussi convertis
 */
function convertObjectRecursively(obj, context = null) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  // Si c'est un tableau, convertir chaque élément
  if (Array.isArray(obj)) {
    return FieldConverter.convertArray(obj, 'toFrontend', { context });
  }

  // Convertir l'objet avec FieldConverter
  const converted = FieldConverter.toFrontendFormat(obj, { context });
  
  // ✅ CORRECTION PRINCIPALE: Parcourir toutes les propriétés pour convertir les tableaux imbriqués
  Object.keys(converted).forEach(key => {
    if (Array.isArray(converted[key])) {
      console.log(`🔄 Conversion tableau imbriqué '${key}':`, converted[key]);
      converted[key] = FieldConverter.convertArray(converted[key], 'toFrontend', { context });
      console.log(`✅ Tableau imbriqué '${key}' converti:`, converted[key]);
    } else if (converted[key] && typeof converted[key] === 'object' && !Array.isArray(converted[key])) {
      // Conversion récursive pour les objets imbriqués
      converted[key] = convertObjectRecursively(converted[key], context);
    }
  });

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

// ============================================
// EXPORTS DES NOUVELLES FONCTIONS
// ============================================

// Rendre les fonctions disponibles globalement pour les tests
window.extractAndConvertUrlParams = extractAndConvertUrlParams;
window.shouldConvertEndpoint = shouldConvertEndpoint;
window.getConversionContext = getConversionContext;
window.getConversionEndpoints = getConversionEndpoints;

// Export de la fonction de test pour debug
export { testUrlConversion };

export { apiClient };
export default api;