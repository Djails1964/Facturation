// services/TarifFormService.js - Service centralisé pour les formulaires - VERSION COMPLÈTE

import { FORM_TYPES } from '../../../constants/tarifConstants';
import ModalComponents from '../../shared/ModalComponents';

import { createLogger } from '../../../utils/createLogger';

import DateService from '../../../utils/DateService';

const log = createLogger("TarifFormService");

/**
 * ✅ NOUVEAU: Mapping entre FORM_TYPES et les types d'entités de tarifActions
 */
const FORM_TYPE_TO_ENTITY = {
  [FORM_TYPES.SERVICE]: 'service',
  [FORM_TYPES.UNITE]: 'unite',
  [FORM_TYPES.TYPE_TARIF]: 'typeTarif',
  [FORM_TYPES.TARIF]: 'tarif',
  [FORM_TYPES.TARIF_SPECIAL]: 'tarifSpecial'
};

export class TarifFormService {
  
  // Génération du contenu des formulaires
  static createFormContent(formType, itemData = {}, isEdit = false, additionalData = {}) {
    const isReadOnly = false;
    log.debug("createFormContent - addistionalData : " , additionalData);
    const { services = [], unites = [], typesTarifs = [], clients = [] } = additionalData;

    // Pour les services inactifs en mode édition : seul le champ "Actif" est modifiable
    const isInactiveService = formType === FORM_TYPES.SERVICE && 
                               isEdit && 
                               (itemData.actif === false || itemData.actif === 0);
    const fieldsReadOnly = isReadOnly || isInactiveService;
    
    switch (formType) {
      case FORM_TYPES.SERVICE:
        return `
          <form id="modalForm" class="modal-form" novalidate>
          ${isInactiveService ? `
              <div style="margin-bottom: 20px; padding: 12px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
                <strong>⚠️ Service inactif</strong><br>
                <span style="font-size: 0.9em; color: #856404;">
                  Ce service est actuellement inactif. Seule l'activation est autorisée. 
                  Pour modifier les autres champs, veuillez d'abord réactiver le service.
                </span>
              </div>
            ` : ''}
            ${ModalComponents.createTextInput(
              'codeService', 
              'Code du service', 
              itemData.codeService || '', 
              'text', 
              true, 
              fieldsReadOnly,
              'maxlength="10" style="text-transform: uppercase;" data-validation="service-code"'
            )}
            ${ModalComponents.createTextInput(
              'nomService', 
              'Nom du service', 
              itemData.nomService || '', 
              'text', 
              true, 
              fieldsReadOnly,
              'maxlength="100" data-validation="service-nom"'
            )}
            ${ModalComponents.createTextarea(
              'descriptionService', 
              'Description', 
              itemData.descriptionService || '', 
              3, 
              false, 
              fieldsReadOnly
            )}
            
            <!-- Checkboxes côte à côte -->
            <div style="display: flex; gap: 30px; margin: 20px 0; align-items: flex-start;">
              <label style="display: flex; align-items: center; cursor: pointer; user-select: none;">
                <input 
                  type="checkbox" 
                  name="actif" 
                  value="1"
                  ${(itemData.actif === undefined || itemData.actif === true || itemData.actif === 1) ? 'checked' : ''}
                  ${isReadOnly ? 'disabled' : ''}
                  style="margin-right: 8px; transform: scale(1.2);"
                />
                <span style="font-weight: 500; color: #333;">Actif</span>
              </label>
              
              <label style="display: flex; align-items: center; cursor: pointer; user-select: none;">
                <input 
                  type="checkbox" 
                  name="isDefault" 
                  value="1"
                  ${(itemData.isDefault === true || itemData.isDefault === 1) ? 'checked' : ''}
                  ${fieldsReadOnly ? 'disabled' : ''}
                  style="margin-right: 8px; transform: scale(1.2);"
                />
                <span style="font-weight: 500; color: #333;">Défaut</span>
              </label>
            </div>
            
            <div class="validation-status" id="validation-status" style="
              margin-top: 15px; 
              padding: 10px; 
              border-radius: 4px; 
              display: none;
              font-size: 13px;
            "></div>
          </form>
        `;
        
      case FORM_TYPES.UNITE:
        return `
          <form id="modalForm" class="modal-form" novalidate>
            ${ModalComponents.createTextInput(
              'codeUnite', 
              'Code de l\'unité', 
              itemData.codeUnite || '', 
              'text', 
              true, 
              isReadOnly,
              'maxlength="10" style="text-transform: uppercase;" data-validation="unite-code"'
            )}
            ${ModalComponents.createTextInput(
              'nomUnite', 
              'Nom de l\'unité', 
              itemData.nomUnite || '', 
              'text', 
              true, 
              isReadOnly,
              'maxlength="50" data-validation="unite-nom"'
            )}
            ${ModalComponents.createTextarea(
              'descriptionUnite', 
              'Description', 
              itemData.descriptionUnite || '', 
              3, 
              false, 
              isReadOnly
            )}
            
            <div class="validation-status" id="validation-status" style="
              margin-top: 15px; 
              padding: 10px; 
              border-radius: 4px; 
              display: none;
              font-size: 13px;
            "></div>
          </form>
        `;
        
      case FORM_TYPES.TYPE_TARIF:
        return `
          <form id="modalForm" class="modal-form" novalidate>
            ${ModalComponents.createTextInput(
              'codeTypeTarif', 
              'Code du type de tarif', 
              itemData.codeTypeTarif || '', 
              'text', 
              true, 
              isReadOnly,
              'maxlength="20" style="text-transform: uppercase;" data-validation="typetarif-code"'
            )}
            ${ModalComponents.createTextInput(
              'nomTypeTarif', 
              'Nom du type de tarif', 
              itemData.nomTypeTarif || '', 
              'text', 
              true, 
              isReadOnly,
              'maxlength="100" data-validation="typetarif-nom"'
            )}
            ${ModalComponents.createTextarea(
              'descriptionTypeTarif', 
              'Description', 
              itemData.descriptionTypeTarif || '', 
              3, 
              false, 
              isReadOnly
            )}
            <div class="validation-status" id="validation-status" style="
              margin-top: 15px; 
              padding: 10px; 
              border-radius: 4px; 
              display: none;
              font-size: 13px;
            "></div>
          </form>
        `;

      case FORM_TYPES.TARIF:
        // ✅ VÉRIFICATION ET SÉCURISATION des données avant .map()
        const serviceOptions = (services && Array.isArray(services)) 
          ? services.map(s => ({ value: s.idService, text: s.nomService }))
          : [];
         
        log.debug("chargement uniteOptions - unites:", unites);
        const uniteOptions = (unites && Array.isArray(unites)) 
          ? unites.map(u => ({ value: u.idUnite, text: u.nomUnite }))
          : [];
        log.debug("chargement uniteOptions - Options chargées :", uniteOptions);
          
        const typeTarifOptions = (typesTarifs && Array.isArray(typesTarifs)) 
          ? typesTarifs.map(t => ({ value: t.idTypeTarif, text: t.nomTypeTarif }))
          : [];

        return `
          <form id="modalForm" class="modal-form" novalidate>
            ${ModalComponents.createSelect(
              'idService', 
              'Service', 
              serviceOptions,         // ✅ CORRECTION: options en 3ème position
              itemData.idService || '', // ✅ CORRECTION: selectedValue en 4ème position
              true, 
              isReadOnly
            )}
            ${ModalComponents.createSelect(
              'idUnite', 
              'Unité', 
              uniteOptions,           // ✅ CORRECTION: options en 3ème position
              itemData.idUnite || '',   // ✅ CORRECTION: selectedValue en 4ème position
              true, 
              isReadOnly
            )}
            ${ModalComponents.createSelect(
              'idTypeTarif', 
              'Type de tarif', 
              typeTarifOptions,       // ✅ CORRECTION: options en 3ème position
              itemData.idTypeTarif || '', // ✅ CORRECTION: selectedValue en 4ème position
              true, 
              isReadOnly
            )}
            ${ModalComponents.createTextInput(
              'prixTarifStandard', 
              'Prix (CHF)', 
              itemData.prixTarifStandard || '', 
              'number', 
              true, 
              isReadOnly,
              'min="0" step="0.01" data-validation="tarif-prix"'
            )}
            ${ModalComponents.createDateInputWithModal(
              'dateDebutTarifStandard', 
              'Date de début', 
              itemData.dateDebutTarifStandard 
                ? DateService.formatSingleDate(itemData.dateDebutTarifStandard, 'date')
                : DateService.formatSingleDate(new Date(), 'date'), 
              'date', 
              true, 
              {
                readOnly: isReadOnly,
                multiSelect: false,
                minDate: null,
                maxDate: null,
                context: 'tarif',
                helpText: 'Date de début de validité du tarif'
              },
              'data-validation="tarif-date-debut"'
            )}
            ${ModalComponents.createDateInputWithModal(
              'dateFinTarifStandard', 
              'Date de fin', 
              itemData.dateFinTarifStandard 
                ? DateService.formatSingleDate(itemData.dateFinTarifStandard, 'date')
                : '', 
              'date', 
              false, 
              isReadOnly,
              'data-validation="tarif-date-fin"'
            )}
            ${ModalComponents.createTextarea(
              'note', 
              'Note', 
              itemData.note || '', 
              3, 
              false, 
              isReadOnly
            )}
            
            <div class="validation-status" id="validation-status" style="
              margin-top: 15px; 
              padding: 10px; 
              border-radius: 4px; 
              display: none;
              font-size: 13px;
            "></div>
          </form>
        `;

      case FORM_TYPES.TARIF_SPECIAL:
        // ✅ VÉRIFICATION ET SÉCURISATION des données avant .map()
        const clientOptions = (clients && Array.isArray(clients)) 
          ? clients.map(c => ({ value: c.id, text: `${c.prenom} ${c.nom}` }))
          : [];
          
        const serviceOptionsSpecial = (services && Array.isArray(services)) 
          ? services.map(s => ({ value: s.id, text: s.nomService }))
          : [];
          
        const uniteOptionsSpecial = (unites && Array.isArray(unites)) 
          ? unites.map(u => ({ value: u.id, text: u.nomUnite }))
          : [];

        return `
          <form id="modalForm" class="modal-form" novalidate>
            ${ModalComponents.createSelect(
              'clientId', 
              'Client', 
              clientOptions,          // ✅ CORRECTION: options en 3ème position
              itemData.clientId || '',  // ✅ CORRECTION: selectedValue en 4ème position
              true, 
              isReadOnly
            )}
            ${ModalComponents.createSelect(
              'idService', 
              'Service', 
              serviceOptionsSpecial,  // ✅ CORRECTION: options en 3ème position
              itemData.idService || '', // ✅ CORRECTION: selectedValue en 4ème position
              true, 
              isReadOnly
            )}
            ${ModalComponents.createSelect(
              'idUnite', 
              'Unité', 
              uniteOptionsSpecial,    // ✅ CORRECTION: options en 3ème position
              itemData.idUnite || '',   // ✅ CORRECTION: selectedValue en 4ème position
              true, 
              isReadOnly
            )}
            ${ModalComponents.createTextInput(
              'prixTarifSpecial', 
              'Prix (CHF)', 
              itemData.prixTarifSpecial || '', 
              'number', 
              true, 
              isReadOnly,
              'min="0" step="0.01" data-validation="tarif-special-prix"'
            )}
            ${ModalComponents.createTextInput(
              'dateDebutTarifSpecial', 
              'Date de début', 
              itemData.dateDebutTarifSpecial || new Date().toISOString().split('T')[0], 
              'date', 
              true, 
              isReadOnly,
              'data-validation="tarif-special-date-debut"'
            )}
            ${ModalComponents.createTextInput(
              'dateFinTarifSpecial', 
              'Date de fin', 
              itemData.dateFinTarifSpecial || '', 
              'date', 
              false, 
              isReadOnly,
              'data-validation="tarif-special-date-fin"'
            )}
            ${ModalComponents.createTextarea(
              'note', 
              'Note', 
              itemData.note || '', 
              3, 
              true, 
              isReadOnly,
              'maxlength="1000"'
            )}
            
            <div class="validation-status" id="validation-status" style="
              margin-top: 15px; 
              padding: 10px; 
              border-radius: 4px; 
              display: none;
              font-size: 13px;
            "></div>
          </form>
        `;
        
      default:
        return '<form id="modalForm" class="modal-form" novalidate>Type de formulaire non supporté</form>';
    }
  }

