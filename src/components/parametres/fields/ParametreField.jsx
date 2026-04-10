// src/components/parametres/fields/ParametreField.jsx
/**
 * Composant pour afficher un champ de paramètre individuel
 * ✅ Utilise les libellés et descriptions depuis PARAMETRE_METADATA
 * ✅ Import centralisé depuis constants/index.js
 */

import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import {
  getInputType,
  generateParametreId,
} from '../helpers/parametreHelpers';
import {
  PARAMETRE_TYPES,
  PARAMETRE_VALIDATION,
  getParametreLibelle,
  getParametreDescription
} from '../../../constants'; // ✅ Import depuis l'index centralisé

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
  const fieldId   = generateParametreId(groupeParametre, sousGroupeParametre, categorie, parametre.nomParametre);
  const inputType = getInputType(parametre.nomParametre, groupeParametre);
  const isFocused = focusedField === fieldId;

  // ── Chargement des options SELECT ──────────────────────────────────────────
  const [selectOptions, setSelectOptions] = useState([]);
  const [selectLoading, setSelectLoading] = useState(false);

  useEffect(() => {
    if (inputType !== PARAMETRE_TYPES.SELECT) return;

    setSelectLoading(true);
    api.get('tarif-api.php?services=true')
      .then(data => {
        const services = data?.services ?? [];
        setSelectOptions(services.map(s => ({
          value: s.nomService ?? s.nom_service ?? '',
          label: s.nomService ?? s.nom_service ?? '',
        })));
      })
      .catch(() => setSelectOptions([]))
      .finally(() => setSelectLoading(false));
  }, [inputType]);
  
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
  // ✅ Vérifier si c'est un select
  const isSelect   = inputType === PARAMETRE_TYPES.SELECT;
  
  // ✅ Récupérer le libellé depuis les constantes
  // Pour les paramètres génériques (label, nom_service dans LocationSalle), la clé METADATA
  // n'inclut pas la catégorie — on ne la passe que si la clé avec catégorie existe.
  const resolveLibelle = (nom, cat) => {
    if (!cat || cat === 'Default') return getParametreLibelle(nom, undefined);
    const avecCat = getParametreLibelle(nom, cat);
    // getParametreLibelle retourne le nom brut si pas de clé → dans ce cas essayer sans catégorie
    const sansCat = getParametreLibelle(nom, undefined);
    return avecCat !== nom ? avecCat : sansCat;
  };
  const fieldLibelle      = resolveLibelle(parametre.nomParametre, categorie);
  
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
    <div className={`pf-field${needsYear ? ' pf-field--with-year' : ''}`}>

      {/* Champ principal */}
      <div className="pf-field-main">
        <label className="pf-label" htmlFor={fieldId}>
          {getFieldLabel()}
        </label>

        {isSelect ? (
          <select
            id={fieldId}
            className={`pf-input pf-input--select${isFocused ? ' pf-input--focused' : ''}${validationError ? ' pf-input--error' : ''}`}
            value={value ?? ''}
            onChange={(e) => onValueChange(e.target.value)}
            onFocus={() => onFocus(fieldId)}
            onBlur={() => onBlur(fieldId)}
            disabled={selectLoading}
          >
            <option value="">— Sélectionner —</option>
            {selectOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        ) : isTextarea ? (
          <textarea
            id={fieldId}
            className={`pf-input pf-input--textarea${isFocused ? ' pf-input--focused' : ''}${validationError ? ' pf-input--error' : ''}`}
            value={value ?? ''}
            onChange={(e) => onValueChange(e.target.value)}
            onFocus={() => onFocus(fieldId)}
            onBlur={() => onBlur(fieldId)}
            maxLength={2000}
            rows={5}
          />
        ) : (
          <input
            type={inputType === PARAMETRE_TYPES.EMAIL ? 'email' :
                  inputType === PARAMETRE_TYPES.NUMBER ? 'number' :
                  inputType === PARAMETRE_TYPES.YEAR ? 'number' : 'text'}
            id={fieldId}
            className={`pf-input${isFocused ? ' pf-input--focused' : ''}${validationError ? ' pf-input--error' : ''}`}
            value={value ?? ''}
            onChange={(e) => onValueChange(e.target.value)}
            onFocus={() => onFocus(fieldId)}
            onBlur={() => onBlur(fieldId)}
            min={inputType === PARAMETRE_TYPES.YEAR ? PARAMETRE_VALIDATION.MIN_YEAR : undefined}
            max={inputType === PARAMETRE_TYPES.YEAR ? PARAMETRE_VALIDATION.MAX_YEAR : undefined}
          />
        )}

        {fieldDescription && (
          <span className="pf-desc">{fieldDescription}</span>
        )}

        {validationError && (
          <span className="pf-error">{validationError}</span>
        )}
      </div>

      {/* Sélecteur d'année (à côté) */}
      {needsYear && (
        <div className="pf-field-year">
          <label className="pf-label" htmlFor={`${fieldId}-year`}>
            Année
          </label>
          <select
            id={`${fieldId}-year`}
            className={`pf-input pf-input--select${focusedField === `${fieldId}-year` ? ' pf-input--focused' : ''}`}
            value={year || new Date().getFullYear()}
            onChange={(e) => onYearChange(e.target.value)}
            onFocus={() => onFocus(`${fieldId}-year`)}
            onBlur={() => onBlur(`${fieldId}-year`)}
          >
            {yearOptions.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      )}

    </div>
  );
};

export default ParametreField;