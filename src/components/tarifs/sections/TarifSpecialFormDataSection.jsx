import React from 'react';
import DateInputField from '../../shared/DateInputField';
import { formatDate } from '../../../utils/formatters';
import { toIsoString, fromDisplayString, fromIsoString } from '../../../utils/dateHelpers';
import { LABELS, VALIDATION_MESSAGES } from '../../../constants/tarifConstants';

const toIso = (displayVal) => {
    if (!displayVal) return '';
    const d = fromDisplayString(displayVal) || fromIsoString(displayVal);
    return d ? toIsoString(d) : displayVal;
};

const TarifSpecialFormDataSection = ({
    tarifSpecial,
    onInputChange,
    clients,
    services,
    serviceUnites,
    isReadOnly,
    validationErrors
}) => {
    return (
        <div className="tarif-form-section">
            <h3>{LABELS.SECTION_TARIF_SPECIAL}</h3>

            {/* Client */}
            <div className="input-group">
                <select
                    id="tarif-special-client"
                    name="idClient"
                    value={tarifSpecial.idClient || ""}
                    onChange={onInputChange}
                    required
                    disabled={isReadOnly}
                    className={validationErrors.idClient ? 'error' : ''}
                >
                    <option value="">{LABELS.SELECT_CLIENT}</option>
                    {clients.map(client => (
                        <option key={client.id} value={client.id}>
                            {client.prenom} {client.nom}
                        </option>
                    ))}
                </select>
                <label htmlFor="tarif-special-client" className="required">Client</label>
                {validationErrors.idClient && (
                    <span className="error-message">{validationErrors.idClient}</span>
                )}
            </div>

            {/* Service */}
            <div className="input-group">
                <select
                    id="tarif-special-service"
                    name="idService"
                    value={tarifSpecial.idService || ""}
                    onChange={onInputChange}
                    required
                    disabled={isReadOnly}
                    className={validationErrors.idService ? 'error' : ''}
                >
                    <option value="">{LABELS.SELECT_SERVICE}</option>
                    {services.map(service => (
                        <option key={service.idService} value={service.idService}>
                            {service.nomService}
                        </option>
                    ))}
                </select>
                <label htmlFor="tarif-special-service" className="required">{LABELS.SERVICE}</label>
                {validationErrors.idService && (
                    <span className="error-message">{validationErrors.idService}</span>
                )}
            </div>

            {/* Unité */}
            <div className="input-group">
                <select
                    id="tarif-special-unite"
                    name="idUnite"
                    value={tarifSpecial.idUnite || ""}
                    onChange={onInputChange}
                    required
                    disabled={isReadOnly || !tarifSpecial.idService}
                    className={validationErrors.idUnite ? 'error' : ''}
                >
                    <option value="">{LABELS.SELECT_UNITE}</option>
                    {tarifSpecial.idService && serviceUnites[tarifSpecial.idService]?.map(unite => (
                        <option key={unite.idUnite} value={unite.idUnite}>
                            {unite.nomUnite}
                        </option>
                    ))}
                </select>
                <label htmlFor="tarif-special-unite" className="required">{LABELS.UNITE}</label>
                {validationErrors.idUnite && (
                    <span className="error-message">{validationErrors.idUnite}</span>
                )}
            </div>

            {/* Prix */}
            <div className="input-group">
                <input
                    type="number"
                    id="tarif-special-prix"
                    name="prix"
                    value={tarifSpecial.prix}
                    onChange={onInputChange}
                    required
                    min="0"
                    step="0.01"
                    placeholder=" "
                    disabled={isReadOnly}
                    className={validationErrors.prix ? 'error' : ''}
                />
                <label htmlFor="tarif-special-prix" className="required">{LABELS.PRIX}</label>
                {validationErrors.prix && (
                    <span className="error-message">{validationErrors.prix}</span>
                )}
            </div>

            {/* Date début */}
            <DateInputField
                id="tarif-special-date-debut"
                label={LABELS.DATE_DEBUT}
                value={formatDate(tarifSpecial.date_debut || '', 'date')}
                onChange={(displayVal) =>
                    onInputChange({ target: { name: 'date_debut', value: toIso(displayVal) } })
                }
                multiSelect={false}
                allowFuture={true}
                required={true}
                readOnly={isReadOnly}
                className={validationErrors.date_debut ? 'error' : ''}
            />
            {validationErrors.date_debut && (
                <span className="error-message">{validationErrors.date_debut}</span>
            )}

            {/* Date fin */}
            <DateInputField
                id="tarif-special-date-fin"
                label={LABELS.DATE_FIN}
                value={formatDate(tarifSpecial.date_fin || '', 'date')}
                onChange={(displayVal) =>
                    onInputChange({ target: { name: 'date_fin', value: toIso(displayVal) } })
                }
                multiSelect={false}
                allowFuture={true}
                required={false}
                readOnly={isReadOnly}
                className={validationErrors.date_fin ? 'error' : ''}
            />
            {validationErrors.date_fin && (
                <span className="error-message">{validationErrors.date_fin}</span>
            )}

            {/* Note */}
            <div className="input-group">
                <textarea
                    id="tarif-special-note"
                    name="note"
                    value={tarifSpecial.note || ''}
                    onChange={onInputChange}
                    placeholder=" "
                    rows="3"
                    required
                    disabled={isReadOnly}
                    className={validationErrors.note ? 'error' : ''}
                />
                <label htmlFor="tarif-special-note" className="required">{LABELS.NOTE}</label>
                {validationErrors.note && (
                    <span className="error-message">{validationErrors.note}</span>
                )}
            </div>

            {validationErrors.general && (
                <div className="notification error">
                    {validationErrors.general}
                </div>
            )}
        </div>
    );
};

export default TarifSpecialFormDataSection;