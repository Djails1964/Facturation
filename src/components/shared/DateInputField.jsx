import React from 'react';
import { FiCalendar } from 'react-icons/fi';
import CustomDatePickerModal from './CustomDatePickerModal';
import useDateSelection from '../../utils/useDateSelection';
import '../../styles/components/factures/DateInputField.css';

/**
 * Composant de champ d'entrée de date avec sélecteur de dates
 * @param {Object} props - Propriétés du composant
 */
const DateInputField = ({
    id,
    label,
    value,
    onChange,
    required = false,
    placeholder = " ",
    className = "",
    readOnly = false,
    updateQuantity = false,
    multiSelect = true,
    maxLength = 100,
    minDate = null,
    maxDate = new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
    errorMessage = null,
    showCharCount = true
}) => {
    // Utiliser le hook de gestion des dates
    const {
        selectedDates,
        isDatePickerOpen,
        openDatePicker,
        closeDatePicker,
        handleConfirmDates,
        initializeFromFormattedString
    } = useDateSelection((formattedDates, quantity) => {
        if (updateQuantity) {
            onChange(formattedDates, quantity);
        } else {
            onChange({ target: { id, value: formattedDates } });
        }
    }, value, updateQuantity);

    // Calculer le nombre de caractères restants
    const charactersUsed = (value || '').length;
    const charactersRemaining = maxLength - charactersUsed;

    // Déterminer si le champ a une valeur
    const hasValue = value !== undefined && value !== '';

    // Gérer le focus sur le champ
    const handleFocus = (e) => {
        e.target.parentElement.classList.add('dif-focused');
    };

    // Gérer la perte de focus sur le champ
    const handleBlur = (e) => {
        if (!e.target.value) {
            e.target.parentElement.classList.remove('dif-focused');
        }
    };

    // Gérer le changement de valeur manuel
    const handleChange = (e) => {
        const newValue = e.target.value.slice(0, maxLength);
        
        // Initialiser les dates si la valeur contient un format de date
        if (newValue.match(/\[([^\]]+)\]/)) {
            initializeFromFormattedString(newValue);
        }
        
        onChange({ target: { id, value: newValue } });
    };

    return (
        <div className="date-input-field-wrapper">
            <div className={`dif-floating-label-input ${hasValue ? 'dif-filled' : ''} ${className}`}>
                <input
                    type="text"
                    id={id}
                    value={value || ''}
                    onChange={handleChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    className={`dif-form-control ${errorMessage ? 'dif-error-validation' : ''}`}
                    placeholder={placeholder}
                    maxLength={maxLength}
                    required={required}
                    readOnly={readOnly}
                />
                <label htmlFor={id}>
                    {label}
                    {required && <span className="dif-required">*</span>}
                </label>
                
                {!readOnly && (
                    <FiCalendar 
                        className="dif-calendar-icon" 
                        onClick={openDatePicker}
                    />
                )}
                
                {errorMessage && (
                    <div className="dif-error-message">{errorMessage}</div>
                )}
                
                {showCharCount && (
                    <div className="dif-char-limit-info" style={{
                        position: 'absolute',
                        right: '30px', // Espace pour l'icône calendrier
                        bottom: errorMessage ? '-40px' : '-20px',
                        fontSize: '0.75rem',
                        color: charactersRemaining < 20 ? '#d32f2f' : '#666'
                    }}>
                        {charactersRemaining} caractère{charactersRemaining !== 1 ? 's' : ''} restant{charactersRemaining !== 1 ? 's' : ''}
                    </div>
                )}
            </div>
            
            {/* Modal de sélection de dates */}
            <CustomDatePickerModal
                isOpen={isDatePickerOpen}
                onClose={closeDatePicker}
                initialDates={selectedDates}
                onConfirm={handleConfirmDates}
                multiSelect={multiSelect}
                minDate={minDate}
                maxDate={maxDate}
                title={`Sélectionner des dates pour ${label}`}
            />
        </div>
    );
};

export default DateInputField;