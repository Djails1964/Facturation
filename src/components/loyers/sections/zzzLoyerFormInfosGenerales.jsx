// components/loyers/sections/LoyerFormInfosGenerales.jsx
// Section 1 du formulaire loyer : client, salle, période, motif, switch dates paiement.
//
// Règles :
//   - Si loyer.idContratLocation est défini (généré depuis location de salle) :
//     client, salle, période, motif → lecture seule
//     seuls les montants mensuels et afficherDatesPaiement restent éditables
//   - En CREATE / EDIT manuel : tous les champs sont éditables

import React, { useState, useEffect, useCallback } from 'react';
import { ICONS } from '../../ui/buttons';
import SalleService from '../../../services/SalleService';
import TypeContratLocationService from '../../../services/TypeContratLocationService';
import { LOYER_LABELS } from '../../../constants/loyerConstants';

const LABEL_DATES_PAIEMENT = LOYER_LABELS?.AFFICHER_DATES_PAIEMENT
    ?? 'Afficher les dates de paiement sur la confirmation';

function formatPeriodeCompacte(debut, fin) {
  const fmt = (iso) => {
    if (!iso) return '—';
    const [y, m] = iso.split('-');
    return `${m}.${y}`;
  };
  return `${fmt(debut)} → ${fmt(fin)}`;
}

