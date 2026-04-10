// src/components/factures/FactureRow.jsx

import React, { useRef, useEffect } from 'react';
import '../../styles/components/factures/FactureRow.css';
import FactureActions from './FactureActions';
import { formatDate } from '../../utils/formatters';
import { getBadgeClasses, formatEtatText, formatMontant } from '../../utils/formatters';

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
    
    const rowRef = useRef(null);
    
    // Scroll automatique vers la ligne surlignée
    useEffect(() => {
        if (isSelected && rowRef.current) {
            rowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [isSelected]);
    
    // Utiliser etatAffichage en priorité, puis etat en fallback
    const etatAUtiliser = facture.etatAffichage || facture.etat;
    
    return (
        <div ref={rowRef} className={`lf-table-row ${isSelected ? 'lf-selected' : ''}`}>
            <div 
                className="lf-table-cell lf-numero-cell"
                onClick={() => onSelectionFacture(facture.idFacture)}
            >
                {facture.numeroFacture}
            </div>
            <div 
                className="lf-table-cell lf-client-cell"
                onClick={() => onSelectionFacture(facture.idFacture)}
            >
                {`${facture.client.prenom} ${facture.client.nom}`}
            </div>
            <div 
                className="lf-table-cell lf-date-cell"
                onClick={() => onSelectionFacture(facture.idFacture)}
            >
                {formatDate(facture.dateFacture)}
            </div>
            <div 
                className="lf-table-cell lf-montant-cell"
                onClick={() => onSelectionFacture(facture.idFacture)}
            >
                {formatMontant(facture.montantTotal)}
            </div>
            <div 
                className="lf-table-cell lf-etat-cell"
                onClick={() => onSelectionFacture(facture.idFacture)}
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