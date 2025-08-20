import React, { useState, useMemo } from 'react';
import '../../../styles/components/tarifs/table-section.css';

const TableSection = ({
  title,
  data = [],
  columns = [],
  highlightedId,
  emptyMessage = "Aucun élément trouvé",
  className = "",
  defaultSort = null,
  responsive = true // Nouvelle prop pour le comportement responsive
}) => {
  const [sortConfig, setSortConfig] = useState(defaultSort);

  // Fonction pour récupérer une valeur imbriquée
  const getNestedValue = (obj, path) => {
    if (!path) return obj;
    return path.split('.').reduce((o, p) => o?.[p], obj);
  };

  // Fonction de tri
  const sortedData = useMemo(() => {
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
      const aValue = getNestedValue(a, sortConfig.field);
      const bValue = getNestedValue(b, sortConfig.field);

      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();

      if (aStr < bStr) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aStr > bStr) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [data, sortConfig]);

  // Gestionnaire de clic sur les en-têtes
  const handleSort = (field, sortable = true) => {
    if (!sortable) return;

    setSortConfig(current => {
      if (current?.field === field) {
        const newDirection = current.direction === 'asc' ? 'desc' : 'asc';
        return { field, direction: newDirection };
      } else {
        return { field, direction: 'asc' };
      }
    });
  };

  // Rendu de l'indicateur de tri
  const renderSortIndicator = (field, sortable) => {
    if (!sortable) return null;

    let sortClass = 'sort-indicator';
    
    if (sortConfig?.field === field) {
      sortClass += sortConfig.direction === 'asc' ? ' sort-asc' : ' sort-desc';
    } else {
      sortClass += ' sort-neutral';
    }

    return <span className={sortClass}></span>;
  };

  // Classes CSS conditionnelles
  const tableClasses = [
    'table-section',
    className,
    responsive ? 'responsive-table' : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={tableClasses}>
      <h3>{title} ({data.length})</h3>
      
      <div className="table-responsive">
        <table style={{ tableLayout: 'fixed' }}>
          <thead>
            <tr>
              {columns.map((column, index) => (
                <th 
                  key={index}
                  style={{ width: column.width }}
                  className={`${column.className || ''} ${column.sortable !== false ? 'sortable' : ''}`}
                  onClick={() => handleSort(column.field, column.sortable !== false)}
                >
                  <div className="th-content">
                    <span className="th-label">{column.label}</span>
                    {renderSortIndicator(column.field, column.sortable !== false)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map(item => (
              <tr 
                key={item.id}
                className={highlightedId === item.id ? 'highlighted' : ''}
              >
                {columns.map((column, index) => (
                  <td 
                    key={index} 
                    className={`${column.cellClassName || column.className || ''}`}
                    data-label={column.label} // Pour le responsive
                  >
                    {column.render ? column.render(item) : getNestedValue(item, column.field)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {data.length === 0 && (
          <div className="empty-state">
            <p>{emptyMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TableSection;