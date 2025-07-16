import React from 'react';

const ServiceUniteAssociation = ({
  services,
  unites,
  serviceUnites,
  selectedServiceId,
  setSelectedServiceId,
  defaultUnites,
  onLink,
  onUnlink,
  onDefaultChange
}) => {
  return (
    <div className="service-unite-form">
      <div className="form-group">
        <label htmlFor="service-association">Sélectionner un service :</label>
        <select
          id="service-association"
          value={selectedServiceId}
          onChange={(e) => setSelectedServiceId(e.target.value)}
          className="form-select"
        >
          <option value="">Sélectionner un service</option>
          {services.map(service => (
            <option key={service.id} value={service.id}>
              {service.nom}
            </option>
          ))}
        </select>
      </div>

      {selectedServiceId && (
        <div className="service-unite-association">
          <div className="form-group">
            <label>Unités disponibles :</label>
            <div className="unite-list">
              {unites.map(unite => {
                const isAssociated = serviceUnites[selectedServiceId]?.some(u => u.id === unite.id);
                return (
                  <div key={`association-unite-${unite.id}`} className="unite-item">
                    <span>{unite.nom}</span>
                    {isAssociated ? (
                      <button 
                        onClick={() => onUnlink(selectedServiceId, unite.id)}
                        className="btn-unlink"
                        title="Dissocier"
                      >
                        Dissocier
                      </button>
                    ) : (
                      <button 
                        onClick={() => onLink(selectedServiceId, unite.id)}
                        className="btn-link"
                        title="Associer"
                      >
                        Associer
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sélection de l'unité par défaut */}
          <div className="form-group">
            <label htmlFor="default-unite-selection">Unité par défaut pour ce service :</label>
            <select 
              id="default-unite-selection"
              className="form-select"
              value={defaultUnites[selectedServiceId] || ""}
              onChange={(e) => onDefaultChange(selectedServiceId, e.target.value)}
            >
              <option value="">Sélectionner une unité</option>
              {serviceUnites[selectedServiceId]?.map(unite => (
                <option key={unite.id} value={unite.id}>
                  {unite.nom} {unite.isDefault ? '(défaut actuel)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceUniteAssociation;