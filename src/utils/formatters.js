// src/utils/formatters.js - Version améliorée

/**
 * Formate un montant avec séparateur de milliers
 * @param {number|string} montant - Le montant à formater 
 * @returns {string} Montant formaté
 */
export const formatMontant = (montant) => {
    return new Intl.NumberFormat('fr-CH', { 
        minimumFractionDigits: 2,
        maximumFractionDigits: 2 
    }).format(parseFloat(montant) || 0);
};

/**
 * ✅ AMÉLIORÉ: Formate une date avec options multiples
 * @param {string} dateStr - La date au format AAAA-MM-JJ ou ISO
 * @param {string} format - Type de format ('date', 'datetime', 'time')
 * @returns {string} Date formatée
 */
export const formatDate = (dateStr, format = 'date') => {
    if (!dateStr) return '';
    
    try {
        const date = new Date(dateStr);
        
        switch (format) {
            case 'datetime':
                return new Intl.DateTimeFormat('fr-CH', { 
                    day: '2-digit', 
                    month: '2-digit', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }).format(date);
                
            case 'time':
                return new Intl.DateTimeFormat('fr-CH', { 
                    hour: '2-digit',
                    minute: '2-digit'
                }).format(date);
                
            case 'date':
            default:
                return new Intl.DateTimeFormat('fr-CH', { 
                    day: '2-digit', 
                    month: '2-digit', 
                    year: 'numeric' 
                }).format(date);
        }
    } catch (e) {
        console.error('Erreur lors du formatage de la date:', e);
        return dateStr;
    }
};

// Fonction utilitaire pour formater une date au format YYYY-MM-DD pour l'input HTML
export const formatDateToYYYYMMDD = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Formate un numéro de téléphone selon le format suisse
 * @param {string} tel - Le numéro de téléphone à formater
 * @returns {string} Numéro formaté
 */
export const formatTelephone = (tel) => {
    if (!tel) return '';
    
    // Supprime tous les caractères non numériques
    const numero = tel.replace(/\D/g, '');
    
    // Format suisse: 012 345 67 89
    if (numero.length === 10) {
        return `${numero.substring(0, 3)} ${numero.substring(3, 6)} ${numero.substring(6, 8)} ${numero.substring(8, 10)}`;
    }
    
    return tel;
};

/**
 * Formate un NPA/code postal selon le format suisse
 * @param {string|number} npa - Le NPA à formater
 * @returns {string} NPA formaté
 */
export const formatNPA = (npa) => {
    if (!npa) return '';
    
    // Convertir en chaîne et remplir avec des zéros si nécessaire
    const npaStr = String(npa).padStart(4, '0');
    
    return npaStr;
};

/**
 * Convertit une chaîne en format titre (première lettre de chaque mot en majuscule)
 * @param {string} str - La chaîne à formater
 * @returns {string} Chaîne formatée
 */
