export const getTitreFormulaire = (mode) => {
  switch (mode) {
    case 'create': return "Nouvelle facture";
    case 'edit': return "Modification de facture";
    case 'view': return "Détail de facture";
    default: return "Facture";
  }
};

export const getFormContainerClass = (mode) => {
  switch (mode) {
    case 'create': return "nouvelle-facture-form";
    case 'edit': return "modifier-facture-form";
    case 'view': return "afficher-facture-form";
    default: return "facture-form";
  }
};

export const getSubmitButtonText = (mode) => {
  switch (mode) {
    case 'create': return "Créer facture";
    case 'edit': return "Modifier facture";
    default: return "Enregistrer";
  }
};