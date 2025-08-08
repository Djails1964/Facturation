import React from 'react';
import { FiClipboard } from 'react-icons/fi';
import DateInputField from '../../shared/DateInputField';
import { formatMontant } from '../../../utils/formatters';

// CORRECTION : Import correct depuis FactureUIComponents
import { ReadOnlyField } from '../../shared/FactureUIComponents';

/**
 * Composant pour les champs de saisie d'une ligne de facture
 * VERSION CORRIGÉE avec les bons imports
 */
function LigneFactureFields({
    ligne,
    index,
    services,
    unites,
    unitesByService,
    focusedFields,
    validationErrors,
    prixModifiesManuel,
    readOnly,
    serviceNom,
    uniteNom,
    onModify,
    onInsertUniteName,
    onFocus,
    onBlur,
    getErrorClass
}) {
    if (readOnly) {
        return (
            <ReadOnlyFields
                ligne={ligne}
                serviceNom={serviceNom}
                uniteNom={uniteNom}
            />
        );
    }

    return (
        <EditableFields
            ligne={ligne}
            index={index}
            services={services}
            unites={unites}
            unitesByService={unitesByService}
            focusedFields={focusedFields}
            validationErrors={validationErrors}
            prixModifiesManuel={prixModifiesManuel}
            onModify={onModify}
            onInsertUniteName={onInsertUniteName}
            onFocus={onFocus}
            onBlur={onBlur}
            getErrorClass={getErrorClass}
        />
    );
}

/**
 * Champs en mode lecture seule
 */
function ReadOnlyFields({ ligne, serviceNom, uniteNom }) {
    return (
        <>
            {/* Première ligne - Service et Unité */}
            <div className="fdf_table-row fdf_equal-columns">
                <div className="fdf_table-cell fdf_service-col">
                    <ReadOnlyField label="Type de service" value={serviceNom} />
                </div>
                <div className="fdf_table-cell fdf_unite-col">
                    <ReadOnlyField label="Unité" value={uniteNom} />
                </div>
            </div>
            
            {/* Deuxième ligne - Description */}
            <div className="fdf_table-row fdf_description-row">
                <div className="fdf_table-cell fdf_description-col fdf_full-width">
                    <ReadOnlyField label="Description" value={ligne.description} />
                </div>
            </div>
            
            {/* Troisième ligne - Dates (si présent) */}
            {ligne.descriptionDates && (
                <div className="fdf_table-row fdf_description-row">
                    <div className="fdf_table-cell fdf_description-col fdf_full-width">
                        <ReadOnlyField label="Dates" value={ligne.descriptionDates} />
                    </div>
                </div>
            )}
            
            {/* Quatrième ligne - Quantité, Prix, Total */}
            <div className="fdf_table-row fdf_numeric-row">
                <div className="fdf_table-cell fdf_quantity-col">
                    <ReadOnlyField label="Quantité" value={ligne.quantite} className="text-right" />
                </div>
                <div className="fdf_table-cell fdf_price-col">
                    <ReadOnlyField label="Prix unitaire" value={formatMontant(ligne.prixUnitaire)} className="text-right" />
                </div>
                <div className="fdf_table-cell fdf_total-col">
                    <ReadOnlyField label="Total" value={formatMontant(ligne.total)} className="text-right" />
                </div>
            </div>
        </>
    );
}

/**
 * Champs en mode édition
 */
