// src/hooks/useModalSystem.js

import { useCallback, useContext, createContext } from 'react';

/**
 * Hook centralisé pour la gestion des modales
 * Standardise l'interface et évite la prop drilling
 */

// ========== CONTEXTE MODAL ==========

const ModalContext = createContext(null);

export const useModalSystem = () => {
    const context = useContext(ModalContext);
    
    if (!context) {
        // Si pas de contexte, utiliser l'implémentation par défaut
        return useDefaultModalSystem(); // ✅ CHANGÉ: utiliser un hook
    }
    
    return context;
};

// ========== PROVIDER MODAL ==========

export const ModalProvider = ({ children, modalImplementation }) => {
    const modalSystem = modalImplementation || useDefaultModalSystem(); // ✅ CHANGÉ: utiliser un hook
    
    return (
        <ModalContext.Provider value={modalSystem}>
            {children}
        </ModalContext.Provider>
    );
};

// ========== HOOK POUR IMPLÉMENTATION PAR DÉFAUT ==========

const useDefaultModalSystem = () => { // ✅ CHANGÉ: maintenant c'est un hook
    /**
     * Modal personnalisée unifiée
     */
    const showCustom = useCallback(async (config) => {
        const {
            title,
            content,
            buttons = [],
            size = 'medium',
            position = 'center',
            anchorRef = null,
            onMount = null,
            className = ''
        } = config;

        return new Promise((resolve) => {
            // Créer la modal
            const modalId = 'modal-' + Date.now();
            const modal = createModalElement(modalId, {
                title,
                content,
                buttons,
                size,
                position,
                anchorRef,
                className,
                onMount,
                onResolve: resolve
            });

            // Ajouter au DOM
            document.body.appendChild(modal);
            
            // Animation d'entrée
            requestAnimationFrame(() => {
                modal.classList.add('modal-show');
            });

            // Appeler onMount si fourni
            if (onMount) {
                const container = modal.querySelector('.modal-content');
                onMount(container);
            }
        });
    }, []);

    /**
     * Modal avec indicateur de chargement
     */
    const showLoading = useCallback(async (config, asyncFunction) => {
        const {
            title = "Chargement...",
            content = createDefaultLoadingContent(),
            size = 'small',
            position = 'center',
            anchorRef = null
        } = config;

        // Afficher la modal de chargement
        const loadingPromise = showCustom({
            title,
            content,
            size,
            position,
            anchorRef,
            buttons: [], // Pas de boutons pour le loading
            className: 'modal-loading'
        });

        try {
            // Exécuter la fonction asynchrone
            const result = await asyncFunction();
            
            // Fermer la modal de chargement
            closeCurrentModal();
            
            return result;
        } catch (error) {
            // Fermer la modal de chargement même en cas d'erreur
            closeCurrentModal();
            throw error;
        }
    }, [showCustom]);

    /**
     * Modal d'information simple
     */
    const showInfo = useCallback(async (message, title = "Information") => {
        return await showCustom({
            title,
            content: `<div class="modal-info">${message}</div>`,
            size: 'medium',
            buttons: [
                {
                    text: "OK",
                    action: "ok",
                    className: "primary"
                }
            ]
        });
    }, [showCustom]);

    /**
     * Modal d'erreur
     */
    const showError = useCallback(async (message, title = "Erreur") => {
        return await showCustom({
            title,
            content: `<div class="modal-error">${message}</div>`,
            size: 'medium',
            buttons: [
                {
                    text: "OK",
                    action: "ok",
                    className: "primary"
                }
            ]
        });
    }, [showCustom]);

    /**
     * Modal de confirmation
     */
    const showConfirm = useCallback(async (message, title = "Confirmation") => {
        return await showCustom({
            title,
            content: `<div class="modal-confirm">${message}</div>`,
            size: 'medium',
            buttons: [
                {
                    text: "Annuler",
                    action: "cancel",
                    className: "secondary"
                },
                {
                    text: "Confirmer",
                    action: "confirm",
                    className: "primary"
                }
            ]
        });
    }, [showCustom]);

    /**
     * Modal de succès
     */
    const showSuccess = useCallback(async (message, title = "Succès") => {
        return await showCustom({
            title,
            content: `<div class="modal-success">${message}</div>`,
            size: 'medium',
            buttons: [
                {
                    text: "OK",
                    action: "ok",
                    className: "primary"
                }
            ]
        });
    }, [showCustom]);

    /**
     * Modal d'avertissement
     */
    const showWarning = useCallback(async (message, title = "Avertissement") => {
        return await showCustom({
            title,
            content: `<div class="modal-warning">${message}</div>`,
            size: 'medium',
            buttons: [
                {
                    text: "OK",
                    action: "ok",
                    className: "primary"
                }
            ]
        });
    }, [showCustom]);

    return {
        showCustom,
        showLoading,
        showInfo,
        showError,
        showConfirm,
        showSuccess,
        showWarning
    };
};

