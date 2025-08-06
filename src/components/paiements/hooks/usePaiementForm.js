import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigationGuard } from '../../../App';
import { useUnsavedChanges } from '../../../hooks/useUnsavedChanges';
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

export const usePaiementForm = ({ mode, paiementId, onRetourListe, onPaiementCreated }) => {
    // Services
    const paiementService = new PaiementService();
    const factureService = new FactureService();
    
    // Navigation protection
    const { registerGuard, unregisterGuard } = useNavigationGuard();
    const guardId = `paiement-form-${paiementId || 'new'}`;
    
    // États de base
    const [paiement, setPaiement] = useState({
        factureId: '',
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
    
    // États pour les modifications non sauvegardées
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
    
    // Fonction pour obtenir les données du formulaire
    const getFormData = useCallback(() => ({
        factureId: paiement.factureId,
        datePaiement: paiement.datePaiement,
        montantPaye: paiement.montantPaye,
        methodePaiement: paiement.methodePaiement,
        commentaire: paiement.commentaire
    }), [paiement]);
    
    // Fonction pour vérifier si on peut détecter les changements
    const canDetectChanges = useCallback(() => {
        return !isLoading && 
               !isSubmitting && 
               isInitialLoadDone && 
               isFullyInitialized && 
               Object.keys(initialFormData).length > 0 &&
               mode !== FORM_MODES.VIEW &&
               !isPaiementAnnule;
    }, [isLoading, isSubmitting, isInitialLoadDone, isFullyInitialized, initialFormData, mode, isPaiementAnnule]);
    
    // Hook pour les modifications non sauvegardées
    const currentFormData = useMemo(() => {
        return canDetectChanges() ? getFormData() : {};
    }, [canDetectChanges, paiement]);
    
    const {
        hasUnsavedChanges,
        showUnsavedModal,
        markAsSaved,
        confirmNavigation,
        cancelNavigation,
        requestNavigation,
        resetChanges
    } = useUnsavedChanges(initialFormData, currentFormData, isSubmitting, false);
    
    return {
        // États
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
        
        // Dérivations
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
        paiementId,
        onRetourListe,
        onPaiementCreated,
        
        // Services
        paiementService,
        factureService,
        registerGuard,
        unregisterGuard
    };
};