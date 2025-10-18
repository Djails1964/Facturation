// src/components/parametres/helpers/parametreHelpers.js
/**
 * Fonctions utilitaires pour la gestion des paramètres
 */

import {
  PARAMETRE_MODES,
  PARAMETRE_TYPES,
  PARAMETRE_VALIDATION,
  PARAMETRE_ERROR_MESSAGES
} from '../../../constants/parametreConstants';

/**
 * Normalise la structure des paramètres reçus de l'API
 * @param {Object} rawParametres - Paramètres bruts de l'API
 * @returns {Object} Structure normalisée
 */
export const normalizeParametresStructure = (rawParametres) => {
  const normalized = {};
  
  Object.entries(rawParametres || {}).forEach(([groupeNom, groupeData]) => {
    normalized[groupeNom] = {};
    
    if (groupeData && typeof groupeData === 'object') {
      Object.entries(groupeData).forEach(([sousGroupeNom, sousGroupeData]) => {
        normalized[groupeNom][sousGroupeNom] = {};
        
        if (sousGroupeData && typeof sousGroupeData === 'object') {
          Object.entries(sousGroupeData).forEach(([categorieNom, parametreData]) => {
            if (Array.isArray(parametreData)) {
              normalized[groupeNom][sousGroupeNom][categorieNom] = parametreData;
            } else if (parametreData && typeof parametreData === 'object') {
              // Cas d'un paramètre unique
              normalized[groupeNom][sousGroupeNom][categorieNom] = [parametreData];
            }
          });
        }
      });
    }
  });
  
  return normalized;
};

/**
 * ✅ CORRECTION: Trouve la valeur d'un paramètre en tenant compte de l'année
 * @param {Object} structure - Structure des paramètres
 * @param {string} groupe - Groupe
 * @param {string} sousGroupe - Sous-groupe
 * @param {string} categorie - Catégorie
 * @param {string} nomParametre - Nom du paramètre
 * @param {number} [annee] - Année du paramètre (optionnel, mais IMPORTANT pour les paramètres avec année)
 * @returns {string} Valeur du paramètre
 */
export const findParameterValue = (structure, groupe, sousGroupe, categorie, nomParametre, annee = null) => {
  try {
    const parametres = structure?.[groupe]?.[sousGroupe]?.[categorie];
    if (Array.isArray(parametres)) {
      // ✅ Si une année est fournie, chercher le paramètre avec cette année spécifique
      if (annee !== null && annee !== undefined) {
        const param = parametres.find(p => 
          p.nomParametre === nomParametre && p.anneeParametre === annee
        );
        return param?.valeurParametre || '';
      }
      
      // Sinon, retourner le premier paramètre avec ce nom
      const param = parametres.find(p => p.nomParametre === nomParametre);
      return param?.valeurParametre || '';
    }
    return '';
  } catch (error) {
    console.error('Erreur findParameterValue:', error);
    return '';
  }
};

/**
 * ✅ CORRECTION: Trouve l'année d'un paramètre dans la structure
 * @param {Object} structure - Structure des paramètres
 * @param {string} groupe - Groupe
 * @param {string} sousGroupe - Sous-groupe
 * @param {string} categorie - Catégorie
 * @param {string} nomParametre - Nom du paramètre
 * @returns {string|undefined} Année du paramètre ou undefined si pas d'année
 */
export const findParameterYear = (structure, groupe, sousGroupe, categorie, nomParametre) => {
  try {
    const parametres = structure?.[groupe]?.[sousGroupe]?.[categorie];
    if (Array.isArray(parametres)) {
      const param = parametres.find(p => p.nomParametre === nomParametre);
      // ✅ Retourner undefined si pas d'année au lieu de l'année courante
      return param?.anneeParametre || undefined;
    }
    return undefined;
  } catch (error) {
    console.error('Erreur findParameterYear:', error);
    return undefined;
  }
};

/**
 * Génère un ID unique pour un champ de paramètre
 * @param {string} groupe - Groupe
 * @param {string} sousGroupe - Sous-groupe
 * @param {string} categorie - Catégorie
 * @param {string} nomParametre - Nom du paramètre
 * @param {number} [annee] - Année du paramètre (optionnel mais CRUCIAL pour les doublons)
 * @returns {string} ID unique
 */
export const generateParametreId = (groupe, sousGroupe, categorie, nomParametre, annee = null) => {
  // ✅ CRITIQUE: Si une année est fournie, l'inclure dans l'ID
  // Cela évite les collisions quand il y a plusieurs paramètres avec le même nom mais des années différentes
  if (annee !== null && annee !== undefined) {
    return `${groupe}-${sousGroupe}-${categorie}-${nomParametre}-annee-${annee}`;
  }
  return `${groupe}-${sousGroupe}-${categorie}-${nomParametre}`;
};

/**
 * Détermine le type d'input pour un paramètre
 * @param {string} nomParametre - Nom du paramètre
 * @param {string} groupe - Groupe du paramètre
 * @returns {string} Type d'input
 */
export const getInputType = (nomParametre, groupe = '') => {
  const nom = nomParametre.toLowerCase();
  
  // ✅ Champs de texte libre pour Email (textarea)
  if (groupe === 'Email' && nom.includes('texte')) {
    return PARAMETRE_TYPES.TEXTAREA;
  }
  
  if (nom.includes('email')) return PARAMETRE_TYPES.EMAIL;
  if (nom.includes('anneeParametre') || nom.includes('year')) return PARAMETRE_TYPES.YEAR;
  if (nom.includes('path') || nom.includes('dir') || nom.includes('chemin')) return PARAMETRE_TYPES.PATH;
  if (nom.includes('port') || nom.includes('timeout')) return PARAMETRE_TYPES.NUMBER;
  
  return PARAMETRE_TYPES.TEXT;
};

