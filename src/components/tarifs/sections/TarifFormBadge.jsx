import React from 'react';

const TarifFormBadge = ({ isValid }) => {
    if (isValid === undefined) return null;
    
    return (
        <div className="tarif-form-badge">
            <span className={`status-badge ${isValid ? 'active' : 'inactive'}`}>
                {isValid ? 'Valide' : 'Invalide'}
            </span>
        </div>
    );
};

export default TarifFormBadge;