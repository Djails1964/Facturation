// src/utils/backendConfigTest.js
// Test de configuration backend pour différents environnements

import { 
  backendUrl, 
  emailClientSenderUrl, 
  facturesUrl,
  testUrlHelper 
} from './urlHelper';

// Fonction de test pour vérifier la configuration selon l'environnement
export const testBackendConfiguration = () => {
  console.log('=== TEST CONFIGURATION BACKEND ===');
  
  // Informations sur l'environnement actuel
  const env = {
    NODE_ENV: typeof process !== 'undefined' && process.env ? process.env.NODE_ENV : 'unknown',
    REACT_APP_BACKEND_URL: typeof process !== 'undefined' && process.env ? process.env.REACT_APP_BACKEND_URL : 'undefined',
    hostname: window.location.hostname,
    href: window.location.href
  };
  
  console.log('Environnement détecté:', env);
  
  // Tests des URLs générées
  console.log('\n--- URLs générées ---');
  
  // URL de base backend
  const indexUrl = backendUrl('index.php');
  console.log('index.php:', indexUrl);
  
  // URL de déconnexion
  const logoutUrl = backendUrl('logout.php', { ultra_logout: 1, t: Date.now() });
  console.log('logout.php:', logoutUrl);
  
  // URL email client sender
  const emailUrl = emailClientSenderUrl('test_123');
  console.log('email_client_sender.php:', emailUrl);
  
  // URL facture
  const factureUrl = facturesUrl('exemple_facture.pdf');
  console.log('facture PDF:', factureUrl);
  
  // Validation selon l'environnement
  console.log('\n--- Validation ---');
  
  if (env.hostname === 'localhost' || env.hostname === '127.0.0.1') {
    // DÉVELOPPEMENT
    console.log('✅ Mode DÉVELOPPEMENT détecté');
    
    if (indexUrl.includes('/fact-back/') && indexUrl.startsWith('https://')) {
      console.log('✅ URL backend correcte (HTTPS + /fact-back/)');
    } else {
      console.error('❌ URL backend incorrecte');
      console.error('URL générée:', indexUrl);
      console.error('Devrait commencer par https:// et contenir /fact-back/');
    }
    
    // Expected: https://localhost/fact-back/index.php
    const expectedPattern = /^https:\/\/localhost\/fact-back\//;
    if (expectedPattern.test(indexUrl)) {
      console.log('✅ Pattern URL développement valide');
    } else {
      console.error('❌ Pattern URL développement invalide');
      console.error('Attendu: https://localhost/fact-back/...');
      console.error('Reçu:', indexUrl);
    }
    
  } else {
    // PRODUCTION
    console.log('✅ Mode PRODUCTION détecté');
    
    // Vérifier si REACT_APP_BACKEND_URL est défini
    if (env.REACT_APP_BACKEND_URL && env.REACT_APP_BACKEND_URL !== 'undefined') {
      console.log('✅ REACT_APP_BACKEND_URL défini:', env.REACT_APP_BACKEND_URL);
      
      if (indexUrl.startsWith('https://') && !indexUrl.includes('/fact-back/')) {
        console.log('✅ URL backend correcte (HTTPS + pas de /fact-back/)');
      } else {
        console.error('❌ URL backend incorrecte');
        console.error('URL générée:', indexUrl);
      }
    } else {
      console.warn('⚠️ REACT_APP_BACKEND_URL non défini en production');
      console.warn('   Configuration basée sur l\'hôte frontend (non recommandé)');
      console.warn('   URL générée:', indexUrl);
    }
    
    // Pattern de validation générique pour la production
    const expectedPattern = /^https:\/\/[^\/]+\/[^\/]+\.php/;
    if (expectedPattern.test(indexUrl)) {
      console.log('✅ Pattern URL production valide');
    } else {
      console.error('❌ Pattern URL production invalide');
      console.error('Attendu: https://[backend-domain]/script.php');
      console.error('Reçu:', indexUrl);
    }
    
  }
  
  console.log('\n=== FIN TEST CONFIGURATION ===');
  
  return {
    env,
    urls: {
      index: indexUrl,
      logout: logoutUrl,
      email: emailUrl,
      facture: factureUrl
    }
  };
};

