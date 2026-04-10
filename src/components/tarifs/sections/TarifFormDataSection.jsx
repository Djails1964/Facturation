import React from 'react';
import DateInputField from '../../shared/DateInputField';
import { formatDate } from '../../../utils/formatters';
import { toIsoString, fromDisplayString, fromIsoString } from '../../../utils/dateHelpers';
import { LABELS, VALIDATION_MESSAGES } from '../../../constants/tarifConstants';

// Convertit DD.MM.YYYY ou YYYY-MM-DD → ISO YYYY-MM-DD pour le state
const toIso = (displayVal) => {
    if (!displayVal) return '';
    const d = fromDisplayString(displayVal) || fromIsoString(displayVal);
    return d ? toIsoString(d) : displayVal;
};

const TarifFormDataSection = ({
    tarif,
    onInputChange,
    services,
    serviceUnites,
    typesTarifs,
    isReadOnly,
    validationErrors
}) => {
    return (
        <div className="tarif-form-section">
            <h3>{LABELS.SECTION_TARIF}</h3>

            {/* Service */}
            <div className="input-group">
                <select
                    id="tarif-service"
                    name="idService"
                    value={tarif.idService || ""}
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
                <label htmlFor="tarif-service" className="required">{LABELS.SERVICE}</label>
                {validationErrors.idService && (
                    <span className="error-message">{validationErrors.idService}</span>
                )}
            </div>

            {/* Unité */}
            <div className="input-group">
                <select
                    id="tarif-unite"
                    name="idUnite"
                    value={tarif.idUnite || ""}
                    onChange={onInputChange}
                    required
                    disabled={isReadOnly || !tarif.idService}
                    className={validationErrors.idUnite ? 'error' : ''}
                >
                    <option value="">{LABELS.SELECT_UNITE}</option>
                    {tarif.idService && serviceUnites[tarif.idService]?.map(unite => (
                        <option key={unite.idUnite} value={unite.idUnite}>
                            {unite.nomUnite}
                        </option>
                    ))}
                </select>
                <label htmlFor="tarif-unite" className="required">{LABELS.UNITE}</label>
                {validationErrors.idUnite && (
                    <span className="error-message">{validationErrors.idUnite}</span>
                )}
            </div>

            {/* Type de tarif */}
            <div className="input-group">
                <select
                    id="tarif-type"
                    name="typeTarifId"
                    value={tarif.typeTarifId || ""}
                    onChange={onInputChange}
                    required
                    disabled={isReadOnly}
                    className={validationErrors.typeTarifId ? 'error' : ''}
                >
                    <option value="">{LABELS.SELECT_TYPE_TARIF}</option>
                    {typesTarifs.map(typeTarif => (
                        <option key={typeTarif.idTypeTarif} value={typeTarif.idTypeTarif}>
                            {typeTarif.nomTypeTarif}
                        </option>
                    ))}
                </select>
                <label htmlFor="tarif-type" className="required">{LABELS.TYPE_TARIF}</label>
                {validationErrors.idTypeTarif && (
                    <span className="error-message">{validationErrors.idTypeTarif}</span>
                )}
            </div>

            {/* Prix */}
            <div className="input-group">
                <input
                    type="number"
                    id="tarif-prix"
                    name="prix"
                    value={tarif.prixTypeTarif}
                    onChange={onInputChange}
                    required
                    min="0"
                    step="0.01"
                    placeholder=" "
                    disabled={isReadOnly}
                    className={validationErrors.prixTypeTarif ? 'error' : ''}
                />
                <label htmlFor="tarif-prix" className="required">{LABELS.PRIX}</label>
                {validationErrors.prixTypeTarif && (
                    <span className="error-message">{validationErrors.prixTypeTarif}</span>
                )}
            </div>

            {/* Date début */}
            <DateInputField
                id="tarif-date-debut"
                label={LABELS.DATE_DEBUT}
                value={formatDate(tarif.dateDebutTarifStandard || '', 'date')}
                onChange={(displayVal) =>
                    onInputChange({ target: { name: 'date_debut', value: toIso(displayVal) } })
                }
                multiSelect={false}
                allowFuture={true}
                required={true}
                readOnly={isReadOnly}
                className={validationErrors.dateDebutTarifStandard ? 'error' : ''}
            />
            {validationErrors.dateDebutTarifStandard && (
                <span className="error-message">{validationErrors.dateDebutTarifStandard}</span>
            )}

            {/* Date fin */}
            <DateInputField
                id="tarif-date-fin"
                label={LABELS.DATE_FIN}
                value={formatDate(tarif.dateFinTarifStandard || '', 'date')}
                onChange={(displayVal) =>
                    onInputChange({ target: { name: 'date_fin', value: toIso(displayVal) } })
                }
                multiSelect={false}
                allowFuture={true}
                required={false}
                readOnly={isReadOnly}
                className={validationErrors.dateFinTarifStandard ? 'error' : ''}
            />
            {validationErrors.dateFinTarifStandard && (
                <span className="error-message">{validationErrors.dateFinTarifStandard}</span>
            )}

            {validationErrors.general && (
                <div className="notification error">
                    {validationErrors.general}
                </div>
            )}
        </div>
    );
};

export default TarifFormDataSection;