    // Titres des modales
  static getCreateTitle(formType) {
    const titles = {
      [FORM_TYPES.SERVICE]: 'Créer un nouveau service',
      [FORM_TYPES.UNITE]: 'Créer une nouvelle unité',
      [FORM_TYPES.TYPE_TARIF]: 'Créer un nouveau type de tarif',
      [FORM_TYPES.TARIF]: 'Créer un nouveau tarif',
      [FORM_TYPES.TARIF_SPECIAL]: 'Créer un nouveau tarif spécial'
    };
    return titles[formType] || 'Créer un élément';
  }

  static getEditTitle(formType) {
    const titles = {
      [FORM_TYPES.SERVICE]: 'Modifier le service',
      [FORM_TYPES.UNITE]: 'Modifier l\'unité',
      [FORM_TYPES.TYPE_TARIF]: 'Modifier le type de tarif',
      [FORM_TYPES.TARIF]: 'Modifier le tarif',
      [FORM_TYPES.TARIF_SPECIAL]: 'Modifier le tarif spécial'
    };
    return titles[formType] || 'Modifier l\'élément';
  }

  // Récupération des données d'un élément
  static getItemData(formType, itemId, gestionState) {
    log.debug('getItemData - formType = ', formType);
    log.debug('getItemData - gestionState = ', gestionState);
    switch (formType) {
      case FORM_TYPES.SERVICE:
        return gestionState.services.find(s => s.idService === itemId) || {};
      case FORM_TYPES.UNITE:
        return gestionState.unites.find(u => u.idUnite === itemId) || {};
      case FORM_TYPES.TYPE_TARIF:
        return gestionState.typesTarifs.find(t => t.idTypeTarif === itemId) || {};
      case FORM_TYPES.TARIF:
        return gestionState.tarifs.find(t => t.idTarifStandard === itemId) || {};
      case FORM_TYPES.TARIF_SPECIAL:
        return gestionState.tarifsSpeciaux.find(t => t.idTarifSpecial === itemId) || {};
      default:
        return {};
    }
  }

