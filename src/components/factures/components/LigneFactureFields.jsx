// src/components/factures/components/LigneFactureFields.jsx
import React from 'react';
import { EnrichedObjectHelpers } from './ligneFacture/ligneFactureHelpers';
import { ReadOnlyFields }        from './ligneFacture/LigneFactureReadOnly';
import { ServiceTypeSelect, UniteSelect, DescriptionInputGroup } from './ligneFacture/LigneFactureSelects';
import { DureeInput, NbSeancesDisplay, QuantiteInput, PrixUnitaireInput, TotalInput } from './ligneFacture/LigneFactureInputs';

/**
 * Composant principal pour les champs d'une ligne de facture.
 * Délègue à ReadOnlyFields (lecture) ou EditableFields (édition).
 */
function LigneFactureFields({
    ligne, index, services, unites, unitesByService,
    focusedFields, validationErrors, prixModifiesManuel,
    readOnly, serviceNom, uniteNom, client,
    onModify, onInsertUniteName, onFocus, onBlur, getErrorClass,
}) {
    const lignePreparee = EnrichedObjectHelpers.prepareForFormControls(ligne);

    if (readOnly) {
        return (
            <ReadOnlyFields
                ligne={lignePreparee}
                serviceNom={EnrichedObjectHelpers.getServiceDisplayName(ligne)}
                uniteNom={EnrichedObjectHelpers.getUniteDisplayName(ligne)}
            />
        );
    }

    return (
        <EditableFields
            ligne={lignePreparee}
            index={index}
            services={services}
            unites={unites}
            unitesByService={unitesByService}
            focusedFields={focusedFields}
            validationErrors={validationErrors}
            prixModifiesManuel={prixModifiesManuel}
            client={client}
            onModify={onModify}
            onInsertUniteName={onInsertUniteName}
            onFocus={onFocus}
            onBlur={onBlur}
            getErrorClass={getErrorClass}
        />
    );
}

function EditableFields({
    ligne, index, services, unites, unitesByService,
    focusedFields, validationErrors, prixModifiesManuel, client,
    onModify, onInsertUniteName, onFocus, onBlur, getErrorClass,
}) {
    const sharedProps = { ligne, index, focusedFields, validationErrors, onModify, onFocus, onBlur, getErrorClass };

    return (
        <>
            {/* Ligne 1 : Service + Unité */}
            <div className="fdf_table-row fdf_equal-columns">
                <div className="fdf_table-cell fdf_service-col">
                    <ServiceTypeSelect {...sharedProps} services={services} unites={unites} unitesByService={unitesByService} />
                </div>
                <div className="fdf_table-cell fdf_unite-col">
                    <UniteSelect {...sharedProps} unites={unites} unitesByService={unitesByService} client={client} />
                </div>
            </div>

            {/* Ligne 2 : Description + Dates */}
            <div className="fdf_table-row fdf_description-row">
                <div className="fdf_table-cell fdf_description-col fdf_full-width">
                    <DescriptionInputGroup {...sharedProps} onInsertUniteName={onInsertUniteName} />
                </div>
            </div>

            {/* Ligne 3 : Quantité/Durée, Prix, Total */}
            <div className="fdf_table-row fdf_numeric-row">
                {ligne.permetMultiplicateur ? (
                    <>
                        <div className="fdf_table-cell fdf_quantity-col">
                            <DureeInput ligne={ligne} index={index} focusedFields={focusedFields} onModify={onModify} onFocus={onFocus} onBlur={onBlur} />
                        </div>
                        <div className="fdf_table-cell fdf_quantity-col">
                            <NbSeancesDisplay ligne={ligne} index={index} focusedFields={focusedFields} onModify={onModify} onFocus={onFocus} onBlur={onBlur} />
                        </div>
                    </>
                ) : (
                    <div className="fdf_table-cell fdf_quantity-col">
                        <QuantiteInput {...sharedProps} />
                    </div>
                )}
                <div className="fdf_table-cell fdf_price-col">
                    <PrixUnitaireInput {...sharedProps} prixModifiesManuel={prixModifiesManuel} />
                </div>
                <div className="fdf_table-cell fdf_total-col">
                    <TotalInput ligne={ligne} index={index} focusedFields={focusedFields} onFocus={onFocus} onBlur={onBlur} />
                </div>
            </div>
        </>
    );
}

export default LigneFactureFields;