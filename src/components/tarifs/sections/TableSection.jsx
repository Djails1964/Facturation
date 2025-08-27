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
  responsive = true,
  keyField = null
}) => {
  const [sortConfig, setSortConfig] = useState(defaultSort);

  // Fonction pour déterminer la clé unique d'un item
  const getItemKey = (item, index) => {
  // Si keyField est spécifié, l'utiliser
  if (keyField && item[keyField]) {
    return item[keyField];
  }
  
  // ✅ CORRECTION: Utiliser d'abord l'ID primaire spécifique à chaque type
  // Pour les tarifs standards
  if (item.idTarifStandard) {
    return `tarif_std_${item.idTarifStandard}`;
  }
  
  // Pour les tarifs spéciaux
  if (item.idTarifSpecial) {
    return `tarif_spe_${item.idTarifSpecial}`;
  }
  
  // Pour les services
  if (item.idService && !item.idTarifStandard && !item.idTarifSpecial) {
    return `service_${item.idService}`;
  }
  
  // Pour les unités
  if (item.idUnite && !item.idTarifStandard && !item.idTarifSpecial) {
    return `unite_${item.idUnite}`;
  }
  
  // Pour les types de tarifs
  if (item.idTypeTarif && !item.idTarifStandard && !item.idTarifSpecial) {
    return `type_${item.idTypeTarif}`;
  }
  
  // ✅ CORRECTION: Gérer les snake_case également
  if (item.id_tarif_standard) return `tarif_std_${item.id_tarif_standard}`;
  if (item.id_tarif_special) return `tarif_spe_${item.id_tarif_special}`;
  if (item.id_service && !item.id_tarif_standard && !item.id_tarif_special) return `service_${item.id_service}`;
  if (item.id_unite && !item.id_tarif_standard && !item.id_tarif_special) return `unite_${item.id_unite}`;
  if (item.id_type_tarif && !item.id_tarif_standard && !item.id_tarif_special) return `type_${item.id_type_tarif}`;
  
  // Fallback sur l'ancien 'id'
  if (item.id) {
    // ✅ AMÉLIORATION: Ajouter un préfixe basé sur le type d'objet détecté
    if (item.nomService || item.codeService) return `service_${item.id}`;
    if (item.nomUnite || item.codeUnite) return `unite_${item.id}`;
    if (item.nomTypeTarif || item.codeTypeTarif) return `type_${item.id}`;
    if (item.prixTarifStandard !== undefined) return `tarif_std_${item.id}`;
    if (item.prixTarifSpecial !== undefined) return `tarif_spe_${item.id}`;
    
    return `fallback_${item.id}`;
  }
  
  // ✅ SÉCURITÉ: En dernier recours, utiliser l'index avec un timestamp pour garantir l'unicité
  return `item_${index}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

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

  // Fonction pour déterminer l'ID pour le highlight
  const getHighlightId = (item) => {
    return item.idService || item.idUnite || item.idTarifStandard || item.idTarifSpecial || 
           item.id_service || item.id_unite || item.id_tarif_standard || item.id_tarif_special || 
           item.id;
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
                  key={`header_${index}`}
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
            {sortedData.map((item, index) => {
              const itemKey = getItemKey(item, index);
              const isHighlighted = highlightedId === getHighlightId(item);
              
              return (
                <tr 
                  key={itemKey} // ✅ Clé unique garantie
                  className={isHighlighted ? 'highlighted' : ''}
                >
                  {columns.map((column, colIndex) => (
                    <td 
                      key={`${itemKey}_col_${colIndex}`} // ✅ Clé unique pour chaque cellule
                      className={`${column.cellClassName || column.className || ''}`}
                      data-label={column.label}
                    >
                      {column.render ? column.render(item) : getNestedValue(item, column.field)}
                    </td>
                  ))}
                </tr>
              );
            })}
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