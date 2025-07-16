import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Info as InfoIcon 
} from 'react-feather';
import { toBoolean, normalizeBooleanFields } from '../utils/booleanHelper'; // ✅ IMPORT du helper

// Types de notifications
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

// ✅ CONFIGURATION PAR DÉFAUT AVEC BOOLÉENS NORMALISÉS
const DEFAULT_CONFIG = {
  autoClose: true,
  showIcons: true,
  showCloseButton: true,
  showProgressBar: true,
  allowDuplicates: false,
  stackFromTop: true,
  pauseOnHover: true,
  dismissOnClick: false,
  respectAccessibility: true,
  enableSounds: false,
  persistCritical: true
};

// Création du contexte
const NotificationContext = createContext();

// Hook personnalisé pour utiliser les notifications
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// ✅ COMPOSANT DE NOTIFICATION INDIVIDUELLE AMÉLIORÉ
const Notification = ({ 
  id, 
  type, 
  message, 
  duration, 
  onClose, 
  action, 
  config,
  isPersistent,
  isDismissible,
  showIcon,
  showCloseButton,
  showProgressBar
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const [remainingTime, setRemainingTime] = useState(duration);

  // ✅ NORMALISATION DES PROPRIÉTÉS BOOLÉENNES
  const normalizedProps = React.useMemo(() => {
    const props = {
      isPersistent: toBoolean(isPersistent),
      isDismissible: toBoolean(isDismissible),
      showIcon: toBoolean(showIcon),
      showCloseButton: toBoolean(showCloseButton),
      showProgressBar: toBoolean(showProgressBar),
      pauseOnHover: toBoolean(config?.pauseOnHover),
      dismissOnClick: toBoolean(config?.dismissOnClick),
      enableSounds: toBoolean(config?.enableSounds)
    };
    
    console.log('✅ Notification props normalisées:', props);
    return props;
  }, [isPersistent, isDismissible, showIcon, showCloseButton, showProgressBar, config]);

  useEffect(() => {
    // ✅ GESTION DE L'AUTO-FERMETURE AVEC BOOLÉENS NORMALISÉS
    if (normalizedProps.isPersistent || duration <= 0) return;
    
    let timer;
    if (!isPaused) {
      timer = setTimeout(() => {
        onClose(id);
      }, remainingTime);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [id, duration, onClose, isPaused, remainingTime, normalizedProps.isPersistent]);

  // ✅ GESTION DU SURVOL AVEC NORMALISATION
  const handleMouseEnter = () => {
    if (normalizedProps.pauseOnHover) {
      setIsPaused(true);
    }
  };

  const handleMouseLeave = () => {
    if (normalizedProps.pauseOnHover) {
      setIsPaused(false);
    }
  };

  // ✅ GESTION DU CLIC AVEC NORMALISATION
  const handleNotificationClick = () => {
    if (normalizedProps.dismissOnClick) {
      onClose(id);
    }
  };

  // ✅ EFFET SONORE SI ACTIVÉ
  useEffect(() => {
    if (normalizedProps.enableSounds) {
      playNotificationSound(type);
    }
  }, [type, normalizedProps.enableSounds]);
  
  // Icône en fonction du type de notification
  const renderIcon = () => {
    if (!normalizedProps.showIcon) return null;
    
    switch (type) {
      case NOTIFICATION_TYPES.SUCCESS:
        return <CheckCircle className="notification-icon success" />;
      case NOTIFICATION_TYPES.ERROR:
        return <XCircle className="notification-icon error" />;
      case NOTIFICATION_TYPES.WARNING:
        return <AlertCircle className="notification-icon warning" />;
      case NOTIFICATION_TYPES.INFO:
        return <InfoIcon className="notification-icon info" />;
      default:
        return null;
    }
  };

  // ✅ FONCTION POUR JOUER UN SON
  const playNotificationSound = (notificationType) => {
    try {
      // Créer un contexte audio simple
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Fréquences différentes selon le type
      const frequencies = {
        success: 523, // Do
        error: 349,   // Fa
        warning: 440, // La
        info: 392     // Sol
      };
      
      oscillator.frequency.setValueAtTime(frequencies[notificationType] || 440, audioContext.currentTime);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      console.warn('Impossible de jouer le son de notification:', error);
    }
  };
  
  return (
    <div 
      className={`notification ${type} ${isPaused ? 'paused' : ''} ${normalizedProps.isPersistent ? 'persistent' : ''}`}
      onClick={handleNotificationClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="alert"
      aria-live={type === NOTIFICATION_TYPES.ERROR ? 'assertive' : 'polite'}
      aria-atomic="true"
    >
      {renderIcon()}
      <div className="notification-content">{message}</div>
      
      {/* Afficher le bouton d'action s'il est fourni */}
      {action && (
        <button 
          onClick={(e) => {
            e.stopPropagation(); // Empêcher la propagation vers le clic de notification
            if (action.onAction) action.onAction();
            if (!toBoolean(action.keepOpen)) onClose(id);
          }} 
          className="notification-action"
          aria-label={action.actionLabel || 'Action'}
        >
          {action.actionLabel || 'Action'}
        </button>
      )}
      
      {/* ✅ BOUTON DE FERMETURE CONDITIONNEL */}
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
      
      {/* ✅ BARRE DE PROGRESSION CONDITIONNELLE */}
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

// ✅ FOURNISSEUR DU CONTEXTE DE NOTIFICATIONS AMÉLIORÉ
export const NotificationProvider = ({ children, initialConfig = {} }) => {
  const [notifications, setNotifications] = useState([]);
  const [config, setConfig] = useState(() => {
    // ✅ NORMALISATION DE LA CONFIGURATION INITIALE
    const normalizedConfig = normalizeBooleanFields(
      { ...DEFAULT_CONFIG, ...initialConfig },
      Object.keys(DEFAULT_CONFIG)
    );
    console.log('✅ Configuration notifications normalisée:', normalizedConfig);
    return normalizedConfig;
  });

  // ✅ MÉTHODE POUR METTRE À JOUR LA CONFIGURATION
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

  // ✅ MÉTHODE DE NORMALISATION DES NOTIFICATIONS
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

  // ✅ VÉRIFICATION DES DOUBLONS
  const isDuplicateNotification = useCallback((message, type) => {
    if (toBoolean(config.allowDuplicates)) return false;
    
    return notifications.some(notification => 
      notification.message === message && notification.type === type
    );
  }, [notifications, config.allowDuplicates]);

  // ✅ AJOUTER UNE NOTIFICATION AVEC NORMALISATION
  const addNotification = useCallback((type, message, options = {}) => {
    // Vérifier les doublons
    if (isDuplicateNotification(message, type)) {
      console.log('✅ Notification dupliquée ignorée:', { type, message });
      return null;
    }

    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    
    // ✅ NORMALISATION DES OPTIONS
    const normalizedOptions = normalizeNotification({
      duration: 5000,
      action: null,
      isPersistent: false,
      isDismissible: true,
      isImportant: type === NOTIFICATION_TYPES.ERROR,
      ...options
    });

    // ✅ GESTION DES NOTIFICATIONS CRITIQUES
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

    console.log('✅ Notification normalisée ajoutée:', notification);

    setNotifications(prevNotifications => {
      const newNotifications = toBoolean(config.stackFromTop) 
        ? [notification, ...prevNotifications]
        : [...prevNotifications, notification];
      
      return newNotifications;
    });
    
    return id;
  }, [config, isDuplicateNotification, normalizeNotification]);
  
  // ✅ MÉTHODES D'AJOUT PAR TYPE AVEC GESTION DES BOOLÉENS
  const showSuccess = useCallback((message, options = {}) => 
    addNotification(NOTIFICATION_TYPES.SUCCESS, message, {
      duration: 3000,
      ...options
    }), [addNotification]);
    
  const showError = useCallback((message, options = {}) => 
    addNotification(NOTIFICATION_TYPES.ERROR, message, {
      duration: 0, // Les erreurs ne se ferment pas automatiquement par défaut
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

  // ✅ MÉTHODES UTILITAIRES AVANCÉES
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
  
  // Fermer une notification
  const closeNotification = useCallback((id) => {
    setNotifications(prevNotifications => 
      prevNotifications.filter(notification => notification.id !== id)
    );
  }, []);

  // ✅ FERMER PAR TYPE
  const closeByType = useCallback((type) => {
    setNotifications(prevNotifications => 
      prevNotifications.filter(notification => notification.type !== type)
    );
  }, []);

  // ✅ FERMER LES NOTIFICATIONS NON PERSISTANTES
  const closeNonPersistent = useCallback(() => {
    setNotifications(prevNotifications => 
      prevNotifications.filter(notification => toBoolean(notification.isPersistent))
    );
  }, []);
  
  // Fermer toutes les notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // ✅ STATISTIQUES DES NOTIFICATIONS
  const getStats = useCallback(() => {
    const stats = {
      total: notifications.length,
      byType: {},
      persistent: 0,
      dismissible: 0,
      important: 0
    };

    notifications.forEach(notification => {
      // Compter par type
      stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1;
      
      // Compter les propriétés booléennes
      if (toBoolean(notification.isPersistent)) stats.persistent++;
      if (toBoolean(notification.isDismissible)) stats.dismissible++;
      if (toBoolean(notification.isImportant)) stats.important++;
    });

    return stats;
  }, [notifications]);
  
  // ✅ VALEURS FOURNIES PAR LE CONTEXTE
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
    // Méthodes de vérification
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

// ✅ COMPOSANT WRAPPER POUR NOTIFICATIONS RAPIDES
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