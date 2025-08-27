import React from 'react';
import TableSection from './TableSection';
import { TypeTarifActions } from './TarifListActions';

const TypeTarifTableSection = ({
  typesTarifs,
  onEdit,
  onDelete,
  highlightedId,
  isSubmitting = false
}) => {
  // Configuration des colonnes avec tri
  const columns = [
    {
      label: 'Code',
      field: 'codeTypeTarif',
      width: '120px',
      sortable: true,
      render: (typeTarif) => (
        <span className="type-tarif-code">{typeTarif.codeTypeTarif}</span>
      )
    },
    {
      label: 'Nom',
      field: 'nomTypeTarif',
      width: '25%',
      sortable: true,
      render: (typeTarif) => (
        <strong className="type-tarif-name">{typeTarif.nomTypeTarif}</strong>
      )
    },
    {
      label: 'Description',
      field: 'descriptionTypeTarif',
      width: 'auto',
      sortable: true,
      render: (typeTarif) => (
        <span className="type-tarif-description">
          {typeTarif.descriptionTypeTarif || <em>Aucune description</em>}
        </span>
      )
    },
    {
      label: '',
      field: 'actions',
      width: '120px',
      sortable: false,
      render: (typeTarif) => (
        <TypeTarifActions
          typeTarif={typeTarif}
          onEdit={() => onEdit?.(typeTarif)}
          onDelete={() => onDelete?.(typeTarif)}
          disabled={isSubmitting}
        />
      )
    }
  ];

  return (
    <TableSection
      title="Liste des types de tarifs"
      data={typesTarifs}
      columns={columns}
      highlightedId={highlightedId}
      emptyMessage="Aucun type de tarif trouvé"
      className="type-tarif-table-section"
      defaultSort={{ field: 'nom', direction: 'asc' }}
    />
  );
};

export default TypeTarifTableSection;