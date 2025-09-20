import React from 'react';
import TableSection from './TableSection';
import { ServiceActions } from './TarifListActions';

const ServiceTableSection = ({
  services,
  onEdit,
  onDelete,
  highlightedId,
  isSubmitting = false
}) => {
  // Configuration des colonnes avec largeurs contrôlées
  const columns = [
    {
      label: 'Code',
      field: 'codeService',
      width: '100px', // Largeur fixe pour le code
      className: 'col-code',
      sortable: true,
      render: (service) => (
        <span className="service-code">{service.codeService}</span>
      )
    },
    {
      label: 'Nom',
      field: 'nomService',
      width: '25%',
      className: 'col-name',
      sortable: true,
      render: (service) => (
        <span className="service-name">{service.nomService}</span>
      )
    },
    {
      label: 'Description',
      field: 'descriptionService',
      width: 'auto', // Prend l'espace restant
      className: 'col-description',
      sortable: true,
      render: (service) => (
        <span className="service-description" title={service.descriptionService}>
          {service.descriptionService || <em>Aucune description</em>}
        </span>
      )
    },
    {
      label: 'Statut',
      field: 'actif',
      width: '100px', // Largeur fixe pour le statut
      className: 'col-status',
      sortable: true,
      render: (service) => (
        <span className={`etat-badge ${service.actif ? 'etat-confirme' : 'etat-annulee'}`}>
          {service.actif ? 'ACTIF' : 'INACTIF'}
        </span>
      )
    },
    {
      label: '',
      field: 'actions',
      width: '120px', // Largeur fixe au lieu de pourcentage
      className: 'col-actions',
      sortable: false,
      render: (service) => (
        <ServiceActions
          service={service}
          onEdit={() => onEdit?.(service)}
          onDelete={() => onDelete?.(service)}
          disabled={isSubmitting}
        />
      )
    }
  ];

  return (
    <TableSection
      title="Liste des services"
      data={services}
      columns={columns}
      highlightedId={highlightedId}
      emptyMessage="Aucun service trouvé"
      className="service-table-section"
      defaultSort={{ field: 'nomService', direction: 'asc' }}
    />
  );
};

export default ServiceTableSection;