  /**
   * Soumission des formulaires via tarifActions (méthodes génériques)
   * @param {string} formType - Type de formulaire (FORM_TYPES.*)
   * @param {Object} formData - Données du formulaire
   * @param {boolean} isEdit - Mode édition ou création
   * @param {number|string} itemId - ID de l'élément (pour édition)
   * @param {Object} tarifActions - Hook tarifActions avec méthodes create/update
   */
  static async submitForm(formType, formData, isEdit, itemId, tarifActions) {
    
    // ✅ NETTOYAGE PRÉALABLE des dates vides avant envoi
    const cleanedFormData = TarifFormService.cleanFormDataDates(formData);
    
    log.debug('📤 Soumission formulaire:', {
      formType,
      originalData: formData,
      cleanedData: cleanedFormData,
      isEdit,
      itemId,
      hasTarifActions: !!tarifActions
    });

    // ✅ VÉRIFICATION que tarifActions est bien défini
    if (!tarifActions) {
      throw new Error('tarifActions non défini - vérifier que gestionState.tarifActions est passé correctement');
    }
    
    // ✅ Obtenir le type d'entité pour les méthodes génériques
    const entityType = FORM_TYPE_TO_ENTITY[formType];
    if (!entityType) {
      throw new Error(`Type de formulaire non supporté: ${formType}`);
    }
    
    log.debug('📤 Utilisation tarifActions:', {
      entityType,
      method: isEdit ? 'update' : 'create'
    });

    try {
      if (isEdit) {
        // ✅ Utiliser tarifActions.update(type, id, data)
        return await tarifActions.update(entityType, itemId, cleanedFormData);
      } else {
        // ✅ Utiliser tarifActions.create(type, data)
        return await tarifActions.create(entityType, cleanedFormData);
      }
    } catch (error) {
      log.error('❌ Erreur submitForm:', error);
      throw error;
    }

  }

