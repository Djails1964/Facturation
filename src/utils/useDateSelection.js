import { useState, useCallback, useEffect } from 'react';
import DateService from './DateService';

/**
 * Hook personnalisé pour gérer les dates sélectionnées
 * @param {function} onChange - Fonction appelée lorsque les dates sélectionnées changent
 * @param {string} initialFormattedDates - Chaîne formatée initiale des dates
 * @param {boolean} updateQuantity - Si true, renvoie également le nombre de dates comme quantité
 * @returns {Object} - Fonctions et états pour gérer les dates
 */
export const useDateSelection = (onChange, initialFormattedDates = '', updateQuantity = false) => {
    // État pour stocker les dates sélectionnées
    const [selectedDates, setSelectedDates] = useState([]);
    
    // État pour stocker la modal ouverte/fermée
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

    // Fonction pour ouvrir le sélecteur de dates
    const openDatePicker = useCallback(() => {
        setIsDatePickerOpen(true);
    }, []);

    // Fonction pour fermer le sélecteur de dates
    const closeDatePicker = useCallback(() => {
        setIsDatePickerOpen(false);
    }, []);

    // Analyser une chaîne formatée pour extraire les dates
    const parseDatesFromString = useCallback((formattedString) => {
        return DateService.parseDatesFromFormattedString(formattedString);
    }, []);

    // Initialiser les dates sélectionnées à partir d'une chaîne formatée
    const initializeFromFormattedString = useCallback((formattedString) => {
        const dates = parseDatesFromString(formattedString);
        setSelectedDates(dates);
        return dates;
    }, [parseDatesFromString]);

    // Formater les dates sélectionnées en chaîne
    const formatDatesForDescription = useCallback((dates = selectedDates) => {
        return DateService.formatDatesCompact(dates);
    }, [selectedDates]);

    // Gérer la confirmation des dates sélectionnées
    const handleConfirmDates = useCallback((newSelectedDates) => {
        setSelectedDates(newSelectedDates);
        
        const formattedDates = formatDatesForDescription(newSelectedDates);
        
        if (typeof onChange === 'function') {
            if (updateQuantity) {
                onChange(formattedDates, newSelectedDates.length);
            } else {
                onChange(formattedDates);
            }
        }
    }, [onChange, formatDatesForDescription, updateQuantity]);

    // Initialiser les dates à partir d'une chaîne formatée lors du montage
    useEffect(() => {
        if (initialFormattedDates) {
            initializeFromFormattedString(initialFormattedDates);
        }
    }, [initialFormattedDates, initializeFromFormattedString]);

    return {
        selectedDates,
        setSelectedDates,
        isDatePickerOpen,
        openDatePicker,
        closeDatePicker,
        handleConfirmDates,
        formatDatesForDescription,
        parseDatesFromString,
        initializeFromFormattedString
    };
};

export default useDateSelection;