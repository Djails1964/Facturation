import { useEffect } from 'react';

export const usePaiementFormProtection = (formState, formHandlers) => {
    const {
        canDetectChanges,
        hasUnsavedChanges,
        guardId,
        registerGuard,
        unregisterGuard,
        setGlobalNavigationCallback,
        setShowGlobalModal,
        mode,
        isPaiementAnnule,
        resetChanges,
        setIsFullyInitialized
    } = formState;

    // Enregistrer le guard global seulement quand tout est prêt
    useEffect(() => {
        if (canDetectChanges()) {
            const guardFunction = async () => {
                console.log(`🔍 Vérification modifications pour ${guardId}:`, hasUnsavedChanges);
                return hasUnsavedChanges;
            };

            registerGuard(guardId, guardFunction);
            console.log(`🔒 Guard enregistré pour ${guardId}`);

            return () => {
                unregisterGuard(guardId);
                console.log(`🔓 Guard désenregistré pour ${guardId}`);
            };
        }
    }, [canDetectChanges, hasUnsavedChanges, guardId, registerGuard, unregisterGuard]);

    // Intercepter les navigations externes
    useEffect(() => {
        if (canDetectChanges() && hasUnsavedChanges) {
            const handleGlobalNavigation = (event) => {
                console.log('🚨 Navigation externe détectée avec modifications non sauvegardées PaiementForm');
                
                if (event.detail && event.detail.source && event.detail.callback) {
                    console.log('🔄 Affichage modal pour navigation externe PaiementForm:', event.detail.source);
                    setGlobalNavigationCallback(() => event.detail.callback);
                    setShowGlobalModal(true);
                }
            };

            window.addEventListener('navigation-blocked', handleGlobalNavigation);

            return () => {
                window.removeEventListener('navigation-blocked', handleGlobalNavigation);
            };
        }
    }, [canDetectChanges, hasUnsavedChanges, setGlobalNavigationCallback, setShowGlobalModal]);

    // Debug: Afficher l'état des modifications
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            console.log('🔍 État modifications PaiementForm:', {
                guardId,
                hasUnsavedChanges,
                canDetectChanges: canDetectChanges(),
                mode,
                isPaiementAnnule
            });
        }
    }, [guardId, hasUnsavedChanges, canDetectChanges, mode, isPaiementAnnule]);

    // Cleanup lors du démontage
    useEffect(() => {
        return () => {
            if (mode !== 'view' && !isPaiementAnnule) {
                console.log(`🧹 Nettoyage ${guardId} lors du démontage`);
                unregisterGuard(guardId);
                resetChanges();
                setIsFullyInitialized(false);
            }
        };
    }, [mode, guardId, unregisterGuard, resetChanges, isPaiementAnnule, setIsFullyInitialized]);

    return {
        // Le hook retourne des méthodes si nécessaire, sinon juste les effets
    };
};