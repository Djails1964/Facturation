// src/components/clients/sections/ClientFormMainSection.jsx
// Section principale du formulaire client avec les 5 lignes de champs

import React from 'react';
import { PHONE_TYPES, HELP_TEXTS } from '../../../constants/clientConstants';
import { createLogger } from '../../../utils/createLogger';
import { toBoolean } from '../../../utils/booleanHelper';

/**
 * Section principale du formulaire avec les champs organises en 5 lignes
 */
function ClientFormMainSection({ 
  client, 
  handleChange,
  toggleTherapeute,
  toggleLoyer,
  fieldErrors = {},
  phoneType = null,
  isReadOnly = false,
  getFieldClasses,
  className = ''
}) {
  
  const logger = createLogger('ClientFormMainSection');

  logger.debug('Rendering ClientFormMainSection with client:', client);

  const sectionClasses = ['form-main-section'];
  if (className) sectionClasses.push(className);

  return (
    <div className={sectionClasses.join(' ')}>
      
      {/* Ligne 1 : Prenom + Nom */}
      <FormRow>
        <InputField
          id="prenom"
          name="prenom"
          label="Prenom"
          value={client.prenom || ''}
          onChange={handleChange}
          required={true}
          readOnly={isReadOnly}
          error={fieldErrors.prenom}
          maxLength={100}
          className={getFieldClasses?.('prenom')}
        />
        
        <InputField
          id="nom"
          name="nom"
          label="Nom"
          value={client.nom || ''}
          onChange={handleChange}
          required={true}
          readOnly={isReadOnly}
          error={fieldErrors.nom}
          maxLength={100}
          className={getFieldClasses?.('nom')}
        />
      </FormRow>

      {/* Ligne 2 : Rue + Numero */}
      <FormRow>
        <InputField
          id="rue"
          name="rue"
          label="Rue"
          value={client.rue || ''}
          onChange={handleChange}
          required={true}
          readOnly={isReadOnly}
          error={fieldErrors.rue}
          maxLength={150}
          className={getFieldClasses?.('rue')}
        />
        
        <InputField
          id="numero"
          name="numero"
          label="Numero"
          value={client.numero || ''}
          onChange={handleChange}
          required={true}
          readOnly={isReadOnly}
          error={fieldErrors.numero}
          maxLength={20}
          className={getFieldClasses?.('numero')}
        />
      </FormRow>

      {/* Ligne 3 : Code postal + Localite */}
      <FormRow>
        <InputField
          id="codePostal"
          name="codePostal"
          label="Code postal"
          type="text"
          value={client.codePostal || ''}
          onChange={handleChange}
          required={true}
          readOnly={isReadOnly}
          error={fieldErrors.codePostal}
          className={getFieldClasses?.('codePostal')}
        />
        
        <InputField
          id="localite"
          name="localite"
          label="Localite"
          value={client.localite || ''}
          onChange={handleChange}
          required={true}
          readOnly={isReadOnly}
          error={fieldErrors.localite}
          maxLength={100}
          className={getFieldClasses?.('localite')}
        />
      </FormRow>

      {/* Ligne 4 : Telephone + Email */}
      <FormRow>
        <PhoneField
          client={client}
          onChange={handleChange}
          fieldErrors={fieldErrors}
          phoneType={phoneType}
          readOnly={isReadOnly}
          className={getFieldClasses?.('telephone')}
        />
        
        <EmailField
          client={client}
          onChange={handleChange}
          fieldErrors={fieldErrors}
          readOnly={isReadOnly}
          className={getFieldClasses?.('email')}
        />
      </FormRow>

      {/* Ligne 5 : Switch Therapeute + Switch Loyer */}
      <FormRow>
        <SwitchInputGroup
          id="estTherapeute"
          name="estTherapeute"
          label="Thérapeute"
          checked={toBoolean(client.estTherapeute)}
          onChange={toggleTherapeute}
          disabled={isReadOnly}
        />
        <SwitchInputGroup
          id="aLoyer"
          name="aLoyer"
          label="Loyer"
          checked={toBoolean(client.aLoyer)}
          onChange={toggleLoyer}
          disabled={isReadOnly}
        />
      </FormRow>
      
    </div>
  );
}

