/**
 * Composant de formulaire client qui gère l'affichage, la création et la modification des clients
 * Le composant s'adapte à trois modes : affichage, création et modification
 * VERSION MISE À JOUR avec gestion sécurisée des booléens et protection des modifications non sauvegardées
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './ClientForm.css';
import ClientService from './services/ClientService';
import { toBoolean, normalizeBooleanFields } from './utils/booleanHelper';
import { useNavigationGuard } from './App';
import { useUnsavedChanges } from './hooks/useUnsavedChanges';
import ConfirmationModal from './components/shared/ConfirmationModal';

// Constantes pour les différents modes du formulaire
const FORM_MODES = {
  VIEW: 'view',   // Mode affichage
  CREATE: 'create', // Mode création
  EDIT: 'edit'    // Mode édition
};

// Types de numéros de téléphone
const PHONE_TYPES = {
  SWISS: 'swiss',
  FOREIGN: 'foreign'
};

/**
 * Composant ClientForm - Gère l'affichage, la création et la modification des clients
 */
const ClientForm = ({ 
  mode = FORM_MODES.VIEW, 
  clientId = null, 
  onRetourListe, 
  onClientCreated,
  clientService: propClientService
}) => {
  // Hook global pour s'enregistrer
  const { registerGuard, unregisterGuard } = useNavigationGuard();

  // ID unique pour ce guard
  const guardId = `client-form-${clientId || 'new'}`;

  // États pour tracker l'initialisation complète
  const [isFullyInitialized, setIsFullyInitialized] = useState(false);
  const [isInitialLoadDone, setIsInitialLoadDone] = useState(false);

  // État pour la modal de navigation externe
  const [showGlobalModal, setShowGlobalModal] = useState(false);
  const [globalNavigationCallback, setGlobalNavigationCallback] = useState(null);

  // Service client
  const [clientService] = useState(() => {
    return propClientService || new ClientService();
  });

  // Fonction de normalisation du client
  const normalizeClientData = useCallback((clientData) => {
    if (!clientData || typeof clientData !== 'object') return clientData;
    return normalizeBooleanFields(clientData, ['estTherapeute']);
  }, []);

  // État du client avec valeurs par défaut
  const [client, setClient] = useState({
    id: '',
    titre: '',
    nom: '',
    prenom: '',
    rue: '',
    numero: '',
    code_postal: '',
    localite: '',
    telephone: '',
    email: '',
    estTherapeute: false
  });

  // États pour le chargement et les erreurs
  const [isLoading, setIsLoading] = useState(clientId !== null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  // État pour le type de téléphone
  const [phoneType, setPhoneType] = useState(null);
  
  // États pour les erreurs de validation par champ
  const [fieldErrors, setFieldErrors] = useState({
    email: null,
    telephone: null
  });
  
  // États pour gérer le comportement des labels flottants
  const [focusStates, setFocusStates] = useState({
    titre: false,
    prenom: false,
    nom: false,
    rue: false,
    numero: false,
    code_postal: false,
    localite: false,
    telephone: false,
    email: false
  });

  // Données initiales pour la détection des modifications
  const [initialFormData, setInitialFormData] = useState({});

  // Fonction pour obtenir les données actuelles du formulaire
  const getFormData = useCallback(() => {
    return {
      titre: client.titre,
      nom: client.nom,
      prenom: client.prenom,
      rue: client.rue,
      numero: client.numero,
      code_postal: client.code_postal,
      localite: client.localite,
      telephone: client.telephone,
      email: client.email,
      estTherapeute: client.estTherapeute
    };
  }, [client]);

  // Fonction pour vérifier si on peut commencer la détection
  const canDetectChanges = useCallback(() => {
    return !isLoading && 
           !isSubmitting && 
           isInitialLoadDone && 
           isFullyInitialized && 
           Object.keys(initialFormData).length > 0 &&
           mode !== FORM_MODES.VIEW;
  }, [isLoading, isSubmitting, isInitialLoadDone, isFullyInitialized, initialFormData, mode]);

  // Données actuelles pour la détection (calculées à chaque render)
  const currentFormData = useMemo(() => {
    const data = canDetectChanges() ? getFormData() : {};
    console.log('🔄 useMemo currentFormData recalculé:', {
      canDetectChanges: canDetectChanges(),
      data,
      clientNumero: client.numero
    });
    return data;
  }, [canDetectChanges, client]); // ⬅️ CHANGEMENT : dépendre directement de `client` au lieu de `getFormData`

  // Hook local pour détecter les modifications
  const {
    hasUnsavedChanges,
    showUnsavedModal,
    markAsSaved,
    confirmNavigation,
    cancelNavigation,
    requestNavigation,
    resetChanges
  } = useUnsavedChanges(
    initialFormData,
    currentFormData, // ⬅️ MAINTENANT ÇA SE MET À JOUR !
    isSubmitting,
    false
  );

  // Debug: Log des données pour voir ce qui change
  useEffect(() => {
    if (canDetectChanges()) {
      console.log('📊 ClientForm données comparaison:', {
        canDetectChanges: canDetectChanges(),
        initialFormData,
        currentFormData,
        sonIdentiques: JSON.stringify(initialFormData) === JSON.stringify(currentFormData),
        hasUnsavedChanges
      });
    }
  }, [client, initialFormData, canDetectChanges, currentFormData, hasUnsavedChanges]);

  // Chargement des données du client au montage
  useEffect(() => {
    console.log('🚀 ClientForm useEffect chargement appelé, mode:', mode, 'clientId:', clientId);
    
    const loadData = async () => {
      if (clientId && (mode === FORM_MODES.VIEW || mode === FORM_MODES.EDIT)) {
        console.log('📥 Chargement du client:', clientId);
        await chargerClient(clientId);
      } else if (mode === FORM_MODES.CREATE) {
        console.log('✨ Mode création - initialisation du formulaire vide');
        // Réinitialiser le formulaire pour la création
        const defaultClient = {
          id: '',
          titre: '',
          nom: '',
          prenom: '',
          rue: '',
          numero: '',
          code_postal: '',
          localite: '',
          telephone: '',
          email: '',
          estTherapeute: false
        };
        
        setClient(defaultClient);
        
        // Réinitialiser les autres états
        setFocusStates({
          titre: false,
          prenom: false,
          nom: false,
          rue: false,
          numero: false,
          code_postal: false,
          localite: false,
          telephone: false,
          email: false
        });
        
        setFieldErrors({
          email: null,
          telephone: null
        });
        setPhoneType(null);
        setIsLoading(false);
      }
      
      // Marquer le chargement initial comme terminé
      console.log('✅ Chargement initial ClientForm terminé');
      setIsInitialLoadDone(true);
    };

    loadData();
  }, [clientId, mode]);

  // Effet pour finaliser l'initialisation après que toutes les données soient chargées
  useEffect(() => {
    if (isInitialLoadDone && !isLoading && !isFullyInitialized) {
      // Attendre un délai pour s'assurer que toutes les données sont stables
      const timer = setTimeout(() => {
        console.log('🔧 Finalisation de l\'initialisation ClientForm');
        const currentFormData = getFormData();
        
        // ✅ NOUVELLE LOGIQUE : similaire à FactureForm
        const hasValidData = mode === FORM_MODES.CREATE ? 
          // Pour la création, vérifier qu'on a au moins les données de base initialisées
          (currentFormData.titre !== undefined && currentFormData.nom !== undefined) :
          // Pour modification/vue, besoin des champs obligatoires remplis
          (currentFormData.nom && currentFormData.prenom);
        
        if (hasValidData) {
          // Double vérification de stabilité
          setTimeout(() => {
            const finalFormData = getFormData();
            const isStable = JSON.stringify(currentFormData) === JSON.stringify(finalFormData);
            
            if (isStable) {
              setInitialFormData(finalFormData);
              setIsFullyInitialized(true);
              console.log('✅ Initialisation ClientForm complète avec données stables:', {
                mode,
                finalFormData,
                isEmpty: mode === FORM_MODES.CREATE && Object.values(finalFormData).every(v => !v || v === false)
              });
            } else {
              console.log('⏳ Données ClientForm pas encore stables, attente...');
              setTimeout(() => {
                const stabilizedData = getFormData();
                setInitialFormData(stabilizedData);
                setIsFullyInitialized(true);
                console.log('✅ Initialisation ClientForm forcée après délai supplémentaire:', stabilizedData);
              }, 1000);
            }
          }, 300);
        } else {
          console.log('❌ Données ClientForm pas encore valides pour initialisation:', {
            mode,
            currentFormData,
            hasValidData
          });
        }
      }, 500); // Délai initial

      return () => clearTimeout(timer);
    }
  }, [isInitialLoadDone, isLoading, isFullyInitialized, getFormData, mode]);

  // Enregistrer le guard global seulement quand tout est prêt
  useEffect(() => {
    if (canDetectChanges()) {
      const guardFunction = async () => {
        console.log(`🔍 Vérification modifications pour ${guardId}:`, hasUnsavedChanges);
        return hasUnsavedChanges;
      };

      registerGuard(guardId, guardFunction);
      console.log(`🔒 Guard enregistré pour ${guardId}`);

      return () => {
        unregisterGuard(guardId);
        console.log(`🔓 Guard désenregistré pour ${guardId}`);
      };
    }
  }, [canDetectChanges, hasUnsavedChanges, guardId, registerGuard, unregisterGuard]);

  // Intercepter les navigations externes
  useEffect(() => {
    if (canDetectChanges() && hasUnsavedChanges) {
      const handleGlobalNavigation = (event) => {
        console.log('🚨 Navigation externe détectée avec modifications non sauvegardées');
        
        if (event.detail && event.detail.source && event.detail.callback) {
          console.log('🔄 Affichage modal pour navigation externe:', event.detail.source);
          setGlobalNavigationCallback(() => event.detail.callback);
          setShowGlobalModal(true);
        }
      };

      window.addEventListener('navigation-blocked', handleGlobalNavigation);

      return () => {
        window.removeEventListener('navigation-blocked', handleGlobalNavigation);
      };
    }
  }, [canDetectChanges, hasUnsavedChanges]);

  // Debug: Afficher l'état des modifications
  useEffect(() => {
    console.log('🔍 État modifications ClientForm:', {
      guardId,
      hasUnsavedChanges,
      canDetectChanges: canDetectChanges(),
      isFullyInitialized,
      isInitialLoadDone,
      showGlobalModal,
      mode,
      isLoading,
      isSubmitting,
      initialDataKeys: Object.keys(initialFormData),
      currentDataKeys: Object.keys(getFormData()),
      clientData: {
        nom: client.nom,
        prenom: client.prenom,
        titre: client.titre
      }
    });
  }, [guardId, hasUnsavedChanges, canDetectChanges, isFullyInitialized, isInitialLoadDone, showGlobalModal, mode, isLoading, isSubmitting, initialFormData, client]);

  /**
   * Charge les données d'un client depuis le service client
   */
  const chargerClient = async (id) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const clientData = await clientService.getClient(id);
      
      if (clientData) {
        const normalizedClient = normalizeClientData(clientData);
        
        console.log('Client avant normalisation:', clientData);
        console.log('Client après normalisation:', normalizedClient);
        
        // Détecter le type de téléphone et formater si nécessaire
        if (normalizedClient.telephone) {
          const phoneInfo = clientService.detectPhoneType(normalizedClient.telephone);
          normalizedClient.telephone = phoneInfo.formattedNumber;
          setPhoneType(phoneInfo.type);
        }
        
        setClient(normalizedClient);
        
        // Mettre à jour les états de focus pour les champs contenant des valeurs
        const newFocusStates = {};
        Object.keys(focusStates).forEach(key => {
          newFocusStates[key] = Boolean(normalizedClient[key]);
        });
        
        setFocusStates(newFocusStates);
      } else {
        throw new Error('Client non trouvé');
      }
    } catch (error) {
      console.error('Erreur lors du chargement du client:', error);
      setError('Une erreur est survenue lors du chargement du client: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Valide une adresse email
   */
  const validateEmail = (email) => {
    if (!email) {
      setFieldErrors(prev => ({ ...prev, email: null }));
      return true;
    }
    
    const isValid = clientService.isValidEmail(email);
    
    if (!isValid) {
      setFieldErrors(prev => ({ 
        ...prev, 
        email: "Veuillez entrer une adresse email valide" 
      }));
      return false;
    } else {
      setFieldErrors(prev => ({ ...prev, email: null }));
      return true;
    }
  };
  
  /**
   * Valide un numéro de téléphone
   */
  const validatePhone = (phone) => {
    if (!phone) {
      setFieldErrors(prev => ({ ...prev, telephone: null }));
      setPhoneType(null);
      return true;
    }
    
    const phoneInfo = clientService.detectPhoneType(phone);
    setPhoneType(phoneInfo.type);
    
    if (!phoneInfo.isValid) {
      setFieldErrors(prev => ({ 
        ...prev, 
        telephone: "Veuillez entrer un numéro de téléphone valide" 
      }));
      return false;
    } else {
      setClient(prev => ({
        ...prev,
        telephone: phoneInfo.formattedNumber
      }));
      
      setFieldErrors(prev => ({ ...prev, telephone: null }));
      return true;
    }
  };

  /**
   * Gère les changements de valeurs des champs du formulaire
   */
  const handleChange = (e) => {
    if (mode === FORM_MODES.VIEW) return;
    
    const { name, type, checked, value } = e.target;
    let newValue = type === 'checkbox' ? checked : value;
    
    console.log('📝 ClientForm handleChange:', { name, value: newValue, mode });
    
    // Pour les numéros de téléphone, limiter la taille et éviter les caractères invalides
    if (name === 'telephone') {
      if (value.length <= 20) {
        newValue = value.replace(/[^\d\s+()-]/g, '');
      } else {
        newValue = client.telephone;
        return;
      }
    }
    
    setClient(prevClient => ({ 
      ...prevClient, 
      [name]: newValue 
    }));
    
    // Mettre à jour l'état de focus si le champ a une valeur
    if (name in focusStates) {
      const newFocusState = newValue !== '';
      setFocusStates(prev => ({
        ...prev,
        [name]: newFocusState
      }));
    }
    
    // Validation en temps réel
    if (name === 'email') {
      validateEmail(newValue);
    } else if (name === 'telephone') {
      validatePhone(newValue);
    }
  };
  
  /**
   * Gère le focus des champs
   */
  const handleFocus = (e) => {
    const { name } = e.target;
    if (name in focusStates) {
      setFocusStates(prev => ({
        ...prev,
        [name]: true
      }));
    }
  };
  
  /**
   * Gère la perte de focus des champs
   */
  const handleBlur = (e) => {
    const { name, value } = e.target;
    
    // Formater et valider le téléphone au blur
    if (name === 'telephone' && value) {
      const phoneInfo = clientService.detectPhoneType(value);
      setPhoneType(phoneInfo.type);
      
      setClient(prev => ({
        ...prev,
        telephone: phoneInfo.formattedNumber
      }));
      
      validatePhone(phoneInfo.formattedNumber);
    }
    
    if (name in focusStates) {
      const shouldKeepFocus = value !== '';
      setFocusStates(prev => ({
        ...prev,
        [name]: shouldKeepFocus
      }));
    }
    
    // Valider l'email au blur
    if (name === 'email') {
      validateEmail(value);
    }
  };

  /**
   * Vérifie si tous les champs sont valides avant la soumission
   */
  const validateForm = () => {
    const isEmailValid = validateEmail(client.email);
    const isPhoneValid = validatePhone(client.telephone);
    
    return isEmailValid && isPhoneValid;
  };

  // Fonction pour gérer une sauvegarde réussie
  const handleSuccessfulSave = useCallback((clientId, message) => {
    console.log('✅ Sauvegarde réussie ClientForm - nettoyage des modifications');
    
    markAsSaved();
    resetChanges();
    
    const newFormData = getFormData();
    setInitialFormData(newFormData);

    unregisterGuard(guardId);

    setShowGlobalModal(false);
    setGlobalNavigationCallback(null);

    if (mode === FORM_MODES.CREATE && onClientCreated) {
      onClientCreated(clientId, message);
    } else if (onRetourListe) {
      onRetourListe(clientId, true, message, 'success');
    }
  }, [mode, onClientCreated, onRetourListe, markAsSaved, resetChanges, getFormData, guardId, unregisterGuard]);

  /**
   * Gère la soumission du formulaire
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      let result;
      
      if (mode === FORM_MODES.CREATE) {
        result = await clientService.createClient(client);
        
        if (result.success) {
          handleSuccessfulSave(result.id, result.message);
        } else {
          throw new Error(result.message || 'Une erreur est survenue lors de la création');
        }
      } else if (mode === FORM_MODES.EDIT) {
        result = await clientService.updateClient(clientId, client);
        
        if (result.success) {
          handleSuccessfulSave(clientId, result.message);
        } else {
          throw new Error(result.message || 'Une erreur est survenue lors de la modification');
        }
      }
    } catch (error) {
      console.error('Erreur:', error.message);
      setError('Erreur: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Gère le retour à la liste des clients avec protection
   */
  const handleRetour = () => {
    // En mode VIEW, navigation directe sans protection
    if (mode === FORM_MODES.VIEW) {
      console.log('🔙 Navigation directe en mode VIEW (ClientForm)');
      unregisterGuard(guardId);
      
      if (onRetourListe) {
        onRetourListe();
      }
      return;
    }

    // ✅ DEBUG : Afficher l'état actuel
    console.log('🔍 État avant navigation Retour ClientForm:', {
      hasUnsavedChanges,
      canDetectChanges: canDetectChanges(),
      mode,
      isSubmitting
    });

    // ✅ Vérification directe : si pas de modifications, naviguer directement
    if (!hasUnsavedChanges || !canDetectChanges()) {
      console.log('✅ Aucune modification détectée, navigation directe (ClientForm)');
      unregisterGuard(guardId);
      
      if (onRetourListe) {
        onRetourListe();
      }
      return;
    }

    // Pour les modes EDIT et CREATE avec modifications, utiliser la protection
    const canNavigate = requestNavigation(() => {
      console.log('🔙 Navigation retour autorisée ClientForm');
      unregisterGuard(guardId);
      
      if (onRetourListe) {
        onRetourListe();
      }
    });

    if (!canNavigate) {
      console.log('🔒 Navigation retour bloquée par des modifications non sauvegardées (ClientForm)');
    }
  };

  // Gérer la confirmation de navigation externe
  const handleConfirmGlobalNavigation = () => {
    console.log('✅ Confirmation navigation externe ClientForm');
    setShowGlobalModal(false);
    
    unregisterGuard(guardId);
    
    if (globalNavigationCallback) {
      globalNavigationCallback();
      setGlobalNavigationCallback(null);
    }
  };

  // Gérer l'annulation de navigation externe
  const handleCancelGlobalNavigation = () => {
    console.log('❌ Annulation navigation externe ClientForm');
    setShowGlobalModal(false);
    setGlobalNavigationCallback(null);
  };

  /**
   * Bascule l'état thérapeute du client
   */
  const toggleTherapeute = () => {
    if (mode === FORM_MODES.VIEW) return;
    
    setClient(prevClient => ({
      ...prevClient,
      estTherapeute: !toBoolean(prevClient.estTherapeute)
    }));
  };

  /**
   * Détermine le titre du formulaire en fonction du mode
   */
  const getTitreFormulaire = () => {
    switch (mode) {
      case FORM_MODES.CREATE:
        return "Nouveau client";
      case FORM_MODES.EDIT:
        return "Modification du client";
      case FORM_MODES.VIEW:
        return "Détails du client";
      default:
        return "Client";
    }
  };

  // Cleanup lors du démontage
  useEffect(() => {
    return () => {
      if (mode !== FORM_MODES.VIEW) {
        console.log(`🧹 Nettoyage ${guardId} lors du démontage`);
        unregisterGuard(guardId);
        resetChanges();
        setIsFullyInitialized(false);
      }
    };
  }, [mode, guardId, unregisterGuard, resetChanges]);

  // Lecture seule en mode affichage
  const isReadOnly = mode === FORM_MODES.VIEW;
  
  // Classes CSS et méthodes utilitaires
  const getFormContainerClass = () => {
    switch (mode) {
      case FORM_MODES.CREATE:
        return "nouveau-client-form";
      case FORM_MODES.EDIT:
        return "modifier-client-form";
      case FORM_MODES.VIEW:
        return "afficher-client-form";
      default:
        return "client-form";
    }
  };
  
  const getFormGroupClass = () => {
    switch (mode) {
      case FORM_MODES.CREATE:
        return "form-group-NouveauClient";
      case FORM_MODES.EDIT:
        return "form-group-ModifierClient";
      case FORM_MODES.VIEW:
        return "form-group-AfficherClient";
      default:
        return "form-group";
    }
  };

  const getButtonsContainerClass = () => {
    switch (mode) {
      case FORM_MODES.CREATE:
        return "NouveauClient-boutons left-align";
      case FORM_MODES.EDIT:
        return "ModifierClient-boutons left-align";
      case FORM_MODES.VIEW:
        return "AfficherClient-boutons left-align";
      default:
        return "client-form-boutons left-align";
    }
  };

  const getSubmitButtonClass = () => {
    switch (mode) {
      case FORM_MODES.CREATE:
        return "btn-primary";
      case FORM_MODES.EDIT:
        return "btn-primary";
      default:
        return "btn-primary";
    }
  };

  const getCancelButtonClass = () => {
    switch (mode) {
      case FORM_MODES.CREATE:
        return "btn-secondary";
      case FORM_MODES.EDIT:
        return "btn-secondary";
      case FORM_MODES.VIEW:
        return "btn-primary";
      default:
        return "btn-secondary";
    }
  };

  const getSubmitButtonText = () => {
    switch (mode) {
      case FORM_MODES.CREATE:
        return "Créer client";
      case FORM_MODES.EDIT:
        return "Modifier";
      default:
        return "Enregistrer";
    }
  };

  // Affichage pendant le chargement
  if (isLoading) {
    return (
      <div className="content-section-container">
        <div className="content-section-title">
          <h2>{getTitreFormulaire()}</h2>
        </div>
        <div className={getFormContainerClass()}>
          <p className="loading-message">Chargement des données du client...</p>
        </div>
      </div>
    );
  }

  // Affichage en cas d'erreur
  if (error) {
    return (
      <div className="content-section-container">
        <div className="content-section-title">
          <h2>{getTitreFormulaire()}</h2>
        </div>
        <div className={getFormContainerClass()}>
          <p className="error-message">{error}</p>
          <div className="client-form-boutons">
            <button type="button" className="cancel-button" onClick={() => onRetourListe && onRetourListe()}>
              Retour à la liste
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Définition des champs du formulaire pour éviter la répétition
  const formFields = [
    { id: 'prenom', label: 'Prénom', type: 'text', required: true },
    { id: 'nom', label: 'Nom', type: 'text', required: true },
    { id: 'rue', label: 'Rue', type: 'text', required: true },
    { id: 'numero', label: 'Numéro', type: 'text', required: true },
    { id: 'code_postal', label: 'Code postal', type: 'number', required: true },
    { id: 'localite', label: 'Localité', type: 'text', required: true }
  ];
  
  // Vérifier si le formulaire a des erreurs
  const hasErrors = fieldErrors.email !== null || fieldErrors.telephone !== null;
  
  return (
    <div className="content-section-container">
      <div className="content-section-title">
        <h2>{getTitreFormulaire()}</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="formulaire-client">
        <div className={getFormContainerClass()}>
          {/* Section gauche */}
          <div className="form-left-section">
            {/* Champ estTherapeute avec switch */}
            <div className={`${getFormGroupClass()} therapist-field`}>
              <div className="field-label">Thérapeute</div>
              <div className="switch-container">
                <input
                  type="checkbox"
                  id="estTherapeute"
                  name="estTherapeute"
                  className="switch-input"
                  checked={toBoolean(client.estTherapeute)}
                  onChange={toggleTherapeute}
                  disabled={isReadOnly}
                />
                <label htmlFor="estTherapeute" className="switch-label"></label>
              </div>
            </div>
            
            {/* Champ titre */}
            {mode === FORM_MODES.VIEW ? (
              <div className="titre-container focused">
                <select
                  id="titre"
                  name="titre"
                  value={client.titre}
                  disabled={true}
                >
                  <option value="Madame">Madame</option>
                  <option value="Monsieur">Monsieur</option>
                </select>
                <label htmlFor="titre">Titre</label>
              </div>
            ) : (
              <div className={`${getFormGroupClass()} floating-label-input ${
                focusStates.titre || client.titre ? 'focused' : ''
              }`}>
                <select
                  id="titre"
                  name="titre"
                  value={client.titre || ''}
                  onChange={handleChange}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  required
                  disabled={isReadOnly}
                >
                  <option value=""></option>
                  <option value="Madame">Madame</option>
                  <option value="Monsieur">Monsieur</option>
                </select>
                <label htmlFor="titre" className="required">Titre</label>
              </div>
            )}
          </div>
        
          {/* Section principale (largeur complète) */}
          <div className="form-main-section">
            {/* Champs de formulaire générés dynamiquement */}
            {formFields.map((field) => (
              <div 
                key={field.id} 
                className={`${getFormGroupClass()} floating-label-input ${
                  focusStates[field.id] || client[field.id] || mode === FORM_MODES.VIEW ? 'focused' : ''
                }`}
              >
                <input 
                  type={field.type} 
                  id={field.id}
                  name={field.id} 
                  value={client[field.id] || ''} 
                  onChange={handleChange}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  required={field.required} 
                  readOnly={isReadOnly}
                  placeholder=" "
                  maxLength={field.type === 'text' || field.type === 'email' ? "255" : undefined}
                />
                <label htmlFor={field.id} className={field.required ? "required" : ""}>
                  {field.label}
                </label>
              </div>
            ))}
            
            {/* Champ téléphone avec validation et indication du type */}
            <div 
              className={`${getFormGroupClass()} floating-label-input ${
                focusStates.telephone || client.telephone || mode === FORM_MODES.VIEW ? 'focused' : ''
              } ${fieldErrors.telephone ? 'has-error' : ''} ${phoneType ? `phone-type-${phoneType}` : ''}`}
            >
              <input 
                type="tel" 
                id="telephone"
                name="telephone" 
                value={client.telephone || ''} 
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                readOnly={isReadOnly}
                placeholder=" "
                maxLength="20"
              />
              <label htmlFor="telephone">Téléphone</label>
              
              {/* Badge indiquant le type de téléphone */}
              {!isReadOnly && phoneType === PHONE_TYPES.SWISS && (
                <div className="phone-type-badge swiss">CH</div>
              )}
              {!isReadOnly && phoneType === PHONE_TYPES.FOREIGN && (
                <div className="phone-type-badge foreign">INT</div>
              )}
              
              {/* Affichage des messages d'erreur ou d'aide */}
              {!isReadOnly && fieldErrors.telephone && (
                <div className="error-message">{fieldErrors.telephone}</div>
              )}
              {!isReadOnly && !fieldErrors.telephone && (
                <small className="help-text">
                  {phoneType === PHONE_TYPES.SWISS 
                    ? 'Format: +41 xx xxx xx xx' 
                    : phoneType === PHONE_TYPES.FOREIGN 
                      ? 'Numéro international' 
                      : 'Format suisse: +41 xx xxx xx xx ou 0xx xxx xx xx'}
                </small>
              )}
            </div>
            
            {/* Champ email avec validation */}
            <div 
              className={`${getFormGroupClass()} floating-label-input ${
                focusStates.email || client.email || mode === FORM_MODES.VIEW ? 'focused' : ''
              } ${fieldErrors.email ? 'has-error' : ''}`}
            >
              <input 
                type="email" 
                id="email"
                name="email" 
                value={client.email || ''} 
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                readOnly={isReadOnly}
                placeholder=" "
                maxLength="255"
              />
              <label htmlFor="email">Email</label>
              {!isReadOnly && fieldErrors.email && (
                <div className="error-message">{fieldErrors.email}</div>
              )}
            </div>
            
            {/* Boutons d'action */}
            <div className={getButtonsContainerClass()}>
              {mode !== FORM_MODES.VIEW && (
                <button 
                  type="submit" 
                  className={getSubmitButtonClass()}
                  disabled={hasErrors || isSubmitting}
                >
                  {isSubmitting ? 'Enregistrement en cours...' : getSubmitButtonText()}
                </button>
              )}
              <button 
                type="button" 
                className={getCancelButtonClass()} 
                onClick={handleRetour}
                disabled={isSubmitting}
              >
                {mode === FORM_MODES.VIEW ? "Retour à la liste" : "Annuler"}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Modal pour les modifications non sauvegardées (navigation locale via bouton Annuler) */}
      <ConfirmationModal
        isOpen={showUnsavedModal}
        title="Modifications non sauvegardées"
        message="Vous avez des modifications non sauvegardées dans le formulaire client. Souhaitez-vous vraiment quitter sans sauvegarder ?"
        type="warning"
        onConfirm={confirmNavigation}
        onCancel={cancelNavigation}
        confirmText="Quitter sans sauvegarder"
        cancelText="Continuer l'édition"
        singleButton={false}
      />

      {/* Modal pour les modifications non sauvegardées (navigation externe via menu/déconnexion) */}
      <ConfirmationModal
        isOpen={showGlobalModal}
        title="Modifications non sauvegardées"
        message="Vous avez des modifications non sauvegardées dans le formulaire client. Souhaitez-vous vraiment quitter sans sauvegarder ?"
        type="warning"
        onConfirm={handleConfirmGlobalNavigation}
        onCancel={handleCancelGlobalNavigation}
        confirmText="Quitter sans sauvegarder"
        cancelText="Continuer l'édition"
        singleButton={false}
      />
    </div>
  );
};

export { ClientForm, FORM_MODES };
export default ClientForm;