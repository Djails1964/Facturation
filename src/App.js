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
import Header from './components/Header';
import GlobalDatePicker from './context/GlobalDatePicker';
import { useGlobalNavigationGuard } from './hooks/useGlobalNavigationGuard';
import './styles/components/users/GestionUtilisateurs.css';
import {
  configureUrlHelperForEnvironment,
  setUrlLogging
} from './utils/urlHelper';

// ✅ IMPORT pour l'initialisation des field mappings
import { initializeFieldMappings } from './constants/fieldMappings';

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
      console.log('✅ Field mappings initialisés');
    } catch (error) {
      console.error('❌ Erreur initialisation field mappings:', error);
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
      console.error('❌ Erreur configuration URL Helper:', error);
    }
  }, []);

  // ✅ VÉRIFICATION DE L'AUTHENTIFICATION AU DÉMARRAGE
  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        console.log('🔐 Vérification de l\'authentification...');
        
        // ✅ Vérifier si utilisateur existe en localStorage
        if (authService.isAuthenticated()) {
          console.log('✅ Utilisateur trouvé en localStorage');
          const currentUser = authService.getCurrentUser();
          
          // ✅ Vérifier la session côté serveur (checkAuth)
          try {
            const authData = await authService.checkAuth();
            if (authData && authData.success) {
              console.log('✅ Session valide côté serveur:', authData.user);
              setUser(authData.user);
              setAuthenticated(true);
            } else {
              console.log('❌ Session invalide côté serveur');
              setAuthenticated(false);
              setUser(null);
              authService.logout();
            }
          } catch (checkError) {
            console.error('❌ Erreur vérification session:', checkError);
            // Gardez l'utilisateur du localStorage si erreur serveur
            setUser(currentUser);
            setAuthenticated(true);
          }
        } else {
          console.log('❌ Aucun utilisateur trouvé');
          setAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        console.error('❌ Erreur d\'authentification:', error);
        setAuthenticated(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuthentication();

    // ✅ Gestionnaire d'événement auth-expired
    const handleAuthExpired = () => {
      console.log('🚨 Session expirée détectée - Déconnexion');
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
        appName="Facturation"
        appVersion="1.0.0"
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
      console.log('🔐 Début handleLogin');
      setLoading(true);
      
      // ✅ Reçoit directement username et password (comme avant)
      const result = await authService.login(username, password);
      console.log('📊 Réponse login complète:', result);
      
      if (result && result.success && result.user) {
        console.log('✅ Login success détecté, mise à jour des états...');
        setUser(result.user);
        setAuthenticated(true);
        console.log('🎯 États mis à jour - User:', result.user);
        
        // Attendre un peu pour que le state se mette à jour
        await new Promise(resolve => setTimeout(resolve, 100));
        console.log('✅ Connexion terminée avec succès');
        
        // ✅ REDIRECTION MANUELLE VERS LA PAGE PRINCIPALE
        window.location.hash = '#/';
        
      } else {
        console.error('❌ Login failed - réponse:', result);
        throw new Error(result?.message || 'Erreur de connexion');
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
      <SessionAlert
        sessionExpire={user?.sessionExpire}
        onRefresh={refreshSession}
      />
      <ProtectedHeader />
      <main className="app-main">
        <Outlet context={userContext} />
      </main>
      <GlobalDatePicker />
      
      {/* ✅ INDICATEUR de configuration */}
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
          {process.env.REACT_APP_API_BASE_URL ? 'REACT SÉPARÉ + MAPPINGS' : 'REACT DEV + MAPPINGS'}
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
        <RouterProvider router={router} />
      </DateProvider>
    </NotificationProvider>
  );
}

export default App;