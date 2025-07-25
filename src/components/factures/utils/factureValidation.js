export const validateFactureLines = (lignes) => {
  if (!lignes || lignes.length === 0) return false;

  return lignes.every(ligne => {
    return ligne.description?.trim() &&
           ligne.serviceType &&
           ligne.unite &&
           parseFloat(ligne.quantite) > 0 &&
           parseFloat(ligne.prixUnitaire) > 0;
  });
};

export const validateFactureForm = (facture, isLignesValid) => {
  return facture.numeroFacture &&
         facture.clientId &&
         facture.lignes?.length > 0 &&
         isLignesValid;
};