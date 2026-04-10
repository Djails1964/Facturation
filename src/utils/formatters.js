// src/utils/formatters.js

import {
    toIsoString,
    fromIsoString,
    fromDisplayString,
    pad2,
} from './dateHelpers';

import { LOCALES } from '../constants/dateConstants';

// ─── Formatage de dates ───────────────────────────────────────────────────────

/**
 * Convertit une date en string YYYY-MM-DD (pour les inputs HTML).
 * @param {Date|string} date
 * @returns {string}
 */
export const formatDateToYYYYMMDD = (date) => toIsoString(date);

/**
 * Formate une date simple pour l'affichage (format français suisse).
 * @param {Date|string} date
 * @param {'date'|'datetime'|'short'|'compact'|'long'|'time'} format
 * @returns {string}
 */
export const formatDate = (dateStr, format = 'date') => {
    if (!dateStr) return '';
    try {
        const d = typeof dateStr === 'string'
            ? (fromDisplayString(dateStr) || fromIsoString(dateStr) || new Date(dateStr))
            : dateStr;
        if (!d || isNaN(d.getTime())) return '';
        const locale = LOCALES?.PRIMARY ?? 'fr-CH';
        switch (format) {
            case 'compact':
                return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}`;
            case 'short':
                return d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit' });
            case 'time':
                return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
            case 'datetime':
                return d.toLocaleDateString(locale) + ' ' +
                       d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
            case 'long':
                return d.toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            default: // 'date'
                return d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
        }
    } catch { return ''; }
};

/**
 * Formate un tableau de dates ISO en texte compact pour affichage.
 * Ex: ["2025-01-05", "2025-01-12"] → "05.01, 12.01"
 * @param {string[]} isoArray
 * @returns {string}
 */
export const formatDatesIso = (isoArray) => {
    if (!Array.isArray(isoArray) || isoArray.length === 0) return '';
    return isoArray
        .filter(Boolean)
        .map(iso => {
            const d = fromIsoString(iso);
            return d ? `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}` : iso;
        })
        .join(', ');
};


export const formatMontant = (montant) => {
    return new Intl.NumberFormat('fr-CH', { 
        minimumFractionDigits: 2,
        maximumFractionDigits: 2 
    }).format(parseFloat(montant) || 0);
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
    
    const etatLower = etat.toLowerCase().trim();
    
    // ========== ÉTATS DE FACTURES ==========
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
        
        // ========== ÉTATS DE PAIEMENTS ==========
        case 'validé':
        case 'valide':
            return 'etat-valide';
        case 'confirme':
        case 'confirmé':
            return 'etat-confirme';

        // ========== ÉTATS DE PAIEMENT LOYER ==========
        case 'payé':
        case 'paye':
            return 'etat-payee';
        case 'partiellement payé':
        case 'partiellement paye':
        case 'partiellement_paye':
            return 'etat-partiellement-payee';
        case 'non payé':
        case 'non paye':
        case 'non_paye':
            return 'etat-attente';

        // ========== STATUTS UTILISATEURS ==========
        case 'actif':
        case 'active':
            return 'etat-actif';
        case 'inactif':
        case 'inactive':
        case 'désactivé':
        case 'desactive':
        case 'disabled':
            return 'etat-inactif';
        
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
    
    const etatLower = etat.toLowerCase().trim();
    
    switch(etatLower) {
        // ========== FACTURES ==========
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
        
        // ========== UTILISATEURS ==========
        case 'actif':
        case 'active':
            return 'Actif';
        case 'inactif':
        case 'inactive':
        case 'désactivé':
        case 'desactive':
        case 'disabled':
            return 'Inactif';
        
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
 * ✅ NOUVEAU: Calcule l'état de validité d'une entité basé sur ses dates de début et fin
 * Retourne UNIQUEMENT 'valide' ou 'invalide' selon les critères
 * @param {Date|string} dateDebut - Date de début de validité
 * @param {Date|string} dateFin - Date de fin de validité (optionnelle)
 * @param {Date|string} dateComparaison - Date de comparaison (par défaut: aujourd'hui)
 * @returns {Object} Objet avec état et classe CSS { etat: 'valide'|'invalide', classe: string }
 */
export const getEtatValidite = (dateDebut, dateFin = null, dateComparaison = null) => {
    // Date de comparaison (par défaut aujourd'hui)
    const dateRef = dateComparaison ? new Date(dateComparaison) : new Date();
    dateRef.setHours(0, 0, 0, 0);
    
    // Si pas de date de début, considéré comme valide
    if (!dateDebut) {
        return {
            etat: 'valide',
            classe: 'etat-confirme'
        };
    }
    
    const debut = new Date(dateDebut);
    debut.setHours(0, 0, 0, 0);
    
    // Gestion de la date de fin
    let fin = null;
    if (dateFin) {
        fin = new Date(dateFin);
        fin.setHours(0, 0, 0, 0);
    }
    
    // Logique de validation
    // Valide si : dateDebut <= dateRef ET (dateFin est null OU dateFin >= dateRef)
    const debutValide = debut <= dateRef;
    const finValide = !fin || fin >= dateRef;
    
    if (debutValide && finValide) {
        return {
            etat: 'valide',
            label: 'Valide',
            classe: 'etat-confirme'
        };
    } else {
        return {
            etat: 'invalide',
            label: 'Invalide',
            classe: 'etat-annulee'
        };
    }
};

/**
 * ✅ NOUVEAU: Calcule l'état détaillé d'une entité avec distinction futur/expiré
 * Version détaillée pour l'affichage dans les tables
 * @param {Date|string} dateDebut - Date de début de validité
 * @param {Date|string} dateFin - Date de fin de validité (optionnelle)
 * @param {Date|string} dateComparaison - Date de comparaison (par défaut: aujourd'hui)
 * @returns {Object} Objet avec état détaillé et classe CSS
 */
export const getEtatValiditeDetaille = (dateDebut, dateFin = null, dateComparaison = null) => {
    // Date de comparaison (par défaut aujourd'hui)
    const dateRef = dateComparaison ? new Date(dateComparaison) : new Date();
    dateRef.setHours(0, 0, 0, 0);
    
    // Si pas de date de début, considéré comme valide
    if (!dateDebut) {
        return {
            etat: 'valide',
            label: 'Actif',
            classe: 'etat-confirme'
        };
    }
    
    const debut = new Date(dateDebut);
    debut.setHours(0, 0, 0, 0);
    
    // Gestion de la date de fin
    let fin = null;
    if (dateFin) {
        fin = new Date(dateFin);
        fin.setHours(0, 0, 0, 0);
    }
    
    // Cas 1: Date de début dans le futur
    if (debut > dateRef) {
        return {
            etat: 'futur',
            label: 'À venir',
            classe: 'etat-attente'
        };
    }
    
    // Cas 2: Date de fin dépassée
    if (fin && fin < dateRef) {
        return {
            etat: 'expire',
            label: 'Expiré',
            classe: 'etat-annulee'
        };
    }
    
    // Cas 3: Actuellement valide
    return {
        etat: 'valide',
        label: 'Actif',
        classe: 'etat-confirme'
    };
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

// ─── Formatage de tableaux de dates (format compact propriétaire) ─────────────
// Format compact : [09/16/23/30.01, 06/13/20/27.02]  (jours.mois groupés)

/**
 * Formate un tableau de Date[] au format compact.
 * @param {Date[]} dates
 * @returns {string}  ex: "[05/12.01, 03.02]"
 */
export const formatDatesCompact = (dates) => {
    if (!Array.isArray(dates) || dates.length === 0) return '';
    try {
        const valid = dates
            .filter(d => d instanceof Date && !isNaN(d.getTime()))
            .sort((a, b) => a - b);
        if (valid.length === 0) return '';
        const groups = {};
        valid.forEach(d => {
            const m = d.getMonth() + 1;
            if (!groups[m]) groups[m] = [];
            groups[m].push(d.getDate());
        });
        const parts = Object.keys(groups)
            .sort((a, b) => a - b)
            .map(m => {
                const days = groups[m].sort((a, b) => a - b).map(d => pad2(d)).join('/');
                return `${days}.${pad2(m)}`;
            });
        return `[${parts.join(', ')}]`;
    } catch { return ''; }
};

/**
 * Parse une chaîne au format compact en tableau de Date[].
 * @param {string} formattedString  ex: "[05/12.01, 03.02]"
 * @returns {Date[]}
 */
export const parseDatesFromCompact = (formattedString) => {
    if (!formattedString || typeof formattedString !== 'string') return [];
    try {
        const inner = formattedString.replace(/^\[|\]$/g, '').trim();
        if (!inner) return [];
        const dates = [];
        const year  = new Date().getFullYear();
        for (const group of inner.split(',').map(s => s.trim())) {
            const dotIdx = group.lastIndexOf('.');
            if (dotIdx === -1) continue;
            const month    = parseInt(group.substring(dotIdx + 1), 10);
            const dayParts = group.substring(0, dotIdx).split('/');
            for (const dayStr of dayParts) {
                const day = parseInt(dayStr, 10);
                if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
                    const d = new Date(year, month - 1, day);
                    if (!isNaN(d.getTime())) dates.push(d);
                }
            }
        }
        return dates.sort((a, b) => a - b);
    } catch { return []; }
};

/**
 * Formate un tableau de dates en texte verbeux : "5 janvier, 12 janvier".
 * @param {Date[]} dates
 * @param {string} locale
 * @returns {string}
 */
export const formatDatesVerbose = (dates, locale = 'fr-CH') => {
    if (!Array.isArray(dates) || dates.length === 0) return '';
    try {
        return dates
            .filter(d => d instanceof Date && !isNaN(d.getTime()))
            .sort((a, b) => a - b)
            .map(d => d.toLocaleDateString(locale, { day: 'numeric', month: 'long' }))
            .join(', ');
    } catch { return ''; }
};

/**
 * Formate un tableau de dates en incluant le nom du jour : "lundi 5 janvier".
 * @param {Date[]} dates
 * @param {string} locale
 * @returns {string}
 */
export const formatDatesWithDayNames = (dates, locale = 'fr-CH') => {
    if (!Array.isArray(dates) || dates.length === 0) return '';
    try {
        return dates
            .filter(d => d instanceof Date && !isNaN(d.getTime()))
            .sort((a, b) => a - b)
            .map(d => {
                const dayName = d.toLocaleDateString(locale, { weekday: 'long' });
                const month   = d.toLocaleDateString(locale, { month: 'long' });
                return `${dayName} ${d.getDate()} ${month}`;
            })
            .join(', ');
    } catch { return formatDatesCompact(dates); }
};

/**
 * Formate un tableau de dates de façon optimisée (plages ou liste compacte).
 * @param {Date[]} dates
 * @param {boolean} useRanges
 * @returns {string}
 */
export const formatDatesOptimized = (dates, useRanges = true) => {
    if (!Array.isArray(dates) || dates.length === 0) return '';
    try {
        if (!useRanges || dates.length <= 2) return formatDatesCompact(dates);
        const sorted = dates
            .filter(d => d instanceof Date && !isNaN(d.getTime()))
            .sort((a, b) => a - b);
        if (sorted.length === 0) return '';
        const groups = {};
        sorted.forEach(d => {
            const key = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
            if (!groups[key]) groups[key] = [];
            groups[key].push(d);
        });
        const parts = Object.values(groups).map(group => {
            if (group.length === 1) {
                return `${pad2(group[0].getDate())}.${pad2(group[0].getMonth() + 1)}`;
            }
            const first = group[0], last = group[group.length - 1];
            if (first.getMonth() === last.getMonth()) {
                return `[${pad2(first.getDate())}-${pad2(last.getDate())}.${pad2(first.getMonth() + 1)}]`;
            }
            return `${pad2(first.getDate())}.${pad2(first.getMonth() + 1)} - ${pad2(last.getDate())}.${pad2(last.getMonth() + 1)} (${group.length})`;
        });
        return parts.join(', ');
    } catch { return formatDatesCompact(dates); }
};

/**
 * Convertit une string compact en affichage lisible.
 * @param {string} compactString
 * @param {'readable'|'short'} format
 * @returns {string}
 */
export const formatCompactToDisplay = (compactString, format = 'readable') => {
    if (!compactString) return '';
    try {
        const dates = parseDatesFromCompact(compactString);
        if (format === 'short') {
            return dates.map(d => `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}`).join(', ');
        }
        if (dates.length >= 2) {
            const first = dates[0], last = dates[dates.length - 1];
            return `${pad2(first.getDate())}.${pad2(first.getMonth() + 1)} - ${pad2(last.getDate())}.${pad2(last.getMonth() + 1)} (${dates.length})`;
        }
        return dates.map(d => `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}`).join(', ');
    } catch { return compactString; }
};

/**
 * Valide une chaîne au format compact.
 * @param {string} dateString
 * @returns {{ isValid: boolean, errors: string[], parsedCount: number }}
 */
export const validateDatesString = (dateString) => {
    if (!dateString || typeof dateString !== 'string') {
        return { isValid: true, errors: [], parsedCount: 0 };
    }
    try {
        const parsed = parseDatesFromCompact(dateString);
        const errors = [];
        if (!dateString.startsWith('[') || !dateString.endsWith(']')) {
            errors.push('Le format doit être entouré de crochets []');
        }
        const inner = dateString.replace(/^\[|\]$/g, '').trim();
        if (inner && parsed.length === 0) errors.push('Aucune date valide trouvée dans la chaîne');
        if (inner && !/^\[[\d/,.\s]+\]$/.test(dateString)) errors.push('Format incorrect. Attendu: [jj/jj.MM, jj/jj.MM]');
        return { isValid: errors.length === 0, errors, parsedCount: parsed.length };
    } catch (e) {
        return { isValid: false, errors: ['Erreur : ' + e.message], parsedCount: 0 };
    }
};

// ─── Export par défaut ────────────────────────────────────────────────────────
const formatters = {
    // Dates
    formatDate,
    formatDateToYYYYMMDD,
    formatDatesIso,
    // Montants
    formatMontant,
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
    
    // Fonctions de validité temporelle
    getEtatValidite,
    getEtatValiditeDetaille,
    
    // Fonctions avancées
    montantEnLettres,
    formatDuree,
    formatPourcentage,
    formatNumeroSequence,
    formatTailleFichier,
    capitalize,
    formatNomComplet,

    // Formatage de tableaux de dates
    formatDatesCompact,
    parseDatesFromCompact,
    formatDatesVerbose,
    formatDatesWithDayNames,
    formatDatesOptimized,
    formatCompactToDisplay,
    validateDatesString,
};

export default formatters;