  /**
   * ✅ NOUVELLE MÉTHODE : Nettoie les dates vides dans les données de formulaire
   * @param {Object} formData - Données du formulaire
   * @returns {Object} Données nettoyées
   */
  static cleanFormDataDates(formData) {
    if (!formData || typeof formData !== 'object') {
      return formData;
    }
    
    const cleaned = { ...formData };
    
    // ✅ LISTE des champs de date à nettoyer
    const dateFields = [
      'dateDebut', 'dateDebutTarifStandard', 'dateDebutTarifSpecial',
      'dateFin', 'dateFinTarifStandard', 'dateFinTarifSpecial',
      'dateCreation',
      'dateModification',
      'dateFacture',
      'dateEcheance'
    ];
    
    dateFields.forEach(field => {
      if (cleaned.hasOwnProperty(field)) {
        // Convertir les chaînes vides en null
        if (cleaned[field] === '' || cleaned[field] === undefined) {
          log.debug(`🔄 Nettoyage date vide: ${field} = "${cleaned[field]}" → null`);
          cleaned[field] = null;
        } else {
          const dateObj = DateService.fromDisplayFormat(cleaned[field]) || 
               DateService.fromInputFormat(cleaned[field]) || 
               new Date(cleaned[field]);
          if (dateObj && !isNaN(dateObj.getTime())) {
            cleaned[field] = DateService.toInputFormat(dateObj);
          }
        }
      }
    });
    
    return cleaned;
  }

