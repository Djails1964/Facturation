// src/utils/createLogger.js
// ✅ Factory pour créer des loggers unifiés utilisables partout

import logger from './logger';

/**
 * Crée un logger centralisé
 * Utilisable dans les composants React ET les services API
 * 
 * @param {string} context - Nom du contexte (composant, service, etc.)
 * @returns {Object} Logger avec méthodes info, debug, warn, error
 * 
 * @example
 * // Dans un composant React
 * const logger = createLogger('UserForm');
 * logger.info('Formulaire soumis', { userId: 123 });
 * 
 * // Dans un service
 * const logger = createLogger('authService');
 * logger.info('Tentative de connexion', { username });
 */
export const createLogger = (context) => {
  return logger.withPrefix(context);
};

export default createLogger;