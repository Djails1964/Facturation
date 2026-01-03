// src/index.js
/**
 * Point d'entrée de l'application React
 * ✅ Initialisation des services
 * ✅ Support du Dashboard intégré
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';
import './styles/main.css';
import './styles/notifications.css';
// import logService from './services/LogService';
import { createLogger } from './utils/createLogger';

const log = createLogger("index.js");


log.info('🚀 Initialisation de l\'application...');

// Variables d'environnement disponibles
log.debug('📝 Variables d\'environnement:', {
  'REACT_APP_BACKEND_URL': process.env.REACT_APP_BACKEND_URL,
  'REACT_APP_API_BASE_URL': process.env.REACT_APP_API_BASE_URL,
  'NODE_ENV': process.env.NODE_ENV,
  'REACT_APP_DEBUG_URLS': process.env.REACT_APP_DEBUG_URLS
});

// Activer le service de logging en développement
// if (window.APP_CONFIG?.enableLogging || process.env.NODE_ENV === 'development') {
//   logService.enable();
//   log.debug('📋 Service de logging activé');
// }

// Configuration globale disponible
if (typeof window !== 'undefined') {
  window.APP_CONFIG = {
    enableLogging: process.env.NODE_ENV === 'development',
    debugUrls: process.env.REACT_APP_DEBUG_URLS === 'true',
    version: '1.0.0'
  };
  
  log.debug('⚙️ Configuration globale:', window.APP_CONFIG);
}

// Rendu de l'application
const root = ReactDOM.createRoot(document.getElementById('root'));

log.debug('📦 Rendu de l\'application React...');

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

log.info('✅ Application démarrée avec succès');