// components/loyers/sections/LoyerFormInfosGenerales.jsx
// Section 1 du formulaire loyer : client, période, durée, motif, switch dates paiement.

import React from 'react';
import { CalendarIcon } from '../../ui/buttons';

/** Champ date avec label flottant et icône calendrier */
export function LoyerDateInput({ id, value, onChange, disabled, required, label, error }) {
  const inputRef = React.useRef(null);
  const openPicker = () => {
    if (!disabled && inputRef.current?.showPicker) {
      try { inputRef.current.showPicker(); } catch (e) { /* non supporté */ }
    }
  };
  return (
    <div className="input-group date-input">
      <input
        ref={inputRef} id={id} type="date"
        value={value} onChange={onChange}
        disabled={disabled} required={required} placeholder=" "
      />
      <label htmlFor={id} className={required ? 'required' : ''}>{label}</label>
      <CalendarIcon onClick={openPicker} disabled={disabled} />
      {error && <span className="error-message">{error}</span>}
    </div>
  );
}

export function LoyerFormInfosGenerales({
  loyer, clients, clientsLoading, motifsDisponibles,
  fieldErrors, isReadOnly, handleChange,
}) {
  return (
    <div className="loyer-form-section">
      <h3>Informations générales</h3>

      {/* Client */}
      <div className="form-row">
        <div className="input-group">
          <select
            id="idClient"
            value={loyer.idClient}
            onChange={(e) => handleChange('idClient', e.target.value)}
            disabled={isReadOnly || clientsLoading}
            required
          >
            <option value="">Sélectionnez un client</option>
            {clients.map(c => (
              <option key={c.idClient} value={String(c.idClient)}>
                {c.prenom} {c.nom}
              </option>
            ))}
          </select>
          <label htmlFor="idClient" className="required">Client</label>
          {fieldErrors.idClient && <span className="error-message">{fieldErrors.idClient}</span>}
        </div>
      </div>

      {/* Période + durée */}
      <div className="form-row">
        <LoyerDateInput
          id="periodeDebut" value={loyer.periodeDebut}
          onChange={(e) => handleChange('periodeDebut', e.target.value)}
          disabled={isReadOnly} required
          label="Date début période" error={fieldErrors.periodeDebut}
        />
        <div className="input-group">
          <input
            id="dureeMois" type="number" min="1" max="36"
            value={loyer.dureeMois}
            onChange={(e) => handleChange('dureeMois', Math.max(1, parseInt(e.target.value) || 1))}
            disabled={isReadOnly} required placeholder=" "
          />
          <label htmlFor="dureeMois" className="required">Durée (mois)</label>
          {fieldErrors.dureeMois && <span className="error-message">{fieldErrors.dureeMois}</span>}
        </div>
        <LoyerDateInput
          id="periodeFin" value={loyer.periodeFin}
          onChange={() => {}} disabled label="Date fin période"
        />
      </div>

      {/* Motif */}
      <div className="form-row">
        <div className="input-group">
          {motifsDisponibles?.length > 0 ? (
            <select
              id="motif" value={loyer.motif}
              onChange={(e) => handleChange('motif', e.target.value)}
              disabled={isReadOnly} required
            >
              <option value="">Sélectionnez un motif</option>
              {motifsDisponibles.map((m, i) => (
                <option key={i} value={m.valeur ?? m.libelle}>{m.libelle}</option>
              ))}
            </select>
          ) : (
            <input
              id="motif" type="text"
              value={loyer.motif}
              onChange={(e) => handleChange('motif', e.target.value)}
              disabled={isReadOnly} required placeholder=" "
            />
          )}
          <label htmlFor="motif" className="required">Motif</label>
          {fieldErrors.motif && <span className="error-message">{fieldErrors.motif}</span>}
        </div>
      </div>

      {/* Switch afficher dates paiement */}
      <div className="form-row">
        <div className="input-group-switch">
          <label className="switch-label">Afficher les dates de paiement</label>
          <div className="switch-container">
            <input
              type="checkbox"
              id="afficherDatesPaiement"
              className="switch-input"
              checked={!!loyer.afficherDatesPaiement}
              onChange={(e) => handleChange('afficherDatesPaiement', e.target.checked)}
              disabled={isReadOnly}
            />
            <label htmlFor="afficherDatesPaiement" className="switch-toggle" />
          </div>
        </div>
      </div>
    </div>
  );
}