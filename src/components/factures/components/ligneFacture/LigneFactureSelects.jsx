// src/components/factures/components/ligneFacture/LigneFactureSelects.jsx
import React from 'react';
import { FiClipboard } from 'react-icons/fi';
import DateInputField from '../../../shared/DateInputField';
import { ValidationError } from '../../../shared/forms/FormField';
import { createLogger } from '../../../../utils/createLogger';
import { getUniteOptions } from './ligneFactureHelpers';

const log = createLogger("LigneFactureFields");

// ── Helpers internes ──────────────────────────────────────────────────────────

function findUniteDefaut(serviceObj, unites, unitesByService, serviceCode) {
    if (!unites?.length || !serviceObj?.idService) return null;

    if (serviceObj.idUniteDefaut) {
        const found = unites.find(u => u && u.idUnite === serviceObj.idUniteDefaut);
        if (found) return found;
    }
    const parIsDefault = unites.find(u => u && u.idService === serviceObj.idService && u.isDefault === true);
    if (parIsDefault) return parIsDefault;

    if (unitesByService?.[serviceCode]?.length > 0) {
        const code  = unitesByService[serviceCode][0];
        const found = unites.find(u => u && (u.codeUnite === code || u.code === code));
        if (found) return found;
    }
    const disponibles = unites.filter(u => u && u.idService === serviceObj.idService);
    return disponibles[0] ?? null;
}

// ── ServiceTypeSelect ─────────────────────────────────────────────────────────

export function ServiceTypeSelect({ ligne, index, services, unites, unitesByService, focusedFields, validationErrors, onModify, onFocus, onBlur, getErrorClass }) {
    const errorClass   = getErrorClass('serviceType');
    const currentValue = ligne.serviceTypeCode || '';
    const hasValue     = !!currentValue;

    const applyUniteSelection = (uniteObj, newIdService = null) => {
        if (!uniteObj) { log.warn('⚠️ Objet unité invalide'); return; }
        const uniteEnrichie = newIdService ? { ...uniteObj, _newIdService: newIdService } : uniteObj;
        onModify(index, 'unite', uniteEnrichie);
        setTimeout(() => {
            const sel = document.getElementById(`unite-${index}`);
            if (sel) {
                sel.value = uniteObj.codeUnite || uniteObj.code;
                sel.parentElement?.classList.add('has-value');
            }
        }, 100);
    };

    const handleServiceChange = async (e) => {
        const serviceCode = e.target.value;
        const serviceObj  = services.find(s => s?.codeService === serviceCode);
        if (!serviceObj) {
            onModify(index, 'service', null);
            onModify(index, 'unite',   null);
            return;
        }
        onModify(index, 'service', serviceObj);
        if (unites?.length) {
            setTimeout(() => {
                const defaut = findUniteDefaut(serviceObj, unites, unitesByService, serviceCode);
                if (defaut) applyUniteSelection(defaut, serviceObj.idService);
                else        onModify(index, 'unite', null);
            }, 150);
        } else {
            onModify(index, 'unite', null);
        }
    };

    return (
        <div className={`fdf_floating-label-input ${focusedFields[`serviceType-${index}`] ? 'fdf_focused' : ''} ${hasValue ? 'has-value' : ''}`}>
            <select id={`serviceType-${index}`} value={currentValue}
                onChange={handleServiceChange}
                onFocus={() => onFocus(index, 'serviceType')}
                onBlur={() => onBlur(index, 'serviceType', currentValue)}
                className={`fdf_form-control ${errorClass}`} required>
                <option value="">Sélectionner un service</option>
                {services.filter(s => s?.idService && s.codeService && s.nomService)
                    .map(s => <option key={`service-${s.idService}`} value={s.codeService}>{s.nomService}</option>)}
            </select>
            <label htmlFor={`serviceType-${index}`}>Type de service <span className="fdf_required">*</span></label>
            <ValidationError message={validationErrors[index]?.serviceType} />
        </div>
    );
}

// ── UniteSelect ───────────────────────────────────────────────────────────────

