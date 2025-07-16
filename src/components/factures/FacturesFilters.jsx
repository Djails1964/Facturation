// src/components/factures/FacturesFilters.jsx

import React, { useState } from 'react';
import '../../styles/components/factures/FacturesFilters.css';
import { FiClock } from 'react-icons/fi';

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
    etats,
    onMettreAJourRetards
}) => {
    const [tooltipVisible, setTooltipVisible] = useState(false);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

    const handleMouseEnter = (e) => {
        setTooltipVisible(true);
        updateTooltipPosition(e);
    };

    const handleMouseMove = (e) => {
        if (tooltipVisible) {
            updateTooltipPosition(e);
        }
    };

    const handleMouseLeave = () => {
        setTooltipVisible(false);
    };

    const updateTooltipPosition = (e) => {
        setTooltipPosition({
            x: e.clientX,
            y: e.clientY - 40 // Position au-dessus du curseur
        });
    };

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
                    <div className="lf-action-buttons-container">
                        <button 
                            className="bouton-action"
                            aria-label="Mettre à jour les factures en retard"
                            onClick={onMettreAJourRetards}
                            onMouseEnter={handleMouseEnter}
                            onMouseMove={handleMouseMove}
                            onMouseLeave={handleMouseLeave}
                        >
                            <FiClock size={16} color="#800020" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Tooltip utilisant le système de buttons.css */}
            {tooltipVisible && (
                <div 
                    className="cursor-tooltip"
                    style={{
                        left: tooltipPosition.x,
                        top: tooltipPosition.y
                    }}
                >
                    Mettre à jour les factures en retard
                </div>
            )}
        </div>
    );
};

export default FacturesFilters;