import React from 'react';
import { formatMontant } from '../../../utils/formatters';
import { SECTION_TITLES, LABELS } from '../../../constants/paiementConstants';

const PaiementFormFactureSection = ({ 
    isCreate, 
    paiement, 
    onInputChange, 
    factures, 
    facturesLoading, 
    factureSelectionnee 
}) => {
    return (
        <div className="form-section">
            <h3>{SECTION_TITLES.FACTURE}</h3>
            
            <div className="form-row">
                <div className="input-group">
                    {isCreate ? (
                        <>
                            <select
                                id="idFacture"
                                value={paiement.idFacture}
                                onChange={(e) => onInputChange('idFacture', e.target.value)}
                                required
                                disabled={facturesLoading}
                            >
                                <option value="">Sélectionner une facture</option>
                                {factures.map(facture => {
                                    const montantRestant = facture.montantRestant || 
                                        (facture.totalAvecRistourne ? 
                                            facture.totalAvecRistourne - (facture.montantPayeTotal || 0) :
                                            facture.montantTotal - (facture.montantPayeTotal || 0)
                                        );
                                    
                                    return (
                                        <option key={facture.id} value={facture.id}>
                                            {facture.numeroFacture} - {facture.client.prenom} {facture.client.nom} 
                                            ({formatMontant(montantRestant)} CHF à payer)
                                        </option>
                                    );
                                })}
                            </select>
                            <label htmlFor="idFacture" className="required">{LABELS.FACTURE}</label>
                        </>
                    ) : (
                        <>
                            <input
                                type="text"
                                value={factureSelectionnee ? 
                                    `${factureSelectionnee.numeroFacture} - ${factureSelectionnee.client?.prenom} ${factureSelectionnee.client?.nom}` 
                                    : 'Chargement...'
                                }
                                readOnly
                                placeholder=" "
                            />
                            <label>{LABELS.FACTURE}</label>
                        </>
                    )}
                </div>
            </div>
            
            {factureSelectionnee && (
                <div className="facture-details">
                    <div className="details-row">
                        <span>{LABELS.MONTANT_TOTAL}:</span>
                        <span>{formatMontant(factureSelectionnee.totalAvecRistourne || factureSelectionnee.totalFacture)} CHF</span>
                    </div>
                    <div className="details-row">
                        <span>{LABELS.DEJA_PAYE}:</span>
                        <span>{formatMontant(factureSelectionnee.montantPayeTotal || 0)} CHF</span>
                    </div>
                    <div className="details-row">
                        <span>{LABELS.MONTANT_RESTANT}:</span>
                        <span className="montant-restant">
                            {formatMontant(
                                factureSelectionnee.montantRestant || 
                                (factureSelectionnee.totalAvecRistourne || factureSelectionnee.totalFacture) - (factureSelectionnee.montantPayeTotal || 0)
                            )} CHF
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaiementFormFactureSection;