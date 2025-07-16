import { useEffect, useCallback } from 'react';

// ✅ VERSION SIMPLIFIÉE : Ne gère que la fermeture de fenêtre/onglet
// La navigation interne est gérée par les modals personnalisées
export const useBlockNavigation = (shouldBlock, message = 'Vous avez des modifications non sauvegardées.') => {
    
    // ✅ MODIFICATION : Bloquer uniquement la fermeture de fenêtre/onglet
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (shouldBlock) {
                e.preventDefault();
                e.returnValue = message;
                return message;
            }
        };

        // ✅ SUPPRESSION : Retirer la protection popstate qui causait la double modal
        // const handlePopState = (e) => { ... }

        window.addEventListener('beforeunload', handleBeforeUnload);
        // ✅ SUPPRESSION : Ne plus écouter popstate
        // window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            // ✅ SUPPRESSION : Ne plus nettoyer popstate
            // window.removeEventListener('popstate', handlePopState);
        };
    }, [shouldBlock, message]);

    // Fonction pour vérifier avant la navigation (garde l'interface pour compatibilité)
    const checkBeforeNavigate = useCallback((navigationFn) => {
        // ✅ MODIFICATION : Ne plus utiliser window.confirm, laisser la modal personnalisée gérer
        console.log('⚠️ checkBeforeNavigate appelé - délégation à la modal personnalisée');
        navigationFn(); // Exécuter directement, la modal personnalisée gère déjà la vérification
    }, []);

    return { checkBeforeNavigate };
};