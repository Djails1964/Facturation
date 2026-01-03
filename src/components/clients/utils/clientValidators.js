// src/components/clients/utils/clientValidators.js
// Fonctions de validation pour les composants clients

import { createLogger } from '../../../utils/createLogger';

// ✅ Initialisation du logger
const logger = createLogger('clientValidators');

/**
 * Types de téléphone
 */
export const PHONE_TYPES = {
  SWISS: 'swiss',
  FOREIGN: 'foreign'
};

/**
 * Messages de validation
 */
export const VALIDATION_MESSAGES = {
  EMAIL_INVALID: 'Format d\'email invalide',
  EMAIL_REQUIRED: 'L\'adresse email est obligatoire',
  
  PHONE_INVALID: 'Format de téléphone invalide. Utilisez le format suisse (+41) ou international.',
  PHONE_REQUIRED: 'Le numéro de téléphone est obligatoire',
  
  FIELD_REQUIRED: 'Ce champ est obligatoire',
  FIELD_TOO_LONG: 'Ce champ est trop long (maximum {max} caractères)',
  
  CODE_POSTAL_INVALID: 'Le code postal doit contenir 4 chiffres',
  CODE_POSTAL_REQUIRED: 'Le code postal est obligatoire',
  
  NOM_INVALID: 'Le nom ne peut contenir que des lettres, espaces et tirets',
  PRENOM_INVALID: 'Le prénom ne peut contenir que des lettres, espaces et tirets'
};

/**
 * Textes d'aide pour les champs
 */
export const HELP_TEXTS = {
  PHONE_SWISS: 'Format: +41 xx xxx xx xx',
  PHONE_FOREIGN: 'Numéro international',
  PHONE_DEFAULT: 'Format suisse: +41 xx xxx xx xx ou 0xx xxx xx xx',
  EMAIL_FORMAT: 'Exemple: nom@domaine.com',
  CODE_POSTAL_FORMAT: 'Code postal suisse (4 chiffres) ou international'
};

/**
 * Expressions régulières pour la validation
 */
const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_SWISS: /^(\+41|0041|0)[1-9]\d{8}$/,
  PHONE_FOREIGN: /^\+(?!41)\d{7,15}$/,
  CODE_POSTAL_SUISSE: /^\d{4}$/,
  NOM_VALIDE: /^[a-zA-ZÀ-ÿ\s\-']+$/,
  NUMERO_RUE: /^[0-9a-zA-Z\s\-\/]+$/
};

/**
 * Limites de longueur des champs
 */
const FIELD_LIMITS = {
  TITRE: 10,
  NOM: 100,
  PRENOM: 100,
  RUE: 150,
  NUMERO: 20,
  LOCALITE: 100,
  TELEPHONE: 20,
  EMAIL: 255
};

/**
 * Valider une adresse email
 */
export function validateEmail(email, required = false) {
  const result = {
    isValid: true,
    error: null,
    warnings: []
  };

  // Vérifier si requis
  if (required && (!email || !email.trim())) {
    result.isValid = false;
    result.error = VALIDATION_MESSAGES.EMAIL_REQUIRED;
    return result;
  }

  // Si vide et non requis, valide
  if (!email || !email.trim()) {
    return result;
  }

  // Vérifier la longueur
  if (email.length > FIELD_LIMITS.EMAIL) {
    result.isValid = false;
    result.error = VALIDATION_MESSAGES.FIELD_TOO_LONG.replace('{max}', FIELD_LIMITS.EMAIL);
    return result;
  }

  // Vérifier le format
  if (!REGEX.EMAIL.test(email.trim())) {
    result.isValid = false;
    result.error = VALIDATION_MESSAGES.EMAIL_INVALID;
    return result;
  }

  // Avertissements pour les domaines suspects
  const domain = email.split('@')[1]?.toLowerCase();
  if (domain && ['test.com', 'example.com', 'temp.com'].includes(domain)) {
    result.warnings.push('Domaine d\'email suspect détecté');
  }

  return result;
}

/**
 * Valider un numéro de téléphone
 */
