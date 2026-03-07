// src/components/tarifs/hooks/useTarifGestionState.js
// ✅ REFACTORISÉ : Utilise useTarifActions (autonome) et useClientActions
// ✅ Ne crée plus de services en interne (délégué aux hooks d'actions)

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createLogger } from '../../../utils/createLogger';
import { useTarifActions } from './useTarifActions';
import { useClientActions } from '../../clients/hooks/useClientActions';

export const useTarifGestionState = () => {

  const log = createLogger("useTarifGestionState");

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
  
  // ✅ Ref pour éviter les initialisations multiples
  const initializationRef = useRef(false);
  const isLoadingClientsRef = useRef(false);
  const isLoadingAllDataRef = useRef(false);
  
  // États partagés entre composants
  const [services, setServices] = useState([]);
  const [unites, setUnites] = useState([]);
  const [typesTarifs, setTypesTarifs] = useState([]);
  const [tarifs, setTarifs] = useState([]);
  const [tarifsSpeciaux, setTarifsSpeciaux] = useState([]);
  const [clients, setClients] = useState([]);
  const [serviceUnites, setServiceUnites] = useState({});
  const [servicesUnites, setServicesUnites] = useState({});
  const [defaultUnites, setDefaultUnites] = useState({});
  
  // ✅ MODIFIÉ : Utilisation des hooks d'actions autonomes
  const tarifActions = useTarifActions();
  const { chargerClients: chargerClientsApi } = useClientActions();

  // ✅ NOUVEAU : Calculer les unités avec tarif à partir des tarifs déjà chargés
  const unitesAvecTarif = useMemo(() => {
    const map = new Map();
    
    console.log('📊 DEBUT calcul unitesAvecTarif');
    console.log('📊 Tarifs disponibles:', tarifs?.length || 0);
    console.log('📊 Tarifs spéciaux disponibles:', tarifsSpeciaux?.length || 0);
    
    // Ajouter les tarifs standards
    if (Array.isArray(tarifs) && tarifs.length > 0) {
      tarifs.forEach(tarif => {
        console.log('🔍 Tarif:', tarif);  // LOG IMPORTANT
        if (tarif.idService && tarif.idUnite) {
          const key = `${tarif.idService}-${tarif.idUnite}`;
          map.set(key, true);
          console.log(`✅ Ajout: ${key}`);
        }
      });
    }
    
    console.log('📊 Map finale taille:', map.size);
    console.log('📊 Clés dans le Map:', Array.from(map.keys()));
    
    return map;
  }, [tarifs, tarifsSpeciaux]);

  // ========================================
  // FONCTIONS DE CHARGEMENT REFACTORISÉES
  // ========================================
 
  /**
   * Charge tous les services
   */
  const loadServices = useCallback(async () => {
    try {
      log.debug('📡 Chargement des services...');
      const servicesData = await tarifActions.charger('service');
      log.debug('✅ Services chargés:', servicesData?.length || 0);
      setServices(servicesData || []);
    } catch (error) {
      log.error('❌ Erreur chargement services:', error);
      setMessage('Erreur lors du chargement des services: ' + error.message);
      setMessageType('error');
      setServices([]);
    }
  }, [tarifActions, log]);
  
  /**
   * Charge toutes les unités
   */
  const loadUnites = useCallback(async () => {
    try {
      log.debug('📡 Chargement des unités...');
      const unitesData = await tarifActions.charger('unite');
      log.debug('✅ Unités chargées:', unitesData?.length || 0);
      setUnites(unitesData || []);
    } catch (error) {
      log.error('❌ Erreur chargement unités:', error);
      setMessage('Erreur lors du chargement des unités: ' + error.message);
      setMessageType('error');
      setUnites([]);
    }
  }, [tarifActions, log]);
  
  /**
   * Charge les unités pour un service spécifique
   */
  const loadUnitesByService = useCallback(async (idService) => {
    try {
      log.debug('📡 Chargement des unités pour service:', idService);
      const unitesForService = await tarifActions.charger('unite', idService);
      
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
      log.error('❌ Erreur chargement unités service:', error);
      setMessage('Erreur lors du chargement des unités pour le service: ' + error.message);
      setMessageType('error');
    }
  }, [tarifActions, log]);

  /**
   * Charge toutes les liaisons service-unité
   */
  const loadAllServicesUnites = useCallback(async () => {
    try {
      log.debug('📡 Chargement de toutes les liaisons service-unité...');
      const relationsData = await tarifActions.chargerServicesUnites();
      
      const servicesUnitesObject = {};
    
      relationsData.forEach(relation => {
        log.debug('loadAllServicesUnites - résultat ligne par ligne :', relation);
        if (!servicesUnitesObject[relation.idService]) {
          servicesUnitesObject[relation.idService] = [];
        }
        servicesUnitesObject[relation.idService].push({
          idService: relation.idService,
          idUnite: relation.idUnite
        });
      });

      log.debug('✅ Toutes les liaisons service-unité chargées');
      log.debug('dans cette variable : ', servicesUnitesObject);
      setServicesUnites(servicesUnitesObject);
    } catch (error) {
      log.error('❌ Erreur chargement liaisons:', error);
    }
  }, [tarifActions, log]);
  
  /**
   * Charge tous les types de tarifs
   */
  const loadTypesTarifs = useCallback(async () => {
    try {
      log.debug('📡 Chargement des types de tarifs...');
      const typesTarifsData = await tarifActions.charger('typeTarif');
      log.debug('✅ Types tarifs chargés:', typesTarifsData?.length || 0);
      setTypesTarifs(typesTarifsData || []);
    } catch (error) {
      log.error('❌ Erreur chargement types tarifs:', error);
      setMessage('Erreur lors du chargement des types de tarifs: ' + error.message);
      setMessageType('error');
      setTypesTarifs([]);
    }
  }, [tarifActions, log]);
  
  /**
   * Charge tous les tarifs
   */
  const loadTarifs = useCallback(async () => {
    try {
      log.debug('📡 Chargement des tarifs...');
      const tarifsData = await tarifActions.charger('tarif');
      log.debug('✅ Tarifs chargés:', tarifsData?.length || 0);
      setTarifs(tarifsData || []);
    } catch (error) {
      log.error('❌ Erreur chargement tarifs:', error);
      setMessage('Erreur lors du chargement des tarifs: ' + error.message);
      setMessageType('error');
      setTarifs([]);
    }
  }, [tarifActions, log]);
  
  /**
   * Charge tous les tarifs spéciaux
   */
  const loadTarifsSpeciaux = useCallback(async () => {
    try {
      log.debug('📡 Chargement des tarifs spéciaux...');
      const tarifsSpeciauxData = await tarifActions.charger('tarifSpecial');
      log.debug('✅ Tarifs spéciaux chargés:', tarifsSpeciauxData?.length || 0);
      setTarifsSpeciaux(tarifsSpeciauxData || []);
    } catch (error) {
      log.error('❌ Erreur chargement tarifs spéciaux:', error);
      setMessage('Erreur lors du chargement des tarifs spéciaux: ' + error.message);
      setMessageType('error');
      setTarifsSpeciaux([]);
    }
  }, [tarifActions, log]);
  
  /**
   * Charge tous les clients
   * ✅ MODIFIÉ : Utilise useClientActions au lieu de ClientService
   */
  const loadClients = useCallback(async () => {
    if (isLoadingClientsRef.current) {
      log.debug('⏳ Chargement des clients déjà en cours, ignoré');
      return;
    }
    
    isLoadingClientsRef.current = true;
    try {
      log.debug('📡 useTarifGestionState - Chargement des clients via useClientActions...');
      const clientsData = await chargerClientsApi();
      log.debug('✅ useTarifGestionState - Clients chargés:', clientsData?.length || 0);
      log.debug('useTarifGestionState - clientsData :', clientsData);
      
      if (Array.isArray(clientsData)) {
        setClients(clientsData);
      } else {
        log.warn('Format de données clients incorrect:', clientsData);
        setClients([]);
        setMessage('Aucun client chargé ou format de données incorrect');
        setMessageType('warning');
      }
    } catch (error) {
      log.error('❌ Erreur chargement clients:', error);
      setMessage('Erreur lors du chargement des clients: ' + error.message);
      setMessageType('error');
      setClients([]);
    } finally {
      isLoadingClientsRef.current = false;
    }
  }, [chargerClientsApi, log]);
  
  /**
   * Charge toutes les données
   */
  const loadAllData = useCallback(async () => {
    if (!isAuthorized) {
      log.debug('⚠️ loadAllData: non autorisé');
      return;
    }
    
    // ✅ Protection contre les appels multiples
    if (isLoadingAllDataRef.current) {
      log.debug('⏳ Chargement de toutes les données déjà en cours, ignoré');
      return;
    }
    
    isLoadingAllDataRef.current = true;
    log.debug('🔄 Début du chargement de toutes les données...');
    setIsLoading(true);
    
    try {
      // ✅ Chargement séquentiel
      await loadServices();
      await loadUnites();
      await loadAllServicesUnites();
      await loadTypesTarifs();
      await loadTarifs();
      await loadTarifsSpeciaux();
      await loadClients();
      
      log.debug('✅ Chargement de toutes les données terminé');

    } catch (error) {
      log.error('❌ Erreur lors du chargement des données:', error);
      setMessage('Erreur lors du chargement des données: ' + error.message);
      setMessageType('error');
    } finally {
      setIsLoading(false);
      isLoadingAllDataRef.current = false;
    }
  }, [isAuthorized, loadServices, loadUnites, loadTypesTarifs, loadTarifs, loadTarifsSpeciaux, loadClients, loadAllServicesUnites, log]);
  

  /**
   * Initialisation via useTarifActions
   */
  useEffect(() => {
    if (isInitialized || initializationRef.current) return;
    
    const initializeService = async () => {
      initializationRef.current = true;
      try {
        log.debug('🔧 Initialisation du service de tarification via useTarifActions...');
        await tarifActions.initialiser();
        setIsInitialized(true);
        log.debug('✅ Service de tarification initialisé');
      } catch (error) {
        log.error('❌ Erreur initialisation:', error);
        setMessage('Erreur: ' + error.message);
        setMessageType('error');
        initializationRef.current = false;
      }
    };

    initializeService();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Chargement des données une fois le service initialisé
   */
  useEffect(() => {
    if (isInitialized) {
      loadAllData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialized]);
    
  // ========================================
  // GESTIONNAIRES
  // ========================================
  
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
    isLoadingClientsRef.current = false;
    setIsInitialized(false);
    
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
    
    // ✅ MODIFIÉ : Plus de services exposés directement
    // Les composants doivent utiliser tarifActions
    
    // ✅ Exposer tarifActions pour les composants enfants
    tarifActions,
    
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
    servicesUnites,
    setServicesUnites,
    unitesAvecTarif,
    
    // Fonctions de chargement
    loadServices,
    loadUnites,
    loadUnitesByService,
    loadAllServicesUnites,
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