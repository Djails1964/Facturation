// src/components/locationSalle/helpers/locationSalleReglesPropagation.js
//
// Propagation intelligente des dates de location.
//
// Principe : quand l'utilisateur propage une location vers les autres mois,
// on ne copie pas les dates telles quelles (elles n'existent pas dans le mois
// cible) mais on extrait les RÈGLES de positionnement (3ème jeudi, dernier
// vendredi, tous les mercredis…) et on les applique au mois cible.
//
// Trois modes par jour de la semaine (dow) :
//   'all'  → toutes les occurrences du dow présentes dans le mois source
//             → propager TOUS les jeudis du mois cible
//   'last' → seulement le dernier dow sélectionné (pas tous)
//             → propager le DERNIER jeudi du mois cible
//   'nth'  → une occurrence précise (2ème lundi, etc.)
//             → propager le Nième; si inexistant → dernier disponible
//
// Week-ends (sam+dim traités en paire) : le mode est hérité du samedi.

import { getDayOfWeek, getDaysInMonth, pad2 } from './locationSalleDateHelpers';

/**
 * Extrait les règles de positionnement depuis un tableau de dates ISO.
 *
 * @param {string[]} dates  Dates ISO 'YYYY-MM-DD'
 * @returns {Array<{dow:number, mode:'all'|'last'|'nth', occurrence:number|null, iso:string}>}
 */
export function extraireRegles(dates) {
    if (!dates || dates.length === 0) return [];

    // Regrouper les dates par jour de la semaine
    const parDow = {};
    for (const iso of dates) {
        const [y, m, d] = iso.split('-').map(Number);
        const dow = new Date(y, m - 1, d).getDay();
        if (!parDow[dow]) parDow[dow] = [];
        parDow[dow].push({ iso, d, y, m });
    }

    const regles = [];

    for (const [dowStr, entries] of Object.entries(parDow)) {
        const dow = Number(dowStr);
        // Les dimanches (dow=0) liés à un week-end sont traités avec leur samedi
        if (dow === 0 && parDow[6]) continue;

        const { y, m } = entries[0];
        const nbJoursMois = getDaysInMonth(y, m);

        // Nombre total d'occurrences de ce dow dans le mois source
        let nbOccurrencesMoisSource = 0;
        for (let j = 1; j <= nbJoursMois; j++) {
            if (new Date(y, m - 1, j).getDay() === dow) nbOccurrencesMoisSource++;
        }

        if (entries.length === nbOccurrencesMoisSource) {
            // Toutes les occurrences sélectionnées → mode 'all'
            regles.push({ dow, mode: 'all', occurrence: null, iso: entries[0].iso });
        } else {
            // Occurrences spécifiques → une règle par date
            for (const { iso, d } of entries) {
                const occurrence = Math.floor((d - 1) / 7) + 1; // 1-5
                const isLast     = (d + 7 > nbJoursMois);
                regles.push({ dow, mode: isLast ? 'last' : 'nth', occurrence, iso });
            }
        }
    }

    return regles;
}

/**
 * Applique les règles extraites sur un mois cible et retourne les dates ISO triées.
 *
 * Modes :
 *   'all'  → toutes les occurrences du dow dans le mois cible
 *   'last' → dernière occurrence du dow dans le mois cible
 *   'nth'  → Nième occurrence; si inexistante → dernière disponible
 *
 * Week-ends : sam → ajoute le dim suivant (peut déborder hors mois),
 *             dim → ajoute le sam précédent.
 *
 * @param {Array}  regles     Résultat de extraireRegles()
 * @param {number} annee
 * @param {number} moisCible  1-12
 * @returns {string[]} Dates ISO triées
 */
export function appliquerRegles(regles, annee, moisCible) {
    if (!regles || regles.length === 0) return [];

    const nbJours = getDaysInMonth(annee, moisCible);

    // Indexer tous les jours du mois par dow
    const parDow = {};
    for (let j = 1; j <= nbJours; j++) {
        const dow = new Date(annee, moisCible - 1, j).getDay();
        if (!parDow[dow]) parDow[dow] = [];
        parDow[dow].push(j);
    }

    const resultat = new Set();

    const ajouterJour = (dow, jourCible) => {
        if (jourCible === undefined) return;
        const iso = `${annee}-${pad2(moisCible)}-${pad2(jourCible)}`;
        resultat.add(iso);
        // Débordement week-end : sam → dim suivant, dim → sam précédent
        if (dow === 6) {
            const dt = new Date(annee, moisCible - 1, jourCible + 1);
            resultat.add(`${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`);
        } else if (dow === 0) {
            const dt = new Date(annee, moisCible - 1, jourCible - 1);
            resultat.add(`${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`);
        }
    };

    for (const { dow, mode, occurrence } of regles) {
        const joursDispos = parDow[dow] ?? [];
        if (joursDispos.length === 0) continue;

        if (mode === 'all') {
            for (const j of joursDispos) ajouterJour(dow, j);
        } else if (mode === 'last') {
            ajouterJour(dow, joursDispos[joursDispos.length - 1]);
        } else {
            // 'nth' : Nième occurrence, ou dernière si inexistante
            const idx = (occurrence <= joursDispos.length) ? occurrence - 1 : joursDispos.length - 1;
            ajouterJour(dow, joursDispos[idx]);
        }
    }

    return [...resultat].sort();
}