import React, { useState, useEffect } from 'react';
import { FiFile, FiCalendar } from 'react-icons/fi';
import { useDateContext } from './context/DateContext';
import formatters from './utils/formatters'; // Importer le module de formatage
import './FactureHeader.css';

/**
 * Composant d'en-tête de facture standardisé
 * @param {Object} props - Les propriétés du composant
 * @param {string} props.numeroFacture - Le numéro de facture
 * @param {string} props.dateFacture - La date de facture (format YYYY-MM-DD)
 * @param {string} props.clientId - L'ID du client sélectionné
 * @param {Array} props.clients - La liste des clients disponibles
 * @param {boolean} props.readOnly - Mode lecture seule
 * @param {boolean} props.clientsLoading - Indique si les clients sont en cours de chargement
 * @param {Function} props.onNumeroFactureChange - Callback lors de changement du numéro
 * @param {Function} props.onDateFactureChange - Callback lors de changement de la date
 * @param {Function} props.onClientChange - Callback lors de changement du client
 * @param {string} props.documentPath - Chemin vers le document associé (facture PDF)
 */
function FactureHeader({
  numeroFacture = '',
  dateFacture = '',
  clientId = '',
  clients = [],
  readOnly = false,
  clientsLoading = false,
  onNumeroFactureChange,
  onDateFactureChange,
  onClientChange,
  documentPath = null,
  mode = 'view' // 'view', 'edit', ou 'create'
}) {
    console.log(`[HEADER] FactureHeader initialisé - mode: ${mode}, clients.length: ${clients.length}, clientId: ${clientId}`);
  // États pour la gestion des focus
  const [numeroFactureFocused, setNumeroFactureFocused] = useState(false);
  const [dateFactureFocused, setDateFactureFocused] = useState(false);
  const [clientFocused, setClientFocused] = useState(false);

  // Accéder au contexte de dates pour utiliser le DatePicker
  const { openDatePicker } = useDateContext();

  // Ajout de logs pour diagnostiquer
  useEffect(() => {
    console.log("FactureHeader - Props reçues:", {
      numeroFacture,
      dateFacture,
      clientId,
      clients: clients.length > 0 ? `${clients.length} clients` : "[]",
      readOnly,
      mode
    });
    
    // Log détaillé des clients pour vérifier la structure
    if (clients.length > 0) {
      console.log("Exemple de client:", clients[0]);
    }
    
    // Vérifier si le client est trouvé
    const clientTrouve = clients.find(c => c.id === clientId);
    console.log("Client trouvé?", clientTrouve || "Non trouvé");
    
    // Vérifier le format de clientId
    console.log("Type de clientId:", typeof clientId, "Valeur:", clientId);
    
  }, [numeroFacture, dateFacture, clientId, clients, readOnly, mode]);

  // Gestion des changements
  const handleNumeroFactureChange = (e) => {
    if (readOnly) return;
    if (onNumeroFactureChange) onNumeroFactureChange(e.target.value);
  };

  const handleDateFactureChange = (e) => {
    if (readOnly) return;
    if (onDateFactureChange) onDateFactureChange(e.target.value);
  };

  const handleClientChange = (e) => {
    if (readOnly) return;
    if (onClientChange) onClientChange(e.target.value);
  };

  // Fonction pour ouvrir le DatePicker pour la date de facture
  const handleOpenDatePicker = () => {
    if (readOnly) return;
    
    // Convertir la date existante en objet Date si elle existe
    let initialDate = null;
    if (dateFacture) {
      initialDate = new Date(dateFacture);
    }
    
    // Configuration pour le DatePicker
    const config = {
      title: 'Sélectionner la date de facture',
      multiSelect: false, // Une seule date à sélectionner
      confirmText: 'Confirmer la date'
    };
    
    // Callback lorsque la date est sélectionnée
    const callback = (dates) => {
      if (dates && dates.length > 0) {
        // Utiliser le format YYYY-MM-DD pour le champ input date HTML
        const selectedDate = dates[0];
        
        // Formatage de la date pour l'input HTML (YYYY-MM-DD)
        // Note: Nous n'utilisons pas formatters.formatDate ici car ce dernier 
        // formate en format d'affichage (DD.MM.YYYY), alors que nous avons besoin
        // du format technique (YYYY-MM-DD) pour l'input HTML
        const formattedDateForInput = formatDateToYYYYMMDD(selectedDate);
        
        if (onDateFactureChange) {
          onDateFactureChange(formattedDateForInput);
        }
      }
    };
    
    // Ouvrir le DatePicker avec une seule date initiale si elle existe
    openDatePicker(config, callback, initialDate ? [initialDate] : []);
  };
  
  // Fonction utilitaire pour formater une date au format YYYY-MM-DD pour l'input HTML
  const formatDateToYYYYMMDD = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Calcul des classes CSS conditionnelles
  const getNumeroFactureInputClass = () => {
    return `facture-header-input ${numeroFacture || numeroFactureFocused ? 'focused' : ''}`;
  };

  const getDateFactureInputClass = () => {
    return `facture-header-input ${dateFacture || dateFactureFocused ? 'focused' : ''}`;
  };

  const getClientInputClass = () => {
    return `facture-header-input ${clientId || clientFocused ? 'focused' : ''}`;
  };

  // Fonction pour afficher la date au format localisé (pour l'affichage uniquement, pas pour le input)
  const getFormattedDateDisplay = (dateStr) => {
    if (!dateStr) return '';
    return formatters.formatDate(dateStr);
  };

  return (
    <div className="facture-header-container">
      {/* Première ligne: Numéro de facture et Date de facture */}
      <div className="facture-header-row">
        {/* Colonne A1: Numéro de facture */}
        <div className="facture-header-column">
          <div className={getNumeroFactureInputClass()}>
            <input
              type="text"
              id="numeroFacture"
              value={numeroFacture}
              onChange={handleNumeroFactureChange}
              onFocus={() => setNumeroFactureFocused(true)}
              onBlur={() => setNumeroFactureFocused(false)}
              maxLength="10"
              required
              disabled={true}
              placeholder=" "
            />
            <label htmlFor="numeroFacture" className="required">
              Numéro de facture
            </label>
          </div>
        </div>

        {/* Colonne B1: Date de facture */}
        <div className="facture-header-column facture-date-column">
          <div className={getDateFactureInputClass()}>
            {readOnly ? (
              // En mode lecture seule, afficher la date formatée
              <div className="facture-header-readonly-field">
                {getFormattedDateDisplay(dateFacture)}
              </div>
            ) : (
              // En mode édition, afficher l'input avec l'icône calendrier
              <>
                <input
                  type="date"
                  id="dateFacture"
                  value={dateFacture}
                  onChange={handleDateFactureChange}
                  onFocus={() => setDateFactureFocused(true)}
                  onBlur={() => setDateFactureFocused(false)}
                  required
                  placeholder=" "
                />
                <FiCalendar 
                  className="facture-calendar-icon" 
                  onClick={handleOpenDatePicker}
                />
              </>
            )}
            <label htmlFor="dateFacture" className="required">
              Date de facture
            </label>
          </div>
          
          {/* Bouton document si présent et en mode lecture */}
          {readOnly && documentPath && (
            <button 
              type="button"
              className="facture-document-button"
              onClick={() => window.open(documentPath, '_blank')}
              title="Ouvrir le document joint"
            >
              <FiFile size={20} color="#800000" />
            </button>
          )}
        </div>
      </div>

      {/* Deuxième ligne: Client (A2) et cellule vide (B2) */}
      <div className="facture-header-row">
        {/* Colonne A2: Client */}
        <div className="facture-header-column">
          <div className={getClientInputClass()}>
            {readOnly ? (
              // En mode lecture seule, utiliser clientData si disponible (passé depuis FactureForm)
              <div className="facture-header-readonly-field">
                {clientId ? (
                  clients && clients.length > 0 && clients.find(c => String(c.id) === String(clientId))
                    ? `${clients.find(c => String(c.id) === String(clientId)).nom} ${clients.find(c => String(c.id) === String(clientId)).prenom || ''}`
                    : `Client ID: ${clientId}`
                ) : "Aucun client sélectionné"}
              </div>
            ) : (
              // En mode édition, affiche le sélecteur de client
              <select
                id="clientSelect"
                value={clientId || ''}
                onChange={handleClientChange}
                onFocus={() => setClientFocused(true)}
                onBlur={() => setClientFocused(false)}
                disabled={readOnly || clientsLoading}
                required
              >
                {/* En mode création uniquement, ajouter l'option de sélection initiale */}
                {mode === 'create' && <option value="">Sélectionnez un client</option>}
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.nom} {client.prenom}
                  </option>
                ))}
              </select>
            )}
            <label htmlFor="clientSelect" className="required">
              Client
            </label>
            {clientsLoading && <span className="loading-indicator">Chargement...</span>}
          </div>
        </div>
        
        {/* Colonne B2: Vide intentionnellement */}
        <div className="facture-header-column"></div>
      </div>
    </div>
  );
}

export default FactureHeader;