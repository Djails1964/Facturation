import React from 'react';
import './LigneFactureResume.css';
import { formatMontant } from './utils/formatters';

const LigneFactureResume = ({ 
  serviceType, // Contient le nom du service, pas le code
  unite,      // Contient le nom de l'unité, pas le code
  description, 
  quantite, 
  prixUnitaire, 
  total
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
          {formatMontant(total)} CHF
        </div>
      </div>
    </div>
  );
};

export default LigneFactureResume;