/**
 * Composant de formulaire client qui gère l'affichage, la création et la modification des clients
 * Le composant s'adapte à trois modes : affichage, création et modification
 * VERSION MISE À JOUR avec gestion sécurisée des booléens
 */
import React, { useState, useEffect } from 'react';
import './ClientForm.css';
import ClientService from './services/ClientService';
import { toBoolean, normalizeBooleanFields } from './utils/booleanHelper'; // ✅ IMPORT du helper

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
 * @param {string} mode - Mode du formulaire (view, create, edit)
 * @param {string|null} clientId - ID du client (uniquement pour les modes view et edit)
 * @param {function} onRetourListe - Callback pour retourner à la liste des clients
 * @param {function} onClientCreated - Callback appelé après la création d'un client
 */
const ClientForm = ({ 
  mode = FORM_MODES.VIEW, 
  clientId = null, 
  onRetourListe, 
  onClientCreated,
  clientService: propClientService // Nouveau prop pour le service
}) => {
  // Remplacer l'instanciation existante par une logique qui utilise le prop s'il est fourni
  const [clientService] = useState(() => {
      return propClientService || new ClientService();
  });

  // ✅ FONCTION DE NORMALISATION DU CLIENT
  const normalizeClientData = React.useCallback((clientData) => {
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
  const [error, setError] = useState(null);
  
  // État pour le type de téléphone (suisse ou étranger)
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

  // Chargement des données du client au montage du composant ou changement de mode/clientId
  useEffect(() => {
    if (clientId && (mode === FORM_MODES.VIEW || mode === FORM_MODES.EDIT)) {
      chargerClient(clientId);
    } else if (mode === FORM_MODES.CREATE) {
      // Réinitialiser le formulaire pour la création
      setClient({
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
      
      // Réinitialiser les états de focus
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
      
      // Réinitialiser les erreurs de champ et le type de téléphone
      setFieldErrors({
        email: null,
        telephone: null
      });
      setPhoneType(null);
      
      setIsLoading(false);
    }
  }, [clientId, mode, clientService]);
  
  /**
   * Charge les données d'un client depuis le service client
   * @param {string} id - ID du client à charger
   */
  const chargerClient = async (id) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Utiliser le service client pour récupérer les données
      const clientData = await clientService.getClient(id);
      
      if (clientData) {
        // ✅ NORMALISATION PRÉVENTIVE DES DONNÉES CLIENT
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
   * @param {string} email - Email à valider
   * @returns {boolean} - True si l'email est valide
   */
  const validateEmail = (email) => {
    // Si le champ est vide et n'est pas obligatoire, pas d'erreur
    if (!email) {
      setFieldErrors(prev => ({ ...prev, email: null }));
      return true;
    }
    
    // Utiliser le service client pour valider l'email
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
   * @param {string} phone - Téléphone à valider
   * @returns {boolean} - True si le téléphone est valide
   */
  const validatePhone = (phone) => {
    // Si le champ est vide et n'est pas obligatoire, pas d'erreur
    if (!phone) {
      setFieldErrors(prev => ({ ...prev, telephone: null }));
      setPhoneType(null);
      return true;
    }
    
    // Utiliser le service client pour détecter le type de téléphone
    const phoneInfo = clientService.detectPhoneType(phone);
    
    // Mettre à jour l'état du type de téléphone
    setPhoneType(phoneInfo.type);
    
    if (!phoneInfo.isValid) {
      setFieldErrors(prev => ({ 
        ...prev, 
        telephone: "Veuillez entrer un numéro de téléphone valide" 
      }));
      return false;
    } else {
      // Mettre à jour le numéro formaté
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
   * @param {Event} e - Événement de changement
   */
  const handleChange = (e) => {
    if (mode === FORM_MODES.VIEW) return; // Pas de modification en mode affichage
    
    const { name, type, checked, value } = e.target;
    let newValue = type === 'checkbox' ? checked : value;
    
    // Pour les numéros de téléphone, limiter la taille et éviter les caractères invalides
    if (name === 'telephone') {
      // Limiter à 20 caractères pour les numéros internationaux
      if (value.length <= 20) {
        // Autoriser uniquement chiffres, +, espaces et parenthèses
        newValue = value.replace(/[^\d\s+()-]/g, '');
      } else {
        newValue = client.telephone;
        return; // Ne pas mettre à jour si dépassement de longueur
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
   * @param {Event} e - Événement de focus
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
   * @param {Event} e - Événement de blur
   */
  const handleBlur = (e) => {
    const { name, value } = e.target;
    
    // Formater et valider le téléphone au blur
    if (name === 'telephone' && value) {
      const phoneInfo = clientService.detectPhoneType(value);
      setPhoneType(phoneInfo.type);
      
      // Mettre à jour avec le numéro formaté
      setClient(prev => ({
        ...prev,
        telephone: phoneInfo.formattedNumber
      }));
      
      // Valider le numéro formaté
      validatePhone(phoneInfo.formattedNumber);
    }
    
    if (name in focusStates) {
      // Garder l'état "focused" si le champ a une valeur
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
   * @returns {boolean} - True si le formulaire est valide
   */
  const validateForm = () => {
    // Vérifier l'email et le téléphone
    const isEmailValid = validateEmail(client.email);
    const isPhoneValid = validatePhone(client.telephone);
    
    // Retourner true si tous les champs sont valides
    return isEmailValid && isPhoneValid;
  };

  /**
   * Gère la soumission du formulaire
   * @param {Event} e - Événement de soumission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Valider le formulaire avant soumission
    if (!validateForm()) {
      return;
    }
    
    try {
      let result;
      
      if (mode === FORM_MODES.CREATE) {
        // Création d'un nouveau client
        result = await clientService.createClient(client);
        
        if (result.success) {
          if (onClientCreated) {
            // Passer l'ID du client créé et le message à la fonction de callback
            onClientCreated(result.id, result.message);
          } else if (onRetourListe) {
            // Fallback si onClientCreated n'est pas fourni
            onRetourListe(result.id, result.message, 'success');
          }
        } else {
          throw new Error(result.message || 'Une erreur est survenue lors de la création');
        }
      } else if (mode === FORM_MODES.EDIT) {
        // Modification d'un client existant
        result = await clientService.updateClient(clientId, client);
        
        if (result.success) {
          if (onRetourListe) {
            onRetourListe(clientId, result.message, 'success');
          }
        } else {
          throw new Error(result.message || 'Une erreur est survenue lors de la modification');
        }
      }
    } catch (error) {
      console.error('Erreur:', error.message);
      setError('Erreur: ' + error.message);
    }
  };

  /**
   * Gère le retour à la liste des clients
   */
  const handleRetour = () => {
    if (onRetourListe) {
      onRetourListe();
    }
  };

  /**
   * Bascule l'état thérapeute du client
   */
  const toggleTherapeute = () => {
    if (mode === FORM_MODES.VIEW) return; // Pas de modification en mode affichage
    
    setClient(prevClient => ({
      ...prevClient,
      // ✅ UTILISATION SÉCURISÉE DU HELPER BOOLÉEN
      estTherapeute: !toBoolean(prevClient.estTherapeute)
    }));
  };

  /**
   * Détermine le titre du formulaire en fonction du mode
   * @returns {string} Titre du formulaire
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

  // Lecture seule en mode affichage
  const isReadOnly = mode === FORM_MODES.VIEW;
  
  /**
   * Détermine la classe CSS pour le conteneur du formulaire selon le mode
   * @returns {string} Classe CSS
   */
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
  
  /**
   * Détermine la classe CSS pour les groupes de champs selon le mode
   * @returns {string} Classe CSS
   */
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
            <button type="button" className="cancel-button" onClick={handleRetour}>
              Retour à la liste
            </button>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Détermine la classe CSS pour le conteneur des boutons
   * @returns {string} Classe CSS
   */
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

  /**
   * Détermine la classe CSS pour le bouton de soumission
   * @returns {string} Classe CSS
   */
  const getSubmitButtonClass = () => {
    switch (mode) {
      case FORM_MODES.CREATE:
        return "nc-submit-button";
      case FORM_MODES.EDIT:
        return "mc-submit-button";
      default:
        return "submit-button";
    }
  };

  /**
   * Détermine la classe CSS pour le bouton d'annulation
   * @returns {string} Classe CSS
   */
  const getCancelButtonClass = () => {
    switch (mode) {
      case FORM_MODES.CREATE:
        return "nc-cancel-button";
      case FORM_MODES.EDIT:
        return "mc-cancel-button";
      case FORM_MODES.VIEW:
        return "retour-bouton";
      default:
        return "cancel-button";
    }
  };

  /**
   * Détermine le texte du bouton principal
   * @returns {string} Texte du bouton
   */
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
                  // ✅ UTILISATION SÉCURISÉE DU HELPER BOOLÉEN
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
                maxLength="20" // Pour accommoder les numéros internationaux
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
                  disabled={hasErrors}
                >
                  {getSubmitButtonText()}
                </button>
              )}
              <button 
                type="button" 
                className={getCancelButtonClass()} 
                onClick={handleRetour}
              >
                {mode === FORM_MODES.VIEW ? "Retour à la liste" : "Annuler"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export { ClientForm, FORM_MODES };
export default ClientForm;