  /**
   * Suppression d'éléments via tarifActions
   * @param {string} formType - Type de formulaire
   * @param {number|string} itemId - ID de l'élément
   * @param {Object} tarifActions - Hook tarifActions
   */
  static async deleteItem(formType, itemId, tarifActions) {
    // ✅ VÉRIFICATION que tarifActions est bien défini
    if (!tarifActions) {
      throw new Error('tarifActions non défini - vérifier que gestionState.tarifActions est passé correctement');
    }
    
    const entityType = FORM_TYPE_TO_ENTITY[formType];
    if (!entityType) {
      throw new Error(`Type de suppression non supporté: ${formType}`);
    }
    
    log.debug('🗑️ Suppression via tarifActions.delete:', { entityType, itemId });
    
    // ✅ Utiliser tarifActions.delete(type, id)
    return await tarifActions.delete(entityType, itemId);
  }
  

  /**
   * ✅ CORRIGÉ: Vérification d'utilisation via tarifActions
   * @param {string} formType - Type de formulaire
   * @param {number|string} itemId - ID de l'élément
   * @param {Object} tarifActions - Hook tarifActions
   */
  static async checkItemUsage(formType, itemId, tarifActions) {
    try {
      // ✅ VÉRIFICATION que tarifActions est bien défini
      if (!tarifActions) {
        throw new Error('tarifActions non défini');
      }
      
      const entityType = FORM_TYPE_TO_ENTITY[formType];
      if (!entityType) {
        return { success: true, used: false, message: 'Type non supporté' };
      }
      
      log.debug("checkItemUsage - entityType = ", entityType, ", itemId = ", itemId);
      
      // ✅ Utiliser tarifActions.checkUsage(type, id)
      const result = await tarifActions.checkUsage(entityType, itemId);
      
      log.debug(`🔍 Résultat brut de checkUsage pour ${formType}:`, result);
      
      // 🛡️ NORMALISATION de la réponse selon différents formats d'API
      let normalizedResult = {
        success: true,
        used: false,
        message: '',
        count: 0,
        details: null
      };
      
      if (result) {
        // Format 1: { success: false, message: "...utilisé..." } - Erreur API
        if (result.success === false) {
          normalizedResult.success = false;
          normalizedResult.used = true;
          normalizedResult.message = result.message || 'Élément utilisé';
        }
        // Format 2: { success: true, isUsed: true/false } - Format standard de l'API
        else if (result.isUsed !== undefined) {
          normalizedResult.used = result.isUsed === true;
          normalizedResult.count = result.count || 0;
          normalizedResult.message = result.message || '';
        }
        // Format 3: { success: true, used: true/false }
        else if (result.used !== undefined) {
          normalizedResult.used = result.used === true;
          normalizedResult.count = result.count || 0;
          normalizedResult.message = result.message || '';
        }
        // Format 4: { success: true, inUse: true/false }
        else if (result.inUse !== undefined) {
          normalizedResult.used = result.inUse === true;
          normalizedResult.count = result.count || 0;
          normalizedResult.message = result.message || '';
        }
        
        // Copier les détails si présents
        if (result.details) {
          normalizedResult.details = result.details;
        }
        
        // Garder le success original si disponible
        if (result.success !== undefined) {
          normalizedResult.success = result.success;
        }
      }
      
      log.debug(`📊 Résultat normalisé de checkUsage:`, normalizedResult);
      return normalizedResult;
      
    } catch (error) {
      log.error(`❌ Erreur lors de la vérification d'utilisation pour ${formType}:`, error);
      
      // 🚨 Si l'erreur contient des mots-clés d'utilisation, c'est probablement une utilisation
      if (error.message && typeof error.message === 'string') {
        const errorMessage = error.message.toLowerCase();
        if (errorMessage.includes('utilisé') || errorMessage.includes('référencé') || 
            errorMessage.includes('facture') || errorMessage.includes('tarif') ||
            errorMessage.includes('constraint') || errorMessage.includes('foreign key')) {
          return {
            success: false,
            used: true,
            message: error.message,
            details: null
          };
        }
      }
      
      // Pour les autres erreurs, on retourne une erreur générique
      throw new Error(`Impossible de vérifier l'utilisation: ${error.message}`);
    }
  }


