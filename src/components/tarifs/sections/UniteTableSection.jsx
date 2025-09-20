import React from 'react';
import TableSection from './TableSection';
import { UniteActions } from './TarifListActions';

const UniteTableSection = ({
  unites,
  onEdit,
  onDelete,
  highlightedId,
  isSubmitting = false
}) => {
  // Configuration des colonnes - SANS STATUT
  const columns = [
    {
      label: 'Code',
      field: 'codeUnite',
      width: '100px',
      render: (unite) => (
        <span className="unite-code">{unite.codeUnite}</span>
      )
    },
    {
      label: 'Nom',
      field: 'nomUnite',
      width: '25%',
      render: (unite) => (
        <span className="unite-name">{unite.nomUnite}</span>
      )
    },
    {
      label: 'Description',
      field: 'descriptionUnite',
      width: 'auto',
      render: (unite) => (
        <span className="unite-description">
          {unite.descriptionUnite || <em>Aucune description</em>}
        </span>
      )
    },
    {
      label: '',
      field: 'actions',
      width: '120px',
      sortable: false,
      render: (unite) => (
        <UniteActions
          unite={unite}
          onEdit={() => onEdit?.(unite)}
          onDelete={() => onDelete?.(unite)}
          disabled={isSubmitting}
        />
      )
    }
  ];

  return (
    <TableSection
      title="Liste des unités"
      data={unites}
      columns={columns}
      highlightedId={highlightedId}
      emptyMessage="Aucune unité trouvée"
      className="unite-table-section"
    />
  );
};

export default UniteTableSection;