export function LoyerFormInfosGenerales({
  loyer, clients, clientsLoading, motifsDisponibles,
  fieldErrors, isReadOnly, handleChange, isCreate,
  onTypeContratChange,
}) {
  const [salles,       setSalles]       = useState([]);
  const [typesContrat, setTypesContrat] = useState([]);

  // Loyer généré depuis une location → entête figé (sauf afficherDatesPaiement)
  const estGenereParLocation = !!loyer.idContratLocation;
  const enteteReadOnly       = isReadOnly || estGenereParLocation;

  // typeDocument et estConfirmation depuis le loyer (via v_loyers_complets)
  const typeDocument    = loyer.typeDocument ?? null;
  const estConfirmation = typeDocument === 'confirmation';

  // Charger les types de contrat (CREATE et EDIT manuel uniquement)
  useEffect(() => {
    if (isReadOnly) return;
    TypeContratLocationService.lister()
      .then(liste => setTypesContrat(liste ?? []))
      .catch(() => setTypesContrat([]));
  }, [isReadOnly]);

  // Charger les salles (CREATE et EDIT manuel uniquement)
  useEffect(() => {
    if (enteteReadOnly) return;
    SalleService.lister()
      .then(liste => setSalles(liste ?? []))
      .catch(() => setSalles([]));
  }, [enteteReadOnly]);

  // Filtrer les types de contrat selon le client sélectionné
  const typesFiltres = typesContrat.filter(t => {
    if (!t.typeClientRequis) return true;
    const client = clients.find(c => String(c.idClient) === String(loyer.idClient));
    if (!client) return true;
    if (t.typeClientRequis === 'therapeute') return !!client.estTherapeute;
    return true;
  });

  const periodeCompacte = formatPeriodeCompacte(loyer.periodeDebut, loyer.periodeFin);

  // Nom du client pour l'affichage lecture seule
  const clientTrouve = clients.find(c => String(c.idClient) === String(loyer.idClient));
  const nomClientAffiche = clientTrouve
    ? `${clientTrouve.prenom} ${clientTrouve.nom}`
    : loyer.idClient ? `Client #${loyer.idClient}` : '—';

  return (
    <div className="loyer-form-section">
      <h3>Informations générales</h3>

      {/* ── Ligne Client (gauche) + Salle (droite) ── */}
      <div className="form-row">

        {/* Client — moitié gauche */}
        <div className="input-group" style={{ flex: 1 }}>
          {enteteReadOnly ? (
            <>
              <input id="idClient" type="text" value={nomClientAffiche}
                disabled readOnly placeholder=" " />
              <label htmlFor="idClient">Client</label>
            </>
          ) : (
            <>
              <select id="idClient" value={loyer.idClient}
                onChange={(e) => handleChange('idClient', e.target.value)}
                disabled={clientsLoading} required>
                <option value="">Sélectionnez un client</option>
                {clients.map(c => (
                  <option key={c.idClient} value={String(c.idClient)}>
                    {c.prenom} {c.nom}
                  </option>
                ))}
              </select>
              <label htmlFor="idClient" className="required">Client</label>
              {fieldErrors.idClient && <span className="error-message">{fieldErrors.idClient}</span>}
            </>
          )}
        </div>

        {/* Salle — moitié droite */}
        <div className="input-group" style={{ flex: 1 }}>
          {enteteReadOnly ? (
            <>
              <input id="idSalle" type="text" value={loyer.nomSalle || '—'}
                disabled readOnly placeholder=" " />
              <label htmlFor="idSalle">Salle</label>
            </>
          ) : (
            <>
              <select id="idSalle" value={loyer.idSalle ?? ''}
                onChange={(e) => handleChange('idSalle', e.target.value || null)}>
                <option value="">— aucune salle —</option>
                {salles.map(s => (
                  <option key={s.id} value={s.id}>{s.nom}</option>
                ))}
              </select>
              <label htmlFor="idSalle">Salle</label>
            </>
          )}
        </div>

      </div>

      {/* ── Année (CREATE uniquement) ── */}
      {isCreate && (
        <div className="form-row">
          <div className="input-group" style={{ flex: '0 0 200px' }}>
            <select id="anneeLoyer" value={loyer.anneeLoyer ?? ''}
              onChange={(e) => handleChange('anneeLoyer', parseInt(e.target.value, 10))} required>
              {Array.from({ length: 5 }, (_, i) => {
                const y = new Date().getFullYear() - 1 + i - 1;
                return <option key={y} value={y}>{y}</option>;
              })}
            </select>
            <label htmlFor="anneeLoyer" className="required">Année</label>
            {fieldErrors.anneeLoyer && <span className="error-message">{fieldErrors.anneeLoyer}</span>}
          </div>
        </div>
      )}

      {/* ── Type de contrat (gauche) + Motif (droite) ── */}
      <div className="form-row">

        {/* Type de contrat */}
        <div className="input-group" style={{ flex: 1 }}>
          {enteteReadOnly ? (
            <>
              <input id="idTypeContrat" type="text"
                value={loyer.nomTypeContrat || '—'}
                disabled readOnly placeholder=" " />
              <label htmlFor="idTypeContrat">Type de contrat</label>
            </>
          ) : (
            <>
              <select id="idTypeContrat" value={loyer.idTypeContrat ?? ''}
                onChange={(e) => {
                  const val = e.target.value || null;
                  handleChange('idTypeContrat', val);
                  if (onTypeContratChange) onTypeContratChange(val, typesFiltres);
                }} required>
                <option value="">— Sélectionnez —</option>
                {typesFiltres.map(t => (
                  <option key={t.id} value={t.id}>{t.nom}</option>
                ))}
              </select>
              <label htmlFor="idTypeContrat" className="required">Type de contrat</label>
              {fieldErrors.idTypeContrat && <span className="error-message">{fieldErrors.idTypeContrat}</span>}
            </>
          )}
        </div>

        {/* Motif */}
        <div className="input-group" style={{ flex: 1 }}>
          {enteteReadOnly ? (
            <>
              <input id="motif" type="text" value={loyer.motif || '—'}
                disabled readOnly placeholder=" " />
              <label htmlFor="motif">Motif</label>
            </>
          ) : motifsDisponibles?.length > 0 ? (
            <>
              <select id="motif" value={loyer.motif}
                onChange={(e) => handleChange('motif', e.target.value)} required>
                <option value="">Sélectionnez un motif</option>
                {motifsDisponibles.map((m, i) => {
                  const val = typeof m === 'string' ? m : (m.valeur ?? m.libelle ?? m);
                  const lbl = typeof m === 'string' ? m : (m.libelle ?? m.valeur ?? m);
                  return <option key={i} value={val}>{lbl}</option>;
                })}
              </select>
              <label htmlFor="motif" className="required">Motif</label>
              {fieldErrors.motif && <span className="error-message">{fieldErrors.motif}</span>}
            </>
          ) : (
            <>
              <input id="motif" type="text" value={loyer.motif}
                onChange={(e) => handleChange('motif', e.target.value)}
                required placeholder=" " />
              <label htmlFor="motif" className="required">Motif</label>
              {fieldErrors.motif && <span className="error-message">{fieldErrors.motif}</span>}
            </>
          )}
        </div>

        {/* Période — lecture seule en VIEW ou si généré depuis location */}
        {(isReadOnly || estGenereParLocation) && loyer.periodeDebut && (
          <div className="input-group" style={{ flex: '0 0 180px' }}>
            <input id="periode" type="text" value={periodeCompacte}
              disabled readOnly placeholder=" " />
            <label htmlFor="periode">Période</label>
          </div>
        )}

      </div>

      {/* ── Bandeau informatif si loyer généré depuis une location ── */}
      {estGenereParLocation && !isReadOnly && (
        <div className="form-row">
          <div className="loyer-info-banner">
            <ICONS.INFO_CIRCLE size={16} style={{ flexShrink: 0, marginRight: '8px' }} />
            Ce loyer est généré depuis une location de salle — seuls les montants et options ci-dessous sont modifiables.
          </div>
        </div>
      )}

      {/* ── Toggle afficher dates paiement ── */}
      {/* Visible en EDIT (toujours), en VIEW uniquement si confirmation */}
      {(!isReadOnly || estConfirmation) && (
        <div className="form-row">
          <div className="input-group-switch">
            <div className="switch-field-content">
              <span className="switch-field-label" style={{ color: 'var(--color-primary, #800000)' }}>
                {LABEL_DATES_PAIEMENT}
              </span>
              <div className="switch-container">
                <input type="checkbox" id="afficherDatesPaiement" className="switch-input"
                  checked={!!loyer.afficherDatesPaiement}
                  onChange={(e) => handleChange('afficherDatesPaiement', e.target.checked)}
                  disabled={isReadOnly} />
                <label htmlFor="afficherDatesPaiement" className="switch-toggle" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}