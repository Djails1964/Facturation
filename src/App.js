// src/App.jsx - VERSION CORRIGÉE
/**
 * Application principale avec routage
 * ✅ Utilise checkAuth() et isAuthenticated() au lieu de verifyToken()
 * ✅ Récupère les paramètres correctement de la LoginPage
 */

import React, { useState, useEffect } from 'react';
import { createHashRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { NotificationProvider } from './services/NotificationService';
import { DateProvider } from './context/DateContext';
import authService from './services/authService';
import FacturationPage from './FacturationPage';
import LoginPage from './components/LoginPage';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import LoadingSpinner from './components/LoadingSpinner';
import SessionAlert from './components/SessionAlert';
import EnvironmentBadge from './components/EnvironmentBadge';
import AppFooter from './components/AppFooter';
import Header from './components/Header';
import GlobalDatePicker from './context/GlobalDatePicker';
import { useGlobalNavigationGuard } from './hooks/useGlobalNavigationGuard';
import './styles/components/users/GestionUtilisateurs.css';
import {
  configureUrlHelperForEnvironment,
  setUrlLogging
} from './utils/urlHelper';
import { createLogger } from './utils/createLogger';

// ✅ IMPORT pour l'initialisation des field mappings
import { initializeFieldMappings } from './constants/fieldMappings';

const log = createLogger('App');

log.debug('🚀 Application React démarrée avec protection navigation globale');

// Contexte pour partager le guard global
const NavigationGuardContext = React.createContext();

// Provider pour le guard global
const NavigationGuardProvider = ({ children }) => {
  const globalGuard = useGlobalNavigationGuard();
  
  return (
    <NavigationGuardContext.Provider value={globalGuard}>
      {children}
    </NavigationGuardContext.Provider>
  );
};

// Hook pour accéder au guard global
export const useNavigationGuard = () => {
  const context = React.useContext(NavigationGuardContext);
  if (!context) {
    throw new Error('useNavigationGuard doit être utilisé dans NavigationGuardProvider');
  }
  return context;
};

function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // ✅ INITIALISATION des field mappings au démarrage
  useEffect(() => {
    try {
      initializeFieldMappings();
      log.debug('✅ Field mappings initialisés');
    } catch (error) {
      log.error('❌ Erreur initialisation field mappings:', error);
    }
  }, []);

  // Configuration de l'URL Helper selon l'environnement
  useEffect(() => {
    try {
      configureUrlHelperForEnvironment();
      
      // Activer le logging des URLs en développement
      if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_DEBUG_URLS) {
        setUrlLogging(true, ['backendUrl', 'apiUrl']);
      }
    } catch (error) {
      log.error('❌ Erreur configuration URL Helper:', error);
    }
  }, []);

  // ✅ VÉRIFICATION DE L'AUTHENTIFICATION AU DÉMARRAGE
  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        log.debug('🔐 Vérification de l\'authentification...');
        
        // ✅ Vérifier si utilisateur existe en localStorage
        if (authService.isAuthenticated()) {
          log.debug('✅ Utilisateur trouvé en localStorage');
          const currentUser = authService.getCurrentUser();
          
          // ✅ Vérifier la session côté serveur (checkAuth)
          try {
            const authData = await authService.checkAuth();
            if (authData && authData.success) {
              log.debug('✅ Session valide côté serveur:', authData.user);
              setUser(authData.user);
              setAuthenticated(true);
            } else {
              log.debug('❌ Session invalide côté serveur');
              setAuthenticated(false);
              setUser(null);
              authService.logout();
            }
          } catch (checkError) {
            log.error('❌ Erreur vérification session:', checkError);
            // Gardez l'utilisateur du localStorage si erreur serveur
            setUser(currentUser);
            setAuthenticated(true);
          }
        } else {
          log.debug('❌ Aucun utilisateur trouvé');
          setAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        log.error('❌ Erreur d\'authentification:', error);
        setAuthenticated(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuthentication();

    // ✅ Gestionnaire d'événement auth-expired
    const handleAuthExpired = () => {
      log.debug('🚨 Session expirée détectée - Déconnexion');
      setAuthenticated(false);
      setUser(null);
      localStorage.removeItem('user');
    };

    window.addEventListener('auth-expired', handleAuthExpired);
    
    return () => {
      window.removeEventListener('auth-expired', handleAuthExpired);
    };
  }, []);

  // Composant Header protégé
  const ProtectedHeader = () => {
    const { interceptNavigation } = useNavigationGuard();

    const handleLogout = () => {
      interceptNavigation(
        async () => {
          log.debug('🚪 Déconnexion...');
          try {
            await authService.logout();
            setUser(null);
            setAuthenticated(false);
            log.debug('✅ Déconnexion réussie');
          } catch (error) {
            log.error('❌ Erreur de déconnexion:', error);
            setUser(null);
            setAuthenticated(false);
          }
        },
        'logout'
      );
    };

    return (
      <Header
        appName="Facturation"
        user={user}
        onLogout={handleLogout}
      />
    );
  };

  // Rafraîchissement de session
  const refreshSession = async (newSessionExpiry) => {
    if (newSessionExpiry && user) {
      setUser(prev => ({
        ...prev,
        sessionExpire: newSessionExpiry
      }));
    }
  };

  // ✅ GESTION DE LA CONNEXION CORRIGÉE
  const handleLogin = async (username, password) => {
    try {
      log.debug('🔐 Début handleLogin');
      setLoading(true);
      
      // ✅ Reçoit directement username et password (comme avant)
      const result = await authService.login(username, password);
      log.debug('📊 Réponse login complète:', result);
      
      if (result && result.success && result.user) {
        log.debug('✅ Login success détecté, mise à jour des états...');
        setUser(result.user);
        setAuthenticated(true);
        log.debug('🎯 États mis à jour - User:', result.user);
        
        // Attendre un peu pour que le state se mette à jour
        await new Promise(resolve => setTimeout(resolve, 100));
        log.debug('✅ Connexion terminée avec succès');
        
        // ✅ REDIRECTION MANUELLE VERS LA PAGE PRINCIPALE
        window.location.hash = '#/';
        
      } else {
        log.error('❌ Login failed - réponse:', result);
        throw new Error(result?.message || 'Erreur de connexion');
      }
    } catch (error) {
      log.error('❌ Erreur de connexion dans handleLogin:', error);
      setAuthenticated(false);
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Affichage de chargement
  if (loading) {
    return <LoadingSpinner message="Chargement de l'application..." />;
  }

  // Contexte utilisateur
  const userContext = {
    user,
    setUser,
    refreshSession,
    appConfig: {
      appName: 'Facturation',
      appVersion: '1.0.0'
    }
  };

  // Layout principal pour les pages authentifiées avec protection globale
  const AuthenticatedLayout = () => (
    <NavigationGuardProvider>
      <div className="app-container">
        <SessionAlert
          sessionExpire={user?.sessionExpire}
          onRefresh={refreshSession}
        />
        <ProtectedHeader />
        <main className="app-main">
          <Outlet context={userContext} />
        </main>
        <AppFooter />
        <GlobalDatePicker />
      </div>
    </NavigationGuardProvider>
  );

  // Layout simple pour les pages non authentifiées
  const PublicLayout = () => (
    <>
      <Outlet />
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          background: '#dc3545',
          color: 'white',
          padding: '5px 10px',
          fontSize: '12px',
          zIndex: 9999,
          borderBottomLeftRadius: '5px'
        }}>
          PUBLIC
        </div>
      )}
    </>
  );

  // Configuration du routeur
  const router = createHashRouter([
    // Routes publiques (non authentifiées)
    {
      path: "/public",
      element: <PublicLayout />,
      children: [
        {
          path: "login",
          element: <LoginPage onLogin={handleLogin} loading={loading} />
        },
        {
          path: "forgot-password",
          element: <ForgotPassword />
        },
        {
          path: "reset-password",
          element: <ResetPassword />
        }
      ]
    },
    
    // Routes authentifiées
    {
      path: "/",
      element: authenticated ? <AuthenticatedLayout /> : <Navigate to="/public/login" replace />,
      children: [
        {
          index: true,
          element: <FacturationPage userContext={userContext} initialSection="factures" />
        },
        
        // ✅ ROUTE: Dashboard
        {
          path: "dashboard",
          element: <FacturationPage userContext={userContext} initialSection="dashboard" />
        },
        
        // ✅ ROUTE ADMIN: Dashboard admin
        {
          path: "admin/dashboard",
          element: <FacturationPage userContext={userContext} initialSection="admin_dashboard" />
        },
        
        // Route pour les utilisateurs (admin/gestionnaire)
        {
          path: "admin/utilisateurs",
          element: <FacturationPage userContext={userContext} initialSection="utilisateurs" />
        },
        
        // Route pour les paramètres (admin/gestionnaire)
        {
          path: "parametres",
          element: <FacturationPage userContext={userContext} initialSection="parametres" />
        }
      ]
    },
    
    // Redirections
    {
      path: "/login",
      element: <Navigate to="/public/login" replace />
    },
    {
      path: "/forgot-password",
      element: <Navigate to="/public/forgot-password" replace />
    },
    {
      path: "/reset-password",
      element: <Navigate to="/public/reset-password" replace />
    },
    
    // Catch-all
    {
      path: "*",
      element: authenticated ? <Navigate to="/" replace /> : <Navigate to="/public/login" replace />
    }
  ]);

  return (
    <NotificationProvider>
      <DateProvider>
        <EnvironmentBadge />
        <RouterProvider router={router} />
      </DateProvider>
    </NotificationProvider>
  );
}

export default App;