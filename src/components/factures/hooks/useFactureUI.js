import { useState, useCallback } from 'react';

/**
 * Hook personnalisé pour la gestion des états d'interface utilisateur
 * Gère le focus, les erreurs d'affichage, et les interactions utilisateur
 */
export function useFactureUI() {
    // États de focus et d'interface
    const [focusedFields, setFocusedFields] = useState({});

    /**
     * Gestion du focus des champs
     */
    const handleFocus = useCallback((index, field) => {
        setFocusedFields(prev => ({
            ...prev,
            [`${field}-${index}`]: true
        }));
        
        // Gestion spécifique pour les selects
        if (field === 'unite' || field === 'serviceType') {
            const element = document.getElementById(`${field}-${index}`);
            if (element && element.parentElement) {
                element.parentElement.classList.add('fdf_focused');
            }
        }
    }, []);
    
    /**
     * Gestion de la perte de focus des champs
     */
    const handleBlur = useCallback((index, field, value) => {
        setFocusedFields(prev => ({
            ...prev,
            [`${field}-${index}`]: value ? true : false
        }));
        
        // Pour les select, garder le label flotté seulement s'il y a une valeur
        if ((field === 'unite' || field === 'serviceType') && !value) {
            const element = document.getElementById(`${field}-${index}`);
            if (element && element.parentElement) {
                element.parentElement.classList.remove('fdf_focused');
            }
        }
    }, []);

    /**
     * Met à jour les classes CSS pour indiquer qu'un champ a une valeur
     */
    const updateFieldHasValue = useCallback((fieldId, hasValue) => {
        setTimeout(() => {
            const element = document.getElementById(fieldId);
            if (element && element.parentElement) {
                if (hasValue) {
                    element.parentElement.classList.add('has-value');
                } else {
                    element.parentElement.classList.remove('has-value');
                }
            }
        }, 10);
    }, []);

    /**
     * Met à jour les classes CSS pour tous les champs d'une ligne
     */
    const updateLineFieldsClasses = useCallback((ligne, index) => {
        const fields = [
            { name: 'description', value: ligne.description },
            { name: 'descriptionDates', value: ligne.descriptionDates },
            { name: 'serviceType', value: ligne.serviceType },
            { name: 'unite', value: ligne.unite },
            { name: 'quantite', value: ligne.quantite },
            { name: 'prixUnitaire', value: ligne.prixUnitaire },
            { name: 'total', value: ligne.total }
        ];

        fields.forEach(field => {
            const fieldId = `${field.name}-${index}`;
            const hasValue = field.value !== undefined && field.value !== '' && field.value !== 0;
            updateFieldHasValue(fieldId, hasValue);
        });
    }, [updateFieldHasValue]);

    /**
     * Met à jour l'état focused pour tous les champs d'une ligne qui ont une valeur
     */
    const updateLineFocusedFields = useCallback((ligne, index) => {
        const newFocusedFields = {};
        
        Object.keys(ligne).forEach(key => {
            if (ligne[key] && key !== 'id' && key !== 'noOrdre') {
                newFocusedFields[`${key}-${index}`] = true;
            }
        });
        
        setFocusedFields(prev => ({
            ...prev,
            ...newFocusedFields
        }));
    }, []);

    /**
     * Affiche un message temporaire à l'utilisateur
     */
    const showTemporaryMessage = useCallback((message, type = 'info', duration = 3000) => {
        // Cette fonction peut être étendue pour gérer des notifications toast
        console.log(`${type.toUpperCase()}: ${message}`);
        
        // Exemple d'implémentation avec des notifications
        // if (window.showNotification) {
        //     window.showNotification(message, type, duration);
        // }
    }, []);

    /**
     * Gère l'animation d'un élément lors d'une mise à jour
     */
    const animateFieldUpdate = useCallback((fieldId, animationType = 'highlight') => {
        const element = document.getElementById(fieldId);
        if (!element) return;

        switch (animationType) {
            case 'highlight':
                element.classList.add('fdf_field-updated');
                setTimeout(() => {
                    element.classList.remove('fdf_field-updated');
                }, 1000);
                break;
                
            case 'error':
                element.classList.add('fdf_field-error');
                setTimeout(() => {
                    element.classList.remove('fdf_field-error');
                }, 2000);
                break;
                
            case 'success':
                element.classList.add('fdf_field-success');
                setTimeout(() => {
                    element.classList.remove('fdf_field-success');
                }, 1500);
                break;
        }
    }, []);

    /**
     * Gère le scroll pour amener un élément dans la vue
     */
    const scrollToField = useCallback((fieldId) => {
        const element = document.getElementById(fieldId);
        if (element) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }, []);

    /**
     * Met le focus sur un champ spécifique
     */
    const focusField = useCallback((fieldId) => {
        setTimeout(() => {
            const element = document.getElementById(fieldId);
            if (element) {
                element.focus();
            }
        }, 100);
    }, []);

    /**
     * Gère l'état de chargement d'un champ spécifique
     */
    const setFieldLoading = useCallback((fieldId, isLoading) => {
        const element = document.getElementById(fieldId);
        if (element && element.parentElement) {
            if (isLoading) {
                element.parentElement.classList.add('fdf_field-loading');
            } else {
                element.parentElement.classList.remove('fdf_field-loading');
            }
        }
    }, []);

    /**
     * Valide visuellement un champ
     */
    const validateFieldVisually = useCallback((fieldId, isValid, errorMessage = '') => {
        const element = document.getElementById(fieldId);
        if (!element || !element.parentElement) return;

        const container = element.parentElement;
        
        // Supprimer les classes existantes
        container.classList.remove('fdf_field-valid', 'fdf_field-invalid');
        
        // Ajouter la classe appropriée
        if (isValid) {
            container.classList.add('fdf_field-valid');
        } else {
            container.classList.add('fdf_field-invalid');
            
            // Afficher le message d'erreur si nécessaire
            if (errorMessage) {
                showTemporaryMessage(errorMessage, 'error');
            }
        }
    }, [showTemporaryMessage]);

    /**
     * Réinitialise l'état visuel de tous les champs
     */
    const resetFieldsVisualState = useCallback(() => {
        const elements = document.querySelectorAll('.fdf_floating-label-input');
        elements.forEach(element => {
            element.classList.remove(
                'fdf_field-valid',
                'fdf_field-invalid',
                'fdf_field-loading',
                'fdf_field-updated',
                'fdf_field-error',
                'fdf_field-success'
            );
        });
    }, []);

    /**
     * Gère l'état d'une ligne lors de l'ouverture/fermeture
     */
    const handleLineToggleUI = useCallback((ligne, index, isOpening) => {
        if (isOpening) {
            // Préparer l'UI pour l'ouverture
            updateLineFocusedFields(ligne, index);
            setTimeout(() => {
                updateLineFieldsClasses(ligne, index);
            }, 50);
        } else {
            // Nettoyer l'UI lors de la fermeture
            resetFieldsVisualState();
        }
    }, [updateLineFocusedFields, updateLineFieldsClasses, resetFieldsVisualState]);

    /**
     * Gère les raccourcis clavier
     */
    const handleKeyboardShortcuts = useCallback((event, context = {}) => {
        const { ctrlKey, altKey, shiftKey, key } = event;
        
        // Exemple de raccourcis
        if (ctrlKey && key === 'Enter') {
            // Sauvegarder la facture
            if (context.onSave) {
                event.preventDefault();
                context.onSave();
            }
        }
        
        if (ctrlKey && key === 'l') {
            // Ajouter une nouvelle ligne
            if (context.onAddLine) {
                event.preventDefault();
                context.onAddLine();
            }
        }
        
        if (altKey && key === 'ArrowUp') {
            // Ligne précédente
            if (context.onPreviousLine) {
                event.preventDefault();
                context.onPreviousLine();
            }
        }
        
        if (altKey && key === 'ArrowDown') {
            // Ligne suivante
            if (context.onNextLine) {
                event.preventDefault();
                context.onNextLine();
            }
        }
    }, []);

    return {
        // États
        focusedFields,
        setFocusedFields,
        
        // Gestion du focus
        handleFocus,
        handleBlur,
        focusField,
        scrollToField,
        
        // Gestion des classes CSS
        updateFieldHasValue,
        updateLineFieldsClasses,
        updateLineFocusedFields,
        
        // Gestion des animations et états visuels
        animateFieldUpdate,
        setFieldLoading,
        validateFieldVisually,
        resetFieldsVisualState,
        
        // Gestion des lignes
        handleLineToggleUI,
        
        // Utilitaires d'interface
        showTemporaryMessage,
        handleKeyboardShortcuts
    };
}