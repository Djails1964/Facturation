/**
 * Service utilitaire pour gérer les dates dans l'application - VERSION NETTOYÉE
 */

// ✅ IMPORTS DES CONSTANTES (seulement celles utilisées)
import { 
    LOCALES,
    DATE_VALIDATION_MESSAGES,
    DATE_ERROR_MESSAGES,
    CONTEXT_CONFIGS,
    DATE_HELPERS,
    VALIDATION_TYPES
} from '../constants/dateConstants';

class DateService {
    
    // ========================================
    // ✅ MÉTHODES PRINCIPALES (dédupliquées)
    // ========================================
    
    /**
     * Formate un tableau de dates au format compact spécifique
     * Format de sortie: [09/16/23/30.01, 06/13/20/27.02, 06/13/20/27.03, 03/10.04]
     * @param {Date[]} dates - Tableau de dates
     * @returns {string} - Chaîne formatée au format spécifique
     */
    static formatDatesCompact(dates) {
        if (!Array.isArray(dates) || dates.length === 0) {
            return '';
        }

        try {
            // Filtrer les dates valides et trier
            const validDates = dates
                .filter(date => date instanceof Date && !isNaN(date.getTime()))
                .sort((a, b) => a.getTime() - b.getTime());

            if (validDates.length === 0) {
                return '';
            }

            // Grouper les dates par mois
            const monthGroups = {};
            
            validDates.forEach(date => {
                const month = date.getMonth() + 1; // 1-12
                const day = date.getDate();
                
                if (!monthGroups[month]) {
                    monthGroups[month] = [];
                }
                monthGroups[month].push(day);
            });

            // Construire la chaîne formatée
            const formattedGroups = [];
            
            // Trier les mois
            const sortedMonths = Object.keys(monthGroups).sort((a, b) => parseInt(a) - parseInt(b));
            
            for (const month of sortedMonths) {
                const days = monthGroups[month].sort((a, b) => a - b);
                const monthPadded = month.toString().padStart(2, '0');
                const daysPadded = days.map(day => day.toString().padStart(2, '0'));
                const daysString = daysPadded.join('/');
                
                formattedGroups.push(`${daysString}.${monthPadded}`);
            }

            return `[${formattedGroups.join(', ')}]`;
            
        } catch (error) {
            console.error('Erreur lors du formatage des dates au format spécifique:', error);
            return '';
        }
    }

    /**
     * Analyse une chaîne formatée pour extraire les dates
     * Parse une chaîne de dates au format spécifique et retourne un tableau de dates
     * Format: [09/16/23/30.01, 06/13/20/27.02, 06/13/20/27.03, 03/10.04]
     * @param {string} formattedString - Chaîne de dates au format spécifique
     * @returns {Date[]} - Tableau de dates parsées
     */
    static parseDatesFromCompact(formattedString) {
        if (!formattedString || typeof formattedString !== 'string') {
            return [];
        }

        try {
            // Enlever les crochets et diviser par virgules
            const cleanString = formattedString.replace(/^\[|\]$/g, '').trim();
            if (!cleanString) return [];
            
            const monthGroups = cleanString.split(',').map(str => str.trim()).filter(str => str.length > 0);
            const dates = [];
            const currentYear = new Date().getFullYear();
            
            for (const monthGroup of monthGroups) {
                // Format attendu: "09/16/23/30.01" ou "03/10.04"
                const parts = monthGroup.split('.');
                if (parts.length !== 2) continue;
                
                const daysStr = parts[0]; // "09/16/23/30"
                const monthStr = parts[1]; // "01"
                
                const month = parseInt(monthStr, 10);
                if (isNaN(month) || month < 1 || month > 12) continue;
                
                // Diviser les jours par "/"
                const days = daysStr.split('/').map(d => d.trim()).filter(d => d.length > 0);
                
                for (const dayStr of days) {
                    const day = parseInt(dayStr, 10);
                    if (isNaN(day) || day < 1 || day > 31) continue;
                    
                    // Créer la date avec l'année courante
                    const date = new Date(currentYear, month - 1, day);
                    
                    // Vérifier que la date est valide
                    if (!isNaN(date.getTime()) && 
                        date.getMonth() === month - 1 && 
                        date.getDate() === day) {
                        dates.push(date);
                    }
                }
            }
            
            // Trier les dates par ordre chronologique
            dates.sort((a, b) => a.getTime() - b.getTime());
            
            return dates;
            
        } catch (error) {
            console.error('Erreur lors du parsing des dates au format spécifique:', error);
            return [];
        }
    }

