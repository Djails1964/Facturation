// sections/PaiementsListeHeader.jsx
import React from 'react';
import { FiFilter } from 'react-icons/fi';

function PaiementsListeHeader({ 
    onNouveauPaiement, 
    showFilters, 
    onToggleFilters,
    totalPaiements = 0 
}) {
    return (
        <div className="paiements-header">
            <div className="paiements-header-left">
                <h2>Liste des paiements</h2>
                {totalPaiements > 0 && (
                    <span className="total-count">
                        {totalPaiements} paiement{totalPaiements > 1 ? 's' : ''}
                    </span>
                )}
            </div>
            
            <div className="paiements-header-actions">
                <button
                    onClick={onToggleFilters}
                    className={`btn-primary ${showFilters ? 'active' : ''}`}
                    title="Filtres"
                >
                    <FiFilter />
                    Filtres
                </button>
            </div>

            {/* ✅ BOUTON FLOTTANT ROUGE STANDARDISÉ */}
            <button
                onClick={onNouveauPaiement}
                className="floating-button"
                title="Nouveau paiement"
            >
                <span>+</span>
                <div className="floating-tooltip">
                    Nouveau paiement
                </div>
            </button>
        </div>
    );
}

export default PaiementsListeHeader;