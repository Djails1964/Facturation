// hooks/useTarifModals.js - Logique des modales extraite - VERSION COMPLÈTE

import { useCallback } from 'react';
import { showCustom, showConfirm, showLoading, showError, MODAL_SIZES, MODAL_POSITIONS } from '../../../utils/modalSystem';
import { FORM_TYPES } from '../../../constants/tarifConstants';
import { TarifFormService } from '../services/TarifFormService';
import { TarifValidationService } from '../services/TarifValidationService';
import ModalComponents from '../../shared/ModalComponents';
import { createLogger } from '../../../utils/createLogger';
import { useNotifications } from '../../../services/NotificationService';
import DateService from '../../../utils/DateService';
import { useDateContext } from '../../../context/DateContext';

export const useTarifModals = ({ 
  gestionState, 
  setCreatedIds, 
  onTarifAction 
}) => {

  const log = createLogger("useTarifModals");
  const { showSuccess, showError: showErrorNotif, showWarning } = useNotifications();
  const { openDatePicker } = useDateContext();

  //  MÉTHODE UTILITAIRE pour récupérer les données existantes (DÉCLARÉE EN PREMIER)
  const getExistingItemsForValidation = useCallback((formType, gestionState) => {
    switch (formType) {
      case FORM_TYPES.SERVICE:
        return gestionState.services || [];
      case FORM_TYPES.UNITE:
        return gestionState.unites || [];
      case FORM_TYPES.TYPE_TARIF:
        return gestionState.typesTarifs || [];
      case FORM_TYPES.TARIF:
        return gestionState.tarifs || [];
      case FORM_TYPES.TARIF_SPECIAL:
        return gestionState.tarifsSpeciaux || [];
      default:
        return [];
    }
  }, []);

  // Fonction générique pour traiter les soumissions avec validation d'unicité
  const processFormSubmission = useCallback(async (formType, formData, isEdit = false, itemId = null) => {
    try {
      log.debug(` Début ${isEdit ? 'modification' : 'création'} ${formType}:`, formData);
      
      //  Pour les services inactifs : fusionner avec les données originales
      let finalFormData = { ...formData };
      let wasInactive = false;
      
      if (formType === FORM_TYPES.SERVICE && isEdit && itemId) {
        const originalService = gestionState.services?.find(s => s.idService === itemId);
        wasInactive = originalService && (originalService.actif === false || originalService.actif === 0);
        
        if (wasInactive) {
          // Fusionner : garder les données originales, mais utiliser le nouveau statut actif
          finalFormData = {
            codeService: originalService.codeService,
            nomService: originalService.nomService,
            descriptionService: originalService.descriptionService || '',
            isDefault: originalService.isDefault,
            actif: formData.actif // Seul ce champ vient du formulaire
          };
          log.debug(' Service inactif - Fusion des données:', {
            original: originalService,
            formData: formData,
            merged: finalFormData
          });
        }
      }

      //  VALIDATION FINALE CÃ”TÉ CLIENT avec données existantes
      const existingItems = getExistingItemsForValidation(formType, gestionState);
      
      log.debug(' Éléments existants pour validation:', existingItems);
      log.debug(' Données du formulaire pour validation:', formData);
      log.debug(' ID de l\'élément pour validation:', itemId);
      
      const validationResult = TarifValidationService.validateFormData(formType, finalFormData, existingItems, itemId);

      log.debug(' Résultat de la validation:', validationResult);

      if (!validationResult.isValid) {
        const errorMessages = Object.values(validationResult.errors);
        throw new Error(`Erreurs de validation:\n ${errorMessages.join('\n ')}`);
      }
      
      //  VÉRIFICATION SPÉCIFIQUE D'UNICITÉ POUR LES CODES
      if ((formType === FORM_TYPES.SERVICE || formType === FORM_TYPES.UNITE) && finalFormData.code) {
        const codeExists = existingItems.find(item => 
          item.code && 
          item.code.toUpperCase() === finalFormData.code.toUpperCase() && 
          item.id !== itemId
        );
        
        if (codeExists) {
          const typeLabel = TarifFormService.getFormTypeDisplayName(formType).toLowerCase();
          throw new Error(`Le code "${finalFormData.code}" existe déjÃ  pour un autre ${typeLabel} (${codeExists.nom})`);
        }
      }
      
      //  VÉRIFICATION SPÉCIFIQUE D'UNICITÉ POUR LES NOMS
      if (finalFormData.nom) {
        const nomExists = existingItems.find(item => 
          item.nom && 
          item.nom.toLowerCase() === finalFormData.nom.toLowerCase() && 
          item.id !== itemId
        );
        
        if (nomExists) {
          const typeLabel = TarifFormService.getFormTypeDisplayName(formType).toLowerCase();
          throw new Error(`Le nom "${finalFormData.nom}" existe déjÃ  pour un autre ${typeLabel} (${nomExists.code || nomExists.id})`);
        }
      }
      
      log.debug(` Validation réussie, soumission ${formType}`);
      
      // Afficher modal de chargement
      const result = await showLoading(
        {
          title: isEdit ? 'Modification en cours...' : 'Création en cours...',
          content: ModalComponents.createLoadingContent(
            isEdit ? 'Mise Ã  jour des données...' : 'Enregistrement des données...'
          ),
          size: MODAL_SIZES.SMALL
        },
        async () => {
          return await TarifFormService.submitForm(formType, finalFormData, isEdit, itemId, gestionState.tarifActions);
        }
      );
      
      if (result && result.success) {
        log.debug(` Succès ${formType}:`, result);
        
        // Mise Ã  jour des données locales
        await TarifFormService.refreshDataAfterSave(formType, gestionState, false);
        
        // Mise Ã  jour des IDs créés pour highlighting
        if (!isEdit) {
          setCreatedIds(prev => ({
            ...prev,
            [TarifFormService.getCreatedIdKey(formType)]: result.item?.id || result.data?.id || result.id
          }));
        }
        
        // Message de succès
        const actionText = isEdit ? 'modifié' : 'créé';
        const itemForDisplay = {
          ...finalFormData,
          ...(result.item || result.data || {}),
          id: result.item?.id || result.data?.id || result.id
        };
        
        const itemName = TarifFormService.getItemDisplayName(formType, itemForDisplay);
        const typeDisplayName = TarifFormService.getFormTypeDisplayName(formType);
        
        showSuccess(`${typeDisplayName} "${itemName}" ${actionText} avec succès`);
        
        // Callback d'intégration
        if (onTarifAction) {
          const eventType = `${formType}-${isEdit ? 'updated' : 'created'}`;
          onTarifAction(eventType, { 
            item: itemForDisplay,
            formType,
            context: formType.includes('tarif') ? 'tarif' : 'config'
          });
        }
        
        return true;
      } else {
        const errorMessage = result?.message || 'Erreur inconnue du serveur';
        await showError(`Erreur lors de la ${isEdit ? 'modification' : 'création'} : ${errorMessage}`, 'Erreur serveur');
        showErrorNotif(errorMessage);
        return false;
      }
      
    } catch (error) {
      log.error(` Erreur critique ${formType}:`, error);
      await showError(`Erreur : ${error.message}`, `Erreur ${isEdit ? 'modification' : 'création'} ${formType}`);
      showErrorNotif(error.message || 'Erreur lors de la sauvegarde');
      return false;
    }
  }, [gestionState, setCreatedIds, onTarifAction, getExistingItemsForValidation, showSuccess, showErrorNotif]);

  const prepareFormData = useCallback(async (formType, itemData = null) => {
    // 1. TOUJOURS recharger les donnees pour les tarifs
    // Car les donnees peuvent avoir change dans d'autres onglets
    let freshServices = gestionState.services || [];
    let freshUnites = gestionState.unites || [];
    let freshTypesTarifs = gestionState.typesTarifs || [];
    let freshClients = gestionState.clients || [];
    let freshServicesUnites = gestionState.servicesUnites || {};
    
    if (formType === FORM_TYPES.TARIF || formType === FORM_TYPES.TARIF_SPECIAL) {
      log.debug('Rechargement FORCE des donnees dependantes pour formulaire tarif...');
      
      try {
        // CRITIQUE: Vider le cache AVANT de charger pour obtenir les donnees fraiches
        if (gestionState.tarifActions?.clearCache) {
          log.debug('Vidage du cache avant rechargement...');
          gestionState.tarifActions.clearCache();
        }
        
        // IMPORTANT: Utiliser directement tarifActions.charger pour obtenir les donnees fraiches
        // Car gestionState.xxx n'est pas mis a jour de facon synchrone
        const [servicesData, unitesData, typesTarifsData, servicesUnitesData] = await Promise.all([
          gestionState.tarifActions?.charger('service'),
          gestionState.tarifActions?.charger('unite'),
          gestionState.tarifActions?.charger('typeTarif'),
          gestionState.tarifActions?.chargerServicesUnites()
        ]);
        
        freshServices = servicesData || [];
        freshUnites = unitesData || [];
        freshTypesTarifs = typesTarifsData || [];
        
        // Transformer servicesUnitesData en map
        if (Array.isArray(servicesUnitesData)) {
          freshServicesUnites = {};
          servicesUnitesData.forEach(relation => {
            if (!freshServicesUnites[relation.idService]) {
              freshServicesUnites[relation.idService] = [];
            }
            freshServicesUnites[relation.idService].push({
              idService: relation.idService,
              idUnite: relation.idUnite
            });
          });
        }
        
        // Mettre a jour le state en parallele (pour les autres composants)
        gestionState.setServices?.(freshServices);
        gestionState.setUnites?.(freshUnites);
        gestionState.setTypesTarifs?.(freshTypesTarifs);
        gestionState.setServicesUnites?.(freshServicesUnites);
        
        // Pour les tarifs speciaux, charger aussi les clients
        if (formType === FORM_TYPES.TARIF_SPECIAL) {
          // Utiliser loadClients du gestionState (qui utilise useClientActions)
          await gestionState.loadClients?.();
          freshClients = gestionState.clients || [];
        }
        
        log.debug('Donnees FRAICHES chargees - Services:', freshServices.length, 
                  'Unites:', freshUnites.length, 
                  'TypesTarifs:', freshTypesTarifs.length);
      } catch (error) {
        log.error('Erreur rechargement donnees:', error);
        // Fallback sur les donnees du state
      }
    }
    
    // 2. Enrichir les unites avec leurs idServices (many-to-many)
    let unitesEnrichies = freshUnites;
    let servicesUnitesMap = {};
    
    if (formType === FORM_TYPES.TARIF || formType === FORM_TYPES.TARIF_SPECIAL) {
      log.debug('DEBUG enrichissement - servicesUnites:', freshServicesUnites);
      
      // Creer une map uniteId -> [idServices]
      const uniteToServicesMap = new Map();
      
      Object.entries(freshServicesUnites || {}).forEach(([idService, unites]) => {
        if (Array.isArray(unites)) {
          unites.forEach(unite => {
            const uniteId = unite.id || unite.idUnite;
            if (!uniteToServicesMap.has(uniteId)) {
              uniteToServicesMap.set(uniteId, []);
            }
            uniteToServicesMap.get(uniteId).push(parseInt(idService));
          });
        }
      });
      
      log.debug('DEBUG enrichissement - uniteToServicesMap:', Object.fromEntries(uniteToServicesMap));
      
      // Enrichir avec TOUS les services associes
      unitesEnrichies = freshUnites.map(unite => {
        const uniteId = unite.id || unite.idUnite;
        const servicesIds = uniteToServicesMap.get(uniteId) || [];
        
        return {
          ...unite,
          servicesIds: servicesIds
        };
      });
      
      servicesUnitesMap = Object.fromEntries(uniteToServicesMap);
      
      log.debug('Unites enrichies:', unitesEnrichies.filter(u => u.servicesIds.length > 0).length, '/', unitesEnrichies.length);
    }
    
    // 3. Preparer les donnees additionnelles
    const additionalData = {
      services: freshServices,
      unites: unitesEnrichies,
      typesTarifs: freshTypesTarifs,
      clients: freshClients,
      servicesUnitesMap: servicesUnitesMap
    };
        
    return {
      additionalData
    };
  }, [gestionState, log]);

  // Handler générique pour création
  const handleCreateItem = useCallback(async (formType, anchorRef = null) => {
    try {

      const { additionalData } = await prepareFormData(formType, null);
      //  S'ASSURER QUE LES DONNÉES SONT CHARGÉES avant d'ouvrir le formulaire
      // if (formType === FORM_TYPES.TARIF || formType === FORM_TYPES.TARIF_SPECIAL) {
      //   log.debug(' Vérification du chargement des données...');
        
      //   // Charger les données si nécessaire
      //   if (!gestionState.services || gestionState.services.length === 0) {
      //     log.debug(' ï¸ Services non chargés, chargement en cours...');
      //     await gestionState.loadServices?.();
      //   }
        
      //   if (!gestionState.unites || gestionState.unites.length === 0) {
      //     log.debug(' ï¸ Unités non chargées, chargement en cours...');
      //     await gestionState.loadUnites?.();
      //   }
        
      //   if (!gestionState.typesTarifs || gestionState.typesTarifs.length === 0) {
      //     log.debug(' ï¸ Types tarifs non chargés, chargement en cours...');
      //     await gestionState.loadTypesTarifs?.();
      //   }
        
      //   if (formType === FORM_TYPES.TARIF_SPECIAL && (!gestionState.clients || gestionState.clients.length === 0)) {
      //     log.debug(' ï¸ Clients non chargés, chargement en cours...');
      //     await gestionState.loadClients?.();
      //   }

      //   // Charger les liaisons service-unité si nécessaire
      //   if ((formType === FORM_TYPES.TARIF || formType === FORM_TYPES.TARIF_SPECIAL) && 
      //       (!gestionState.servicesUnites || gestionState.servicesUnites.length === 0)) {
      //       log.debug(' ï¸ Service-Unités non chargés, chargement en cours...');
      //       await gestionState.loadAllServicesUnites?.();
      //   }
      // }
      
      // //  DEBUG : Vérifier les données disponibles APRÈS chargement
      // log.debug(` Debug création ${formType} APRÈS chargement:`, {
      //   services: gestionState.services?.length || 0,
      //   unites: gestionState.unites?.length || 0,
      //   typesTarifs: gestionState.typesTarifs?.length || 0,
      //   clients: gestionState.clients?.length || 0,
      //   servicesType: typeof gestionState.services,
      //   servicesIsArray: Array.isArray(gestionState.services),
      //   servicesUnites: gestionState.servicesUnites,
      //   servicesUnitesType: typeof gestionState.servicesUnites,
      //   servicesUnitesKeys: Object.keys(gestionState.servicesUnites || {})
      // });
      
      // let servicesUnitesArray = [];
      // if (formType === FORM_TYPES.TARIF || formType === FORM_TYPES.TARIF_SPECIAL) {
      //     // serviceUnites est un objet { idService: [unites] }
      //     // Il faut le transformer en tableau plat
      //     if (gestionState.servicesUnites && typeof gestionState.servicesUnites === 'object') {
      //         servicesUnitesArray = Object.entries(gestionState.servicesUnites).flatMap(([idService, unites]) => 
      //             unites.map(unite => ({
      //                 idService: parseInt(idService),
      //                 idUnite: unite.id || unite.idUnite
      //             }))
      //         );
      //     }
      //     log.debug(' ServiceUnites transformés:', servicesUnitesArray.length);
      //     log.debug('ServicesUnites transformés array:' , servicesUnitesArray);
      // }

      // // Enrichir les unités
      // const unitesEnrichies = (gestionState.unites || []).map(unite => {
      //     const liaison = servicesUnitesArray.find(su => su.idUnite === (unite.id || unite.idUnite));
      //     return {
      //         ...unite,
      //         idService: liaison?.idService || null
      //     };
      // });

      // log.debug(' Unités enrichies:', unitesEnrichies.filter(u => u.idService !== null).length, '/', unitesEnrichies.length);
      // log.debug(' Unités enrichies:', unitesEnrichies);

      // // Préparer les données additionnelles
      // const additionalData = {
      //     services: Array.isArray(gestionState.services) ? gestionState.services : [],
      //     unites: unitesEnrichies,  //  Unités enrichies
      //     typesTarifs: Array.isArray(gestionState.typesTarifs) ? gestionState.typesTarifs : [],
      //     clients: Array.isArray(gestionState.clients) ? gestionState.clients : []
      // };

      // //  VÉRIFICATION FINALE - Alerter si des données sont manquantes
      // if (formType === FORM_TYPES.TARIF || formType === FORM_TYPES.TARIF_SPECIAL) {
      //   const missingData = [];
      //   if (additionalData.services.length === 0) missingData.push('services');
      //   if (additionalData.unites.length === 0) missingData.push('unités');
      //   if (additionalData.typesTarifs.length === 0) missingData.push('types de tarifs');
      //   if (formType === FORM_TYPES.TARIF_SPECIAL && additionalData.clients.length === 0) missingData.push('clients');
        
      //   if (missingData.length > 0) {
      //     log.warn(` ï¸ Données manquantes pour ${formType}:`, missingData);
      //     showWarning(`Attention: Certaines données ne sont pas disponibles (${missingData.join(', ')})`);
      //   }
      // }
      
      // log.debug(` Données additionnelles préparées:`, {
      //   servicesCount: additionalData.services.length,
      //   unitesCount: additionalData.unites.length,
      //   typesTarifsCount: additionalData.typesTarifs.length,
      //   clientsCount: additionalData.clients.length,
      // });

      const result = await showCustom({
        title: TarifFormService.getCreateTitle(formType),
        content: TarifFormService.createFormContent(formType, {}, false, additionalData),
        size: MODAL_SIZES.LARGE,
        position: MODAL_POSITIONS.SMART,
        anchorRef: anchorRef,
        buttons: ModalComponents.createModalButtons({
          cancelText: 'Annuler',
          submitText: 'Créer',
          submitClass: 'primary'
        }),
        onMount: (container) => {
          // Passer les unités pour le filtrage dynamique
          container.dataset.unites = JSON.stringify(additionalData.unites || []);
          
          const existingItems = getExistingItemsForValidation(formType, gestionState);
          log.debug(` Données existantes pour validation ${formType}:`, existingItems.length);
          TarifValidationService.setupFormValidation(container, formType, null, existingItems);

          // Initialiser le handler du DatePicker
          // const datePickerHandler = new DatePickerModalHandler({
          //   showCustom: showCustom,
          //   showError: showErrorNotif,
          //   showLoading: showLoading
          // });

          //  NOUVEAU : Gestion des dates via DateContext
          const dateIcons = container.querySelectorAll('[data-date-trigger]');
          log.debug(` Initialisation de ${dateIcons.length} champs date`);
          
          dateIcons.forEach(icon => {
              icon.addEventListener('click', (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  const inputId = icon.getAttribute('data-date-trigger');
                  const input = container.querySelector(`#${inputId}`);
                  
                  if (!input) {
                      log.warn(` ï¸ Champ ${inputId} introuvable`);
                      return;
                  }
                  
                  // Récupérer la configuration
                  let config = {};
                  try {
                      const configAttr = input.getAttribute('data-date-config');
                      if (configAttr) config = JSON.parse(configAttr);
                  } catch (err) {
                      log.warn(' ï¸ Erreur parsing config:', err);
                  }
                  
                  // Parser la date actuelle
                  const currentValue = input.value;
                  let initialDates = [];
                  if (currentValue) {
                      const parsedDate = DateService.fromDisplayFormat(currentValue) || 
                                      DateService.fromInputFormat(currentValue);
                      if (parsedDate) initialDates = [parsedDate];
                  }
                  
                  // Configuration du DatePicker
                  const datePickerConfig = {
                      title: 'Sélectionner une date',
                      multiSelect: false,
                      minDate: config.minDate ? new Date(config.minDate) : null,
                      maxDate: config.maxDate ? new Date(config.maxDate) : null,
                      confirmText: 'Confirmer'
                  };
                  
                  // Callback quand l'utilisateur sélectionne
                  const callback = (dates) => {
                      if (dates && dates.length > 0) {
                          const dateString = DateService.formatSingleDate(dates[0], 'date');
                          log.debug(` Date sélectionnée: ${dateString}`);
                          
                          input.value = dateString;
                          input.dispatchEvent(new Event('change', { bubbles: true }));
                          input.dispatchEvent(new Event('input', { bubbles: true }));
                      }
                  };
                  
                  //  Ouvrir le DatePicker via DateContext
                  openDatePicker(datePickerConfig, callback, initialDates);
              });
          });          
        }
      });
      
      if (result.action === 'submit') {
        const formData = result.data;
        
        if (!formData || Object.keys(formData).length === 0) {
          showErrorNotif('Aucune donnée reçue du formulaire');
          return false;
        }
        
        return await processFormSubmission(formType, formData, false);
      }
      
      return false;
      
    } catch (error) {
      log.error(` Erreur création ${formType}:`, error);
      showErrorNotif(error.message || 'Erreur lors de la création');
      return false;
    }
  }, [prepareFormData, processFormSubmission, gestionState, getExistingItemsForValidation, showWarning, showErrorNotif]);

  // Handler générique pour édition
  const handleEditItem = useCallback(async (formType, itemId, anchorRef = null) => {
    try {
      // 1. Récupérer les données brutes
      const itemData = TarifFormService.getItemData(formType, itemId, gestionState);
      log.debug('handleEditItem - getItemData - données retournées : ', itemData);
    
      //  2. Utiliser la fonction commune pour préparer TOUT
      const { additionalData } = await prepareFormData(formType, itemData);
      //  S'ASSURER QUE LES DONNÉES SONT CHARGÉES avant d'ouvrir le formulaire
      // if (formType === FORM_TYPES.TARIF || formType === FORM_TYPES.TARIF_SPECIAL) {
      //   if (!gestionState.services || gestionState.services.length === 0) {
      //     await gestionState.loadServices?.();
      //   }
      //   if (!gestionState.unites || gestionState.unites.length === 0) {
      //     await gestionState.loadUnites?.();
      //   }
      //   if (!gestionState.typesTarifs || gestionState.typesTarifs.length === 0) {
      //     await gestionState.loadTypesTarifs?.();
      //   }
      //   if (formType === FORM_TYPES.TARIF_SPECIAL && (!gestionState.clients || gestionState.clients.length === 0)) {
      //     await gestionState.loadClients?.();
      //   }
      // }
      
      // const itemData = TarifFormService.getItemData(formType, itemId, gestionState);
      
      // //  PRÉPARER LES DONNÉES ADDITIONNELLES de manière sécurisée
      // const additionalData = {
      //   services: Array.isArray(gestionState.services) ? gestionState.services : [],
      //   unites: Array.isArray(gestionState.unites) ? gestionState.unites : [],
      //   typesTarifs: Array.isArray(gestionState.typesTarifs) ? gestionState.typesTarifs : [],
      //   clients: Array.isArray(gestionState.clients) ? gestionState.clients : []
      // };
      
      const result = await showCustom({
        title: TarifFormService.getEditTitle(formType),
        content: TarifFormService.createFormContent(formType, itemData, true, additionalData),
        size: MODAL_SIZES.LARGE,
        position: MODAL_POSITIONS.SMART,
        anchorRef: anchorRef,
        buttons: ModalComponents.createModalButtons({
          cancelText: 'Annuler',
          submitText: 'Modifier',
          submitClass: 'primary'
        }),
        onMount: (container) => {
          container.dataset.unites = JSON.stringify(additionalData.unites || []);

          const existingItems = getExistingItemsForValidation(formType, gestionState);
          log.debug(` 
             ${formType}:`, existingItems);
          TarifValidationService.setupFormValidation(container, formType, itemId, existingItems);

          // Initialiser le handler du DatePicker
          // const datePickerHandler = new DatePickerModalHandler({
          //   showCustom: showCustom,
          //   showError: showErrorNotif,
          //   showLoading: showLoading
          // });
          
          //  NOUVEAU : Gestion des dates via DateContext
          const dateIcons = container.querySelectorAll('[data-date-trigger]');
          log.debug(` Initialisation de ${dateIcons.length} champs date`);
          
          dateIcons.forEach(icon => {
              icon.addEventListener('click', (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  const inputId = icon.getAttribute('data-date-trigger');
                  const input = container.querySelector(`#${inputId}`);
                  
                  if (!input) {
                      log.warn(` ï¸ Champ ${inputId} introuvable`);
                      return;
                  }
                  
                  // Récupérer la configuration
                  let config = {};
                  try {
                      const configAttr = input.getAttribute('data-date-config');
                      if (configAttr) config = JSON.parse(configAttr);
                  } catch (err) {
                      log.warn(' ï¸ Erreur parsing config:', err);
                  }
                  
                  // Parser la date actuelle
                  const currentValue = input.value;
                  let initialDates = [];
                  if (currentValue) {
                      const parsedDate = DateService.fromDisplayFormat(currentValue) || 
                                      DateService.fromInputFormat(currentValue);
                      if (parsedDate) initialDates = [parsedDate];
                  }
                  
                  // Configuration du DatePicker
                  const datePickerConfig = {
                      title: 'Sélectionner une date',
                      multiSelect: false,
                      minDate: config.minDate ? new Date(config.minDate) : null,
                      maxDate: config.maxDate ? new Date(config.maxDate) : null,
                      confirmText: 'Confirmer'
                  };
                  
                  // Callback quand l'utilisateur sélectionne
                  const callback = (dates) => {
                      if (dates && dates.length > 0) {
                          const dateString = DateService.formatSingleDate(dates[0], 'date');
                          log.debug(` Date sélectionnée: ${dateString}`);
                          
                          input.value = dateString;
                          input.dispatchEvent(new Event('change', { bubbles: true }));
                          input.dispatchEvent(new Event('input', { bubbles: true }));
                      }
                  };
                  
                  //  Ouvrir le DatePicker via DateContext
                  openDatePicker(datePickerConfig, callback, initialDates);
              });
          });
        }
      });
      
      if (result.action === 'submit') {
        const formData = result.data;
        
        if (!formData || Object.keys(formData).length === 0) {
          showErrorNotif('Aucune donnée reçue du formulaire');
          return false;
        }
        
        return await processFormSubmission(formType, formData, true, itemId);
      }
      
      return false;
      
    } catch (error) {
      log.error(` Erreur modification ${formType}:`, error);
      showErrorNotif(error.message || 'Erreur lors de la modification');
      return false;
    }
  }, [prepareFormData, processFormSubmission, gestionState, getExistingItemsForValidation, showErrorNotif]);

/**
   * RÈGLES MÉTIER:
   * 1. Service: Ne peut pas être supprimé s'il est référencé dans une facture
   * 2. Unité: Ne peut pas être supprimée si:
   *    - Elle est référencée dans une facture
   *    - Elle est associée à un service
   * 3. TypeTarif: Ne peut pas être supprimé si des tarifs lui sont liés
   * 4. Tarif/TarifSpecial: Ne peut pas être supprimé si utilisé dans une ligne de facture
   */
  
  const handleDeleteItem = useCallback(async (formType, itemId, itemName, anchorRef = null) => {
    try {
      const typeLabel = TarifFormService.getFormTypeDisplayName(formType).toLowerCase();
      
      log.debug(` Tentative de suppression ${formType}:`, { itemId, itemName });
      
      // Les tarifs peuvent etre supprimes s'ils ne sont pas utilises dans des factures
      //  VÉRIFICATION: Appeler l'API pour vérifier les contraintes métier
      log.debug(` Vérification des contraintes métier...`);
      
      let usageCheck;
      try {
        usageCheck = await showLoading(
          {
            title: 'Vérification en cours...',
            content: ModalComponents.createLoadingContent(`Vérification des contraintes...`),
            size: MODAL_SIZES.SMALL
          },
          async () => {
            return await TarifFormService.checkItemUsage(formType, itemId, gestionState.tarifActions);
          }
        );
        
        log.debug(` Résultat de la vérification:`, usageCheck);
        
      } catch (checkError) {
        log.error(` Erreur lors de la vérification:`, checkError);
        await showError(
          `Impossible de vérifier les contraintes.\n\nLa suppression peut échouer.`,
          'Vérification impossible'
        );
        return false;
      }
      
      //  APPLIQUER LES RÈGLES MÉTIER
      let canDelete = true;
      let errorMessage = '';
      
      if (usageCheck && usageCheck.used === true) {
        canDelete = false;

        // Construire le message d'erreur avec le nombre de lignes de facture
        const count = usageCheck.count || 0;
        
        // Construire le message d'erreur spécifique au type
        switch (formType) {
          case FORM_TYPES.SERVICE:
            errorMessage = count > 0
              ? `Ce service ne peut pas être supprimé car il est utilisé dans ${count} ligne(s) de facture.`
              : `Ce service ne peut pas être supprimé car il est utilisé.`;
            break;
            
          case FORM_TYPES.UNITE:
            errorMessage = count > 0
              ? `Cette unité ne peut pas être supprimée car elle est utilisée dans ${count} ligne(s) de facture.`
              : `Cette unité ne peut pas être supprimée car elle est associée à un ou plusieurs services.`;
            break;
            
          case FORM_TYPES.TYPE_TARIF:
            errorMessage = count > 0
              ? `Ce type de tarif ne peut pas être supprimé car il est utilisé dans ${count} tarif(s).`
              : `Ce type de tarif ne peut pas être supprimé car il est utilisé.`;
            break;
          
          case FORM_TYPES.TARIF:
            errorMessage = count > 0
              ? `Ce tarif ne peut pas être supprimé car il est utilisé dans ${count} ligne(s) de facture.`
              : `Ce tarif ne peut pas être supprimé car il est utilisé.`;
            break;
            
          case FORM_TYPES.TARIF_SPECIAL:
            errorMessage = count > 0
              ? `Ce tarif special ne peut pas être supprimé car il est utilisé dans ${count} ligne(s) de facture.`
              : `Ce tarif special ne peut pas être supprimé car il est utilisé.`;
            break;
            
          default:
            errorMessage = `Cet élément ne peut pas être supprimé (contrainte métier).`;
        }
      }
      
      //  Si contrainte métier détectée, bloquer
      if (!canDelete) {
        log.debug(` Suppression bloquée - contrainte métier`);
        await showError(errorMessage, 'Suppression impossible');
        return false;
      }
      
      log.debug(` Aucune contrainte métier - affichage de la confirmation`);
      
      //  ÉTAPE 2: Demander confirmation à l'utilisateur
      const confirmationResult = await showConfirm({
        title: `Supprimer ${typeLabel}`,
        message: `Êtes-vous sûr de vouloir supprimer ce ${typeLabel} ?\n\n"${itemName || 'Élément'}"\n\n⚠️ Cette action est irréversible.`,
        confirmText: 'Supprimer définitivement',
        cancelText: 'Annuler',
        type: 'danger',
        anchorRef: anchorRef,
        position: MODAL_POSITIONS.SMART
      });
      
      if (confirmationResult.action === 'confirm') {
        log.debug(` Suppression confirmée par l'utilisateur pour ${formType}:`, itemId);
        
        // Exécuter la suppression
        const result = await showLoading(
          {
            title: 'Suppression en cours...',
            content: ModalComponents.createLoadingContent(`Suppression du ${typeLabel}...`),
            size: MODAL_SIZES.SMALL
          },
          async () => {
            return await TarifFormService.deleteItem(formType, itemId, gestionState.tarifActions);
          }
        );
        
        if (result && result.success) {
          log.debug(` ${typeLabel} supprimé avec succès`);
          
          // Rafraîchir les données
          await TarifFormService.refreshDataAfterSave(formType, gestionState, true);
          
          // Notification succès
          showSuccess(`${TarifFormService.getFormTypeDisplayName(formType)} "${itemName}" supprimé avec succès`);
          
          // Callback pour intégrations
          if (onTarifAction) {
            onTarifAction(`${formType}-deleted`, { 
              item: { id: itemId, name: itemName },
              formType,
              context: formType.includes('tarif') ? 'tarif' : 'config'
            });
          }
          
          return true;
        } else {
          // Erreur lors de la suppression
          const errorMsg = result?.message || 'Erreur lors de la suppression';
          log.error(` Erreur suppression ${formType}:`, errorMsg);
          await showError(`Erreur lors de la suppression : ${errorMsg}`, 'Erreur suppression');
          showErrorNotif(errorMsg);
          return false;
        }
      } else {
        log.debug(` Suppression annulée par l'utilisateur`);
        return false;
      }
      
    } catch (error) {
      log.error(` Erreur critique suppression ${formType}:`, error);
      await showError(`Erreur critique : ${error.message}`, `Erreur suppression ${formType}`);
      showErrorNotif(error.message || 'Erreur lors de la suppression');
      return false;
    }
  }, [gestionState, onTarifAction, showSuccess, showErrorNotif]);

  /**
   *  NOUVELLE FONCTIONNALITÉ: Gestion de la dissociation d'une unité d'un service
   * 
   * RÈGLES MÉTIER:
   * - Une unité ne peut pas être dissociée si elle est utilisée dans des factures
   * - Affiche un message d'erreur si l'unité est utilisée
   * - Demande confirmation si la dissociation est possible
   */
  const handleUnlinkServiceUnite = useCallback(async (idService, idUnite, uniteName, anchorRef = null) => {
    try {
      log.debug(' Tentative de dissociation unité:', { idService, idUnite, uniteName });
      
      //  ÉTAPE 1: Vérifier si l'unité est utilisée dans des factures
      let usageCheck;
      try {
        usageCheck = await showLoading(
          {
            title: 'Vérification en cours...',
            content: ModalComponents.createLoadingContent('Vérification de l\'utilisation de l\'unité...'),
            size: MODAL_SIZES.SMALL
          },
          async () => {
            return await gestionState.tarifActions.checkServiceUniteUsageInFacture(idService, idUnite);
          }
        );
        
        log.debug(' Résultat vérification usage:', usageCheck);
        
      } catch (checkError) {
        log.error(' Erreur vérification usage:', checkError);
        await showError(
          'Impossible de vérifier l\'utilisation de cette unité.\n\nLa dissociation peut échouer.',
          'Vérification impossible'
        );
        return false;
      }
      
      //  Si l'unité est utilisée, afficher un message d'erreur (non bloquant)
      if (usageCheck && usageCheck.isUsed) {
        log.debug(' Unité utilisée dans des factures - dissociation impossible');
        
        await showError(
          `Cette liaison est utilisée dans ${usageCheck.count} ligne(s) de facture et ne peut pas être dissociée.\n\n` +
          `Pour la dissocier, vous devez d'abord modifier ou supprimer les lignes de facture concernées.`,
          'Dissociation impossible'
        );
        
        return false;
      }
      
      //  ÉTAPE 2: L'unité n'est pas utilisée, demander confirmation
      log.debug(' Unité non utilisée - affichage de la confirmation');
      
      const confirmationResult = await showConfirm({
        title: 'Confirmer la dissociation',
        message: `Êtes-vous sûr de vouloir dissocier l'unité "${uniteName}" de ce service ?\n\n` +
          `Cette action supprimera le lien entre le service et l'unité et les tarifs associés`,
        confirmText: 'Dissocier',
        cancelText: 'Annuler',
        type: 'warning',
        anchorRef: anchorRef,
        position: MODAL_POSITIONS.SMART
      });
      
      if (confirmationResult.action === 'confirm') {
        log.debug(' Dissociation confirmée par l\'utilisateur');
        
        // ÉTAPE 3: Exécuter la dissociation
        const result = await showLoading(
          {
            title: 'Dissociation en cours...',
            content: ModalComponents.createLoadingContent('Dissociation de l\'unité...'),
            size: MODAL_SIZES.SMALL
          },
          async () => {
            return await gestionState.tarifActions.unlinkServiceUnite(idService, idUnite);
          }
        );
        
        if (result && result.success) {
          log.debug(' Unité dissociée avec succès');
          
          // Rafraîchir les données
          if (gestionState.loadUnites) {
            await gestionState.loadUnites();
          }
          if (gestionState.loadUnitesByService) {
            await gestionState.loadUnitesByService(idService);
          }
          
          // Notification succès
          showSuccess(`Unité "${uniteName}" dissociée avec succès`);
          
          // Callback pour intégrations
          if (onTarifAction) {
            onTarifAction('service-unite-unlinked', {
              idService,
              idUnite,
              uniteName
            });
          }
          
          return true;
        } else {
          // Erreur lors de la dissociation
          const errorMsg = result?.message || 'Erreur lors de la dissociation';
          log.error(' Erreur dissociation:', errorMsg);
          await showError(`Erreur lors de la dissociation : ${errorMsg}`, 'Erreur dissociation');
          showErrorNotif(errorMsg);
          return false;
        }
      } else {
        log.debug(' Dissociation annulée par l\'utilisateur');
        return false;
      }
      
    } catch (error) {
      log.error(' Erreur critique dissociation:', error);
      await showError(`Erreur critique : ${error.message}`, 'Erreur dissociation');
      showErrorNotif(error.message || 'Erreur lors de la dissociation');
      return false;
    }
  }, [gestionState, onTarifAction, showSuccess, showErrorNotif]);

  return {
    handleCreateItem,
    handleEditItem,
    handleDeleteItem,
    handleUnlinkServiceUnite
  };
};

export default useTarifModals;