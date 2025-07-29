import React, { useState, useEffect } from 'react';
import { FiFile, FiCalendar, FiCreditCard, FiDollarSign, FiClock } from 'react-icons/fi';
import { useDateContext } from './context/DateContext';
import { getBadgeClasses, formatEtatText, formatDate, formatDateToYYYYMMDD } from './utils/formatters';
import FactureService from './services/FactureService';
import './FactureHeader.css';

/**
 * Composant d'en-tête de facture standardisé
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
  mode = 'view',
  etat = '',
  etatAffichage = '', // ✅ NOUVEAU: Paramètre pour l'état d'affichage
  factureId = null,
  factureData = null
}) {
    console.log(`[HEADER] FactureHeader initialisé - mode: ${mode}, état: ${etat}, etatAffichage: ${etatAffichage}, factureId: ${factureId}`);

  // États existants
  const [numeroFactureFocused, setNumeroFactureFocused] = useState(false);
  const [dateFactureFocused, setDateFactureFocused] = useState(false);
  const [clientFocused, setClientFocused] = useState(false);

  // Service
  const factureService = React.useMemo(() => new FactureService(), []);

  // Accéder au contexte de dates pour utiliser le DatePicker
  const { openDatePicker } = useDateContext();

  // ✅ CORRECTION: Déterminer l'état à utiliser pour l'affichage
  const etatAUtiliser = etatAffichage || etat;

  // Gestion des changements (existants)
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

  // Fonction pour ouvrir le DatePicker pour la date de facture (existante)
  const handleOpenDatePicker = () => {
    if (readOnly) return;
    
    let initialDate = null;
    if (dateFacture) {
      initialDate = new Date(dateFacture);
    }
    
    const config = {
      title: 'Sélectionner la date de facture',
      multiSelect: false,
      confirmText: 'Confirmer la date'
    };
    
    const callback = (dates) => {
      if (dates && dates.length > 0) {
        const selectedDate = dates[0];
        const formattedDateForInput = formatDateToYYYYMMDD(selectedDate);
        
        if (onDateFactureChange) {
          onDateFactureChange(formattedDateForInput);
        }
      }
    };
    
    openDatePicker(config, callback, initialDate ? [initialDate] : []);
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

  return (
    <div className="facture-header-container">
      
      {/* ✅ CORRIGÉ: Badge d'état utilise etatAUtiliser (etatAffichage en priorité) */}
      {readOnly && etatAUtiliser && (
        <div className="facture-header-etat-simple">
          <span className={getBadgeClasses(etatAUtiliser)}>
            {formatEtatText(etatAUtiliser)}
          </span>
        </div>
      )}

      {/* SECTIONS EXISTANTES : Numéro de facture et Date de facture */}
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
              <div className="facture-header-readonly-field">
                {formatDate(dateFacture)}
              </div>
            ) : (
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

      {/* SECTION EXISTANTE : Client */}
      <div className="facture-header-row">
        <div className="facture-header-column">
          <div className={getClientInputClass()}>
            {readOnly ? (
              <div className="facture-header-readonly-field">
                {clientId ? (
                  clients && clients.length > 0 && clients.find(c => String(c.id) === String(clientId))
                    ? `${clients.find(c => String(c.id) === String(clientId)).nom} ${clients.find(c => String(c.id) === String(clientId)).prenom || ''}`
                    : `Client ID: ${clientId}`
                ) : "Aucun client sélectionné"}
              </div>
            ) : (
              <select
                id="clientSelect"
                value={clientId || ''}
                onChange={handleClientChange}
                onFocus={() => setClientFocused(true)}
                onBlur={() => setClientFocused(false)}
                disabled={readOnly || clientsLoading}
                required
              >
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
        
        <div className="facture-header-column"></div>
      </div>
    </div>
  );
}

export default FactureHeader;