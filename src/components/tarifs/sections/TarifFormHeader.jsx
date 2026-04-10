// src/components/tarifs/TarifFormHeader.jsx
import React from 'react';
import SectionTitle from '../../shared/SectionTitle';

const TarifFormHeader = ({
    titre,
    description,
    children,   // Boutons d'actions
    className = ''
}) => {
    return (
        <SectionTitle
            compact
            actions={children ? <div className="tarif-form-actions">{children}</div> : null}
            className={className}
        >
            {titre}
        </SectionTitle>
    );
};

export default TarifFormHeader;