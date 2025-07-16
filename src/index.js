import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';
import './styles/main.css';
import './styles/notifications.css';
import logService from './services/LogService';

// TEMPORAIRE pour debug
console.log('🔍 Variables disponibles:', {
  'process.env.REACT_APP_BACKEND_URL': process.env.REACT_APP_BACKEND_URL,
  'process.env.REACT_APP_API_BASE_URL': process.env.REACT_APP_API_BASE_URL,
  'process available': typeof process !== 'undefined'
});

// Activer le service de logging en développement ou conditionnellement
if (window.APP_CONFIG?.enableLogging || process.env.NODE_ENV === 'development') {
  logService.enable();
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);