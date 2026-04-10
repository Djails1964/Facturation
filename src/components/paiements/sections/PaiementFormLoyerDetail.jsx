// src/components/paiements/sections/PaiementFormLoyerDetail.jsx
// Détail du loyer lié au paiement — affiché en EDIT/VIEW uniquement.
//
// Reprend exactement le bloc "Détails du loyer" extrait de
// PaiementFormPaiementSection (lignes 265-375 de l'ancienne version).
// Classes CSS unifiées : .form-section, .facture-details, .details-row, .montant-restant

import React from 'react';
import { formatMontant, formatDate } from '../../../utils/formatters';

const PaiementFormLoyerDetail = ({ paiement = {} }) => {
    if (!paiement.idLoyer) return null;

    const montantTotal = paiement.loyerMontantTotal;
    const montantPaye  = paiement.loyerMontantPaye;
    const resteAPayer  = montantTotal != null && montantPaye != null
        ? Math.max(0, montantTotal - montantPaye)
        : null;

    const periodeDebut = paiement.periodeDebut
        ? formatDate(paiement.periodeDebut, 'date')
        : '—';
    const periodeFin = paiement.periodeFin
        ? formatDate(paiement.periodeFin, 'date')
        : '—';

    return (
        <div className="form-section">
            <div className="facture-details">
                <h4>Détails du loyer</h4>

                {/* ── Identité ── */}
                <div className="details-row">
                    <span>N° Loyer</span>
                    <span>{paiement.numeroLoyer || '—'}</span>
                </div>

                <div className="details-row">
                    <span>Période</span>
                    <span>{periodeDebut} → {periodeFin}</span>
                </div>

                {paiement.loyerStatut && (
                    <div className="details-row">
                        <span>Statut</span>
                        <span style={{ textTransform: 'capitalize' }}>{paiement.loyerStatut}</span>
                    </div>
                )}

                {/* ── Montants globaux ── */}
                {paiement.montantMensuelMoyen != null && (
                    <div className="details-row">
                        <span>Montant mensuel</span>
                        <span>{formatMontant(paiement.montantMensuelMoyen)} CHF</span>
                    </div>
                )}

                {montantTotal != null && (
                    <div className="details-row">
                        <span>Total loyer ({paiement.dureeMois || '—'} mois)</span>
                        <span>{formatMontant(montantTotal)} CHF</span>
                    </div>
                )}

                {montantPaye != null && (
                    <div className="details-row">
                        <span>Total déjà payé</span>
                        <span>{formatMontant(montantPaye)} CHF</span>
                    </div>
                )}

                {resteAPayer != null && (
                    <div className="details-row">
                        <span>Reste à payer</span>
                        <span className="montant-restant">
                            {formatMontant(resteAPayer)} CHF
                        </span>
                    </div>
                )}

                {/* ── Mois concerné par CE paiement ── */}
                {paiement.idLoyerDetail && (
                    <>
                        <div className="details-row" style={{
                            marginTop: '12px',
                            paddingTop: '12px',
                            borderTop: '1px solid #dee2e6',
                        }}>
                            <span style={{ fontWeight: 600, color: '#495057' }}>
                                Mois concerné par ce paiement
                            </span>
                        </div>

                        {(paiement.loyerMois || paiement.loyerAnnee) && (
                            <div className="details-row">
                                <span>Mois</span>
                                <span>
                                    {[paiement.loyerMois, paiement.loyerAnnee].filter(Boolean).join(' ')}
                                </span>
                            </div>
                        )}

                        {paiement.loyerDetailMontant != null && (
                            <div className="details-row">
                                <span>Montant dû (mois)</span>
                                <span>{formatMontant(paiement.loyerDetailMontant)} CHF</span>
                            </div>
                        )}

                        {paiement.loyerDetailPaye != null && (
                            <div className="details-row">
                                <span>Payé sur ce mois</span>
                                <span>{formatMontant(paiement.loyerDetailPaye)} CHF</span>
                            </div>
                        )}

                        {paiement.loyerDetailMontant != null &&
                         paiement.loyerDetailPaye != null &&
                         paiement.loyerDetailPaye < paiement.loyerDetailMontant && (
                            <div className="details-row">
                                <span>Solde restant (mois)</span>
                                <span className="montant-restant">
                                    {formatMontant(paiement.loyerDetailMontant - paiement.loyerDetailPaye)} CHF
                                </span>
                            </div>
                        )}
                    </>
                )}

            </div>
        </div>
    );
};

export default PaiementFormLoyerDetail;