import { useCallback } from 'react';

/**
 * Helper pour gérer les opérations avec loading/message
 */
export const withLoadingAndMessage = async (
  operation, 
  { setLoading, setMessage, setMessageType }, 
  { successMessage, errorPrefix = 'Erreur: ' }
) => {
  setLoading(true);
  try {
    const result = await operation();
    
    if (result && result.success !== false) {
      if (successMessage) {
        setMessage(successMessage);
        setMessageType('success');
      }
      return result;
    } else {
      throw new Error(result?.message || 'Opération échouée');
    }
  } catch (error) {
    console.error('Erreur dans withLoadingAndMessage:', error);
    setMessage(errorPrefix + error.message);
    setMessageType('error');
    throw error;
  } finally {
    setLoading(false);
  }
};

/**
 * Hook personnalisé pour gérer loading/message
 */
export const useAsyncOperation = () => {
  const executeWithLoading = useCallback((operation, states, options = {}) => {
    return withLoadingAndMessage(operation, states, options);
  }, []);
  
  return { executeWithLoading };
};