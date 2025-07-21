/**
 * Service de gestion des paramètres - VERSION MISE À JOUR avec gestion des booléens
 * @class ParametreService
 * @description Gère l'accès aux données des paramètres via l'API
 */
import api from './api';
import { toBoolean, toBooleanString, isValidBoolean } from '../utils/booleanHelper'; // ✅ IMPORT du helper

class ParametreService {
  constructor() {
    // Bind des méthodes pour s'assurer que 'this' est correctement défini
    this.getAllParametres = this.getAllParametres.bind(this);
    this.getParametre = this.getParametre.bind(this);
    this.updateParametre = this.updateParametre.bind(this);
    this.normalizeParametreValue = this.normalizeParametreValue.bind(this);
    this.normalizeParametresGroup = this.normalizeParametresGroup.bind(this);
    this.prepareParametreForApi = this.prepareParametreForApi.bind(this);
  }

  /**
   * ✅ NORMALISE LA VALEUR D'UN PARAMÈTRE SELON SON TYPE
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
        // Si la valeur ressemble à un booléen, la convertir
        if (isValidBoolean(value)) {
          // Pour les chaînes qui sont clairement des booléens
          const stringValue = String(value).toLowerCase().trim();
          if (['true', 'false', '1', '0', 'yes', 'no', 'oui', 'non', 'on', 'off'].includes(stringValue)) {
            return toBoolean(value);
          }
        }
        return String(value);
    }
  }

  /**
   * ✅ NORMALISE UN GROUPE DE PARAMÈTRES - VERSION CORRIGÉE
   * @param {Object} parametresGroup - Groupe de paramètres à normaliser
   * @returns {Object} - Groupe avec valeurs normalisées
   */
  normalizeParametresGroup(parametresGroup) {
    if (!parametresGroup || typeof parametresGroup !== 'object') {
      return parametresGroup;
    }

    // 🔧 CORRECTION: Ne pas traiter les tableaux comme des objets à normaliser
    if (Array.isArray(parametresGroup)) {
      console.log('⚠️ normalizeParametresGroup reçoit un tableau, traitement des éléments individuellement');
      return parametresGroup.map(param => {
        if (param && typeof param === 'object') {
          return {
            ...param,
            Valeur_parametre: this.normalizeParametreValue(
              param.Valeur_parametre, 
              param.Type_parametre || param.type
            ),
            Actif: param.Actif !== undefined ? toBoolean(param.Actif) : undefined,
            Obligatoire: param.Obligatoire !== undefined ? toBoolean(param.Obligatoire) : undefined,
            Visible: param.Visible !== undefined ? toBoolean(param.Visible) : undefined,
          };
        }
        return param;
      });
    }

    const normalized = {};
    
    for (const [key, parametre] of Object.entries(parametresGroup)) {
      // 🔧 CORRECTION: Vérifier si c'est un tableau avant de le traiter
      if (Array.isArray(parametre)) {
        console.log(`✅ Traitement tableau pour ${key}:`, parametre.length, 'éléments');
        // Si c'est un tableau, traiter chaque élément individuellement
        normalized[key] = parametre.map(param => {
          if (param && typeof param === 'object') {
            return {
              ...param,
              Valeur_parametre: this.normalizeParametreValue(
                param.Valeur_parametre, 
                param.Type_parametre || param.type
              ),
              Actif: param.Actif !== undefined ? toBoolean(param.Actif) : undefined,
              Obligatoire: param.Obligatoire !== undefined ? toBoolean(param.Obligatoire) : undefined,
              Visible: param.Visible !== undefined ? toBoolean(param.Visible) : undefined,
            };
          }
          return param;
        });
      }
      // Si c'est un objet avec des propriétés de paramètre
      else if (parametre && typeof parametre === 'object') {
        // Vérifier si c'est un paramètre direct (a Nom_parametre) ou un conteneur
        if (parametre.Nom_parametre) {
          // C'est un paramètre direct
          normalized[key] = {
            ...parametre,
            Valeur_parametre: this.normalizeParametreValue(
              parametre.Valeur_parametre, 
              parametre.Type_parametre || parametre.type
            ),
            Actif: parametre.Actif !== undefined ? toBoolean(parametre.Actif) : undefined,
            Obligatoire: parametre.Obligatoire !== undefined ? toBoolean(parametre.Obligatoire) : undefined,
            Visible: parametre.Visible !== undefined ? toBoolean(parametre.Visible) : undefined,
          };
        } else {
          // C'est un conteneur, traiter récursivement
          normalized[key] = this.normalizeParametresGroup(parametre);
        }
      } else {
        // Pour tous les autres types, garder tel quel
        normalized[key] = parametre;
      }
    }

    return normalized;
  }


