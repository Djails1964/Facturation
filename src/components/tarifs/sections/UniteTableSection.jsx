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
  // Configuration des colonnes
  const columns = [
    {
      label: 'Code',
      field: 'code',
      width: '100px',
      render: (unite) => (
        <span className="unite-code">{unite.code}</span>
      )
    },
    {
      label: 'Nom',
      field: 'nom',
      width: '25%',
      render: (unite) => (
        <span className="unite-name">{unite.nom}</span>
      )
    },
    {
      label: 'Description',
      field: 'description',
      width: 'auto',
      render: (unite) => (
        <span className="unite-description">
          {unite.description || <em>Aucune description</em>}
        </span>
      )
    },
    {
      label: 'Statut',
      field: 'statut',
      width: '120px',
      render: (unite) => (
        <span className={`etat-badge ${unite.actif ? 'etat-confirme' : 'etat-annulee'}`}>
          {unite.actif ? 'ACTIF' : 'INACTIF'}
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