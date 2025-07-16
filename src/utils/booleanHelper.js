// src/utils/booleanHelper.js
/**
 * Helper pour gérer les conversions de booléens de manière sécurisée
 * Résout les problèmes de conversion entre différents environnements (dev/prod)
 * où les valeurs booléennes peuvent être stockées comme 0/1, "0"/"1", true/false, etc.
 */

/**
 * Convertit une valeur en booléen de manière sécurisée
 * Gère tous les cas de figure courants entre dev et production
 * @param {any} value - Valeur à convertir en booléen
 * @returns {boolean} - Booléen converti
 */
export const toBoolean = (value) => {
  // Si déjà un booléen, le retourner directement
  if (typeof value === 'boolean') {
    return value;
  }
  
  // Si null ou undefined, retourner false
  if (value === null || value === undefined) {
    return false;
  }
  
  // Si c'est un nombre
  if (typeof value === 'number') {
    return value !== 0;
  }
  
  // Si c'est une chaîne
  if (typeof value === 'string') {
    // Nettoyer la chaîne (trim et lowercase)
    const cleanValue = value.trim().toLowerCase();
    
    // Cas explicites de "true"
    if (cleanValue === 'true' || cleanValue === 'yes' || cleanValue === 'oui' || cleanValue === 'on') {
      return true;
    }
    
    // Cas explicites de "false"
    if (cleanValue === 'false' || cleanValue === 'no' || cleanValue === 'non' || cleanValue === 'off' || cleanValue === '') {
      return false;
    }
    
    // Conversion numérique pour les chaînes "0", "1", etc.
    const numValue = parseFloat(cleanValue);
    if (!isNaN(numValue)) {
      return numValue !== 0;
    }
    
    // Si la chaîne n'est ni vide ni un nombre, on considère qu'une chaîne non-vide = true
    return cleanValue.length > 0;
  }
  
  // Pour les objets et arrays, vérifier s'ils sont "truthy"
  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return value !== null; // un objet non-null est considéré comme true
  }
  
  // Fallback : utiliser la conversion JavaScript standard
  return Boolean(value);
};

/**
 * Convertit une valeur en entier pour base de données (0 ou 1)
 * @param {any} value - Valeur à convertir
 * @returns {number} - 0 ou 1
 */
export const toBooleanInt = (value) => {
  return toBoolean(value) ? 1 : 0;
};

/**
 * Convertit une valeur en chaîne pour base de données ("0" ou "1")
 * @param {any} value - Valeur à convertir
 * @returns {string} - "0" ou "1"
 */
export const toBooleanString = (value) => {
  return toBoolean(value) ? "1" : "0";
};

/**
 * Normalise les propriétés booléennes d'un objet
 * Utile pour traiter les réponses d'API où certains champs peuvent être des booléens
 * @param {Object} obj - Objet à normaliser
 * @param {string[]} booleanFields - Tableau des noms de propriétés à traiter comme booléens
 * @returns {Object} - Objet avec les propriétés booléennes normalisées
 */
export const normalizeBooleanFields = (obj, booleanFields) => {
  if (!obj || typeof obj !== 'object' || !Array.isArray(booleanFields)) {
    return obj;
  }
  
  const normalized = { ...obj };
  
  booleanFields.forEach(field => {
    if (normalized.hasOwnProperty(field)) {
      normalized[field] = toBoolean(normalized[field]);
    }
  });
  
  return normalized;
};

/**
 * Normalise les propriétés booléennes d'un tableau d'objets
 * @param {Array} array - Tableau d'objets à normaliser
 * @param {string[]} booleanFields - Tableau des noms de propriétés à traiter comme booléens
 * @returns {Array} - Tableau avec les propriétés booléennes normalisées
 */
export const normalizeBooleanFieldsArray = (array, booleanFields) => {
  if (!Array.isArray(array)) {
    return array;
  }
  
  return array.map(item => normalizeBooleanFields(item, booleanFields));
};

/**
 * Valide qu'une valeur est un booléen valide
 * @param {any} value - Valeur à valider
 * @returns {boolean} - True si la valeur peut être convertie en booléen de manière fiable
 */
export const isValidBoolean = (value) => {
  // Les types déjà booléens sont valides
  if (typeof value === 'boolean') {
    return true;
  }
  
  // Les nombres sont valides (0/1, etc.)
  if (typeof value === 'number' && !isNaN(value)) {
    return true;
  }
  
  // Les chaînes représentant des booléens sont valides
  if (typeof value === 'string') {
    const cleanValue = value.trim().toLowerCase();
    const validStrings = ['true', 'false', 'yes', 'no', 'oui', 'non', 'on', 'off', '0', '1', ''];
    return validStrings.includes(cleanValue) || !isNaN(parseFloat(cleanValue));
  }
  
  // null et undefined sont considérés comme valides (false)
  if (value === null || value === undefined) {
    return true;
  }
  
  return false;
};

/**
 * Fonctions spécialisées pour les cas d'usage fréquents dans votre application
 */

/**
 * Normalise les propriétés d'un service (actif, isDefault, etc.)
 * @param {Object} service - Objet service à normaliser
 * @returns {Object} - Service avec propriétés booléennes normalisées
 */
export const normalizeService = (service) => {
  return normalizeBooleanFields(service, ['actif', 'isDefault']);
};

/**
 * Normalise les propriétés d'une unité
 * @param {Object} unite - Objet unité à normaliser
 * @returns {Object} - Unité avec propriétés booléennes normalisées
 */
export const normalizeUnite = (unite) => {
  return normalizeBooleanFields(unite, ['actif', 'isDefault']);
};

/**
 * Normalise les propriétés d'un type de tarif
 * @param {Object} typeTarif - Objet type de tarif à normaliser
 * @returns {Object} - Type de tarif avec propriétés booléennes normalisées
 */
export const normalizeTypeTarif = (typeTarif) => {
  return normalizeBooleanFields(typeTarif, ['actif', 'isDefault']);
};

/**
 * Normalise un tableau de services
 * @param {Array} services - Tableau de services
 * @returns {Array} - Services normalisés
 */
export const normalizeServices = (services) => {
  return normalizeBooleanFieldsArray(services, ['actif', 'isDefault']);
};

/**
 * Normalise un tableau d'unités
 * @param {Array} unites - Tableau d'unités
 * @returns {Array} - Unités normalisées
 */
export const normalizeUnites = (unites) => {
  return normalizeBooleanFieldsArray(unites, ['actif', 'isDefault']);
};

/**
 * Normalise un tableau de types de tarifs
 * @param {Array} typesTarifs - Tableau de types de tarifs
 * @returns {Array} - Types de tarifs normalisés
 */
export const normalizeTypesTarifs = (typesTarifs) => {
  return normalizeBooleanFieldsArray(typesTarifs, ['actif', 'isDefault']);
};

// Export par défaut d'un objet contenant toutes les fonctions
const booleanHelper = {
  toBoolean,
  toBooleanInt,
  toBooleanString,
  normalizeBooleanFields,
  normalizeBooleanFieldsArray,
  isValidBoolean,
  normalizeService,
  normalizeUnite,
  normalizeTypeTarif,
  normalizeServices,
  normalizeUnites,
  normalizeTypesTarifs
};

export default booleanHelper;