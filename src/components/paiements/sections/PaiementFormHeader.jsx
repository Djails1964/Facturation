import React from 'react';
import { getBadgeClasses, formatEtatText } from '../../../utils/formatters';

const PaiementFormHeader = ({ titre, etat }) => {
    const getEtatBadgeClass = (etat) => {
        return getBadgeClasses(etat, 'normal');
    };

    return (
        <div className="content-section-title">
            <h2>{titre}</h2>
        </div>
    );
};

export default PaiementFormHeader;