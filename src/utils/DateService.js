/**
 * Service utilitaire pour gérer les dates dans l'application - VERSION COMPLÈTE
 */

// ✅ IMPORTS DES CONSTANTES
import { 
    DATE_FORMATS,
    LOCALES,
    DATE_VALIDATION_MESSAGES,
    DATE_ERROR_MESSAGES,
    CONTEXT_CONFIGS,
    DATE_HELPERS,
    VALIDATION_TYPES
} from '../constants/dateConstants';

class DateService {
    
    // ========================================
    // ✅ MÉTHODES EXISTANTES (CONSERVÉES)
    // ========================================
    
    /**
     * Formate un tableau de dates selon le format compact utilisé dans l'application
     * @param {Date[]} dates - Tableau de dates à formater
     * @returns {string} - Chaîne formatée (ex: "[01/02.05, 15.06]")
     */
    static formatDatesCompact(dates) {
        if (!dates || dates.length === 0) return '';
        
        const datesByMonth = {};
        
        dates.forEach(date => {
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            const monthKey = `${month}.${year}`;
            
            if (!datesByMonth[monthKey]) {
                datesByMonth[monthKey] = [];
            }
            
            datesByMonth[monthKey].push(date.getDate());
        });
        
        const sortedMonthKeys = Object.keys(datesByMonth).sort((a, b) => {
            const [monthA, yearA] = a.split('.');
            const [monthB, yearB] = b.split('.');
            
            if (yearA !== yearB) {
                return parseInt(yearA) - parseInt(yearB);
            }
            
            return parseInt(monthA) - parseInt(monthB);
        });
        
        const formattedDates = sortedMonthKeys.map(monthKey => {
            const sortedDays = datesByMonth[monthKey].sort((a, b) => a - b);
            const formattedDays = sortedDays.map(day => day.toString().padStart(2, '0'));
            const daysStr = formattedDays.join('/');
            
            return `${daysStr}.${monthKey.split('.')[0]}`;
        });
        
        return `[${formattedDates.join(', ')}]`;
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
     * Analyse une chaîne formatée pour extraire les dates
     * @param {string} formattedString - Chaîne formatée (ex: "[01/02.05, 15.06]")
     * @returns {Date[]} - Tableau de dates
     */
    static parseDatesFromFormattedString(formattedString) {
        console.log('Parsing dates from string:', formattedString);
        if (!formattedString) return [];
        
        try {
            // Extraire le contenu entre crochets
            const dateMatch = formattedString.match(/\[([^\]]+)\]/);
            if (!dateMatch) return [];
            
            const dateString = dateMatch[1];
            console.log('Date string extracted from brackets:', dateString);
            const currentYear = new Date().getFullYear();
            const parsedDates = [];

            // Diviser les différentes sections par virgule
            const sections = dateString.split(',').map(s => s.trim());
            console.log('Sections après division par virgules:', sections);

            // Traiter chaque section
            sections.forEach(section => {
                // Expression pour capturer les formats comme "06/07/08.05"
                // Nous recherchons tous les nombres avant un point, et le nombre après le point
                const dateParts = section.split('.');
                if (dateParts.length < 2) return;

                // Extraire le mois (après le point)
                const monthStr = dateParts[dateParts.length - 1];
                const month = parseInt(monthStr) - 1; // Mois 0-indexé
                
                // Extraire les jours (avant le point)
                const daysStr = dateParts.slice(0, -1).join('.');
                
                // Diviser les jours par "/"
                const days = daysStr.split('/').map(d => parseInt(d.trim()));
                
                console.log(`Pour la section "${section}": jours=${days.join(',')}, mois=${month+1}`);
                
                // Créer des objets Date pour chaque jour
                days.forEach(day => {
                    if (!isNaN(day) && !isNaN(month)) {
                        const date = new Date(currentYear, month, day);
                        parsedDates.push(date);
                        console.log(`Date ajoutée: ${date.toLocaleDateString(LOCALES.PRIMARY)}`);
                    }
                });
            });

            console.log('Dates parsées:', parsedDates.map(d => d.toLocaleDateString(LOCALES.PRIMARY)));
            return parsedDates;
            
        } catch (error) {
            console.error(DATE_ERROR_MESSAGES.PARSE_ERROR, error);
            return [];
        }
    }

