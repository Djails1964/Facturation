// services/TarifValidationService.js - Service centralisé pour la validation

import { FORM_TYPES } from '../../../constants/tarifConstants';

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
    console.log('🔍 Validation des données:', {
      formType,
      formData,
      existingItems,
      itemId
    });
    console.log('🔍 Validation des données - Champs obligatoires:', requiredFields);
    console.log('🔍 Validation des données - Labels des champs:', fieldLabels);

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
        return ['code', 'nomService'];
      case FORM_TYPES.UNITE:
        return ['code', 'nomUnite'];
      case FORM_TYPES.TYPE_TARIF:
        return ['code', 'nomTypeTarif'];
      case FORM_TYPES.TARIF:
        return ['idService', 'idUnite', 'typeTarifId', 'prix', 'dateDebut'];
      case FORM_TYPES.TARIF_SPECIAL:
        return ['clientId', 'idService', 'idUnite', 'prix', 'note'];
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
      typeTarifId: 'Type de tarif',
      clientId: 'Client',
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
    if (formData.code) {
      const code = formData.code.trim().toUpperCase();
      
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
        item.code && 
        item.code.toUpperCase() === code && 
        item.id !== itemId
      );
      
      if (codeExists) {
        errors.code = `Le code "${code}" existe déjà`;
      }
    }
    
    // Validation du nom
    if (formData.nomService) {
      const nomService = formData.nomService.trim();
      
      // Longueur
      if (nomService.length > 100) {
        errors.nomService = 'Le nom ne peut pas dépasser 100 caractères';
      }
      
      // Unicité
      const nomExists = existingItems.some(item => 
        item.nomService && 
        item.nomService.toLowerCase() === nomService.toLowerCase() && 
        item.id !== itemId
      );
      
      if (nomExists) {
        errors.nomService = `Le nom "${nomService}" existe déjà`;
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
    if (formData.code) {
        const code = formData.code.trim().toUpperCase();
        
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
        item.code && 
        item.code.toUpperCase() === code && 
        item.id !== itemId
        );
        
        if (codeExists) {
        errors.code = `Le code "${code}" existe déjà`;
        }
    }
    
    // ✅ VALIDATION DU NOM AVEC UNICITÉ
    if (formData.nomUnite) {
        const nomUnite = formData.nomUnite.trim();
        
        // Longueur
        if (nomUnite.length > 50) {
        errors.nomUnite = 'Le nom ne peut pas dépasser 50 caractères';
        }
        
        // ✅ UNICITÉ - Vérifier qu'aucune autre unité n'a le même nom
        const nomExists = existingItems.some(item => 
        item.nomUnite && 
        item.nomUnite.toLowerCase() === nomUnite.toLowerCase() && 
        item.id !== itemId
        );
        
        if (nomExists) {
        errors.nomUnite = `Le nom "${nomUnite}" existe déjà`;
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
      const code = formData.code.trim().toUpperCase();
      
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
        item.code && 
        item.code.toUpperCase() === code && 
        item.id !== itemId
      );
      
      if (codeExists) {
        errors.code = `Le code "${code}" existe déjà`;
      }
    }
    
    // Validation du nom (existante)
    if (formData.nom) {
      const nom = formData.nom.trim();
      
      // Longueur
      if (nom.length > 100) {
        errors.nom = 'Le nom ne peut pas dépasser 100 caractères';
      }
      
      // Unicité
      const nomExists = existingItems.some(item => 
        item.nom && 
        item.nom.toLowerCase() === nom.toLowerCase() && 
        item.id !== itemId
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
    
    // Validation du prix
    if (formData.prix !== undefined) {
      const prix = parseFloat(formData.prix);
      
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
    if (formData.date_debut) {
      const dateDebut = new Date(formData.date_debut);
      const aujourd = new Date();
      aujourd.setHours(0, 0, 0, 0);
      
      if (dateDebut > aujourd) {
        warnings.push('La date de début est dans le futur');
      }
    }
    
    if (formData.date_fin && formData.date_debut) {
      const dateDebut = new Date(formData.date_debut);
      const dateFin = new Date(formData.date_fin);
      
      if (dateFin <= dateDebut) {
        errors.date_fin = 'La date de fin doit être postérieure à la date de début';
      }
    }
    
    return { errors, warnings };
  }
  
  // ===== VALIDATION TARIFS SPÉCIAUX =====
  
  static validateTarifSpecialFields(formData, existingItems, itemId) {
    const errors = {};
    const warnings = [];
    
    // Validation du prix (même logique que tarifs standards)
    const tarifValidation = this.validateTarifFields(formData, existingItems, itemId);
    Object.assign(errors, tarifValidation.errors);
    warnings.push(...tarifValidation.warnings);
    
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
        item.isDefault === true && item.id !== itemId
      );
      
      if (autreServiceDefaut) {
        warnings.push(`Le service "${autreServiceDefaut.nom}" sera automatiquement désactivé comme service par défaut`);
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
    if (formData.idService && formData.idUnite && formData.typeTarifId) {
      const chevauchement = existingItems.find(tarif => {
        if (tarif.id === itemId) return false;
        
        return tarif.idService === formData.idService &&
               tarif.idUnite === formData.idUnite &&
               tarif.type_tarif_id === formData.typeTarifId &&
               this.datesOverlap(
                 formData.date_debut, formData.date_fin,
                 tarif.date_debut, tarif.date_fin
               );
      });
      
      if (chevauchement) {
        errors.date_debut = 'Un tarif existe déjà pour cette période';
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
        if (tarif.id === itemId) return false;
        
        return tarif.client_id === formData.clientId &&
               tarif.idService === formData.idService &&
               tarif.idUnite === formData.idUnite &&
               this.datesOverlap(
                 formData.date_debut, formData.date_fin,
                 tarif.date_debut, tarif.date_fin
               );
      });
      
      if (chevauchement) {
        errors.date_debut = 'Un tarif spécial existe déjà pour ce client et cette période';
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

        console.log(`🔧 Validation configurée pour ${formType} avec ${existingItems.length} éléments existants`);

        const updateValidationStatus = () => {
            const errorCount = Object.keys(validationErrors).length;
            
            if (errorCount === 0) {
            if (statusDiv) statusDiv.style.display = 'none';
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = itemId ? 'Modifier' : 'Créer';
            }
            } else {
            if (statusDiv) {
                statusDiv.style.display = 'block';
                statusDiv.style.backgroundColor = '#f8d7da';
                statusDiv.style.color = '#721c24';
                statusDiv.style.border = '1px solid #f5c6cb';
                statusDiv.innerHTML = `
                <strong>⚠️ Erreurs de validation (${errorCount}) :</strong><br>
                ${Object.values(validationErrors).map(error => `• ${error}`).join('<br>')}
                `;
            }
            
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = 'Corriger les erreurs';
            }
        }
    };

    // ✅ VALIDATION AVEC DONNÉES EXISTANTES (passées en paramètre)
    const validateFieldWithExistingData = (input) => {
        const fieldName = input.name;
        const fieldValue = input.value.trim();
        
        // Effacer l'erreur précédente
        delete validationErrors[fieldName];
        this.clearFieldValidationError(input);
        
        if (!fieldValue) {
        updateValidationStatus();
        return;
        }
        
        // Créer un objet formData partiel pour la validation
        const partialFormData = { [fieldName]: fieldValue };
        
        console.log(`🔍 Validation ${fieldName} = "${fieldValue}" avec ${existingItems.length} éléments`);
        
        // Validation spécifique par champ AVEC les données existantes passées en paramètre
        const fieldValidation = this.validateSpecificFields(formType, partialFormData, existingItems, itemId);
        
        if (fieldValidation.errors[fieldName]) {
        console.log(`❌ Erreur de validation: ${fieldValidation.errors[fieldName]}`);
        validationErrors[fieldName] = fieldValidation.errors[fieldName];
        this.displayFieldValidationError(input, fieldValidation.errors[fieldName]);
        } else {
        console.log(`✅ Validation OK pour ${fieldName}`);
        }
        
        updateValidationStatus();
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
        });
    });

    // Validation initiale si édition
    if (itemId) {
        setTimeout(() => {
        inputs.forEach(input => {
            if (input.value.trim()) {
            validateFieldWithExistingData(input);
            }
        });
        }, 100);
    }

    console.log(`✅ Validation activée pour ${formType} avec contrôle d'unicité`);
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