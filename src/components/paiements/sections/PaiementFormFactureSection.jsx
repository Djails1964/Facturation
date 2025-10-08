// src/components/paiements/sections/PaiementFormFactureSection.jsx
// Version corrigée qui utilise l'ID correct dans le select

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
    // 🔍 DEBUG - Logs au début du rendu
    console.log('🎯 PaiementFormFactureSection - Rendu avec:', {
        isCreate,
        facturesCount: factures?.length || 0,
        facturesLoading,
        paiementIdFacture: paiement?.idFacture,
        hasOnInputChange: !!onInputChange
    });

    // 🔍 DEBUG - Afficher les 3 premières factures
    if (factures && factures.length > 0) {
        console.log('📋 Premières factures disponibles:', factures.slice(0, 3));
    }

    return (
        <div className="form-section">
            <h3>{SECTION_TITLES.FACTURE}</h3>
            
            <div className="form-row">
                <div className="input-group">
                    {isCreate ? (
                        <>
                            <select
                                id="idFacture"
                                value={paiement.idFacture || ''}
                                onChange={(e) => {
                                    console.log('🔄 Select onChange - Valeur sélectionnée:', e.target.value);
                                    onInputChange('idFacture', e.target.value);
                                }}
                                required
                                disabled={facturesLoading}
                            >
                                <option value="">Sélectionner une facture</option>
                                {factures && factures.map(facture => {
                                    const factureId = facture.id || facture.idFacture;
                                    
                                    if (!factureId) {
                                        console.warn('⚠️ Facture sans ID:', facture);
                                        return null;
                                    }
                                    
                                    const montantRestant = facture.montantRestant || 
                                        (facture.totalAvecRistourne ? 
                                            facture.totalAvecRistourne - (facture.montantPayeTotal || 0) :
                                            facture.montantTotal - (facture.montantPayeTotal || 0)
                                        );
                                    
                                    const clientInfo = facture.client ? 
                                        `${facture.client.prenom} ${facture.client.nom}` : 
                                        'Client inconnu';
                                    const montantInfo = `(${formatMontant(montantRestant)} CHF à payer)`;
                                    
                                    const optionText = `${facture.numeroFacture} - ${clientInfo} ${montantInfo}`;
                                    
                                    // 🔍 DEBUG - Log pour chaque option
                                    console.log(`✅ Option créée: ${factureId} - ${optionText}`);
                                    
                                    return (
                                        <option 
                                            key={factureId} 
                                            value={factureId}
                                        >
                                            {optionText}
                                        </option>
                                    );
                                }).filter(Boolean)}
                            </select>
                            <label htmlFor="idFacture" className="required">{LABELS.FACTURE}</label>
                        </>
                    ) : (
                        <>
                            <input
                                type="text"
                                value={factureSelectionnee ?
                                    `${factureSelectionnee.numeroFacture} - ${factureSelectionnee.client?.prenom} ${factureSelectionnee.client?.nom}` : 
                                    'Facture non trouvée'
                                }
                                readOnly
                                placeholder=" "
                            />
                            <label>{LABELS.FACTURE}</label>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PaiementFormFactureSection;