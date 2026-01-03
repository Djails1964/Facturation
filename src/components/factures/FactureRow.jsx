// src/components/factures/FactureRow.jsx

import React from 'react';
import '../../styles/components/factures/FactureRow.css';
import FactureActions from './FactureActions';
import { formatMontant, formatDate } from '../../utils/formatters';
import { getBadgeClasses, formatEtatText } from '../../utils/formatters';

const FactureRow = ({
    facture,
    isSelected,
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
    
    // Utiliser etatAffichage en priorité, puis etat en fallback
    const etatAUtiliser = facture.etatAffichage || facture.etat;
    
    return (
        <div className={`lf-table-row ${isSelected ? 'lf-selected' : ''}`}>
            <div 
                className="lf-table-cell lf-numero-cell"
                onClick={() => onSelectionFacture(facture.id)}
            >
                {facture.numeroFacture}
            </div>
            <div 
                className="lf-table-cell lf-client-cell"
                onClick={() => onSelectionFacture(facture.id)}
            >
                {`${facture.client.prenom} ${facture.client.nom}`}
            </div>
            <div 
                className="lf-table-cell lf-date-cell"
                onClick={() => onSelectionFacture(facture.id)}
            >
                {formatDate(facture.dateFacture)}
            </div>
            <div 
                className="lf-table-cell lf-montant-cell"
                onClick={() => onSelectionFacture(facture.id)}
            >
                {formatMontant(facture.montantTotal)}
            </div>
            <div 
                className="lf-table-cell lf-etat-cell"
                onClick={() => onSelectionFacture(facture.id)}
            >
                <span className={getBadgeClasses(etatAUtiliser)}>
                    {formatEtatText(etatAUtiliser)}
                </span>
            </div>

            {/* Actions de la facture */}
            <FactureActions
                facture={facture}
                onAfficherFacture={onAfficherFacture}
                onModifierFacture={onModifierFacture}
                onImprimerFacture={onImprimerFacture}
                onCopierFacture={onCopierFacture}
                onEnvoyerFacture={onEnvoyerFacture}
                onPayerFacture={onPayerFacture}
                onSupprimerFacture={onSupprimerFacture}
                onSetNotification={onSetNotification}
            />
        </div>
    );
};

export default FactureRow;