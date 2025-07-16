// src/services/LogService.js - VERSION CORRIGÉE sans boucle infinie
import api from './api';
import { toBoolean, normalizeBooleanFields } from '../utils/booleanHelper';

class LogService {
  constructor() {
    // Sauvegarder les méthodes de console originales
    this.originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info,
      debug: console.debug
    };
    
    // ✅ CONFIGURATION AVEC VALEURS BOOLÉENNES SÉCURISÉES
    this.config = {
      isEnabled: false,
      isProcessing: false,
      batchProcessing: true,
      sendImmediatelyOnError: true,
      includeStackTrace: true,
      includeUserAgent: true,
      includeUrl: true,
      filterSensitiveData: true,
      respectDoNotTrack: true
    };
    
    this.queuedLogs = [];
    this.batchSize = 10;
    this.sendInterval = 3000;
    this.processInterval = null;
    
    // ✅ MARQUEUR POUR ÉVITER LA RÉCURSION
    this.isInternalLogging = false;
    
    // ✅ DÉTECTER LES PRÉFÉRENCES DO NOT TRACK
    this.shouldRespectDoNotTrack = this.checkDoNotTrack();
  }

  /**
   * ✅ MÉTHODE SÉCURISÉE POUR LES LOGS INTERNES
   * Utilise toujours la console originale pour éviter la récursion
   */
  internalLog(level, ...args) {
    if (this.originalConsole[level]) {
      this.originalConsole[level](`[LogService] ${level.toUpperCase()}:`, ...args);
    }
  }

  /**
   * ✅ MÉTHODES DE CONFIGURATION ET NORMALISATION
   */
  normalizeConfig(newConfig) {
    if (!newConfig || typeof newConfig !== 'object') return this.config;
    
    const booleanFields = [
      'isEnabled', 'isProcessing', 'batchProcessing', 'sendImmediatelyOnError',
      'includeStackTrace', 'includeUserAgent', 'includeUrl', 
      'filterSensitiveData', 'respectDoNotTrack'
    ];
    
    return normalizeBooleanFields({ ...this.config, ...newConfig }, booleanFields);
  }

  normalizeLogResponse(response) {
    if (!response || typeof response !== 'object') return response;
    
    return {
      ...response,
      success: toBoolean(response.success),
      logged: toBoolean(response.logged),
      batched: toBoolean(response.batched),
      filtered: toBoolean(response.filtered),
    };
  }

  checkDoNotTrack() {
    if (typeof navigator === 'undefined') return false;
    
    const dnt = navigator.doNotTrack || 
                navigator.msDoNotTrack || 
                window.doNotTrack;
    
    return toBoolean(dnt === '1' || dnt === 'yes' || dnt === true);
  }

  updateConfig(newConfig) {
    this.internalLog('info', 'Mise à jour configuration:', newConfig);
    
    const normalizedConfig = this.normalizeConfig(newConfig);
    this.internalLog('info', 'Configuration normalisée:', normalizedConfig);
    
    this.config = normalizedConfig;
    
    if (this.config.isEnabled) {
      this.enable();
    } else {
      this.disable();
    }
  }

  getConfig() {
    return this.normalizeConfig(this.config);
  }

  /**
   * ✅ ACTIVATION SÉCURISÉE SANS RÉCURSION
   */
  enable() {
    this.internalLog('info', 'Tentative d\'activation...');
    
    // ✅ VÉRIFIER LES PRÉFÉRENCES DO NOT TRACK
    if (this.config.respectDoNotTrack && this.shouldRespectDoNotTrack) {
      this.internalLog('info', 'Service désactivé en raison des préférences Do Not Track');
      return false;
    }
    
    if (toBoolean(this.config.isEnabled)) {
      this.internalLog('info', 'Service déjà activé');
      return true;
    }
    
    this.config.isEnabled = true;
    
    // ✅ REMPLACER LES MÉTHODES AVEC PROTECTION CONTRE LA RÉCURSION
    console.log = (...args) => {
      this.originalConsole.log(...args);
      if (!this.isInternalLogging) this.handleLog('log', args);
    };
    
    console.warn = (...args) => {
      this.originalConsole.warn(...args);
      if (!this.isInternalLogging) this.handleLog('warn', args);
    };
    
    console.error = (...args) => {
      this.originalConsole.error(...args);
      if (!this.isInternalLogging) this.handleLog('error', args);
    };
    
    console.info = (...args) => {
      this.originalConsole.info(...args);
      if (!this.isInternalLogging) this.handleLog('info', args);
    };
    
    console.debug = (...args) => {
      this.originalConsole.debug(...args);
      if (!this.isInternalLogging) this.handleLog('debug', args);
    };
    
    // Démarrer le traitement périodique si activé
    if (toBoolean(this.config.batchProcessing)) {
      this.startProcessing();
    }
    
    this.internalLog('info', 'Service de journalisation activé');
    return true;
  }

  /**
   * ✅ DÉSACTIVATION PROPRE
   */
  disable() {
    if (!toBoolean(this.config.isEnabled)) {
      this.internalLog('info', 'Service déjà désactivé');
      return;
    }
    
    // Restaurer les méthodes de console originales
    console.log = this.originalConsole.log;
    console.warn = this.originalConsole.warn;
    console.error = this.originalConsole.error;
    console.info = this.originalConsole.info;
    console.debug = this.originalConsole.debug;
    
    this.config.isEnabled = false;
    this.config.isProcessing = false;
    
    // Arrêter le traitement
    if (this.processInterval) {
      clearInterval(this.processInterval);
      this.processInterval = null;
    }
    
    this.internalLog('info', 'Service de journalisation désactivé');
  }

  /**
   * ✅ MÉTHODES DE VÉRIFICATION D'ÉTAT
   */
  isEnabled() {
    return toBoolean(this.config.isEnabled);
  }

  isProcessing() {
    return toBoolean(this.config.isProcessing);
  }

  isBatchProcessingEnabled() {
    return toBoolean(this.config.batchProcessing);
  }

  shouldSendErrorsImmediately() {
    return toBoolean(this.config.sendImmediatelyOnError);
  }

  /**
   * ✅ GESTION DES LOGS AVEC PROTECTION CONTRE LA RÉCURSION
   */
  handleLog(level, args) {
    // Protection contre la récursion
    if (this.isInternalLogging || !this.isEnabled()) return;
    
    // Marquer qu'on est en train de traiter un log interne
    this.isInternalLogging = true;
    
    try {
      // Filtrer les données sensibles si activé
      const filteredArgs = toBoolean(this.config.filterSensitiveData) 
        ? this.filterSensitiveData(args) 
        : args;
      
      // Convertir les arguments en chaîne
      const message = filteredArgs.map(arg => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg);
          } catch (e) {
            return String(arg);
          }
        }
        return String(arg);
      }).join(' ');
      
      // Construire l'objet log
      const logEntry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        // ✅ INCLURE DES INFORMATIONS SELON LA CONFIGURATION
        ...(toBoolean(this.config.includeUrl) && { url: window.location.href }),
        ...(toBoolean(this.config.includeUserAgent) && { userAgent: navigator.userAgent }),
        ...(toBoolean(this.config.includeStackTrace) && { source: this.getCallerInfo() })
      };
      
      // Envoyer immédiatement si c'est une erreur et que c'est configuré
      if (level === 'error' && this.shouldSendErrorsImmediately()) {
        this.sendLogImmediately(logEntry);
      } else {
        // Ajouter à la file d'attente
        this.queuedLogs.push(logEntry);
      }
      
    } catch (error) {
      // ✅ UTILISER internalLog POUR ÉVITER LA RÉCURSION
      this.internalLog('error', 'Erreur lors du traitement du log:', error);
    } finally {
      // Toujours libérer le verrou
      this.isInternalLogging = false;
    }
  }

  /**
   * ✅ FILTRAGE DES DONNÉES SENSIBLES
   */
  filterSensitiveData(args) {
    const sensitivePatterns = [
      /password/i, /token/i, /secret/i, /key/i, /auth/i,
      /credit.?card/i, /ssn/i, /social.?security/i
    ];
    
    return args.map(arg => {
      if (typeof arg === 'string') {
        const isSensitive = sensitivePatterns.some(pattern => pattern.test(arg));
        return isSensitive ? '[DONNÉES FILTRÉES]' : arg;
      }
      
      if (typeof arg === 'object' && arg !== null) {
        const filtered = { ...arg };
        Object.keys(filtered).forEach(key => {
          const isSensitive = sensitivePatterns.some(pattern => pattern.test(key));
          if (isSensitive) {
            filtered[key] = '[FILTRÉ]';
          }
        });
        return filtered;
      }
      
      return arg;
    });
  }

  /**
   * ✅ ENVOI IMMÉDIAT SÉCURISÉ
   */
  async sendLogImmediately(logEntry) {
    // Protection contre la récursion
    if (this.isInternalLogging) return;
    
    this.isInternalLogging = true;
    
    try {
      this.internalLog('info', 'Envoi immédiat du log:', logEntry);
      
      const response = await api.post('log_service.php', logEntry);
      
      // ✅ NORMALISATION DE LA RÉPONSE
      const normalizedResponse = this.normalizeLogResponse(response);
      this.internalLog('info', 'Réponse envoi immédiat (normalisée):', normalizedResponse);
      
      return normalizedResponse;
    } catch (error) {
      // ✅ UTILISER internalLog POUR ÉVITER LA RÉCURSION
      this.internalLog('error', 'Erreur lors de l\'envoi immédiat:', error);
      // En cas d'erreur, ajouter à la file d'attente normale
      this.queuedLogs.push(logEntry);
    } finally {
      this.isInternalLogging = false;
    }
  }

  /**
   * Obtenir des informations sur l'appelant
   */
  getCallerInfo() {
    try {
      const err = new Error();
      const stack = err.stack.split('\n');
      const callerLine = stack.find(line => 
        !line.includes('LogService.js') && 
        !line.includes('at LogService.')
      );
      
      if (callerLine) {
        const match = callerLine.match(/at\s+(?:.*?\s+\()?(.+?)(?::(\d+))?(?::(\d+))?\)?$/);
        if (match) {
          const [, file, line] = match;
          return `${file.split('/').pop()}:${line}`;
        }
      }
      return 'unknown';
    } catch (e) {
      return 'unknown';
    }
  }

  /**
   * ✅ TRAITEMENT PÉRIODIQUE SÉCURISÉ
   */
  startProcessing() {
    if (this.isProcessing()) {
      this.internalLog('info', 'Traitement déjà en cours');
      return;
    }
    
    this.config.isProcessing = true;
    this.processInterval = setInterval(() => this.processLogs(), this.sendInterval);
    
    this.internalLog('info', 'Traitement périodique démarré');
  }

  stopProcessing() {
    if (!this.isProcessing()) return;
    
    this.config.isProcessing = false;
    
    if (this.processInterval) {
      clearInterval(this.processInterval);
      this.processInterval = null;
    }
    
    this.internalLog('info', 'Traitement périodique arrêté');
  }

  /**
   * ✅ TRAITEMENT DES LOGS EN BATCH SÉCURISÉ
   */
  async processLogs() {
    if (this.queuedLogs.length === 0) return;
    
    // Protection contre la récursion
    if (this.isInternalLogging) return;
    
    this.isInternalLogging = true;
    
    try {
      this.internalLog('info', `Traitement de ${this.queuedLogs.length} logs en attente`);
      
      // Prendre un lot de logs
      const batch = this.queuedLogs.splice(0, this.batchSize);
      
      // Envoyer au serveur
      const responses = await Promise.allSettled(
        batch.map(log => api.post('log_service.php', log))
      );
      
      // ✅ ANALYSER LES RÉPONSES AVEC NORMALISATION
      const results = responses.map((response, index) => {
        if (response.status === 'fulfilled') {
          const normalized = this.normalizeLogResponse(response.value);
          return { success: true, log: batch[index], response: normalized };
        } else {
          // ✅ UTILISER internalLog POUR ÉVITER LA RÉCURSION
          this.internalLog('error', 'Erreur envoi log:', response.reason);
          // Remettre le log en file d'attente en cas d'erreur
          this.queuedLogs.unshift(batch[index]);
          return { success: false, log: batch[index], error: response.reason };
        }
      });
      
      const successCount = results.filter(r => r.success).length;
      this.internalLog('info', `${successCount}/${batch.length} logs envoyés avec succès`);
      
    } catch (error) {
      this.internalLog('error', 'Erreur lors du traitement des logs:', error);
    } finally {
      this.isInternalLogging = false;
    }
  }

  /**
   * ✅ MÉTHODES DE STATISTIQUES ET DEBUG
   */
  getStats() {
    return {
      isEnabled: this.isEnabled(),
      isProcessing: this.isProcessing(),
      queuedLogsCount: this.queuedLogs.length,
      batchSize: this.batchSize,
      sendInterval: this.sendInterval,
      respectsDoNotTrack: toBoolean(this.config.respectDoNotTrack),
      doNotTrackDetected: this.shouldRespectDoNotTrack,
      config: this.getConfig()
    };
  }

  clearQueue() {
    const clearedCount = this.queuedLogs.length;
    this.queuedLogs = [];
    this.internalLog('info', `${clearedCount} logs supprimés de la file d'attente`);
    return clearedCount;
  }

  async flushLogs() {
    if (this.queuedLogs.length === 0) {
      this.internalLog('info', 'Aucun log à envoyer');
      return { success: true, count: 0 };
    }
    
    this.internalLog('info', `Envoi forcé de ${this.queuedLogs.length} logs`);
    
    try {
      await this.processLogs();
      return { 
        success: true, 
        remaining: this.queuedLogs.length,
        message: 'Logs envoyés avec succès' 
      };
    } catch (error) {
      this.internalLog('error', 'Erreur lors de l\'envoi forcé:', error);
      return { 
        success: false, 
        error: error.message,
        remaining: this.queuedLogs.length 
      };
    }
  }

  /**
   * ✅ MÉTHODE DE DEBUG POUR TESTER LE SERVICE
   */
  async testService() {
    this.internalLog('info', '=== TEST DU SERVICE ===');
    
    const stats = this.getStats();
    this.internalLog('info', 'Statistiques:', stats);
    
    // Test d'envoi de logs de différents niveaux
    this.internalLog('info', 'Test log info');
    this.internalLog('warn', 'Test log warning');
    this.internalLog('error', 'Test log error');
    
    // Attendre un peu puis vérifier la file d'attente
    setTimeout(() => {
      const newStats = this.getStats();
      this.internalLog('info', 'Nouvelles statistiques:', newStats);
    }, 1000);
    
    return stats;
  }
}

// Créer et exporter une instance unique
const logService = new LogService();

// ✅ CONFIGURATION INITIALE BASÉE SUR L'ENVIRONNEMENT
if (typeof window !== 'undefined') {
  // En développement, configuration plus permissive
  if (process.env.NODE_ENV === 'development') {
    logService.updateConfig({
      batchProcessing: false,
      sendImmediatelyOnError: true,
      respectDoNotTrack: false,
      filterSensitiveData: false
    });
  } else {
    // En production, configuration plus stricte
    logService.updateConfig({
      batchProcessing: true,
      sendImmediatelyOnError: true,
      respectDoNotTrack: true,
      filterSensitiveData: true
    });
  }
}

export default logService;