// ========== UTILITAIRES INTERNES ==========

/**
 * Créer l'élément modal dans le DOM
 */
const createModalElement = (modalId, config) => {
    const { 
        title, 
        content, 
        buttons, 
        size, 
        position, 
        anchorRef, 
        className, 
        onResolve 
    } = config;

    // Container principal
    const modalOverlay = document.createElement('div');
    modalOverlay.id = modalId;
    modalOverlay.className = `unified-modal-overlay ${className}`;
    
    // Positionnement
    if (position === 'smart' && anchorRef?.current) {
        positionModalSmart(modalOverlay, anchorRef.current);
    } else {
        modalOverlay.style.position = 'fixed';
        modalOverlay.style.top = '0';
        modalOverlay.style.left = '0';
        modalOverlay.style.width = '100%';
        modalOverlay.style.height = '100%';
        modalOverlay.style.display = 'flex';
        modalOverlay.style.alignItems = 'center';
        modalOverlay.style.justifyContent = 'center';
        modalOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        modalOverlay.style.zIndex = '10000';
    }

    // Contenu de la modal
    const modalContainer = document.createElement('div');
    modalContainer.className = `unified-modal-container size-${size}`;
    
    // Styles du container
    modalContainer.style.backgroundColor = 'white';
    modalContainer.style.borderRadius = '8px';
    modalContainer.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.15)';
    modalContainer.style.maxWidth = getSizeWidth(size);
    modalContainer.style.maxHeight = '90vh';
    modalContainer.style.overflow = 'auto';
    modalContainer.style.margin = '20px';

    // HTML interne
    modalContainer.innerHTML = `
        <div class="unified-modal-header">
            <h3 class="unified-modal-title">${title}</h3>
            <button class="unified-modal-close" data-action="close">×</button>
        </div>
        <div class="unified-modal-content">
            ${content}
        </div>
        ${buttons.length > 0 ? `
            <div class="unified-modal-footer">
                ${buttons.map(button => `
                    <button 
                        class="unified-modal-button ${button.className || ''}" 
                        data-action="${button.action}"
                        ${button.disabled ? 'disabled' : ''}
                    >
                        ${button.text}
                    </button>
                `).join('')}
            </div>
        ` : ''}
    `;

    // Ajouter les styles CSS si pas déjà présents
    addModalStyles();

    // Event listeners
    setupModalEvents(modalContainer, onResolve);

    // Clic sur l'overlay pour fermer
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            onResolve({ action: 'cancel' });
            closeModal(modalOverlay);
        }
    });

    // Échap pour fermer
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            onResolve({ action: 'cancel' });
            closeModal(modalOverlay);
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);

    modalOverlay.appendChild(modalContainer);
    return modalOverlay;
};

/**
 * Configuration des événements de la modal
 */
const setupModalEvents = (modalContainer, onResolve) => {
    modalContainer.addEventListener('click', (e) => {
        const action = e.target.getAttribute('data-action');
        if (action) {
            e.preventDefault();
            e.stopPropagation();

            // Collecter les données du formulaire si présent
            const form = modalContainer.querySelector('form');
            let formData = {};
            
            if (form) {
                const formDataObj = new FormData(form);
                for (const [key, value] of formDataObj.entries()) {
                    formData[key] = value;
                }
            }

            // Résoudre avec l'action et les données
            onResolve({ 
                action, 
                data: Object.keys(formData).length > 0 ? formData : null 
            });
            
            // Fermer la modal
            const modal = modalContainer.closest('.unified-modal-overlay');
            closeModal(modal);
        }
    });
};

/**
 * Positionnement intelligent de la modal
 */
const positionModalSmart = (modalOverlay, anchorElement) => {
    const rect = anchorElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    modalOverlay.style.position = 'fixed';
    modalOverlay.style.zIndex = '10000';
    
    // Déterminer la meilleure position
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    const spaceRight = viewportWidth - rect.right;
    const spaceLeft = rect.left;
    
    if (spaceBelow > 300) {
        // En dessous
        modalOverlay.style.top = rect.bottom + 10 + 'px';
        modalOverlay.style.left = Math.max(10, rect.left) + 'px';
    } else if (spaceAbove > 300) {
        // Au dessus
        modalOverlay.style.bottom = viewportHeight - rect.top + 10 + 'px';
        modalOverlay.style.left = Math.max(10, rect.left) + 'px';
    } else {
        // Centré
        modalOverlay.style.top = '50%';
        modalOverlay.style.left = '50%';
        modalOverlay.style.transform = 'translate(-50%, -50%)';
    }
};

