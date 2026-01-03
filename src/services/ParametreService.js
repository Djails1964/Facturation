/**
 * Service de gestion des paramètres - VERSION CORRIGÉE
 * ✅ Reprend la dernière version du repository
 * ✅ Utilise correctement le booleanHelper pour normaliser seulement les champs booléens
 * @class ParametreService
 * @description Gère l'accès aux données des paramètres via l'API
 */
import api from './api';
import { toBoolean, toBooleanString, normalizeBooleanFields } from '../utils/booleanHelper';
import { createLogger } from '../utils/createLogger';

class ParametreService {
  constructor() {
    // Bind des méthodes
    this.getAllParametres = this.getAllParametres.bind(this);
    this.getParametre = this.getParametre.bind(this);
    this.updateParametre = this.updateParametre.bind(this);
    this.normalizeParametreValue = this.normalizeParametreValue.bind(this);
    this.normalizeParametresGroup = this.normalizeParametresGroup.bind(this);
    this.prepareParametreForApi = this.prepareParametreForApi.bind(this);

    this.log = createLogger('ParametreService');

  }

  /**
   * ✅ NORMALISE LA VALEUR D'UN PARAMÈTRE SELON SON TYPE
   * Respecte le type du paramètre déclaré :
   * - boolean : convertit en booléen via toBoolean()
   * - number/int/float : convertit en nombre
   * - string/text (défaut) : conserve comme chaîne SANS conversion automatique
   * 
   * @param {any} value - Valeur à normaliser
   * @param {string} type - Type du paramètre ('boolean', 'string', 'number', etc.)
   * @returns {any} - Valeur normalisée
   */
  normalizeParametreValue(value, type = 'string') {
    if (value === null || value === undefined) {
      return value;
    }

    switch (type?.toLowerCase()) {
      case 'boolean':
      case 'bool':
        // ✅ Convertir explicitement en booléen seulement si le type est boolean
        return toBoolean(value);
      
      case 'number':
      case 'int':
      case 'integer':
        return parseInt(value) || 0;
      
      case 'float':
      case 'double':
        return parseFloat(value) || 0;
      
      case 'string':
      case 'text':
      default:
        // ✅ CORRECTION: Conserver la valeur comme chaîne SANS conversion automatique
        // Les valeurs "0" et "1" restent des chaînes, pas des booléens
        return String(value);
    }
  }

  /**
   * ✅ NORMALISE UN GROUPE DE PARAMÈTRES - VERSION CORRIGÉE
   * Utilise le booleanHelper pour normaliser sélectivement les propriétés booléennes
   * 
   * @param {Object} parametresGroup - Groupe de paramètres à normaliser
   * @returns {Object} - Groupe avec valeurs normalisées
   */
  normalizeParametresGroup(parametresGroup) {
    if (!parametresGroup || typeof parametresGroup !== 'object') {
      return parametresGroup;
    }

    // Traiter les tableaux de paramètres
    if (Array.isArray(parametresGroup)) {
      this.log.debug('✅ normalizeParametresGroup - Traitement tableau:', parametresGroup.length, 'éléments');
      
      return parametresGroup.map(param => {
        if (param && typeof param === 'object') {
          // ✅ Normaliser la valeur selon son type déclaré
          const normalized = {
            ...param,
            valeurParametre: this.normalizeParametreValue(
              param.valeurParametre, 
              param.typeParametre || param.type
            )
          };

          // ✅ Utiliser normalizeBooleanFields pour les propriétés métadonnées
          // Ces champs sont TOUJOURS des booléens
          return normalizeBooleanFields(normalized, ['Actif', 'Obligatoire', 'Visible']);
        }
        return param;
      });
    }

    // Traiter les objets imbriqués récursivement
    const normalized = {};
    
    for (const [key, parametre] of Object.entries(parametresGroup)) {
      if (Array.isArray(parametre)) {
        this.log.debug(`✅ Traitement tableau pour ${key}:`, parametre.length, 'éléments');
        
        normalized[key] = parametre.map(param => {
          if (param && typeof param === 'object') {
            const result = {
              ...param,
              valeurParametre: this.normalizeParametreValue(
                param.valeurParametre, 
                param.typeParametre || param.type
              )
            };
            return normalizeBooleanFields(result, ['Actif', 'Obligatoire', 'Visible']);
          }
          return param;
        });
      } 
      else if (parametre && typeof parametre === 'object' && parametre.nomParametre) {
        // Paramètre direct (pas imbriqué)
        normalized[key] = {
          ...parametre,
          valeurParametre: this.normalizeParametreValue(
            parametre.valeurParametre, 
            parametre.typeParametre || parametre.type
          )
        };
        normalized[key] = normalizeBooleanFields(normalized[key], ['Actif', 'Obligatoire', 'Visible']);
      } 
      else if (parametre && typeof parametre === 'object') {
        // Conteneur - traiter récursivement
        normalized[key] = this.normalizeParametresGroup(parametre);
      } 
      else {
        // Autres types - garder tel quel
        normalized[key] = parametre;
      }
    }

    return normalized;
  }

