// src/components/factures/components/ligneFacture/LigneFactureInputs.jsx
import React from 'react';
import { formatMontant } from '../../../../utils/formatters';
import { parseDureeHHMM, formatDureeDecimale, validateDureeHHMM } from '../../../../utils/dateHelpers';
import { ValidationError } from '../../../shared/forms/FormField';

export function NbSeancesDisplay({ ligne, index, focusedFields, onModify, onFocus, onBlur }) {
    const nbSeances = ligne.nbSeances !== '' && ligne.nbSeances != null ? ligne.nbSeances : '';
    const hasValue  = nbSeances !== '';
    return (
        <div className={`fdf_floating-label-input ${focusedFields[`nbSeances-${index}`] ? 'fdf_focused' : ''} ${hasValue ? 'has-value' : ''}`}>
            <input type="number" id={`nbseances-${index}`} value={nbSeances}
                onChange={(e) => onModify(index, 'nbSeances', e.target.value === '' ? '' : parseFloat(e.target.value))}
                onFocus={() => onFocus(index, 'nbSeances')}
                onBlur={() => onBlur(index, 'nbSeances', nbSeances)}
                min="0" step="1" className="fdf_form-control fdf_text-right" placeholder=" "
                title="Nombre de séances (alimenté par les dates ou saisie manuelle)" />
            <label htmlFor={`nbseances-${index}`}>Nb séances</label>
        </div>
    );
}

export function DureeInput({ ligne, index, focusedFields, onModify, onFocus, onBlur }) {
    const duree         = ligne.duree || '';
    const nbSeances     = parseFloat(ligne.nbSeances) || 0;
    const multiplicateur = parseDureeHHMM(duree);
    const dureeErreur   = duree ? validateDureeHHMM(duree) : '';
    const hasValue      = duree !== '';
    let resumeCalc = '';
    if (nbSeances > 0 && multiplicateur !== null) {
        const qteReelle = Math.round(nbSeances * multiplicateur * 10000) / 10000;
        resumeCalc = `${nbSeances} × ${duree} = ${formatDureeDecimale(qteReelle)}`;
    }
    return (
        <div>
            <div className={`fdf_floating-label-input ${focusedFields[`duree-${index}`] ? 'fdf_focused' : ''} ${hasValue ? 'has-value' : ''}`}>
                <input type="text" id={`duree-${index}`} value={duree}
                    onChange={(e) => onModify(index, 'duree', e.target.value)}
                    onFocus={() => onFocus(index, 'duree')}
                    onBlur={() => onBlur(index, 'duree', duree)}
                    placeholder=" "
                    className={`fdf_form-control fdf_text-right ${dureeErreur ? 'fdf_error' : ''}`}
                    title="Format hh:mm — ex: 1:15, 2:30, 0:45" />
                <label htmlFor={`duree-${index}`}>Durée (hh:mm) <span className="fdf_required">*</span></label>
                {dureeErreur && <ValidationError message={dureeErreur} />}
            </div>
            {resumeCalc && (
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textAlign: 'right', marginTop: '2px' }}>
                    {resumeCalc}
                </div>
            )}
        </div>
    );
}

export function QuantiteInput({ ligne, index, focusedFields, validationErrors, onModify, onFocus, onBlur, getErrorClass }) {
    const errorClass = getErrorClass('quantite');
    const hasValue   = ligne.quantite !== undefined && ligne.quantite !== '';
    return (
        <div className={`fdf_floating-label-input ${focusedFields[`quantite-${index}`] ? 'fdf_focused' : ''} ${hasValue ? 'has-value' : ''}`}>
            <input type="number" id={`quantite-${index}`} value={ligne.quantite}
                onChange={(e) => onModify(index, 'quantite', e.target.value === '' ? '' : parseFloat(e.target.value))}
                onFocus={() => onFocus(index, 'quantite')}
                onBlur={() => onBlur(index, 'quantite', ligne.quantite)}
                min="0" step="0.01"
                className={`fdf_form-control fdf_text-right ${errorClass}`}
                placeholder=" " required />
            <label htmlFor={`quantite-${index}`}>Quantité <span className="fdf_required">*</span></label>
            <ValidationError message={validationErrors[index]?.quantite} />
        </div>
    );
}

export function PrixUnitaireInput({ ligne, index, focusedFields, validationErrors, prixModifiesManuel, onModify, onFocus, onBlur, getErrorClass }) {
    const isPriceModified = prixModifiesManuel.current[index];
    const errorClass      = getErrorClass('prixUnitaire');
    const hasValue        = ligne.prixUnitaire !== undefined && ligne.prixUnitaire !== '';
    return (
        <div className={`fdf_floating-label-input ${focusedFields[`prixUnitaire-${index}`] ? 'fdf_focused' : ''} ${isPriceModified ? 'fdf_price-modified' : ''} ${hasValue ? 'has-value' : ''}`}>
            <input type="number" id={`prixUnitaire-${index}`} value={ligne.prixUnitaire}
                onChange={(e) => onModify(index, 'prixUnitaire', e.target.value === '' ? '' : parseFloat(e.target.value))}
                onFocus={() => onFocus(index, 'prixUnitaire')}
                onBlur={() => onBlur(index, 'prixUnitaire', ligne.prixUnitaire)}
                min="0" step="0.01"
                className={`fdf_form-control fdf_text-right ${errorClass}`}
                placeholder=" " required />
            <label htmlFor={`prixUnitaire-${index}`}>Prix unitaire <span className="fdf_required">*</span></label>
            <span className="fdf_currency-suffix">CHF</span>
            <ValidationError message={validationErrors[index]?.prixUnitaire} />
        </div>
    );
}

export function TotalInput({ ligne, index, focusedFields, onFocus, onBlur }) {
    const hasValue = ligne.totalLigne !== undefined && ligne.totalLigne !== '' && ligne.totalLigne !== 0;
    return (
        <div className={`fdf_floating-label-input ${focusedFields[`total-${index}`] ? 'fdf_focused' : 'fdf_filled'} ${hasValue ? 'has-value' : ''}`}>
            <input type="text" id={`total-${index}`}
                value={`${formatMontant(ligne.totalLigne)} CHF`}
                readOnly
                onFocus={() => onFocus(index, 'total')}
                onBlur={() => onBlur(index, 'total', ligne.totalLigne)}
                className="fdf_form-control fdf_text-right" placeholder=" " />
            <label htmlFor={`total-${index}`}>Total</label>
        </div>
    );
}