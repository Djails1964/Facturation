import React from 'react';
import SimpleDateInputField from '../../../context/SimpleDateInputField';

const TarifFormDataSection = ({ 
    tarif,
    onInputChange,
    onOpenDateModal,
    services,
    serviceUnites,
    typesTarifs,
    isReadOnly,
    validationErrors
}) => {
    return (
        <div className="tarif-form-section">
            <h3>Informations du tarif</h3>
            
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
                    <option value="">Sélectionner un service</option>
                    {services.map(service => (
                        <option key={service.idService} value={service.idService}>
                            {service.nomService}
                        </option>
                    ))}
                </select>
                <label htmlFor="tarif-service" className="required">Service</label>
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
                    <option value="">Sélectionner une unité</option>
                    {tarif.idService && serviceUnites[tarif.idService]?.map(unite => (
                        <option key={unite.idUnite} value={unite.idUnite}>
                            {unite.nomUnite}
                        </option>
                    ))}
                </select>
                <label htmlFor="tarif-unite" className="required">UnitÃ©</label>
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
                    <option value="">Sélectionner un type de tarif</option>
                    {typesTarifs.map(typeTarif => (
                        <option key={typeTarif.idTypeTarif} value={typeTarif.idTypeTarif}>
                            {typeTarif.nomTypeTarif}
                        </option>
                    ))}
                </select>
                <label htmlFor="tarif-type" className="required">Type de tarif</label>
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
                <label htmlFor="tarif-prix" className="required">Prix (CHF)</label>
                {validationErrors.prixTypeTarif && (
                    <span className="error-message">{validationErrors.prixTypeTarif}</span>
                )}
            </div>

            {/* Date début */}
            <SimpleDateInputField
                id="tarif-date-debut"
                label="Date de début"
                value={tarif.dateDebutTarifStandard || ''}
                onChange={(e) => onInputChange({ target: { name: 'date_debut', value: e.target.value } })}
                required={true}
                readOnly={isReadOnly}
                errorMessage={validationErrors.dateDebutTarifStandard}
            />

            {/* Date fin */}
            <SimpleDateInputField
                id="tarif-date-fin"
                label="Date de fin (optionnel)"
                value={tarif.dateFinTarifStandard || ''}
                onChange={(e) => onInputChange({ target: { name: 'date_fin', value: e.target.value } })}
                required={false}
                readOnly={isReadOnly}
                errorMessage={validationErrors.dateFinTarifStandard}
            />
            
            {validationErrors.general && (
                <div className="notification error">
                    {validationErrors.general}
                </div>
            )}
        </div>
    );
};

export default TarifFormDataSection;