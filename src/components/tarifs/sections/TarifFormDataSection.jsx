import React from 'react';
import { CalendarIcon } from '../../../components/ui/buttons';

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
                    name="serviceId"
                    value={tarif.serviceId || ""}
                    onChange={onInputChange}
                    required
                    disabled={isReadOnly}
                    className={validationErrors.serviceId ? 'error' : ''}
                >
                    <option value="">Sélectionner un service</option>
                    {services.map(service => (
                        <option key={service.id} value={service.id}>
                            {service.nom}
                        </option>
                    ))}
                </select>
                <label htmlFor="tarif-service" className="required">Service</label>
                {validationErrors.serviceId && (
                    <span className="error-message">{validationErrors.serviceId}</span>
                )}
            </div>

            {/* Unité */}
            <div className="input-group">
                <select
                    id="tarif-unite"
                    name="uniteId"
                    value={tarif.uniteId || ""}
                    onChange={onInputChange}
                    required
                    disabled={isReadOnly || !tarif.serviceId}
                    className={validationErrors.uniteId ? 'error' : ''}
                >
                    <option value="">Sélectionner une unité</option>
                    {tarif.serviceId && serviceUnites[tarif.serviceId]?.map(unite => (
                        <option key={unite.id} value={unite.id}>
                            {unite.nom}
                        </option>
                    ))}
                </select>
                <label htmlFor="tarif-unite" className="required">Unité</label>
                {validationErrors.uniteId && (
                    <span className="error-message">{validationErrors.uniteId}</span>
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
            <div className="input-group date-input">
                <input
                    type="date"
                    id="tarif-date-debut"
                    name="date_debut"
                    value={tarif.dateDebutTarifStandard || ''}
                    onChange={onInputChange}
                    required
                    disabled={isReadOnly}
                    className={validationErrors.dateDebutTarifStandard ? 'error' : ''}
                />
                {!isReadOnly && (
                    <CalendarIcon 
                        onClick={() => onOpenDateModal('date_debut')}
                        disabled={false}
                    />
                )}
                <label htmlFor="tarif-date-debut" className="required">Date de début</label>
                {validationErrors.dateDebutTarifStandard && (
                    <span className="error-message">{validationErrors.dateDebutTarifStandard}</span>
                )}
            </div>

            {/* Date fin */}
            <div className="input-group date-input">
                <input
                    type="date"
                    id="tarif-date-fin"
                    name="date_fin"
                    value={tarif.dateFinTarifStandard || ''}
                    onChange={onInputChange}
                    disabled={isReadOnly}
                    className={validationErrors.dateFinTarifStandard ? 'error' : ''}
                />
                {!isReadOnly && (
                    <CalendarIcon 
                        onClick={() => onOpenDateModal('date_fin')}
                        disabled={false}
                    />
                )}
                <label htmlFor="tarif-date-fin">Date de fin (optionnel)</label>
                {validationErrors.dateFinTarifStandard && (
                    <span className="error-message">{validationErrors.dateFinTarifStandard}</span>
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

export default TarifFormDataSection;