import React from 'react';
import TableSection from './TableSection';
import { EditActionButton, DeleteActionButton } from '../../../components/ui/buttons/ActionButtons';
import { COLUMN_LABELS_UNITE, TABLE_TITLES } from '../../../constants/tarifConstants';

const UniteTableSection = ({
  unites,
  onEdit,
  onDelete,
  highlightedId,
  isSubmitting = false
}) => {
  const columns = [
    {
      label:    COLUMN_LABELS_UNITE.CODE,
      field:    'codeUnite',
      flex:     '0 0 20%',
      minWidth: '80px',
      sortable: true,
      render: (unite) => <span>{unite.codeUnite}</span>
    },
    {
      label:    COLUMN_LABELS_UNITE.ABREV,
      field:    'abreviationUnite',
      flex:     '0 0 10%',
      minWidth: '60px',
      sortable: true,
      render: (unite) => (
        <span title="Abréviation affichage (max 2 car.)">
          {unite.abreviationUnite
            ? <strong>{unite.abreviationUnite}</strong>
            : <em style={{ color: '#aaa' }}>—</em>}
        </span>
      )
    },
    {
      label:    COLUMN_LABELS_UNITE.NOM,
      field:    'nomUnite',
      flex:     '0 0 25%',
      minWidth: '90px',
      sortable: true,
      render: (unite) => <span>{unite.nomUnite}</span>
    },
    {
      label:    COLUMN_LABELS_UNITE.DESCRIPTION,
      field:    'descriptionUnite',
      flex:     '0 0 35%',
      minWidth: '100px',
      sortable: true,
      render: (unite) => (
        <span>{unite.descriptionUnite || <em>Aucune description</em>}</span>
      )
    },
    {
      label:     '',
      field:     'actions',
      flex:     '0 0 10%',
      minWidth: '70px',
      sortable:  false,
      className: 'actions-cell',
      render: (unite) => (
        <>
                    <EditActionButton   onClick={() => onEdit?.(unite)}   disabled={isSubmitting} />
                    <DeleteActionButton onClick={() => onDelete?.(unite)} disabled={isSubmitting} />
                </>
      )
    }
  ];

  return (
    <TableSection
      title={TABLE_TITLES.UNITES}
      data={unites}
      columns={columns}
      highlightedId={highlightedId}
      emptyMessage="Aucune unité trouvée"
      className="unite-table-section"
      defaultSort={{ field: 'nomUnite', direction: 'asc' }}
    />
  );
};

export default UniteTableSection;