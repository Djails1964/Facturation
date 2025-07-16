// src/contexts/AuthContext.js - Contexte d'authentification avec reset password
import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Vérifier l'authentification au chargement
  useEffect(() => {
    checkAuthStatus();
    
    // Écouter l'événement de session expirée
    window.addEventListener('auth-expired', handleAuthExpired);
    
    return () => {
      window.removeEventListener('auth-expired', handleAuthExpired);
    };
  }, []);

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      
      // Vérifier d'abord le localStorage
      const storedUser = authService.getCurrentUser();
      if (storedUser) {
        setUser(storedUser);
      }
      
      // Puis vérifier avec le serveur
      const authResult = await authService.checkAuth();
      if (authResult && authResult.user) {
        setUser(authResult.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'authentification:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthExpired = () => {
    console.log('🚨 Session expirée détectée');
    setUser(null);
  };

  const login = async (username, password) => {
    try {
      setLoading(true);
      const result = await authService.login(username, password);
      
      if (result.success && result.user) {
        setUser(result.user);
        return { success: true };
      } else {
        return { 
          success: false, 
          message: result.message || 'Échec de l\'authentification' 
        };
      }
    } catch (error) {
      console.error('Erreur de connexion:', error);
      return { 
        success: false, 
        message: error.message || 'Erreur de connexion au serveur' 
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await authService.logout();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      setUser(null);
      setLoading(false);
    }
  };

  // Nouvelles méthodes pour la réinitialisation de mot de passe
  const requestPasswordReset = async (email) => {
    try {
      const result = await authService.requestPasswordReset(email);
      return result;
    } catch (error) {
      console.error('Erreur demande réinitialisation:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la demande de réinitialisation'
      };
    }
  };

  const verifyResetToken = async (token) => {
    try {
      const result = await authService.verifyResetToken(token);
      return result;
    } catch (error) {
      console.error('Erreur vérification token:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la vérification du token'
      };
    }
  };

  const resetPasswordWithToken = async (token, newPassword) => {
    try {
      const result = await authService.resetPasswordWithToken(token, newPassword);
      return result;
    } catch (error) {
      console.error('Erreur réinitialisation mot de passe:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la réinitialisation du mot de passe'
      };
    }
  };

  const changePassword = async (oldPassword, newPassword) => {
    try {
      if (!user || !user.id_utilisateur) {
        return {
          success: false,
          message: 'Utilisateur non connecté'
        };
      }

      const result = await authService.changePassword(user.id_utilisateur, oldPassword, newPassword);
      return result;
    } catch (error) {
      console.error('Erreur changement mot de passe:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors du changement de mot de passe'
      };
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    checkAuthStatus,
    requestPasswordReset,
    verifyResetToken,
    resetPasswordWithToken,
    changePassword,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isStandard: user?.role === 'standard'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};