function EditableFields({
    ligne,
    index,
    services,
    unites,
    unitesByService,
    focusedFields,
    validationErrors,
    prixModifiesManuel,
    onModify,
    onInsertUniteName,
    onFocus,
    onBlur,
    getErrorClass
}) {
    return (
        <>
            {/* Première ligne - Service et Unité */}
            <div className="fdf_table-row fdf_equal-columns">
                <div className="fdf_table-cell fdf_service-col">
                    <ServiceTypeSelect
                        ligne={ligne}
                        index={index}
                        services={services}
                        focusedFields={focusedFields}
                        validationErrors={validationErrors}
                        onModify={onModify}
                        onFocus={onFocus}
                        onBlur={onBlur}
                        getErrorClass={getErrorClass}
                    />
                </div>
                
                <div className="fdf_table-cell fdf_unite-col">
                    <UniteSelect
                        ligne={ligne}
                        index={index}
                        unites={unites}
                        unitesByService={unitesByService}
                        focusedFields={focusedFields}
                        validationErrors={validationErrors}
                        onModify={onModify}
                        onFocus={onFocus}
                        onBlur={onBlur}
                        getErrorClass={getErrorClass}
                    />
                </div>
            </div>
            
            {/* Deuxième ligne - Description avec dates */}
            <div className="fdf_table-row fdf_description-row">
                <div className="fdf_table-cell fdf_description-col fdf_full-width">
                    <DescriptionInputGroup
                        ligne={ligne}
                        index={index}
                        focusedFields={focusedFields}
                        validationErrors={validationErrors}
                        onModify={onModify}
                        onInsertUniteName={onInsertUniteName}
                        onFocus={onFocus}
                        onBlur={onBlur}
                        getErrorClass={getErrorClass}
                    />
                </div>
            </div>
            
            {/* Troisième ligne - Quantité, Prix, Total */}
            <div className="fdf_table-row fdf_numeric-row">
                <div className="fdf_table-cell fdf_quantity-col">
                    <QuantiteInput
                        ligne={ligne}
                        index={index}
                        focusedFields={focusedFields}
                        validationErrors={validationErrors}
                        onModify={onModify}
                        onFocus={onFocus}
                        onBlur={onBlur}
                        getErrorClass={getErrorClass}
                    />
                </div>
                
                <div className="fdf_table-cell fdf_price-col">
                    <PrixUnitaireInput
                        ligne={ligne}
                        index={index}
                        focusedFields={focusedFields}
                        validationErrors={validationErrors}
                        prixModifiesManuel={prixModifiesManuel}
                        onModify={onModify}
                        onFocus={onFocus}
                        onBlur={onBlur}
                        getErrorClass={getErrorClass}
                    />
                </div>
                
                <div className="fdf_table-cell fdf_total-col">
                    <TotalInput
                        ligne={ligne}
                        index={index}
                        focusedFields={focusedFields}
                        onFocus={onFocus}
                        onBlur={onBlur}
                    />
                </div>
            </div>
        </>
    );
}

/**
 * Sélecteur de type de service
 */
function ServiceTypeSelect({
    ligne,
    index,
    services,
    focusedFields,
    validationErrors,
    onModify,
    onFocus,
    onBlur,
    getErrorClass
}) {
    const errorClass = getErrorClass('serviceType');
    const hasValue = ligne.serviceType !== undefined && ligne.serviceType !== '';
    
    return (
        <div className={`fdf_floating-label-input ${focusedFields[`serviceType-${index}`] ? 'fdf_focused' : ''} ${hasValue ? 'has-value' : ''}`}>
            <select 
                id={`serviceType-${index}`}
                value={ligne.serviceType || ''}
                onChange={(e) => onModify(index, 'serviceType', e.target.value)}
                onFocus={() => onFocus(index, 'serviceType')}
                onBlur={() => onBlur(index, 'serviceType', ligne.serviceType)}
                className={`fdf_form-control ${errorClass}`}
                required
            >
                <option value="">Sélectionner un service</option>
                {services
                    .filter(service => service && service.id && service.code && service.nom)
                    .map(service => (
                        <option 
                            key={`service-${service.id}`} 
                            value={service.code}
                        >
                            {service.nom}
                        </option>
                    ))
                }
            </select>
            <label htmlFor={`serviceType-${index}`}>
                Type de service <span className="fdf_required">*</span>
            </label>
            {validationErrors[index]?.serviceType && (
                <div className="fdf_error-message">
                    {validationErrors[index].serviceType}
                </div>
            )}
        </div>
    );
}

/**
 * Sélecteur d'unité
 */
function UniteSelect({
    ligne,
    index,
    unites,
    unitesByService,
    focusedFields,
    validationErrors,
    onModify,
    onFocus,
    onBlur,
    getErrorClass
}) {
    const errorClass = getErrorClass('unite');
    const hasValue = ligne.unite !== undefined && ligne.unite !== '';
    
    return (
        <div className={`fdf_floating-label-input ${focusedFields[`unite-${index}`] ? 'fdf_focused' : ''} ${hasValue ? 'has-value' : ''}`}>
            <select
                id={`unite-${index}`}
                value={ligne.unite || ''}
                onChange={(e) => onModify(index, 'unite', e.target.value)}
                onFocus={() => onFocus(index, 'unite')}
                onBlur={() => onBlur(index, 'unite', ligne.unite)}
                disabled={!ligne.serviceType}
                className={`fdf_form-control ${errorClass}`}
                required
            >
                <option key="default" value="">Sélectionnez une unité</option>
                {getUniteOptions(ligne, unites, unitesByService)}
            </select>
            <label htmlFor={`unite-${index}`}>
                Unité <span className="fdf_required">*</span>
            </label>
            {validationErrors[index]?.unite && (
                <div className="fdf_error-message">
                    {validationErrors[index].unite}
                </div>
            )}
        </div>
    );
}

