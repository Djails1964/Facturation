// src/components/paiements/sections/PaiementFormOnglets.jsx
// Onglets Facture | Loyer pour le mode CREATE uniquement

import React from 'react';

const PaiementFormOnglets = ({ typeOnglet, onChangeOnglet }) => {
    return (
        <div className="pf-onglets">
            <button
                type="button"
                className={`pf-onglet${typeOnglet === 'facture' ? ' pf-onglet--actif' : ''}`}
                onClick={() => onChangeOnglet('facture')}
            >
                <span className="pf-onglet__icone">📄</span>
                Facture
            </button>
            <button
                type="button"
                className={`pf-onglet${typeOnglet === 'loyer' ? ' pf-onglet--actif' : ''}`}
                onClick={() => onChangeOnglet('loyer')}
            >
                <span className="pf-onglet__icone">🏠</span>
                Loyer
            </button>
        </div>
    );
};

export default PaiementFormOnglets;