  /**
   * ✅ PRÉPARE UN PARAMÈTRE POUR L'ENVOI À L'API
   * @param {Object} parametreData - Données du paramètre
   * @returns {Object} - Données préparées pour l'API
   */
  prepareParametreForApi(parametreData) {
    const prepared = { ...parametreData };

    // Convertir les booléens en chaînes pour l'API si nécessaire
    if (typeof prepared.Valeur_parametre === 'boolean') {
      prepared.Valeur_parametre = toBooleanString(prepared.Valeur_parametre);
      console.log('✅ Conversion booléen → chaîne pour API:', 
        parametreData.Valeur_parametre, '→', prepared.Valeur_parametre);
    }

    // Normaliser d'autres propriétés booléennes
    if (prepared.Actif !== undefined) {
      prepared.Actif = toBooleanString(prepared.Actif);
    }
    
    if (prepared.Obligatoire !== undefined) {
      prepared.Obligatoire = toBooleanString(prepared.Obligatoire);
    }
    
    if (prepared.Visible !== undefined) {
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
        
        // ✅ NORMALISATION DE TOUS LES GROUPES DE PARAMÈTRES - VERSION SIMPLIFIÉE
        const parametresNormalises = {};
        
        for (const [groupeName, groupeData] of Object.entries(parametres)) {
          console.log(`✅ Normalisation du groupe: ${groupeName}`);
          
          if (groupeData && typeof groupeData === 'object') {
            // 🔧 CORRECTION: Traitement plus intelligent de la structure
            parametresNormalises[groupeName] = this.normalizeParametresGroup(groupeData);
          } else {
            parametresNormalises[groupeName] = groupeData;
          }
        }
        
        console.log('✅ Paramètres avant normalisation:', parametres);
        console.log('✅ Paramètres après normalisation:', parametresNormalises);
        
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
      console.error('Erreur lors du chargement des paramètres:', error);
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
          Valeur_parametre: this.normalizeParametreValue(
            parametre.Valeur_parametre,
            parametre.Type_parametre || parametre.type
          ),
          // Normaliser d'autres propriétés booléennes
          Actif: parametre.Actif !== undefined ? toBoolean(parametre.Actif) : undefined,
          Obligatoire: parametre.Obligatoire !== undefined ? toBoolean(parametre.Obligatoire) : undefined,
          Visible: parametre.Visible !== undefined ? toBoolean(parametre.Visible) : undefined,
        };
        
        console.log('✅ Paramètre avant normalisation:', parametre);
        console.log('✅ Paramètre après normalisation:', parametreNormalise);
        
        return {
          success: true,
          parametre: parametreNormalise
        };
      }
      
      return {
        success: false,
        message: response?.message || 'Paramètre non trouvé'
      };
    } catch (error) {
      console.error(`Erreur lors de la récupération du paramètre ${nomParametre}:`, error);
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
      console.log('✅ Données d\'entrée pour mise à jour:', parametreData);
      
      // ✅ PRÉPARATION DES DONNÉES AVEC GESTION DES BOOLÉENS
      let dataToSend = this.prepareParametreForApi(parametreData);
      
      // Normaliser les noms de propriétés pour l'API
      // Correction des noms de propriétés pour l'API si nécessaire
      if (dataToSend.sGroupe_parametre !== undefined) {
        dataToSend.sGroupeParametre = dataToSend.sGroupe_parametre;
        delete dataToSend.sGroupe_parametre;
      }
      
      if (dataToSend.Categorie !== undefined) {
        dataToSend.categorie = dataToSend.Categorie;
        delete dataToSend.Categorie;
      }
      
      console.log('✅ Données préparées pour l\'API:', dataToSend);
      const response = await api.post('parametre-api.php', dataToSend);
      
      return {
        success: response?.success || false,
        message: response?.message || 'Mise à jour effectuée'
      };
    } catch (error) {
      console.error('Erreur lors de la mise à jour du paramètre:', error);
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
        return toBoolean(result.parametre.Valeur_parametre);
      }
      
      return false;
    } catch (error) {
      console.error(`Erreur lors de la vérification du paramètre ${nomParametre}:`, error);
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
        Nom_parametre: nomParametre,
        Groupe_parametre: groupe,
        sGroupe_parametre: sGroupe,
        Valeur_parametre: activer, // Sera converti en chaîne par prepareParametreForApi
      };
      
      return await this.updateParametre(parametreData);
    } catch (error) {
      console.error(`Erreur lors du toggle du paramètre ${nomParametre}:`, error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la mise à jour du paramètre'
      };
    }
  }
}

export default ParametreService;