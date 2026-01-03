import React, { useState } from 'react';
import { useDateContext } from './DateContext';
import "react-datepicker/dist/react-datepicker.css";
import DatePicker from "react-datepicker";
import { registerLocale } from "react-datepicker";
import fr from 'date-fns/locale/fr';
import '../styles/context/GlobalDatePicker.css';

// Enregistrer la locale française
registerLocale('fr', fr);

/**
 * Composant DatePicker global utilisant le contexte
 */
function GlobalDatePicker() {
    // Important: Appeler le hook au niveau supérieur
    const {
        isDatePickerOpen,
        selectedDates,
        datePickerConfig,
        closeDatePicker,
        handleConfirmDates,
        handleDateSelect
    } = useDateContext();
    
    // État pour gérer les erreurs
    const [error, setError] = useState(null);

    // Si une erreur s'est produite, afficher un message d'erreur
    if (error) {
        return (
            <div className="gdp-error">
                <p>Une erreur est survenue dans le composant DatePicker.</p>
                <details>
                    <summary>Détails de l'erreur</summary>
                    <pre>{error.toString()}</pre>
                    <pre>{error.stack}</pre>
                </details>
                <button 
                    className="gdp-error-btn" 
                    onClick={() => {
                        setError(null);
                        closeDatePicker();
                    }}
                >
                    Fermer
                </button>
            </div>
        );
    }

    // Si le DatePicker n'est pas ouvert, ne rien afficher
    if (!isDatePickerOpen) return null;

    // Wrapper la fonction handleDateSelect pour capturer les erreurs
    const safeHandleDateSelect = (date) => {
        try {
            handleDateSelect(date);
        } catch (err) {
            console.error('Erreur dans handleDateSelect:', err);
            setError(err);
        }
    };

    // Le rendu principal du composant
    try {
        // Définir directement le texte du bouton dans le rendu, sans passer par getConfirmText
        const buttonText = `Ajouter ${selectedDates.length} date${selectedDates.length !== 1 ? 's' : ''}`;
        
        return (
            <div className="gdp-overlay">
                <div className="gdp-modal">
                    <div className="gdp-header">
                        <h3>{datePickerConfig.title}</h3>
                        <button type="button" className="gdp-close-btn" onClick={closeDatePicker}>×</button>
                    </div>
                    <div className="gdp-content">
                        <DatePicker
                            inline
                            locale="fr"
                            onSelect={safeHandleDateSelect}
                            highlightDates={selectedDates}
                            selected={selectedDates.length > 0 ? selectedDates[0] : null}
                            dateFormat="dd/MM/yyyy"
                            showMonthDropdown
                            showYearDropdown
                            dropdownMode="select"
                            minDate={datePickerConfig.minDate}
                            maxDate={datePickerConfig.maxDate}
                            {...datePickerConfig.additionalOptions}
                        />
                        <div className="gdp-info">
                            <p><strong>Dates sélectionnées:</strong> {selectedDates.length}</p>
                            <p>
                                {selectedDates.length > 0 ? (
                                    selectedDates
                                        .sort((a, b) => a - b)
                                        .map(date => date.toLocaleDateString('fr-CH'))
                                        .join(', ')
                                ) : (
                                    'Aucune date sélectionnée'
                                )}
                            </p>
                        </div>
                    </div>
                    <div className="gdp-actions">
                        <button 
                            type="button" 
                            className="gdp-cancel-btn" 
                            onClick={closeDatePicker}
                        >
                            Annuler
                        </button>
                        <button 
                            type="button" 
                            className="gdp-confirm-btn"
                            onClick={() => {
                                try {
                                    handleConfirmDates(selectedDates);
                                } catch (err) {
                                    console.error('Erreur lors de la confirmation des dates:', err);
                                    setError(err);
                                }
                            }}
                            disabled={selectedDates.length === 0}
                        >
                            {buttonText}
                        </button>
                    </div>
                </div>
            </div>
        );
    } catch (err) {
        console.error('Erreur dans le rendu de GlobalDatePicker:', err);
        setError(err);
        return null;
    }
}

export default GlobalDatePicker;