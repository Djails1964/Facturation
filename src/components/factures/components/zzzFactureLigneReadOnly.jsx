import React from 'react';
import { formatMontant } from '../../../utils/formatters';

// Import du CSS spécifique
import '../../../styles/components/factures/FactureLigneReadOnly.css';

/**
 * Composant pour afficher une ligne de facture en mode lecture seule
 * Présente les détails de manière claire et structurée
 */
const FactureLigneReadOnly = ({
    index,
    serviceType,
    unite,
    description,
    descriptionDates,
    quantite,
    prixUnitaire,
    total,
    noOrdre
}) => {
    return (
        <div className="fdf_line-container fdf_readonly-mode">
            {/* Pastille de numéro d'ordre */}
            <div className="fdf_order-badge">
                {noOrdre || index + 1}
            </div>

            <div className="fdf_line-flex-container">
                {/* En-tête : Service et Unité */}
                <div className="fdf_table-row fdf_equal-columns">
                    <div className="fdf_table-cell fdf_service-col">
                        <div className="fdf_readonly-field">
                            <label>Type de service</label>
                            <div className="fdf_field-value">{serviceType}</div>
                        </div>
                    </div>
                    <div className="fdf_table-cell fdf_unite-col">
                        <div className="fdf_readonly-field">
                            <label>Unité</label>
                            <div className="fdf_field-value">{unite}</div>
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div className="fdf_table-row fdf_description-row">
                    <div className="fdf_table-cell fdf_description-col fdf_full-width">
                        <div className="fdf_readonly-field">
                            <label>Description</label>
                            <div className="fdf_field-value">{description}</div>
                        </div>
                    </div>
                </div>

                {/* Description des dates (si présente) */}
                {descriptionDates && (
                    <div className="fdf_table-row fdf_description-row">
                        <div className="fdf_table-cell fdf_description-col fdf_full-width">
                            <div className="fdf_readonly-field">
                                <label>Dates</label>
                                <div className="fdf_field-value">{descriptionDates}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Ligne numérique : Quantité, Prix unitaire, Total */}
                <div className="fdf_table-row fdf_numeric-row">
                    <div className="fdf_table-cell fdf_quantity-col">
                        <div className="fdf_readonly-field">
                            <label>Quantité</label>
                            <div className="fdf_field-value fdf_text-right">{quantite}</div>
                        </div>
                    </div>
                    <div className="fdf_table-cell fdf_price-col">
                        <div className="fdf_readonly-field">
                            <label>Prix unitaire</label>
                            <div className="fdf_field-value fdf_text-right">
                                {formatMontant(prixUnitaire)} CHF
                            </div>
                        </div>
                    </div>
                    <div className="fdf_table-cell fdf_total-col">
                        <div className="fdf_readonly-field">
                            <label>Total</label>
                            <div className="fdf_field-value fdf_text-right">
                                {formatMontant(total)} CHF
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FactureLigneReadOnly;