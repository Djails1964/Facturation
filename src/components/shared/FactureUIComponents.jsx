import React from 'react';
import { FiCopy, FiTrash, FiChevronUp, FiChevronDown, FiMove } from 'react-icons/fi';
import { formatMontant } from '../../utils/formatters';

/**
 * Composant pour l'en-tête du formulaire de facture
 */
export function FactureHeader({ title, tarifInfo, readOnly }) {
    return (
        <div className="fdf_lignes-detail-titre">
            {title}
            {tarifInfo && !readOnly && (
                <span className="fdf_tarif-info-badge">{tarifInfo}</span>
            )}
        </div>
    );
}

/**
 * Composant pour afficher le total général
 */
export function FactureTotal({ totalGeneral, currency = 'CHF', readOnly }) {
    if (readOnly) return null;
    
    return (
        <div className="fdf_total-general">
            <div className="fdf_total-label">Total général :</div>
            <div className="fdf_total-value">
                {formatMontant(totalGeneral)} {currency}
            </div>
        </div>
    );
}

/**
 * Composant pour le spinner de chargement
 */
export function LoadingSpinner({ message = "Chargement..." }) {
    return (
        <div className="fdf_loading-container">
            <div className="fdf_spinner"></div>
            <p>{message}</p>
        </div>
    );
}

/**
 * Composant pour les messages d'erreur
 */
export function ErrorMessage({ message, type = 'error' }) {
    return (
        <div className={`fdf_error-message ${type}`}>
            {message}
        </div>
    );
}

/**
 * Composant pour le bouton d'ajout de ligne
 */
export function AddLineButton({ onAdd, disabled = false }) {
    return (
        <div className="fdf_ajouter-ligne-container">
            <button 
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onAdd();
                }}
                className="btn-primary"
                disabled={disabled}
            >
                + Ajouter une ligne
            </button>
        </div>
    );
}

/**
 * Composant pour les actions sur une ligne de facture
 */
export function LigneFactureActions({
    index,
    readOnly,
    hasErrors,
    canDelete,
    isOpen,
    onCopy,
    onDelete,
    onToggle
}) {
    return (
        <div className="fdf_actions_container">
            {/* Boutons d'action en mode édition */}
            {!readOnly && isOpen && (
                <>
                    <button 
                        onClick={(e) => {
                            e.preventDefault();
                            onCopy();
                        }}
                        className="fdf_action_btn"
                        title="Copier la ligne"
                    >
                        <FiCopy strokeWidth={2} />
                    </button>

                    <button 
                        onClick={onDelete} 
                        className={`fdf_action_btn ${!canDelete ? 'fdf_disabled' : ''}`}
                        title={!canDelete ? "Au moins une ligne est requise" : "Supprimer la ligne"}
                        disabled={!canDelete}
                    >
                        <FiTrash strokeWidth={2} />
                    </button>
                </>
            )}

            {/* Bouton toggle - toujours présent */}
            <button 
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onToggle();
                }}
                className={`fdf_action_btn ${hasErrors ? 'fdf_has_error' : ''}`}
                title={
                    hasErrors 
                        ? "Cette ligne contient des erreurs" 
                        : isOpen 
                            ? "Fermer" 
                            : readOnly 
                                ? "Voir détails"
                                : "Ouvrir pour édition"
                }
            >
                {isOpen ? (
                    <FiChevronUp strokeWidth={2} />
                ) : (
                    <FiChevronDown strokeWidth={2} />
                )}
            </button>
        </div>
    );
}

/**
 * Composant pour la pastille avec numéro d'ordre
 */
export function OrderBadge({ number, draggable }) {
    const classes = [
        'fdf_order-badge',
        draggable && 'fdf_draggable'
    ].filter(Boolean).join(' ');

    return (
        <div 
            className={classes}
            title={draggable ? "Glisser pour déplacer" : ""}
        >
            {number}
            {draggable && <FiMove size={8} className="fdf_drag-icon" />}
        </div>
    );
}

/**
 * Composant pour un champ en lecture seule
 */
export function ReadOnlyField({ label, value, className = "" }) {
    // Formatage spécial pour les prix
    let displayValue = value;
    if (label === "Prix unitaire" || label === "Total") {
        if (typeof value === 'number') {
            displayValue = `${formatMontant(value)} CHF`;
        } else if (typeof value === 'string' && value.includes('CHF') && !value.includes(' CHF')) {
            displayValue = value.replace('CHF', ' CHF');
        }
    }
    
    return (
        <div className="fdf_readonly-field">
            <label>{label}</label>
            <div className={`fdf_field-value ${className ? 'fdf_' + className : ''}`}>
                {displayValue}
            </div>
        </div>
    );
}

/**
 * Composant pour les messages d'erreur de validation
 */
export function ValidationError({ message }) {
    if (!message) return null;
    
    return (
        <div className="fdf_error-message">
            {message}
        </div>
    );
}

/**
 * Composant pour le compteur de caractères
 */
export function CharacterCounter({ 
    current, 
    max, 
    warningThreshold = 20,
    style = {} 
}) {
    const remaining = max - current;
    const isWarning = remaining < warningThreshold;
    
    const defaultStyle = {
        position: 'absolute',
        right: '0',
        bottom: '-20px',
        fontSize: '0.75rem',
        color: isWarning ? '#d32f2f' : '#666',
        ...style
    };

    return (
        <div className="fdf_char-limit-info" style={defaultStyle}>
            {remaining} caractère{remaining !== 1 ? 's' : ''} restant{remaining !== 1 ? 's' : ''}
        </div>
    );
}

/**
 * Composant pour les indicateurs d'état
 */
export function StatusIndicator({ type, message, onClick }) {
    const classes = {
        error: 'fdf_error-indicator',
        warning: 'fdf_warning-indicator',
        success: 'fdf_success-indicator',
        info: 'fdf_info-indicator'
    };

    return (
        <div 
            className={classes[type] || classes.info}
            onClick={onClick}
            style={{ cursor: onClick ? 'pointer' : 'default' }}
        >
            <span>{message}</span>
        </div>
    );
}