export function validatePhone(phone, required = false) {
  const result = {
    isValid: true,
    error: null,
    phoneType: null,
    formatted: phone,
    helpText: HELP_TEXTS.PHONE_DEFAULT
  };

  // Vérifier si requis
  if (required && (!phone || !phone.trim())) {
    result.isValid = false;
    result.error = VALIDATION_MESSAGES.PHONE_REQUIRED;
    return result;
  }

  // Si vide et non requis, valide
  if (!phone || !phone.trim()) {
    return result;
  }

  // Nettoyer le numéro (supprimer espaces)
  const cleanPhone = phone.replace(/\s/g, '');

  // Vérifier la longueur
  if (cleanPhone.length > FIELD_LIMITS.TELEPHONE) {
    result.isValid = false;
    result.error = VALIDATION_MESSAGES.FIELD_TOO_LONG.replace('{max}', FIELD_LIMITS.TELEPHONE);
    return result;
  }

  // Tester le format suisse
  if (REGEX.PHONE_SWISS.test(cleanPhone)) {
    result.phoneType = PHONE_TYPES.SWISS;
    result.helpText = HELP_TEXTS.PHONE_SWISS;
    result.formatted = formatSwissPhone(cleanPhone);
    return result;
  }

  // Tester le format international
  if (REGEX.PHONE_FOREIGN.test(cleanPhone)) {
    result.phoneType = PHONE_TYPES.FOREIGN;
    result.helpText = HELP_TEXTS.PHONE_FOREIGN;
    return result;
  }

  // Format invalide
  result.isValid = false;
  result.error = VALIDATION_MESSAGES.PHONE_INVALID;
  return result;
}

/**
 * Formater un numéro de téléphone suisse
 */
function formatSwissPhone(phone) {
  const cleaned = phone.replace(/\D/g, '');
  
  // Convertir 0XX en +41XX
  if (cleaned.startsWith('0')) {
    const withoutZero = cleaned.substring(1);
    return `+41 ${withoutZero.substring(0, 2)} ${withoutZero.substring(2, 5)} ${withoutZero.substring(5, 7)} ${withoutZero.substring(7)}`;
  }
  
  // Déjà au format +41
  if (cleaned.startsWith('41')) {
    const number = cleaned.substring(2);
    return `+41 ${number.substring(0, 2)} ${number.substring(2, 5)} ${number.substring(5, 7)} ${number.substring(7)}`;
  }
  
  return phone;
}

/**
 * Valider un code postal (suisse ou international)
 */
export function validateCodePostal(codePostal, required = true) {
  // AJOUTEZ CE LOG TEMPORAIRE
  logger.debug('🔍 validateCodePostal - Input:', { codePostal, required, type: typeof codePostal });
  
  const result = {
    isValid: true,
    error: null,
    formatted: codePostal,
    type: null
  };

  // Vérifier si requis
  if (required && (!codePostal || !codePostal.toString().trim())) {
    logger.debug('🔍 validateCodePostal - ÉCHEC:', { codePostal, isEmpty: !codePostal, isEmptyString: !codePostal?.toString().trim() });
    result.isValid = false;
    result.error = VALIDATION_MESSAGES.CODE_POSTAL_REQUIRED;
    return result;
  }

  // Si vide et non requis, valide
  if (!codePostal || !codePostal.toString().trim()) {
    return result;
  }

  // Nettoyer mais garder les lettres pour les codes internationaux
  const cleaned = codePostal.toString().trim().toUpperCase();
  result.formatted = cleaned;

  // Validation flexible selon le type de code postal
  
  // Code postal suisse (4 chiffres uniquement)
  if (/^\d{4}$/.test(cleaned)) {
    result.type = 'swiss';
    return result;
  }
  
  // Codes postaux internationaux courants
  const internationalPatterns = [
    /^\d{5}$/, // USA, Allemagne, etc. (5 chiffres)
    /^\d{5}-\d{4}$/, // USA étendu
    /^[A-Z]\d[A-Z] \d[A-Z]\d$/, // Canada
    /^[A-Z]{1,2}\d[A-Z\d]? \d[A-Z]{2}$/, // UK
    /^\d{2}\d{3}$/, // France, Belgique (5 chiffres)
    /^\d{1,5}$/, // Général (1 à 5 chiffres)
    /^[A-Z0-9]{3,10}$/ // Format général alphanumérique
  ];
  
  const isValidInternational = internationalPatterns.some(pattern => pattern.test(cleaned));
  
  if (isValidInternational) {
    result.type = 'international';
    return result;
  }

  // Aucun format reconnu
  result.isValid = false;
  result.error = 'Format de code postal invalide';
  return result;
}

