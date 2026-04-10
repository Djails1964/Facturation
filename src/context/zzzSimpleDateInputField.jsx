import React, { useEffect, useState } from 'react';
import { FiCalendar } from 'react-icons/fi';
import { useDateContext } from './context/DateContext';

/**
 * Composant d'entrée de date simple pour les tarifs
 * Utilise le GlobalDatePicker mais retourne un format YYYY-MM-DD
 */
function SimpleDateInputField({
    id,
    label,
    value, // Format attendu: YYYY-MM-DD
    onChange,
    required = false,
    readOnly = false,
    errorMessage = null,
    className = ""
}) {
    const { openDatePicker } = useDateContext();
    
    const [isFocused, setIsFocused] = useState(false);
    const [isEmpty, setIsEmpty] = useState(!value);
    
    useEffect(() => {
        setIsEmpty(!value);
    }, [value]);
    
    // Convertir YYYY-MM-DD en objet Date
    const parseDate = (dateString) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? null : date;
    };
    
    // Convertir objet Date en YYYY-MM-DD
    const formatDate = (date) => {
        if (!date) return '';
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    
    // Gérer l'ouverture du sélecteur de dates
    const handleOpenDatePicker = () => {
        if (readOnly) return;
        
        // Récupérer la date existante ou utiliser aujourd'hui
        let initialDates = [];
        const existingDate = parseDate(value);
        
        if (existingDate) {
            initialDates = [existingDate];
            console.log('SimpleDateInputField - Date existante:', existingDate);
        } else {
            initialDates = [new Date()];
            console.log('SimpleDateInputField - Aucune date, ajout date du jour');
        }
        
        // Configuration du DatePicker (mode single)
        const config = {
            title: `Sélectionner ${label || 'une date'}`,
            multiSelect: false, // Mode single date
            confirmText: 'Confirmer'
        };
        
        // Callback quand l'utilisateur confirme
        const callback = (dates, formattedString, count) => {
            console.log('SimpleDateInputField - Callback appelé:', { dates, count });
            
            if (dates && dates.length > 0) {
                const selectedDate = dates[0];
                const formattedDate = formatDate(selectedDate);
                
                console.log('SimpleDateInputField - Date formatée:', formattedDate);
                
                // Appeler onChange avec un événement synthétique
                if (typeof onChange === 'function') {
                    onChange({
                        target: {
                            id: id,
                            name: id,
                            value: formattedDate,
                            type: 'date'
                        },
                        preventDefault: () => {},
                        stopPropagation: () => {}
                    });
                }
            }
        };
        
        // Ouvrir le DatePicker
        openDatePicker(config, callback, initialDates);
    };
    
    const handleFocus = () => setIsFocused(true);
    const handleBlur = () => setIsFocused(false);
    
    const handleChange = (e) => {
        if (!e || !e.target) return;
        
        const newValue = e.target.value;
        
        if (typeof onChange === 'function') {
            onChange({
                target: {
                    id: id,
                    name: id,
                    value: newValue,
                    type: 'date'
                },
                preventDefault: () => {},
                stopPropagation: () => {}
            });
        }
    };
    
    // Format d'affichage: convertir YYYY-MM-DD en DD.MM.YYYY pour l'affichage
    const displayValue = value ? (() => {
        try {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                return `${day}.${month}.${year}`;
            }
        } catch (e) {}
        return value;
    })() : '';
    
    return (
        <div className={`gdf-field-container ${className}`}>
            <div className={`gdf-floating-label-input ${isFocused ? 'gdf-focused' : ''} ${!isEmpty ? 'gdf-filled' : ''}`}>
                <input
                    type="text"
                    id={id}
                    value={displayValue}
                    onChange={handleChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    onClick={!readOnly ? handleOpenDatePicker : undefined}
                    className={`gdf-form-control ${errorMessage ? 'gdf-error' : ''}`}
                    placeholder=" "
                    required={required}
                    readOnly={true} // Toujours readonly, édition via picker uniquement
                    style={{ cursor: readOnly ? 'default' : 'pointer' }}
                />
                <label htmlFor={id}>
                    {label || 'Date'}
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
            </div>
        </div>
    );
}

export default SimpleDateInputField;