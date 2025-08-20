// hooks/useTarifModals.js - Logique des modales extraite - VERSION COMPLÈTE

import { useCallback } from 'react';
import { showCustom, showConfirm, showLoading, showError, MODAL_SIZES, MODAL_POSITIONS } from '../../../utils/modalSystem';
import { FORM_TYPES } from '../../../constants/tarifConstants';
import { TarifFormService } from '../services/TarifFormService';
import { TarifValidationService } from '../services/TarifValidationService';
import ModalComponents from '../../shared/ModalComponents';

export const useTarifModals = ({ 
  gestionState, 
  addNotification, 
  setCreatedIds, 
  onTarifAction 
}) => {

  // ✅ MÉTHODE UTILITAIRE pour récupérer les données existantes (DÉCLARÉE EN PREMIER)
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
      console.log(`📄 Début ${isEdit ? 'modification' : 'création'} ${formType}:`, formData);
      
      // ✅ VALIDATION FINALE CÔTÉ CLIENT avec données existantes
      const existingItems = getExistingItemsForValidation(formType, gestionState);
      
      console.log('🔍 Éléments existants pour validation:', existingItems);
      console.log('🔍 Données du formulaire pour validation:', formData);
      console.log('🔍 ID de l\'élément pour validation:', itemId);
      
      const validationResult = TarifValidationService.validateFormData(formType, formData, existingItems, itemId);

      console.log('🔍 Résultat de la validation:', validationResult);

      if (!validationResult.isValid) {
        const errorMessages = Object.values(validationResult.errors);
        throw new Error(`Erreurs de validation:\n• ${errorMessages.join('\n• ')}`);
      }
      
      // ✅ VÉRIFICATION SPÉCIFIQUE D'UNICITÉ POUR LES CODES
      if ((formType === FORM_TYPES.SERVICE || formType === FORM_TYPES.UNITE) && formData.code) {
        const codeExists = existingItems.find(item => 
          item.code && 
          item.code.toUpperCase() === formData.code.toUpperCase() && 
          item.id !== itemId
        );
        
        if (codeExists) {
          const typeLabel = TarifFormService.getFormTypeDisplayName(formType).toLowerCase();
          throw new Error(`Le code "${formData.code}" existe déjà pour un autre ${typeLabel} (${codeExists.nom})`);
        }
      }
      
      // ✅ VÉRIFICATION SPÉCIFIQUE D'UNICITÉ POUR LES NOMS
      if (formData.nom) {
        const nomExists = existingItems.find(item => 
          item.nom && 
          item.nom.toLowerCase() === formData.nom.toLowerCase() && 
          item.id !== itemId
        );
        
        if (nomExists) {
          const typeLabel = TarifFormService.getFormTypeDisplayName(formType).toLowerCase();
          throw new Error(`Le nom "${formData.nom}" existe déjà pour un autre ${typeLabel} (${nomExists.code || nomExists.id})`);
        }
      }
      
      console.log(`✅ Validation réussie, soumission ${formType}`);
      
      // Afficher modal de chargement
      const result = await showLoading(
        {
          title: isEdit ? 'Modification en cours...' : 'Création en cours...',
          content: ModalComponents.createLoadingContent(
            isEdit ? 'Mise à jour des données...' : 'Enregistrement des données...'
          ),
          size: MODAL_SIZES.SMALL
        },
        async () => {
          return await TarifFormService.submitForm(formType, formData, isEdit, itemId, gestionState.tarificationService);
        }
      );
      
      if (result && result.success) {
        console.log(`✅ Succès ${formType}:`, result);
        
        // Mise à jour des données locales
        await TarifFormService.refreshDataAfterSave(formType, gestionState);
        
        // Mise à jour des IDs créés pour highlighting
        if (!isEdit) {
          setCreatedIds(prev => ({
            ...prev,
            [TarifFormService.getCreatedIdKey(formType)]: result.item?.id || result.data?.id || result.id
          }));
        }
        
        // Message de succès
        const actionText = isEdit ? 'modifié' : 'créé';
        const itemForDisplay = {
          ...formData,
          ...(result.item || result.data || {}),
          id: result.item?.id || result.data?.id || result.id
        };
        
        const itemName = TarifFormService.getItemDisplayName(formType, itemForDisplay);
        const typeDisplayName = TarifFormService.getFormTypeDisplayName(formType);
        
        addNotification('success', `${typeDisplayName} "${itemName}" ${actionText} avec succès`);
        
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
        addNotification('error', errorMessage);
        return false;
      }
      
    } catch (error) {
      console.error(`💥 Erreur critique ${formType}:`, error);
      await showError(`Erreur : ${error.message}`, `Erreur ${isEdit ? 'modification' : 'création'} ${formType}`);
      addNotification('error', error.message || 'Erreur lors de la sauvegarde');
      return false;
    }
  }, [gestionState, addNotification, setCreatedIds, onTarifAction, getExistingItemsForValidation]);

  // Handler générique pour création
  const handleCreateItem = useCallback(async (formType, anchorRef = null) => {
    try {
      // ✅ S'ASSURER QUE LES DONNÉES SONT CHARGÉES avant d'ouvrir le formulaire
      if (formType === FORM_TYPES.TARIF || formType === FORM_TYPES.TARIF_SPECIAL) {
        console.log('🔄 Vérification du chargement des données...');
        
        // Charger les données si nécessaire
        if (!gestionState.services || gestionState.services.length === 0) {
          console.log('⚠️ Services non chargés, chargement en cours...');
          await gestionState.loadServices?.();
        }
        
        if (!gestionState.unites || gestionState.unites.length === 0) {
          console.log('⚠️ Unités non chargées, chargement en cours...');
          await gestionState.loadUnites?.();
        }
        
        if (!gestionState.typesTarifs || gestionState.typesTarifs.length === 0) {
          console.log('⚠️ Types tarifs non chargés, chargement en cours...');
          await gestionState.loadTypesTarifs?.();
        }
        
        if (formType === FORM_TYPES.TARIF_SPECIAL && (!gestionState.clients || gestionState.clients.length === 0)) {
          console.log('⚠️ Clients non chargés, chargement en cours...');
          await gestionState.loadClients?.();
        }
      }
      
      // ✅ DEBUG : Vérifier les données disponibles APRÈS chargement
      console.log(`🔍 Debug création ${formType} APRÈS chargement:`, {
        services: gestionState.services?.length || 0,
        unites: gestionState.unites?.length || 0,
        typesTarifs: gestionState.typesTarifs?.length || 0,
        clients: gestionState.clients?.length || 0,
        servicesType: typeof gestionState.services,
        servicesIsArray: Array.isArray(gestionState.services)
      });
      
      // ✅ VALIDATION AVANT UTILISATION - S'assurer que les données sont des tableaux
      const additionalData = {
        services: Array.isArray(gestionState.services) ? gestionState.services : [],
        unites: Array.isArray(gestionState.unites) ? gestionState.unites : [],
        typesTarifs: Array.isArray(gestionState.typesTarifs) ? gestionState.typesTarifs : [],
        clients: Array.isArray(gestionState.clients) ? gestionState.clients : []
      };
      
      // ✅ VÉRIFICATION FINALE - Alerter si des données sont manquantes
      if (formType === FORM_TYPES.TARIF || formType === FORM_TYPES.TARIF_SPECIAL) {
        const missingData = [];
        if (additionalData.services.length === 0) missingData.push('services');
        if (additionalData.unites.length === 0) missingData.push('unités');
        if (additionalData.typesTarifs.length === 0) missingData.push('types de tarifs');
        if (formType === FORM_TYPES.TARIF_SPECIAL && additionalData.clients.length === 0) missingData.push('clients');
        
        if (missingData.length > 0) {
          console.warn(`⚠️ Données manquantes pour ${formType}:`, missingData);
          addNotification('warning', `Attention: Certaines données ne sont pas disponibles (${missingData.join(', ')})`);
        }
      }
      
      console.log(`📊 Données additionnelles préparées:`, {
        servicesCount: additionalData.services.length,
        unitesCount: additionalData.unites.length,
        typesTarifsCount: additionalData.typesTarifs.length,
        clientsCount: additionalData.clients.length
      });

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
          const existingItems = getExistingItemsForValidation(formType, gestionState);
          console.log(`📊 Données existantes pour validation ${formType}:`, existingItems.length);
          TarifValidationService.setupFormValidation(container, formType, null, existingItems);
        }
      });
      
      if (result.action === 'submit') {
        const formData = result.data;
        
        if (!formData || Object.keys(formData).length === 0) {
          addNotification('error', 'Aucune donnée reçue du formulaire');
          return false;
        }
        
        return await processFormSubmission(formType, formData, false);
      }
      
      return false;
      
    } catch (error) {
      console.error(`❌ Erreur création ${formType}:`, error);
      addNotification('error', error.message || 'Erreur lors de la création');
      return false;
    }
  }, [processFormSubmission, addNotification, getExistingItemsForValidation, gestionState]);

  // Handler générique pour édition
  const handleEditItem = useCallback(async (formType, itemId, anchorRef = null) => {
    try {
      // ✅ S'ASSURER QUE LES DONNÉES SONT CHARGÉES avant d'ouvrir le formulaire
      if (formType === FORM_TYPES.TARIF || formType === FORM_TYPES.TARIF_SPECIAL) {
        if (!gestionState.services || gestionState.services.length === 0) {
          await gestionState.loadServices?.();
        }
        if (!gestionState.unites || gestionState.unites.length === 0) {
          await gestionState.loadUnites?.();
        }
        if (!gestionState.typesTarifs || gestionState.typesTarifs.length === 0) {
          await gestionState.loadTypesTarifs?.();
        }
        if (formType === FORM_TYPES.TARIF_SPECIAL && (!gestionState.clients || gestionState.clients.length === 0)) {
          await gestionState.loadClients?.();
        }
      }
      
      const itemData = TarifFormService.getItemData(formType, itemId, gestionState);
      
      // ✅ PRÉPARER LES DONNÉES ADDITIONNELLES de manière sécurisée
      const additionalData = {
        services: Array.isArray(gestionState.services) ? gestionState.services : [],
        unites: Array.isArray(gestionState.unites) ? gestionState.unites : [],
        typesTarifs: Array.isArray(gestionState.typesTarifs) ? gestionState.typesTarifs : [],
        clients: Array.isArray(gestionState.clients) ? gestionState.clients : []
      };
      
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
          const existingItems = getExistingItemsForValidation(formType, gestionState);
          console.log(`📊 Données existantes pour validation ${formType}:`, existingItems);
          TarifValidationService.setupFormValidation(container, formType, itemId, existingItems);
        }
      });
      
      if (result.action === 'submit') {
        const formData = result.data;
        
        if (!formData || Object.keys(formData).length === 0) {
          addNotification('error', 'Aucune donnée reçue du formulaire');
          return false;
        }
        
        return await processFormSubmission(formType, formData, true, itemId);
      }
      
      return false;
      
    } catch (error) {
      console.error(`❌ Erreur modification ${formType}:`, error);
      addNotification('error', error.message || 'Erreur lors de la modification');
      return false;
    }
  }, [processFormSubmission, addNotification, gestionState, getExistingItemsForValidation]);

  // Handler générique pour suppression - VERSION CORRIGÉE avec gestion d'erreurs
  const handleDeleteItem = useCallback(async (formType, itemId, itemName, anchorRef = null) => {
    try {
      const typeLabel = TarifFormService.getFormTypeDisplayName(formType).toLowerCase();
      
      console.log(`🗑️ Tentative de suppression ${formType}:`, { itemId, itemName, typeLabel });
      
      // 🔍 ÉTAPE 1: Vérifier l'utilisation AVANT d'afficher la confirmation
      console.log(`🔍 Vérification de l'utilisation du ${typeLabel}...`);
      
      let usageCheck;
      try {
        usageCheck = await showLoading(
          {
            title: 'Vérification en cours...',
            content: ModalComponents.createLoadingContent(`Vérification de l'utilisation du ${typeLabel}...`),
            size: MODAL_SIZES.SMALL
          },
          async () => {
            return await TarifFormService.checkItemUsage(formType, itemId, gestionState.tarificationService);
          }
        );
        
        console.log(`📊 Résultat de la vérification d'utilisation:`, usageCheck);
        
      } catch (checkError) {
        console.error(`❌ Erreur lors de la vérification:`, checkError);
        // En cas d'erreur de vérification, on procède quand même mais on prévient
        await showError(
          `Impossible de vérifier l'utilisation du ${typeLabel}.\n\nLa suppression peut échouer si l'élément est utilisé ailleurs.`,
          'Vérification impossible'
        );
        usageCheck = { success: true, used: false }; // On assume non utilisé en cas d'erreur
      }
      
      // 🚫 VÉRIFICATIONS MULTIPLES pour détecter l'utilisation
      let isUsed = false;
      let usageMessage = '';
      
      if (usageCheck) {
        // Vérification 1: Champ 'used' explicite
        if (usageCheck.used === true) {
          isUsed = true;
          console.log(`❌ Utilisation détectée via champ 'used'`);
        }
        
        // Vérification 2: Champ 'success' false peut indiquer une utilisation
        if (usageCheck.success === false && usageCheck.message) {
          if (usageCheck.message.toLowerCase().includes('utilisé') || 
              usageCheck.message.toLowerCase().includes('reference') ||
              usageCheck.message.toLowerCase().includes('facture') ||
              usageCheck.message.toLowerCase().includes('tarif')) {
            isUsed = true;
            usageMessage = usageCheck.message;
            console.log(`❌ Utilisation détectée via message d'erreur:`, usageMessage);
          }
        }
        
        // Vérification 3: Analyser les détails d'utilisation
        if (usageCheck.details) {
          const { facturesCount, tarifsCount, associationsCount } = usageCheck.details;
          if (facturesCount > 0 || tarifsCount > 0 || associationsCount > 0) {
            isUsed = true;
            console.log(`❌ Utilisation détectée via compteurs:`, usageCheck.details);
            
            let details = [];
            if (facturesCount > 0) details.push(`${facturesCount} facture(s)`);
            if (tarifsCount > 0) details.push(`${tarifsCount} tarif(s)`);
            if (associationsCount > 0) details.push(`${associationsCount} association(s)`);
            
            usageMessage = `Utilisé dans: ${details.join(', ')}`;
          }
        }
        
        // Vérification 4: Propriétés alternatives selon l'API
        if (usageCheck.isUsed === true || usageCheck.inUse === true || usageCheck.hasReferences === true) {
          isUsed = true;
          console.log(`❌ Utilisation détectée via propriétés alternatives`);
        }
      }
      
      // 🚫 Si utilisé, afficher l'erreur et arrêter
      if (isUsed) {
        console.log(`❌ ${typeLabel} utilisé, suppression bloquée. Message:`, usageMessage);
        
        const errorMessage = usageMessage || 
          `Ce ${typeLabel} est actuellement utilisé et ne peut pas être supprimé.\n\nVeuillez d'abord supprimer ou modifier les éléments qui l'utilisent.`;
        
        await showError(errorMessage, 'Suppression impossible');
        return false;
      }
      
      console.log(`✅ ${typeLabel} non utilisé, affichage de la confirmation`);
      
      // 📋 ÉTAPE 2: Afficher la confirmation (seulement si pas utilisé)
      const confirmationResult = await showConfirm({
        title: `Supprimer le ${typeLabel}`,
        message: `Êtes-vous sûr de vouloir supprimer ce ${typeLabel} ?\n\n"${itemName || 'Élément'}"\n\n⚠️ Cette action est irréversible.`,
        confirmText: 'Supprimer définitivement',
        cancelText: 'Annuler',
        type: 'danger',
        anchorRef: anchorRef,
        position: MODAL_POSITIONS.SMART
      });
      
      if (confirmationResult.action === 'confirm') {
        console.log(`✅ Suppression confirmée pour ${formType}:`, itemId);
        
        const result = await showLoading(
          {
            title: 'Suppression en cours...',
            content: ModalComponents.createLoadingContent(`Suppression du ${typeLabel}...`),
            size: MODAL_SIZES.SMALL
          },
          async () => {
            return await TarifFormService.deleteItem(formType, itemId, gestionState.tarificationService);
          }
        );
        
        if (result && result.success) {
          await TarifFormService.refreshDataAfterSave(formType, gestionState);
          addNotification('success', `${TarifFormService.getFormTypeDisplayName(formType)} "${itemName}" supprimé avec succès`);
          
          if (onTarifAction) {
            onTarifAction(`${formType}-deleted`, { 
              item: { id: itemId, name: itemName },
              formType,
              context: formType.includes('tarif') ? 'tarif' : 'config'
            });
          }
          
          return true;
        } else {
          const errorMessage = result?.message || 'Erreur lors de la suppression';
          await showError(`Erreur lors de la suppression : ${errorMessage}`, 'Erreur suppression');
          addNotification('error', errorMessage);
          return false;
        }
      } else {
        console.log(`❌ Suppression annulée pour ${formType}:`, itemId);
        return false;
      }
      
    } catch (error) {
      console.error(`💥 Erreur suppression ${formType}:`, error);
      await showError(`Erreur critique : ${error.message}`, `Erreur suppression ${formType}`);
      addNotification('error', error.message || 'Erreur lors de la suppression');
      return false;
    }
  }, [addNotification, gestionState, onTarifAction]);

  return {
    handleCreateItem,
    handleEditItem,
    handleDeleteItem
  };
};