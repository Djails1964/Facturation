import React from 'react';
import '../../../styles/components/factures/LigneFactureResume.css';
import { formatMontant } from '../../../utils/formatters';

const LigneFactureResume = ({ 
  serviceType, // Contient le nom du service, pas le code
  unite,      // Contient le nom de l'unité, pas le code
  description, 
  quantite, 
  prixUnitaire, 
  totalLigne
}) => {

  return (
    <div className="ligne-facture-resume">
      <div className="ligne-facture-resume-details">
        <div className="ligne-facture-resume-titre">
          {serviceType} - {unite}
        </div>
        <div className="ligne-facture-resume-description">
          {description}
        </div>
      </div>
      <div className="ligne-facture-resume-montants">
        <div className="ligne-facture-resume-calcul">
          {quantite} × {formatMontant(prixUnitaire)} CHF
        </div>
        <div className="ligne-facture-resume-total">
          {formatMontant(totalLigne)} CHF
        </div>
      </div>
    </div>
  );
};

export default LigneFactureResume;