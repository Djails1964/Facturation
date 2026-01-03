// services/TarifValidationService.js - Service centralisé pour la validation

import { FORM_TYPES } from '../../../constants/tarifConstants';
import { createLogger } from '../../../utils/createLogger';
import DateService from '../../../utils/DateService';

const log = createLogger("TarifValidationService");

export class TarifValidationService {
  
  

  // ===== VALIDATION PRINCIPALE =====
  
  /**
   * Valide les données d'un formulaire
   * @param {string} formType - Type de formulaire
   * @param {object} formData - Données à valider
   * @param {object} existingItems - Éléments existants pour vérification d'unicité
   * @param {number|null} itemId - ID de l'élément en cours d'édition (null pour création)
   * @returns {object} Résultat de validation
   */
  static validateFormData(formType, formData, existingItems = [], itemId = null) {
    const requiredFields = this.getRequiredFields(formType);
    const fieldLabels = this.getFieldLabels(formType);
    log.debug('🔍 Validation des données:', {
      formType,
      formData,
      existingItems,
      itemId
    });
    log.debug('🔍 Validation des données - Champs obligatoires:', requiredFields);
    log.debug('🔍 Validation des données - Labels des champs:', fieldLabels);

    const errors = {};
    const warnings = [];
    
    // 1. Validation des champs obligatoires
    requiredFields.forEach(field => {
      if (!formData[field] || formData[field].toString().trim() === '') {
        errors[field] = `${fieldLabels[field] || field} est obligatoire`;
      }
    });
    
    // 2. Validation spécifique par type de formulaire
    const specificValidation = this.validateSpecificFields(formType, formData, existingItems, itemId);
    Object.assign(errors, specificValidation.errors);
    warnings.push(...specificValidation.warnings);
    
    // 3. Validation des contraintes métier
    const businessValidation = this.validateBusinessRules(formType, formData, existingItems, itemId);
    Object.assign(errors, businessValidation.errors);
    warnings.push(...businessValidation.warnings);
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      warnings,
      missingFields: requiredFields.filter(field => 
        !formData[field] || formData[field].toString().trim() === ''
      ),
      fieldLabels
    };
  }
  
  // ===== CHAMPS OBLIGATOIRES =====
  
  static getRequiredFields(formType) {
    switch (formType) {
      case FORM_TYPES.SERVICE:
        return ['codeService', 'nomService'];
      case FORM_TYPES.UNITE:
        return ['codeUnite', 'nomUnite'];
      case FORM_TYPES.TYPE_TARIF:
        return ['codeTypeTarif', 'nomTypeTarif'];
      case FORM_TYPES.TARIF:
        return ['idService', 'idUnite', 'idTypeTarif', 'prixTarifStandard', 'dateDebutTarifStandard'];
      case FORM_TYPES.TARIF_SPECIAL:
        return ['clientId', 'idService', 'idUnite', 'prixTarifSpecial', 'dateDebutTarifSpecial', 'note'];
      default:
        return [];
    }
  }
  
  // ===== LABELS DES CHAMPS =====
  
  static getFieldLabels(formType) {
    const commonLabels = {
      code: 'Code',
      nom: 'Nom',
      description: 'Description',
      idService: 'Service',
      idUnite: 'Unité',
      idTypeTarif: 'Type de tarif',
      idClient: 'Client',
      prix: 'Prix',
      dateDebut: 'Date de début',
      dateFin: 'Date de fin',
      note: 'Note',
      actif: 'Statut actif',
      isDefault: 'Par défaut'
    };
    
    return commonLabels;
  }
  
  // ===== VALIDATION SPÉCIFIQUE PAR CHAMPS =====
  
  static validateSpecificFields(formType, formData, existingItems, itemId) {
    const errors = {};
    const warnings = [];
    
    switch (formType) {
      case FORM_TYPES.SERVICE:
        return this.validateServiceFields(formData, existingItems, itemId);
      case FORM_TYPES.UNITE:
        return this.validateUniteFields(formData, existingItems, itemId);
      case FORM_TYPES.TYPE_TARIF:
        return this.validateTypeTarifFields(formData, existingItems, itemId);
      case FORM_TYPES.TARIF:
        return this.validateTarifFields(formData, existingItems, itemId);
      case FORM_TYPES.TARIF_SPECIAL:
        return this.validateTarifSpecialFields(formData, existingItems, itemId);
      default:
        return { errors, warnings };
    }
  }
  
  // ===== VALIDATION SERVICES =====
  
  static validateServiceFields(formData, existingItems, itemId) {
    const errors = {};
    const warnings = [];
    
    // Validation du code
    if (formData.codeService) {
      const code = formData.codeService.trim().toUpperCase();
      
      // Longueur
      if (code.length > 10) {
        errors.code = 'Le code ne peut pas dépasser 10 caractères';
      }
      
      // Format (lettres, chiffres, tirets)
      if (!/^[A-Z0-9_-]+$/.test(code)) {
        errors.code = 'Le code ne peut contenir que des lettres, chiffres, tirets et underscores';
      }
      
      // Unicité
      const codeExists = existingItems.some(item => 
        item.codeService && 
        item.codeService.toUpperCase() === code && 
        item.idService !== itemId
      );
      
      if (codeExists) {
        errors.code = `Le code "${code}" existe déjà`;
      }
    }
    
    // Validation du nom
    if (formData.nomService) {
      const nom = formData.nomService.trim();
      
      // Longueur
      if (nom.length > 100) {
        errors.nom = 'Le nom ne peut pas dépasser 100 caractères';
      }
      
      // Unicité
      const nomExists = existingItems.some(item => 
        item.nomService && 
        item.nomService.toLowerCase() === nom.toLowerCase() && 
        item.idService !== itemId
      );
      
      if (nomExists) {
        errors.nom = `Le nom "${nom}" existe déjà`;
      }
    }
    
    // Validation de la description
    if (formData.description && formData.description.length > 500) {
      warnings.push('La description est très longue (>500 caractères)');
    }
    
    return { errors, warnings };
  }
  
  // ===== VALIDATION UNITÉS =====
  
    static validateUniteFields(formData, existingItems, itemId) {
    const errors = {};
    const warnings = [];
    
    // ✅ VALIDATION DU CODE AVEC UNICITÉ
    if (formData.codeUnite) {
        const code = formData.codeUnite.trim().toUpperCase();
        
        // Longueur
        if (code.length > 10) {
        errors.code = 'Le code ne peut pas dépasser 10 caractères';
        }
        
        // Format (lettres, chiffres, tirets)
        if (!/^[A-Z0-9_-]+$/.test(code)) {
        errors.code = 'Le code ne peut contenir que des lettres, chiffres, tirets et underscores';
        }
        
        // ✅ UNICITÉ - Vérifier qu'aucune autre unité n'a le même code
        const codeExists = existingItems.some(item => 
        item.codeUnite && 
        item.codeUnite.toUpperCase() === code && 
        item.idUnite !== itemId
        );
        
        if (codeExists) {
        errors.code = `Le code "${code}" existe déjà`;
        }
    }
    
    // ✅ VALIDATION DU NOM AVEC UNICITÉ
    if (formData.nomUnite) {
        const nom = formData.nomUnite.trim();
        
        // Longueur
        if (nom.length > 50) {
        errors.nom = 'Le nom ne peut pas dépasser 50 caractères';
        }
        
        // ✅ UNICITÉ - Vérifier qu'aucune autre unité n'a le même nom
        const nomExists = existingItems.some(item => 
        item.nomUnite && 
        item.nomUnite.toLowerCase() === nom.toLowerCase() && 
        item.idUnite !== itemId
        );
        
        if (nomExists) {
        errors.nom = `Le nom "${nom}" existe déjà`;
        }
    }
    
    // Validation de la description
    if (formData.description && formData.description.length > 500) {
        warnings.push('La description est très longue (>500 caractères)');
    }
    
    return { errors, warnings };
    }
  
  // ===== VALIDATION TYPES DE TARIFS =====
  
  static validateTypeTarifFields(formData, existingItems, itemId) {
    const errors = {};
    const warnings = [];
    
    // ✅ AJOUT : Validation du code (comme pour services et unités)
    if (formData.code) {
      const code = formData.codeTypeTarif.trim().toUpperCase();
      
      // Longueur
      if (code.length > 20) {
        errors.code = 'Le code ne peut pas dépasser 20 caractères';
      }
      
      // Format (lettres, chiffres, tirets)
      if (!/^[A-Z0-9_-]+$/.test(code)) {
        errors.code = 'Le code ne peut contenir que des lettres, chiffres, tirets et underscores';
      }
      
      // ✅ UNICITÉ - Vérifier qu'aucun autre type de tarif n'a le même code
      const codeExists = existingItems.some(item => 
        item.codeTypeTarif && 
        item.codeTypeTarif.toUpperCase() === code && 
        item.idTypeTarif !== itemId
      );
      
      if (codeExists) {
        errors.code = `Le code "${code}" existe déjà`;
      }
    }
    
    // Validation du nom (existante)
    if (formData.nom) {
      const nom = formData.nomTypeTarif.trim();
      
      // Longueur
      if (nom.length > 100) {
        errors.nom = 'Le nom ne peut pas dépasser 100 caractères';
      }
      
      // Unicité
      const nomExists = existingItems.some(item => 
        item.nomTypeTarif && 
        item.nomTypeTarif.toLowerCase() === nom.toLowerCase() && 
        item.idTypeTarif !== itemId
      );
      
      if (nomExists) {
        errors.nom = `Le nom "${nom}" existe déjà`;
      }
    }
    
    // ✅ AJOUT : Validation de la description
    if (formData.description && formData.description.length > 500) {
      warnings.push('La description est très longue (>500 caractères)');
    }
    
    return { errors, warnings };
  }
  
  // ===== VALIDATION TARIFS =====
  
  static validateTarifFields(formData, existingItems, itemId) {
    const errors = {};
    const warnings = [];

    log.debug("validateTarifFields - formData : ", formData);
    
    // Validation du prix
    if (formData.prixTarifStandard !== undefined) {
      const prix = parseFloat(formData.prixTarifStandard);
      
      if (isNaN(prix)) {
        errors.prix = 'Le prix doit être un nombre valide';
      } else if (prix <= 0) {
        errors.prix = 'Le prix doit être positif';
      } else if (prix > 999999.99) {
        errors.prix = 'Le prix ne peut pas dépasser 999\'999.99';
      }
      
      // Avertissement pour prix très élevé
      if (prix > 10000) {
        warnings.push(`Prix élevé détecté: ${prix.toFixed(2)} CHF`);
      }
    }
    
    // Validation des dates
    if (formData.dateDebutTarifStandard) {
      const dateDebut = DateService.fromDisplayFormat(formData.dateDebutTarifStandard) || 
                    DateService.fromInputFormat(formData.dateDebutTarifStandard);
      if (dateDebut) {
        const aujourd = new Date();
        aujourd.setHours(0, 0, 0, 0);
        
        if (dateDebut > aujourd) {
          warnings.push('La date de début est dans le futur');
        }
      }
    }
    
    if (formData.dateFinTarifStandard && formData.dateDebutTarifStandard) {
      const dateDebut = DateService.fromDisplayFormat(formData.dateDebutTarifStandard) || 
                        DateService.fromInputFormat(formData.dateDebutTarifStandard);
      const dateFin = DateService.fromDisplayFormat(formData.dateFinTarifStandard) || 
                      DateService.fromInputFormat(formData.dateFinTarifStandard);
      
      if (dateDebut && dateFin && dateFin <= dateDebut) {
        errors.dateFin = 'La date de fin doit être postérieure à la date de début';
      }
    }
    
    return { errors, warnings };
  }
  
  // ===== VALIDATION TARIFS SPÉCIAUX =====
  
  static validateTarifSpecialFields(formData, existingItems, itemId) {
    const errors = {};
    const warnings = [];
    
    // Validation du prix
    if (formData.prixTarifSpecial !== undefined) {
      const prix = parseFloat(formData.prixTarifSpecial);
      
      if (isNaN(prix)) {
        errors.prix = 'Le prix doit être un nombre valide';
      } else if (prix <= 0) {
        errors.prix = 'Le prix doit être positif';
      } else if (prix > 999999.99) {
        errors.prix = 'Le prix ne peut pas dépasser 999\'999.99';
      }
      
      // Avertissement pour prix très élevé
      if (prix > 10000) {
        warnings.push(`Prix élevé détecté: ${prix.toFixed(2)} CHF`);
      }
    }
    
    // Validation des dates
    if (formData.dateDebutTarifSpecial) {
      const dateDebut = new Date(formData.dateDebutTarifSpeciald);
      const aujourd = new Date();
      aujourd.setHours(0, 0, 0, 0);
      
      if (dateDebut > aujourd) {
        warnings.push('La date de début est dans le futur');
      }
    }
    
    if (formData.dateFinTarifSpecial && formData.dateDebutTarifSpecial) {
      const dateDebut = new Date(formData.dateDebutTarifSpecial);
      const dateFin = new Date(formData.dateFinTarifSpecial);
      
      if (dateFin <= dateDebut) {
        errors.dateFin = 'La date de fin doit être postérieure à la date de début';
      }
    }
    
    // Validation de la note (obligatoire pour tarifs spéciaux)
    if (!formData.note || formData.note.trim() === '') {
      errors.note = 'La note est obligatoire pour un tarif spécial';
    } else if (formData.note.length > 1000) {
      errors.note = 'La note ne peut pas dépasser 1000 caractères';
    }
    
    return { errors, warnings };
  }
  
  // ===== VALIDATION RÈGLES MÉTIER =====
  
  static validateBusinessRules(formType, formData, existingItems, itemId) {
    const errors = {};
    const warnings = [];
    
    switch (formType) {
      case FORM_TYPES.SERVICE:
        return this.validateServiceBusinessRules(formData, existingItems, itemId);
      case FORM_TYPES.TARIF:
        return this.validateTarifBusinessRules(formData, existingItems, itemId);
      case FORM_TYPES.TARIF_SPECIAL:
        return this.validateTarifSpecialBusinessRules(formData, existingItems, itemId);
      default:
        return { errors, warnings };
    }
  }
  
  static validateServiceBusinessRules(formData, existingItems, itemId) {
    const errors = {};
    const warnings = [];
    
    // Règle métier: Un seul service par défaut
    if (formData.isDefault === true) {
      const autreServiceDefaut = existingItems.find(item => 
        item.isDefault === true && item.idService !== itemId
      );
      
      if (autreServiceDefaut) {
        warnings.push(`Le service "${autreServiceDefaut.nomService}" sera automatiquement désactivé comme service par défaut`);
      }
    }
    
    // Règle métier: Service inactif ne peut pas être par défaut
    if (formData.actif === false && formData.isDefault === true) {
      errors.isDefault = 'Un service inactif ne peut pas être défini comme service par défaut';
    }
    
    return { errors, warnings };
  }
  
  static validateTarifBusinessRules(formData, existingItems, itemId) {
    const errors = {};
    const warnings = [];
    
    // Règle métier: Pas de chevauchement de dates pour même service/unité/type
    if (formData.idService && formData.idUnite && formData.idTypeTarif) {
      const chevauchement = existingItems.find(tarif => {
        if (tarif.idTarifStandard === itemId) return false;
        
        return tarif.idService === formData.idService &&
               tarif.idUnite === formData.idUnite &&
               tarif.idTypeTarif === formData.idTypeTarif &&
               this.datesOverlap(
                 formData.dateDebutTarifStandard, formData.dateFinTarifStandard,
                 tarif.dateDebutTarifStandard, tarif.dateFinTarifStandard
               );
      });
      
      if (chevauchement) {
        errors.dateDebut = 'Un tarif existe déjà pour cette période';
      }
    }
    
    return { errors, warnings };
  }
  
  static validateTarifSpecialBusinessRules(formData, existingItems, itemId) {
    const errors = {};
    const warnings = [];
    
    // Règle métier: Pas de chevauchement pour même client/service/unité
    if (formData.clientId && formData.idService && formData.idUnite) {
      const chevauchement = existingItems.find(tarif => {
        if (tarif.idTarifSpecial === itemId) return false;
        
        return tarif.clientId === formData.clientId &&
               tarif.idService === formData.idService &&
               tarif.idUnite === formData.idUnite &&
               this.datesOverlap(
                 formData.dateDebutTarifSpecial, formData.dateFinTarifSpecial,
                 tarif.dateDebutTarifSpecial, tarif.dateFinTarifSpecial
               );
      });
      
      if (chevauchement) {
        errors.dateDebut = 'Un tarif spécial existe déjà pour ce client et cette période';
      }
    }
    
    return { errors, warnings };
  }
  
  // ===== UTILITAIRES =====
  
  /**
   * Vérifie si deux périodes se chevauchent
   */
  static datesOverlap(debut1, fin1, debut2, fin2) {
    const d1 = debut1 ? new Date(debut1) : new Date('1900-01-01');
    const f1 = fin1 ? new Date(fin1) : new Date('2100-12-31');
    const d2 = debut2 ? new Date(debut2) : new Date('1900-01-01');
    const f2 = fin2 ? new Date(fin2) : new Date('2100-12-31');
    
    return d1 <= f2 && d2 <= f1;
  }
  
  // ===== CONFIGURATION DE VALIDATION EN TEMPS RÉEL =====
  
  /**
   * Configure la validation en temps réel sur un formulaire
   */
  static setupFormValidation(container, formType, itemId = null, existingItems = []) {
      const form = container.querySelector('.modal-form');
      const statusDiv = container.querySelector('#validation-status');
      const submitButton = container.querySelector('[data-action="submit"]');

      if (!form) return;

      // Désactiver la validation HTML5 native
      form.setAttribute('novalidate', 'true');

      let validationErrors = {};

      log.debug(`🔧 Validation configurée pour ${formType} avec ${existingItems.length} éléments existants`);

      // const updateValidationStatus = () => {
      //     const errorCount = Object.keys(validationErrors).length;
          
      //     const requiredFields = this.getRequiredFields(formType);
      //     const missingFields = requiredFields.filter(fieldName => {
      //         const input = form.querySelector(`[name="${fieldName}"]`);
      //         return input && (!input.value || input.value.trim() === '');
      //     });

      //     if (errorCount === 0) {
      //       if (statusDiv) statusDiv.style.display = 'none';
      //       if (submitButton) {
      //           submitButton.disabled = missingFields.length > 0;
      //           submitButton.textContent = itemId ? 'Modifier' : 'Créer';
      //       }
      //     } else {
      //       if (statusDiv) {
      //           statusDiv.style.display = 'block';
      //           statusDiv.style.backgroundColor = '#f8d7da';
      //           statusDiv.style.color = '#721c24';
      //           statusDiv.style.border = '1px solid #f5c6cb';
      //           statusDiv.innerHTML = `
      //           <strong>⚠️ Erreurs de validation (${errorCount}) :</strong><br>
      //           ${Object.values(validationErrors).map(error => `• ${error}`).join('<br>')}
      //           `;
      //       }
            
      //       if (submitButton) {
      //           submitButton.disabled = true;
      //           submitButton.textContent = 'Corriger les erreurs';
      //       }
      // }
  // };

    // ✅ VALIDATION AVEC DONNÉES EXISTANTES (passées en paramètre)
    const validateFieldWithExistingData = (input) => {
        const fieldName = input.name;
        const fieldValue = input.value.trim();
        
        // Effacer l'erreur précédente
        delete validationErrors[fieldName];
        this.clearFieldValidationError(input);
        
        // Créer un objet formData partiel pour la validation
        const partialFormData = { [fieldName]: fieldValue };
        
        log.debug(`🔍 Validation ${fieldName} = "${fieldValue}" avec ${existingItems.length} éléments`);
        
        // Validation spécifique par champ AVEC les données existantes
        if (fieldValue) {
            const fieldValidation = this.validateSpecificFields(formType, partialFormData, existingItems, itemId);
            
            if (fieldValidation.errors[fieldName]) {
                log.debug(`❌ Erreur de validation: ${fieldValidation.errors[fieldName]}`);
                validationErrors[fieldName] = fieldValidation.errors[fieldName];
                this.displayFieldValidationError(input, fieldValidation.errors[fieldName]);
            } else {
                log.debug(`✅ Validation OK pour ${fieldName}`);
            }
        }
        
        // ✅ VÉRIFIER LES CHAMPS OBLIGATOIRES
        const requiredFields = this.getRequiredFields(formType);
        const missingFields = [];
        
        requiredFields.forEach(reqFieldName => {
            const reqInput = form.querySelector(`[name="${reqFieldName}"]`);
            if (reqInput && (!reqInput.value || reqInput.value.trim() === '')) {
                missingFields.push(reqFieldName);
            }
        });
        
        // ✅ LOGS DE DÉBOGAGE
        log.debug('🔍 Champs obligatoires:', requiredFields);
        log.debug('❌ Champs manquants:', missingFields);
        log.debug('⚠️ Erreurs validation:', validationErrors);
        log.debug('🔘 Bouton devrait être:', missingFields.length > 0 ? 'DÉSACTIVÉ' : 'ACTIVÉ');

        log.debug('🔘 submitButton existe?', submitButton);
        log.debug('🔘 submitButton.disabled avant:', submitButton?.disabled);

        // Mettre à jour le statut du bouton
        if (missingFields.length > 0 && submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Créer';
            log.debug('✅ Bouton DÉSACTIVÉ, disabled après:', submitButton.disabled);
        } else if (Object.keys(validationErrors).length === 0 && submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = itemId ? 'Modifier' : 'Créer';
            log.debug('✅ Bouton ACTIVÉ, disabled après:', submitButton.disabled);
        }
        
        // updateValidationStatus();
    };

    // Validation en temps réel
    const inputs = form.querySelectorAll('input[data-validation], select[data-validation], textarea[data-validation], input[name], select[name], textarea[name]');
    
    inputs.forEach(input => {
        // Validation lors du blur
        input.addEventListener('blur', () => validateFieldWithExistingData(input));
        
        // Effacer les erreurs lors de la saisie
        input.addEventListener('input', () => {
            this.clearFieldValidationError(input);
            // Re-valider après un délai pour les codes et noms
            if (input.name === 'code' || input.name === 'nom') {
                clearTimeout(input.validationTimeout);
                input.validationTimeout = setTimeout(() => validateFieldWithExistingData(input), 800);
            }
            validateFieldWithExistingData(input);  // ✅ Remplacez checkRequiredFields()
        });

        input.addEventListener('change', () => {
            validateFieldWithExistingData(input);  // ✅ Remplacez checkRequiredFields()
        });
    });

    // ✅ GESTION DYNAMIQUE DES UNITÉS SELON LE SERVICE (pour TARIF uniquement)
    if (formType === FORM_TYPES.TARIF) {
        const serviceSelect = form.querySelector('[name="idService"]');
        const uniteSelect = form.querySelector('[name="idUnite"]');
        
        if (serviceSelect && uniteSelect) {
            // Fonction pour mettre à jour les unités
            const updateUniteOptions = (serviceId) => {
                // Réinitialiser la sélection d'unité
                const currentUniteValue = uniteSelect.value;
                
                if (!serviceId) {
                    uniteSelect.disabled = true;
                    uniteSelect.innerHTML = '<option value="">Sélectionner d\'abord un service</option>';
                    validateFieldWithExistingData(uniteSelect);
                    return;
                }
                
                // Activer et remplir les unités
                uniteSelect.disabled = false;
                uniteSelect.innerHTML = '<option value="">Sélectionner...</option>';
                
                // Récupérer les unités depuis les données passées
                log.debug('🔍 updateUniteOptions appelé avec serviceId:', serviceId);
                log.debug('🔍 container.dataset.unites:', container.dataset.unites);
                const unitesData = JSON.parse(container.dataset.unites || '[]');
                log.debug('🔍 unitesData parsed:', unitesData.length, 'unités');
                // ✅ CORRECTION : Filtrer par servicesIds (many-to-many)
                const unitesFiltered = unitesData.filter(u => {
                    // Support ancien format (idService) et nouveau format (servicesIds)
                    if (u.servicesIds && Array.isArray(u.servicesIds)) {
                        return u.servicesIds.includes(parseInt(serviceId));
                    }
                    // Fallback sur l'ancien format
                    return u.idService == serviceId;
                });
                log.debug('🔍 Nombre d\'unités filtrées:', unitesFiltered.length);
                log.debug('🔍 Exemple unité:', unitesFiltered[0]);
                log.debug('🔍 Unités filtrées pour service', serviceId, ':', unitesFiltered.length, 'unités');
                
                unitesFiltered.forEach(u => {
                    const option = document.createElement('option');
                    option.value = u.id || u.idUnite;
                    option.textContent = u.nomUnite;
                    // Restaurer la sélection si c'était la même unité
                    if (itemId && (u.id == currentUniteValue || u.idUnite == currentUniteValue)) {
                        option.selected = true;
                    }
                    uniteSelect.appendChild(option);
                });
                
                // Si pas en mode édition ou si l'unité n'est plus valide, réinitialiser
                if (!itemId || !unitesFiltered.find(u => (u.id == currentUniteValue || u.idUnite == currentUniteValue))) {
                    uniteSelect.value = '';
                }
                
                validateFieldWithExistingData(uniteSelect);
            };
            
            // Initialisation au chargement
            const initialServiceId = serviceSelect.value;
            if (initialServiceId) {
                updateUniteOptions(initialServiceId);
            } else {
                uniteSelect.disabled = true;
                uniteSelect.innerHTML = '<option value="">Sélectionner d\'abord un service</option>';
            }
            
            // Événement sur changement de service
            serviceSelect.addEventListener('change', (e) => {
                updateUniteOptions(e.target.value);
            });
        }
    }

    // ✅ NOUVELLE FONCTION: Vérifier que tous les champs obligatoires sont remplis
    // const checkRequiredFields = () => {
    //     const requiredFields = this.getRequiredFields(formType);
    //     const missingFields = [];
        
    //     requiredFields.forEach(fieldName => {
    //         const input = form.querySelector(`[name="${fieldName}"]`);
    //         if (input && (!input.value || input.value.trim() === '')) {
    //             missingFields.push(fieldName);
    //         }
    //     });
        
    //     // Si des champs obligatoires sont vides, désactiver le bouton
    //     if (missingFields.length > 0 && submitButton) {
    //         submitButton.disabled = true;
    //         submitButton.textContent = itemId ? 'Modifier' : 'Créer';
    //     } else if (Object.keys(validationErrors).length === 0 && submitButton) {
    //         // Tous les champs sont remplis et pas d'erreurs
    //         submitButton.disabled = false;
    //         submitButton.textContent = itemId ? 'Modifier' : 'Créer';
    //     }
    // };

    // // ✅ Ajouter vérification des champs obligatoires aux événements
    // inputs.forEach(input => {
    //     input.addEventListener('input', () => {
    //         checkRequiredFields();
    //     });
        
    //     input.addEventListener('change', () => {
    //         checkRequiredFields();
    //     });
    // });

    // ✅ DÉSACTIVATION IMMÉDIATE du bouton en mode création
    // if (!itemId && submitButton) {
    //     submitButton.disabled = true;
    //     submitButton.textContent = 'Créer';
    // }

    // ✅ VALIDATION INITIALE: Vérifier les champs obligatoires au chargement
    setTimeout(() => {
        // Valider tous les champs au chargement
        inputs.forEach(input => {
            validateFieldWithExistingData(input);
        });
    }, 100);

    log.debug(`✅ Validation activée pour ${formType} avec contrôle d'unicité`);
    }

    // ✅ MÉTHODE UTILITAIRE pour obtenir le nom du tableau de données
    static getDataArrayName(formType) {
    const mapping = {
        'service': 'services',
        'unite': 'unites', 
        'type-tarif': 'typesTarifs',
        'tarif': 'tarifs',
        'tarif-special': 'tarifsSpeciaux'
    };
    return mapping[formType] || formType + 's';
    }
  
  // ===== GESTION VISUELLE DES ERREURS =====
  
  static displayFieldValidationError(input, errorMessage) {
    this.clearFieldValidationError(input);
    
    if (errorMessage) {
      input.classList.add('form-input-error');
      input.style.borderBottomColor = '#dc3545';
      
      const errorElement = document.createElement('span');
      errorElement.className = 'form-error-message';
      errorElement.style.cssText = `
        color: #dc3545;
        font-size: 12px;
        margin-top: 5px;
        display: block;
      `;
      errorElement.textContent = errorMessage;
      
      input.parentNode.appendChild(errorElement);
    }
  }
  
  static clearFieldValidationError(input) {
    input.classList.remove('form-input-error');
    input.style.borderBottomColor = '';
    const existingError = input.parentNode.querySelector('.form-error-message');
    if (existingError) {
      existingError.remove();
    }
  }
}