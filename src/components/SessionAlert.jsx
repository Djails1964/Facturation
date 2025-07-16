import { useState, useEffect } from 'react';
import { useNotifications } from '../services/NotificationService';
import apiClient from '../services/api';

/**
 * Composant d'alerte d'expiration de session
 * Surveille la session et affiche une notification avant expiration
 * 
 * @param {Object} props - Propriétés du composant
 * @param {number} props.sessionExpire - Timestamp d'expiration de la session
 * @param {Function} props.onRefresh - Callback appelé après rafraîchissement de session
 */
function SessionAlert({ sessionExpire, onRefresh }) {
  // État pour suivre si une alerte est déjà affichée
  const [alertShown, setAlertShown] = useState(false);
  
  // Hook de notification
  const { showWarning, closeNotification } = useNotifications();
  
  // ID de notification pour pouvoir la fermer plus tard
  const [notificationId, setNotificationId] = useState(null);
  
  // Fonction pour rafraîchir la session
  const refreshSession = async () => {
    try {
      const response = await apiClient.post('refresh-session.php');
      
      if (response.data?.success) {
        // Fermer la notification existante
        if (notificationId) {
          closeNotification(notificationId);
        }
        
        // Mettre à jour l'expiration de session
        if (response.data.sessionExpire) {
          onRefresh(response.data.sessionExpire);
        }
        
        // Réinitialiser l'état d'alerte
        setAlertShown(false);
        setNotificationId(null);
      }
    } catch (error) {
      console.error('Erreur lors du rafraîchissement de la session:', error);
    }
  };
  
  // Effet pour vérifier périodiquement l'expiration de session
  useEffect(() => {
    // Ne rien faire si pas d'expiration définie
    if (!sessionExpire) return;
    
    const checkSession = () => {
      const currentTime = Math.floor(Date.now() / 1000);
      const timeLeft = sessionExpire - currentTime;
      
      // Si moins de 5 minutes restantes et alerte pas encore affichée
      if (timeLeft > 0 && timeLeft < 300 && !alertShown) {
        const minutesLeft = Math.ceil(timeLeft / 60);
        
        // Afficher notification avec bouton d'action
        const id = showWarning(
          `Votre session expire dans ${minutesLeft} minute${minutesLeft > 1 ? 's' : ''}. Voulez-vous la prolonger ?`,
          0, // Ne pas fermer automatiquement
          { 
            actionLabel: 'Prolonger la session',
            onAction: refreshSession
          }
        );
        
        setNotificationId(id);
        setAlertShown(true);
      }
      
      // Si session expirée, rediriger vers la page de connexion
      if (timeLeft <= 0 && sessionExpire > 0) {
        window.location.href = 'index.php?session_expired=1';
      }
    };
    
    // Vérifier immédiatement puis toutes les minutes
    checkSession();
    const interval = setInterval(checkSession, 60000);
    
    return () => clearInterval(interval);
  }, [sessionExpire, alertShown, showWarning, closeNotification]);
  
  // Ce composant n'a pas de rendu visuel propre
  return null;
}

export default SessionAlert;