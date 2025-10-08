import { useState, useEffect, useCallback, useRef } from 'react';
import TarificationService from '../../../services/TarificationService';
import ClientService from '../../../services/ClientService';
import api from '../../../services/api';

export const useTarifGestionState = () => {
  // États de base
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const isAuthorized = true; // Toujours autorisé car déjà vérifié par le parent
  const [userInfo, setUserInfo] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Modal de confirmation
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    type: 'warning',
    confirmText: 'Confirmer',
    entityType: ''
  });
  
  // Services
  const [tarificationService, setTarificationService] = useState(null);
  const [clientService] = useState(() => new ClientService());
  const initializationRef = useRef(false);
  
  // États partagés entre composants
  const [services, setServices] = useState([]);
  const [unites, setUnites] = useState([]);
  const [typesTarifs, setTypesTarifs] = useState([]);
  const [tarifs, setTarifs] = useState([]);
  const [tarifsSpeciaux, setTarifsSpeciaux] = useState([]);
  const [clients, setClients] = useState([]);
  const [serviceUnites, setServiceUnites] = useState({});
  const [defaultUnites, setDefaultUnites] = useState({});
  
  // Vérification d'autorisation - UNE SEULE FOIS
  // useEffect(() => {
  //   if (initializationRef.current) return;
    
  //   const initializeEverything = async () => {
  //     try {
  //       // 1. Vérifier l'autorisation
  //       console.log('🔍 Vérification des droits via API...');
  //       setIsLoading(true);
        
  //       const response = await api.get('auth-api.php?check_session');
        
  //       if (response.success && response.user) {
  //         const user = response.user;
  //         const rolesAutorises = ['admin', 'gestionnaire'];
  //         const userRole = user.role?.toLowerCase();
          
  //         if (rolesAutorises.includes(userRole)) {
  //           console.log(`✅ Accès autorisé pour le rôle: ${user.role}`);
  //           setUserInfo(user);
  //           setIsAuthorized(true);
            
  //           // 2. Initialiser le service DIRECTEMENT (pas dans un autre useEffect)
  //           console.log('Initialisation du service de tarification...');
  //           const service = new TarificationService();
  //           await service.initialiser();
  //           setTarificationService(service);
  //           setIsInitialized(true);
            
  //           // 3. Charger les données
  //           await loadAllData(service);
  //         } else {
  //           setIsAuthorized(false);
  //           setMessage('Accès refusé');
  //         }
  //       }
  //     } catch (error) {
  //       console.error('Erreur:', error);
  //       setIsAuthorized(false);
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   };
    
  //   initializationRef.current = true;
  //   initializeEverything();
  // }, []);
  
  // Fonctions de chargement des données avec useCallback pour stabilité
  const loadServices = useCallback(async (service = tarificationService) => {
    if (!service) return;
    
    try {
      console.log('📡 Chargement des services...');
      const servicesData = await service.chargerServices();
      console.log('✅ Services chargés:', servicesData?.length || 0);
      setServices(Array.isArray(servicesData) ? servicesData : []);
    } catch (error) {
      console.error('❌ Erreur chargement services:', error);
      setMessage('Erreur lors du chargement des services: ' + error.message);
      setMessageType('error');
      setServices([]);
    }
  }, [tarificationService]);
  
  const loadUnites = useCallback(async (service = tarificationService) => {
    if (!service) return;
    
    try {
      console.log('📡 Chargement des unités...');
      const unitesData = await service.chargerUnites();
      
      let unitesArray = [];
      
      if (Array.isArray(unitesData)) {
        unitesArray = unitesData;
      } else if (unitesData && typeof unitesData === 'object') {
        try {
          if (Object.keys(unitesData).length > 0) {
            const values = Object.values(unitesData);
            if (Array.isArray(values[0])) {
              values.forEach(v => {
                if (Array.isArray(v)) unitesArray = [...unitesArray, ...v];
              });
            } else {
              unitesArray = values;
            }
          }
        } catch (error) {
          console.error("Erreur lors du traitement de l'objet unités:", error);
        }
      }
      
      console.log('✅ Unités chargées:', unitesArray?.length || 0);
      setUnites(unitesArray);
    } catch (error) {
      console.error('❌ Erreur chargement unités:', error);
      setMessage('Erreur lors du chargement des unités: ' + error.message);
      setMessageType('error');
      setUnites([]);
    }
  }, [tarificationService]);
  
  const loadUnitesByService = useCallback(async (idService) => {
    if (!tarificationService) return;
    
    try {
      console.log('📡 Chargement des unités pour service:', idService);
      const unitesForService = await tarificationService.chargerUnites(idService);
      
      setServiceUnites(prev => ({
        ...prev,
        [idService]: Array.isArray(unitesForService) ? unitesForService : []
      }));
      
      const defaultUnite = unitesForService?.find(u => u.isDefault);
      if (defaultUnite) {
        setDefaultUnites(prev => ({
          ...prev,
          [idService]: defaultUnite.id
        }));
      }
    } catch (error) {
      console.error('❌ Erreur chargement unités service:', error);
      setMessage('Erreur lors du chargement des unités pour le service: ' + error.message);
      setMessageType('error');
    }
  }, [tarificationService]);
  
  const loadTypesTarifs = useCallback(async (service = tarificationService) => {
    if (!service) return;
    
    try {
      console.log('📡 Chargement des types de tarifs...');
      const typesTarifsData = await service.chargerTypesTarifs();
      console.log('✅ Types tarifs chargés:', typesTarifsData?.length || 0);
      setTypesTarifs(Array.isArray(typesTarifsData) ? typesTarifsData : []);
    } catch (error) {
      console.error('❌ Erreur chargement types tarifs:', error);
      setMessage('Erreur lors du chargement des types de tarifs: ' + error.message);
      setMessageType('error');
      setTypesTarifs([]);
    }
  }, [tarificationService]);
  
  // 🔧 FONCTION CORRIGÉE POUR TARIFS - AVEC PARAMÈTRE SERVICE
  const loadTarifs = useCallback(async (service = tarificationService) => {
    const serviceToUse = service || tarificationService;
    
    if (!serviceToUse) {
      console.warn('⚠️ loadTarifs: aucun service disponible');
      return;
    }
    
    try {
      console.log('📡 Chargement des tarifs...');
      console.log('🔍 Service utilisé:', !!serviceToUse);
      
      const tarifsData = await serviceToUse.getAllTarifs();
      console.log('✅ Tarifs chargés:', tarifsData?.length || 0);
      
      if (Array.isArray(tarifsData)) {
        setTarifs(tarifsData);
      } else if (tarifsData && typeof tarifsData === 'object') {
        // Gestion des formats d'objet alternatifs
        if (tarifsData.data && Array.isArray(tarifsData.data)) {
          setTarifs(tarifsData.data);
        } else if (tarifsData.tarifs && Array.isArray(tarifsData.tarifs)) {
          setTarifs(tarifsData.tarifs);
        } else {
          console.warn('⚠️ Structure de tarifs inconnue:', tarifsData);
          setTarifs([]);
        }
      } else {
        console.warn('⚠️ Format de tarifs invalide:', typeof tarifsData);
        setTarifs([]);
      }
      
    } catch (error) {
      console.error('❌ Erreur chargement tarifs:', error);
      setMessage('Erreur lors du chargement des tarifs: ' + error.message);
      setMessageType('error');
      setTarifs([]);
    }
  }, [tarificationService]);
  
  const loadTarifsSpeciaux = useCallback(async (service = tarificationService) => {
    const serviceToUse = service || tarificationService;
    
    if (!serviceToUse) return;
    
    try {
      console.log('📡 Chargement des tarifs spéciaux...');
      const tarifsSpeciauxData = await serviceToUse.getAllTarifsSpeciaux();
      console.log('✅ Tarifs spéciaux chargés:', tarifsSpeciauxData?.length || 0);
      setTarifsSpeciaux(Array.isArray(tarifsSpeciauxData) ? tarifsSpeciauxData : []);
    } catch (error) {
      console.error('❌ Erreur chargement tarifs spéciaux:', error);
      setMessage('Erreur lors du chargement des tarifs spéciaux: ' + error.message);
      setMessageType('error');
      setTarifsSpeciaux([]);
    }
  }, [tarificationService]);
  
  const loadClients = useCallback(async () => {
    try {
      if (!clientService) return;
      console.log('📡 useTarifGestionState - Chargement des clients...');
      const clientsData = await clientService.chargerClients();
      console.log('✅ useTarifGestionState - Clients chargés:', clientsData?.length || 0);
      console.log('useTarifGestionState - clientsData :', clientsData)
      
      if (Array.isArray(clientsData)) {
        setClients(clientsData);
      } else {
        console.warn('Format de données clients incorrect:', clientsData);
        setClients([]);
        setMessage('Aucun client chargé ou format de données incorrect');
        setMessageType('warning');
      }
    } catch (error) {
      console.error('❌ Erreur chargement clients:', error);
      setMessage('Erreur lors du chargement des clients: ' + error.message);
      setMessageType('error');
      setClients([]);
    }
  }, [clientService]);
  
  // 🔧 FONCTION CORRIGÉE pour charger toutes les données - AVEC PASSAGE DU SERVICE
  const loadAllData = useCallback(async (service) => {
    if (!isAuthorized || !service) {
      console.log('⚠️ loadAllData: non autorisé ou service manquant');
      return;
    }
    
    console.log('🔄 Début du chargement de toutes les données...');
    setIsLoading(true);
    
    try {
      // ✅ Chargement séquentiel en passant le service explicitement
      await loadServices(service);
      await loadUnites(service);
      await loadTypesTarifs(service);
      await loadTarifs(service); // ✅ IMPORTANT: Passage explicite du service
      await loadTarifsSpeciaux(service);
      await loadClients();
      
      console.log('✅ Chargement de toutes les données terminé');
      setTimeout(() => {
        setIsLoading(false);
      }, 100);

    } catch (error) {
      console.error('❌ Erreur lors du chargement des données:', error);
      setMessage('Erreur lors du chargement des données: ' + error.message);
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthorized, loadServices, loadUnites, loadTypesTarifs, loadTarifs, loadTarifsSpeciaux, loadClients]);
  

  useEffect(() => {
    if (isInitialized || tarificationService) return;
    
    const initTarificationService = async () => {
      try {
        console.log('Initialisation du service de tarification...');
        const service = new TarificationService();
        await service.initialiser();
        setTarificationService(service);
        setIsInitialized(true);
        console.log('Service de tarification initialisé');
        
        // ✅ Charger APRÈS l'initialisation, mais le composant est déjà rendu
        loadAllData(service);
      } catch (error) {
        console.error('Erreur:', error);
        setMessage('Erreur: ' + error.message);
        setMessageType('error');
      }
    };

    initTarificationService();
  }, []);
    
  // Gestion des messages
  const handleDismissMessage = useCallback(() => {
    setMessage('');
    setMessageType('');
  }, []);
  
  const handleRetryAuthorization = useCallback(() => {
    setIsLoading(true);
    setMessage('');
    setMessageType('');
    // Reset des refs pour permettre une nouvelle initialisation
    initializationRef.current = false;
    setIsInitialized(false);
    setTarificationService(null);
    
    setTimeout(() => {
      window.location.reload();
    }, 500);
  }, []);
  
  const handleCancelConfirm = useCallback(() => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
  }, []);
  
  // Effet pour gérer la disparition automatique des messages
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 5000);
  
      return () => clearTimeout(timer);
    }
  }, [message]);
  
  return {
    // États principaux
    isLoading,
    message,
    messageType,
    isAuthorized,
    userInfo,
    confirmModal,
    isInitialized,
    
    // Services
    tarificationService,
    clientService,
    
    // Données
    services,
    setServices,
    unites,
    setUnites,
    typesTarifs,
    setTypesTarifs,
    tarifs,
    setTarifs,
    tarifsSpeciaux,
    setTarifsSpeciaux,
    clients,
    setClients,
    serviceUnites,
    setServiceUnites,
    defaultUnites,
    setDefaultUnites,
    
    // Fonctions de chargement
    loadServices,
    loadUnites,
    loadUnitesByService,
    loadTypesTarifs,
    loadTarifs,
    loadTarifsSpeciaux,
    loadClients,
    loadAllData,
    
    // Gestionnaires
    setMessage,
    setMessageType,
    setConfirmModal,
    handleDismissMessage,
    handleRetryAuthorization,
    handleCancelConfirm
  };
};