/**
 * Groupe description avec champ dates intégré
 */
function DescriptionInputGroup({
    ligne,
    index,
    focusedFields,
    validationErrors,
    onModify,
    onInsertUniteName,
    onFocus,
    onBlur,
    getErrorClass
}) {
    const errorClass = getErrorClass('description');
    const hasDescriptionValue = ligne.description !== undefined && ligne.description !== '';
    const isClipboardDisabled = !ligne.unite;
    const charactersUsed = (ligne.description || '').length;
    const charactersRemaining = 200 - charactersUsed;
    
    return (
        <div className="fdf_description-group">
            {/* Description principale */}
            <div className={`fdf_floating-label-input ${focusedFields[`description-${index}`] ? 'fdf_focused' : ''} ${hasDescriptionValue ? 'has-value' : ''}`}>
                <input
                    type="text"
                    id={`description-${index}`}
                    value={ligne.description || ''}
                    onChange={(e) => {
                        const newValue = e.target.value.slice(0, 200);
                        onModify(index, 'description', newValue);
                    }}
                    onFocus={() => onFocus(index, 'description')}
                    onBlur={() => onBlur(index, 'description', ligne.description)}
                    className={`fdf_form-control ${errorClass}`}
                    placeholder=" "
                    maxLength="200"
                    required
                />
                <label htmlFor={`description-${index}`}>
                    Description <span className="fdf_required">*</span>
                </label>
                
                {/* Icône Clipboard */}
                <FiClipboard
                    className={`fdf_clipboard-icon ${isClipboardDisabled ? 'fdf_icon-disabled' : ''}`}
                    onClick={() => !isClipboardDisabled && onInsertUniteName()}
                    title={isClipboardDisabled ? "Veuillez d'abord sélectionner une unité" : "Copier le nom de l'unité en début de description"}
                />
                
                {validationErrors[index]?.description && (
                    <div className="fdf_error-message">
                        {validationErrors[index].description}
                    </div>
                )}
                
                {/* Compteur de caractères */}
                <div className="fdf_char-limit-info" style={{
                    position: 'absolute',
                    right: '0',
                    bottom: validationErrors[index]?.description ? '-40px' : '-20px',
                    fontSize: '0.75rem',
                    color: charactersRemaining < 20 ? '#d32f2f' : '#666'
                }}>
                    {charactersRemaining} caractère{charactersRemaining !== 1 ? 's' : ''} restant{charactersRemaining !== 1 ? 's' : ''}
                </div>
            </div>
            
            {/* Champ dates */}
            <DateInputField
                id={`descriptionDates-${index}`}
                label="Dates"
                value={ligne.descriptionDates || ''}
                onChange={(valueOrEvent) => {
                    if (typeof valueOrEvent === 'string') {
                        onModify(index, 'descriptionDates', valueOrEvent);
                    } else if (valueOrEvent && valueOrEvent.target) {
                        onModify(index, 'descriptionDates', valueOrEvent.target.value);
                    }
                }}
                updateQuantity={(formattedDates, count) => {
                    onModify(index, 'descriptionDates', formattedDates);
                    onModify(index, 'quantite', count);
                    onFocus(index, 'descriptionDates');
                    
                    setTimeout(() => {
                        const quantiteInput = document.getElementById(`quantite-${index}`);
                        if (quantiteInput && quantiteInput.parentElement) {
                            quantiteInput.parentElement.classList.add('has-value');
                        }
                    }, 10);
                }}
                readOnly={false}
                maxLength={100}
                showCharCount={true}
                multiSelect={true}
                required={false}
            />
        </div>
    );
}

/**
 * Champ quantité
 */
function QuantiteInput({
    ligne,
    index,
    focusedFields,
    validationErrors,
    onModify,
    onFocus,
    onBlur,
    getErrorClass
}) {
    const errorClass = getErrorClass('quantite');
    const hasValue = ligne.quantite !== undefined && ligne.quantite !== '';
    
    return (
        <div className={`fdf_floating-label-input ${focusedFields[`quantite-${index}`] ? 'fdf_focused' : ''} ${hasValue ? 'has-value' : ''}`}>
            <input
                type="number"
                id={`quantite-${index}`}
                value={ligne.quantite}
                onChange={(e) => onModify(
                    index, 
                    'quantite', 
                    e.target.value === '' ? '' : parseFloat(e.target.value)
                )}
                onFocus={() => onFocus(index, 'quantite')}
                onBlur={() => onBlur(index, 'quantite', ligne.quantite)}
                min="0"
                step="0.01"
                className={`fdf_form-control fdf_text-right ${errorClass}`}
                placeholder=" "
                required
            />
            <label htmlFor={`quantite-${index}`}>
                Quantité <span className="fdf_required">*</span>
            </label>
            {validationErrors[index]?.quantite && (
                <div className="fdf_error-message">
                    {validationErrors[index].quantite}
                </div>
            )}
        </div>
    );
}

