import React from 'react';
import { getBadgeClasses, formatEtatText } from '../../../utils/formatters';

const PaiementFormBadge = ({ etat }) => {
    if (!etat) return null;

    return (
        <div className="paiement-etat-badge-container">
            <span className={getBadgeClasses(etat, 'normal')}>
                {formatEtatText(etat)}
            </span>
        </div>
    );
};

export default PaiementFormBadge;