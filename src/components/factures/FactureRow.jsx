// src/components/factures/FactureRow.jsx

import React from 'react';
import '../../styles/components/factures/FactureRow.css';
import FactureActions from './FactureActions';
import { formatMontant } from '../../utils/formatters';

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
    // Helper pour déterminer la classe CSS en fonction de l'état
    const getEtatClass = (etat) => {
        switch(etat.toLowerCase()) {
            case 'payée': return 'lf-etat-payee';
            case 'partiellement payée': return 'lf-etat-partiellement-payee'; // ✅ NOUVEAU
            case 'en attente': return 'lf-etat-attente';
            case 'éditée': return 'lf-etat-editee';
            case 'retard': return 'lf-etat-retard';
            case 'annulée': return 'lf-etat-annulee';
            case 'envoyée': return 'lf-etat-envoyee';
            default: return '';
        }
    };

    // ✅ NOUVEAU : Helper pour formater le texte d'affichage des états
    const formatEtatText = (etat) => {
        switch(etat.toLowerCase()) {
            case 'partiellement payée': return 'Part. Payée'; // ✅ TEXTE COURT
            default: return etat; // Garder le texte original pour les autres états
        }
    };

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
                className="lf-table-cell lf-montant-cell"
                onClick={() => onSelectionFacture(facture.id)}
            >
                {formatMontant(facture.montantTotal)}
            </div>
            <div 
                className="lf-table-cell lf-etat-cell"
                onClick={() => onSelectionFacture(facture.id)}
            >
                <span className={`lf-etat-badge ${getEtatClass(facture.etat)}`}>
                    {formatEtatText(facture.etat)} {/* ✅ UTILISE LE TEXTE FORMATÉ */}
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