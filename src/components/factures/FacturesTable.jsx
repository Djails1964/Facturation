// src/components/factures/FacturesTable.jsx

import React from 'react';
import '../../styles/components/factures/FacturesTable.css';
import FactureRow from './FactureRow';

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
    return (
        <div className="factures-table">
            {/* En-tête du tableau */}
            <div className="lf-table-header">
                <div className="lf-header-cell lf-numero-cell">Numéro de facture</div>
                <div className="lf-header-cell lf-client-cell">Client</div>
                <div className="lf-header-cell lf-montant-cell">Montant (CHF)</div>
                <div className="lf-header-cell lf-etat-cell">État</div>
                <div className="lf-header-cell lf-actions-cell"></div>
            </div>

            {/* Corps du tableau */}
            <div className="lf-table-body">
                {isLoading ? (
                    <div className="lf-loading-message">Chargement des factures...</div>
                ) : error ? (
                    <div className="lf-error-message">{error}</div>
                ) : factures.length === 0 ? (
                    <div className="lf-empty-message">Aucune facture trouvée</div>
                ) : (
                    factures.map(facture => (
                        <FactureRow
                            key={facture.id}
                            facture={facture}
                            isSelected={factureSelectionnee === facture.id}
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