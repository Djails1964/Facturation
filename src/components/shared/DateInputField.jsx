// src/components/shared/DateInputField.jsx
// ✅ VERSION COMPLÈTE avec support multiselect (factures) ET single date (paiements)

import React, { useCallback } from 'react';
import { FiCalendar } from 'react-icons/fi';
import modalSystem from '../../utils/modalSystem';
import DatePickerModalHandler from '../shared/modals/handlers/DatePickerModalHandler';
import DateService from '../../utils/DateService';
import { DATE_LABELS } from '../../constants/dateConstants';

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
    // Configuration du DatePickerModalHandler
    const datePickerHandler = new DatePickerModalHandler({
        showCustom: modalSystem.custom.bind(modalSystem),
        showError: modalSystem.error.bind(modalSystem),
        showLoading: modalSystem.showLoading.bind(modalSystem)
    });

    /**
     * Ouvrir la modal de sélection de dates
     */
    const handleOpenDateModal = useCallback(async (event) => {
        if (readOnly) return;

        console.log('📅 Ouverture modal de sélection de dates - Mode:', multiSelect ? 'Multi' : 'Single');

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
                        initialDates = DateService.parseDatesFromCompact(value);
                        console.log('📅 Dates initiales parsées (format compact):', initialDates.length, 
                            initialDates.map(d => d.toLocaleDateString('fr-CH')));
                    } else {
                        // Mode PAIEMENT: format DD.MM.YYYY ou YYYY-MM-DD
                        let dateStr = value.trim();
                        
                        // Convertir DD.MM.YYYY en YYYY-MM-DD si nécessaire
                        if (dateStr.includes('.')) {
                            const parts = dateStr.split('.');
                            if (parts.length === 3) {
                                const [day, month, year] = parts;
                                dateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                            }
                        }
                        
                        const dateObj = DateService.fromInputFormat(dateStr);
                        if (dateObj) {
                            initialDates = [dateObj];
                            console.log('📅 Date initiale parsée (single):', dateObj.toLocaleDateString('fr-CH'));
                        }
                    }
                } catch (error) {
                    console.warn('⚠️ Erreur lors du parsing des dates existantes:', error);
                    initialDates = [];
                }
            }

            // Configuration de la modal
            const config = {
                initialDates: initialDates,
                multiSelect: multiSelect,
                minDate: multiSelect ? null : null,  // Factures: pas de restriction
                maxDate: multiSelect ? null : DateService.getToday(), // Paiements: pas de dates futures
                title: multiSelect ? 'Sélectionner les dates' : 'Sélectionner une date',
                confirmText: 'Confirmer la sélection',
                context: multiSelect ? 'invoice' : 'payment',
                anchorRef: anchorRef
            };

            // Ouvrir la modal et attendre le résultat
            const result = await datePickerHandler.handle(config, event);

            console.log('📅 Résultat sélection dates:', result);

            // Traitement du résultat
            if (result.action === 'confirm' && result.dates.length > 0) {
                
                if (multiSelect) {
                    // ✅ Mode FACTURE: Formater au format compact
                    const formattedDates = DateService.formatDatesCompact(result.dates);
                    
                    console.log('📅 Dates formatées (format compact):', formattedDates);
                    console.log('📅 Exemple de format: [09/16/23/30.01, 06/13/20/27.02]');

                    // Mettre à jour le champ
                    if (onChange && typeof onChange === 'function') {
                        onChange(formattedDates); // Passage direct de la chaîne formatée
                    }

                    // ✅ Mettre à jour la quantité si callback fourni (IMPORTANT pour factures)
                    if (updateQuantity && typeof updateQuantity === 'function') {
                        updateQuantity(formattedDates, result.dates.length);
                    }

                    console.log('✅ Champ de dates mis à jour avec:', formattedDates, '(', result.dates.length, 'dates)');
                    
                } else {
                    // ✅ Mode PAIEMENT: Format DD.MM.YYYY
                    const singleDate = result.dates[0];
                    const day = String(singleDate.getDate()).padStart(2, '0');
                    const month = String(singleDate.getMonth() + 1).padStart(2, '0');
                    const year = singleDate.getFullYear();
                    const formattedDate = `${day}.${month}.${year}`;
                    
                    console.log('📅 Date formatée (single):', formattedDate);

                    // Mettre à jour le champ
                    if (onChange && typeof onChange === 'function') {
                        onChange(formattedDate);
                    }

                    console.log('✅ Champ de date mis à jour avec:', formattedDate);
                }
            } else {
                console.log('❌ Sélection annulée ou aucune date sélectionnée');
            }

        } catch (error) {
            console.error('❌ Erreur lors de la sélection de dates:', error);
            await modalSystem.error(`Erreur lors de la sélection de dates : ${error.message}`);
        }
    }, [readOnly, value, multiSelect, onChange, updateQuantity, datePickerHandler]);

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
        
        const validation = DateService.validateDatesString(inputValue);
        return validation.isValid;
    }, [multiSelect]);

    /**
     * ✅ Afficher un aperçu lisible des dates (pour factures multiselect)
     */
    const getReadablePreview = useCallback(() => {
        if (!value || value.trim() === '' || !multiSelect) return '';
        
        try {
            return DateService.formatCompactToDisplay(value, 'count');
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
                <FiCalendar
                    className="date-input-icon"
                    onClick={handleOpenDateModal}
                    style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        cursor: 'pointer',
                        fontSize: '18px',
                        color: '#800020',
                        zIndex: 2
                    }}
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