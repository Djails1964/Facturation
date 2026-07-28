import React, { useState, useRef } from 'react';
import { formatMontant } from '../../../utils/formatters';

// Import du CSS spécifique
import '../../../styles/components/factures/LigneFactureResume.css';

/**
 * Composant de résumé pour une ligne de facture
 * Affiche un aperçu concis des détails de la ligne
 */
const LigneFactureResume = ({ 
    serviceType, 
    unite, 
    description, 
    quantite, 
    prixUnitaire, 
    totalLigne,
    // ✅ Modification restreinte (facture liée à un loyer) : seule la
    // description reste éditable, directement dans le bloc résumé —
    // évite d'obliger l'utilisateur à ouvrir la ligne pour ne rien y trouver
    // d'autre à modifier. Complètement indépendant du pipeline habituel
    // (useFactureLignes) — voir FactureForm.jsx.
    descriptionEditable = false,
    descriptionOverride = null,
    onDescriptionChange = null,
}) => {
    const valeurDescriptionAffichee = descriptionOverride ?? description ?? '';
    const [isFocused, setIsFocused] = useState(false);
    // Id stable (une seule fois) pour lier le label à l'input
    const inputId = useRef(`ligne-resume-description-${Math.random().toString(36).slice(2)}`).current;

    return (
        <div className="ligne-facture-resume">
            <div className="ligne-resume-header">
                <span className="ligne-resume-service">{serviceType}</span>
                {unite && <span className="ligne-resume-unite">({unite})</span>}
            </div>
            
            {descriptionEditable ? (
                // ✅ Reprend exactement le style des autres champs (ligne du bas +
                // label flottant) via les classes fdf_floating-label-input déjà
                // définies dans FactureDetailsForm.css (héritées via le wrapper
                // .fdf_facture-details-form parent), pour un rendu identique.
                <div
                    className={`fdf_floating-label-input ${isFocused ? 'fdf_focused' : ''} ${valeurDescriptionAffichee ? 'has-value' : ''}`}
                    onClick={(e) => e.stopPropagation()}
                >
                    <input
                        type="text"
                        id={inputId}
                        value={valeurDescriptionAffichee}
                        onChange={(e) => onDescriptionChange && onDescriptionChange(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        placeholder=" "
                        required
                    />
                    <label htmlFor={inputId} className="required">Description</label>
                </div>
            ) : (
                <div className="ligne-resume-description">
                    {description && description.length > 50 
                        ? `${description.substring(0, 50)}...` 
                        : description}
                </div>
            )}
            
            <div className="ligne-resume-details">
                <div className="ligne-resume-quantite">
                    Qté : {quantite}
                </div>
                <div className="ligne-resume-prix">
                    Prix : {formatMontant(prixUnitaire)} CHF
                </div>
                <div className="ligne-resume-total">
                    Total : {formatMontant(totalLigne)} CHF
                </div>
            </div>
        </div>
    );
};

export default LigneFactureResume;