export const validateFactureLines = (lignes) => {
  if (!lignes || lignes.length === 0) return false;

  return lignes.every(ligne => {
    const hasService = ligne.serviceType || ligne.idService || ligne.service;
    const hasUnite = ligne.unite || ligne.idUnite || ligne.uniteCode;
    
    return ligne.description?.trim() &&
           hasService &&
           hasUnite &&
           parseFloat(ligne.quantite) > 0 &&
           parseFloat(ligne.prixUnitaire) > 0;
  });
};

export const validateFactureForm = (facture, isLignesValid) => {
  return facture.numeroFacture &&
         facture.idClient &&
         facture.lignes?.length > 0 &&
         isLignesValid;
};