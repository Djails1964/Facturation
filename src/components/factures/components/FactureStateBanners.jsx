import React from 'react';
import { ICONS } from '../../ui/buttons';
import { createLogger } from '../../../utils/createLogger';
import { FORM_MODES } from '../../../constants/factureConstants';
import { formatDate } from '../../../utils/formatters';

const log = createLogger('FactureStateBanners');

export const FactureStateBanners = ({ mode, facture }) => {
  if (mode !== FORM_MODES.VIEW) return null;

  return (
    <>
      {facture.etat === 'Annulée' && facture.date_annulation && (
        <div className="ff-facture-annulee-banner">
          <ICONS.ERROR size={20} />
          <span>Facture annulée le {formatDate(facture.date_annulation)}</span>
        </div>
      )}

      {facture.etat === 'Payée' && facture.date_paiement && (
        <div className="ff-facture-payee-banner">
          <ICONS.SUCCESS size={20} />
          <span>Facture payée le {formatDate(facture.date_paiement)}</span>
        </div>
      )}
    </>
  );
};