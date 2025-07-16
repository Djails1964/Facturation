// ==================================================
// FICHIER: src/utils/unsavedChangesUtils.js
// ==================================================

/**
 * Utilitaires pour la détection des changements non sauvegardés
 */

/**
 * Compare deux objets de manière profonde en tenant compte des types
 * @param {any} obj1 - Premier objet à comparer
 * @param {any} obj2 - Deuxième objet à comparer
 * @param {string} path - Chemin actuel pour le debug
 * @returns {boolean} - true si les objets sont identiques
 */
export function deepCompare(obj1, obj2, path = '') {
    // Même référence
    if (obj1 === obj2) return true;
    
    // Null ou undefined
    if (obj1 == null || obj2 == null) {
        const result = obj1 === obj2;
        if (!result && process.env.NODE_ENV === 'development') {
            console.log(`🔍 Différence null/undefined au path "${path}":`, obj1, 'vs', obj2);
        }
        return result;
    }
    
    // Types différents
    if (typeof obj1 !== typeof obj2) {
        if (process.env.NODE_ENV === 'development') {
            console.log(`🔍 Types différents au path "${path}":`, typeof obj1, 'vs', typeof obj2);
        }
        return false;
    }
    
    // Primitives
    if (typeof obj1 !== 'object') {
        const result = obj1 === obj2;
        if (!result && process.env.NODE_ENV === 'development') {
            console.log(`🔍 Valeurs différentes au path "${path}":`, obj1, 'vs', obj2);
        }
        return result;
    }
    
    // Arrays
    if (Array.isArray(obj1) && Array.isArray(obj2)) {
        if (obj1.length !== obj2.length) {
            if (process.env.NODE_ENV === 'development') {
                console.log(`🔍 Longueurs d'array différentes au path "${path}":`, obj1.length, 'vs', obj2.length);
            }
            return false;
        }
        
        for (let i = 0; i < obj1.length; i++) {
            if (!deepCompare(obj1[i], obj2[i], `${path}[${i}]`)) {
                return false;
            }
        }
        return true;
    }
    
    // Objects
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    
    if (keys1.length !== keys2.length) {
        if (process.env.NODE_ENV === 'development') {
            console.log(`🔍 Nombre de clés différent au path "${path}":`, keys1.length, 'vs', keys2.length);
        }
        return false;
    }
    
    for (const key of keys1) {
        if (!keys2.includes(key)) {
            if (process.env.NODE_ENV === 'development') {
                console.log(`🔍 Clé manquante au path "${path}.${key}"`);
            }
            return false;
        }
        
        if (!deepCompare(obj1[key], obj2[key], `${path}.${key}`)) {
            return false;
        }
    }
    
    return true;
}

/**
 * Normalise les données de facture pour la comparaison
 * @param {Object} facture - Données de la facture
 * @returns {Object} - Données normalisées
 */
export function normalizeFactureData(facture) {
    if (!facture) return null;
    
    const normalized = {
        numeroFacture: String(facture.numeroFacture || ''),
        dateFacture: String(facture.dateFacture || ''),
        clientId: facture.clientId || null,
        ristourne: Number(facture.ristourne || 0),
        lignes: []
    };
    
    // Normaliser les lignes
    if (facture.lignes && Array.isArray(facture.lignes)) {
        normalized.lignes = facture.lignes.map(ligne => ({
            id: ligne.id || null,
            description: String(ligne.description || ''),
            descriptionDates: String(ligne.descriptionDates || ''),
            serviceType: String(ligne.serviceType || ''),
            unite: String(ligne.unite || ''),
            quantite: Number(ligne.quantite || 0),
            prixUnitaire: Number(ligne.prixUnitaire || 0),
            total: Number(ligne.total || 0),
            serviceId: ligne.serviceId || null,
            uniteId: ligne.uniteId || null,
            noOrdre: ligne.noOrdre || 0
        }));
    }
    
    return normalized;
}

/**
 * Fonction de clonage profond pour les navigateurs qui ne supportent pas structuredClone
 * @param {any} obj - Objet à cloner
 * @returns {any} - Objet cloné
 */
export function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj);
    if (Array.isArray(obj)) return obj.map(item => deepClone(item));
    
    const cloned = {};
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            cloned[key] = deepClone(obj[key]);
        }
    }
    return cloned;
}

/**
 * Clone un objet de manière sûre (utilise structuredClone si disponible, sinon fallback)
 * @param {any} obj - Objet à cloner
 * @returns {any} - Objet cloné
 */
export function safeClone(obj) {
    try {
        // Utiliser structuredClone si disponible (navigateurs modernes)
        if (typeof structuredClone === 'function') {
            return structuredClone(obj);
        }
    } catch (error) {
        console.warn('structuredClone non disponible, utilisation du fallback');
    }
    
    // Fallback pour les navigateurs plus anciens
    return deepClone(obj);
}

/**
 * Valide que les données de facture sont complètes pour la comparaison
 * @param {Object} facture - Données de la facture
 * @returns {boolean} - true si les données sont prêtes pour la comparaison
 */
export function isFactureDataReady(facture, mode) {
    if (!facture) return false;
    
    // En mode création, on peut avoir des données vides
    if (mode === 'create') {
        return facture.numeroFacture !== undefined && 
               facture.dateFacture !== undefined && 
               Array.isArray(facture.lignes);
    }
    
    // En mode édition, on doit avoir des données complètes
    if (mode === 'edit') {
        return facture.numeroFacture && 
               facture.dateFacture && 
               facture.clientId && 
               Array.isArray(facture.lignes) && 
               facture.lignes.length > 0;
    }
    
    return false;
}

/**
 * Crée un résumé des changements détectés pour le debug
 * @param {Object} initial - État initial
 * @param {Object} current - État actuel
 * @returns {Array} - Liste des changements
 */
export function getChangesSummary(initial, current) {
    const changes = [];
    
    if (!initial || !current) {
        changes.push('État initial ou actuel manquant');
        return changes;
    }
    
    // Comparer les champs de base
    const baseFields = ['numeroFacture', 'dateFacture', 'clientId', 'ristourne'];
    baseFields.forEach(field => {
        if (initial[field] !== current[field]) {
            changes.push(`${field}: "${initial[field]}" → "${current[field]}"`);
        }
    });
    
    // Comparer les lignes
    if (initial.lignes && current.lignes) {
        if (initial.lignes.length !== current.lignes.length) {
            changes.push(`Nombre de lignes: ${initial.lignes.length} → ${current.lignes.length}`);
        } else {
            initial.lignes.forEach((ligne, index) => {
                const currentLigne = current.lignes[index];
                if (currentLigne) {
                    const ligneFields = ['description', 'descriptionDates', 'serviceType', 'unite', 'quantite', 'prixUnitaire'];
                    ligneFields.forEach(field => {
                        if (ligne[field] !== currentLigne[field]) {
                            changes.push(`Ligne ${index + 1} ${field}: "${ligne[field]}" → "${currentLigne[field]}"`);
                        }
                    });
                }
            });
        }
    }
    
    return changes;
}