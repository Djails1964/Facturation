/**
 * Service utilitaire pour gérer les dates dans l'application
 */
class DateService {
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
            date.toLocaleDateString('fr-CH', { 
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
                    console.log(`Date ajoutée: ${date.toLocaleDateString('fr-CH')}`);
                }
            });
        });

        console.log('Dates parsées:', parsedDates.map(d => d.toLocaleDateString('fr-CH')));
        return parsedDates;
    }

    /**
     * Vérifie si deux dates sont le même jour
     * @param {Date} date1 - Première date
     * @param {Date} date2 - Deuxième date
     * @returns {boolean} - True si les dates sont le même jour
     */
    static isSameDay(date1, date2) {
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
}

export default DateService;