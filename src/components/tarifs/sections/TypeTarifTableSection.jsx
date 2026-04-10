import React from 'react';
import TableSection from './TableSection';
import { EditActionButton, DeleteActionButton } from '../../../components/ui/buttons/ActionButtons';
import { COLUMN_LABELS_TYPE_TARIF, TABLE_TITLES } from '../../../constants/tarifConstants';

const TypeTarifTableSection = ({
  typesTarifs,
  onEdit,
  onDelete,
  highlightedId,
  isSubmitting = false
}) => {
  const columns = [
    {
      label:    COLUMN_LABELS_TYPE_TARIF.CODE,
      field:    'codeTypeTarif',
      flex:     '0 0 15%',
      minWidth: '80px',
      sortable: true,
      render: (t) => <span>{t.codeTypeTarif}</span>
    },
    {
      label:    COLUMN_LABELS_TYPE_TARIF.NOM,
      field:    'nomTypeTarif',
      flex:     '0 0 30%',
      minWidth: '100px',
      sortable: true,
      render: (t) => <strong>{t.nomTypeTarif}</strong>
    },
    {
      label:    COLUMN_LABELS_TYPE_TARIF.DESCRIPTION,
      field:    'descriptionTypeTarif',
      flex:     '0 0 45%',
      minWidth: '100px',
      sortable: true,
      render: (t) => (
        <span>{t.descriptionTypeTarif || <em>Aucune description</em>}</span>
      )
    },
    {
      label:     '',
      field:     'actions',
      flex:     '0 0 10%',
      minWidth: '70px',
      sortable:  false,
      className: 'actions-cell',
      render: (t) => (
        <>
                    <EditActionButton   onClick={() => onEdit?.(t)}   disabled={isSubmitting} />
                    <DeleteActionButton onClick={() => onDelete?.(t)} disabled={isSubmitting} />
                </>
      )
    }
  ];

  return (
    <TableSection
      title={TABLE_TITLES.TYPES_TARIFS}
      data={typesTarifs}
      columns={columns}
      highlightedId={highlightedId}
      emptyMessage="Aucun type de tarif trouvé"
      className="type-tarif-table-section"
      defaultSort={{ field: 'nomTypeTarif', direction: 'asc' }}
    />
  );
};

export default TypeTarifTableSection;