// src/components/paiements/sections/PaiementFormFactureSection.jsx

import React from 'react';
import { formatMontant } from '../../../utils/formatters';
import { LABELS } from '../../../constants/paiementConstants';

const PaiementFormFactureSection = ({
    isCreate,
    paiement,
    onInputChange,
    factures,
    facturesLoading,
    factureSelectionnee,
    clients,
    clientsLoading,
    clientSelectionne,
    hideClientSelect = false,  // true = le select client est géré par le composant parent
    hideFactureSelect = false, // true = le select facture est géré par les onglets
}) => {

    // Factures déjà filtrées par le hook (chargerFacturesDuClient),
    // filtre local de sécurité supplémentaire
    const facturesFiltrees = React.useMemo(() => {
        if (!isCreate || !paiement.idClient) return factures || [];
        return (factures || []).filter(facture => {
            const factureClientId = String(
                facture.client?.id || facture.client?.idClient || facture.idClient || ''
            );
            return factureClientId === String(paiement.idClient);
        });
    }, [isCreate, factures, paiement.idClient]);

    return (
        <div className="form-section">

            {/* ── MODE CRÉATION ── */}
            {isCreate ? (
                <>
                    {/* Étape 1 : sélection du client (masquée si le parent la gère) */}
                    {!hideClientSelect && (
                        <div className="form-row">
                            <div className="input-group">
                                <select
                                    id="idClient"
                                    value={paiement.idClient || ''}
                                    onChange={(e) => onInputChange('idClient', e.target.value)}
                                    required
                                    disabled={clientsLoading}
                                >
                                    <option value="">
                                        {clientsLoading ? 'Chargement…' : '— Sélectionner un client —'}
                                    </option>
                                    {(clients || []).map(client => {
                                        const clientId = client.id || client.idClient;
                                        if (!clientId) return null;
                                        const nomComplet = `${client.prenom || ''} ${client.nom || ''}`.trim();
                                        return (
                                            <option key={clientId} value={clientId}>
                                                {nomComplet || 'Client sans nom'}
                                            </option>
                                        );
                                    }).filter(Boolean)}
                                </select>
                                <label htmlFor="idClient" className="required">Client</label>
                            </div>
                        </div>
                    )}

                    {/* Étape 2 : sélection de la facture (masquée si gérée par les onglets) */}
                    {paiement.idClient && !hideFactureSelect && (
                        <div className="form-row">
                            <div className="input-group">
                                <select
                                    id="idFacture"
                                    value={paiement.idFacture || ''}
                                    onChange={(e) => onInputChange('idFacture', e.target.value)}
                                    disabled={facturesLoading}
                                    required
                                >
                                    <option value="">
                                        {facturesLoading
                                            ? 'Chargement…'
                                            : facturesFiltrees.length === 0
                                                ? 'Aucune facture impayée'
                                                : '— Sélectionner une facture —'}
                                    </option>
                                    {facturesFiltrees.map(facture => {
                                        const factureId = facture.id || facture.idFacture;
                                        if (!factureId) return null;
                                        const montantRestant = facture.montantRestant ||
                                            (facture.totalAvecRistourne
                                                ? facture.totalAvecRistourne - (facture.montantPayeTotal || 0)
                                                : facture.montantTotal - (facture.montantPayeTotal || 0));
                                        return (
                                            <option key={factureId} value={factureId}>
                                                {`${facture.numeroFacture} (${formatMontant(montantRestant)} CHF à payer)`}
                                            </option>
                                        );
                                    }).filter(Boolean)}
                                </select>
                                <label htmlFor="idFacture" className="required">{LABELS.FACTURE}</label>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                /* ── MODE AFFICHAGE (consultation / modification) ── */
                <>
                    {/* Client */}
                    <div className="form-row">
                        <div className="input-group">
                            <input
                                type="text"
                                value={paiement.nomClient || 'Client non trouvé'}
                                readOnly
                                placeholder=" "
                            />
                            <label>Client</label>
                        </div>
                    </div>

                    {/* Facture liée */}
                    {paiement.idFacture && (
                        <div className="form-row">
                            <div className="input-group">
                                <input
                                    type="text"
                                    value={factureSelectionnee
                                        ? factureSelectionnee.numeroFacture
                                        : 'Facture non trouvée'}
                                    readOnly
                                    placeholder=" "
                                />
                                <label>{LABELS.FACTURE}</label>
                            </div>
                        </div>
                    )}

                    {/* Aucune facture liée */}
                    {!paiement.idFacture && (
                        <div className="form-row">
                            <div className="input-group">
                                <input
                                    type="text"
                                    value="Aucune facture liée"
                                    readOnly
                                    placeholder=" "
                                />
                                <label>{LABELS.FACTURE}</label>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default PaiementFormFactureSection;