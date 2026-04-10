// src/components/paiements/sections/PaiementsTableau.jsx

import React, { useState, useMemo } from 'react';
import { FiEye, FiEdit, FiX } from 'react-icons/fi';

import UnifiedTable from '../../shared/tables/UnifiedTable';
import { formatMontant, getBadgeClasses, formatEtatText, formatDate } from '../../../utils/formatters';
import { createLogger } from '../../../utils/createLogger';
import { COLUMN_LABELS } from '../../../constants/paiementConstants';

const log = createLogger('PaiementsTableau');

function PaiementsTableau({
    paiements,
    paiementSelectionne,
    onSelectPaiement,
    onAfficherPaiement,
    onModifierPaiement,
    onAnnulerPaiement,
    isLoading,
    error,
    isProcessing,
}) {
    // ── Tri ───────────────────────────────────────────────────────────────────
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
        }));
    };

    const sortedPaiements = useMemo(() => {
        if (!paiements?.length || !sortConfig.key) return paiements ?? [];
        const dir = sortConfig.direction === 'asc' ? 1 : -1;

        return [...paiements].sort((a, b) => {
            switch (sortConfig.key) {
                case 'date':
                    return (new Date(a.datePaiement || 0) - new Date(b.datePaiement || 0)) * dir;
                case 'client':
                    return (a.nomClient || '').localeCompare(
                        b.nomClient || '', 'fr', { sensitivity: 'base' }
                    ) * dir;
                case 'statut':
                    return (a.statut || '').localeCompare(
                        b.statut || '', 'fr', { sensitivity: 'base' }
                    ) * dir;
                default:
                    return 0;
            }
        });
    }, [paiements, sortConfig]);

    // ── Helper icône de tri ───────────────────────────────────────────────────
    const sortIcon = (key) => (
        <span className={`sort-icon ${sortConfig.key === key ? 'sort-active' : 'sort-inactive'}`}>
            {sortConfig.key === key
                ? (sortConfig.direction === 'asc' ? '↑' : '↓')
                : '⇅'}
        </span>
    );

    const sortLabel = (key, label) => (
        <span
            className="table-sort-header"
            onClick={() => handleSort(key)}
        >
            <span>{label}</span>
            {sortIcon(key)}
        </span>
    );

    // ── Colonnes ──────────────────────────────────────────────────────────────
    const columns = [
        {
            key:      'numero',
            label:    COLUMN_LABELS.NUMERO,
            flex:     '0 0 90px',
            minWidth: '90px',
            maxWidth: '90px',
            render:   (p) => p.numeroPaiement,
        },
        {
            key:      'date',
            label:    sortLabel('date', COLUMN_LABELS.DATE),
            flex:     '0 0 150px',
            minWidth: '150px',
            render:   (p) => formatDate(p.datePaiement, 'date'),
        },
        {
            key:      'client',
            label:    sortLabel('client', COLUMN_LABELS.CLIENT),
            flex:     '1',
            minWidth: '130px',
            render:   (p) => p.nomClient,
        },
        {
            key:      'montant',
            label:    COLUMN_LABELS.MONTANT,
            flex:     '0 0 12%',
            minWidth: '110px',
            align:    'right',
            render:   (p) => `${formatMontant(parseFloat(p.montantPaye || 0))} CHF`,
        },
        {
            key:      'statut',
            label:    sortLabel('statut', COLUMN_LABELS.STATUT),
            flex:     '0 0 10%',
            minWidth: '90px',
            render:   (p) => (
                <span className={getBadgeClasses(p.statut)}>
                    {formatEtatText(p.statut)}
                </span>
            ),
        },
        {
            key:       'actions',
            label:     '',
            flex:      '0 0 130px',
            minWidth:  '130px',
            maxWidth:  '130px',
            className: 'actions-cell',
            render:    (p) => {
                const isAnnule = p.statut === 'annule';
                return (
                    <>
                        <button className="bouton-action" title="Voir"
                            onClick={(e) => { e.stopPropagation(); onAfficherPaiement(p.idPaiement); }}>
                            <FiEye className="action-view-icon" />
                        </button>
                        {!isAnnule && <>
                            <button className="bouton-action" title="Modifier"
                                onClick={(e) => { e.stopPropagation(); onModifierPaiement(p.idPaiement); }}>
                                <FiEdit className="action-edit-icon" />
                            </button>
                            <button
                                className={`bouton-action${isProcessing ? ' bouton-desactive' : ''}`}
                                title="Annuler" disabled={isProcessing}
                                onClick={(e) => { e.stopPropagation(); onAnnulerPaiement(p); }}>
                                <FiX className="action-cancel-icon" />
                            </button>
                        </>}
                    </>
                );
            },
        },
    ];

    log.debug(`Affichage de ${paiements?.length ?? 0} paiements`);

    return (
        <UnifiedTable
            columns={columns}
            data={sortedPaiements}
            selectedId={paiementSelectionne}
            onRowClick={(p) => onSelectPaiement(p.idPaiement)}
            isLoading={isLoading}
            error={error}
            emptyMessage="Aucun paiement trouvé."
            getRowId={(p) => p.idPaiement}
        />
    );
}

export default PaiementsTableau;