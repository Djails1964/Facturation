import { useState, useEffect } from 'react';
import { FORM_MODES } from '../../../constants/tarifConstants';

/**
 * Hook pour gérer le formulaire de tarif spécial
 * 
 * ✅ REFACTORISÉ: Reçoit maintenant les données de useTarifGestionState
 * au lieu de les charger lui-même (évite la duplication)
 * ✅ NOUVEAU: Utilise tarifActions pour les appels API
 */
export const useTarifSpecialForm = ({ 
    mode, 
    tarifSpecialId, 
    onRetourListe, 
    onTarifSpecialCreated,
    // ✅ NOUVEAU: Données reçues en props
    clients = [],
    services = [],
    unites = [],
    tarifActions, // ✅ NOUVEAU: Remplace tarificationService
    loadUnitesByService
}) => {
    const [isLoading, setIsLoading] = useState(true);
    const [tarifSpecial, setTarifSpecial] = useState({
        idClient: '',
        idService: '',
        idUnite: '',
        prix: '',
        date_debut: '',
        date_fin: '',
        note: ''
    });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showUnsavedModal, setShowUnsavedModal] = useState(false);
    const [showGlobalModal, setShowGlobalModal] = useState(false);
    const [globalNavigationCallback, setGlobalNavigationCallback] = useState(null);
    const [guardId] = useState(`tarif-special-form-${Date.now()}`);
    
    // ✅ MODIFIÉ: serviceUnites local uniquement (pour le filtre par service)
    const [serviceUnites, setServiceUnites] = useState({});
    
    // États dérivés
    const isCreate = mode === FORM_MODES.CREATE;
    const isEdit = mode === FORM_MODES.EDIT;
    const isView = mode === FORM_MODES.VIEW;
    const isReadOnly = isView;
    
    // ✅ SIMPLIFIÉ: Chargement initial sans duplication
    useEffect(() => {
        const initializeForm = async () => {
            try {
                setIsLoading(true);
                
                // ✅ IMPORTANT: Vérifier que les données sont disponibles
                if (!clients || clients.length === 0) {
                    console.warn('⚠️ useTarifSpecialForm: Clients non disponibles');
                }
                if (!services || services.length === 0) {
                    console.warn('⚠️ useTarifSpecialForm: Services non disponibles');
                }
                
                // Charger le tarif spécial si mode edit/view
                if ((isEdit || isView) && tarifSpecialId && tarifActions) {
                    await loadTarifSpecial(tarifSpecialId);
                }
                
            } catch (error) {
                console.error('❌ Erreur initialisation:', error);
                setError('Erreur lors du chargement des données');
            } finally {
                setIsLoading(false);
            }
        };
        
        initializeForm();
    }, [mode, tarifSpecialId, clients, services, tarifActions]);
    
    // ✅ CONSERVÉ: Chargement des unités spécifiques à un service
    const loadServiceUnites = async (idService) => {
        if (!loadUnitesByService) {
            console.error('❌ loadUnitesByService non fourni');
            return;
        }
        
        try {
            await loadUnitesByService(idService);
        } catch (error) {
            console.error('❌ Erreur chargement unités service:', error);
        }
    };
    
    // ✅ REFACTORISÉ: Chargement d'un tarif spécial avec tarifActions
    const loadTarifSpecial = async (id) => {
        if (!tarifActions) {
            console.error('❌ tarifActions non fourni');
            setError('Actions de tarification non disponibles');
            return;
        }
        
        try {
            // ✅ NOUVEAU: Utilisation de tarifActions.getTarifsSpeciaux au lieu de tarificationService.getTarifSpecial
            const tarifsSpeciaux = await tarifActions.getTarifsSpeciaux({ id });
            
            // getTarifsSpeciaux retourne un tableau, prendre le premier élément
            const tarifSpecialData = Array.isArray(tarifsSpeciaux) && tarifsSpeciaux.length > 0 ? tarifsSpeciaux[0] : null;
            
            if (tarifSpecialData) {
                setTarifSpecial(tarifSpecialData);
                // Charger les unités pour le service sélectionné
                if (tarifSpecialData.idService) {
                    await loadServiceUnites(tarifSpecialData.idService);
                }
            } else {
                throw new Error('Tarif spécial non trouvé');
            }
        } catch (error) {
            console.error('❌ Erreur chargement tarif spécial:', error);
            setError('Erreur lors du chargement du tarif spécial');
        }
    };
    
    // Gestion des changements
    const canDetectChanges = () => !isView;
    
    const registerGuard = (id, guardFunction) => {
        console.log('Guard registered:', id);
    };
    
    const unregisterGuard = (id) => {
        console.log('Guard unregistered:', id);
    };
    
    const resetChanges = () => {
        setHasUnsavedChanges(false);
    };
    
    const confirmNavigation = () => {
        setShowUnsavedModal(false);
        setHasUnsavedChanges(false);
        if (onRetourListe) {
            onRetourListe();
        }
    };
    
    const cancelNavigation = () => {
        setShowUnsavedModal(false);
    };
    
    return {
        // États principaux
        isLoading,
        tarifSpecial,
        setTarifSpecial,
        error,
        setError,
        isSubmitting,
        setIsSubmitting,
        hasUnsavedChanges,
        setHasUnsavedChanges,
        showUnsavedModal,
        setShowUnsavedModal,
        showGlobalModal,
        setShowGlobalModal,
        globalNavigationCallback,
        setGlobalNavigationCallback,
        guardId,
        
        // ✅ MODIFIÉ: Données reçues en props
        clients,
        services,
        serviceUnites,
        
        // ✅ SUPPRIMÉ: clientsLoading, servicesLoading
        // Ces états sont maintenant dans useTarifGestionState
        
        // ✅ NOUVEAU: Exposer tarifActions pour les autres hooks
        tarifActions,
        
        // États dérivés
        isCreate,
        isEdit,
        isView,
        isReadOnly,
        
        // Fonctions
        canDetectChanges,
        registerGuard,
        unregisterGuard,
        resetChanges,
        confirmNavigation,
        cancelNavigation,
        loadServiceUnites
        
        // ✅ SUPPRIMÉ: loadClients, loadServices
        // Ces fonctions sont maintenant dans useTarifGestionState
    };
};