// components/loyers/sections/LoyerFormEntete.jsx
//
// En-tête du formulaire loyer — 3 lignes × 2 colonnes :
//   Ligne 1 : Client          | Salle
//   Ligne 2 : Type de contrat | Motif de location
//   Ligne 3 : Période (RO)    | Switch afficher dates (si forfait)
//
// Tous les champs d'en-tête sont en lecture seule car les loyers
// ne sont créés que par génération depuis un contrat de location.
// Seul le switch afficherDatesPaiement est éditable en mode EDIT.

import React, { useState, useEffect } from 'react';
import { ICONS } from '../../ui/buttons';
import { LOYER_LABELS } from '../../../constants/loyerConstants';

const LABEL_DATES_PAIEMENT = LOYER_LABELS?.AFFICHER_DATES_PAIEMENT
    ?? 'Afficher les dates de paiement sur la confirmation';

function formatPeriodeCompacte(debut, fin) {
  const fmt = (iso) => { if (!iso) return '—'; const [y, m] = iso.split('-'); return `${m}.${y}`; };
  return `${fmt(debut)} → ${fmt(fin)}`;
}

export function LoyerFormEntete({
  loyer, clients, motifsDisponibles,
  fieldErrors, isReadOnly, handleChange,
}) {
  const estGenereParLocation = !!loyer.idContratLocation;
  const estForfait      = !!loyer.estForfait || loyer.typeDocument === 'confirmation';
  const periodeCompacte = formatPeriodeCompacte(loyer.periodeDebut, loyer.periodeFin);

  const clientTrouve     = clients.find(c => String(c.idClient) === String(loyer.idClient));
  const nomClientAffiche = clientTrouve
    ? `${clientTrouve.prenom} ${clientTrouve.nom}`
    : loyer.idClient ? `Client #${loyer.idClient}` : '—';

  return (
    <div className="loyer-form-section">
      <h3>Informations générales</h3>

      <div className="loyer-entete">

        {/* ── Ligne 1 : Client | Salle ── */}
        <div className="input-group">
          <input id="idClient" type="text" value={nomClientAffiche}
            disabled readOnly placeholder=" " />
          <label htmlFor="idClient">Client</label>
        </div>

        <div className="input-group">
          <input id="idSalle" type="text" value={loyer.nomSalle || '—'}
            disabled readOnly placeholder=" " />
          <label htmlFor="idSalle">Salle</label>
        </div>

        {/* ── Ligne 2 : Type de contrat | Motif ── */}
        <div className="input-group">
          <input id="idTypeContrat" type="text" value={loyer.nomTypeContrat || '—'}
            disabled readOnly placeholder=" " />
          <label htmlFor="idTypeContrat">Type de contrat</label>
        </div>

        <div className="input-group">
          <input id="motif" type="text" value={loyer.motif || '—'}
            disabled readOnly placeholder=" " />
          <label htmlFor="motif">Motif de location</label>
        </div>

        {/* ── Ligne 3 : Période (RO) | Switch dates paiement (si forfait) ── */}
        <div className="input-group">
          <input id="periode" type="text" value={periodeCompacte || '—'}
            disabled readOnly placeholder=" " />
          <label htmlFor="periode">Période</label>
        </div>

        {estForfait ? (
          <div className="input-group-switch">
            <div className="switch-field-content">
              <span className="switch-field-label"
                style={{ color: 'var(--color-primary, #800000)' }}>
                {LABEL_DATES_PAIEMENT}
              </span>
              <div className="switch-container">
                <input type="checkbox" id="afficherDatesPaiement" className="switch-input"
                  checked={!!loyer.afficherDatesPaiement}
                  onChange={e => handleChange('afficherDatesPaiement', e.target.checked)}
                  disabled={isReadOnly} />
                <label htmlFor="afficherDatesPaiement" className="switch-toggle" />
              </div>
            </div>
          </div>
        ) : (
          <div className="input-group loyer-entete__vide" />
        )}

      </div>

      {/* ── Bandeau info loyer généré depuis location (EDIT uniquement) ── */}
      {estGenereParLocation && !isReadOnly && (
        <div className="loyer-info-banner">
          <ICONS.INFO_CIRCLE size={16} style={{ flexShrink: 0, marginRight: '8px' }} />
          Ce loyer est généré depuis une location de salle — seuls les montants sont modifiables.
        </div>
      )}
    </div>
  );
}