  // Rafraîchissement des données
  // ✅ AMÉLIORÉ: Prend en compte les effets de cascade et les dépendances entre entités
  static async refreshDataAfterSave(formType, gestionState, isDelete = false) {
    log.debug(`🔄 Rafraîchissement données ${formType}... (isDelete: ${isDelete})`);
    
    // ✅ CRITIQUE: Vider le cache AVANT de recharger pour obtenir les données fraîches
    if (gestionState.tarifActions?.clearCache) {
      log.debug('Vidage du cache avant rechargement...');
      gestionState.tarifActions.clearCache();
    }
    
    switch (formType) {
      case FORM_TYPES.SERVICE:
        await gestionState.loadServices();
        if (isDelete) {
          // Cascade: tarifs et tarifs spéciaux supprimés
          await gestionState.loadTarifs();
          await gestionState.loadTarifsSpeciaux();
          await gestionState.loadAllServicesUnites();
        }
        break;
        
      case FORM_TYPES.UNITE:
        await gestionState.loadUnites();
        // ✅ AJOUT: Toujours recharger les liaisons services-unités
        // Car une nouvelle unité peut être associée à un service
        await gestionState.loadAllServicesUnites();
        if (isDelete) {
          // Cascade: tarifs et tarifs spéciaux supprimés
          await gestionState.loadTarifs();
          await gestionState.loadTarifsSpeciaux();
        }
        break;
        
      case FORM_TYPES.TYPE_TARIF:
        await gestionState.loadTypesTarifs();
        break;
        
      case FORM_TYPES.TARIF:
        await gestionState.loadTarifs();
        break;
        
      case FORM_TYPES.TARIF_SPECIAL:
        await gestionState.loadTarifsSpeciaux();
        break;
        
      default:
        // Par sécurité, recharger toutes les données
        log.warn(`Type inconnu ${formType}, rechargement complet`);
        await gestionState.loadAllData();
    }
  }

