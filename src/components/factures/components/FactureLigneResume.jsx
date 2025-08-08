import React from 'react';
import { formatMontant } from '../../../utils/formatters';

// Import du CSS spécifique
import '../../../styles/components/factures/FactureLigneResume.css';

/**
 * Composant de résumé pour une ligne de facture
 * Affiche un aperçu concis des détails de la ligne
 */
const FactureLigneResume = ({ 
    serviceType, 
    unite, 
    description, 
    quantite, 
    prixUnitaire, 
    total 
}) => {
    return (
        <div className="ligne-facture-resume">
            <div className="ligne-resume-header">
                <span className="ligne-resume-service">{serviceType}</span>
                {unite && <span className="ligne-resume-unite">({unite})</span>}
            </div>
            
            <div className="ligne-resume-description">
                {description && description.length > 50 
                    ? `${description.substring(0, 50)}...` 
                    : description}
            </div>
            
            <div className="ligne-resume-details">
                <div className="ligne-resume-quantite">
                    Qté : {quantite}
                </div>
                <div className="ligne-resume-prix">
                    Prix : {formatMontant(prixUnitaire)} CHF
                </div>
                <div className="ligne-resume-total">
                    Total : {formatMontant(total)} CHF
                </div>
            </div>
        </div>
    );
};

export default FactureLigneResume;