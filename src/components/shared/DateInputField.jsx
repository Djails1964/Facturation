// src/components/shared/DateInputField.jsx
// ✅ VERSION COMPLÈTE avec support multiselect (factures) ET single date (paiements)

import React, { useCallback } from 'react';
import { showDatePicker } from '../shared/modals/handlers/DatePickerModalHandler';
import { CalendarIcon } from '../ui/buttons';
import { getTodayIso, fromIsoString } from '../../utils/dateHelpers';
import {
    parseDatesFromCompact,
    formatDatesCompact,
    validateDatesString,
    formatCompactToDisplay,
} from '../../utils/formatters';

/**
 * Composant de champ de date avec modal picker unifié
 * ✅ Supporte:
 * - Multi-sélection avec format compact [09/16/23/30.01, ...] pour factures
 * - Single date avec format DD.MM.YYYY pour paiements
 */
const DateInputField = ({
    id,
    label,
    value = '',
    onChange,
    updateQuantity = null, // Callback pour mettre à jour la quantité automatiquement (factures)
    readOnly = false,
    maxLength = 100,
    showCharCount = false,
    placeholder = " ",
    required = false,
    multiSelect = true, // Par défaut, multi-sélection pour les factures
    className = ''
}) => {
    /**
     * Ouvrir la modal de sélection de dates
     */
    const handleOpenDateModal = useCallback(async (event) => {
        if (readOnly) return;

        try {
            // Créer une référence d'ancrage
            const anchorRef = React.createRef();
            if (event && event.currentTarget) {
                anchorRef.current = event.currentTarget;
            }

            // ✅ Parser les dates depuis le format approprié
            let initialDates = [];
            if (value && value.trim()) {
                try {
                    if (multiSelect) {
                        // Mode FACTURE: format compact [09/16/23/30.01, ...]
                        // parseDatesFromCompact retourne des objets Date → convertir en YYYY-MM-DD
                        initialDates = parseDatesFromCompact(value)
                            .map(d => d instanceof Date
                                ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
                                : d
                            );
                    } else {
                        // Mode PAIEMENT: format DD.MM.YYYY ou YYYY-MM-DD
                        // fromIsoString retourne un objet Date → convertir en YYYY-MM-DD
                        const dateObj = fromIsoString(value.trim().includes('.')
                            ? (() => { const [d,m,y] = value.trim().split('.'); return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`; })()
                            : value.trim());
                        if (dateObj instanceof Date && !isNaN(dateObj)) {
                            initialDates = [`${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`];
                        }
                    }
                } catch (error) {
                    initialDates = [];
                }
            }

            // Configuration de la modal
            const config = {
                initialDates: initialDates,
                multiSelect: multiSelect,
                minDate: multiSelect ? null : null,  // Factures: pas de restriction
                maxDate: multiSelect ? null : getTodayIso(), // Paiements: pas de dates futures
                title: multiSelect ? 'Sélectionner les dates' : 'Sélectionner une date',
                confirmText: 'Confirmer la sélection',
                context: multiSelect ? 'invoice' : 'payment',
                anchorRef: anchorRef
            };

            // Ouvrir la modal et attendre le résultat
            const result = await showDatePicker({ ...config, anchorRef: config.anchorRef });

            // Traitement du résultat
            if (result.action === 'confirm' && result.dates.length > 0) {
                
                if (multiSelect) {
                    // showDatePicker retourne des strings YYYY-MM-DD
                    // formatDatesCompact attend des Date[] → conversion nécessaire
                    const dateObjects = result.dates.map(iso => {
                        const [y, m, d] = iso.split('-').map(Number);
                        return new Date(y, m - 1, d);
                    });
                    const formattedDates = formatDatesCompact(dateObjects);

                    // Si updateQuantity est fourni (mode facture), il gère les deux champs
                    // en un seul setState atomique — on n'appelle PAS onChange séparément.
                    if (updateQuantity && typeof updateQuantity === 'function') {
                        updateQuantity(formattedDates, result.dates.length);
                    } else if (onChange && typeof onChange === 'function') {
                        // Mode sans quantité : simple mise à jour du champ dates
                        onChange(formattedDates);
                    }
                    
                } else {
                    // Mode PAIEMENT: Format DD.MM.YYYY
                    // result.dates[0] est une string YYYY-MM-DD → convertir en DD.MM.YYYY
                    const [y, m, d] = result.dates[0].split('-');
                    const formattedDate = `${d}.${m}.${y}`;

                    if (onChange && typeof onChange === 'function') {
                        onChange(formattedDate);
                    }
                }
            }

        } catch (error) {
            console.error('❌ Erreur lors de la sélection de dates:', error);
        }
    }, [readOnly, value, multiSelect, onChange, updateQuantity]);

    /**
     * Gestionnaire de changement manuel du champ
     */
    const handleInputChange = useCallback((e) => {
        if (readOnly) return;
        
        const newValue = maxLength ? e.target.value.slice(0, maxLength) : e.target.value;
        
        if (onChange && typeof onChange === 'function') {
            // Pour les changements manuels, créer un event-like object pour maintenir la compatibilité
            onChange({ target: { value: newValue } });
        }
    }, [readOnly, maxLength, onChange]);

    /**
     * ✅ Fonction pour valider le format spécifique (pour factures multiselect)
     */
    const validateSpecificFormat = useCallback((inputValue) => {
        if (!inputValue || inputValue.trim() === '') return true;
        if (!multiSelect) return true; // Pas de validation stricte pour single date
        
        const validation = validateDatesString(inputValue);
        return validation.isValid;
    }, [multiSelect]);

    /**
     * ✅ Afficher un aperçu lisible des dates (pour factures multiselect)
     */
    const getReadablePreview = useCallback(() => {
        if (!value || value.trim() === '' || !multiSelect) return '';
        
        try {
            return formatCompactToDisplay(value, 'count');
        } catch (error) {
            return '';
        }
    }, [value, multiSelect]);

    // Calculer les caractères restants
    const charactersUsed = (value || '').length;
    const charactersRemaining = maxLength ? maxLength - charactersUsed : null;
    
    // Déterminer si le champ a une valeur
    const hasValue = value !== undefined && value !== '';
    
    // Vérifier si le format est valide (seulement pour multiselect)
    const isValidFormat = validateSpecificFormat(value);

    return (
        <div className={`fdf_floating-label-input date-input-field ${hasValue ? 'has-value' : ''} ${!isValidFormat ? 'error' : ''} ${className}`}>
            <input
                type="text"
                id={id}
                value={value || ''}
                onChange={handleInputChange}
                onClick={readOnly ? undefined : handleOpenDateModal}
                readOnly={readOnly}
                className={`fdf_form-control ${readOnly ? '' : 'clickable'}`}
                placeholder={placeholder}
                maxLength={maxLength}
                required={required}
                style={{
                    cursor: readOnly ? 'default' : 'pointer',
                    paddingRight: readOnly ? '10px' : '35px' // Espace pour l'icône
                }}
            />
            
            <label htmlFor={id} className={required ? 'required' : ''}>
                {label}
            </label>
            
            {!readOnly && (
                <CalendarIcon
                    onClick={handleOpenDateModal}
                    className="date-input-icon"
                />
            )}
            
            {/* ✅ Compteur de caractères (pour factures multiselect) */}
            {showCharCount && maxLength && (
                <div 
                    className="char-count"
                    style={{
                        position: 'absolute',
                        right: '0',
                        bottom: multiSelect && !isValidFormat ? '-40px' : '-20px',
                        fontSize: '0.75rem',
                        color: charactersRemaining < 20 ? '#d32f2f' : '#666'
                    }}
                >
                    {charactersRemaining} caractère{charactersRemaining !== 1 ? 's' : ''} restant{charactersRemaining !== 1 ? 's' : ''}
                </div>
            )}
            
            {/* ✅ Message d'erreur de format (pour factures multiselect) */}
            {multiSelect && hasValue && !isValidFormat && (
                <div 
                    className="format-error-message"
                    style={{
                        position: 'absolute',
                        bottom: showCharCount ? '-35px' : '-18px',
                        left: '0',
                        fontSize: '0.75rem',
                        color: '#d32f2f',
                        zIndex: 1
                    }}
                >
                    Format attendu: [jj/jj.MM, jj/jj.MM] ex: [09/16/23.01, 15.02]
                </div>
            )}
            
            {/* ✅ Aide au format (pour factures multiselect) */}
            {multiSelect && !readOnly && !hasValue && (
                <div 
                    className="format-help"
                    style={{
                        position: 'absolute',
                        bottom: showCharCount ? '-35px' : '-18px',
                        left: '0',
                        fontSize: '0.7rem',
                        color: '#999',
                        fontStyle: 'italic'
                    }}
                >
                    Cliquez sur 📅 pour sélectionner des dates
                </div>
            )}
        </div>
    );
};

export default DateInputField;