/**
 * Valider un nom ou prénom
 */
export function validateNomPrenom(value, fieldName, required = true) {
  const result = {
    isValid: true,
    error: null,
    formatted: value // Garde la valeur telle quelle, sans formatage automatique
  };

  const maxLength = fieldName === 'nom' ? FIELD_LIMITS.NOM : FIELD_LIMITS.PRENOM;

  // Vérifier si requis
  if (required && (!value || !value.trim())) {
    result.isValid = false;
    result.error = VALIDATION_MESSAGES.FIELD_REQUIRED;
    return result;
  }

  // Si vide et non requis, valide
  if (!value || !value.trim()) {
    return result;
  }

  // Vérifier la longueur
  if (value.length > maxLength) {
    result.isValid = false;
    result.error = VALIDATION_MESSAGES.FIELD_TOO_LONG.replace('{max}', maxLength);
    return result;
  }

  // Vérifier le format (lettres, espaces, tirets, apostrophes)
  if (!REGEX.NOM_VALIDE.test(value)) {
    result.isValid = false;
    result.error = fieldName === 'nom' ? 
      VALIDATION_MESSAGES.NOM_INVALID : 
      VALIDATION_MESSAGES.PRENOM_INVALID;
    return result;
  }

  // Garder la valeur originale sans formatage automatique
  result.formatted = value.trim();

  return result;
}

/**
 * Valider une adresse (rue)
 */
export function validateRue(rue, required = true) {
  const result = {
    isValid: true,
    error: null,
    formatted: rue
  };

  // Vérifier si requis
  if (required && (!rue || !rue.trim())) {
    result.isValid = false;
    result.error = VALIDATION_MESSAGES.FIELD_REQUIRED;
    return result;
  }

  // Si vide et non requis, valide
  if (!rue || !rue.trim()) {
    return result;
  }

  // Vérifier la longueur
  if (rue.length > FIELD_LIMITS.RUE) {
    result.isValid = false;
    result.error = VALIDATION_MESSAGES.FIELD_TOO_LONG.replace('{max}', FIELD_LIMITS.RUE);
    return result;
  }

  // Formater (première lettre en majuscule)
  result.formatted = rue.trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  return result;
}

/**
 * Valider un numéro de rue
 */
export function validateNumero(numero, required = true) {
  const result = {
    isValid: true,
    error: null,
    formatted: numero
  };

  // Vérifier si requis
  if (required && (!numero || !numero.trim())) {
    result.isValid = false;
    result.error = VALIDATION_MESSAGES.FIELD_REQUIRED;
    return result;
  }

  // Si vide et non requis, valide
  if (!numero || !numero.trim()) {
    return result;
  }

  // Vérifier la longueur
  if (numero.length > FIELD_LIMITS.NUMERO) {
    result.isValid = false;
    result.error = VALIDATION_MESSAGES.FIELD_TOO_LONG.replace('{max}', FIELD_LIMITS.NUMERO);
    return result;
  }

  // Vérifier le format (chiffres, lettres, espaces, tirets, slash)
  if (!REGEX.NUMERO_RUE.test(numero)) {
    result.isValid = false;
    result.error = 'Le numéro de rue contient des caractères non autorisés';
    return result;
  }

  result.formatted = numero.trim();
  return result;
}

/**
 * Valider une localité
 */
