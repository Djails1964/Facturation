import React from 'react';

const ServiceUniteAssociation = ({
  services,
  unites,
  serviceUnites,
  selectedidService,
  setSelectedidService,
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
          value={selectedidService}
          onChange={(e) => setSelectedidService(e.target.value)}
          className="form-select"
        >
          <option value="">Sélectionner un service</option>
          {services.map(service => (
            <option key={service.idService} value={service.idService}>
              {service.nomService}
            </option>
          ))}
        </select>
      </div>

      {selectedidService && (
        <div className="service-unite-association">
          <div className="form-group">
            <label>Unités disponibles :</label>
            <div className="unite-list">
              {unites.map(unite => {
                const isAssociated = serviceUnites[selectedidService]?.some(u => u.idUnite === unite.idUnite);
                return (
                  <div key={`association-unite-${unite.idUnite}`} className="unite-item">
                    <span>{unite.nomUnite}</span>
                    {isAssociated ? (
                      <button 
                        onClick={() => onUnlink(selectedidService, unite.idUnite)}
                        className="btn-unlink"
                        title="Dissocier"
                      >
                        Dissocier
                      </button>
                    ) : (
                      <button 
                        onClick={() => onLink(selectedidService, unite.idUnite)}
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
              value={defaultUnites[selectedidService] || ""}
              onChange={(e) => onDefaultChange(selectedidService, e.target.value)}
            >
              <option value="">Sélectionner une unité</option>
              {serviceUnites[selectedidService]?.map(unite => (
                <option key={unite.idUnite} value={unite.idUnite}>
                  {unite.nomUnite} {unite.isDefault ? '(défaut actuel)' : ''}
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