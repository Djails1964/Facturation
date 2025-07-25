import React, { useMemo } from 'react';

const TarifSpecialFilters = ({ 
  tarifsSpeciaux = [],
  clients = [], 
  services = [], 
  unites = [],
  filters, 
  onFilterChange, 
  onResetFilters 
}) => {
  // Fonction pour vérifier la validité d'un tarif
  const checkTarifValidity = (tarif, filterEtat) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dateDebut = tarif.date_debut ? new Date(tarif.date_debut) : null;
    const dateFin = tarif.date_fin ? new Date(tarif.date_fin) : null;
    
    if (!dateDebut) {
      return filterEtat === 'invalid';
    }
    
    dateDebut.setHours(0, 0, 0, 0);
    const isValid = dateDebut <= today && (!dateFin || dateFin >= today);
    
    return (filterEtat === 'valid' && isValid) || (filterEtat === 'invalid' && !isValid);
  };

  // Filtre dynamique des options disponibles
  const filteredOptions = useMemo(() => {
    // Filtrer les tarifs selon les autres filtres déjà appliqués
    const filteredTarifs = tarifsSpeciaux.filter(tarif => 
      (!filters.client || tarif.client_id == filters.client) &&
      (!filters.service || tarif.service_id == filters.service) &&
      (!filters.unite || tarif.unite_id == filters.unite)
    );

    // Extraire les options uniques pour chaque filtre
    return {
      clients: Array.from(new Set(
        filteredTarifs.map(tarif => tarif.client_id)
      )).map(clientId => 
        clients.find(client => client.id === clientId)
      ).filter(Boolean),

      services: Array.from(new Set(
        tarifsSpeciaux // Utiliser tous les tarifs pour les services
          .filter(tarif => 
            (!filters.client || tarif.client_id == filters.client)
          )
          .map(tarif => tarif.service_id)
      )).map(serviceId => 
        services.find(service => service.id === serviceId)
      ).filter(Boolean),

      unites: Array.from(new Set(
        tarifsSpeciaux // Utiliser tous les tarifs pour les unités
          .filter(tarif => 
            (!filters.client || tarif.client_id == filters.client) &&
            (!filters.service || tarif.service_id == filters.service)
          )
          .map(tarif => tarif.unite_id)
      )).map(uniteId => 
        unites.find(unite => unite.id === uniteId)
      ).filter(Boolean),

      // Calculer dynamiquement les états disponibles
      etats: Array.from(new Set(
        filteredTarifs.map(tarif => 
          checkTarifValidity(tarif, 'valid') ? 'valid' : 'invalid'
        )
      ))
    };
  }, [tarifsSpeciaux, clients, services, unites, filters]);

  return (
    <div className="tarif-filters">
      <h4>Filtres des tarifs spéciaux</h4>
      <div className="filter-controls">
        <div className="filter-group">
          <div className="filter-floating">
            <select
              className="filter-select"
              name="client"
              value={filters.client || ''}
              onChange={onFilterChange}
              placeholder=" "
            >
              <option value="">Tous les clients</option>
              {filteredOptions.clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.prenom} {client.nom}
                </option>
              ))}
            </select>
            <label className="floating-label">Client</label>
          </div>
        </div>

        <div className="filter-group">
          <div className="filter-floating">
            <select
              className="filter-select"
              name="service"
              value={filters.service || ''}
              onChange={onFilterChange}
              placeholder=" "
            >
              <option value="">Tous les services</option>
              {filteredOptions.services.map(service => (
                <option key={service.id} value={service.id}>
                  {service.nom}
                </option>
              ))}
            </select>
            <label className="floating-label">Service</label>
          </div>
        </div>

        <div className="filter-group">
          <div className="filter-floating">
            <select
              className="filter-select"
              name="unite"
              value={filters.unite || ''}
              onChange={onFilterChange}
              placeholder=" "
            >
              <option value="">Toutes les unités</option>
              {filteredOptions.unites.map(unite => (
                <option key={unite.id} value={unite.id}>
                  {unite.nom}
                </option>
              ))}
            </select>
            <label className="floating-label">Unité</label>
          </div>
        </div>

        <div className="filter-group">
          <div className="filter-floating">
            <select
              className="filter-select"
              name="etat"
              value={filters.etat || ''}
              onChange={onFilterChange}
              placeholder=" "
            >
              <option value="">Tous les états</option>
              {filteredOptions.etats.includes('valid') && (
                <option value="valid">Valide</option>
              )}
              {filteredOptions.etats.includes('invalid') && (
                <option value="invalid">Invalide</option>
              )}
            </select>
            <label className="floating-label">État</label>
          </div>
        </div>
      </div>

      {(filters.client || filters.service || filters.unite || filters.etat) && (
        <button 
          className="reset-filters-btn" 
          onClick={onResetFilters}
        >
          Réinitialiser les filtres
        </button>
      )}
    </div>
  );
};

export default TarifSpecialFilters;