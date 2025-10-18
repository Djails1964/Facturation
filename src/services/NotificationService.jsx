// src/services/NotificationService.jsx
/**
 * =============================================================================
 * SERVICE DE NOTIFICATIONS REACT
 * =============================================================================
 * 
 * Ce service fournit un système complet de notifications toast pour React.
 * Il utilise React Context pour être accessible partout dans l'application.
 * 
 * ARCHITECTURE:
 * ------------
 * 1. NotificationContext: Contexte React pour partager l'état global
 * 2. NotificationProvider: Provider qui enveloppe l'application
 * 3. Notification: Composant individuel de notification
 * 4. useNotifications: Hook pour utiliser le service dans les composants
 * 
 * FONCTIONNALITÉS:
 * ---------------
 * - 4 types de notifications: success, error, warning, info
 * - Gestion automatique de la fermeture (avec durée configurable)
 * - Notifications persistantes (ne se ferment pas automatiquement)
 * - Barre de progression visuelle
 * - Bouton de fermeture manuel
 * - Actions personnalisées sur les notifications
 * - Prévention des doublons
 * - Gestion du hover (pause de la fermeture automatique)
 * - Configuration globale avec normalisation des booléens
 * - Statistiques des notifications actives
 * 
 * UTILISATION:
 * -----------
 * 1. Envelopper l'app avec NotificationProvider dans App.js
 * 2. Utiliser le hook useNotifications() dans les composants
 * 3. Appeler showSuccess(), showError(), showWarning(), showInfo()
 * 
 * EXEMPLE:
 * -------
 * const { showSuccess, showError } = useNotifications();
 * showSuccess('Opération réussie !');
 * showError('Une erreur est survenue', { duration: 0 });
 * 
 * =============================================================================
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { FiCheckCircle, FiXCircle, FiAlertTriangle, FiInfo } from 'react-icons/fi';
import { toBoolean, normalizeBooleanFields } from '../utils/booleanHelper';
import '../styles/NotificationService.css';

// =============================================================================
// CONSTANTES
// =============================================================================

export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

const DEFAULT_CONFIG = {
  autoClose: true,              // Fermeture automatique activée par défaut
  showIcons: true,              // Afficher les icônes
  showCloseButton: true,        // Afficher le bouton de fermeture
  showProgressBar: true,        // Afficher la barre de progression
  allowDuplicates: false,       // Empêcher les notifications identiques
  persistCritical: true,        // Les erreurs sont persistantes par défaut
  stackFromTop: false           // Empiler depuis le bas
};

// =============================================================================
// CONTEXTE
// =============================================================================

const NotificationContext = createContext(null);

/**
 * Hook pour accéder au service de notifications
 * @returns {Object} Méthodes et état du service de notifications
 */
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications doit être utilisé dans un NotificationProvider');
  }
  return context;
};

// =============================================================================
// COMPOSANT NOTIFICATION INDIVIDUELLE
// =============================================================================

