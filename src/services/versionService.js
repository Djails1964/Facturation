// src/services/versionService.js
import api from './api';

let cachedVersion = null;

const versionService = {
  async getVersion() {
    if (cachedVersion) {
      return cachedVersion;
    }

    try {
      const response = await api.get('auth-api.php?version=1');
      
      if (response.success) {
        cachedVersion = {
          version: response.version,
          environment: response.environment,
          appName: response.appName,
          copyright: response.copyright
        };
        return cachedVersion;
      }
    } catch (error) {
      console.error('Erreur récupération version:', error);
    }

    // Fallback
    return {
      version: process.env.REACT_APP_VERSION || '1.0.0',
      environment: process.env.REACT_APP_ENVIRONMENT || 'unknown',
      appName: 'Centre La Grange',
      copyright: '© 2025 Centre La Grange. Tous droits réservés.'
    };
  },

  getCachedVersion() {
    return cachedVersion;
  },

  clearCache() {
    cachedVersion = null;
  }
};

export default versionService;