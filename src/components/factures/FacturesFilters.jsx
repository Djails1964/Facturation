// src/components/factures/FacturesFilters.jsx

import React from 'react';
import '../../styles/components/factures/FacturesFilters.css';

const FacturesFilters = ({
    anneeSelectionnee,
    clientSelectionne,
    etatSelectionne,
    handleAnneeChange,
    handleClientChange,
    handleEtatChange,
    anneesOptions,
    clients,
    isLoadingClients,
    etats
}) => {
    return (
        <div className="factures-table">
            <div className="lf-filters-row">
                <div className="lf-filter-cell lf-numero-cell">
                    <select
                        id="anneeFactures"
                        value={anneeSelectionnee}
                        onChange={handleAnneeChange}
                    >
                        {anneesOptions?.map(annee => (
                            <option key={annee} value={annee}>{annee}</option>
                        )) || []}
                    </select>
                    <label htmlFor="anneeFactures">Année des factures</label>
                </div>
                
                <div className="lf-filter-cell lf-client-cell">
                    <select
                        id="clientFactures"
                        value={clientSelectionne}
                        onChange={handleClientChange}
                        disabled={isLoadingClients}
                    >
                        <option value="">Tous les clients</option>
                        {clients?.map(client => (
                            <option key={client.id} value={client.id}>
                                {`${client.prenom} ${client.nom}`}
                            </option>
                        )) || []}
                    </select>
                    <label htmlFor="clientFactures">Client</label>
                </div>
                
                <div className="lf-filter-cell lf-montant-cell">
                    {/* Cellule vide sans aucun contenu */}
                </div>
                
                <div className="lf-filter-cell lf-etat-cell">
                    <select
                        id="etatFactures"
                        value={etatSelectionne}
                        onChange={handleEtatChange}
                    >
                        <option value="">Tous les états</option>
                        {etats?.filter(etat => etat !== 'Tous').map(etat => (
                            <option key={etat} value={etat}>{etat}</option>
                        )) || []}
                    </select>
                    <label htmlFor="etatFactures">État</label>
                </div>
                
                <div className="lf-filter-cell lf-actions-cell">
                    {/* ✅ SUPPRIMÉ: Bouton de mise à jour des retards (maintenant calculé dynamiquement) */}
                </div>
            </div>
        </div>
    );
};

export default FacturesFilters;