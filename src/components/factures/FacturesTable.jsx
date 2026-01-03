// src/components/factures/FacturesTable.jsx

import React, { useState, useMemo } from 'react';
import '../../styles/components/factures/FacturesTable.css';
import FactureRow from './FactureRow';
import { createLogger } from '../../utils/createLogger';

const FacturesTable = ({
    factures,
    isLoading,
    error,
    factureSelectionnee,
    onSelectionFacture,
    onAfficherFacture,
    onModifierFacture,
    onImprimerFacture,
    onCopierFacture,
    onEnvoyerFacture,
    onPayerFacture,
    onSupprimerFacture,
    onSetNotification
}) => {

    const log = createLogger("FacturesTable");

    // État du tri : colonne et direction
    const [sortConfig, setSortConfig] = useState({
        key: 'numeroFacture',
        direction: 'desc'
    });

    // Gérer le clic sur une colonne pour trier
    const handleSort = (key) => {
        setSortConfig(prevConfig => ({
            key,
            direction: prevConfig.key === key && prevConfig.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    // Trier les factures
    const sortedFactures = useMemo(() => {
        if (!factures || factures.length === 0) return [];

        const sorted = [...factures].sort((a, b) => {
            let aValue, bValue;

            switch (sortConfig.key) {
                case 'numeroFacture':
                    // Tri numérique sur le numéro de facture
                    aValue = parseInt(a.numeroFacture?.replace(/\D/g, '') || '0', 10);
                    bValue = parseInt(b.numeroFacture?.replace(/\D/g, '') || '0', 10);
                    break;
                case 'client':
                    // Tri alphabétique sur le nom complet du client
                    aValue = `${a.client?.prenom || ''} ${a.client?.nom || ''}`.toLowerCase();
                    bValue = `${b.client?.prenom || ''} ${b.client?.nom || ''}`.toLowerCase();
                    break;
                case 'dateFacture':
                    // Tri par date
                    aValue = new Date(a.dateFacture || 0).getTime();
                    bValue = new Date(b.dateFacture || 0).getTime();
                    break;
                case 'montant':
                    // Tri numérique sur le montant
                    aValue = parseFloat(a.montantTotal) || 0;
                    bValue = parseFloat(b.montantTotal) || 0;
                    break;
                case 'etat':
                    // Tri alphabétique sur l'état
                    aValue = (a.etatAffichage || a.etat || '').toLowerCase();
                    bValue = (b.etatAffichage || b.etat || '').toLowerCase();
                    break;
                default:
                    return 0;
            }

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return sorted;
    }, [factures, sortConfig]);

    // Générer l'icône de tri
    const getSortIcon = (key) => {
        if (sortConfig.key !== key) {
            return <span className="sort-icon sort-inactive">⇅</span>;
        }
        return sortConfig.direction === 'asc' 
            ? <span className="sort-icon sort-active">↑</span>
            : <span className="sort-icon sort-active">↓</span>;
    };

    log.debug("contenu de factures : ", factures);

    return (
        <div className="factures-table">
            {/* En-tête du tableau */}
            <div className="lf-table-header">
                <div 
                    className="lf-header-cell lf-numero-cell sortable"
                    onClick={() => handleSort('numeroFacture')}
                >
                    <span className="header-label">Numéro de facture</span> {getSortIcon('numeroFacture')}
                </div>
                <div 
                    className="lf-header-cell lf-client-cell sortable"
                    onClick={() => handleSort('client')}
                >
                    <span className="header-label">Client</span> {getSortIcon('client')}
                </div>
                <div 
                    className="lf-header-cell lf-date-cell sortable"
                    onClick={() => handleSort('dateFacture')}
                >
                    <span className="header-label">Date facture</span> {getSortIcon('dateFacture')}
                </div>
                <div 
                    className="lf-header-cell lf-montant-cell sortable"
                    onClick={() => handleSort('montant')}
                >
                    <span className="header-label">Montant (CHF)</span> {getSortIcon('montant')}
                </div>
                <div 
                    className="lf-header-cell lf-etat-cell sortable"
                    onClick={() => handleSort('etat')}
                >
                    <span className="header-label">État</span> {getSortIcon('etat')}
                </div>
                <div className="lf-header-cell lf-actions-cell"></div>
            </div>

            {/* Corps du tableau */}
            <div className="lf-table-body">
                {isLoading ? (
                    <div className="lf-loading-message">Chargement des factures...</div>
                ) : error ? (
                    <div className="lf-error-message">{error}</div>
                ) : sortedFactures.length === 0 ? (
                    <div className="lf-empty-message">Aucune facture trouvée</div>
                ) : (
                    sortedFactures.map(facture => (
                        <FactureRow
                            key={facture.idFacture}
                            facture={facture}
                            isSelected={factureSelectionnee === facture.idFacture}
                            onSelectionFacture={onSelectionFacture}
                            onAfficherFacture={onAfficherFacture}
                            onModifierFacture={onModifierFacture}
                            onImprimerFacture={onImprimerFacture}
                            onCopierFacture={onCopierFacture}
                            onEnvoyerFacture={onEnvoyerFacture}
                            onPayerFacture={onPayerFacture}
                            onSupprimerFacture={onSupprimerFacture}
                            onSetNotification={onSetNotification}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default FacturesTable;