export function validateLocalite(localite, required = true) {
  const result = {
    isValid: true,
    error: null,
    formatted: localite
  };

  // Vérifier si requis
  if (required && (!localite || !localite.trim())) {
    result.isValid = false;
    result.error = VALIDATION_MESSAGES.FIELD_REQUIRED;
    return result;
  }

  // Si vide et non requis, valide
  if (!localite || !localite.trim()) {
    return result;
  }

  // Vérifier la longueur
  if (localite.length > FIELD_LIMITS.LOCALITE) {
    result.isValid = false;
    result.error = VALIDATION_MESSAGES.FIELD_TOO_LONG.replace('{max}', FIELD_LIMITS.LOCALITE);
    return result;
  }

  // Vérifier le format
  if (!REGEX.NOM_VALIDE.test(localite)) {
    result.isValid = false;
    result.error = 'La localité ne peut contenir que des lettres, espaces et tirets';
    return result;
  }

  // Formater (première lettre en majuscule)
  result.formatted = localite.trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  return result;
}

/**
 * Valider le titre (Monsieur/Madame)
 */
export function validateTitre(titre, required = true) {
  const result = {
    isValid: true,
    error: null
  };

  const validTitles = ['Monsieur', 'Madame'];

  // Vérifier si requis
  if (required && (!titre || !titre.trim())) {
    result.isValid = false;
    result.error = VALIDATION_MESSAGES.FIELD_REQUIRED;
    return result;
  }

  // Si vide et non requis, valide
  if (!titre || !titre.trim()) {
    return result;
  }

  // Vérifier que c'est un titre valide
  if (!validTitles.includes(titre)) {
    result.isValid = false;
    result.error = 'Veuillez sélectionner un titre valide';
    return result;
  }

  return result;
}

/**
 * Valider tous les champs d'un client
 */
export function validateAllClientFields(client, requiredFields = null) {
  const errors = {};
  const warnings = {};
  let hasErrors = false;

  // Champs requis par défaut
  const defaultRequired = [
    'titre', 'nom', 'prenom', 'rue', 
    'numero', 'code_postal', 'localite'
  ];
  const required = requiredFields || defaultRequired;

  // Valider chaque champ
  const validations = {
    titre: () => validateTitre(client.titre, required.includes('titre')),
    nom: () => validateNomPrenom(client.nom, 'nom', required.includes('nom')),
    prenom: () => validateNomPrenom(client.prenom, 'prenom', required.includes('prenom')),
    rue: () => validateRue(client.rue, required.includes('rue')),
    numero: () => validateNumero(client.numero, required.includes('numero')),
    code_postal: () => validateCodePostal(client.code_postal, required.includes('code_postal')),
    localite: () => validateLocalite(client.localite, required.includes('localite')),
    telephone: () => validatePhone(client.telephone, required.includes('telephone')),
    email: () => validateEmail(client.email, required.includes('email'))
  };

  Object.entries(validations).forEach(([field, validator]) => {
    const result = validator();
    
    if (!result.isValid) {
      errors[field] = result.error;
      hasErrors = true;
    }
    
    if (result.warnings && result.warnings.length > 0) {
      warnings[field] = result.warnings;
    }
  });

  return {
    isValid: !hasErrors,
    errors,
    warnings,
    hasErrors,
    hasWarnings: Object.keys(warnings).length > 0
  };
}

/**
 * Obtenir le texte d'aide pour un champ selon son état
 */
export function getFieldHelpText(fieldName, fieldValue, validationResult) {
  if (validationResult && !validationResult.isValid) {
    return validationResult.error;
  }

  switch (fieldName) {
    case 'telephone':
      if (validationResult && validationResult.helpText) {
        return validationResult.helpText;
      }
      return HELP_TEXTS.PHONE_DEFAULT;
      
    case 'email':
      return HELP_TEXTS.EMAIL_FORMAT;
      
    case 'code_postal':
      return HELP_TEXTS.CODE_POSTAL_FORMAT;
      
    default:
      return null;
  }
}

/**
 * Obtenir le type de téléphone à partir d'un numéro
 */
export function getPhoneType(phone) {
  if (!phone) return null;
  
  const validation = validatePhone(phone);
  return validation.phoneType;
}