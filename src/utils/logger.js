/**
 * Logger centralisé pour l'application
 * Remplace tous les console.log() directs par un système unifié
 * 
 * Utilisation :
 *   import logger from './utils/logger';
 *   logger.debug('Message de debug', { data });
 *   logger.info('Information');
 *   logger.warn('Avertissement');
 *   logger.error('Erreur');
 *   
 * Configuration :
 *   logger.setEnabled(true/false);  // Activer/désactiver globalement
 *   logger.setLevel('debug');       // Définir le niveau minimum
 */

class Logger {
  constructor() {
    this.enabled = this.isEnabledByDefault();
    this.level = 'debug'; // 'debug', 'info', 'warn', 'error'
    this.levels = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };
  }

  /**
   * Déterminer si le logging doit être activé par défaut
   */
  isEnabledByDefault() {
    // Vérifier les variables globales/d'environnement
    if (typeof window !== 'undefined' && window.APP_CONFIG) {
      return window.APP_CONFIG.enableLogging;
    }
    
    // Fallback sur l'environnement
    return process.env.NODE_ENV === 'development';
  }

  /**
   * Vérifier si un message doit être loggé selon son niveau
   */
  shouldLog(messageLevel) {
    if (!this.enabled) return false;
    return this.levels[messageLevel] >= this.levels[this.level];
  }

  /**
   * Logger de debug (niveau 0 - plus bas)
   */
  debug(message, data = null) {
    if (this.shouldLog('debug')) {
      const style = 'color: #888; font-weight: normal;';
      console.log(`%c[DEBUG]%c ${message}`, style, '', data || '');
    }
  }

  /**
   * Logger d'information (niveau 1)
   */
  info(message, data = null) {
    if (this.shouldLog('info')) {
      const style = 'color: #0066cc; font-weight: bold;';
      console.log(`%c[INFO]%c ${message}`, style, '', data || '');
    }
  }

  /**
   * Logger d'avertissement (niveau 2)
   */
  warn(message, data = null) {
    if (this.shouldLog('warn')) {
      const style = 'color: #ff9900; font-weight: bold;';
      console.warn(`%c[WARN]%c ${message}`, style, '', data || '');
    }
  }

  /**
   * Logger d'erreur (niveau 3 - le plus haut)
   */
  error(message, data = null) {
    if (this.shouldLog('error')) {
      const style = 'color: #cc0000; font-weight: bold;';
      console.error(`%c[ERROR]%c ${message}`, style, '', data || '');
    }
  }

  /**
   * Logger avec un préfixe (pour les modules)
   * Utile pour tracer d'où vient le log
   */
  withPrefix(prefix) {
    return {
      debug: (message, data) => this.debug(`[${prefix}] ${message}`, data),
      info: (message, data) => this.info(`[${prefix}] ${message}`, data),
      warn: (message, data) => this.warn(`[${prefix}] ${message}`, data),
      error: (message, data) => this.error(`[${prefix}] ${message}`, data)
    };
  }

  /**
   * Activer/désactiver le logging globalement
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    this.info(`Logger ${enabled ? 'activé' : 'désactivé'}`);
  }

  /**
   * Définir le niveau minimum de logging
   * 'debug' > 'info' > 'warn' > 'error'
   */
  setLevel(level) {
    if (!this.levels.hasOwnProperty(level)) {
      console.error(`Niveau invalide: ${level}. Utilisez: debug, info, warn, error`);
      return;
    }
    this.level = level;
    this.info(`Niveau de logging défini à: ${level}`);
  }

  /**
   * Obtenir l'état actuel du logger
   */
  getStatus() {
    return {
      enabled: this.enabled,
      level: this.level,
      isDevelopment: process.env.NODE_ENV === 'development'
    };
  }
}

// Créer une instance globale singleton
const logger = new Logger();

// Exposer globalement pour les tests en console
if (typeof window !== 'undefined') {
  window.logger = logger;
}

export default logger;