// Test rapide pour validation immédiate
export const quickBackendTest = () => {
  console.log('🧪 TEST RAPIDE BACKEND CONFIGURATION');
  console.log('=====================================');
  
  try {
    const result = testBackendConfiguration();
    const { urls } = result;
    const isLocalhost = window.location.hostname === 'localhost';
    
    console.log('\n🔍 VALIDATION RAPIDE:');
    
    if (isLocalhost) {
      // Test développement
      const isHttps = urls.index.startsWith('https://');
      const hasFactBack = urls.index.includes('/fact-back/');
      
      console.log('Mode: DÉVELOPPEMENT');
      console.log('✅ HTTPS:', isHttps ? '✅' : '❌');
      console.log('✅ /fact-back/:', hasFactBack ? '✅' : '❌');
      
      if (isHttps && hasFactBack) {
        console.log('🎉 CONFIGURATION DÉVELOPPEMENT CORRECTE !');
      } else {
        console.log('⚠️ PROBLÈME DE CONFIGURATION DÉVELOPPEMENT');
        console.log('Attendu: https://localhost/fact-back/...');
        console.log('Reçu:', urls.index);
      }
      
    } else {
      // Test production
      const isHttps = urls.index.startsWith('https://');
      const noFactBack = !urls.index.includes('/fact-back/');
      const hasBackendUrl = result.env.REACT_APP_BACKEND_URL && result.env.REACT_APP_BACKEND_URL !== 'undefined';
      
      console.log('Mode: PRODUCTION');
      console.log('✅ HTTPS:', isHttps ? '✅' : '❌');
      console.log('✅ Pas de /fact-back/:', noFactBack ? '✅' : '❌');
      console.log('✅ REACT_APP_BACKEND_URL défini:', hasBackendUrl ? '✅' : '❌');
      
      if (hasBackendUrl) {
        console.log('🎯 Backend configuré:', result.env.REACT_APP_BACKEND_URL);
        
        if (isHttps && noFactBack) {
          console.log('🎉 CONFIGURATION PRODUCTION CORRECTE !');
          console.log('✅ Utilisation de la variable d\'environnement');
        } else {
          console.log('⚠️ PROBLÈME DE CONFIGURATION PRODUCTION');
        }
      } else {
        console.log('⚠️ CONFIGURATION PRODUCTION INCOMPLÈTE');
        console.log('   REACT_APP_BACKEND_URL non défini - utilisation du fallback');
        console.log('   Fallback utilisé:', urls.index);
        console.log('💡 Recommandation: Définir REACT_APP_BACKEND_URL dans .env.production');
      }
    }
    
    console.log('\n📋 URLs générées:');
    Object.entries(urls).forEach(([key, url]) => {
      console.log(`${key}:`, url);
    });
    
    return result;
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    console.error('💡 Vérifiez que urlHelper.js est correctement importé');
    return null;
  }
};

// Exposer les fonctions dans window pour utilisation directe
if (typeof window !== 'undefined') {
  window.testBackendConfig = testBackendConfiguration;
  window.quickTest = quickBackendTest;
}

// Exemples d'URLs attendues selon l'environnement
/* 
DÉVELOPPEMENT (localhost):
Frontend: http://localhost:3007/
Backend: https://localhost/fact-back/ (défini dans .env.development)
- index.php: https://localhost/fact-back/index.php
- logout.php: https://localhost/fact-back/logout.php?ultra_logout=1&t=1234567890
- email_client_sender.php: https://localhost/fact-back/email_client_sender.php?request_id=test_123

PRODUCTION (flexible via variables d'environnement):
Frontend: https://[votre-frontend-domain]/
Backend: https://[votre-backend-domain]/ (défini dans .env.production)

Exemple avec DEV-facturation/DEV-facturation-api:
Frontend: https://DEV-facturation/
Backend: https://DEV-facturation-api/ (via REACT_APP_BACKEND_URL)
- index.php: https://DEV-facturation-api/index.php
- logout.php: https://DEV-facturation-api/logout.php?ultra_logout=1&t=1234567890
- email_client_sender.php: https://DEV-facturation-api/email_client_sender.php?request_id=test_123

AUTRES EXEMPLES POSSIBLES:
- Frontend: https://mon-app.com/ → Backend: https://api.mon-app.com/
- Frontend: https://facturation.entreprise.com/ → Backend: https://api-facturation.entreprise.com/
- Frontend: https://app.domain.com/ → Backend: https://backend.domain.com/
*/