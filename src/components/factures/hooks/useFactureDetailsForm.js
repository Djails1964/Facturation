import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useFactureConfiguration } from './useFactureConfiguration';
import { useFactureLignes } from './useFactureLignes';
import { useFacturePricing } from './useFacturePricing';
import { useFactureUI } from './useFactureUI';
import { formatMontant } from '../../../utils/formatters';
import DateService from '../../../utils/DateService';

/**
 * Hook principal pour la gestion des détails de facture - VERSION CORRIGÉE
 * ✅ CORRECTION : Élimination des boucles infinies avec initialisation contrôlée
 */
export function useFactureDetailsForm(
    client,
    readOnly,
    lignesInitiales = null,
    onLignesChange,
    onResetRistourne
) {
    console.log('🎯 useFactureDetailsForm - Initialisation');

    // ✅ État pour contrôler l'initialisation
    const [isInitialized, setIsInitialized] = useState(false);
    
    // ✅ Configuration avec dépendances stables
    const configuration = useFactureConfiguration(client, readOnly);
    
    // ✅ Mémoriser les callbacks pour éviter les re-créations
    const stableOnLignesChange = useCallback((lignes) => {
        if (typeof onLignesChange === 'function') {
            onLignesChange(lignes);
        }
    }, [onLignesChange]);
    
    const stableOnResetRistourne = useCallback(() => {
        if (typeof onResetRistourne === 'function') {
            onResetRistourne();
        }
    }, [onResetRistourne]);

    // ✅ Gestion des lignes avec callbacks stables
    const lignesManager = useFactureLignes(
        lignesInitiales,
        readOnly,
        stableOnLignesChange,
        stableOnResetRistourne,
        configuration.services,
        configuration.unites
    );
    
    // ✅ Pricing avec dépendances stables
    const pricing = useFacturePricing(
        client,
        configuration.tarificationService,
        configuration.services,
        configuration.unites,
        lignesManager.lignes,
        lignesManager.modifierLigne,
        lignesManager.prixModifiesManuel
    );
    
    // Gestion des états d'interface utilisateur
    const ui = useFactureUI();

    /**
     * ✅ CORRECTION : Effet d'initialisation automatique
     */
    useEffect(() => {
        // Ne pas initialiser si déjà fait
        if (isInitialized) {
            console.log('✅ Déjà initialisé, skip');
            return;
        }

        // Attendre que la configuration soit prête
        if (configuration.isLoading || !configuration.services.length) {
            console.log('⏳ Configuration non prête:', {
                isLoading: configuration.isLoading,
                servicesCount: configuration.services.length
            });
            return;
        }

        console.log('🚀 Démarrage initialisation automatique');
        
        // Si on a des lignes initiales, les initialiser
        if (lignesInitiales && lignesInitiales.length > 0) {
            console.log('✅ Initialisation avec lignes existantes:', lignesInitiales.length);
            lignesManager.initialiserLignes(
                lignesInitiales,
                readOnly,
                configuration.services,
                configuration.unites
            );
        } else if (!readOnly && configuration.defaultService) {
            console.log('✅ Création ligne par défaut');
            // Si pas de lignes initiales et pas en mode lecture seule, ajouter une ligne par défaut
            lignesManager.ajouterLigne(
                configuration.defaultService,
                configuration.defaultUnites
            );
        }

        // Marquer comme initialisé
        setIsInitialized(true);
        console.log('✅ Initialisation terminée');

    }, [
        isInitialized,
        configuration.isLoading,
        configuration.services.length,
        configuration.defaultService,
        lignesInitiales,
        readOnly,
        lignesManager.initialiserLignes,
        lignesManager.ajouterLigne,
        configuration.services,
        configuration.unites,
        configuration.defaultUnites
    ]);

    /**
     * ✅ Réinitialiser quand le client change
     */
    useEffect(() => {
        if (client?.id) {
            console.log('🔄 Client changé, reset initialisation');
            setIsInitialized(false);
        }
    }, [client?.id]);

    /**
     * Ajoute une ligne avec gestion automatique des prix
     */
    const ajouterLigneAvecPrix = useCallback(() => {
        if (readOnly) return;
        
        lignesManager.ajouterLigne(
            configuration.defaultService,
            configuration.defaultUnites
        );
    }, [
        readOnly,
        lignesManager.ajouterLigne,
        configuration.defaultService,
        configuration.defaultUnites
    ]);

    /**
     * Modifie une ligne avec recalcul automatique des prix
     */
    const modifierLigneAvecPrix = useCallback(async (index, champ, valeur) => {
        lignesManager.modifierLigne(index, champ, valeur);
        
        if ((champ === 'serviceType' || champ === 'unite') && client) {
            await pricing.recalculerPrixLigne(index);
        }
    }, [lignesManager.modifierLigne, pricing.recalculerPrixLigne, client?.id]);

    /**
     * Insère le nom de l'unité dans la description
     */
    const insertUniteNameInDescription = useCallback((index) => {
        if (readOnly) return;
        
        const ligne = lignesManager.lignes[index];
        if (!ligne || !ligne.unite) return;
        
        const uniteObj = configuration.unites.find(u => u.code === ligne.unite);
        if (!uniteObj || !uniteObj.nom) return;
        
        const uniteName = uniteObj.nom;
        const currentDescription = ligne.description || '';
        const unitePrefix = `${uniteName}. `;
        
        if (currentDescription.startsWith(unitePrefix)) {
            return;
        }
        
        const newDescription = unitePrefix + currentDescription;
        modifierLigneAvecPrix(index, 'description', newDescription);

        ui.setFocusedFields(prev => ({
            ...prev,
            [`description-${index}`]: true
        }));

        setTimeout(() => {
            const inputElement = document.getElementById(`description-${index}`);
            if (inputElement && inputElement.parentElement) {
                inputElement.parentElement.classList.add('has-value');
                inputElement.parentElement.classList.add('fdf_focused');
                inputElement.parentElement.classList.add('fdf_filled');
            }
        }, 10);
    }, [
        readOnly,
        lignesManager.lignes,
        configuration.unites,
        modifierLigneAvecPrix,
        ui.setFocusedFields
    ]);

    /**
     * Gestion du toggle de ligne avec mise à jour de l'UI
     */
    const toggleLigneOuverte = useCallback((index) => {
        const isCurrentlyOpen = lignesManager.lignesOuvertes[index] === true;
        const isGoingToOpen = !isCurrentlyOpen;
        
        if (isGoingToOpen) {
            const ligne = lignesManager.lignes[index];
            const newFocusedFields = { ...ui.focusedFields };
            
            Object.keys(ligne).forEach(key => {
                if (ligne[key] && key !== 'id' && key !== 'noOrdre') {
                    newFocusedFields[`${key}-${index}`] = true;
                }
            });
            
            ui.setFocusedFields(newFocusedFields);
        }
        
        lignesManager.toggleLigneOuverte(index);
    }, [lignesManager, ui]);

    /**
     * ✅ Helpers stables avec useMemo
     */
    const helpers = useMemo(() => ({
        getErrorClass: (index, field) => {
            return lignesManager.validationErrors[index] && lignesManager.validationErrors[index][field] 
                ? 'fdf_error-validation' 
                : '';
        },
        
        hasErrors: (index) => {
            return lignesManager.validationErrors[index] && 
                   Object.keys(lignesManager.validationErrors[index]).length > 0;
        },
        
        formatCurrency: (montant) => {
            return formatMontant(montant);
        }
    }), [lignesManager.validationErrors]);

    // ✅ Interface publique stable
    return useMemo(() => ({
        // États principaux
        lignes: lignesManager.lignes || [],
        isLoading: configuration.isLoading || !isInitialized,
        message: configuration.message,
        messageType: configuration.messageType,
        totalGeneral: lignesManager.totalGeneral,
        tarifInfo: configuration.tarifInfo,
        
        // Configuration
        services: configuration.services,
        unites: configuration.unites,
        unitesByService: configuration.unitesByService,
        defaultService: configuration.defaultService,
        defaultUnites: configuration.defaultUnites,
        tarificationService: configuration.tarificationService,
        
        // États de gestion des lignes
        lignesOuvertes: lignesManager.lignesOuvertes,
        focusedFields: ui.focusedFields,
        validationErrors: lignesManager.validationErrors,
        draggingIndex: lignesManager.draggingIndex,
        
        // Méthodes principales
        setLignes: lignesManager.setLignes,
        ajouterLigne: ajouterLigneAvecPrix,
        modifierLigne: modifierLigneAvecPrix,
        supprimerLigne: lignesManager.supprimerLigne,
        copierLigne: lignesManager.copierLigne,
        insertUniteNameInDescription,
        
        // Méthodes de validation
        validateLignes: lignesManager.validateLignes,
        validateAllLignes: lignesManager.validateAllLignes,
        hasErrors: helpers.hasErrors,
        getErrorClass: helpers.getErrorClass,
        
        // Méthodes d'état
        setLignesOuvertes: lignesManager.setLignesOuvertes,
        setFocusedFields: ui.setFocusedFields,
        setValidationErrors: lignesManager.setValidationErrors,
        toggleLigneOuverte,
        
        // Méthodes de gestion des champs
        handleFocus: ui.handleFocus,
        handleBlur: ui.handleBlur,
        
        // Méthodes de drag and drop
        handleDragStart: lignesManager.handleDragStart,
        handleDragOver: lignesManager.handleDragOver,
        handleDrop: lignesManager.handleDrop,
        handleDragEnd: lignesManager.handleDragEnd,
        setDraggingIndex: lignesManager.setDraggingIndex,
        
        // Méthodes spécifiques aux dates
        updateQuantityFromDates: lignesManager.updateQuantityFromDates,
        
        // Utilitaires
        formatCurrency: helpers.formatCurrency,
        calculerPrixPourClient: pricing.calculerPrixPourClient,
        
        // Références
        prixModifiesManuel: lignesManager.prixModifiesManuel,
        isInitialized,
        
        // Services utilitaires
        DateService
    }), [
        lignesManager.lignes,
        lignesManager.totalGeneral,
        lignesManager.lignesOuvertes,
        lignesManager.validationErrors,
        lignesManager.draggingIndex,
        configuration.isLoading,
        configuration.message,
        configuration.messageType,
        configuration.tarifInfo,
        configuration.services,
        configuration.unites,
        configuration.unitesByService,
        ui.focusedFields,
        helpers,
        ajouterLigneAvecPrix,
        modifierLigneAvecPrix,
        insertUniteNameInDescription,
        toggleLigneOuverte,
        isInitialized
    ]);
}