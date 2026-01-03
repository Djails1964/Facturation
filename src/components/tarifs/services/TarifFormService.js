// services/TarifFormService.js - Service centralisé pour les formulaires - VERSION COMPLÈTE

import { FORM_TYPES } from '../../../constants/tarifConstants';
import ModalComponents from '../../shared/ModalComponents';

import { createLogger } from '../../../utils/createLogger';

import DateService from '../../../utils/DateService';

const log = createLogger("TarifFormService");


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

  // Soumission des formulaires
  static async submitForm(formType, formData, isEdit, itemId, tarificationService) {
    
    // ✅ NETTOYAGE PRÉALABLE des dates vides avant envoi
    const cleanedFormData = TarifFormService.cleanFormDataDates(formData);
    
    log.debug('📤 Soumission formulaire:', {
      formType,
      originalData: formData,
      cleanedData: cleanedFormData,
      isEdit,
      itemId
    });
    
    switch (formType) {
      case FORM_TYPES.SERVICE:
        return isEdit 
          ? await tarificationService.updateService(itemId, cleanedFormData)
          : await tarificationService.createService(cleanedFormData);
          
      case FORM_TYPES.UNITE:
        return isEdit
          ? await tarificationService.updateUnite(itemId, cleanedFormData)
          : await tarificationService.createUnite(cleanedFormData);
          
      case FORM_TYPES.TYPE_TARIF:
        return isEdit
          ? await tarificationService.updateTypeTarif(itemId, cleanedFormData)
          : await tarificationService.createTypeTarif(cleanedFormData);
          
      case FORM_TYPES.TARIF:
        return isEdit
          ? await tarificationService.updateTarif(itemId, cleanedFormData)
          : await tarificationService.createTarif(cleanedFormData);
          
      case FORM_TYPES.TARIF_SPECIAL:
        return isEdit
          ? await tarificationService.updateTarifSpecial(itemId, cleanedFormData)
          : await tarificationService.createTarifSpecial(cleanedFormData);
          
      default:
        throw new Error(`Type de formulaire non supporté: ${formType}`);
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

  // Suppression d'éléments
  static async deleteItem(formType, itemId, tarificationService) {
    switch (formType) {
      case FORM_TYPES.SERVICE:
        return await tarificationService.deleteService(itemId);
      case FORM_TYPES.UNITE:
        return await tarificationService.deleteUnite(itemId);
      case FORM_TYPES.TYPE_TARIF:
        return await tarificationService.deleteTypeTarif(itemId);
      case FORM_TYPES.TARIF:
        return await tarificationService.deleteTarif(itemId);
      case FORM_TYPES.TARIF_SPECIAL:
        return await tarificationService.deleteTarifSpecial(itemId);
      default:
        throw new Error(`Type de suppression non supporté: ${formType}`);
    }
  }

  // Vérification d'utilisation
  static async checkItemUsage(formType, itemId, tarificationService) {
    try {
      let result;
      log.debug("checkItemUsage - serviceId = ", itemId);
      
      switch (formType) {
        case FORM_TYPES.SERVICE:
          result = await tarificationService.checkServiceUsage(itemId);
          break;
        case FORM_TYPES.UNITE:
          result = await tarificationService.checkUniteUsage(itemId);
          break;
        case FORM_TYPES.TYPE_TARIF:
          result = await tarificationService.checkTypeTarifUsage(itemId);
          break;
        case FORM_TYPES.TARIF:
          result = await tarificationService.checkTarifUsage(itemId);
          break;
        case FORM_TYPES.TARIF_SPECIAL:
          result = await tarificationService.checkTarifSpecialUsage(itemId);
          break;
        default:
          return { success: true, used: false, message: 'Type non supporté' };
      }
      
      log.debug(`🔍 Résultat brut de checkUsage pour ${formType}:`, result);
      
      // 🛡️ NORMALISATION de la réponse selon différents formats d'API
      let normalizedResult = {
        success: true,
        used: false,
        message: '',
        details: null
      };
      
      if (result) {
        // Format 1: { success: false, message: "...utilisé..." }
        if (result.success === false) {
          normalizedResult.success = false;
          normalizedResult.used = true;
          normalizedResult.message = result.message || 'Élément utilisé';
        }
        // Format 2: { success: true, used: true }
        else if (result.used === true || result.isUsed === true || result.inUse === true) {
          normalizedResult.used = true;
          normalizedResult.message = result.message || 'Élément utilisé';
        }
        // Format 3: Analyse du message d'erreur
        else if (result.message && typeof result.message === 'string') {
          const message = result.message.toLowerCase();
          if (message.includes('utilisé') || message.includes('référencé') || 
              message.includes('facture') || message.includes('tarif') ||
              message.includes('impossible')) {
            normalizedResult.used = true;
            normalizedResult.message = result.message;
          }
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
  static async refreshDataAfterSave(formType, gestionState) {
    log.debug(`🔄 Rafraîchissement données ${formType}...`);
    
    switch (formType) {
      case FORM_TYPES.SERVICE:
        await gestionState.loadServices();
        break;
      case FORM_TYPES.UNITE:
        await gestionState.loadUnites();
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