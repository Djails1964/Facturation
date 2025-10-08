// src/hooks/useAutoNavigationGuard.js
// Hook utilitaire pour gérer automatiquement la protection de navigation
// ✨ Simplifie l'enregistrement des guards et évite les oublis

import { useEffect, useMemo } from 'react';
import { useNavigationGuard } from '../App';

/**
 * Hook qui gère automatiquement la protection contre la perte de modifications
 * 
 * Ce hook remplace les 40+ lignes de code répétitives dans chaque formulaire
 * par un simple appel. Il enregistre automatiquement le guard et le nettoie.
 * 
 * @param {boolean} hasUnsavedChanges - Indique si le formulaire a des modifications non sauvegardées
 * @param {Object} options - Options de configuration
 * @param {boolean} [options.isActive=true] - Active/désactive la protection
 * @param {string} [options.guardId] - ID personnalisé du guard (généré auto sinon)
 * @param {Function} [options.onNavigationBlocked] - Callback appelé quand navigation bloquée
 * @param {boolean} [options.debug=false] - Active les logs de debug
 * 
 * @returns {Object} - { guardId, isProtected }
 * 
 * @example
 * // Utilisation basique
 * function PaiementForm({ mode }) {
 *   const { hasUnsavedChanges } = useUnsavedChanges(...);
 *   
 *   useAutoNavigationGuard(hasUnsavedChanges, {
 *     isActive: mode !== 'view'
 *   });
 * }
 * 
 * @example
 * // Utilisation avec debug
 * useAutoNavigationGuard(hasUnsavedChanges, {
 *   isActive: mode !== 'view' && isFullyInitialized,
 *   guardId: `paiement-form-${idPaiement}`,
 *   debug: true // Voir les logs dans la console
 * });
 */
export function useAutoNavigationGuard(hasUnsavedChanges, options = {}) {
    const {
        isActive = true,
        guardId: customGuardId = null,
        onNavigationBlocked = null,
        debug = false
    } = options;

    const { registerGuard, unregisterGuard } = useNavigationGuard();
    
    // Générer un ID unique si non fourni
    const guardId = useMemo(() => {
        if (customGuardId) return customGuardId;
        return `auto-guard-${Math.random().toString(36).substr(2, 9)}`;
    }, [customGuardId]);

    // ================================
    // ENREGISTREMENT AUTOMATIQUE DU GUARD
    // ================================
    useEffect(() => {
        // Ne rien faire si désactivé
        if (!isActive) {
            if (debug) {
                console.log(`🔓 ${guardId} - Protection désactivée`);
            }
            return;
        }

        if (debug) {
            console.log(`🛡️ ${guardId} - Enregistrement du guard`, { 
                hasUnsavedChanges,
                isActive 
            });
        }

        // Fonction guard : retourne true si navigation doit être bloquée
        const guardFunction = async () => {
            if (debug) {
                console.log(`🔍 ${guardId} - Guard vérifié:`, { hasUnsavedChanges });
            }
            
            // Appeler le callback si fourni ET si modifications présentes
            if (hasUnsavedChanges && onNavigationBlocked) {
                onNavigationBlocked();
            }
            
            // Retourner true pour bloquer la navigation
            return hasUnsavedChanges;
        };

        // Enregistrer le guard dans le système global
        registerGuard(guardId, guardFunction);

        // Nettoyer à la destruction du composant
        return () => {
            if (debug) {
                console.log(`🗑️ ${guardId} - Désenregistrement du guard`);
            }
            unregisterGuard(guardId);
        };
    }, [
        isActive, 
        hasUnsavedChanges, 
        guardId, 
        registerGuard, 
        unregisterGuard, 
        onNavigationBlocked,
        debug
    ]);

    // Retourner des informations utiles pour debug
    return {
        guardId,
        isProtected: isActive && hasUnsavedChanges
    };
}

/**
 * Version simplifiée du hook pour les cas basiques
 * 
 * @param {boolean} hasUnsavedChanges - Modifications non sauvegardées
 * @param {boolean} [isActive=true] - Activer la protection
 * 
 * @example
 * function ClientForm({ mode }) {
 *   const { hasUnsavedChanges } = useUnsavedChanges(...);
 *   
 *   // ✅ Ultra simple !
 *   useSimpleNavigationGuard(hasUnsavedChanges, mode !== 'view');
 * }
 */
export function useSimpleNavigationGuard(hasUnsavedChanges, isActive = true) {
    return useAutoNavigationGuard(hasUnsavedChanges, { isActive });
}

export default useAutoNavigationGuard;