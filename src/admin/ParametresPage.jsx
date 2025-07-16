import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../services/NotificationService';
import GestionParametres from './GestionParametres';

/**
 * Page principale pour la gestion des paramètres
 * Structure similaire à FacturationPage
 */
function ParametresPage() {
  const navigate = useNavigate();
  const { showError } = useNotifications();
  
  // Vérification d'autorisation - redirige si l'utilisateur n'est pas admin
  useEffect(() => {
    const userRole = window.USER_DATA?.role;
    
    if (userRole !== 'admin') {
      showError('Vous n\'avez pas les droits d\'accès à cette page');
      navigate('/');
    }
  }, [navigate, showError]);
  
  return (
    <div className="facturation-page">
      <div className="facturation-content">
        <GestionParametres />
      </div>
    </div>
  );
}

export default ParametresPage;