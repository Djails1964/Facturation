// src/components/shared/forms/FormField.jsx
// ✅ Composant unifié pour tous les champs de formulaire avec validation

import React, { useState, useCallback, useId } from 'react';
import '../../../styles/components/shared/forms/FormField.css';

/**
 * Composant d'affichage d'erreur de validation unifié
 */
export const ValidationError = ({ message, className = '' }) => {
    if (!message) return null;
    
    return (
        <div className={`validation-error ${className}`} role="alert">
            <svg 
                className="validation-error-icon" 
                viewBox="0 0 20 20" 
                fill="currentColor"
                aria-hidden="true"
            >
                <path 
                    fillRule="evenodd" 
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" 
                    clipRule="evenodd" 
                />
            </svg>
            <span className="validation-error-text">{message}</span>
        </div>
    );
};

/**
 * Composant de compteur de caractères
 */
export const CharacterCounter = ({ current = 0, max, warning = 0.8 }) => {
    if (!max) return null;
    
    const percentage = current / max;
    const isWarning = percentage >= warning && percentage < 1;
    const isError = percentage >= 1;
    
    return (
        <div className={`character-counter ${isWarning ? 'warning' : ''} ${isError ? 'error' : ''}`}>
            {current}/{max}
        </div>
    );
};

/**
 * Composant FormField unifié
 * Wrapper pour tous les types de champs avec gestion cohérente des erreurs
 */
