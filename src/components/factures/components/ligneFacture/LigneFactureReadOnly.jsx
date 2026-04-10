// src/components/factures/components/ligneFacture/LigneFactureReadOnly.jsx
import React from 'react';
import { formatMontant } from '../../../../utils/formatters';

function ReadOnlyField({ label, value, className = "" }) {
    let displayValue = value;
    if (label === "Prix unitaire" || label === "Total") {
        if (typeof value === 'number') {
            displayValue = `${formatMontant(value)} CHF`;
        } else if (typeof value === 'string' && value.includes('CHF') && !value.includes(' CHF')) {
            displayValue = value.replace('CHF', ' CHF');
        }
    }
    return (
        <div className="fdf_readonly-field">
            <label>{label}</label>
            <div className={`fdf_field-value ${className ? 'fdf_' + className : ''}`}>
                {displayValue}
            </div>
        </div>
    );
}

export function ReadOnlyFields({ ligne, serviceNom, uniteNom }) {
    return (
        <>
            <div className="fdf_table-row fdf_equal-columns">
                <div className="fdf_table-cell fdf_service-col">
                    <ReadOnlyField label="Type de service" value={serviceNom} />
                </div>
                <div className="fdf_table-cell fdf_unite-col">
                    <ReadOnlyField label="Unité" value={uniteNom} />
                </div>
            </div>
            <div className="fdf_table-row fdf_description-row">
                <div className="fdf_table-cell fdf_description-col fdf_full-width">
                    <ReadOnlyField label="Description" value={ligne.description} />
                </div>
            </div>
            {ligne.descriptionDates && (
                <div className="fdf_table-row fdf_description-row">
                    <div className="fdf_table-cell fdf_description-col fdf_full-width">
                        <ReadOnlyField label="Dates" value={ligne.descriptionDates} />
                    </div>
                </div>
            )}
            <div className="fdf_table-row fdf_numeric-row">
                {ligne.permetMultiplicateur ? (
                    <>
                        <div className="fdf_table-cell fdf_quantity-col">
                            <ReadOnlyField label="Durée (hh:mm)" value={ligne.duree || '—'} className="text-right" />
                        </div>
                        <div className="fdf_table-cell fdf_quantity-col">
                            <ReadOnlyField label="Nb séances" value={ligne.nbSeances != null ? ligne.nbSeances : '—'} className="text-right" />
                        </div>
                    </>
                ) : (
                    <div className="fdf_table-cell fdf_quantity-col">
                        <ReadOnlyField label="Quantité" value={ligne.quantite} className="text-right" />
                    </div>
                )}
                <div className="fdf_table-cell fdf_price-col">
                    <ReadOnlyField label="Prix unitaire" value={formatMontant(ligne.prixUnitaire)} className="text-right" />
                </div>
                <div className="fdf_table-cell fdf_total-col">
                    <ReadOnlyField label="Total" value={formatMontant(ligne.totalLigne)} className="text-right" />
                </div>
            </div>
        </>
    );
}