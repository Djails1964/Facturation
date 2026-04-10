// src/components/shared/SectionTitle.jsx
//
// Composant de titre unifié pour toute l'application.
// Remplace : content-section-title, tarif-form-header/tarif-form-title, section-title
//
// Usage :
//   <SectionTitle>Gestion des factures</SectionTitle>
//   <SectionTitle compact>Informations du tarif</SectionTitle>
//   <SectionTitle actions={<button>...</button>}>Loyers</SectionTitle>

import React from 'react';

const SectionTitle = ({
    children,
    compact  = false,   // Variante compacte (formulaires imbriqués, tarifs…)
    actions  = null,    // Slot droite : boutons, badges, infos
    className = '',
    as: Tag  = 'h2',    // Balise sémantique : h1 | h2 | h3
}) => {
    const classes = [
        'content-section-title',
        compact ? 'compact'     : '',
        actions ? 'with-actions': '',
        className,
    ].filter(Boolean).join(' ');

    return (
        <div className={classes}>
            <div className="content-section-title__row">
                <Tag>{children}</Tag>
                {actions && (
                    <div className="content-section-title__actions">
                        {actions}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SectionTitle;