function FormRow({ children, className = '' }) {
  const rowClasses = ['form-row'];
  if (className) rowClasses.push(className);
  
  return (
    <div className={rowClasses.join(' ')}>
      {children}
    </div>
  );
}

function InputField({ 
  id, name, label, type = 'text', value, onChange, required = false,
  readOnly = false, error = null, maxLength = null, className = '',
  placeholder = ' ', ...props 
}) {
  const fieldClasses = ['input-group'];
  if (className) fieldClasses.push(className);
  if (error) fieldClasses.push('has-error');

  return (
    <div className={fieldClasses.join(' ')}>
      <input
        type={type} id={id} name={name} value={value} onChange={onChange}
        required={required} readOnly={readOnly} placeholder={placeholder}
        maxLength={maxLength}
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={!!error}
        {...props}
      />
      <label htmlFor={id} className={required ? 'required' : ''}>{label}</label>
      {error && <div id={`${id}-error`} className="error-message" role="alert">{error}</div>}
    </div>
  );
}

function PhoneField({ client, onChange, fieldErrors, phoneType, readOnly = false, className = '' }) {
  const fieldClasses = ['input-group'];
  if (className) fieldClasses.push(className);
  if (fieldErrors.telephone) fieldClasses.push('has-error');
  if (phoneType) fieldClasses.push(`phone-type-${phoneType}`);

  const getHelpText = () => {
    if (fieldErrors.telephone) return null;
    switch (phoneType) {
      case PHONE_TYPES.SWISS: return HELP_TEXTS.PHONE_SWISS;
      case PHONE_TYPES.FOREIGN: return HELP_TEXTS.PHONE_FOREIGN;
      default: return HELP_TEXTS.PHONE_DEFAULT;
    }
  };

  return (
    <div className={fieldClasses.join(' ')}>
      <input type="tel" id="telephone" name="telephone" value={client.telephone || ''}
        onChange={onChange} readOnly={readOnly} placeholder=" " maxLength={20}
        aria-describedby={fieldErrors.telephone ? 'telephone-error' : getHelpText() ? 'telephone-help' : undefined}
        aria-invalid={!!fieldErrors.telephone}
      />
      <label htmlFor="telephone">Telephone</label>
      {!readOnly && phoneType === PHONE_TYPES.SWISS && <div className="phone-type-badge swiss">CH</div>}
      {!readOnly && phoneType === PHONE_TYPES.FOREIGN && <div className="phone-type-badge foreign">INT</div>}
      {fieldErrors.telephone ? (
        <div id="telephone-error" className="error-message" role="alert">{fieldErrors.telephone}</div>
      ) : (getHelpText() && !readOnly && <small id="telephone-help" className="help-text">{getHelpText()}</small>)}
    </div>
  );
}

function EmailField({ client, onChange, fieldErrors, readOnly = false, className = '' }) {
  const fieldClasses = ['input-group'];
  if (className) fieldClasses.push(className);
  if (fieldErrors.email) fieldClasses.push('has-error');

  return (
    <div className={fieldClasses.join(' ')}>
      <input type="email" id="email" name="email" value={client.email || ''}
        onChange={onChange} readOnly={readOnly} placeholder=" " maxLength={255}
        aria-describedby={fieldErrors.email ? 'email-error' : undefined}
        aria-invalid={!!fieldErrors.email}
      />
      <label htmlFor="email">Email</label>
      {fieldErrors.email && <div id="email-error" className="error-message" role="alert">{fieldErrors.email}</div>}
    </div>
  );
}

/**
 * Composant switch dans input-group
 * Structure : input-group > (label + switch)
 */
function SwitchInputGroup({ id, name, label, checked, onChange, disabled = false }) {
  return (
    <div className="input-group-switch">
      <div className="switch-field-content">
        <span className="switch-field-label">{label}</span>
        <div className="switch-container">
          <input
            type="checkbox"
            id={id}
            name={name}
            className="switch-input"
            checked={checked}
            onChange={onChange}
            disabled={disabled}
          />
          <label htmlFor={id} className="switch-toggle"></label>
        </div>
      </div>
    </div>
  );
}

export default ClientFormMainSection;