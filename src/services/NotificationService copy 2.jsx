/* @jsxRuntime classic */
/* @jsx React.createElement */

const React = require('react');
const { createContext, useContext } = require('react');

// Types de notifications (pour compatibilité)
const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

// Contexte minimal
const NotificationContext = createContext({
  showSuccess: () => {},
  showError: () => {},
  showWarning: () => {},
  showInfo: () => {},
  closeNotification: () => {},
  clearAll: () => {}
});

// Hook personnalisé (nécessaire pour SessionAlert.jsx)
const useNotifications = () => useContext(NotificationContext);

// Fournisseur minimal
const NotificationProvider = ({ children }) => {
  // Fonctions vides mais fonctionnelles
  const showSuccess = () => console.log('showSuccess called - functionality disabled');
  const showError = () => console.log('showError called - functionality disabled');
  const showWarning = () => console.log('showWarning called - functionality disabled');
  const showInfo = () => console.log('showInfo called - functionality disabled');
  const closeNotification = () => console.log('closeNotification called - functionality disabled');
  const clearAll = () => console.log('clearAll called - functionality disabled');

  return React.createElement(
    NotificationContext.Provider,
    {
      value: {
        notifications: [],
        showSuccess,
        showError,
        showWarning,
        showInfo,
        closeNotification,
        clearAll
      }
    },
    children
  );
};

// Exports
exports.NOTIFICATION_TYPES = NOTIFICATION_TYPES;
exports.useNotifications = useNotifications;
exports.NotificationProvider = NotificationProvider;
exports.default = NotificationContext;