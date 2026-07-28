import React, { useState, useEffect, useCallback } from 'react';
import { ICONS } from '../../ui/buttons';
import { createLogger } from '../../../utils/createLogger';
import { getBadgeClasses, formatEtatText, formatDate } from '../../../utils/formatters';
import { toIsoString } from '../../../utils/dateHelpers';
import { showDatePicker } from '../../shared/modals/handlers/DatePickerModalHandler';
import { CalendarIcon } from '../../ui/buttons';
import { ValidationError } from '../../shared/forms/FormField';
import '../../../styles/components/factures/FactureHeader.css';

const log = createLogger('FactureHeader');

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
  // ✅ Verrouillage indépendant du champ Client (facture liée à un loyer :
  // Date/Ristourne restent modifiables mais pas Client). Par défaut,
  // s'aligne sur readOnly pour ne rien changer aux usages existants.
  clientReadOnly = null,
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
  errors = {},
  motif = null,
}) {
    // Debug détaillé des props reçues
    log.debug(`Initialisé - mode: ${mode}, état: ${etat}, etatAffichage: ${etatAffichage}, idFacture: ${idFacture}`);
    log.debug(`Initialisé - numeroFacture: ${numeroFacture}, dateFacture: ${dateFacture}, idClient: ${idClient}`);
    
    if (process.env.NODE_ENV === 'development') {
      log.debug('Props complètes:', {
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
      log.debug('Props mises à jour:', {
        numeroFacture,
        dateFacture,
        idClient,
        hasData: !!(numeroFacture || dateFacture || idClient)
      });
    }
  }, [numeroFacture, dateFacture, idClient]);

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
    log.warn('Mode VIEW sans données - possible problème de timing');
  }

  return (
    <div className="facture-header-container">
      
      {/* Badge d'état — visible dans les deux modes (identique à la vue) */}
      {etatAUtiliser && (
        <div className="facture-header-etat-simple">
          <span className={getBadgeClasses(etatAUtiliser)}>
            {formatEtatText(etatAUtiliser)}
          </span>
        </div>
      )}

      {/* LIGNE 1 : Numéro de facture (jamais modifiable) + Date de facture */}
      <div className="facture-header-row">

        <div className="facture-header-column">
          <div className={getNumeroFactureInputClass()}>
            {/* ✅ Toujours en lecture seule (jamais éditable) — même style que
                Date/Client en visualisation (.facture-header-readonly-field),
                plutôt qu'un <input disabled> qui se rend légèrement différemment
                selon les navigateurs et causait un désalignement vertical. */}
            <div className="facture-header-readonly-field">
              {numeroFacture}
            </div>
            <label htmlFor="numeroFacture">Numéro de facture</label>
          </div>
        </div>

        {/* Colonne date de facture */}
        <div className="facture-header-column facture-date-column">
          <div className={getDateFactureInputClass()}>
            {readOnly ? (
              <div className="facture-header-readonly-field">
                {formatDate(dateFacture, 'date')}
              </div>
            ) : (
              // ✅ Input natif au même style que Numéro/Client (pas de
              // DateInputField, dont le systeme fdf_floating-label-input
              // interne créait une double structure de label/padding
              // incompatible avec .facture-header-input, causant un
              // désalignement vertical). Ouvre le même sélecteur de dates
              // via handleOpenDatePicker (showDatePicker), en lecture seule
              // au clavier — la saisie se fait uniquement via le calendrier.
              <input
                type="text"
                id="dateFacture"
                value={formatDate(dateFacture, 'date')}
                onChange={() => {}}
                onClick={handleOpenDatePicker}
                readOnly
                required
                placeholder=" "
                style={{ cursor: 'pointer', paddingRight: '35px' }}
                className={errors.dateFacture ? 'has-error' : ''}
              />
            )}
            <label htmlFor="dateFacture" className={!readOnly ? 'required' : undefined}>Date de facture</label>
            {!readOnly && (
              <span
                style={{ position: 'absolute', right: 0, top: 8, cursor: 'pointer' }}
                onClick={handleOpenDatePicker}
              >
                <CalendarIcon size={18} />
              </span>
            )}
            {!readOnly && <ValidationError message={errors.dateFacture} />}
          </div>

          {/* Bouton document si présent — uniquement en lecture seule */}
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
                  log.error('Erreur ouverture document:', error);
                  alert("Impossible d'ouvrir le document: " + error.message);
                }
              }}
              title="Ouvrir le document joint"
            >
              <ICONS.FILE size={20} color="#800000" />
            </button>
          )}
        </div>
      </div>

      {/* LIGNE 2 : Client — toujours affiché, éditable seulement hors lecture seule */}
      <div className="facture-header-row">
        <div className="facture-header-column">
          <div className={getClientInputClass()}>
            {(clientReadOnly ?? readOnly) ? (
              <>
                <div className="facture-header-readonly-field">
                  {idClient ? (
                    clients?.find(c => String(c.idClient) === String(idClient))
                      ? `${clients.find(c => String(c.idClient) === String(idClient)).nom} ${clients.find(c => String(c.idClient) === String(idClient)).prenom || ''}`
                      : `Client ID: ${idClient}`
                  ) : 'Aucun client sélectionné'}
                </div>
                <label htmlFor="clientSelect">Client</label>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
        <div className="facture-header-column" />
      </div>

      {/* LIGNE 3 : Motif (si présent) — toujours affiché, jamais modifiable */}
      {motif && (
        <div className="facture-header-row">
          <div className="facture-header-column facture-header-column--motif">
            <div className="facture-header-input focused">
              <div className="facture-header-readonly-field">
                {motif}
              </div>
              <label>Motif</label>
            </div>
          </div>
          <div className="facture-header-column" />
        </div>
      )}
    </div>
  );
}

export default FactureHeader;