const Notification = ({ 
  id, 
  type, 
  message, 
  duration = 5000, 
  action, 
  onClose,
  config = {},
  ...props 
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);

  // Normalisation des propriétés booléennes
  const normalizedProps = normalizeBooleanFields(props, [
    'isPersistent', 'isDismissible', 'showIcon', 
    'showCloseButton', 'showProgressBar', 'isImportant'
  ]);

  // Icônes par type
  const icons = {
    [NOTIFICATION_TYPES.SUCCESS]: <FiCheckCircle size={20} />,
    [NOTIFICATION_TYPES.ERROR]: <FiXCircle size={20} />,
    [NOTIFICATION_TYPES.WARNING]: <FiAlertTriangle size={20} />,
    [NOTIFICATION_TYPES.INFO]: <FiInfo size={20} />
  };

  const renderIcon = () => {
    if (!toBoolean(normalizedProps.showIcon)) return null;
    return <div className="notification-icon">{icons[type]}</div>;
  };

  // Gestion de la fermeture automatique
  useEffect(() => {
    if (duration > 0 && !normalizedProps.isPersistent && !isPaused) {
      timerRef.current = setTimeout(() => {
        onClose(id);
      }, duration);

      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }
  }, [duration, id, isPaused, normalizedProps.isPersistent, onClose]);

  // Gestion du hover
  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);

  // Gestion du clic sur la notification
  const handleNotificationClick = () => {
    if (normalizedProps.isDismissible && !action) {
      onClose(id);
    }
  };

  return (
    <div 
      className={`notification notification-${type} ${isPaused ? 'paused' : ''} ${normalizedProps.isPersistent ? 'persistent' : ''}`}
      onClick={handleNotificationClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="alert"
      aria-live={type === NOTIFICATION_TYPES.ERROR ? 'assertive' : 'polite'}
      aria-atomic="true"
    >
      {renderIcon()}
      <div className="notification-content">{message}</div>
      
      {/* Bouton d'action optionnel */}
      {action && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            if (action.onAction) action.onAction();
            if (!toBoolean(action.keepOpen)) onClose(id);
          }} 
          className="notification-action"
          aria-label={action.actionLabel || 'Action'}
        >
          {action.actionLabel || 'Action'}
        </button>
      )}
      
      {/* Bouton de fermeture */}
      {normalizedProps.showCloseButton && normalizedProps.isDismissible && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onClose(id);
          }} 
          className="notification-close"
          aria-label="Fermer la notification"
        >
          ×
        </button>
      )}
      
      {/* Barre de progression */}
      {normalizedProps.showProgressBar && duration > 0 && !normalizedProps.isPersistent && (
        <div 
          className={`notification-progress ${isPaused ? 'paused' : ''}`}
          style={{ 
            animationDuration: `${duration}ms`,
            animationPlayState: isPaused ? 'paused' : 'running'
          }} 
        />
      )}
    </div>
  );
};

// =============================================================================
// PROVIDER
// =============================================================================