/**
 * Obtenir la largeur selon la taille
 */
const getSizeWidth = (size) => {
    const sizes = {
        small: '400px',
        medium: '600px',
        large: '800px',
        xlarge: '1000px'
    };
    return sizes[size] || sizes.medium;
};

/**
 * Fermer une modal spécifique
 */
const closeModal = (modalElement) => {
    if (modalElement) {
        modalElement.classList.add('modal-hide');
        setTimeout(() => {
            if (modalElement.parentNode) {
                modalElement.parentNode.removeChild(modalElement);
            }
        }, 300);
    }
};

/**
 * Fermer la modal actuelle
 */
const closeCurrentModal = () => {
    const currentModal = document.querySelector('.unified-modal-overlay');
    if (currentModal) {
        closeModal(currentModal);
    }
};

/**
 * Contenu de chargement par défaut
 */
const createDefaultLoadingContent = () => {
    return `
        <div class="unified-modal-loading">
            <div class="unified-modal-spinner"></div>
            <div class="unified-modal-loading-text">Chargement en cours...</div>
        </div>
    `;
};

/**
 * Ajouter les styles CSS des modales
 */
const addModalStyles = () => {
    if (document.getElementById('modal-system-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'modal-system-styles';
    styles.textContent = `
        .unified-modal-overlay {
            opacity: 0;
            transition: opacity 0.3s ease;
            backdrop-filter: blur(2px);
        }
        
        .unified-modal-overlay.modal-show {
            opacity: 1;
        }
        
        .unified-modal-overlay.modal-hide {
            opacity: 0;
        }
        
        .unified-modal-container {
            transform: scale(0.9);
            transition: transform 0.3s ease;
        }
        
        .unified-modal-overlay.modal-show .unified-modal-container {
            transform: scale(1);
        }
        
        .unified-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px 20px 0 20px;
            border-bottom: 1px solid #e9ecef;
            margin-bottom: 20px;
        }
        
        .unified-modal-title {
            margin: 0;
            font-size: 1.25rem;
            font-weight: 600;
            color: #333;
        }
        
        .unified-modal-close {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #666;
            padding: 0;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: background-color 0.2s ease;
        }
        
        .unified-modal-close:hover {
            background-color: #f8f9fa;
            color: #333;
        }
        
        .unified-modal-content {
            padding: 0 20px;
            max-height: 60vh;
            overflow-y: auto;
        }
        
        .unified-modal-footer {
            padding: 20px;
            border-top: 1px solid #e9ecef;
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-top: 20px;
        }
        
        .unified-modal-button {
            padding: 8px 16px;
            border: 1px solid #ddd;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.2s ease;
        }
        
        .unified-modal-button.primary {
            background-color: #007bff;
            color: white;
            border-color: #007bff;
        }
        
        .unified-modal-button.primary:hover {
            background-color: #0056b3;
        }
        
        .unified-modal-button.secondary {
            background-color: #6c757d;
            color: white;
            border-color: #6c757d;
        }
        
        .unified-modal-button.secondary:hover {
            background-color: #545b62;
        }
        
        .unified-modal-button.danger {
            background-color: #dc3545;
            color: white;
            border-color: #dc3545;
        }
        
        .unified-modal-button.danger:hover {
            background-color: #c82333;
        }
        
        .unified-modal-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        
        .unified-modal-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 20px;
        }
        
        .unified-modal-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #007bff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 15px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .unified-modal-loading-text {
            color: #666;
            font-size: 14px;
        }
        
        .modal-info {
            color: #0c5460;
            background-color: #d1ecf1;
            border: 1px solid #bee5eb;
            padding: 15px;
            border-radius: 4px;
        }
        
        .modal-error {
            color: #721c24;
            background-color: #f8d7da;
            border: 1px solid #f5c6cb;
            padding: 15px;
            border-radius: 4px;
        }
        
        .modal-success {
            color: #155724;
            background-color: #d4edda;
            border: 1px solid #c3e6cb;
            padding: 15px;
            border-radius: 4px;
        }
        
        .modal-warning {
            color: #856404;
            background-color: #fff3cd;
            border: 1px solid #ffeeba;
            padding: 15px;
            border-radius: 4px;
        }
        
        .modal-confirm {
            padding: 15px;
            font-size: 16px;
            line-height: 1.5;
        }
    `;
    
    document.head.appendChild(styles);
};

export default useModalSystem;