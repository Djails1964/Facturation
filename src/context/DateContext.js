import React, { createContext, useState, useContext, useCallback } from 'react';
import DateService from '../utils/DateService';

// Créer le contexte
const DateContext = createContext();

/**
 * Fournisseur du contexte pour la gestion globale des dates dans l'application
 */
export function DateProvider({ children }) {
    // État pour le composant DatePicker
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [selectedDates, setSelectedDates] = useState([]);
    const [datePickerConfig, setDatePickerConfig] = useState({
        title: 'Sélectionner des dates',
        multiSelect: true,
        minDate: null,
        maxDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        confirmText: '',
        additionalOptions: {}
    });
    const [activeCallback, setActiveCallback] = useState(null);

    /**
     * Ouvre le sélecteur de dates avec une configuration spécifique
     */
    const openDatePicker = useCallback((config = {}, callback = null, initialDates = []) => {
        // Configurer le DatePicker
        setDatePickerConfig({
            title: config.title || 'Sélectionner des dates',
            multiSelect: config.multiSelect !== undefined ? config.multiSelect : true,
            minDate: config.minDate || null,
            maxDate: config.maxDate || new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
            confirmText: config.confirmText || '',
            additionalOptions: config.additionalOptions || {}
        });
        
        // Initialiser les dates sélectionnées
        setSelectedDates(initialDates);
        
        // Enregistrer la fonction de rappel
        setActiveCallback(() => callback);
        
        // Ouvrir le DatePicker
        setIsDatePickerOpen(true);
    }, []);

    /**
     * Ferme le sélecteur de dates
     */
    const closeDatePicker = useCallback(() => {
        setIsDatePickerOpen(false);
    }, []);

    /**
     * Gère la confirmation des dates sélectionnées
     */
    const handleConfirmDates = useCallback((dates) => {
        console.log('handleConfirmDates - Dates à confirmer:', dates);
        
        // Vérifier que activeCallback est une fonction valide
        if (typeof activeCallback === 'function') {
            try {
                // S'assurer que dates est un tableau
                const validDates = Array.isArray(dates) ? dates : [];
                
                // Créer une chaîne formatée
                const formattedString = validDates.length > 0 
                    ? DateService.formatDatesCompact(validDates) 
                    : '';
                
                // Appeler le callback avec des valeurs par défaut si nécessaire
                activeCallback(
                    validDates, 
                    formattedString, 
                    validDates.length
                );
            } catch (error) {
                console.error('Erreur lors de l\'appel du callback de confirmation:', error);
            }
        } else {
            console.warn('Aucun callback actif pour la confirmation des dates');
        }
        
        // Fermer le DatePicker quoi qu'il arrive
        closeDatePicker();
    }, [activeCallback, closeDatePicker]);

    /**
     * Gère la sélection d'une date
     */
    const handleDateSelect = useCallback((date) => {
        console.log('handleDateSelect appelé avec date:', date);
        if (!datePickerConfig.multiSelect) {
            console.log('Mode sélection unique - Nouvelle date:', date);
            // Mode sélection unique
            setSelectedDates([date]);
            return;
        }

        // Mode sélection multiple
        setSelectedDates(prevDates => {
            console.log('Mode sélection multiple - Dates précédentes:', prevDates);
            const dateExists = prevDates.some(selectedDate => 
                DateService.isSameDay(selectedDate, date)
            );

            let newDates;
            if (dateExists) {
                newDates = prevDates.filter(selectedDate => 
                    !DateService.isSameDay(selectedDate, date)
                );
            } else {
                newDates = [...prevDates, date];
            }
            
            console.log('Nouvelles dates:', newDates);
            return newDates;
        });
    }, [datePickerConfig.multiSelect]);

    /**
     * Analyse une chaîne formatée pour extraire les dates
     */
    const parseDatesFromString = useCallback((formattedString) => {
        return DateService.parseDatesFromFormattedString(formattedString);
    }, []);

    // Valeur du contexte
    const contextValue = {
        // État du DatePicker
        isDatePickerOpen,
        selectedDates,
        datePickerConfig,
        
        // Méthodes du DatePicker
        openDatePicker,
        closeDatePicker,
        handleConfirmDates,
        handleDateSelect,
        
        // Utilitaires de formatage
        formatDatesCompact: DateService.formatDatesCompact,
        formatDatesVerbose: DateService.formatDatesVerbose,
        parseDatesFromString,
        
        // Méthodes utilitaires
        generatePeriods: DateService.generatePeriods,
        isSameDay: DateService.isSameDay
    };

    return (
        <DateContext.Provider value={contextValue}>
            {children}
        </DateContext.Provider>
    );
}

/**
 * Hook personnalisé pour utiliser le contexte de dates
 */
export function useDateContext() {
    const context = useContext(DateContext);
    if (!context) {
        throw new Error('useDateContext doit être utilisé à l\'intérieur d\'un DateProvider');
    }
    return context;
}

export default DateContext;