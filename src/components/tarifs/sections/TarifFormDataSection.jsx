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
                        <option key={typeTarif.id} value={typeTarif.id}>
                            {typeTarif.nom}
                        </option>
                    ))}
                </select>
                <label htmlFor="tarif-type" className="required">Type de tarif</label>
                {validationErrors.typeTarifId && (
                    <span className="error-message">{validationErrors.typeTarifId}</span>
                )}
            </div>

            {/* Prix */}
            <div className="input-group">
                <input
                    type="number"
                    id="tarif-prix"
                    name="prix"
                    value={tarif.prix}
                    onChange={onInputChange}
                    required
                    min="0"
                    step="0.01"
                    placeholder=" "
                    disabled={isReadOnly}
                    className={validationErrors.prix ? 'error' : ''}
                />
                <label htmlFor="tarif-prix" className="required">Prix (CHF)</label>
                {validationErrors.prix && (
                    <span className="error-message">{validationErrors.prix}</span>
                )}
            </div>

            {/* Date début */}
            <div className="input-group date-input">
                <input
                    type="date"
                    id="tarif-date-debut"
                    name="date_debut"
                    value={tarif.date_debut}
                    onChange={onInputChange}
                    required
                    disabled={isReadOnly}
                    className={validationErrors.date_debut ? 'error' : ''}
                />
                {!isReadOnly && (
                    <CalendarIcon 
                        onClick={() => onOpenDateModal('date_debut')}
                        disabled={false}
                    />
                )}
                <label htmlFor="tarif-date-debut" className="required">Date de début</label>
                {validationErrors.date_debut && (
                    <span className="error-message">{validationErrors.date_debut}</span>
                )}
            </div>

            {/* Date fin */}
            <div className="input-group date-input">
                <input
                    type="date"
                    id="tarif-date-fin"
                    name="date_fin"
                    value={tarif.date_fin || ''}
                    onChange={onInputChange}
                    disabled={isReadOnly}
                    className={validationErrors.date_fin ? 'error' : ''}
                />
                {!isReadOnly && (
                    <CalendarIcon 
                        onClick={() => onOpenDateModal('date_fin')}
                        disabled={false}
                    />
                )}
                <label htmlFor="tarif-date-fin">Date de fin (optionnel)</label>
                {validationErrors.date_fin && (
                    <span className="error-message">{validationErrors.date_fin}</span>
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