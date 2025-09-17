import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TarificationService from '../../../services/TarificationService';
import { FORM_MODES } from '../../../constants/tarifConstants';

export const useTarifForm = ({ mode, tarifId, onRetourListe, onTarifCreated }) => {
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
    
    // Services et données
    const [services, setServices] = useState([]);
    const [unites, setUnites] = useState([]);
    const [typesTarifs, setTypesTarifs] = useState([]);
    const [serviceUnites, setServiceUnites] = useState({});
    const [servicesLoading, setServicesLoading] = useState(false);
    const [unitesLoading, setUnitesLoading] = useState(false);
    const [typesTarifsLoading, setTypesTarifsLoading] = useState(false);
    
    const [tarificationService] = useState(new TarificationService());
    const navigate = useNavigate();
    
    // États dérivés
    const isCreate = mode === FORM_MODES.CREATE;
    const isEdit = mode === FORM_MODES.EDIT;
    const isView = mode === FORM_MODES.VIEW;
    const isReadOnly = isView;
    
    // Chargement initial
    useEffect(() => {
        const initializeForm = async () => {
            try {
                setIsLoading(true);
                await tarificationService.initialiser();
                
                // Charger les données de base
                await Promise.all([
                    loadServices(),
                    loadUnites(),
                    loadTypesTarifs()
                ]);
                
                // Charger le tarif si mode edit/view
                if ((isEdit || isView) && tarifId) {
                    await loadTarif(tarifId);
                }
                
            } catch (error) {
                console.error('Erreur initialisation:', error);
                setError('Erreur lors du chargement des données');
            } finally {
                setIsLoading(false);
            }
        };
        
        initializeForm();
    }, [mode, tarifId]);
    
    const loadServices = async () => {
        try {
            setServicesLoading(true);
            const servicesData = await tarificationService.chargerServices();
            setServices(Array.isArray(servicesData) ? servicesData : []);
        } catch (error) {
            console.error('Erreur chargement services:', error);
            setError('Erreur lors du chargement des services');
        } finally {
            setServicesLoading(false);
        }
    };
    
    const loadUnites = async () => {
        try {
            setUnitesLoading(true);
            const unitesData = await tarificationService.chargerUnites();
            setUnites(Array.isArray(unitesData) ? unitesData : []);
        } catch (error) {
            console.error('Erreur chargement unités:', error);
            setError('Erreur lors du chargement des unités');
        } finally {
            setUnitesLoading(false);
        }
    };
    
    const loadTypesTarifs = async () => {
        try {
            setTypesTarifsLoading(true);
            const typesTarifsData = await tarificationService.chargerTypesTarifs();
            setTypesTarifs(Array.isArray(typesTarifsData) ? typesTarifsData : []);
        } catch (error) {
            console.error('Erreur chargement types tarifs:', error);
            setError('Erreur lors du chargement des types de tarifs');
        } finally {
            setTypesTarifsLoading(false);
        }
    };
    
    const loadServiceUnites = async (idService) => {
        try {
            const unitesForService = await tarificationService.chargerUnites(idService);
            setServiceUnites(prev => ({
                ...prev,
                [idService]: Array.isArray(unitesForService) ? unitesForService : []
            }));
        } catch (error) {
            console.error('Erreur chargement unités service:', error);
        }
    };
    
    const loadTarif = async (id) => {
        try {
            const tarifData = await tarificationService.getTarif(id);
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
            console.error('Erreur chargement tarif:', error);
            setError('Erreur lors du chargement du tarif');
        }
    };
    
    // Gestion des changements
    const canDetectChanges = () => !isView;
    
    const registerGuard = (id, guardFunction) => {
        // Implémentation du guard
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
        
        // Données
        services,
        unites,
        typesTarifs,
        serviceUnites,
        servicesLoading,
        unitesLoading,
        typesTarifsLoading,
        
        // Services
        tarificationService,
        
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
        loadServiceUnites,
        loadServices,
        loadUnites,
        loadTypesTarifs
    };
};