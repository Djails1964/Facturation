// src/components/tarifs/sections/TableSection.jsx
// Wrapper autour d'UnifiedTable — remplace le <table> HTML natif.
// Toute la logique de tri, highlight, keyField est déléguée à UnifiedTable.

import React, { useState, useMemo } from 'react';
import UnifiedTable from '../../shared/tables/UnifiedTable';
import { createLogger } from '../../../utils/createLogger';

const log = createLogger('TableSection');

// Résolution de l'ID unique d'un item (logique métier tarifs)
const resolveItemId = (item, keyField, index) => {
    if (keyField && item[keyField]) return item[keyField];
    if (item.idTarifStandard)  return `tarif_std_${item.idTarifStandard}`;
    if (item.idTarifSpecial)   return `tarif_spe_${item.idTarifSpecial}`;
    if (item.idService)        return `service_${item.idService}`;
    if (item.idUnite)          return `unite_${item.idUnite}`;
    if (item.idTypeTarif)      return `type_${item.idTypeTarif}`;
    if (item.id_tarif_standard) return `tarif_std_${item.id_tarif_standard}`;
    if (item.id_tarif_special)  return `tarif_spe_${item.id_tarif_special}`;
    if (item.id_service)        return `service_${item.id_service}`;
    if (item.id_unite)          return `unite_${item.id_unite}`;
    if (item.id_type_tarif)     return `type_${item.id_type_tarif}`;
    if (item.id)                return `item_${item.id}`;
    return `fallback_${index}`;
};

// ID pour la comparaison avec highlightedId
const resolveHighlightId = (item) =>
    item.idService    || item.idUnite       || item.idTarifStandard ||
    item.idTarifSpecial || item.id_service  || item.id_unite        ||
    item.id_tarif_standard || item.id_tarif_special || item.id;

// Récupère une valeur imbriquée (ex: 'client.nom')
const getNestedValue = (obj, path) => {
    if (!path) return obj;
    return path.split('.').reduce((o, p) => o?.[p], obj);
};

const TableSection = ({
    title,
    data = [],
    columns = [],
    highlightedId,
    emptyMessage = 'Aucun élément trouvé',
    className = '',
    defaultSort = null,
    keyField = null,
}) => {
    const [sortConfig, setSortConfig] = useState(defaultSort
        ? { key: defaultSort.field, direction: defaultSort.direction }
        : null
    );

    // ── Tri ──────────────────────────────────────────────────────────────────
    const handleSort = (field) => {
        setSortConfig(prev =>
            prev?.key === field
                ? { key: field, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
                : { key: field, direction: 'asc' }
        );
    };

    const sortedData = useMemo(() => {
        if (!sortConfig) return data;
        return [...data].sort((a, b) => {
            const aVal = String(getNestedValue(a, sortConfig.key) ?? '').toLowerCase();
            const bVal = String(getNestedValue(b, sortConfig.key) ?? '').toLowerCase();
            const cmp = aVal.localeCompare(bVal, 'fr', { sensitivity: 'base' });
            return sortConfig.direction === 'asc' ? cmp : -cmp;
        });
    }, [data, sortConfig]);

    // ── Colonnes avec labels triables ─────────────────────────────────────────
    const unifiedColumns = useMemo(() => columns.map(col => {
        // Conversion width → flex/minWidth
        // 'auto' ou absent → flex: '1' (prend l'espace restant)
        // '25%'            → flex: '0 0 25%', minWidth: '80px'
        // '100px'          → flex: '0 0 100px', minWidth: '100px'
        let flex = col.flex;
        let minWidth = col.minWidth;

        if (!flex) {
            const w = col.width;
            if (!w || w === 'auto') {
                flex = '1';
                minWidth = minWidth || '80px';
            } else if (w.endsWith('%')) {
                flex = `0 0 ${w}`;
                minWidth = minWidth || '80px';
            } else {
                flex = `0 0 ${w}`;
                minWidth = minWidth || w;
            }
        }

        return {
            ...col,
            flex,
            minWidth: minWidth || 'auto',
            label: col.sortable !== false && col.label ? (
                <span
                    className="table-sort-header"
                    onClick={() => handleSort(col.field)}
                >
                    <span>{col.label}</span>
                    <span className={`sort-icon ${
                        sortConfig?.key === col.field ? 'sort-active' : 'sort-inactive'
                    }`}>
                        {sortConfig?.key === col.field
                            ? (sortConfig.direction === 'asc' ? '↑' : '↓')
                            : '⇅'}
                    </span>
                </span>
            ) : col.label,
        };
    }), [columns, sortConfig]);

    log.debug(`TableSection "${title}": ${data.length} items`);

    return (
        <div className={`tarif-table-section ${className}`}>
            {title && (
                <h3 className="tarif-table-section__title">
                    {title} ({data.length})
                </h3>
            )}
            <UnifiedTable
                columns={unifiedColumns}
                data={sortedData}
                emptyMessage={emptyMessage}
                getRowId={(item, index) => resolveItemId(item, keyField, index)}
                getRowClassName={(item) =>
                    resolveHighlightId(item) === highlightedId ? 'highlight' : ''
                }
                renderRow={(item, cols) => (
                    <div
                        key={resolveItemId(item, keyField, 0)}
                        className={`table-row${resolveHighlightId(item) === highlightedId ? ' highlight' : ''}`}
                    >
                        {cols.map((col, i) => (
                            <div
                                key={i}
                                className={`table-cell ${col.className || ''}`}
                                style={{
                                    flex: col.flex || '1',
                                    minWidth: col.minWidth || 'auto',
                                    maxWidth: col.maxWidth || 'none',
                                    justifyContent: col.align === 'right' ? 'flex-end'
                                                  : col.align === 'center' ? 'center'
                                                  : 'flex-start',
                                    overflow: col.field === 'actions' ? 'visible' : 'hidden',
                                }}
                            >
                                {col.render ? col.render(item) : getNestedValue(item, col.field)}
                            </div>
                        ))}
                    </div>
                )}
            />
        </div>
    );
};

export default TableSection;