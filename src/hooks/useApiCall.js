import { useState, useCallback } from 'react';

/**
 * Hook personnalisé pour gérer les appels API avec gestion automatique des sessions expirées
 */
export function useApiCall() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (apiFunction, onSuccess, onError) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await apiFunction();
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (err) {
      // ✅ CORRECTION: Détecter les erreurs de session (401 ou Network Error suspect)
      const isAuthError = err.isAuthError || 
                         err.message === 'SESSION_EXPIRED' ||
                         (err.response && err.response.status === 401);
      
      // ✅ AJOUT: Détecter Network Error qui peut masquer une session expirée
      // Cela arrive quand la session expire pendant une requête en cours
      const isNetworkErrorDuringSession = !err.response && 
                                          err.message === 'Network Error' &&
                                          localStorage.getItem('user'); // L'utilisateur était connecté
      
      if (isAuthError || isNetworkErrorDuringSession) {
        console.log('🚨 Session expirée ou erreur réseau pendant session - redirection en cours...');
        
        // Pour Network Error, déclencher manuellement la gestion de session
        if (isNetworkErrorDuringSession) {
          console.log('🔍 Network Error détectée alors que l\'utilisateur était connecté');
          localStorage.removeItem('user');
          
          // Émettre l'événement de session expirée
          window.dispatchEvent(new CustomEvent('auth-expired', {
            detail: { message: 'Votre session a expiré. Veuillez vous reconnecter.' }
          }));
          
          // Rediriger vers login après un court délai
          setTimeout(() => {
            window.location.hash = '#/login?session_expired=true';
          }, 100);
        }
        
        // Ne rien faire d'autre, l'intercepteur/événement s'en charge
        // Ne pas définir d'erreur ni appeler onError
        return;
      }
      
      // Pour les autres erreurs, afficher le message normal
      console.error('Erreur lors du chargement:', err);
      setError(err);
      
      if (onError) {
        onError(err);
      }
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { execute, isLoading, error };
}