const FormField = ({
    // Identification
    id,
    name,
    
    // Type de champ
    type = 'text', // text, email, password, number, tel, date, select, textarea, checkbox, radio
    
    // Valeur et onChange
    value,
    onChange,
    onBlur,
    onFocus,
    
    // Label et placeholder
    label,
    placeholder = ' ',
    
    // Validation
    required = false,
    error,
    success = false,
    
    // Options pour select/radio
    options = [],
    
    // Contraintes
    maxLength,
    minLength,
    min,
    max,
    step,
    pattern,
    
    // Affichage
    disabled = false,
    readOnly = false,
    autoFocus = false,
    showCharCount = false,
    helpText,
    
    // Style
    className = '',
    size = 'medium', // small, medium, large
    variant = 'underline', // underline, outlined, filled
    
    // Icônes
    prefixIcon,
    suffixIcon,
    onSuffixClick,
    
    // Autres
    autoComplete,
    inputMode,
    ...rest
}) => {
    const generatedId = useId();
    const fieldId = id || `field-${generatedId}`;
    const [isFocused, setIsFocused] = useState(false);
    
    // Déterminer si le champ a une valeur
    const hasValue = value !== undefined && value !== null && value !== '';
    
    // Classes CSS
    const fieldClasses = [
        'form-field',
        `form-field--${variant}`,
        `form-field--${size}`,
        isFocused && 'form-field--focused',
        hasValue && 'form-field--has-value',
        error && 'form-field--error',
        success && 'form-field--success',
        disabled && 'form-field--disabled',
        readOnly && 'form-field--readonly',
        prefixIcon && 'form-field--has-prefix',
        suffixIcon && 'form-field--has-suffix',
        className
    ].filter(Boolean).join(' ');
    
    // Gestionnaires d'événements
    const handleFocus = useCallback((e) => {
        setIsFocused(true);
        onFocus?.(e);
    }, [onFocus]);
    
    const handleBlur = useCallback((e) => {
        setIsFocused(false);
        onBlur?.(e);
    }, [onBlur]);
    
    // Rendu du champ selon le type
    const renderInput = () => {
        const commonProps = {
            id: fieldId,
            name: name || fieldId,
            disabled,
            readOnly,
            autoFocus,
            autoComplete,
            onFocus: handleFocus,
            onBlur: handleBlur,
            'aria-invalid': !!error,
            'aria-describedby': error ? `${fieldId}-error` : helpText ? `${fieldId}-help` : undefined,
            ...rest
        };
        
        switch (type) {
            case 'select':
                return (
                    <select
                        {...commonProps}
                        value={value || ''}
                        onChange={onChange}
                        className="form-field__input form-field__select"
                    >
                        {placeholder && placeholder !== ' ' && (
                            <option value="">{placeholder}</option>
                        )}
                        {options.map((option, index) => {
                            const optValue = option.value !== undefined ? option.value : option;
                            const optLabel = option.label || option;
                            return (
                                <option key={`${optValue}-${index}`} value={optValue}>
                                    {optLabel}
                                </option>
                            );
                        })}
                    </select>
                );
                
            case 'textarea':
                return (
                    <textarea
                        {...commonProps}
                        value={value || ''}
                        onChange={onChange}
                        placeholder={placeholder}
                        maxLength={maxLength}
                        minLength={minLength}
                        className="form-field__input form-field__textarea"
                        rows={rest.rows || 4}
                    />
                );
                
            case 'checkbox':
                return (
                    <div className="form-field__checkbox-wrapper">
                        <input
                            {...commonProps}
                            type="checkbox"
                            checked={!!value}
                            onChange={onChange}
                            className="form-field__checkbox"
                        />
                        {label && (
                            <label htmlFor={fieldId} className="form-field__checkbox-label">
                                {label}
                                {required && <span className="form-field__required">*</span>}
                            </label>
                        )}
                    </div>
                );
                
            case 'radio':
                return (
                    <div className="form-field__radio-group">
                        {options.map((option, index) => {
                            const optValue = option.value !== undefined ? option.value : option;
                            const optLabel = option.label || option;
                            const radioId = `${fieldId}-${index}`;
                            return (
                                <div key={radioId} className="form-field__radio-option">
                                    <input
                                        type="radio"
                                        id={radioId}
                                        name={name || fieldId}
                                        value={optValue}
                                        checked={value === optValue}
                                        onChange={onChange}
                                        disabled={disabled}
                                        className="form-field__radio"
                                    />
                                    <label htmlFor={radioId} className="form-field__radio-label">
                                        {optLabel}
                                    </label>
                                </div>
                            );
                        })}
                    </div>
                );
                
            default:
                return (
                    <input
                        {...commonProps}
                        type={type}
                        value={value || ''}
                        onChange={onChange}
                        placeholder={placeholder}
                        maxLength={maxLength}
                        minLength={minLength}
                        min={min}
                        max={max}
                        step={step}
                        pattern={pattern}
                        inputMode={inputMode}
                        className="form-field__input"
                    />
                );
        }
    };
    
    // Pour checkbox, le rendu est différent
    if (type === 'checkbox') {
        return (
            <div className={fieldClasses}>
                {renderInput()}
                <ValidationError message={error} />
                {helpText && !error && (
                    <div id={`${fieldId}-help`} className="form-field__help">
                        {helpText}
                    </div>
                )}
            </div>
        );
    }
    
    // Pour radio, le rendu est différent
    if (type === 'radio') {
        return (
            <div className={fieldClasses}>
                {label && (
                    <div className="form-field__radio-label-group">
                        {label}
                        {required && <span className="form-field__required">*</span>}
                    </div>
                )}
                {renderInput()}
                <ValidationError message={error} />
                {helpText && !error && (
                    <div id={`${fieldId}-help`} className="form-field__help">
                        {helpText}
                    </div>
                )}
            </div>
        );
    }
    
    return (
        <div className={fieldClasses}>
            {prefixIcon && (
                <span className="form-field__prefix-icon">
                    {prefixIcon}
                </span>
            )}
            
            {renderInput()}
            
            {label && (
                <label htmlFor={fieldId} className="form-field__label">
                    {label}
                    {required && <span className="form-field__required">*</span>}
                </label>
            )}
            
            {suffixIcon && (
                <button
                    type="button"
                    className="form-field__suffix-icon"
                    onClick={onSuffixClick}
                    disabled={disabled}
                    tabIndex={-1}
                >
                    {suffixIcon}
                </button>
            )}
            
            <ValidationError message={error} />
            
            {showCharCount && maxLength && (
                <CharacterCounter 
                    current={typeof value === 'string' ? value.length : 0} 
                    max={maxLength}
                />
            )}
            
            {helpText && !error && (
                <div id={`${fieldId}-help`} className="form-field__help">
                    {helpText}
                </div>
            )}
        </div>
    );
};

export default FormField;