import React, { useState, useEffect } from 'react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { registerLocale } from "react-datepicker";
import fr from 'date-fns/locale/fr';
import '../../styles/components/factures/CustomDatePickerModal.css';

// Enregistrer la locale française
registerLocale('fr', fr);

/**
 * Composant modal de sélection de dates réutilisable
 * @param {boolean} isOpen - État d'ouverture de la modal
 * @param {function} onClose - Fonction à appeler lors de la fermeture
 * @param {Array} initialDates - Dates initiales sélectionnées
 * @param {function} onConfirm - Fonction à appeler lors de la confirmation avec les dates sélectionnées
 * @param {boolean} multiSelect - Permettre la sélection multiple (par défaut: true)
 * @param {Date} minDate - Date minimum sélectionnable
 * @param {Date} maxDate - Date maximum sélectionnable
 * @param {Object} additionalOptions - Options supplémentaires pour DatePicker
 * @param {string} title - Titre de la modal (par défaut: "Sélectionner des dates")
 * @param {string} confirmText - Texte du bouton de confirmation
 */
function CustomDatePickerModal({
    isOpen,
    onClose,
    initialDates = [],
    onConfirm,
    multiSelect = true,
    minDate = null,
    maxDate = new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
    additionalOptions = {},
    title = "Sélectionner des dates",
    confirmText = null
}) {
    // État pour les dates sélectionnées
    const [selectedDates, setSelectedDates] = useState([]);

    // Mettre à jour les dates sélectionnées lorsque initialDates change
    useEffect(() => {
        if (initialDates && Array.isArray(initialDates)) {
            setSelectedDates(initialDates);
        }
    }, [initialDates]);

    // Si la modal n'est pas ouverte, ne rien afficher
    if (!isOpen) return null;

    /**
     * Gère la sélection/désélection d'une date
     */
    const handleDateSelect = (date) => {
        if (!multiSelect) {
            // Mode sélection unique
            setSelectedDates([date]);
            return;
        }

        // Mode sélection multiple
        const dateExists = selectedDates.some(selectedDate => 
            selectedDate.getDate() === date.getDate() &&
            selectedDate.getMonth() === date.getMonth() &&
            selectedDate.getFullYear() === date.getFullYear()
        );

        if (dateExists) {
            setSelectedDates(selectedDates.filter(selectedDate => 
                !(selectedDate.getDate() === date.getDate() &&
                selectedDate.getMonth() === date.getMonth() &&
                selectedDate.getFullYear() === date.getFullYear())
            ));
        } else {
            setSelectedDates([...selectedDates, date]);
        }
    };

    /**
     * Gère la confirmation et l'envoi des dates sélectionnées
     */
    const handleConfirm = () => {
        if (typeof onConfirm === 'function') {
            onConfirm(selectedDates);
        }
        onClose();
    };

    // Générer le texte du bouton de confirmation en fonction du nombre de dates sélectionnées
    const generateConfirmText = () => {
        if (confirmText) return confirmText;
        
        return `Ajouter ${selectedDates.length} date${selectedDates.length !== 1 ? 's' : ''}`;
    };

    return (
        <div className="cdp-overlay">
            <div className="cdp-modal">
                <div className="cdp-header">
                    <h3>{title}</h3>
                    <button type="button" className="cdp-close-btn" onClick={onClose}>×</button>
                </div>
                <div className="cdp-content">
                    <DatePicker
                        selected={!multiSelect && selectedDates.length > 0 ? selectedDates[0] : null}
                        onChange={handleDateSelect}
                        inline
                        locale="fr"
                        highlightDates={selectedDates}
                        dateFormat="dd/MM/yyyy"
                        showMonthDropdown
                        showYearDropdown
                        dropdownMode="select"
                        onSelect={handleDateSelect}
                        minDate={minDate}
                        maxDate={maxDate}
                        {...additionalOptions}
                    />
                    <div className="cdp-info">
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
                <div className="cdp-actions">
                    <button 
                        type="button" 
                        className="cdp-cancel-btn" 
                        onClick={onClose}
                    >
                        Annuler
                    </button>
                    <button 
                        type="button" 
                        className="cdp-confirm-btn"
                        onClick={handleConfirm} 
                        disabled={selectedDates.length === 0}
                    >
                        {generateConfirmText()}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CustomDatePickerModal;