    /**
     * Vérifie si deux dates sont le même jour
     * @param {Date} date1 - Première date
     * @param {Date} date2 - Deuxième date
     * @returns {boolean} - True si les dates sont le même jour
     */
    static isSameDay(date1, date2) {
        if (!date1 || !date2) return false;
        
        return (
            date1.getDate() === date2.getDate() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getFullYear() === date2.getFullYear()
        );
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

    // ========================================
    // ✅ NOUVELLES MÉTHODES POUR FORMULAIRES
    // ========================================

    /**
     * Formate une date simple pour l'affichage (format français suisse)
     * @param {Date|string} date - Date à formater
     * @param {string} format - Type de format ('date', 'datetime', 'short')
     * @returns {string} - Date formatée
     */
    static formatSingleDate(date, format = 'date') {
        if (!date) return '';
        
        try {
            const dateObj = typeof date === 'string' ? new Date(date) : date;
            if (isNaN(dateObj.getTime())) return '';
            
            switch (format) {
                case 'date':
                    return dateObj.toLocaleDateString(LOCALES.PRIMARY);
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
     * Convertit une date en string au format YYYY-MM-DD (pour inputs HTML)
     * @param {Date|string} date - Date à convertir
     * @returns {string} - Date au format YYYY-MM-DD
     */
    static toInputFormat(date) {
        if (!date) return '';
        
        try {
            const dateObj = typeof date === 'string' ? new Date(date) : date;
            if (isNaN(dateObj.getTime())) return '';
            
            // ✅ CORRECTION: Utiliser les méthodes locales au lieu de toISOString()
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
            
            // ✅ CORRECTION: Parser manuellement pour éviter les problèmes de timezone
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
        
        // Validation des dates passées
        if (config.MAX_PAST_DAYS) {
            const maxPastDate = new Date();
            maxPastDate.setDate(maxPastDate.getDate() - config.MAX_PAST_DAYS);
            
            if (dateObj < maxPastDate) {
                result.isValid = false;
                result.error = `Date antérieure à ${config.MAX_PAST_DAYS} jours`;
                result.errorType = VALIDATION_TYPES.RANGE;
                return result;
            }
        }
        
        // Validation des dates futures (limite)
        if (config.MAX_FUTURE_DAYS) {
            const maxFutureDate = new Date();
            maxFutureDate.setDate(maxFutureDate.getDate() + config.MAX_FUTURE_DAYS);
            
            if (dateObj > maxFutureDate) {
                result.isValid = false;
                result.error = `Date postérieure à ${config.MAX_FUTURE_DAYS} jours`;
                result.errorType = VALIDATION_TYPES.RANGE;
                return result;
            }
        }
        
        // Validation des jours ouvrables
        if (!config.ALLOW_WEEKENDS && !DATE_HELPERS.isBusinessDay(dateObj)) {
            result.isValid = false;
            result.error = DATE_VALIDATION_MESSAGES.WEEKEND_NOT_ALLOWED;
            result.errorType = VALIDATION_TYPES.BUSINESS_DAY;
            return result;
        }
        
        // Validation personnalisée
        if (config.customValidator && typeof config.customValidator === 'function') {
            const customResult = config.customValidator(dateObj);
            if (!customResult.isValid) {
                result.isValid = false;
                result.error = customResult.error;
                result.errorType = VALIDATION_TYPES.CUSTOM;
                return result;
            }
        }
        
        return result;
    }

    /**
     * Retourne aujourd'hui au format YYYY-MM-DD
     * @returns {string} - Date d'aujourd'hui
     */
    static getTodayInputFormat() {
        // ✅ CORRECTION: Utiliser toInputFormat pour la cohérence
        return this.toInputFormat(new Date());
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
     * Calcule l'âge d'une date (en jours)
     * @param {Date|string} date - Date de référence
     * @returns {number} - Nombre de jours depuis la date (positif si passé, négatif si futur)
     */
    static getDaysFromDate(date) {
        if (!date) return 0;
        
        try {
            const dateObj = typeof date === 'string' ? new Date(date) : date;
            const today = new Date();
            const diffTime = today - dateObj;
            return Math.floor(diffTime / (1000 * 60 * 60 * 24));
        } catch (error) {
            console.error(DATE_ERROR_MESSAGES.CONVERSION_ERROR, error);
            return 0;
        }
    }

    /**
     * Formate une durée relative (il y a X jours, dans X jours)
     * @param {Date|string} date - Date à comparer
     * @returns {string} - Texte formaté
     */
    static getRelativeTime(date) {
        if (!date) return '';
        
        try {
            const days = this.getDaysFromDate(date);
            
            if (days === 0) return 'Aujourd\'hui';
            if (days === 1) return 'Hier';
            if (days === -1) return 'Demain';
            if (days > 0) return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
            if (days < 0) return `Dans ${Math.abs(days)} jour${Math.abs(days) > 1 ? 's' : ''}`;
            
            return '';
        } catch (error) {
            console.error(DATE_ERROR_MESSAGES.CONVERSION_ERROR, error);
            return '';
        }
    }

    /**
     * Vérifie si une date est aujourd'hui
     * @param {Date|string} date - Date à vérifier
     * @returns {boolean} - True si c'est aujourd'hui
     */
    static isToday(date) {
        if (!date) return false;
        
        try {
            const dateObj = typeof date === 'string' ? new Date(date) : date;
            return DATE_HELPERS.isToday(dateObj);
        } catch (error) {
            return false;
        }
    }

    /**
     * Vérifie si une date est dans le futur
     * @param {Date|string} date - Date à vérifier
     * @returns {boolean} - True si c'est dans le futur
     */
    static isFuture(date) {
        if (!date) return false;
        
        try {
            const dateObj = typeof date === 'string' ? new Date(date) : date;
            return DATE_HELPERS.isFuture(dateObj);
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
     * Vérifie si une date est un jour ouvrable
     * @param {Date|string} date - Date à vérifier
     * @returns {boolean} - True si c'est un jour ouvrable
     */
    static isBusinessDay(date) {
        if (!date) return false;
        
        try {
            const dateObj = typeof date === 'string' ? new Date(date) : date;
            return DATE_HELPERS.isBusinessDay(dateObj);
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
    static daysBetween(date1, date2) {
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
     * Retourne le début et la fin d'une période pour une date donnée
     * @param {Date|string} date - Date de référence
     * @param {string} period - Période ('day', 'week', 'month', 'year')
     * @returns {Object} - {start: Date, end: Date}
     */
    static getPeriodBounds(date, period = 'day') {
        if (!date) return { start: null, end: null };
        
        try {
            const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
            let start, end;
            
            switch (period) {
                case 'day':
                    start = new Date(dateObj);
                    start.setHours(0, 0, 0, 0);
                    end = new Date(dateObj);
                    end.setHours(23, 59, 59, 999);
                    break;
                    
                case 'week':
                    start = new Date(dateObj);
                    start.setDate(dateObj.getDate() - dateObj.getDay() + 1); // Lundi
                    start.setHours(0, 0, 0, 0);
                    end = new Date(start);
                    end.setDate(start.getDate() + 6); // Dimanche
                    end.setHours(23, 59, 59, 999);
                    break;
                    
                case 'month':
                    start = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1);
                    end = new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0);
                    end.setHours(23, 59, 59, 999);
                    break;
                    
                case 'year':
                    start = new Date(dateObj.getFullYear(), 0, 1);
                    end = new Date(dateObj.getFullYear(), 11, 31);
                    end.setHours(23, 59, 59, 999);
                    break;
                    
                default:
                    return { start: null, end: null };
            }
            
            return { start, end };
        } catch (error) {
            console.error(DATE_ERROR_MESSAGES.CONVERSION_ERROR, error);
            return { start: null, end: null };
        }
    }

    /**
     * ✅ NOUVEAU: Méthode utilitaire pour créer une date "sûre" sans décalage
     * @param {number} year - Année
     * @param {number} month - Mois (1-12, pas 0-indexé)
     * @param {number} day - Jour
     * @returns {Date|null} - Date créée ou null si invalide
     */
    static createSafeDate(year, month, day) {
        try {
            // Convertir le mois en 0-indexé
            const date = new Date(year, month - 1, day);
            
            // Vérifier que la date correspond aux valeurs entrées
            if (date.getFullYear() !== year || 
                date.getMonth() !== (month - 1) || 
                date.getDate() !== day) {
                return null;
            }
            
            return date;
        } catch (error) {
            console.error('Erreur création date sûre:', error);
            return null;
        }
    }

    /**
     * ✅ NOUVEAU: Vérifie si une date est la même que celle d'aujourd'hui (sans heure)
     * @param {Date|string} date - Date à vérifier
     * @returns {boolean} - True si c'est aujourd'hui
     */
    static isSameDayAsToday(date) {
        if (!date) return false;
        
        try {
            const dateObj = typeof date === 'string' ? this.fromInputFormat(date) : date;
            if (!dateObj) return false;
            
            const today = new Date();
            
            return (
                dateObj.getDate() === today.getDate() &&
                dateObj.getMonth() === today.getMonth() &&
                dateObj.getFullYear() === today.getFullYear()
            );
        } catch (error) {
            return false;
        }
    }

    /**
     * ✅ NOUVEAU: Compare deux dates en ignorant l'heure
     * @param {Date|string} date1 - Première date
     * @param {Date|string} date2 - Deuxième date
     * @returns {number} - -1 si date1 < date2, 0 si égales, 1 si date1 > date2
     */
    static compareDatesOnly(date1, date2) {
        if (!date1 || !date2) return 0;
        
        try {
            const d1 = typeof date1 === 'string' ? this.fromInputFormat(date1) : date1;
            const d2 = typeof date2 === 'string' ? this.fromInputFormat(date2) : date2;
            
            if (!d1 || !d2) return 0;
            
            // Créer des dates sans heure pour la comparaison
            const date1Only = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate());
            const date2Only = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate());
            
            if (date1Only < date2Only) return -1;
            if (date1Only > date2Only) return 1;
            return 0;
        } catch (error) {
            console.error('Erreur comparaison dates:', error);
            return 0;
        }
    }

    /**
     * ✅ NOUVEAU: Vérifie si une date est strictement dans le futur (après aujourd'hui)
     * @param {Date|string} date - Date à vérifier
     * @returns {boolean} - True si la date est après aujourd'hui
     */
    static isStrictlyFuture(date) {
        if (!date) return false;
        
        try {
            const dateObj = typeof date === 'string' ? this.fromInputFormat(date) : date;
            if (!dateObj) return false;
            
            const today = new Date();
            const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const dateOnly = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
            
            return dateOnly > todayOnly;
        } catch (error) {
            return false;
        }
    }

}

export default DateService;