export const toTitleCase = (str) => {
    if (!str) return '';
    
    return str
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

/**
 * Retourne une version courte d'une chaîne avec une longueur maximale définie
 * @param {string} str - La chaîne à tronquer
 * @param {number} maxLength - Longueur maximale désirée
 * @returns {string} Chaîne tronquée
 */
export const truncateString = (str, maxLength = 50) => {
    if (!str) return '';
    
    if (str.length <= maxLength) return str;
    
    return str.substring(0, maxLength - 3) + '...';
};

/**
 * Formatage des adresses suisses
 * @param {Object} adresse - Objet contenant rue, numero, npa, localite
 * @returns {string} Adresse formatée
 */
export const formatAdresse = (adresse) => {
    if (!adresse) return '';

    const { rue, numero, npa, localite } = adresse;
    let result = '';
    
    if (rue) {
        result += rue;
        if (numero) result += ' ' + numero;
    }
    
    if (npa || localite) {
        if (result) result += ', ';
        if (npa) result += formatNPA(npa) + ' ';
        if (localite) result += localite;
    }
    
    return result;
};

/**
 * ✅ AMÉLIORÉ: Retourne la classe CSS correspondant à l'état universel
 * @param {string} etat - L'état de l'objet
 * @returns {string} La classe CSS correspondante pour les badges universels
 */
export const getEtatClass = (etat) => {
    if (!etat) return 'etat-default';
    
    const etatLower = etat.toLowerCase();
    
    // États de factures
    switch (etatLower) {
        case 'payée':
        case 'payee':
            return 'etat-payee';
        case 'partiellement payée':
        case 'partiellement payee':
            return 'etat-partiellement-payee';
        case 'en attente':
            return 'etat-attente';
        case 'éditée':
        case 'editee':
            return 'etat-editee';
        case 'retard':
            return 'etat-retard';
        case 'annulée':
        case 'annulee':
        case 'annule':
        case 'annulé':
            return 'etat-annulee';
        case 'envoyée':
        case 'envoyee':
            return 'etat-envoyee';
        // États de paiements
        case 'validé':
        case 'valide':
            return 'etat-valide';
        case 'confirme':
        case 'confirmé':
            return 'etat-confirme';
        default:
            return 'etat-default';
    }
};

/**
 * ✅ AMÉLIORÉ: Retourne les classes CSS complètes pour un badge d'état
 * @param {string} etat - L'état de l'objet
 * @param {string} variant - Variante optionnelle ('small', 'large')
 * @returns {string} Les classes CSS complètes
 */
export const getBadgeClasses = (etat, variant = '') => {
    const baseClass = 'etat-badge';
    const etatClass = getEtatClass(etat);
    const variantClass = variant ? `badge-${variant}` : '';
    
    return [baseClass, etatClass, variantClass]
        .filter(Boolean)
        .join(' ');
};

/**
 * ✅ AMÉLIORÉ: Formate le texte d'affichage des états pour les badges
 * @param {string} etat - État de l'objet
 * @returns {string} Texte formaté pour affichage
 */
export const formatEtatText = (etat) => {
    if (!etat) return '';
    
    const etatLower = etat.toLowerCase();
    
    switch(etatLower) {
        case 'partiellement payée':
        case 'partiellement payee':
            return 'Part. Payée';
        case 'confirme':
        case 'confirmé':
            return 'Confirmé';
        case 'annule':
        case 'annulé':
        case 'annulee':
        case 'annulée':
            return 'Annulé';
        case 'valide':
        case 'validé':
            return 'Validé';
        case 'editee':
        case 'éditée':
            return 'Éditée';
        case 'envoyee':
        case 'envoyée':
            return 'Envoyée';
        case 'payee':
        case 'payée':
            return 'Payée';
        default: 
            return etat;
    }
};

/**
 * ✅ NOUVEAU: Vérifie si un état est considéré comme "payé" (complètement ou partiellement)
 * @param {string} etat - L'état de la facture
 * @returns {boolean} True si l'état indique un paiement
 */
export const isEtatPaye = (etat) => {
    if (!etat) return false;
    
    const etatLower = etat.toLowerCase();
    return etatLower === 'payée' || 
           etatLower === 'payee' || 
           etatLower === 'partiellement payée' ||
           etatLower === 'partiellement payee';
};

/**
 * ✅ NOUVEAU: Vérifie si un état est considéré comme "en cours" (non finalisé)
 * @param {string} etat - L'état de la facture
 * @returns {boolean} True si l'état indique que la facture est en cours
 */
export const isEtatEnCours = (etat) => {
    if (!etat) return false;
    
    const etatLower = etat.toLowerCase();
    return etatLower === 'en attente' || 
           etatLower === 'éditée' || 
           etatLower === 'editee' ||
           etatLower === 'envoyée' ||
           etatLower === 'envoyee' ||
           etatLower === 'retard';
};

/**
 * ✅ NOUVEAU: Vérifie si un état est considéré comme "annulé"
 * @param {string} etat - L'état de l'objet
 * @returns {boolean} True si l'état indique une annulation
 */
export const isEtatAnnule = (etat) => {
    if (!etat) return false;
    
    const etatLower = etat.toLowerCase();
    return etatLower === 'annulé' || 
           etatLower === 'annule' ||
           etatLower === 'annulée' ||
           etatLower === 'annulee';
};

/**
 * ✅ NOUVEAU: Vérifie si un état est considéré comme "validé/confirmé"
 * @param {string} etat - L'état de l'objet
 * @returns {boolean} True si l'état indique une validation
 */
export const isEtatValide = (etat) => {
    if (!etat) return false;
    
    const etatLower = etat.toLowerCase();
    return etatLower === 'validé' || 
           etatLower === 'valide' ||
           etatLower === 'confirmé' ||
           etatLower === 'confirme';
};

/**
 * Conversion d'un montant en lettres (français)
 * @param {number} montant - Montant à convertir
 * @returns {string} Montant en toutes lettres
 */
export const montantEnLettres = (montant) => {
    if (montant === undefined || montant === null) return '';
    
    // Séparation des parties entière et décimale
    const partieDécimale = Math.round((montant % 1) * 100);
    const partieEntière = Math.floor(montant);
    
    // Tableau de conversion pour les unités
    const unités = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
    
    // Tableau de conversion pour les dizaines
    const dizaines = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix'];
    
    // Fonction pour convertir un nombre en lettres
    const convertirNombre = (nombre) => {
        if (nombre === 0) return 'zéro';
        
        let résultat = '';
        
        // Traitement des millions
        if (nombre >= 1000000) {
            const millions = Math.floor(nombre / 1000000);
            résultat += (millions === 1) ? 'un million ' : convertirNombre(millions) + ' millions ';
            nombre %= 1000000;
        }
        
        // Traitement des milliers
        if (nombre >= 1000) {
            const milliers = Math.floor(nombre / 1000);
            résultat += (milliers === 1) ? 'mille ' : convertirNombre(milliers) + ' mille ';
            nombre %= 1000;
        }
        
        // Traitement des centaines
        if (nombre >= 100) {
            const centaines = Math.floor(nombre / 100);
            résultat += (centaines === 1) ? 'cent ' : unités[centaines] + ' cent ';
            nombre %= 100;
        }
        
        // Traitement des dizaines et unités
        if (nombre > 0) {
            if (nombre < 20) {
                résultat += unités[nombre];
            } else {
                const dizaine = Math.floor(nombre / 10);
                const unité = nombre % 10;
                
                if (dizaine === 7 || dizaine === 9) {
                    résultat += dizaines[dizaine - 1] + '-';
                    résultat += unités[unité + 10];
                } else {
                    résultat += dizaines[dizaine];
                    if (unité > 0) {
                        if (unité === 1 && dizaine !== 8) {
                            résultat += '-et-un';
                        } else {
                            résultat += '-' + unités[unité];
                        }
                    } else if (dizaine === 8) {
                        résultat += 's';
                    }
                }
            }
        }
        
        return résultat.trim();
    };
    
    // Construction du résultat final
    let résultat = convertirNombre(partieEntière) + ' francs';
    
    if (partieDécimale > 0) {
        résultat += ' et ' + (partieDécimale === 1 ? 'un centime' : convertirNombre(partieDécimale) + ' centimes');
    }
    
    return résultat;
};

/**
 * ✅ NOUVEAU: Formate une durée en texte lisible
 * @param {number} minutes - Durée en minutes
 * @returns {string} Durée formatée
 */
export const formatDuree = (minutes) => {
    if (!minutes || minutes <= 0) return '0 min';
    
    const heures = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (heures === 0) {
        return `${mins} min`;
    } else if (mins === 0) {
        return `${heures}h`;
    } else {
        return `${heures}h ${mins}min`;
    }
};

/**
 * ✅ NOUVEAU: Formate un pourcentage
 * @param {number} valeur - Valeur à formater en pourcentage
 * @param {number} decimales - Nombre de décimales (défaut: 1)
 * @returns {string} Pourcentage formaté
 */
export const formatPourcentage = (valeur, decimales = 1) => {
    if (valeur === null || valeur === undefined) return '-';
    
    return new Intl.NumberFormat('fr-CH', {
        style: 'percent',
        minimumFractionDigits: decimales,
        maximumFractionDigits: decimales
    }).format(valeur / 100);
};

/**
 * ✅ NOUVEAU: Formate un numéro de séquence avec padding
 * @param {number} numero - Numéro à formater
 * @param {number} longueur - Longueur totale avec zéros (défaut: 4)
 * @param {string} prefixe - Préfixe optionnel
 * @returns {string} Numéro formaté
 */
export const formatNumeroSequence = (numero, longueur = 4, prefixe = '') => {
    if (!numero) return '';
    
    const numeroStr = String(numero).padStart(longueur, '0');
    return prefixe ? `${prefixe}${numeroStr}` : numeroStr;
};

/**
 * ✅ NOUVEAU: Formate une taille de fichier
 * @param {number} bytes - Taille en bytes
 * @returns {string} Taille formatée
 */
export const formatTailleFichier = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    
    const tailles = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${tailles[i]}`;
};

/**
 * ✅ NOUVEAU: Capitalise la première lettre d'une chaîne
 * @param {string} str - Chaîne à capitaliser
 * @returns {string} Chaîne avec première lettre en majuscule
 */
export const capitalize = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * ✅ NOUVEAU: Formate un nom complet à partir du prénom et nom
 * @param {string} prenom - Prénom
 * @param {string} nom - Nom de famille
 * @param {boolean} nomEnPremier - Si true, affiche "NOM Prénom"
 * @returns {string} Nom complet formaté
 */
export const formatNomComplet = (prenom, nom, nomEnPremier = false) => {
    if (!prenom && !nom) return '';
    if (!prenom) return nom;
    if (!nom) return prenom;
    
    if (nomEnPremier) {
        return `${nom.toUpperCase()} ${capitalize(prenom)}`;
    } else {
        return `${capitalize(prenom)} ${capitalize(nom)}`;
    }
};

// ✅ EXPORT PAR DÉFAUT avec toutes les fonctions
const formatters = {
    // Fonctions principales
    formatMontant,
    formatDate,
    formatDateToYYYYMMDD,
    formatTelephone,
    formatNPA,
    toTitleCase,
    truncateString,
    formatAdresse,
    
    // Fonctions d'état
    formatEtatText,
    getEtatClass,
    getBadgeClasses,
    isEtatPaye,
    isEtatEnCours,
    isEtatAnnule,
    isEtatValide,
    
    // Fonctions avancées
    montantEnLettres,
    formatDuree,
    formatPourcentage,
    formatNumeroSequence,
    formatTailleFichier,
    capitalize,
    formatNomComplet
};

export default formatters;