/**
 * Champ prix unitaire
 */
function PrixUnitaireInput({
    ligne,
    index,
    focusedFields,
    validationErrors,
    prixModifiesManuel,
    onModify,
    onFocus,
    onBlur,
    getErrorClass
}) {
    const isPriceModified = prixModifiesManuel.current[index];
    const errorClass = getErrorClass('prixUnitaire');
    const hasValue = ligne.prixUnitaire !== undefined && ligne.prixUnitaire !== '';
    
    return (
        <div className={`fdf_floating-label-input ${focusedFields[`prixUnitaire-${index}`] ? 'fdf_focused' : ''} ${isPriceModified ? 'fdf_price-modified' : ''} ${hasValue ? 'has-value' : ''}`}>
            <input
                type="number"
                id={`prixUnitaire-${index}`}
                value={ligne.prixUnitaire}
                onChange={(e) => {
                    const newPrice = e.target.value === '' ? '' : parseFloat(e.target.value);
                    onModify(index, 'prixUnitaire', newPrice);
                }}
                onFocus={() => onFocus(index, 'prixUnitaire')}
                onBlur={() => onBlur(index, 'prixUnitaire', ligne.prixUnitaire)}
                min="0"
                step="0.01"
                className={`fdf_form-control fdf_text-right ${errorClass}`}
                placeholder=" "
                required
            />
            <label htmlFor={`prixUnitaire-${index}`}>
                Prix unitaire <span className="fdf_required">*</span>
            </label>
            <span className="fdf_currency-suffix">CHF</span>
            {validationErrors[index]?.prixUnitaire && (
                <div className="fdf_error-message">
                    {validationErrors[index].prixUnitaire}
                </div>
            )}
        </div>
    );
}

/**
 * Champ total (lecture seule)
 */
function TotalInput({ ligne, index, focusedFields, onFocus, onBlur }) {
    const hasValue = ligne.total !== undefined && ligne.total !== '' && ligne.total !== 0;
    
    return (
        <div className={`fdf_floating-label-input ${focusedFields[`total-${index}`] ? 'fdf_focused' : 'fdf_filled'} ${hasValue ? 'has-value' : ''}`}>
            <input
                type="text"
                id={`total-${index}`}
                value={`${formatMontant(ligne.total)} CHF`}
                readOnly
                onFocus={() => onFocus(index, 'total')}
                onBlur={() => onBlur(index, 'total', ligne.total)}
                className="fdf_form-control fdf_text-right"
                placeholder=" "
            />
            <label htmlFor={`total-${index}`}>Total</label>
        </div>
    );
}

// Utilitaires
function getUniteOptions(ligne, unites, unitesByService) {
    if (!ligne || !ligne.serviceType) {
        return getFallbackOptions();
    }
    
    // Vérifier si nous avons des unités pré-mappées
    if (unitesByService && unitesByService[ligne.serviceType] && unitesByService[ligne.serviceType].length > 0) {
        const options = unitesByService[ligne.serviceType].map(unite => {
            if (typeof unite === 'string') {
                const uniteObj = unites.find(u => u && u.code === unite);
                return (
                    <option key={`unite-${unite}`} value={unite}>
                        {uniteObj?.nom || unite}
                    </option>
                );
            } else if (typeof unite === 'object' && unite !== null) {
                return (
                    <option key={`unite-${unite.code || unite.id}`} value={unite.code || unite.id}>
                        {unite.nom || unite.code || unite.id}
                    </option>
                );
            }
            return null;
        }).filter(option => option !== null);
        
        if (options.length > 0) {
            return options;
        }
    }
    
    // Fallback pour service spécifique
    if (ligne.serviceType === 'LocationSalle') {
        return [
            <option key="heure" value="Heure">Heure</option>,
            <option key="demijour" value="DemiJour">Demi-journée</option>,
            <option key="jour" value="Jour">Journée</option>,
            <option key="soiree" value="Soiree">Soirée</option>,
            <option key="weekend" value="Weekend">Weekend</option>
        ];
    }
    
    return getFallbackOptions();
}

function getFallbackOptions() {
    return [
        <option key="heure" value="Heure">Heure</option>,
        <option key="journee" value="Journee">Journée</option>,
        <option key="forfait" value="Forfait">Forfait</option>
    ];
}

export default LigneFactureFields;