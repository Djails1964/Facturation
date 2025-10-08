import React from 'react';
import { FiCalendar } from 'react-icons/fi';

const TarifSpecialFormDataSection = ({ 
    tarifSpecial,
    onInputChange,
    onOpenDateModal,
    clients,
    services,
    serviceUnites,
    isReadOnly,
    validationErrors
}) => {
    return (
        <div className="tarif-form-section">
            <h3>Informations du tarif spécial</h3>
            
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
                    <option value="">Sélectionner un client</option>
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
                    <option value="">Sélectionner un service</option>
                    {services.map(service => (
                        <option key={service.idService} value={service.idService}>
                            {service.nomService}
                        </option>
                    ))}
                </select>
                <label htmlFor="tarif-special-service" className="required">Service</label>
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
                    <option value="">Sélectionner une unité</option>
                    {tarifSpecial.idService && serviceUnites[tarifSpecial.idService]?.map(unite => (
                        <option key={unite.idUnite} value={unite.idUnite}>
                            {unite.nomUnite}
                        </option>
                    ))}
                </select>
                <label htmlFor="tarif-special-unite" className="required">Unité</label>
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
                <label htmlFor="tarif-special-prix" className="required">Prix (CHF)</label>
                {validationErrors.prix && (
                    <span className="error-message">{validationErrors.prix}</span>
                )}
            </div>

            {/* Date début */}
            <div className="input-group date-input">
                <input
                    type="date"
                    id="tarif-special-date-debut"
                    name="date_debut"
                    value={tarifSpecial.date_debut}
                    onChange={onInputChange}
                    required
                    disabled={isReadOnly}
                    className={validationErrors.date_debut ? 'error' : ''}
                />
                {!isReadOnly && (
                    <FiCalendar 
                        className="calendar-icon" 
                        onClick={() => onOpenDateModal('date_debut')}
                    />
                )}
                <label htmlFor="tarif-special-date-debut" className="required">Date de début</label>
                {validationErrors.date_debut && (
                    <span className="error-message">{validationErrors.date_debut}</span>
                )}
            </div>

            {/* Date fin */}
            <div className="input-group date-input">
                <input
                    type="date"
                    id="tarif-special-date-fin"
                    name="date_fin"
                    value={tarifSpecial.date_fin || ''}
                    onChange={onInputChange}
                    disabled={isReadOnly}
                    className={validationErrors.date_fin ? 'error' : ''}
                />
                {!isReadOnly && (
                    <FiCalendar 
                        className="calendar-icon" 
                        onClick={() => onOpenDateModal('date_fin')}
                    />
                )}
                <label htmlFor="tarif-special-date-fin">Date de fin (optionnel)</label>
                {validationErrors.date_fin && (
                    <span className="error-message">{validationErrors.date_fin}</span>
                )}
            </div>

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
                <label htmlFor="tarif-special-note" className="required">Note (obligatoire)</label>
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