  /**
   * ✅ PRÉPARE UN PARAMÈTRE POUR L'ENVOI À L'API
   * Convertit les booléens en chaînes pour transmission
   * 
   * @param {Object} parametreData - Données du paramètre
   * @returns {Object} - Données préparées pour l'API
   */
  prepareParametreForApi(parametreData) {
    // ✅ CORRECTION: Utiliser let au lieu de const pour pouvoir réassigner
    let prepared = { ...parametreData };

    // Convertir les booléens en chaînes pour l'API si nécessaire
    if (typeof prepared.valeurParametre === 'boolean') {
      prepared.valeurParametre = toBooleanString(prepared.valeurParametre);
      this.log.debug('✅ Conversion booléen → chaîne pour API:', 
        parametreData.valeurParametre, '→', prepared.valeurParametre);
    }

    // ✅ Normaliser les propriétés booléennes métadonnées
    prepared = normalizeBooleanFields(prepared, ['Actif', 'Obligatoire', 'Visible']);
    
    // Convertir les propriétés booléennes en chaînes pour l'API
    if (prepared.Actif !== undefined && typeof prepared.Actif === 'boolean') {
      prepared.Actif = toBooleanString(prepared.Actif);
    }
    if (prepared.Obligatoire !== undefined && typeof prepared.Obligatoire === 'boolean') {
      prepared.Obligatoire = toBooleanString(prepared.Obligatoire);
    }
    if (prepared.Visible !== undefined && typeof prepared.Visible === 'boolean') {
      prepared.Visible = toBooleanString(prepared.Visible);
    }

    return prepared;
  }

  /**
   * Récupère tous les paramètres de tous les groupes
   * @returns {Promise<Object>} Structure complète des paramètres avec valeurs normalisées
   */
  async getAllParametres() {
    try {
      const response = await api.get('parametre-api.php?tousGroupes=true');
      
      if (response && response.success) {
        const parametres = response.parametres || {};
        
        // ✅ NORMALISATION DE TOUS LES GROUPES DE PARAMÈTRES
        const parametresNormalises = {};
        
        for (const [groupeName, groupeData] of Object.entries(parametres)) {
          this.log.debug(`✅ Normalisation du groupe: ${groupeName}`);
          
          if (groupeData && typeof groupeData === 'object') {
            parametresNormalises[groupeName] = this.normalizeParametresGroup(groupeData);
          } else {
            parametresNormalises[groupeName] = groupeData;
          }
        }
        
        this.log.debug('✅ Paramètres avant normalisation:', parametres);
        this.log.debug('✅ Paramètres après normalisation:', parametresNormalises);
        
        return {
          success: true,
          parametres: parametresNormalises
        };
      }
      
      return {
        success: false,
        message: response?.message || 'Erreur lors de la récupération des paramètres'
      };
    } catch (error) {
      this.log.error('Erreur lors du chargement des paramètres:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la récupération des paramètres'
      };
    }
  }

