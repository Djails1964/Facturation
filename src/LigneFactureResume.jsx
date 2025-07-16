import React from 'react';
import './LigneFactureResume.css';

const LigneFactureResume = ({ 
  serviceType, // Contient le nom du service, pas le code
  unite,      // Contient le nom de l'unité, pas le code
  description, 
  quantite, 
  prixUnitaire, 
  total
}) => {
  // Formater le montant en francs suisses
  const formatCurrency = (montant) => {
    const valeur = parseFloat(montant) || 0;
    return new Intl.NumberFormat('fr-CH', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    }).format(valeur);
  };

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
          {quantite} × {formatCurrency(prixUnitaire)} CHF
        </div>
        <div className="ligne-facture-resume-total">
          {formatCurrency(total)} CHF
        </div>
      </div>
    </div>
  );
};

export default LigneFactureResume;