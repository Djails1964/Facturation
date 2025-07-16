import React, { useEffect, useState } from 'react';
import { FiCalendar } from 'react-icons/fi';
import { useDateContext } from './DateContext';
import '../styles/context/GlobalDateInputField.css';

/**
 * Composant d'entrée de date utilisant le contexte global
 */
function GlobalDateInputField({
    id,
    label,
    value,
    onChange,
    required = false,
    readOnly = false,
    updateQuantity = false,
    multiSelect = true,
    maxLength = 100,
    showCount = true,
    errorMessage = null,
    className = ""
}) {
    // Accéder au contexte de dates
    const {
        openDatePicker,
        parseDatesFromString,
        formatDatesCompact
    } = useDateContext();
    
    // État local pour le style du champ
    const [isFocused, setIsFocused] = useState(false);
    const [isEmpty, setIsEmpty] = useState(!value);
    
    // Mettre à jour l'état d'emptiness quand la valeur change
    useEffect(() => {
        setIsEmpty(!value);
    }, [value]);
    
    // Calculer le nombre de caractères restants
    const charactersUsed = (value || '').length;
    const charactersRemaining = maxLength - charactersUsed;
    
    // Gérer l'ouverture du sélecteur de dates de façon sécurisée
    const handleOpenDatePicker = () => {
        if (readOnly) return;
        
        // Analyser les dates existantes avec sécurité
        const existingDates = parseDatesFromString(value || '');
        console.log('GlobalDateInputField - Dates existantes:', existingDates);
        
        // Configuration du DatePicker
        const config = {
            title: `Sélectionner des dates pour ${label || 'Dates'}`,
            multiSelect: multiSelect !== undefined ? multiSelect : true,
            confirmText: `Ajouter ${existingDates.length} date${existingDates.length !== 1 ? 's' : ''}`
        };
        
        // Définition plus sécurisée du callback
        const safeCallback = (dates, formattedString, count) => {
            console.log('Callback appelé avec:', { dates, formattedString, count });
            
            try {
                if (typeof updateQuantity === 'function') {
                    updateQuantity(formattedString || '', count || 0);
                } else if (typeof onChange === 'function') {
                    // Créer un objet d'événement synthétique valide et sécurisé
                    onChange({ 
                        target: { 
                            id: id || 'descriptionDates', 
                            value: formattedString || '',
                            // Ajouter ces propriétés pour plus de compatibilité
                            name: id || 'descriptionDates',
                            type: 'text'
                        },
                        // Ajouter des méthodes synthétiques pour éviter les erreurs
                        preventDefault: () => {},
                        stopPropagation: () => {}
                    });
                }
            } catch (error) {
                console.error('Erreur dans le callback de dates:', error);
            }
        };
        
        // Ouvrir le DatePicker
        openDatePicker(config, safeCallback, existingDates);
    };
    
    // Gérer le focus sur le champ
    const handleFocus = () => {
        setIsFocused(true);
    };
    
    // Gérer la perte de focus
    const handleBlur = () => {
        setIsFocused(false);
    };
    
    // Gérer le changement de valeur manuel de façon sécurisée
    const handleChange = (e) => {
        if (!e || !e.target) {
            console.error('Événement invalide dans handleChange:', e);
            return;
        }
        
        const newValue = e.target.value ? e.target.value.slice(0, maxLength) : '';
        
        if (typeof onChange === 'function') {
            onChange({
                target: {
                    id: id,
                    value: newValue,
                    name: id,
                    type: 'text'
                },
                preventDefault: () => {},
                stopPropagation: () => {}
            });
        }
    };
    
    return (
        <div className={`gdf-field-container ${className}`}>
            <div className={`gdf-floating-label-input ${isFocused ? 'gdf-focused' : ''} ${!isEmpty ? 'gdf-filled' : ''}`}>
                <input
                    type="text"
                    id={id}
                    value={value || ''}
                    onChange={handleChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    className={`gdf-form-control ${errorMessage ? 'gdf-error' : ''}`}
                    placeholder=" "
                    maxLength={maxLength}
                    required={required}
                    readOnly={readOnly}
                />
                <label htmlFor={id}>
                    {label || 'Dates'}
                    {required && <span className="gdf-required">*</span>}
                </label>
                
                {!readOnly && (
                    <FiCalendar 
                        className="gdf-calendar-icon" 
                        onClick={handleOpenDatePicker}
                    />
                )}
                
                {errorMessage && (
                    <div className="gdf-error-message">{errorMessage}</div>
                )}
                
                {showCount && (
                    <div className="gdf-char-count">
                        {charactersRemaining} caractère{charactersRemaining !== 1 ? 's' : ''} restant{charactersRemaining !== 1 ? 's' : ''}
                    </div>
                )}
            </div>
        </div>
    );
}

export default GlobalDateInputField;