  /**
   * Récupère un paramètre spécifique avec normalisation
   * @param {string} nomParametre Nom du paramètre
   * @param {string} groupe Groupe du paramètre
   * @param {string} [sGroupe] Sous-groupe du paramètre
   * @param {string} [categorie] Catégorie du paramètre
   * @returns {Promise<Object>} Détails du paramètre avec valeur normalisée
   */
  async getParametre(nomParametre, groupe, sGroupe = null, categorie = null) {
    try {
      const params = {
        nomParametre: nomParametre,
        groupe: groupe
      };
      
      if (sGroupe) {
        params.sGroupe = sGroupe;
      }
      
      if (categorie) {
        params.categorie = categorie;
      }
      
      const response = await api.get('parametre-api.php', params);
      
      if (response && response.success) {
        const parametre = response.parametre || {};
        
        // ✅ NORMALISATION DU PARAMÈTRE INDIVIDUEL
        const parametreNormalise = {
          ...parametre,
          valeurParametre: this.normalizeParametreValue(
            parametre.valeurParametre,
            parametre.typeParametre || parametre.type
          )
        };
        
        // ✅ Normaliser les propriétés booléennes métadonnées
        const result = normalizeBooleanFields(parametreNormalise, ['Actif', 'Obligatoire', 'Visible']);
        
        this.log.debug('✅ Paramètre avant normalisation:', parametre);
        this.log.debug('✅ Paramètre après normalisation:', result);
        
        return {
          success: true,
          parametre: result
        };
      }
      
      return {
        success: false,
        message: response?.message || 'Paramètre non trouvé'
      };
    } catch (error) {
      this.log.error(`Erreur lors de la récupération du paramètre ${nomParametre}:`, error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la récupération du paramètre'
      };
    }
  }

  /**
   * Met à jour un paramètre avec gestion des booléens
   * @param {Object} parametreData Données du paramètre à mettre à jour
   * @returns {Promise<Object>} Résultat de la mise à jour
   */
  async updateParametre(parametreData) {
    try {
      this.log.debug('✅ Données d\'entrée pour mise à jour:', parametreData);
      
      // ✅ PRÉPARATION DES DONNÉES AVEC GESTION DES BOOLÉENS
      let dataToSend = this.prepareParametreForApi(parametreData);
      
      this.log.debug('✅ Données préparées pour l\'API:', dataToSend);
      const response = await api.post('parametre-api.php', dataToSend);
      
      return {
        success: response?.success || false,
        message: response?.message || 'Mise à jour effectuée'
      };
    } catch (error) {
      this.log.error('Erreur lors de la mise à jour du paramètre:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la mise à jour du paramètre'
      };
    }
  }

  /**
   * ✅ MÉTHODES UTILITAIRES POUR LES PARAMÈTRES BOOLÉENS
   */

  /**
   * Vérifie si un paramètre booléen est activé
   * @param {string} nomParametre Nom du paramètre
   * @param {string} groupe Groupe du paramètre
   * @param {string} [sGroupe] Sous-groupe du paramètre
   * @returns {Promise<boolean>} True si le paramètre est activé
   */
  async isParametreActive(nomParametre, groupe, sGroupe = null) {
    try {
      const result = await this.getParametre(nomParametre, groupe, sGroupe);
      
      if (result.success && result.parametre) {
        return toBoolean(result.parametre.valeurParametre);
      }
      
      return false;
    } catch (error) {
      this.log.error(`Erreur lors de la vérification du paramètre ${nomParametre}:`, error);
      return false;
    }
  }

  /**
   * Active ou désactive un paramètre booléen
   * @param {string} nomParametre Nom du paramètre
   * @param {string} groupe Groupe du paramètre
   * @param {string} sGroupe Sous-groupe du paramètre
   * @param {boolean} activer True pour activer, false pour désactiver
   * @returns {Promise<Object>} Résultat de la mise à jour
   */
  async toggleParametreBoolean(nomParametre, groupe, sGroupe, activer) {
    try {
      const parametreData = {
        nomParametre: nomParametre,
        groupeParametre: groupe,
        sousGroupeParametre: sGroupe,
        valeurParametre: activer
      };
      
      return await this.updateParametre(parametreData);
    } catch (error) {
      this.log.error(`Erreur lors du toggle du paramètre ${nomParametre}:`, error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la mise à jour du paramètre'
      };
    }
  }
}

export default ParametreService;