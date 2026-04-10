import React, { useState, useEffect, useCallback } from 'react';
import { FiFile, FiCreditCard, FiDollarSign, FiClock } from 'react-icons/fi';
import { getBadgeClasses, formatEtatText, formatDate } from '../../../utils/formatters';
import { toIsoString } from '../../../utils/dateHelpers';
import { showDatePicker } from '../../shared/modals/handlers/DatePickerModalHandler';
import DateInputField from '../../shared/DateInputField';
import { ValidationError } from '../../shared/forms/FormField';
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
  const [dateFactureFocused, setDateFactureFocused] = useState(false);
  const [clientFocused, setClientFocused] = useState(false);

  // Accéder au contexte de dates pour utiliser le DatePicker
  // const { openDatePicker } = useDateContext(); // ← remplacé par showDatePicker

  // Fonction pour ouvrir le DatePicker pour la date de facture
  const handleOpenDatePicker = useCallback(async (e) => {
    if (readOnly) return;
    const anchorRef = { current: e?.currentTarget ?? null };
    const initialIso = dateFacture ? toIsoString(new Date(dateFacture)) : toIsoString(new Date());
    const result = await showDatePicker({
      initialDates: initialIso ? [initialIso] : [],
      multiSelect:  false,
      allowFuture:  false,
      title:        'Date de facture',
      anchorRef,
    });
    if (result.action === 'confirm' && result.dates.length > 0) {
      onDateFactureChange?.(result.dates[0]); // ISO YYYY-MM-DD
    }
  }, [readOnly, dateFacture, onDateFactureChange]);
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

  // Le numéro de facture est attribué par le backend — jamais modifiable
  const handleNumeroFactureChange = () => {};

  const handleDateFactureChange = (e) => {
    if (readOnly) return;
    if (onDateFactureChange) onDateFactureChange(e.target.value);
  };

  const handleClientChange = (e) => {
    if (readOnly) return;
    if (onClientChange) onClientChange(e.target.value);
  };

  // Déterminer l'état à utiliser pour l'affichage
  const getNumeroFactureInputClass = () => {
    return `facture-header-input ${numeroFacture ? 'focused' : ''}`;
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

      {/* LIGNE 1 : Client (create/edit) ou Numéro + Date (view) */}
      <div className="facture-header-row">

        {readOnly ? (
          // ── Mode lecture : numéro de facture ──────────────────────────────
          <div className="facture-header-column">
            <div className={getNumeroFactureInputClass()}>
              <input
                type="text"
                id="numeroFacture"
                value={numeroFacture}
                onChange={handleNumeroFactureChange}
                disabled={true}
                placeholder=" "
              />
              <label htmlFor="numeroFacture">Numéro de facture</label>
            </div>
          </div>
        ) : (
          // ── Mode saisie : sélection client ────────────────────────────────
          <div className="facture-header-column">
            <div className={getClientInputClass()}>
              <select
                id="clientSelect"
                value={idClient || ''}
                onChange={handleClientChange}
                onFocus={() => setClientFocused(true)}
                onBlur={() => setClientFocused(false)}
                disabled={clientsLoading}
                required
                aria-invalid={!!errors.idClient}
                aria-describedby={errors.idClient ? 'idClient-error' : undefined}
              >
                <option value="">Sélectionnez un client</option>
                {clients.map(client => (
                  <option key={client.idClient} value={client.idClient}>
                    {client.nom} {client.prenom}
                  </option>
                ))}
              </select>
              <label htmlFor="clientSelect" className="required">Client</label>
              {clientsLoading && <span className="loading-indicator">Chargement...</span>}
              <ValidationError message={errors.idClient} />
            </div>
          </div>
        )}

        {/* Colonne date de facture */}
        <div className="facture-header-column facture-date-column">
          <div className={getDateFactureInputClass()}>
            {readOnly ? (
              <div className="facture-header-readonly-field">
                {formatDate(dateFacture, 'date')}
              </div>
            ) : (
              <DateInputField
                id="dateFacture"
                label="Date de facture"
                value={formatDate(dateFacture, 'date')}
                onChange={(displayVal) => {
                  const { fromDisplayString, fromIsoString } = require('../../../utils/dateHelpers');
                  const d = fromDisplayString(displayVal) || fromIsoString(displayVal);
                  if (d) onDateFactureChange?.(toIsoString(d));
                  else   onDateFactureChange?.(displayVal);
                }}
                multiSelect={false}
                allowFuture={false}
                required
                className={errors.dateFacture ? 'has-error' : ''}
              />
            )}
            {!readOnly && <ValidationError message={errors.dateFacture} />}
          </div>

          {/* Bouton document si présent et en mode lecture */}
          {readOnly && documentPath && (
            <button
              type="button"
              className="facture-document-button"
              onClick={async () => {
                try {
                  const response = await fetch(documentPath, { method: 'GET', credentials: 'include' });
                  if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    if (errorData.session_expired) { window.location.href = '/login'; return; }
                    throw new Error(errorData.message || 'Erreur lors du chargement');
                  }
                  const blob = await response.blob();
                  const blobUrl = window.URL.createObjectURL(blob);
                  window.open(blobUrl, '_blank');
                  setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60000);
                } catch (error) {
                  console.error('Erreur ouverture document:', error);
                  alert("Impossible d'ouvrir le document: " + error.message);
                }
              }}
              title="Ouvrir le document joint"
            >
              <FiFile size={20} color="#800000" />
            </button>
          )}
        </div>
      </div>

      {/* LIGNE 2 : Client en mode lecture, vide en mode saisie */}
      {readOnly && (
        <div className="facture-header-row">
          <div className="facture-header-column">
            <div className={getClientInputClass()}>
              <div className="facture-header-readonly-field">
                {idClient ? (
                  clients?.find(c => String(c.idClient) === String(idClient))
                    ? `${clients.find(c => String(c.idClient) === String(idClient)).nom} ${clients.find(c => String(c.idClient) === String(idClient)).prenom || ''}`
                    : `Client ID: ${idClient}`
                ) : 'Aucun client sélectionné'}
              </div>
              <label htmlFor="clientSelect">Client</label>
            </div>
          </div>
          <div className="facture-header-column" />
        </div>
      )}
    </div>
  );
}

export default FactureHeader;