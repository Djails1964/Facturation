// src/components/paiements/hooks/usePaiementForm.js
// ✅ VERSION CORRIGÉE avec accès à guardId et unregisterGuard

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigationGuard } from '../../../App'; // ✅ AJOUTER
import { useUnsavedChanges } from '../../../hooks/useUnsavedChanges';
import { useAutoNavigationGuard } from '../../../hooks/useAutoNavigationGuard';
import { showConfirm } from '../../../utils/modalSystem'; // ✅ AJOUTER
import PaiementService from '../../../services/PaiementService';
import FactureService from '../../../services/FactureService';
import activityLogsService from '../../../services/activityLogsService';
import DateService from '../../../utils/DateService';
import { 
    FORM_MODES, 
    VALIDATION_MESSAGES, 
    NOTIFICATIONS,
    PAIEMENT_ETATS,
    LOG_ACTIONS 
} from '../../../constants/paiementConstants';

export const usePaiementForm = ({ mode, idPaiement, onRetourListe, onPaiementCreated }) => {
    // Services
    const paiementService = new PaiementService();
    const factureService = new FactureService();
    
    // ✅ Navigation protection - AJOUTER
    const { registerGuard, unregisterGuard } = useNavigationGuard();
    const guardId = `paiement-form-${idPaiement || 'new'}`;
    
    // États de base
    const [paiement, setPaiement] = useState({
        idFacture: '',
        datePaiement: DateService.getTodayInputFormat(),
        montantPaye: '',
        methodePaiement: '',
        commentaire: '',
        etat: '',
        dateCreation: '',
        dateModification: '',
        dateAnnulation: ''
    });
    
    const [factures, setFactures] = useState([]);
    const [factureSelectionnee, setFactureSelectionnee] = useState(null);
    const [logsInfo, setLogsInfo] = useState({
        userCreation: null,
        userModification: null,
        userAnnulation: null,
        dateCreationComplete: null,
        dateModificationComplete: null,
        dateAnnulationComplete: null
    });
    
    // États UI
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [logsLoading, setLogsLoading] = useState(false);
    const [facturesLoading, setFacturesLoading] = useState(false);
    
    // États pour la protection des modifications
    const [isFullyInitialized, setIsFullyInitialized] = useState(false);
    const [isInitialLoadDone, setIsInitialLoadDone] = useState(false);
    const [initialFormData, setInitialFormData] = useState({});
    const [showGlobalModal, setShowGlobalModal] = useState(false);
    const [globalNavigationCallback, setGlobalNavigationCallback] = useState(null);
    
    // Dérivations d'état
    const isReadOnly = mode === FORM_MODES.VIEW;
    const isEdit = mode === FORM_MODES.EDIT;
    const isCreate = mode === FORM_MODES.CREATE;
    const isPaiementAnnule = paiement.etat === PAIEMENT_ETATS.ANNULE;
    const canEdit = isEdit && !isPaiementAnnule;
    
    const canDetectChanges = useCallback(() => {
        return !isLoading && 
               !isSubmitting && 
               isInitialLoadDone && 
               isFullyInitialized && 
               Object.keys(initialFormData).length > 0 &&
               mode !== FORM_MODES.VIEW;
    }, [isLoading, isSubmitting, isInitialLoadDone, isFullyInitialized, initialFormData, mode]);

    const getFormData = useCallback(() => {
        return {
            idFacture: paiement.idFacture || '',
            datePaiement: paiement.datePaiement || '',
            montantPaye: paiement.montantPaye || '',
            methodePaiement: paiement.methodePaiement || '',
            commentaire: paiement.commentaire || ''
        };
    }, [paiement]);

    const currentFormData = useMemo(() => {
        return canDetectChanges() ? getFormData() : {};
    }, [canDetectChanges, paiement]);
    
    // Système de détection des modifications non sauvegardées
    const {
        hasUnsavedChanges,
        showUnsavedModal,
        markAsSaved,
        confirmNavigation,
        cancelNavigation,
        requestNavigation,
        resetChanges
    } = useUnsavedChanges(initialFormData, currentFormData, isSubmitting, false);
    
    // Protection automatique de navigation
    useAutoNavigationGuard(hasUnsavedChanges, {
        isActive: mode !== FORM_MODES.VIEW && isFullyInitialized,
        guardId: guardId,
        debug: false
    });
    
    // ✅ GESTION DES ÉVÉNEMENTS DE NAVIGATION GLOBALE - VERSION CORRIGÉE
    useEffect(() => {
        if (mode === FORM_MODES.VIEW || !hasUnsavedChanges) return;

        const handleNavigationBlocked = async (event) => {
            console.log('🌐 PAIEMENT FORM - Événement navigation-blocked reçu:', event.detail);
            
            if (event.detail && event.detail.callback) {
                // Stocker le callback
                setGlobalNavigationCallback(() => event.detail.callback);
                
                // Afficher la modal via le système modal
                try {
                    const result = await showConfirm({
                        title: "Modifications non sauvegardées",
                        message: "Vous avez des modifications non sauvegardées. Souhaitez-vous vraiment quitter sans sauvegarder ?",
                        confirmText: "Quitter sans sauvegarder",
                        cancelText: "Continuer l'édition",
                        type: 'warning'
                    });
                    
                    if (result.action === 'confirm') {
                        console.log('✅ PAIEMENT - Navigation confirmée');
                        resetChanges();
                        unregisterGuard(guardId); // ✅ maintenant accessible
                        event.detail.callback();
                        setGlobalNavigationCallback(null);
                    } else {
                        console.log('❌ PAIEMENT - Navigation annulée');
                        setGlobalNavigationCallback(null);
                    }
                } catch (error) {
                    console.error('❌ Erreur modal globale:', error);
                }
            }
        };

        window.addEventListener('navigation-blocked', handleNavigationBlocked);
        
        return () => {
            window.removeEventListener('navigation-blocked', handleNavigationBlocked);
        };
    }, [mode, hasUnsavedChanges, resetChanges, guardId, unregisterGuard]); // ✅ dépendances correctes
    
    // RETOUR DES DONNÉES ET FONCTIONS
    return {
        // États principaux
        paiement,
        setPaiement,
        factures,
        setFactures,
        factureSelectionnee,
        setFactureSelectionnee,
        logsInfo,
        setLogsInfo,
        
        // États UI
        isLoading,
        setIsLoading,
        isSubmitting,
        setIsSubmitting,
        error,
        setError,
        logsLoading,
        setLogsLoading,
        facturesLoading,
        setFacturesLoading,
        
        // Protection des modifications
        isFullyInitialized,
        setIsFullyInitialized,
        isInitialLoadDone,
        setIsInitialLoadDone,
        initialFormData,
        setInitialFormData,
        showGlobalModal,
        setShowGlobalModal,
        globalNavigationCallback,
        setGlobalNavigationCallback,
        hasUnsavedChanges,
        showUnsavedModal,
        markAsSaved,
        confirmNavigation,
        cancelNavigation,
        requestNavigation,
        resetChanges,
        
        // Dérivations d'état
        isReadOnly,
        isEdit,
        isCreate,
        isPaiementAnnule,
        canEdit,
        canDetectChanges,
        getFormData,
        guardId, // ✅ Retourner pour utilisation dans handlers
        
        // Paramètres d'entrée
        mode,
        idPaiement,
        onRetourListe,
        onPaiementCreated,
        
        // Services
        paiementService,
        factureService,
        unregisterGuard // ✅ Retourner pour utilisation dans handlers
    };
};