    /**
     * Formate un tableau de dates en format verbose
     * @param {Date[]} dates - Tableau de dates à formater
     * @returns {string} - Chaîne lisible (ex: "01/02.05.2023, 15.06.2023")
     */
    static formatDatesVerbose(dates) {
        if (!dates || dates.length === 0) return '';
        
        return dates.map(date => 
            date.toLocaleDateString(LOCALES.PRIMARY, { 
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            })
        ).join(', ');
    }

    /**
     * Formate un tableau de dates en chaîne détaillée lisible
     * Exemple: [Date, Date] → "Lundi 09 janvier, Mardi 16 janvier, Mercredi 23 janvier, etc."
     * @param {Date[]} dates - Tableau de dates
     * @param {string} locale - Locale pour les noms (défaut: 'fr-CH')
     * @returns {string} - Chaîne formatée lisible
     */
    static formatDatesWithDayNames(dates, locale = 'fr-CH') {
        if (!Array.isArray(dates) || dates.length === 0) {
            return '';
        }

        try {
            const validDates = dates
                .filter(date => date instanceof Date && !isNaN(date.getTime()))
                .sort((a, b) => a.getTime() - b.getTime());

            if (validDates.length === 0) {
                return '';
            }

            const formattedDates = validDates.map(date => {
                const dayName = date.toLocaleDateString(locale, { weekday: 'long' });
                const dayNameCapitalized = dayName.charAt(0).toUpperCase() + dayName.slice(1);
                const dateFormatted = date.toLocaleDateString(locale, {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
                
                return `${dayNameCapitalized} ${dateFormatted}`;
            });

            return formattedDates.join(', ');
            
        } catch (error) {
            console.error('Erreur lors du formatage des dates avec noms:', error);
            return this.formatDatesCompact(dates); // Fallback
        }
    }

    /**
     * Optimise l'affichage d'une liste de dates en détectant les séquences
     * @param {Date[]} dates - Tableau de dates
     * @param {boolean} useRanges - Si true, groupe les dates consécutives
     * @returns {string} - Chaîne optimisée
     */
    static formatDatesOptimized(dates, useRanges = true) {
        if (!Array.isArray(dates) || dates.length === 0) {
            return '';
        }

        if (!useRanges || dates.length < 3) {
            return this.formatDatesCompact(dates);
        }

        try {
            const validDates = dates
                .filter(date => date instanceof Date && !isNaN(date.getTime()))
                .sort((a, b) => a.getTime() - b.getTime());

            if (validDates.length === 0) {
                return '';
            }

            // Grouper les dates consécutives
            const groups = [];
            let currentGroup = [validDates[0]];

            for (let i = 1; i < validDates.length; i++) {
                const prevDate = validDates[i - 1];
                const currentDate = validDates[i];
                
                // Vérifier si les dates sont consécutives (différence d'1 jour)
                const diffDays = (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
                
                if (diffDays === 1) {
                    currentGroup.push(currentDate);
                } else {
                    groups.push([...currentGroup]);
                    currentGroup = [currentDate];
                }
            }
            groups.push(currentGroup);

            // Formater chaque groupe
            const formattedGroups = groups.map(group => {
                if (group.length <= 2) {
                    return this.formatDatesCompact(group);
                } else {
                    // Séquence de 3+ dates : format de plage
                    const firstDate = group[0];
                    const lastDate = group[group.length - 1];
                    
                    const firstDay = firstDate.getDate().toString().padStart(2, '0');
                    const lastDay = lastDate.getDate().toString().padStart(2, '0');
                    const month = (lastDate.getMonth() + 1).toString().padStart(2, '0');
                    
                    // Si même mois: "01-05.01", sinon format complet
                    if (firstDate.getMonth() === lastDate.getMonth() && 
                        firstDate.getFullYear() === lastDate.getFullYear()) {
                        return `[${firstDay}-${lastDay}.${month}]`;
                    } else {
                        return this.formatDatesCompact(group);
                    }
                }
            });

            return formattedGroups.join(', ');
            
        } catch (error) {
            console.error('Erreur lors du formatage optimisé:', error);
            return this.formatDatesCompact(dates); // Fallback
        }
    }

    /**
     * Convertit des dates au format spécifique vers un format lisible pour l'affichage
     * @param {string} compactString - Chaîne au format spécifique
     * @param {string} format - Format de sortie ('readable', 'short', 'count')
     * @returns {string} - Chaîne formatée pour l'affichage
     */
    static formatCompactToDisplay(compactString, format = 'readable') {
        const dates = this.parseDatesFromCompact(compactString);
        
        if (dates.length === 0) {
            return '';
        }
        
        switch (format) {
            case 'count':
                return `${dates.length} date${dates.length > 1 ? 's' : ''}`;
                
            case 'short':
                if (dates.length <= 3) {
                    return dates.map(date => 
                        `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}`
                    ).join(', ');
                } else {
                    const first = dates[0];
                    const last = dates[dates.length - 1];
                    return `${first.getDate().toString().padStart(2, '0')}.${(first.getMonth() + 1).toString().padStart(2, '0')} - ${last.getDate().toString().padStart(2, '0')}.${(last.getMonth() + 1).toString().padStart(2, '0')} (${dates.length})`;
                }
                
            case 'readable':
            default:
                return this.formatDatesWithDayNames(dates);
        }
    }

    /**
     * Convertit une string au format DD.MM.YYYY (format d'affichage européen) en objet Date
     * @param {string} dateString - String au format DD.MM.YYYY
     * @returns {Date|null} - Objet Date ou null si invalide
     */
    static fromDisplayFormat(dateString) {
        if (!dateString || typeof dateString !== 'string') return null;
        
        try {
            // Vérifier le format DD.MM.YYYY
            if (!dateString.match(/^\d{2}\.\d{2}\.\d{4}$/)) return null;
            
            const parts = dateString.split('.');
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1; // Mois 0-indexé
            const year = parseInt(parts[2], 10);
            
            // Créer la date en heure locale
            const date = new Date(year, month, day);
            
            // Vérifier que la date est valide
            if (date.getFullYear() !== year || 
                date.getMonth() !== month || 
                date.getDate() !== day) {
                return null;
            }
            
            return date;
            
        } catch (error) {
            console.error(DATE_ERROR_MESSAGES.CONVERSION_ERROR, error);
            return null;
        }
    }

    /**
     * Convertit une date en string au format YYYY-MM-DD (pour inputs HTML)
     * @param {Date|string} date - Date à convertir
     * @returns {string} - Date au format YYYY-MM-DD
     */
    static toInputFormat(date) {
        if (!date) return '';
        
        try {
            const dateObj = typeof date === 'string' ? new Date(date) : date;
            if (isNaN(dateObj.getTime())) return '';
            
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getDate()).padStart(2, '0');
            
            return `${year}-${month}-${day}`;
            
        } catch (error) {
            console.error(DATE_ERROR_MESSAGES.CONVERSION_ERROR, error);
            return '';
        }
    }

    /**
     * Convertit une string au format YYYY-MM-DD en objet Date
     * @param {string} dateString - String au format YYYY-MM-DD
     * @returns {Date|null} - Objet Date ou null si invalide
     */
    static fromInputFormat(dateString) {
        if (!dateString || typeof dateString !== 'string') return null;
        
        try {
            // Vérifier le format YYYY-MM-DD
            if (!dateString.match(/^\d{4}-\d{2}-\d{2}$/)) return null;
            
            const parts = dateString.split('-');
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1; // Mois 0-indexé en JavaScript
            const day = parseInt(parts[2], 10);
            
            // Créer la date en heure locale
            const date = new Date(year, month, day);
            
            // Vérifier que la date est valide et correspond aux valeurs entrées
            if (date.getFullYear() !== year || 
                date.getMonth() !== month || 
                date.getDate() !== day) {
                return null;
            }
            
            return date;
            
        } catch (error) {
            console.error(DATE_ERROR_MESSAGES.CONVERSION_ERROR, error);
            return null;
        }
    }

    /**
     * Formate une date simple pour l'affichage (format français suisse)
     * @param {Date|string} date - Date à formater
     * @param {string} format - Type de format ('date', 'datetime', 'short', 'compact')
     * @returns {string} - Date formatée
     */
    static formatSingleDate(date, format = 'date') {
        if (!date) return '';
        
        try {
            const dateObj = typeof date === 'string' ? 
                (this.fromDisplayFormat(date) || this.fromInputFormat(date) || new Date(date)) : date;
            
            if (isNaN(dateObj.getTime())) return '';
            
            switch (format) {
                case 'compact':
                    const day = dateObj.getDate().toString().padStart(2, '0');
                    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
                    return `${day}.${month}`;
                    
                case 'date':
                    return dateObj.toLocaleDateString(LOCALES.PRIMARY, {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                    });
                    
                case 'datetime':
                    return dateObj.toLocaleDateString(LOCALES.PRIMARY) + ' ' + 
                           dateObj.toLocaleTimeString(LOCALES.PRIMARY, { 
                               hour: '2-digit', 
                               minute: '2-digit' 
                           });
                case 'short':
                    return dateObj.toLocaleDateString(LOCALES.PRIMARY, {
                        day: '2-digit',
                        month: '2-digit'
                    });
                case 'long':
                    return dateObj.toLocaleDateString(LOCALES.PRIMARY, {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
                default:
                    return dateObj.toLocaleDateString(LOCALES.PRIMARY);
            }
        } catch (error) {
            console.error(DATE_ERROR_MESSAGES.FORMAT_ERROR, error);
            return '';
        }
    }

    /**
     * Retourne aujourd'hui comme objet Date (00:00:00)
     * @returns {Date} - Date d'aujourd'hui
     */
    static getToday() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
    }

    /**
     * Retourne aujourd'hui au format YYYY-MM-DD
     * @returns {string} - Date d'aujourd'hui
     */
    static getTodayInputFormat() {
        return this.toInputFormat(new Date());
    }

    /**
     * Vérifie si deux dates sont le même jour
     * @param {Date} date1 - Première date
     * @param {Date} date2 - Deuxième date
     * @returns {boolean} - True si les dates sont le même jour
     */
    static isSameDay(date1, date2) {
        if (!date1 || !date2 || 
            !(date1 instanceof Date) || !(date2 instanceof Date) ||
            isNaN(date1.getTime()) || isNaN(date2.getTime())) {
            return false;
        }
        
        return (
            date1.getDate() === date2.getDate() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getFullYear() === date2.getFullYear()
        );
    }

    /**
     * Vérifie si une date est dans le futur (strictement après aujourd'hui)
     * @param {Date|string} date - Date à vérifier
     * @returns {boolean} - True si la date est après aujourd'hui
     */
    static isStrictlyFuture(date) {
        if (!date) return false;
        
        try {
            const dateObj = typeof date === 'string' ? this.fromInputFormat(date) : date;
            if (!dateObj || !(dateObj instanceof Date) || isNaN(dateObj.getTime())) return false;
            
            const today = new Date();
            const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const dateOnly = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
            
            return dateOnly > todayOnly;
        } catch (error) {
            return false;
        }
    }

    /**
     * Vérifie si une date est dans le passé
     * @param {Date|string} date - Date à vérifier
     * @returns {boolean} - True si c'est dans le passé
     */
    static isPast(date) {
        if (!date) return false;
        
        try {
            const dateObj = typeof date === 'string' ? new Date(date) : date;
            return DATE_HELPERS.isPast(dateObj);
        } catch (error) {
            return false;
        }
    }

    /**
     * Ajoute ou soustrait des jours à une date
     * @param {Date|string} date - Date de base
     * @param {number} days - Nombre de jours (positif ou négatif)
     * @returns {Date|null} - Nouvelle date
     */
    static addDays(date, days) {
        if (!date || typeof days !== 'number') return null;
        
        try {
            const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
            dateObj.setDate(dateObj.getDate() + days);
            return dateObj;
        } catch (error) {
            console.error(DATE_ERROR_MESSAGES.CONVERSION_ERROR, error);
            return null;
        }
    }

    /**
     * Compare deux dates et retourne la différence en jours
     * @param {Date|string} date1 - Première date
     * @param {Date|string} date2 - Deuxième date
     * @returns {number} - Différence en jours (date2 - date1)
     */
    static daysDifference(date1, date2) {
        if (!date1 || !date2) return 0;
        
        try {
            const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
            const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
            
            const diffTime = d2 - d1;
            return Math.floor(diffTime / (1000 * 60 * 60 * 24));
        } catch (error) {
            console.error(DATE_ERROR_MESSAGES.CONVERSION_ERROR, error);
            return 0;
        }
    }

    /**
     * Valide qu'une chaîne contient des dates valides
     * @param {string} dateString - Chaîne à valider
     * @returns {Object} - { isValid: boolean, errors: string[], parsedCount: number }
     */
    static validateDatesString(dateString) {
        if (!dateString || typeof dateString !== 'string') {
            return { isValid: true, errors: [], parsedCount: 0 }; // Chaîne vide = valide
        }

        try {
            const parsedDates = this.parseDatesFromCompact(dateString);
            const errors = [];
            
            // Vérifier le format des crochets
            if (!dateString.startsWith('[') || !dateString.endsWith(']')) {
                errors.push('Le format doit être entouré de crochets []');
            }
            
            // Vérifier que la chaîne n'est pas vide après suppression des crochets
            const innerContent = dateString.replace(/^\[|\]$/g, '').trim();
            if (innerContent && parsedDates.length === 0) {
                errors.push('Aucune date valide trouvée dans la chaîne');
            }
            
            // Vérifier le format général avec regex (échapper correctement)
            const formatRegex = /^\[[\d/,.\s]+\]$/;
            if (innerContent && !formatRegex.test(dateString)) {
                errors.push('Format incorrect. Attendu: [jj/jj.MM, jj/jj.MM]');
            }

            return {
                isValid: errors.length === 0,
                errors: errors,
                parsedCount: parsedDates.length
            };
            
        } catch (error) {
            return {
                isValid: false,
                errors: ['Erreur lors de la validation: ' + error.message],
                parsedCount: 0
            };
        }
    }

    /**
     * Vérifie si une chaîne de date a un format valide
     * @param {string} dateStr - Chaîne de date à vérifier
     * @returns {boolean} - True si le format est valide
     */
    static isValidDateFormat(dateStr) {
        if (!dateStr || typeof dateStr !== 'string') {
            return false;
        }

        // Format spécifique: [09/16/23/30.01, 06/13/20/27.02, etc.]
        const specificFormatRegex = /^\[[\d/,.\s]+\]$/;
        return specificFormatRegex.test(dateStr.trim());
    }

    /**
     * Valide si une date est dans une plage acceptable selon le contexte
     * @param {Date|string} date - Date à valider
     * @param {string} context - Contexte ('payment', 'invoice', 'appointment')
     * @param {Object} customOptions - Options personnalisées
     * @returns {Object} - {isValid: boolean, error: string, errorType: string}
     */
    static validateDate(date, context = 'default', customOptions = {}) {
        const result = { 
            isValid: true, 
            error: '', 
            errorType: null 
        };
        
        // Vérification de base
        if (!date) {
            result.isValid = false;
            result.error = DATE_VALIDATION_MESSAGES.REQUIRED;
            result.errorType = VALIDATION_TYPES.REQUIRED;
            return result;
        }
        
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        
        if (isNaN(dateObj.getTime())) {
            result.isValid = false;
            result.error = DATE_VALIDATION_MESSAGES.INVALID_DATE;
            result.errorType = VALIDATION_TYPES.FORMAT;
            return result;
        }
        
        // Configuration selon le contexte
        const config = {
            ...CONTEXT_CONFIGS[context.toUpperCase()],
            ...customOptions
        };
        
        // Validation des dates futures
        if (!config.ALLOW_FUTURE && DATE_HELPERS.isFuture(dateObj)) {
            result.isValid = false;
            result.error = DATE_VALIDATION_MESSAGES.FUTURE_NOT_ALLOWED;
            result.errorType = VALIDATION_TYPES.FUTURE;
            return result;
        }
        
        return result;
    }

    /**
     * Génère des périodes (jours, semaines, mois) autour d'une date
     * @param {Date} date - Date de référence
     * @param {string} type - Type de période ('day', 'week', 'month')
     * @param {number} count - Nombre de périodes à générer avant et après
     * @returns {Object} - Objet contenant les périodes avant et après
     */
    static generatePeriods(date, type = 'day', count = 5) {
        const result = {
            before: [],
            after: []
        };

        if (!date || !(date instanceof Date)) {
            console.error(DATE_ERROR_MESSAGES.CONVERSION_ERROR);
            return result;
        }

        const refDate = new Date(date);
        
        for (let i = 1; i <= count; i++) {
            const beforeDate = new Date(refDate);
            const afterDate = new Date(refDate);
            
            if (type === 'day') {
                beforeDate.setDate(beforeDate.getDate() - i);
                afterDate.setDate(afterDate.getDate() + i);
            } else if (type === 'week') {
                beforeDate.setDate(beforeDate.getDate() - (i * 7));
                afterDate.setDate(afterDate.getDate() + (i * 7));
            } else if (type === 'month') {
                beforeDate.setMonth(beforeDate.getMonth() - i);
                afterDate.setMonth(afterDate.getMonth() + i);
            }
            
            result.before.unshift(beforeDate);
            result.after.push(afterDate);
        }
        
        return result;
    }

    /**
     * Configuration spécifique pour le contexte des paiements
     * @returns {Object} - Configuration pour les paiements
     */
    static getPaymentDateConfig() {
        return {
            allowFuture: false,
            maxDate: this.getToday(),
            minDate: null,
            title: 'Sélectionner la date de paiement',
            helpText: 'Les dates futures ne sont pas autorisées pour les paiements.'
        };
    }

    /**
     * Configuration spécifique pour le contexte des factures
     * @returns {Object} - Configuration pour les factures
     */
    static getInvoiceDateConfig() {
        return {
            allowFuture: true,
            maxDate: null,
            minDate: null,
            title: 'Sélectionner les dates de facturation',
            helpText: 'Vous pouvez sélectionner des dates futures pour la facturation.'
        };
    }
}

export default DateService;