export function UniteSelect({ ligne, index, unites, unitesByService, focusedFields, validationErrors, onModify, onFocus, onBlur, getErrorClass }) {
    const errorClass       = getErrorClass('unite');
    const currentValue     = ligne.unite?.codeUnite || '';
    const hasValue         = !!currentValue;
    const currentServiceType = ligne.serviceTypeCode || '';

    const handleUniteChange = (e) => {
        const uniteObj = unites.find(u => u && (u.codeUnite === e.target.value || u.code === e.target.value));
        onModify(index, 'unite', uniteObj ?? null);
    };

    return (
        <div className={`fdf_floating-label-input ${focusedFields[`unite-${index}`] ? 'fdf_focused' : ''} ${hasValue ? 'has-value' : ''}`}>
            <select id={`unite-${index}`} value={currentValue}
                onChange={handleUniteChange}
                onFocus={() => onFocus(index, 'unite')}
                onBlur={() => onBlur(index, 'unite', currentValue)}
                disabled={!currentServiceType}
                className={`fdf_form-control ${errorClass}`} required>
                <option key="default" value="">Sélectionnez une unité</option>
                {getUniteOptions(ligne, unites, unitesByService)}
            </select>
            <label htmlFor={`unite-${index}`}>Unité <span className="fdf_required">*</span></label>
            <ValidationError message={validationErrors[index]?.unite} />
        </div>
    );
}

// ── DescriptionInputGroup ─────────────────────────────────────────────────────

export function DescriptionInputGroup({ ligne, index, focusedFields, validationErrors, onModify, onInsertUniteName, onFocus, onBlur, getErrorClass }) {
    const errorClass          = getErrorClass('description');
    const hasDescriptionValue = ligne.description !== undefined && ligne.description !== '';
    const isClipboardDisabled = !ligne.unite ||
        (typeof ligne.unite === 'object' && !ligne.unite.nom && !ligne.unite.nomUnite) ||
        (typeof ligne.unite === 'string'  && !ligne.unite);
    const charactersRemaining = 200 - (ligne.description || '').length;

    return (
        <div className="fdf_description-group">
            <div className={`fdf_floating-label-input ${focusedFields[`description-${index}`] ? 'fdf_focused' : ''} ${hasDescriptionValue ? 'has-value' : ''}`}>
                <input type="text" id={`description-${index}`} value={ligne.description || ''}
                    onChange={(e) => onModify(index, 'description', e.target.value.slice(0, 200))}
                    onFocus={() => onFocus(index, 'description')}
                    onBlur={() => onBlur(index, 'description', ligne.description)}
                    className={`fdf_form-control ${errorClass}`} placeholder=" " maxLength="200" required />
                <label htmlFor={`description-${index}`}>Description <span className="fdf_required">*</span></label>
                <FiClipboard
                    className={`fdf_clipboard-icon ${isClipboardDisabled ? 'fdf_icon-disabled' : ''}`}
                    onClick={() => !isClipboardDisabled && onInsertUniteName?.(index)}
                    title={isClipboardDisabled ? "Veuillez d'abord sélectionner une unité" : "Copier le nom de l'unité en début de description"} />
                <ValidationError message={validationErrors[index]?.description} />
                <div className="fdf_char-limit-info" style={{
                    position: 'absolute', right: '0',
                    bottom: validationErrors[index]?.description ? '-40px' : '-20px',
                    fontSize: '0.75rem',
                    color: charactersRemaining < 20 ? '#d32f2f' : '#666'
                }}>
                    {charactersRemaining} caractère{charactersRemaining !== 1 ? 's' : ''} restant{charactersRemaining !== 1 ? 's' : ''}
                </div>
            </div>
            <DateInputField
                id={`descriptionDates-${index}`} label="Dates"
                value={ligne.descriptionDates || ''}
                onChange={(v) => onModify(index, 'descriptionDates', typeof v === 'string' ? v : v?.target?.value)}
                updateQuantity={(formattedDates, count) => {
                    onModify(index, { descriptionDates: formattedDates, nbSeances: count });
                    onFocus(index, 'descriptionDates');
                }}
                readOnly={false} maxLength={100} showCharCount multiSelect required={false} />
        </div>
    );
}