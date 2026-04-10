// src/components/factures/FacturesTable.jsx
// Utilise UnifiedTable nativement — plus de FactureRow/CSS lf-* parallèles.

import React, { useState, useMemo, useRef, useEffect } from 'react';
import UnifiedTable from '../shared/tables/UnifiedTable';
import FactureActions from './FactureActions';
import { formatDate, getBadgeClasses, formatEtatText, formatMontant } from '../../utils/formatters';
import { createLogger } from '../../utils/createLogger';
import { COLUMN_LABELS } from '../../constants/factureConstants';
import '../../styles/components/factures/FacturesTable.css';

const log = createLogger('FacturesTable');

// ── Composant ligne avec scroll-to ────────────────────────────────────────────
function FactureRowWrapper({ facture, isSelected, columns, onSelectionFacture, actionProps }) {
    const rowRef = useRef(null);
    useEffect(() => {
        if (isSelected && rowRef.current) {
            rowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [isSelected]);

    const etat = facture.etatAffichage || facture.etat;

    return (
        <div
            ref={rowRef}
            className={`table-row ${isSelected ? 'selected' : ''}`}
            onClick={() => onSelectionFacture(facture.idFacture)}
        >
            {columns.map((col, i) => {
                // La colonne actions : FactureActions rend son propre div.table-cell
                // → on ne crée pas de wrapper pour éviter l'imbrication
                if (col.field === 'actions') {
                    return (
                        <FactureActions
                            key={i}
                            facture={facture}
                            style={{ flex: col.flex, minWidth: col.minWidth }}
                            {...actionProps}
                        />
                    );
                }
                return (
                    <div
                        key={i}
                        className={`table-cell ${col.className || ''}`}
                        style={{ flex: col.flex, minWidth: col.minWidth, justifyContent: col.align === 'right' ? 'flex-end' : undefined }}
                    >
                        {col.field === 'numeroFacture' && facture.numeroFacture}
                        {col.field === 'client' && `${facture.client?.prenom || ''} ${facture.client?.nom || ''}`}
                        {col.field === 'dateFacture' && formatDate(facture.dateFacture)}
                        {col.field === 'montantTotal' && formatMontant(facture.montantTotal)}
                        {col.field === 'etat' && (
                            <span className={getBadgeClasses(etat)}>{formatEtatText(etat)}</span>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ── Colonnes ──────────────────────────────────────────────────────────────────
const COLUMNS = [
    { label: COLUMN_LABELS.NUMERO,  field: 'numeroFacture', sortKey: 'numeroFacture', flex: '1',       minWidth: '120px', className: 'factures-numero-cell' },
    { label: COLUMN_LABELS.CLIENT,  field: 'client',        sortKey: 'client',        flex: '1.5',     minWidth: '150px', className: 'factures-client-cell' },
    { label: COLUMN_LABELS.DATE,    field: 'dateFacture',   sortKey: 'dateFacture',   flex: '0.8',     minWidth: '100px', className: 'factures-date-cell' },
    { label: COLUMN_LABELS.MONTANT, field: 'montantTotal',  sortKey: 'montant',       flex: '0.8',     minWidth: '100px', className: 'factures-montant-cell', align: 'right' },
    { label: COLUMN_LABELS.ETAT,    field: 'etat',          sortKey: 'etat',          flex: '1',       minWidth: '100px', className: 'factures-etat-cell' },
    { label: '',                    field: 'actions',                                 flex: '0 0 240px', minWidth: '240px', className: 'actions-cell' },
];

const FacturesTable = ({
    factures, isLoading, error, factureSelectionnee, onSelectionFacture,
    onAfficherFacture, onModifierFacture, onImprimerFacture, onCopierFacture,
    onEnvoyerFacture, onPayerFacture, onSupprimerFacture, onSetNotification
}) => {
    // ── Tri ───────────────────────────────────────────────────────────────────
    const [sortConfig, setSortConfig] = useState({ key: 'numeroFacture', direction: 'desc' });

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    const sortedFactures = useMemo(() => {
        if (!factures?.length) return [];
        return [...factures].sort((a, b) => {
            const dir = sortConfig.direction === 'asc' ? 1 : -1;
            switch (sortConfig.key) {
                case 'numeroFacture': {
                    const [seqA, yearA] = (a.numeroFacture || '0.0').split('.').map(Number);
                    const [seqB, yearB] = (b.numeroFacture || '0.0').split('.').map(Number);
                    const aVal = yearA !== yearB ? yearA : seqA;
                    const bVal = yearA !== yearB ? yearB : seqB;
                    return (aVal - bVal) * dir;
                }
                case 'client': {
                    const aVal = `${a.client?.prenom || ''} ${a.client?.nom || ''}`.trim();
                    const bVal = `${b.client?.prenom || ''} ${b.client?.nom || ''}`.trim();
                    return aVal.localeCompare(bVal, 'fr', { sensitivity: 'base' }) * dir;
                }
                case 'dateFacture':
                    return (new Date(a.dateFacture || 0) - new Date(b.dateFacture || 0)) * dir;
                case 'montant':
                    return ((parseFloat(a.montantTotal) || 0) - (parseFloat(b.montantTotal) || 0)) * dir;
                case 'etat': {
                    const aVal = (a.etatAffichage || a.etat || '');
                    const bVal = (b.etatAffichage || b.etat || '');
                    return aVal.localeCompare(bVal, 'fr', { sensitivity: 'base' }) * dir;
                }
                default: return 0;
            }
        });
    }, [factures, sortConfig]);

    // ── Colonnes avec labels triables ─────────────────────────────────────────
    const columns = useMemo(() => COLUMNS.map(col => ({
        ...col,
        label: col.sortKey ? (
            <span
                className="table-sort-header"
                onClick={(e) => { e.stopPropagation(); handleSort(col.sortKey); }}
            >
                <span>{col.label}</span>
                <span className={`sort-icon ${sortConfig.key === col.sortKey ? 'sort-active' : 'sort-inactive'}`}>
                    {sortConfig.key === col.sortKey
                        ? (sortConfig.direction === 'asc' ? '↑' : '↓')
                        : '⇅'}
                </span>
            </span>
        ) : col.label
    })), [sortConfig]);

    const actionProps = {
        onAfficherFacture, onModifierFacture, onImprimerFacture,
        onCopierFacture, onEnvoyerFacture, onPayerFacture,
        onSupprimerFacture, onSetNotification
    };

    log.debug('Rendu FacturesTable:', factures?.length, 'factures');

    return (
        <UnifiedTable
            columns={columns}
            data={sortedFactures}
            isLoading={isLoading}
            error={error}
            emptyMessage="Aucune facture trouvée"
            selectedId={factureSelectionnee}
            getRowId={(f) => f.idFacture}
            renderRow={(facture, cols) => (
                <FactureRowWrapper
                    key={facture.idFacture}
                    facture={facture}
                    isSelected={Number(factureSelectionnee) === Number(facture.idFacture)}
                    columns={cols}
                    onSelectionFacture={onSelectionFacture}
                    actionProps={actionProps}
                />
            )}
        />
    );
};

export default FacturesTable;