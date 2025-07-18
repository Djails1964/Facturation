// src/App.js - Version utilisant useGlobalNavigationGuard existant
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
import Header from './components/Header';
import GlobalDatePicker from './context/GlobalDatePicker';
import { useGlobalNavigationGuard } from './hooks/useGlobalNavigationGuard';
import './styles/GestionUtilisateurs.css';
import {
  configureUrlHelperForEnvironment,
  setUrlLogging
} from './utils/urlHelper';

console.log('🚀 Application React démarrée avec protection navigation globale');

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

// Hook pour utiliser le guard global
export const useNavigationGuard = () => {
  const context = React.useContext(NavigationGuardContext);
  if (!context) {
    throw new Error('useNavigationGuard must be used within NavigationGuardProvider');
  }
  return context;
};

function App() {
  const [user, setUser] = useState(null);
  const appConfig = {
    appName: process.env.REACT_APP_APP_NAME || 'Centre La Grange - Facturation',
    appVersion: process.env.REACT_APP_VERSION || '5.0.0',
    sessionTimeout: parseInt(process.env.REACT_APP_SESSION_TIMEOUT) || 1800
  };

  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  // Configuration initiale
  useEffect(() => {
    console.log('🔧 Configuration UrlHelper...');
    configureUrlHelperForEnvironment();
    if (process.env.REACT_APP_DEBUG === 'true') {
      setUrlLogging(true);
      console.log('🔍 Mode debug activé');
    }
  }, []);

  // Vérification d'authentification au démarrage
  useEffect(() => {
    const checkAuthentication = async () => {
      console.log('🔐 Vérification de l\'authentification...');
      try {
        if (authService.isAuthenticated()) {
          const currentUser = authService.getCurrentUser();
          if (authService.checkAuth) {
            const authData = await authService.checkAuth();
            if (authData && authData.user) {
              console.log('✅ Session valide:', authData.user);
              setUser(authData.user);
              setAuthenticated(true);
            } else {
              console.log('❌ Session invalide');
              setAuthenticated(false);
            }
          } else {
            console.log('✅ Utilisateur trouvé en localStorage:', currentUser);
            setUser(currentUser);
            setAuthenticated(true);
          }
        } else {
          console.log('❌ Aucun utilisateur trouvé');
          setAuthenticated(false);
        }
      } catch (error) {
        console.error('❌ Erreur d\'authentification:', error);
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuthentication();

    const handleAuthExpired = () => {
      console.log('🚨 Session expirée détectée');
      setAuthenticated(false);
      setUser(null);
    };

    window.addEventListener('auth-expired', handleAuthExpired);
    return () => {
      window.removeEventListener('auth-expired', handleAuthExpired);
    };
  }, []);

  useEffect(() => {
    console.log('🔄 useEffect authentification - authenticated:', authenticated, 'user:', user);
    if (authenticated && user) {
      console.log('✅ Utilisateur authentifié détecté, forçage de la navigation...');
      setTimeout(() => {
        console.log('🚀 Tentative de navigation vers dashboard');
        if (window.location.hash.includes('login')) {
          window.location.hash = '#/';
        }
      }, 200);
    }
  }, [authenticated, user]);

  // Gestion de la connexion
  const handleLogin = async (username, password) => {
    try {
      console.log('🔐 Début handleLogin pour:', username);
      setLoading(true);
      const loginData = await authService.login(username, password);
      console.log('📊 Réponse login complète:', loginData);
      
      if (loginData.success && loginData.user) {
        console.log('✅ Login success détecté, mise à jour des états...');
        setUser(loginData.user);
        setAuthenticated(true);
        console.log('🎯 États mis à jour - User:', loginData.user);
        
        await new Promise(resolve => setTimeout(resolve, 100));
        console.log('✅ Connexion terminée avec succès');
      } else {
        console.error('❌ Login failed - données:', loginData);
        throw new Error(loginData.message || 'Erreur de connexion');
      }
    } catch (error) {
      console.error('❌ Erreur de connexion dans handleLogin:', error);
      setAuthenticated(false);
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Composant Header protégé
  const ProtectedHeader = () => {
    const { interceptNavigation } = useNavigationGuard();

    const handleLogout = () => {
      interceptNavigation(
        async () => {
          console.log('🚪 Déconnexion...');
          try {
            await authService.logout();
            setUser(null);
            setAuthenticated(false);
            console.log('✅ Déconnexion réussie');
          } catch (error) {
            console.error('❌ Erreur de déconnexion:', error);
            setUser(null);
            setAuthenticated(false);
          }
        },
        'logout'
      );
    };

    return (
      <Header
        appName={appConfig.appName}
        appVersion={appConfig.appVersion}
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

  // Affichage de chargement
  if (loading) {
    return <LoadingSpinner message="Chargement de l'application..." />;
  }

  // Contexte utilisateur
  const userContext = {
    user,
    setUser,
    refreshSession,
    appConfig
  };

  // Layout principal pour les pages authentifiées avec protection globale
  const AuthenticatedLayout = () => (
    <NavigationGuardProvider>
      <SessionAlert
        sessionExpire={user?.sessionExpire}
        onRefresh={refreshSession}
      />
      <ProtectedHeader />
      <main className="app-main">
        <Outlet context={userContext} />
      </main>
      <GlobalDatePicker />
      
      {/* Indicateur mode développement */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          background: process.env.REACT_APP_API_BASE_URL ? '#28a745' : '#007bff',
          color: 'white',
          padding: '5px 10px',
          fontSize: '12px',
          zIndex: 9999,
          borderBottomLeftRadius: '5px'
        }}>
          {process.env.REACT_APP_API_BASE_URL ? 'REACT SÉPARÉ' : 'REACT DEV'}
        </div>
      )}
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
        {
          path: "admin/dashboard",
          element: <FacturationPage userContext={userContext} initialSection="admin_dashboard" />
        },
        {
          path: "admin/utilisateurs",
          element: <FacturationPage userContext={userContext} initialSection="utilisateurs" />
        },
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
    {
      path: "*",
      element: authenticated ? <Navigate to="/" replace /> : <Navigate to="/public/login" replace />
    }
  ]);

  return (
    <NotificationProvider>
      <DateProvider>
        <RouterProvider router={router} />
      </DateProvider>
    </NotificationProvider>
  );
}

export default App;