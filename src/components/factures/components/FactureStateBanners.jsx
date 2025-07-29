import React from 'react';
import { FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { FORM_MODES } from '../../../constants/factureConstants';
// ✅ AJOUT: Import du formatter centralisé
import { formatDate } from '../../../utils/formatters';

export const FactureStateBanners = ({ mode, facture }) => {
  if (mode !== FORM_MODES.VIEW) return null;

  return (
    <>
      {facture.etat === 'Annulée' && facture.date_annulation && (
        <div className="ff-facture-annulee-banner">
          <FiAlertCircle size={20} />
          <span>Facture annulée le {formatDate(facture.date_annulation)}</span>
        </div>
      )}

      {facture.etat === 'Payée' && facture.date_paiement && (
        <div className="ff-facture-payee-banner">
          <FiCheckCircle size={20} />
          <span>Facture payée le {formatDate(facture.date_paiement)}</span>
        </div>
      )}
    </>
  );
};