import { useState, useEffect } from 'react';
import TarificationService from '../../../services/TarificationService';
import ClientService from '../../../services/ClientService';
import { FORM_MODES } from '../../../constants/tarifConstants';

export const useTarifSpecialForm = ({ mode, tarifSpecialId, onRetourListe, onTarifSpecialCreated }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [tarifSpecial, setTarifSpecial] = useState({
        clientId: '',
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
    
    // Services et données
    const [clients, setClients] = useState([]);
    const [services, setServices] = useState([]);
    const [serviceUnites, setServiceUnites] = useState({});
    const [clientsLoading, setClientsLoading] = useState(false);
    const [servicesLoading, setServicesLoading] = useState(false);
    
    const [tarificationService] = useState(new TarificationService());
    const [clientService] = useState(new ClientService());
    
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
                    loadClients(),
                    loadServices()
                ]);
                
                // Charger le tarif spécial si mode edit/view
                if ((isEdit || isView) && tarifSpecialId) {
                    await loadTarifSpecial(tarifSpecialId);
                }
                
            } catch (error) {
                console.error('Erreur initialisation:', error);
                setError('Erreur lors du chargement des données');
            } finally {
                setIsLoading(false);
            }
        };
        
        initializeForm();
    }, [mode, tarifSpecialId]);
    
    const loadClients = async () => {
        try {
            setClientsLoading(true);
            const clientsData = await clientService.chargerClients();
            setClients(Array.isArray(clientsData) ? clientsData : []);
        } catch (error) {
            console.error('Erreur chargement clients:', error);
            setError('Erreur lors du chargement des clients');
        } finally {
            setClientsLoading(false);
        }
    };
    
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
    
    const loadTarifSpecial = async (id) => {
        try {
            const tarifSpecialData = await tarificationService.getTarifSpecial(id);
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
            console.error('Erreur chargement tarif spécial:', error);
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
        
        // Données
        clients,
        services,
        serviceUnites,
        clientsLoading,
        servicesLoading,
        
        // Services
        tarificationService,
        clientService,
        
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
        loadClients,
        loadServices
    };
};