  /**
   * ✅ NOUVEAU: Rafraîchit toutes les données dépendantes pour les formulaires de tarifs
   * À appeler quand on ouvre un formulaire de création/édition de tarif
   * pour s'assurer que les listes déroulantes sont à jour
   */
  static async refreshDependenciesForTarifForm(gestionState) {
    log.debug('🔄 Rafraîchissement des dépendances pour formulaire tarif...');
    
    try {
      await Promise.all([
        gestionState.loadServices(),
        gestionState.loadUnites(),
        gestionState.loadTypesTarifs(),
        gestionState.loadAllServicesUnites()
      ]);
      log.debug('✅ Dépendances rafraîchies avec succès');
    } catch (error) {
      log.error('❌ Erreur rafraîchissement dépendances:', error);
    }
  }

  /**
   * ✅ NOUVEAU: Rafraîchit les données nécessaires pour les formulaires de tarifs spéciaux
   */
  static async refreshDependenciesForTarifSpecialForm(gestionState) {
    log.debug('🔄 Rafraîchissement des dépendances pour formulaire tarif spécial...');
    
    try {
      await Promise.all([
        gestionState.loadServices(),
        gestionState.loadUnites(),
        gestionState.loadClients(),
        gestionState.loadAllServicesUnites()
      ]);
      log.debug('✅ Dépendances rafraîchies avec succès');
    } catch (error) {
      log.error('❌ Erreur rafraîchissement dépendances:', error);
    }
  }

  // Clés pour les IDs créés
  static getCreatedIdKey(formType) {
    const mapping = {
      [FORM_TYPES.SERVICE]: 'service',
      [FORM_TYPES.UNITE]: 'unite',
      [FORM_TYPES.TYPE_TARIF]: 'typeTarif',
      [FORM_TYPES.TARIF]: 'tarif',
      [FORM_TYPES.TARIF_SPECIAL]: 'tarifSpecial'
    };
    return mapping[formType] || formType;
  }

  // Noms d'affichage des éléments
  static getItemDisplayName(formType, item) {
    if (!item) return 'Élément';
    
    switch (formType) {
      case FORM_TYPES.SERVICE:
        return item.nomService || item.codeService || 'Sans nom';
      case FORM_TYPES.UNITE:
        return item.nomUnite || item.codeUnite || 'Sans nom';
      case FORM_TYPES.TYPE_TARIF:
        return item.nomTypeTarif || item.codeTypeTarif || 'Sans nom';
      case FORM_TYPES.TARIF:
        return `${item.nomService || 'Service'} - ${item.nomUnite || 'Unité'}`;
      case FORM_TYPES.TARIF_SPECIAL:
        return `${item.client_nom || item.clientName || 'Client'} - ${item.nomService || 'Service'}`;
      default:
        return 'Élément';
    }
  }

  // Noms d'affichage des types
  static getFormTypeDisplayName(formType) {
    const displayNames = {
      [FORM_TYPES.SERVICE]: 'Service',
      [FORM_TYPES.UNITE]: 'Unité',
      [FORM_TYPES.TYPE_TARIF]: 'Type de tarif',
      [FORM_TYPES.TARIF]: 'Tarif',
      [FORM_TYPES.TARIF_SPECIAL]: 'Tarif spécial'
    };
    return displayNames[formType] || 'Élément';
  }
}