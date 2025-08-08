import React from 'react';
import { ValidationError, CharacterCounter } from './FactureUIComponents';

/**
 * Composant wrapper pour les champs flottants
 */
export function FloatingLabelField({ 
    children, 
    focused, 
    hasValue, 
    hasError, 
    className = "" 
}) {
    const classes = [
        'fdf_floating-label-input',
        focused && 'fdf_focused',
        hasValue && 'has-value',
        hasError && 'fdf_error-validation',
        className
    ].filter(Boolean).join(' ');

    return (
        <div className={classes}>
            {children}
        </div>
    );
}

/**
 * Composant Select générique avec floating label
 */
export function FloatingLabelSelect({
    id,
    value,
    options = [],
    label,
    required = false,
    disabled = false,
    placeholder = "",
    focused,
    hasValue,
    hasError,
    errorMessage,
    onChange,
    onFocus,
    onBlur,
    className = ""
}) {
    return (
        <FloatingLabelField
            focused={focused}
            hasValue={hasValue}
            hasError={hasError}
            className={className}
        >
            <select
                id={id}
                value={value || ''}
                onChange={onChange}
                onFocus={onFocus}
                onBlur={onBlur}
                disabled={disabled}
                className={`fdf_form-control ${hasError ? 'fdf_error-validation' : ''}`}
                required={required}
            >
                {placeholder && (
                    <option value="">{placeholder}</option>
                )}
                {options.map(option => (
                    <option 
                        key={option.key} 
                        value={option.value}
                    >
                        {option.label}
                    </option>
                ))}
            </select>
            <label htmlFor={id}>
                {label} {required && <span className="fdf_required">*</span>}
            </label>
            <ValidationError message={errorMessage} />
        </FloatingLabelField>
    );
}

/**
 * Composant Input générique avec floating label
 */
export function FloatingLabelInput({
    id,
    type = "text",
    value,
    label,
    required = false,
    disabled = false,
    placeholder = " ",
    maxLength,
    min,
    max,
    step,
    focused,
    hasValue,
    hasError,
    errorMessage,
    onChange,
    onFocus,
    onBlur,
    className = "",
    suffix,
    prefix,
    icon,
    onIconClick,
    showCharCount = false
}) {
    const charactersUsed = typeof value === 'string' ? value.length : 0;
    
    return (
        <FloatingLabelField
            focused={focused}
            hasValue={hasValue}
            hasError={hasError}
            className={className}
        >
            {prefix && <span className="fdf_input-prefix">{prefix}</span>}
            
            <input
                type={type}
                id={id}
                value={value || ''}
                onChange={onChange}
                onFocus={onFocus}
                onBlur={onBlur}
                disabled={disabled}
                placeholder={placeholder}
                maxLength={maxLength}
                min={min}
                max={max}
                step={step}
                className={`fdf_form-control ${hasError ? 'fdf_error-validation' : ''} ${className}`}
                required={required}
            />
            
            <label htmlFor={id}>
                {label} {required && <span className="fdf_required">*</span>}
            </label>
            
            {suffix && <span className="fdf_input-suffix">{suffix}</span>}
            
            {icon && (
                <button
                    type="button"
                    className="fdf_input-icon"
                    onClick={onIconClick}
                    disabled={disabled}
                >
                    {icon}
                </button>
            )}
            
            <ValidationError message={errorMessage} />
            
            {showCharCount && maxLength && (
                <CharacterCounter 
                    current={charactersUsed} 
                    max={maxLength}
                    style={{ bottom: errorMessage ? '-40px' : '-20px' }}
                />
            )}
        </FloatingLabelField>
    );
}

/**
 * Composant pour organiser les champs en lignes
 */
export function FieldRow({ children, className = "", equalColumns = false }) {
    const classes = [
        'fdf_table-row',
        equalColumns && 'fdf_equal-columns',
        className
    ].filter(Boolean).join(' ');

    return (
        <div className={classes}>
            {children}
        </div>
    );
}

/**
 * Composant pour les cellules de champs
 */
export function FieldCell({ children, className = "", span = 1 }) {
    const classes = [
        'fdf_table-cell',
        className
    ].filter(Boolean).join(' ');

    const style = span > 1 ? { gridColumn: `span ${span}` } : {};

    return (
        <div className={classes} style={style}>
            {children}
        </div>
    );
}