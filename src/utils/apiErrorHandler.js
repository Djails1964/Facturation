/**
 * Gère les erreurs API de manière centralisée
 * @param {Error} error - Erreur capturée
 * @param {string} context - Contexte de l'erreur (pour les logs)
 * @throws {Error} - Re-throw l'erreur si ce n'est pas une erreur de session
 */
export function handleApiError(error, context = '') {
  // Vérifier si c'est une session expirée
  if (error.message === 'SESSION_EXPIRED' || 
      error.response?.status === 401 ||
      error.response?.data?.session_expired === true) {
    
    console.warn(`🚨 Session expirée détectée ${context ? 'dans ' + context : ''}`);
    throw error; // L'intercepteur gère la redirection
  }
  
  // Pour les autres erreurs, logger avec le contexte
  console.error(`❌ Erreur ${context ? 'dans ' + context : ''}: ${error.message}`);
  throw error;
}