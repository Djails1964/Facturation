// src/components/paiements/hooks/usePaiementForm.js

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigationGuard } from '../../../App';
import { useUnsavedChanges } from '../../../hooks/useUnsavedChanges';
import { useAutoNavigationGuard } from '../../../hooks/useAutoNavigationGuard';
import { showConfirm } from '../../../utils/modalSystem';
import { usePaiementActions } from './usePaiementActions';
import { useFactureActions } from '../../factures/hooks/useFactureActions';
import { useClientActions } from '../../clients/hooks/useClientActions';
import { getTodayIso } from '../../../utils/dateHelpers';
import { createLogger } from '../../../utils/createLogger';
import { 
    FORM_MODES, 
    PAIEMENT_ETATS,
    DEFAULT_VALUES
} from '../../../constants/paiementConstants';
import { UNSAVED_CHANGES_CONFIRM_CONFIG } from '../../../constants/appConstants';

export const usePaiementForm = ({ mode, idPaiement, onRetourListe, onPaiementCreated }) => {

    const log = createLogger('usePaiementForm');

    // ✅ Services via hooks d'actions
    const paiementActions = usePaiementActions();
    const factureActions = useFactureActions();
    const clientActions = useClientActions();
    
    // Navigation protection
    const { registerGuard, unregisterGuard } = useNavigationGuard();
    const guardId = `paiement-form-${idPaiement || 'new'}`;
    
    // États de base
    const [paiement, setPaiement] = useState({
        // IDs
        idPaiement: '',
        idFacture: '',
        idClient: '',
        
        // Numéros
        numeroPaiement: '',
        numeroFacture: '',
        
        // Client
        nomClient: '',  // ✅ IMPORTANT : Permet d'afficher le nom du client
        
        // Détails du paiement
        datePaiement: getTodayIso(),
        montantPaye: '',
        methodePaiement: DEFAULT_VALUES.METHODE_PAIEMENT,
        commentaire: '',
        
        // État
        etat: '',
        statut: '',
        
        // Dates système
        dateCreation: '',
        dateModification: '',
        dateAnnulation: '',
        
        // Annulation
        motifAnnulation: '',
        
        // Infos facture (optionnelles)
        montantTotalFacture: '',
        ristourneFacture: ''
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
    
    // CLIENT-FIRST
    const [clients, setClients] = useState([]);
    const [clientsLoading, setClientsLoading] = useState(false);
    const [clientSelectionne, setClientSelectionne] = useState(null);
    
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

    // ✅ AJOUT : idClient dans getFormData pour la détection de modifications
    const getFormData = useCallback(() => {
        return {
            idClient: paiement.idClient || '',
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
    
    // Gestion des événements de navigation globale
    useEffect(() => {
        if (mode === FORM_MODES.VIEW || !hasUnsavedChanges) return;

        const handleNavigationBlocked = async (event) => {
            log.debug('🎯 PAIEMENT FORM - Événement navigation-blocked reçu:', event.detail);
            
            if (event.detail && event.detail.callback) {
                setGlobalNavigationCallback(() => event.detail.callback);
                
                try {
                    const result = await showConfirm(
                        UNSAVED_CHANGES_CONFIRM_CONFIG()
                    );
                    
                    if (result.action === 'confirm') {
                        log.debug('✅ PAIEMENT - Navigation confirmée');
                        resetChanges();
                        unregisterGuard(guardId);
                        event.detail.callback();
                        setGlobalNavigationCallback(null);
                    } else {
                        log.debug('❌ PAIEMENT - Navigation annulée');
                        setGlobalNavigationCallback(null);
                    }
                } catch (error) {
                    log.error('❌ Erreur modal globale:', error);
                }
            }
        };

        window.addEventListener('navigation-blocked', handleNavigationBlocked);
        
        return () => {
            window.removeEventListener('navigation-blocked', handleNavigationBlocked);
        };
    }, [mode, hasUnsavedChanges, resetChanges, guardId, unregisterGuard]);
    
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

        // ✅ AJOUT : États clients
        clients,
        setClients,
        clientsLoading,
        setClientsLoading,
        clientSelectionne,
        setClientSelectionne,
        
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
        guardId,
        
        // Paramètres d'entrée
        mode,
        idPaiement,
        onRetourListe,
        onPaiementCreated,
        
        // ✅ Actions au lieu de services directs
        paiementActions,
        factureActions,
        clientActions,
        unregisterGuard
    };
};