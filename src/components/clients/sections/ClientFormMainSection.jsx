// src/components/clients/sections/ClientFormMainSection.jsx
// Section principale du formulaire client avec les 4 lignes de champs

import React from 'react';
import { PHONE_TYPES, HELP_TEXTS } from '../../../constants/clientConstants';

/**
 * Section principale du formulaire avec les champs organisés en 4 lignes
 */
function ClientFormMainSection({ 
  client, 
  handleChange, 
  fieldErrors = {},
  phoneType = null,
  isReadOnly = false,
  getFieldClasses,
  className = ''
}) {
  
  const sectionClasses = ['form-main-section'];
  if (className) sectionClasses.push(className);

  return (
    <div className={sectionClasses.join(' ')}>
      
      {/* Ligne 1 : Prénom + Nom */}
      <FormRow>
        <InputField
          id="prenom"
          name="prenom"
          label="Prénom"
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

      {/* Ligne 2 : Rue + Numéro */}
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
          label="Numéro"
          value={client.numero || ''}
          onChange={handleChange}
          required={true}
          readOnly={isReadOnly}
          error={fieldErrors.numero}
          maxLength={20}
          className={getFieldClasses?.('numero')}
        />
      </FormRow>

      {/* Ligne 3 : Code postal + Localité */}
      <FormRow>
        <InputField
          id="code_postal"
          name="code_postal"
          label="Code postal"
          type="text"
          value={client.code_postal || ''}
          onChange={handleChange}
          required={true}
          readOnly={isReadOnly}
          error={fieldErrors.code_postal}
          className={getFieldClasses?.('code_postal')}
        />
        
        <InputField
          id="localite"
          name="localite"
          label="Localité"
          value={client.localite || ''}
          onChange={handleChange}
          required={true}
          readOnly={isReadOnly}
          error={fieldErrors.localite}
          maxLength={100}
          className={getFieldClasses?.('localite')}
        />
      </FormRow>

      {/* Ligne 4 : Téléphone + Email */}
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
      
    </div>
  );
}

/**
 * Composant de ligne de formulaire
 */
function FormRow({ children, className = '' }) {
  const rowClasses = ['form-row'];
  if (className) rowClasses.push(className);
  
  return (
    <div className={rowClasses.join(' ')}>
      {children}
    </div>
  );
}

/**
 * Composant générique pour les champs input
 */
function InputField({ 
  id, 
  name, 
  label, 
  type = 'text', 
  value, 
  onChange, 
  required = false,
  readOnly = false,
  error = null,
  maxLength = null,
  className = '',
  placeholder = ' ',
  ...props 
}) {
  const fieldClasses = ['input-group'];
  if (className) fieldClasses.push(className);
  if (error) fieldClasses.push('has-error');

  return (
    <div className={fieldClasses.join(' ')}>
      <input
        type={type}
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        readOnly={readOnly}
        placeholder={placeholder}
        maxLength={maxLength}
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={!!error}
        {...props}
      />
      
      <label htmlFor={id} className={required ? 'required' : ''}>
        {label}
      </label>
      
      {/* Message d'erreur */}
      {error && (
        <div id={`${id}-error`} className="error-message" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}

/**
 * Composant spécialisé pour le champ téléphone
 */
function PhoneField({ 
  client, 
  onChange, 
  fieldErrors, 
  phoneType, 
  readOnly = false, 
  className = '' 
}) {
  const fieldClasses = ['input-group'];
  if (className) fieldClasses.push(className);
  if (fieldErrors.telephone) fieldClasses.push('has-error');
  if (phoneType) fieldClasses.push(`phone-type-${phoneType}`);

  const getHelpText = () => {
    if (fieldErrors.telephone) return null; // L'erreur sera affichée
    
    switch (phoneType) {
      case PHONE_TYPES.SWISS:
        return HELP_TEXTS.PHONE_SWISS;
      case PHONE_TYPES.FOREIGN:
        return HELP_TEXTS.PHONE_FOREIGN;
      default:
        return HELP_TEXTS.PHONE_DEFAULT;
    }
  };

  return (
    <div className={fieldClasses.join(' ')}>
      <input
        type="tel"
        id="telephone"
        name="telephone"
        value={client.telephone || ''}
        onChange={onChange}
        readOnly={readOnly}
        placeholder=" "
        maxLength={20}
        aria-describedby={
          fieldErrors.telephone ? 'telephone-error' : 
          getHelpText() ? 'telephone-help' : undefined
        }
        aria-invalid={!!fieldErrors.telephone}
      />
      
      <label htmlFor="telephone">Téléphone</label>
      
      {/* Badge de type de téléphone */}
      {!readOnly && phoneType === PHONE_TYPES.SWISS && (
        <div className="phone-type-badge swiss" aria-label="Téléphone suisse">
          CH
        </div>
      )}
      {!readOnly && phoneType === PHONE_TYPES.FOREIGN && (
        <div className="phone-type-badge foreign" aria-label="Téléphone international">
          INT
        </div>
      )}
      
      {/* Messages d'erreur ou d'aide */}
      {fieldErrors.telephone ? (
        <div id="telephone-error" className="error-message" role="alert">
          {fieldErrors.telephone}
        </div>
      ) : (
        getHelpText() && !readOnly && (
          <small id="telephone-help" className="help-text">
            {getHelpText()}
          </small>
        )
      )}
    </div>
  );
}

/**
 * Composant spécialisé pour le champ email
 */
function EmailField({ 
  client, 
  onChange, 
  fieldErrors, 
  readOnly = false, 
  className = '' 
}) {
  const fieldClasses = ['input-group'];
  if (className) fieldClasses.push(className);
  if (fieldErrors.email) fieldClasses.push('has-error');

  return (
    <div className={fieldClasses.join(' ')}>
      <input
        type="email"
        id="email"
        name="email"
        value={client.email || ''}
        onChange={onChange}
        readOnly={readOnly}
        placeholder=" "
        maxLength={255}
        aria-describedby={fieldErrors.email ? 'email-error' : undefined}
        aria-invalid={!!fieldErrors.email}
      />
      
      <label htmlFor="email">Email</label>
      
      {/* Message d'erreur */}
      {fieldErrors.email && (
        <div id="email-error" className="error-message" role="alert">
          {fieldErrors.email}
        </div>
      )}
    </div>
  );
}

export default ClientFormMainSection;