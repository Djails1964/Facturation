// src/components/parametres/fields/ParametreField.jsx
/**
 * Composant pour afficher un champ de paramètre individuel
 * ✅ Utilise les libellés et descriptions depuis PARAMETRE_METADATA
 */

import React from 'react';
import {
  getInputType,
  generateParametreId,
  shouldShowParameterName
} from '../helpers/parametreHelpers';
import {
  PARAMETRE_TYPES,
  PARAMETRE_VALIDATION,
  getParametreLibelle,
  getParametreDescription
} from '../../../constants/parametreConstants';

const ParametreField = ({
  groupeParametre,
  sousGroupeParametre,
  categorie,
  parametre,
  value,
  year,
  onValueChange,
  onYearChange,
  focusedField,
  onFocus,
  onBlur,
  validationError
}) => {
  console.log('parametre reçu = ', parametre);
  
  const fieldId = generateParametreId(groupeParametre, sousGroupeParametre, categorie, parametre.nomParametre);
  const inputType = getInputType(parametre.nomParametre, groupeParametre);
  const isFocused = focusedField === fieldId;
  
  // ✅ L'année est nécessaire pour tous les paramètres de numéro de facture
  const needsYear = (groupeParametre === 'Facture' || groupeParametre === 'Facturation') && 
                     parametre.nomParametre === 'Prochain Numéro Facture';
  
  // ✅ Générer la liste des années (1 passée + actuelle + 8 futures)
  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = -1; i <= 8; i++) {
      years.push(currentYear + i);
    }
    return years;
  };
  
  const yearOptions = needsYear ? generateYearOptions() : [];
  
  // ✅ Vérifier si c'est un textarea
  const isTextarea = inputType === PARAMETRE_TYPES.TEXTAREA;
  
  // ✅ Récupérer le libellé depuis les constantes
  const fieldLibelle = getParametreLibelle(parametre.nomParametre, categorie !== 'Default' ? categorie : undefined);
  
  // ✅ Récupérer la description depuis les constantes
  const fieldDescription = getParametreDescription(parametre.nomParametre, categorie !== 'Default' ? categorie : undefined);
  
  // ✅ Déterminer le label à afficher (avec gestion spéciale pour année)
  const getFieldLabel = () => {
    if (needsYear && year) {
      return `${fieldLibelle} (${year})`;
    }
    return fieldLibelle;
  };

  return (
    <div className="parametre-field">
      {/* ✅ Champ principal de valeur */}
      <div className="parametre-field-main">
        <div className={`input-group ${isFocused ? 'focused' : ''} ${validationError ? 'error' : ''}`}>
          {isTextarea ? (
            /* ✅ Textarea pour textes longs */
            <textarea
              id={fieldId}
              value={value}
              onChange={(e) => onValueChange(e.target.value)}
              onFocus={() => onFocus(fieldId)}
              onBlur={() => onBlur(fieldId)}
              placeholder=" "
              maxLength={2000}
              rows={5}
            />
          ) : (
            /* Input classique */
            <input
              type={inputType === PARAMETRE_TYPES.EMAIL ? 'email' : 
                    inputType === PARAMETRE_TYPES.NUMBER ? 'number' :
                    inputType === PARAMETRE_TYPES.YEAR ? 'number' : 'text'}
              id={fieldId}
              value={value}
              onChange={(e) => onValueChange(e.target.value)}
              onFocus={() => onFocus(fieldId)}
              onBlur={() => onBlur(fieldId)}
              placeholder=" "
              min={inputType === PARAMETRE_TYPES.YEAR ? PARAMETRE_VALIDATION.MIN_YEAR : undefined}
              max={inputType === PARAMETRE_TYPES.YEAR ? PARAMETRE_VALIDATION.MAX_YEAR : undefined}
            />
          )}
          <label htmlFor={fieldId}>
            {getFieldLabel()}
          </label>
        </div>

        {/* ✅ Description du champ - Affichée seulement si elle n'est pas vide */}
        {fieldDescription && (
          <small className="field-description">
            {fieldDescription}
          </small>
        )}
      </div>

      {/* ✅ Champ année - À CÔTÉ du champ principal */}
      {needsYear && (
        <div className="parametre-field-year">
          <div className={`input-group ${focusedField === `${fieldId}-year` ? 'focused' : ''}`}>
            <select
              id={`${fieldId}-year`}
              value={year || new Date().getFullYear()}
              onChange={(e) => onYearChange(e.target.value)}
              onFocus={() => onFocus(`${fieldId}-year`)}
              onBlur={() => onBlur(`${fieldId}-year`)}
            >
              {yearOptions.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <label htmlFor={`${fieldId}-year`}>
              Année
            </label>
          </div>
        </div>
      )}

      {/* Message d'erreur de validation */}
      {validationError && (
        <div className="parametre-field-error">
          {validationError}
        </div>
      )}
    </div>
  );
};

export default ParametreField;