/**
 * Valide la valeur d'un paramètre selon son type
 * @param {string} value - Valeur à valider
 * @param {string} type - Type du paramètre
 * @returns {Object} { isValid: boolean, error: string }
 */
export const validateParametreValue = (value, type) => {
  if (!value || value.trim() === '') {
    return {
      isValid: false,
      error: PARAMETRE_ERROR_MESSAGES.REQUIRED_FIELD
    };
  }

  switch (type) {
    case PARAMETRE_TYPES.EMAIL:
      if (!PARAMETRE_VALIDATION.EMAIL_REGEX.test(value)) {
        return {
          isValid: false,
          error: 'Format d\'email invalide'
        };
      }
      break;
      
    case PARAMETRE_TYPES.YEAR:
      const year = parseInt(value);
      if (isNaN(year) || year < PARAMETRE_VALIDATION.MIN_YEAR || year > PARAMETRE_VALIDATION.MAX_YEAR) {
        return {
          isValid: false,
          error: `L'année doit être entre ${PARAMETRE_VALIDATION.MIN_YEAR} et ${PARAMETRE_VALIDATION.MAX_YEAR}`
        };
      }
      break;
      
    case PARAMETRE_TYPES.NUMBER:
      if (isNaN(value)) {
        return {
          isValid: false,
          error: 'La valeur doit être un nombre'
        };
      }
      break;
  }

  return { isValid: true, error: null };
};

/**
 * Prépare les données pour l'envoi au serveur
 * @param {Object} modifiedValues - Valeurs modifiées
 * @returns {Array} Tableau de paramètres à envoyer
 */
export const prepareParametresForSubmit = (modifiedValues) => {
  return Object.values(modifiedValues).map(param => {
    const data = {
      nomParametre: param.nomParametre,
      valeurParametre: param.valeurParametre,
      groupeParametre: param.groupeParametre,
      sousGroupeParametre: param.sousGroupeParametre,
      categorie: param.categorie
    };
    
    // ✅ CORRECTION : N'ajouter l'année QUE si elle est définie
    // L'année n'est nécessaire que pour "Prochain Numéro Facture"
    if (param.anneeParametre !== undefined && param.anneeParametre !== null) {
      data.anneeParametre = param.anneeParametre;
    }
    
    return data;
  });
};

/**
 * Obtient le titre personnalisé d'un groupe
 * @param {string} groupe - Nom du groupe
 * @returns {string} Titre personnalisé
 */
export const getGroupTitle = (groupe) => {
  const titles = {
    'Email': 'Texte du mail', // ✅ CORRECTION
    'Facture': 'Facture',
    'Relations Bancaires': 'Relations Bancaires'
  };
  return titles[groupe] || groupe;
};

/**
 * Obtient le label personnalisé d'un sous-groupe
 * @param {string} groupe - Nom du groupe
 * @param {string} sousGroupe - Nom du sous-groupe
 * @returns {string} Label personnalisé
 */
export const getSousGroupeLabel = (groupe, sousGroupe) => {
  // ✅ NOUVEAU : "Corps" → "Texte du courriel" pour le groupe Email
  if (groupe === 'Email' && sousGroupe === 'Corps') {
    return 'Texte du courriel';
  }
  
  const labels = {
    'Email-tu': 'Texte 1',    // ← Reste "Texte 1"
    'Email-vous': 'Texte 2'   // ← Reste "Texte 2"
  };
  const key = `${groupe}-${sousGroupe}`;
  return labels[key] || sousGroupe;
};

/**
 * Vérifie si on doit afficher le nom du paramètre
 * @param {string} nomParametre - Nom du paramètre
 * @returns {boolean} True si on doit l'afficher
 */
export const shouldShowParameterName = (nomParametre) => {
  // ✅ CORRECTION: On affiche TOUJOURS le nom du paramètre
  // Le label personnalisé (comme "Texte du courriel") est géré dans ParametreField.getFieldLabel()
  return true;
};

/**
 * Obtient la description d'un champ selon sa hiérarchie
 * @param {string} groupe - Groupe
 * @param {string} sousGroupe - Sous-groupe
 * @param {string} categorie - Catégorie
 * @param {string} nomParametre - Nom du paramètre
 * @returns {string} Description du champ
 */
export const getFieldDescription = (groupe, sousGroupe, categorie, nomParametre) => {
  // ✅ MODIFICATION : Ne plus retourner de descriptions
  // Les descriptions seront masquées dans l'affichage
  return '';
};

/**
 * Vérifie si le groupe doit être affiché
 * @param {string} groupe - Nom du groupe
 * @returns {boolean} True si le groupe doit être affiché
 */
export const shouldDisplayGroup = (groupe) => {
  // Masquer le groupe Tarifs qui a sa propre gestion
  return groupe !== 'Tarifs';
};

/**
 * Formate le nom d'affichage d'un groupe/sous-groupe
 * @param {string} name - Nom brut
 * @returns {string} Nom formaté
 */
export const formatDisplayName = (name, groupe = '') => {
  if (name === 'General' || name === 'Général') return 'Général';
  if (name === 'Default') return '';
  
  // ✅ NOUVEAU : "Corps" → "Texte du courriel" pour le groupe Email
  if (groupe === 'Email' && name === 'Corps') {
    return 'Texte du courriel';
  }
  
  return name;
};