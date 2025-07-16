// src/services/api.js - Version complète avec gestion session centralisée
import axios from 'axios';

console.log('=================DEBUG API.JS-START=================');
console.log("window.APP_CONFIG: ", window.APP_CONFIG);
console.log("process.env.REACT_APP_API_BASE_URL:", process.env.REACT_APP_API_BASE_URL);
console.log("window.location:", window.location);
console.log("window.location.origin:", window.location.origin);
console.log('==================DEBUG API.JS-END==================');

// ============================================
// GESTION SESSION CENTRALISÉE
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

// Intercepteur pour les requêtes - AVEC GESTION SESSION
apiClient.interceptors.request.use(
  config => {
    // Ajouter un timestamp pour éviter le cache
    const timestamp = new Date().getTime();
    
    // CORRECTION: Ajouter PHPSESSID à l'URL pour tous les fichiers .php
    if (config.url && config.url.includes('.php')) {
      config.url = addSessionToUrl(config.url);
      console.log('🔑 Session ajoutée à l\'URL:', config.url);
    }
    
    // Pour les requêtes GET
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

// Intercepteur pour les réponses (adapté pour mode séparé)
apiClient.interceptors.response.use(
  response => {
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
    
    // Gestion des erreurs de session (adapté pour mode séparé)
    if (error.response && error.response.status === 401) {
      console.warn('🚨 Session expirée ou non authentifiée');
      
      // En mode séparé, rester dans React et gérer l'auth côté React
      if (process.env.REACT_APP_API_BASE_URL || process.env.NODE_ENV === 'development') {
        console.log('🔄 Mode séparé - Gestion auth côté React');
        // Émettre un événement pour que React gère la déconnexion
        window.dispatchEvent(new CustomEvent('auth-expired'));
        return Promise.reject(new Error('Session expirée. Veuillez vous reconnecter.'));
      } else {
        // Mode hybride - redirection vers PHP
        console.log('🔄 Mode hybride - Redirection vers PHP');
        window.location.href = 'index.php?session_expired=1';
        return Promise.reject(new Error('Session expirée. Veuillez vous reconnecter.'));
      }
    }
    
    // Gestion des erreurs 404
    if (error.response && error.response.status === 404) {
      console.error('❌ Ressource non trouvée:', error.response.config.url);
      return Promise.reject(new Error(`La ressource demandée n'a pas été trouvée (${error.response.config.url})`));
    }
    
    // Gestion des erreurs de serveur
    if (error.response && error.response.status >= 500) {
      console.error('❌ Erreur serveur:', error.response.status, error.response.data);
      return Promise.reject(new Error('Une erreur est survenue sur le serveur. Veuillez réessayer plus tard.'));
    }
    
    // Gestion des erreurs de réseau (important pour CORS)
    if (!error.response) {
      console.error('❌ Erreur réseau/CORS:', error.message);
      
      if (error.message.includes('Network Error') && process.env.NODE_ENV === 'development') {
        return Promise.reject(new Error('Erreur de connexion. Vérifiez que le serveur backend est démarré et que CORS est configuré.'));
      }
      
      return Promise.reject(new Error('Erreur de connexion au serveur. Veuillez vérifier votre connexion internet.'));
    }
    
    // Gérer les erreurs d'API avec des messages spécifiques
    if (error.response.data && error.response.data.message) {
      return Promise.reject(new Error(error.response.data.message));
    }
    
    return Promise.reject(error);
  }
);

// Méthodes utilitaires
const api = {
  get: async (url, params = {}) => {
    try {
      const response = await apiClient.get(url, { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  post: async (url, data = {}) => {
    try {
      console.log('📤 API.js -- POST -- Données envoyées:', data);
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
      if (Object.keys(params).length > 0) {
        const separator = url.includes('?') ? '&' : '?';
        const queryParams = new URLSearchParams();
        Object.keys(params).forEach(key => {
          queryParams.append(key, params[key]);
        });
        url = `${url}${separator}${queryParams.toString()}`;
      }
      
      console.log('🗑️ DELETE URL complète:', url);
      const response = await apiClient.delete(url);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export { apiClient };
export default api;