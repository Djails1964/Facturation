import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FORM_MODES } from '../../../constants/tarifConstants';

/**
 * Hook pour gérer le formulaire de tarif
 * 
 * ✅ REFACTORISÉ: Reçoit maintenant les données de useTarifGestionState
 * au lieu de les charger lui-même (évite la duplication)
 * ✅ NOUVEAU: Utilise tarifActions pour les appels API
 * 
 * @param {Object} params
 * @param {string} params.mode - Mode du formulaire (CREATE, EDIT, VIEW)
 * @param {number} params.tarifId - ID du tarif (pour EDIT/VIEW)
 * @param {Function} params.onRetourListe - Callback pour retour à la liste
 * @param {Function} params.onTarifCreated - Callback après création
 * @param {Array} params.services - Services depuis useTarifGestionState
 * @param {Array} params.unites - Unités depuis useTarifGestionState
 * @param {Array} params.typesTarifs - Types tarifs depuis useTarifGestionState
 * @param {Object} params.tarifActions - Actions API depuis useTarifGestionState
 * @param {Function} params.loadUnitesByService - Fonction pour charger les unités d'un service
 */
export const useTarifForm = ({ 
    mode, 
    tarifId, 
    onRetourListe, 
    onTarifCreated,
    services = [],
    unites = [],
    typesTarifs = [],
    tarifActions,
    loadUnitesByService
}) => {
    const [isLoading, setIsLoading] = useState(true);
    const [tarif, setTarif] = useState({
        idService: '',
        idUnite: '',
        typeTarifId: '',
        prix: '',
        date_debut: '',
        date_fin: ''
    });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showUnsavedModal, setShowUnsavedModal] = useState(false);
    const [showGlobalModal, setShowGlobalModal] = useState(false);
    const [globalNavigationCallback, setGlobalNavigationCallback] = useState(null);
    const [guardId] = useState(`tarif-form-${Date.now()}`);
    
    // serviceUnites local uniquement (pour le filtre par service)
    const [serviceUnites, setServiceUnites] = useState({});
    
    const navigate = useNavigate();
    
    // États dérivés
    const isCreate = mode === FORM_MODES.CREATE;
    const isEdit = mode === FORM_MODES.EDIT;
    const isView = mode === FORM_MODES.VIEW;
    const isReadOnly = isView;
    
    // Chargement initial sans duplication
    useEffect(() => {
        const initializeForm = async () => {
            try {
                setIsLoading(true);
                
                // ✅ IMPORTANT: Vérifier que les données sont disponibles
                if (!services || services.length === 0) {
                    console.warn('⚠️ useTarifForm: Services non disponibles');
                }
                if (!unites || unites.length === 0) {
                    console.warn('⚠️ useTarifForm: Unités non disponibles');
                }
                if (!typesTarifs || typesTarifs.length === 0) {
                    console.warn('⚠️ useTarifForm: Types tarifs non disponibles');
                }
                
                // Charger le tarif si mode edit/view
                if ((isEdit || isView) && tarifId && tarifActions) {
                    await loadTarif(tarifId);
                }
                
            } catch (error) {
                console.error('❌ Erreur initialisation:', error);
                setError('Erreur lors du chargement des données');
            } finally {
                setIsLoading(false);
            }
        };
        
        initializeForm();
    }, [mode, tarifId, services, unites, typesTarifs, tarifActions]);
    
    // Chargement des unités spécifiques à un service
    const loadServiceUnites = async (idService) => {
        if (!loadUnitesByService) {
            console.error('❌ loadUnitesByService non fourni');
            return;
        }
        
        try {
            // Utilise la fonction fournie par useTarifGestionState
            await loadUnitesByService(idService);
            
            // Note: Les données seront dans serviceUnites de useTarifGestionState
            // On pourrait aussi les stocker localement si nécessaire
        } catch (error) {
            console.error('❌ Erreur chargement unités service:', error);
        }
    };
    
    // ✅ REFACTORISÉ: Chargement d'un tarif spécifique avec tarifActions
    const loadTarif = async (id) => {
        if (!tarifActions) {
            console.error('❌ tarifActions non fourni');
            setError('Actions de tarification non disponibles');
            return;
        }
        
        try {
            // ✅ NOUVEAU: Utilisation de tarifActions.getTarifs au lieu de tarificationService.getTarif
            const tarifs = await tarifActions.getTarifs({ id });
            
            // getTarifs retourne un tableau, prendre le premier élément
            const tarifData = Array.isArray(tarifs) && tarifs.length > 0 ? tarifs[0] : null;
            
            if (tarifData) {
                setTarif(tarifData);
                // Charger les unités pour le service sélectionné
                if (tarifData.idService) {
                    await loadServiceUnites(tarifData.idService);
                }
            } else {
                throw new Error('Tarif non trouvé');
            }
        } catch (error) {
            console.error('❌ Erreur chargement tarif:', error);
            setError('Erreur lors du chargement du tarif');
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
        tarif,
        setTarif,
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
        services,
        unites,
        typesTarifs,
        serviceUnites,

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
        
    };
};