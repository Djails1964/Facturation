import React, { useState, useEffect } from 'react';
import { FiFile, FiCalendar, FiCreditCard, FiDollarSign, FiClock } from 'react-icons/fi';
import { useDateContext } from '../../../context/DateContext';
import { getBadgeClasses, formatEtatText, formatDate, formatDateToYYYYMMDD } from '../../../utils/formatters';
import { ValidationError } from '../../shared/forms/FormField'; // ✅ AJOUT: Import du composant d'erreur unifié
import '../../../styles/components/factures/FactureHeader.css';

/**
 * Composant d'en-tête de facture standardisé
 * ✅ MISE À JOUR: Intégration de la validation unifiée
 */
function FactureHeader({
  numeroFacture = '',
  dateFacture = '',
  idClient = '',
  clients = [],
  readOnly = false,
  clientsLoading = false,
  onNumeroFactureChange,
  onDateFactureChange,
  onClientChange,
  documentPath = null,
  mode = 'view',
  etat = '',
  etatAffichage = '',
  idFacture = null,
  factureData = null,
  // ✅ AJOUT: Props pour les erreurs de validation unifiées
  errors = {}
}) {
    // Debug détaillé des props reçues
    console.log(`[HEADER] FactureHeader initialisé - mode: ${mode}, état: ${etat}, etatAffichage: ${etatAffichage}, idFacture: ${idFacture}`);
    console.log(`[HEADER] FactureHeader initialisé - numeroFacture: ${numeroFacture}, dateFacture: ${dateFacture}, idClient: ${idClient}`);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[HEADER] Props complètes:', {
        numeroFacture,
        dateFacture,
        idClient,
        clients: clients?.length,
        readOnly,
        mode,
        etat,
        etatAffichage,
        idFacture,
        factureData,
        errors // ✅ AJOUT: Log des erreurs
      });
    }

  // États existants
  const [numeroFactureFocused, setNumeroFactureFocused] = useState(false);
  const [dateFactureFocused, setDateFactureFocused] = useState(false);
  const [clientFocused, setClientFocused] = useState(false);

  // Accéder au contexte de dates pour utiliser le DatePicker
  const { openDatePicker } = useDateContext();

  // Déterminer l'état à utiliser pour l'affichage
  const etatAUtiliser = etatAffichage || etat;

  // Effect pour surveiller les changements de props
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[HEADER] Props mises à jour:', {
        numeroFacture,
        dateFacture,
        idClient,
        hasData: !!(numeroFacture || dateFacture || idClient)
      });
    }
  }, [numeroFacture, dateFacture, idClient]);

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
      confirmText: 'Confirmer la date',
      maxDate: new Date()
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
  
  // ✅ MODIFIÉ: Calcul des classes CSS conditionnelles avec support des erreurs
  const getNumeroFactureInputClass = () => {
    return `facture-header-input ${numeroFacture || numeroFactureFocused ? 'focused' : ''} ${errors.numeroFacture ? 'has-error' : ''}`;
  };

  const getDateFactureInputClass = () => {
    return `facture-header-input ${dateFacture || dateFactureFocused ? 'focused' : ''} ${errors.dateFacture ? 'has-error' : ''}`;
  };

  const getClientInputClass = () => {
    return `facture-header-input ${idClient || clientFocused ? 'focused' : ''} ${errors.idClient ? 'has-error' : ''}`;
  };

  // Affichage conditionnel pour debug
  if (process.env.NODE_ENV === 'development' && mode === 'view' && !numeroFacture && !dateFacture) {
    console.warn('[HEADER] Mode VIEW sans données - possible problème de timing');
  }

  return (
    <div className="facture-header-container">
      
      {/* Badge d'état utilise etatAUtiliser (etatAffichage en priorité) */}
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
              aria-invalid={!!errors.numeroFacture}
              aria-describedby={errors.numeroFacture ? "numeroFacture-error" : undefined}
            />
            <label htmlFor="numeroFacture" className="required">
              Numéro de facture
            </label>
            {/* ✅ AJOUT: Message d'erreur unifié */}
            <ValidationError message={errors.numeroFacture} />
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
                  max={new Date().toISOString().split('T')[0]}
                  aria-invalid={!!errors.dateFacture}
                  aria-describedby={errors.dateFacture ? "dateFacture-error" : undefined}
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
            {/* ✅ AJOUT: Message d'erreur unifié */}
            {!readOnly && <ValidationError message={errors.dateFacture} />}
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
                {idClient ? (
                  clients && clients.length > 0 && clients.find(c => String(c.id) === String(idClient))
                    ? `${clients.find(c => String(c.id) === String(idClient)).nom} ${clients.find(c => String(c.id) === String(idClient)).prenom || ''}`
                    : `Client ID: ${idClient}`
                ) : "Aucun client sélectionné"}
              </div>
            ) : (
              <select
                id="clientSelect"
                value={idClient || ''}
                onChange={handleClientChange}
                onFocus={() => setClientFocused(true)}
                onBlur={() => setClientFocused(false)}
                disabled={readOnly || clientsLoading}
                required
                aria-invalid={!!errors.idClient}
                aria-describedby={errors.idClient ? "idClient-error" : undefined}
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
            {/* ✅ AJOUT: Message d'erreur unifié */}
            {!readOnly && <ValidationError message={errors.idClient} />}
          </div>
        </div>
        
        <div className="facture-header-column"></div>
      </div>
    </div>
  );
}

export default FactureHeader;