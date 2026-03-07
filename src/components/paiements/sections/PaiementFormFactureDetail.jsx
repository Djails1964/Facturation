// src/components/paiements/sections/PaiementFormFactureDetail.jsx
// Détail de la facture liée au paiement — affiché en EDIT/VIEW uniquement.
//
// Reprend exactement le bloc "Détails de la facture" extrait de
// PaiementFormPaiementSection (lignes 209-263 de l'ancienne version).
// Classes CSS unifiées : .form-section, .facture-details, .details-row, .montant-restant

import React from 'react';
import DateService from '../../../utils/DateService';
import { formatMontant } from '../../../utils/formatters';

const PaiementFormFactureDetail = ({ factureSelectionnee }) => {
    if (!factureSelectionnee) return null;

    const montantTotal = factureSelectionnee.totalAvecRistourne
        || factureSelectionnee.montantTotal
        || 0;
    const montantPaye     = factureSelectionnee.montantPayeTotal || 0;
    const montantRestant  = factureSelectionnee.montantRestant != null
        ? factureSelectionnee.montantRestant
        : montantTotal - montantPaye;

    // Nom du client depuis la facture (si présent dans l'objet)
    const nomClient = factureSelectionnee.client
        ? `${factureSelectionnee.client.prenom || ''} ${factureSelectionnee.client.nom || ''}`.trim()
        : null;

    return (
        <div className="form-section">
            <div className="facture-details">
                <h4>Détails de la facture</h4>

                <div className="details-row">
                    <span>N° Facture</span>
                    <span>{factureSelectionnee.numeroFacture || '—'}</span>
                </div>

                {nomClient && (
                    <div className="details-row">
                        <span>Client</span>
                        <span>{nomClient}</span>
                    </div>
                )}

                <div className="details-row">
                    <span>Date facture</span>
                    <span>
                        {factureSelectionnee.dateFacture
                            ? DateService.formatSingleDate(factureSelectionnee.dateFacture)
                            : '—'}
                    </span>
                </div>

                <div className="details-row">
                    <span>Montant total</span>
                    <span>{formatMontant(montantTotal)} CHF</span>
                </div>

                {montantPaye > 0 && (
                    <div className="details-row">
                        <span>Déjà payé</span>
                        <span>{formatMontant(montantPaye)} CHF</span>
                    </div>
                )}

                <div className="details-row">
                    <span>Reste à payer</span>
                    <span className="montant-restant">
                        {formatMontant(montantRestant)} CHF
                    </span>
                </div>
            </div>
        </div>
    );
};

export default PaiementFormFactureDetail;