import React from 'react';
import TableSection from './TableSection';
import { EditActionButton, DeleteActionButton } from '../../../components/ui/buttons/ActionButtons';
import { COLUMN_LABELS_SERVICE, TABLE_TITLES } from '../../../constants/tarifConstants';

const ServiceTableSection = ({
  services,
  onEdit,
  onDelete,
  highlightedId,
  isSubmitting = false
}) => {
  const columns = [
    {
      label:    COLUMN_LABELS_SERVICE.CODE,
      field:    'codeService',
      flex:     '0 0 10%',
      minWidth: '70px',
      sortable: true,
      render: (service) => <span>{service.codeService}</span>
    },
    {
      label:    COLUMN_LABELS_SERVICE.NOM,
      field:    'nomService',
      flex:     '0 0 25%',
      minWidth: '100px',
      sortable: true,
      render: (service) => <span>{service.nomService}</span>
    },
    {
      label:    COLUMN_LABELS_SERVICE.DESCRIPTION,
      field:    'descriptionService',
      flex:     '0 0 40%',
      minWidth: '100px',
      sortable: true,
      render: (service) => (
        <span title={service.descriptionService}>
          {service.descriptionService || <em>Aucune description</em>}
        </span>
      )
    },
    {
      label:    COLUMN_LABELS_SERVICE.STATUT,
      field:    'actif',
      flex:     '0 0 15%',
      minWidth: '80px',
      sortable: true,
      render: (service) => (
        <span className={`etat-badge ${service.actif ? 'etat-confirme' : 'etat-annulee'}`}>
          {service.actif ? 'ACTIF' : 'INACTIF'}
        </span>
      )
    },
    {
      label:     '',
      field:     'actions',
      flex:     '0 0 10%',
      minWidth: '70px',
      sortable:  false,
      className: 'actions-cell',
      render: (service) => (
        <>
          <>
                    <EditActionButton   onClick={() => onEdit?.(service)}   disabled={isSubmitting} />
                    <DeleteActionButton onClick={() => onDelete?.(service)} disabled={isSubmitting} />
                </>
        </>
      )
    }
  ];

  return (
    <TableSection
      title={TABLE_TITLES.SERVICES}
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