// src/components/clients/sections/ClientFormLeftSection.jsx
// Section gauche du formulaire client (Thérapeute + Titre)

import React from 'react';
import { toBoolean } from '../../../utils/booleanHelper';

/**
 * Section gauche du formulaire avec le switch thérapeute et le select titre
 */
function ClientFormLeftSection({ 
  client, 
  handleChange, 
  toggleTherapeute, 
  isReadOnly = false,
  fieldErrors = {},
  className = ''
}) {
  
  const sectionClasses = ['form-left-section'];
  if (className) sectionClasses.push(className);

  return (
    <div className={sectionClasses.join(' ')}>
      
      {/* Switch Thérapeute */}
      <TherapistField
        checked={toBoolean(client.estTherapeute)}
        onChange={toggleTherapeute}
        disabled={isReadOnly}
      />
      
      {/* Select Titre */}
      <TitleField
        value={client.titre || ''}
        onChange={handleChange}
        disabled={isReadOnly}
        error={fieldErrors.titre}
        required={true}
      />
      
    </div>
  );
}

/**
 * Composant pour le champ thérapeute avec switch
 */
function TherapistField({ checked, onChange, disabled = false }) {
  return (
    <div className="therapist-field">
      <div className="field-label">
        Thérapeute
      </div>
      <div className="switch-container">
        <input
          type="checkbox"
          id="estTherapeute"
          name="estTherapeute"
          className="switch-input"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          aria-label={checked ? 'Client défini comme thérapeute' : 'Client standard'}
        />
        <label htmlFor="estTherapeute" className="switch-label" aria-hidden="true"></label>
      </div>
    </div>
  );
}

/**
 * Composant pour le champ titre
 */
function TitleField({ value, onChange, disabled = false, error = null, required = false }) {
  const fieldClasses = ['input-group'];
  if (error) fieldClasses.push('has-error');

  return (
    <div className={fieldClasses.join(' ')}>
      <select
        id="titre"
        name="titre"
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        aria-describedby={error ? 'titre-error' : undefined}
        aria-invalid={!!error}
      >
        <option value="">Sélectionnez un titre</option>
        <option value="Madame">Madame</option>
        <option value="Monsieur">Monsieur</option>
      </select>
      
      <label htmlFor="titre" className={required ? 'required' : ''}>
        Titre
      </label>
      
      {/* Message d'erreur */}
      {error && (
        <div id="titre-error" className="error-message" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}

export default ClientFormLeftSection;