import React, { useState, useEffect, useCallback } from 'react';
import ServiceGestion from './modules/ServiceGestion';
import UniteGestion from './modules/UniteGestion';
import TypeTarifGestion from './modules/TypeTarifGestion';
import TarifStandardGestion from './modules/TarifStandardGestion';
import TarifSpecialGestion from './modules/TarifSpecialGestion';
import TarificationService from './services/TarificationService';
import ClientService from './services/ClientService';
import ConfirmationModal from './components/shared/ConfirmationModal';
import ServiceUniteGestion from './modules/ServiceUniteGestion';
import api from './services/api'; // Importer votre service API
import './TarifGestion.css';

const TarifGestion = () => {
  // États de base du composant principal
  const [activeTab, setActiveTab] = useState('services');
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [userInfo, setUserInfo] = useState(null); // NOUVEAU: Stocker les infos utilisateur
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
  const [clientService] = useState(new ClientService());

  // États partagés entre composants
  const [services, setServices] = useState([]);
  const [unites, setUnites] = useState([]);
  const [typesTarifs, setTypesTarifs] = useState([]);
  const [tarifs, setTarifs] = useState([]);
  const [tarifsSpeciaux, setTarifsSpeciaux] = useState([]);
  const [clients, setClients] = useState([]);
  const [serviceUnites, setServiceUnites] = useState({});
  const [defaultUnites, setDefaultUnites] = useState({});
  const [selectedServiceId, setSelectedServiceId] = useState('');

  // NOUVEAU: Vérification d'autorisation via API
  useEffect(() => {
    const checkAuthorizationViaAPI = async () => {
      try {
        console.log('🔍 Vérification des droits via API...');
        setIsLoading(true);
        
        // Appel à l'API pour vérifier la session
        const response = await api.get('auth-api.php?check_session');
        
        if (response.success && response.user) {
          const user = response.user;
          console.log('✅ Utilisateur authentifié:', user);
          setUserInfo(user);
          
          // Vérifier les rôles autorisés
          const rolesAutorises = ['admin', 'gestionnaire'];
          const userRole = user.role?.toLowerCase();
          
          if (!userRole) {
            console.warn('❌ Aucun rôle trouvé pour l\'utilisateur');
            setMessage('Erreur: Aucun rôle défini pour votre compte');
            setMessageType('error');
            setIsAuthorized(false);
            return;
          }
          
          if (!rolesAutorises.includes(userRole)) {
            console.warn(`❌ Rôle non autorisé: ${userRole}`);
            setMessage(`Accès refusé. Votre rôle (${user.role}) ne permet pas d'accéder à la gestion des tarifs.`);
            setMessageType('error');
            setIsAuthorized(false);
            return;
          }
          
          // Utilisateur autorisé
          console.log(`✅ Accès autorisé pour le rôle: ${user.role}`);
          setIsAuthorized(true);
          setMessage(''); // Effacer les messages d'erreur précédents
          setMessageType('');
          
        } else {
          console.warn('❌ Échec de vérification de session:', response);
          setMessage('Session expirée ou invalide. Veuillez vous reconnecter.');
          setMessageType('error');
          setIsAuthorized(false);
          
          // Optionnel: rediriger vers la page de login
          // window.location.href = '/login';
        }
        
      } catch (error) {
        console.error('❌ Erreur lors de la vérification des droits:', error);
        
        if (error.message.includes('Authentification requise') || 
            error.message.includes('Session expirée')) {
          setMessage('Session expirée. Veuillez vous reconnecter.');
          setMessageType('error');
          // Optionnel: rediriger vers login
          // window.location.href = '/login';
        } else if (error.message.includes('Droits insuffisants')) {
          setMessage('Vous n\'avez pas les droits nécessaires pour accéder aux tarifs.');
          setMessageType('error');
        } else {
          setMessage('Erreur de connexion au serveur. Veuillez réessayer.');
          setMessageType('error');
        }
        
        setIsAuthorized(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuthorizationViaAPI();
  }, []);
  
  // Fonction pour fermer manuellement le message
  const handleDismissMessage = () => {
    setMessage('');
    setMessageType('');
  };

  // Fonction pour fermer la modal de confirmation
  const handleCancelConfirm = () => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
  };

  // NOUVEAU: Fonction pour réessayer la vérification
  const handleRetryAuthorization = () => {
    setIsLoading(true);
    setMessage('');
    setMessageType('');
    
    // Relancer la vérification après un délai
    setTimeout(() => {
      window.location.reload(); // Recharge la page pour relancer useEffect
    }, 500);
  };

  // Chargement des données avec gestion d'erreur améliorée
  const loadServices = async (service = tarificationService) => {
    try {
      if (!service) {
        console.error('Service de tarification non initialisé');
        return;
      }
      
      const servicesData = await service.chargerServices();
      setServices(Array.isArray(servicesData) ? servicesData : []);
    } catch (error) {
      console.error('Erreur lors du chargement des services:', error);
      
      // NOUVEAU: Gestion spécifique des erreurs d'authentification
      if (error.message.includes('Authentification requise')) {
        setMessage('Session expirée. Veuillez vous reconnecter.');
        setMessageType('error');
        setIsAuthorized(false);
      } else {
        setMessage('Erreur lors du chargement des services: ' + error.message);
        setMessageType('error');
      }
      
      setServices([]);
    }
  };

  const loadUnites = async (service = tarificationService) => {
    try {
      if (!service) {
        console.error('Service de tarification non initialisé');
        return;
      }
      
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
      
      setUnites(unitesArray);
    } catch (error) {
      console.error('Erreur lors du chargement des unités:', error);
      
      // NOUVEAU: Gestion des erreurs d'authentification
      if (error.message.includes('Authentification requise')) {
        setMessage('Session expirée. Veuillez vous reconnecter.');
        setMessageType('error');
        setIsAuthorized(false);
      } else {
        setMessage('Erreur lors du chargement des unités: ' + error.message);
        setMessageType('error');
      }
      
      setUnites([]);
    }
  };

  const loadUnitesByService = async (serviceId) => {
    try {
      if (!tarificationService) {
        console.error('Service de tarification non initialisé');
        return;
      }
      
      const unitesForService = await tarificationService.chargerUnites(serviceId);
      setServiceUnites(prev => ({
        ...prev,
        [serviceId]: Array.isArray(unitesForService) ? unitesForService : []
      }));
      
      // Identifier l'unité par défaut pour ce service
      const defaultUnite = unitesForService?.find(u => u.isDefault);
      if (defaultUnite) {
        setDefaultUnites(prev => ({
          ...prev,
          [serviceId]: defaultUnite.id
        }));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des unités par service:', error);
      
      if (error.message.includes('Authentification requise')) {
        setMessage('Session expirée. Veuillez vous reconnecter.');
        setMessageType('error');
        setIsAuthorized(false);
      } else {
        setMessage('Erreur lors du chargement des unités pour le service: ' + error.message);
        setMessageType('error');
      }
    }
  };

  const loadTypesTarifs = async (service = tarificationService) => {
    try {
      if (!service) {
        console.error('Service de tarification non initialisé');
        return;
      }
      
      const typesTarifsData = await service.chargerTypesTarifs();
      setTypesTarifs(Array.isArray(typesTarifsData) ? typesTarifsData : []);
    } catch (error) {
      console.error('Erreur lors du chargement des types de tarifs:', error);
      
      if (error.message.includes('Authentification requise')) {
        setMessage('Session expirée. Veuillez vous reconnecter.');
        setMessageType('error');
        setIsAuthorized(false);
      } else {
        setMessage('Erreur lors du chargement des types de tarifs: ' + error.message);
        setMessageType('error');
      }
      
      setTypesTarifs([]);
    }
  };

  const loadTarifs = async () => {
    try {
      if (!tarificationService) {
        console.error("Service de tarification non initialisé");
        return;
      }
      
      const tarifsData = await tarificationService.getTarifs();
      setTarifs(Array.isArray(tarifsData) ? tarifsData : []);
    } catch (error) {
      console.error('Erreur lors du chargement des tarifs:', error);
      
      if (error.message.includes('Authentification requise')) {
        setMessage('Session expirée. Veuillez vous reconnecter.');
        setMessageType('error');
        setIsAuthorized(false);
      } else {
        setMessage('Erreur lors du chargement des tarifs: ' + error.message);
        setMessageType('error');
      }
      
      setTarifs([]);
    }
  };

  const loadTarifsSpeciaux = async () => {
    try {
      if (!tarificationService) {
        console.error("Service de tarification non initialisé");
        return;
      }
      
      if (typeof tarificationService.getTarifsSpeciaux !== 'function') {
        console.error("La méthode getTarifsSpeciaux n'est pas définie dans le service de tarification");
        setMessage("Erreur: La méthode getTarifsSpeciaux n'est pas disponible");
        setMessageType('error');
        return;
      }
      
      const tarifsSpeciauxData = await tarificationService.getTarifsSpeciaux();
      setTarifsSpeciaux(Array.isArray(tarifsSpeciauxData) ? tarifsSpeciauxData : []);
    } catch (error) {
      console.error('Erreur lors du chargement des tarifs spéciaux:', error);
      
      if (error.message.includes('Authentification requise')) {
        setMessage('Session expirée. Veuillez vous reconnecter.');
        setMessageType('error');
        setIsAuthorized(false);
      } else {
        setMessage('Erreur lors du chargement des tarifs spéciaux: ' + error.message);
        setMessageType('error');
      }
      
      setTarifsSpeciaux([]);
    }
  };

  const loadClients = useCallback(async () => {
    try {
      if (!clientService) {
        console.error("Le service client n'est pas initialisé");
        setMessage('Erreur: Service client non initialisé');
        setMessageType('error');
        return;
      }
      
      const clientsData = await clientService.chargerClients();
      
      if (Array.isArray(clientsData)) {
        setClients(clientsData);
      } else {
        console.warn('Format de données clients incorrect:', clientsData);
        setClients([]);
        setMessage('Aucun client chargé ou format de données incorrect');
        setMessageType('warning');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des clients:', error);
      
      if (error.message.includes('Authentification requise')) {
        setMessage('Session expirée. Veuillez vous reconnecter.');
        setMessageType('error');
        setIsAuthorized(false);
      } else {
        setMessage('Erreur lors du chargement des clients: ' + error.message);
        setMessageType('error');
      }
      
      setClients([]);
    }
  }, [clientService]);

  // Fonction pour charger toutes les données avec gestion d'erreur améliorée
  const loadAllData = useCallback(async (service) => {
    if (!isAuthorized) {
      console.log('Chargement des données annulé - utilisateur non autorisé');
      return;
    }
    
    setIsLoading(true);
    try {
      await Promise.all([
        loadServices(service),
        loadUnites(service),
        loadTypesTarifs(service),
        loadTarifs(),
        loadTarifsSpeciaux(),
        loadClients()
      ]);
      
      console.log('✅ Toutes les données ont été chargées avec succès');
    } catch (error) {
      console.error('❌ Erreur lors du chargement des données:', error);
      setMessage('Erreur lors du chargement des données: ' + error.message);
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthorized, loadClients]);

  // Initialisation du service de tarification avec gestion d'erreur améliorée
  useEffect(() => {
    if (!isAuthorized) {
      return;
    }
    
    const initTarificationService = async () => {
      try {
        console.log('🔧 Initialisation du service de tarification...');
        const service = new TarificationService();
        await service.initialiser();
        setTarificationService(service);
        console.log('✅ Service de tarification initialisé avec succès');
        return service;
      } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation du service de tarification:', error);
        setMessage('Erreur lors de l\'initialisation du service de tarification: ' + error.message);
        setMessageType('error');
        return null;
      }
    };

    initTarificationService().then(service => {
      if (service) {
        loadAllData(service);
      } else {
        setIsLoading(false);
      }
    });
  }, [isAuthorized, loadAllData]);

  // Effet pour mettre à jour les unités disponibles lorsqu'un service est sélectionné
  useEffect(() => {
    if (selectedServiceId && tarificationService && isAuthorized) {
      loadUnitesByService(selectedServiceId);
    }
  }, [selectedServiceId, tarificationService, isAuthorized]);

  // Effet pour gérer le changement d'onglet
  useEffect(() => {
    if (tarificationService && isAuthorized) {
      // Charger les données appropriées selon l'onglet actif
      switch (activeTab) {
        case 'services':
          loadServices();
          break;
        case 'unites':
          loadUnites();
          break;
        case 'types-tarifs':
          loadTypesTarifs();
          break;
        case 'tarifs':
          loadTarifs();
          break;
        case 'tarifs-speciaux':
          loadTarifsSpeciaux();
          break;
        default:
          break;
      }
    }
  }, [activeTab, tarificationService, isAuthorized]);

  // Effet pour gérer la disparition automatique des messages
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 5000); // 5 secondes
  
      return () => clearTimeout(timer);
    }
  }, [message]);

  // AMÉLIORÉ: Interface si l'utilisateur n'est pas autorisé
  if (!isAuthorized && !isLoading) {
    return (
      <div className="content-section-container">
        <div className="content-section-title">
          <h2>Gestion des tarifs</h2>
          {message && (
            <div className="alert alert-danger">
              {message}
              <button 
                type="button" 
                className="close-message" 
                onClick={handleDismissMessage}
                aria-label="Fermer"
              >
                &times;
              </button>
            </div>
          )}
        </div>
        <div className="unauthorized-access">
          <p>Vous n'avez pas les droits nécessaires pour accéder à cette page.</p>
          <p>Veuillez contacter votre administrateur si vous pensez qu'il s'agit d'une erreur.</p>
          
          {/* NOUVEAU: Bouton pour réessayer */}
          <div style={{ marginTop: '20px' }}>
            <button 
              className="btn btn-primary" 
              onClick={handleRetryAuthorization}
              disabled={isLoading}
            >
              {isLoading ? 'Vérification...' : 'Réessayer'}
            </button>
          </div>
          
          {/* NOUVEAU: Informations de debug en mode dev */}
          {process.env.NODE_ENV === 'development' && userInfo && (
            <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f8f9fa', border: '1px solid #dee2e6' }}>
              <h5>Debug (développement)</h5>
              <p><strong>Utilisateur :</strong> {userInfo.username || 'N/A'}</p>
              <p><strong>Rôle :</strong> {userInfo.role || 'N/A'}</p>
              <p><strong>ID :</strong> {userInfo.id || 'N/A'}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Rendu des onglets de navigation (uniquement si autorisé)
  const renderTabs = () => {
    if (!isAuthorized) return null;
    
    return (
      <div className="tarif-gestion-tabs">
        <div 
          className={`tarif-tab ${activeTab === 'services' ? 'active' : ''}`}
          onClick={() => setActiveTab('services')}
        >
          Services
        </div>
        <div 
          className={`tarif-tab ${activeTab === 'unites' ? 'active' : ''}`}
          onClick={() => setActiveTab('unites')}
        >
          Unités
        </div>
        <div 
          className={`tarif-tab ${activeTab === 'services-unites' ? 'active' : ''}`}
          onClick={() => setActiveTab('services-unites')}
        >
          Associations Service/Unité
        </div>
        <div 
          className={`tarif-tab ${activeTab === 'types-tarifs' ? 'active' : ''}`}
          onClick={() => setActiveTab('types-tarifs')}
        >
          Types de tarifs
        </div>
        <div 
          className={`tarif-tab ${activeTab === 'tarifs' ? 'active' : ''}`}
          onClick={() => setActiveTab('tarifs')}
        >
          Tarifs standards
        </div>
        <div 
          className={`tarif-tab ${activeTab === 'tarifs-speciaux' ? 'active' : ''}`}
          onClick={() => setActiveTab('tarifs-speciaux')}
        >
          Tarifs spéciaux
        </div>
      </div>
    );
  };

  // Rendu du contenu actif (uniquement si autorisé)
  const renderContent = () => {
    if (!isAuthorized) return null;
    
    switch (activeTab) {
      case 'services':
        return (
          <ServiceGestion 
            services={services}
            setServices={setServices}
            tarificationService={tarificationService}
            setMessage={setMessage}
            setMessageType={setMessageType}
            setConfirmModal={setConfirmModal}
            loadServices={loadServices}
          />
        );
      case 'unites':
        return (
          <UniteGestion
            unites={unites}
            tarificationService={tarificationService}
            setMessage={setMessage}
            setMessageType={setMessageType}
            setConfirmModal={setConfirmModal}
            loadUnites={loadUnites}
          />
        );
      case 'services-unites':
        return (
          <ServiceUniteGestion
            services={services}
            unites={unites}
            tarificationService={tarificationService}
            setMessage={setMessage}
            setMessageType={setMessageType}
            setConfirmModal={setConfirmModal}
            loadUnites={loadUnites}
            loadUnitesByService={loadUnitesByService}
          />
        );
      case 'types-tarifs':
        return (
          <TypeTarifGestion
            typesTarifs={typesTarifs}
            setTypesTarifs={setTypesTarifs}
            tarificationService={tarificationService}
            setMessage={setMessage}
            setMessageType={setMessageType}
            setConfirmModal={setConfirmModal}
            loadTypesTarifs={loadTypesTarifs}
          />
        );
      case 'tarifs':
        return (
          <TarifStandardGestion
            tarifs={tarifs}
            setTarifs={setTarifs}
            services={services}
            unites={unites}
            typesTarifs={typesTarifs}
            serviceUnites={serviceUnites}
            tarificationService={tarificationService}
            setSelectedServiceId={setSelectedServiceId}
            setMessage={setMessage}
            setMessageType={setMessageType}
            setConfirmModal={setConfirmModal}
            loadTarifs={loadTarifs}
          />
        );
      case 'tarifs-speciaux':
        return (
          <TarifSpecialGestion
            tarifsSpeciaux={tarifsSpeciaux}
            setTarifsSpeciaux={setTarifsSpeciaux}
            services={services}
            unites={unites}
            clients={clients}
            serviceUnites={serviceUnites}
            tarificationService={tarificationService}
            setSelectedServiceId={setSelectedServiceId}
            setMessage={setMessage}
            setMessageType={setMessageType}
            setConfirmModal={setConfirmModal}
            loadTarifsSpeciaux={loadTarifsSpeciaux}
          />
        );
      default:
        return <div>Sélectionnez un onglet</div>;
    }
  };

  // Rendu principal
  return (
    <div className="content-section-container">
      <div className="content-section-title">
        <h2>Gestion des tarifs</h2>
        
        {/* NOUVEAU: Affichage des infos utilisateur en mode dev */}
        {process.env.NODE_ENV === 'development' && userInfo && isAuthorized && (
          <div style={{ fontSize: '0.8em', color: '#666', marginBottom: '10px' }}>
            Connecté en tant que: <strong>{userInfo.username}</strong> (rôle: <strong>{userInfo.role}</strong>)
          </div>
        )}
        
        {message && (
          <div className={`alert ${messageType === 'success' ? 'alert-success' : messageType === 'info' ? 'alert-info' : 'alert-danger'}`}>
            {message}
            <button 
              type="button" 
              className="close-message" 
              onClick={handleDismissMessage}
              aria-label="Fermer"
            >
              &times;
            </button>
          </div>
        )}
      </div>
      
      <div className="tarif-gestion-container">
        {isLoading ? (
          <div className="loading-container">
            <p>Chargement des données...</p>
          </div>
        ) : (
          <>
            {renderTabs()}
            {renderContent()}
          </>
        )}
      </div>
      
      {isAuthorized && (
        <ConfirmationModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          onConfirm={confirmModal.onConfirm}
          onCancel={handleCancelConfirm}
          type={confirmModal.type}
          confirmText={confirmModal.confirmText}
          cancelText="Annuler"
        />
      )}
    </div>
  );
};

export default TarifGestion;