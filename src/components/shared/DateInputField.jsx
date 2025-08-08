import React, { useCallback } from 'react';
import { FiCalendar } from 'react-icons/fi';
import modalSystem from '../../utils/modalSystem';
import DatePickerModalHandler from '../shared/modals/handlers/DatePickerModalHandler';
import DateService from '../../utils/DateService';
import { DATE_LABELS } from '../../constants/dateConstants';

/**
 * Composant de champ de date avec modal picker unifié
 * ✅ MISE À JOUR: Format spécifique [09/16/23/30.01, 06/13/20/27.02, etc.]
 * Remplace l'ancien système par le DatePickerModalHandler
 */
const DateInputField = ({
    id,
    label,
    value = '',
    onChange,
    updateQuantity = null, // Callback pour mettre à jour la quantité automatiquement
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

        console.log('📅 Ouverture modal de sélection de dates pour facture - Format spécifique');

        try {
            // Créer une référence d'ancrage
            const anchorRef = React.createRef();
            if (event && event.currentTarget) {
                anchorRef.current = event.currentTarget;
            }

            // ✅ CHANGEMENT: Parser les dates depuis le format spécifique
            let initialDates = [];
            if (value && value.trim()) {
                try {
                    // Utiliser la nouvelle méthode pour le format spécifique
                    initialDates = DateService.parseDatesFromCompact(value);
                    console.log('📅 Dates initiales parsées (format spécifique):', initialDates.length, 
                        initialDates.map(d => d.toLocaleDateString('fr-CH')));
                } catch (error) {
                    console.warn('⚠️ Erreur lors du parsing des dates existantes:', error);
                    initialDates = [];
                }
            }

            // Configuration de la modal
            const config = {
                initialDates: initialDates,
                multiSelect: multiSelect,
                minDate: null, // Aucune restriction de date minimale pour les factures
                maxDate: null, // Aucune restriction de date maximale pour les factures
                title: multiSelect ? 'Sélectionner les dates' : 'Sélectionner une date',
                confirmText: 'Confirmer la sélection',
                context: 'invoice', // Contexte facture (permet dates futures)
                anchorRef: anchorRef
            };

            // Ouvrir la modal et attendre le résultat
            const result = await datePickerHandler.handle(config, event);

            console.log('📅 Résultat sélection dates:', result);

            // Traitement du résultat
            if (result.action === 'confirm' && result.dates.length > 0) {
                // ✅ CHANGEMENT: Formater les dates sélectionnées au format spécifique
                const formattedDates = DateService.formatDatesCompact(result.dates);
                
                console.log('📅 Dates formatées (format spécifique):', formattedDates);
                console.log('📅 Exemple de format attendu: [09/16/23/30.01, 06/13/20/27.02]');

                // Mettre à jour le champ
                if (onChange) {
                    if (typeof onChange === 'function') {
                        onChange(formattedDates); // Passage direct de la chaîne formatée
                    }
                }

                // Mettre à jour la quantité si callback fourni
                if (updateQuantity && typeof updateQuantity === 'function') {
                    updateQuantity(formattedDates, result.dates.length);
                }

                console.log('✅ Champ de dates mis à jour avec:', formattedDates, '(', result.dates.length, 'dates)');
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
        
        if (onChange) {
            // Pour les changements manuels, on passe l'event
            if (typeof onChange === 'function') {
                // Créer un event-like object pour maintenir la compatibilité
                onChange({ target: { value: newValue } });
            }
        }
    }, [readOnly, maxLength, onChange]);

    /**
     * ✅ NOUVEAU: Fonction pour valider le format spécifique
     */
    const validateSpecificFormat = useCallback((inputValue) => {
        if (!inputValue || inputValue.trim() === '') return true;
        
        const validation = DateService.validateDatesString(inputValue);
        return validation.isValid;
    }, []);

    /**
     * ✅ NOUVEAU: Afficher un aperçu lisible des dates
     */
    const getReadablePreview = useCallback(() => {
        if (!value || value.trim() === '') return '';
        
        try {
            return DateService.formatCompactToDisplay(value, 'count');
        } catch (error) {
            return '';
        }
    }, [value]);

    // Calculer les caractères restants
    const charactersUsed = (value || '').length;
    const charactersRemaining = maxLength ? maxLength - charactersUsed : null;
    
    // Déterminer si le champ a une valeur
    const hasValue = value !== undefined && value !== '';
    
    // Vérifier si le format est valide
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
            
            {/* Icône de calendrier - seulement si pas en lecture seule */}
            {!readOnly && (
                <FiCalendar 
                    className="calendar-icon"
                    onClick={handleOpenDateModal}
                    title={DATE_LABELS.OPEN_CALENDAR}
                    size={14}
                />
            )}
            
            {/* ✅ NOUVEAU: Aperçu lisible des dates sélectionnées */}
            {hasValue && isValidFormat && (
                <div 
                    className="dates-preview" 
                    style={{
                        position: 'absolute',
                        right: readOnly ? '10px' : '35px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: '0.75rem',
                        color: '#666',
                        background: 'rgba(255, 255, 255, 0.9)',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        border: '1px solid #e0e0e0',
                        pointerEvents: 'none',
                        zIndex: 0
                    }}
                    title={value}
                >
                    {getReadablePreview()}
                </div>
            )}
            
            {/* Compteur de caractères */}
            {showCharCount && maxLength && (
                <div 
                    className="char-count-info" 
                    style={{
                        position: 'absolute',
                        right: '0',
                        bottom: '-18px',
                        fontSize: '0.75rem',
                        color: charactersRemaining < 20 ? '#d32f2f' : '#666'
                    }}
                >
                    {charactersRemaining} caractère{charactersRemaining !== 1 ? 's' : ''} restant{charactersRemaining !== 1 ? 's' : ''}
                </div>
            )}
            
            {/* ✅ NOUVEAU: Message d'erreur de format */}
            {hasValue && !isValidFormat && (
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
            
            {/* ✅ NOUVEAU: Aide au format */}
            {!readOnly && !hasValue && (
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