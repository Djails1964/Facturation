// src/components/shared/tables/UnifiedTable.jsx
// Composant de table unifié réutilisable pour toutes les listes

import React from 'react';
import '../../../styles/shared/UnifiedTable.css';

/**
 * Composant de table unifié
 * @param {Object} props
 * @param {Array} props.columns - Configuration des colonnes
 * @param {Array} props.data - Données à afficher
 * @param {Function} props.renderRow - Fonction pour rendre une ligne
 * @param {Function} props.onRowClick - Fonction appelée au clic sur une ligne
 * @param {string|number} props.selectedId - ID de la ligne sélectionnée
 * @param {boolean} props.isLoading - État de chargement
 * @param {string} props.error - Message d'erreur
 * @param {string} props.emptyMessage - Message si pas de données
 * @param {Function} props.getRowClassName - Fonction pour obtenir les classes CSS d'une ligne
 * @param {Function} props.getRowId - Fonction pour obtenir l'ID unique d'une ligne
 */
function UnifiedTable({
    columns = [],
    data = [],
    renderRow,
    onRowClick,
    selectedId,
    isLoading = false,
    error = null,
    emptyMessage = 'Aucune donnée à afficher',
    getRowClassName,
    getRowId,
    keyField = 'id'
}) {
    // Affichage du chargement
    if (isLoading) {
        return (
            <div className="unified-table-loading">
                <div className="spinner"></div>
                <p>Chargement...</p>
            </div>
        );
    }

    // Affichage de l'erreur
    if (error) {
        return (
            <div className="unified-table-error">
                <i className="fas fa-exclamation-triangle"></i>
                <p>{error}</p>
            </div>
        );
    }

    // Affichage si pas de données
    if (data.length === 0) {
        return (
            <div className="unified-table-empty">
                <p>{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className="unified-table-container">
            <div className="unified-table">
                {/* En-tête */}
                <div className="unified-table-header">
                    {columns.map((column, index) => (
                        <div
                            key={index}
                            className={`table-cell ${column.className || ''}`}
                            style={{
                                flex: column.flex || '1',
                                minWidth: column.minWidth || 'auto',
                                maxWidth: column.maxWidth || 'none',
                                justifyContent: column.align === 'right' ? 'flex-end' : 
                                               column.align === 'center' ? 'center' : 'flex-start'
                            }}
                        >
                            {column.label}
                        </div>
                    ))}
                </div>

                {/* Corps */}
                <div className="unified-table-body">
                    {data.map((item) => {
                        const rowId = getRowId ? getRowId(item) : item[keyField];
                        const isSelected = selectedId === rowId;
                        const rowClassName = getRowClassName ? getRowClassName(item, isSelected) : '';

                        if (renderRow) {
                            // renderRow peut retourner un Fragment (ligne + sous-lignes).
                            // On l'enveloppe dans un div pour qu'il soit enfant direct
                            // du flex-container et bénéficie de align-items:stretch.
                            return (
                                <div key={rowId} className="unified-table-row-group">
                                    {renderRow(item, columns)}
                                </div>
                            );
                        }

                        return (
                            <div
                                key={rowId}
                                className={`table-row ${isSelected ? 'selected' : ''} ${rowClassName}`}
                                onClick={() => onRowClick && onRowClick(item)}
                            >
                                {columns.map((column, colIndex) => (
                                    <div
                                        key={colIndex}
                                        className={`table-cell ${column.className || ''}`}
                                        style={{
                                            flex: column.flex || '1',
                                            minWidth: column.minWidth || 'auto',
                                            maxWidth: column.maxWidth || 'none',
                                            justifyContent: column.align === 'right' ? 'flex-end' : 
                                                           column.align === 'center' ? 'center' : 'flex-start'
                                        }}
                                    >
                                        {column.render 
                                            ? column.render(item, column) 
                                            : item[column.field]}
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default UnifiedTable;