export const NotificationProvider = ({ children, initialConfig = {} }) => {
  const [notifications, setNotifications] = useState([]);
  const [config, setConfig] = useState(() => {
    const normalizedConfig = normalizeBooleanFields(
      { ...DEFAULT_CONFIG, ...initialConfig },
      Object.keys(DEFAULT_CONFIG)
    );
    console.log('✅ Configuration notifications normalisée:', normalizedConfig);
    return normalizedConfig;
  });

  // Mise à jour de la configuration
  const updateConfig = useCallback((newConfig) => {
    setConfig(prevConfig => {
      const updatedConfig = normalizeBooleanFields(
        { ...prevConfig, ...newConfig },
        Object.keys(DEFAULT_CONFIG)
      );
      console.log('✅ Configuration notifications mise à jour:', updatedConfig);
      return updatedConfig;
    });
  }, []);

  // Normalisation d'une notification
  const normalizeNotification = useCallback((notification) => {
    const booleanFields = [
      'isPersistent', 'isDismissible', 'showIcon', 'showCloseButton', 
      'showProgressBar', 'autoClose', 'isRead', 'isImportant'
    ];
    
    const normalized = normalizeBooleanFields(notification, booleanFields);
    
    // Appliquer les valeurs par défaut de la configuration
    if (normalized.showIcon === undefined) normalized.showIcon = config.showIcons;
    if (normalized.showCloseButton === undefined) normalized.showCloseButton = config.showCloseButton;
    if (normalized.showProgressBar === undefined) normalized.showProgressBar = config.showProgressBar;
    if (normalized.isDismissible === undefined) normalized.isDismissible = true;
    
    return normalized;
  }, [config]);

  // Vérification des doublons
  const isDuplicateNotification = useCallback((message, type) => {
    if (toBoolean(config.allowDuplicates)) return false;
    
    return notifications.some(notification => 
      notification.message === message && notification.type === type
    );
  }, [notifications, config.allowDuplicates]);

  // Ajouter une notification
  const addNotification = useCallback((type, message, options = {}) => {
    // Vérifier les doublons
    if (isDuplicateNotification(message, type)) {
      console.log('ℹ️ Notification dupliquée ignorée:', { type, message });
      return null;
    }

    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    
    // Normalisation des options
    const normalizedOptions = normalizeNotification({
      duration: 5000,
      action: null,
      isPersistent: false,
      isDismissible: true,
      isImportant: type === NOTIFICATION_TYPES.ERROR,
      ...options
    });

    // Gestion des notifications critiques
    if (toBoolean(config.persistCritical) && type === NOTIFICATION_TYPES.ERROR) {
      normalizedOptions.isPersistent = true;
      normalizedOptions.duration = 0;
    }

    const notification = {
      id,
      type,
      message,
      timestamp: new Date().toISOString(),
      ...normalizedOptions,
      config
    };

    setNotifications(prevNotifications => {
      const newNotifications = toBoolean(config.stackFromTop) 
        ? [notification, ...prevNotifications]
        : [...prevNotifications, notification];
      
      return newNotifications;
    });
    
    return id;
  }, [config, isDuplicateNotification, normalizeNotification]);
  
  // Méthodes d'ajout par type
  const showSuccess = useCallback((message, options = {}) => 
    addNotification(NOTIFICATION_TYPES.SUCCESS, message, {
      duration: 3000,
      ...options
    }), [addNotification]);
    
  const showError = useCallback((message, options = {}) => 
    addNotification(NOTIFICATION_TYPES.ERROR, message, {
      duration: 0,
      isPersistent: true,
      isImportant: true,
      ...options
    }), [addNotification]);
    
  const showWarning = useCallback((message, options = {}) => 
    addNotification(NOTIFICATION_TYPES.WARNING, message, {
      duration: 7000,
      isImportant: true,
      ...options
    }), [addNotification]);
    
  const showInfo = useCallback((message, options = {}) => 
    addNotification(NOTIFICATION_TYPES.INFO, message, {
      duration: 5000,
      ...options
    }), [addNotification]);

  // Méthodes utilitaires avancées
  const showPersistent = useCallback((type, message, options = {}) => 
    addNotification(type, message, {
      ...options,
      isPersistent: true,
      duration: 0
    }), [addNotification]);

  const showTemporary = useCallback((type, message, duration = 3000, options = {}) => 
    addNotification(type, message, {
      ...options,
      isPersistent: false,
      duration
    }), [addNotification]);
  
  // Fermeture des notifications
  const closeNotification = useCallback((id) => {
    setNotifications(prevNotifications => 
      prevNotifications.filter(notification => notification.id !== id)
    );
  }, []);

  const closeByType = useCallback((type) => {
    setNotifications(prevNotifications => 
      prevNotifications.filter(notification => notification.type !== type)
    );
  }, []);

  const closeNonPersistent = useCallback(() => {
    setNotifications(prevNotifications => 
      prevNotifications.filter(notification => toBoolean(notification.isPersistent))
    );
  }, []);
  
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Statistiques
  const getStats = useCallback(() => {
    const stats = {
      total: notifications.length,
      byType: {},
      persistent: 0,
      dismissible: 0,
      important: 0
    };

    notifications.forEach(notification => {
      stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1;
      if (toBoolean(notification.isPersistent)) stats.persistent++;
      if (toBoolean(notification.isDismissible)) stats.dismissible++;
      if (toBoolean(notification.isImportant)) stats.important++;
    });

    return stats;
  }, [notifications]);
  
  // Valeur du contexte
  const contextValue = {
    notifications,
    config,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showPersistent,
    showTemporary,
    closeNotification,
    closeByType,
    closeNonPersistent,
    clearAll,
    updateConfig,
    getStats,
    isConfigEnabled: (key) => toBoolean(config[key]),
    hasNotifications: () => notifications.length > 0,
    hasImportantNotifications: () => notifications.some(n => toBoolean(n.isImportant)),
    hasPersistentNotifications: () => notifications.some(n => toBoolean(n.isPersistent))
  };
  
  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <div className={`notifications-container ${toBoolean(config.stackFromTop) ? 'stack-top' : 'stack-bottom'}`}>
        {notifications.map(notification => (
          <Notification
            key={notification.id}
            {...notification}
            onClose={closeNotification}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

// =============================================================================
// COMPOSANT HELPER POUR CONTRÔLES RAPIDES
// =============================================================================

export const QuickNotifications = () => {
  const { 
    hasNotifications, 
    hasImportantNotifications, 
    hasPersistentNotifications,
    getStats,
    clearAll,
    closeNonPersistent 
  } = useNotifications();

  if (!hasNotifications()) return null;

  const stats = getStats();

  return (
    <div className="quick-notifications-controls">
      <span className="notification-count">
        {stats.total} notification{stats.total > 1 ? 's' : ''}
        {hasImportantNotifications() && ' (!)'} 
      </span>
      
      {hasPersistentNotifications() && (
        <button onClick={closeNonPersistent} className="btn-quick-action">
          Fermer temporaires
        </button>
      )}
      
      <button onClick={clearAll} className="btn-quick-action">
        Tout fermer
      </button>
    </div>
  );
};

export default NotificationContext;