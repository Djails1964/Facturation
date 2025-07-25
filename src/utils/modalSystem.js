// src/utils/modalSystem.js
// SYSTÈME MODAL UNIFIÉ COMPLET AVEC DRAG & DROP

const MODAL_TYPES = {
  CONFIRMATION: 'confirmation',
  INPUT: 'input',
  INFO: 'info',
  ERROR: 'error',
  SUCCESS: 'success',
  WARNING: 'warning',
  CUSTOM: 'custom'
};

const MODAL_SIZES = {
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large',
  XLARGE: 'xlarge'
};

const MODAL_POSITIONS = {
  CENTER: 'center',
  SMART: 'smart'
};

class ModalSystem {
  constructor() {
    this.activeModals = new Map();
    this.zIndexCounter = 1000;
    this.dragState = {
      isDragging: false,
      startX: 0,
      startY: 0,
      offsetX: 0,
      offsetY: 0,
      element: null
    };
  }

  /**
   * ✅ Positionnement intelligent avec fallback
   */
  calculateOptimalPosition(anchorRef, modalSize, config = {}) {
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };
    
    const modal = {
      width: modalSize.width || 600,
      height: modalSize.height || 400
    };
    
    // Position par défaut (centrée)
    let position = {
      top: Math.max(20, (viewport.height - modal.height) / 2),
      left: Math.max(20, (viewport.width - modal.width) / 2),
      strategy: 'center'
    };
    
    // Si ancrage demandé et élément disponible
    if (anchorRef && anchorRef.current && config.position !== 'center') {
      try {
        const rect = anchorRef.current.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        
        // Position absolue de l'élément
        const anchorPos = {
          top: rect.top + scrollTop,
          left: rect.left + scrollLeft,
          right: rect.right + scrollLeft,
          bottom: rect.bottom + scrollTop,
          width: rect.width,
          height: rect.height
        };
        
        // Tentatives de positionnement par priorité
        const positions = [
          // À droite de l'élément
          {
            top: anchorPos.top,
            left: anchorPos.right + 10,
            strategy: 'right'
          },
          // En dessous de l'élément
          {
            top: anchorPos.bottom + 10,
            left: anchorPos.left,
            strategy: 'below'
          },
          // À gauche de l'élément
          {
            top: anchorPos.top,
            left: anchorPos.left - modal.width - 10,
            strategy: 'left'
          },
          // Au dessus de l'élément
          {
            top: anchorPos.top - modal.height - 10,
            left: anchorPos.left,
            strategy: 'above'
          }
        ];
        
        // Tester chaque position
        for (const pos of positions) {
          if (this.isPositionValid(pos, modal, viewport)) {
            position = pos;
            break;
          }
        }
        
        // Si aucune position n'est valide, centrer mais ajuster si nécessaire
        if (position.strategy === 'center') {
          position = this.adjustPositionToViewport(position, modal, viewport);
        }
        
      } catch (error) {
        console.warn('Erreur calcul position modale:', error);
        // Garder la position centrée par défaut
      }
    }
    
    return position;
  }
  
  /**
   * ✅ Vérifier si une position est valide
   */
  isPositionValid(position, modal, viewport) {
    const margin = 20; // Marge minimum des bords
    
    return (
      position.left >= margin &&
      position.top >= margin &&
      position.left + modal.width <= viewport.width - margin &&
      position.top + modal.height <= viewport.height - margin
    );
  }
  
  /**
   * ✅ Ajuster position pour rester dans le viewport
   */
  adjustPositionToViewport(position, modal, viewport) {
    const margin = 20;
    
    // Ajuster horizontalement
    if (position.left < margin) {
      position.left = margin;
    } else if (position.left + modal.width > viewport.width - margin) {
      position.left = viewport.width - modal.width - margin;
    }
    
    // Ajuster verticalement
    if (position.top < margin) {
      position.top = margin;
    } else if (position.top + modal.height > viewport.height - margin) {
      position.top = viewport.height - modal.height - margin;
    }
    
    position.strategy = 'adjusted';
    return position;
  }

  /**
   * ✅ Initialiser le système de drag & drop
   */
  initializeDragAndDrop(container) {
    const header = container.querySelector('.unified-modal-header');
    if (!header) return;
    
    // Styles pour indiquer que c'est déplaçable
    header.style.cursor = 'move';
    header.style.userSelect = 'none';
    
    // Ajouter un indicateur visuel
    const dragIndicator = document.createElement('div');
    dragIndicator.className = 'modal-drag-indicator';
    dragIndicator.innerHTML = '⋮⋮';
    dragIndicator.style.cssText = `
      position: absolute;
      left: 10px;
      top: 50%;
      transform: translateY(-50%);
      color: rgba(255, 255, 255, 0.7);
      font-size: 12px;
      letter-spacing: 2px;
      pointer-events: none;
    `;
    header.appendChild(dragIndicator);
    
    // Event listeners
    header.addEventListener('mousedown', this.handleDragStart.bind(this));
    document.addEventListener('mousemove', this.handleDragMove.bind(this));
    document.addEventListener('mouseup', this.handleDragEnd.bind(this));
    
    // Touch events pour mobile
    header.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    document.addEventListener('touchend', this.handleTouchEnd.bind(this));
  }
  
  /**
   * ✅ Début du drag (souris)
   */
  handleDragStart(e) {
    if (e.button !== 0) return; // Seulement clic gauche
    
    const container = e.target.closest('.unified-modal-container');
    if (!container) return;
    
    e.preventDefault();
    
    const rect = container.getBoundingClientRect();
    
    this.dragState = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      element: container
    };
    
    // Styles pendant le drag
    container.style.transition = 'none';
    container.style.zIndex = (this.zIndexCounter + 100).toString();
    document.body.style.userSelect = 'none';
    
    // Ajouter classe pour styles spéciaux
    container.classList.add('dragging');
  }
  
  /**
   * ✅ Déplacement (souris)
   */
  handleDragMove(e) {
    if (!this.dragState.isDragging || !this.dragState.element) return;
    
    e.preventDefault();
    
    const newX = e.clientX - this.dragState.offsetX;
    const newY = e.clientY - this.dragState.offsetY;
    
    // Contraintes du viewport
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };
    
    const rect = this.dragState.element.getBoundingClientRect();
    const margin = 10;
    
    // Limiter aux bords du viewport
    const constrainedX = Math.max(
      margin, 
      Math.min(newX, viewport.width - rect.width - margin)
    );
    
    const constrainedY = Math.max(
      margin,
      Math.min(newY, viewport.height - rect.height - margin)
    );
    
    // Appliquer la nouvelle position
    this.dragState.element.style.left = `${constrainedX}px`;
    this.dragState.element.style.top = `${constrainedY}px`;
    this.dragState.element.style.transform = 'none'; // Annuler le centrage
  }
  
  /**
   * ✅ Fin du drag (souris)
   */
  handleDragEnd(e) {
    if (!this.dragState.isDragging) return;
    
    // Nettoyer les styles
    if (this.dragState.element) {
      this.dragState.element.style.transition = '';
      this.dragState.element.classList.remove('dragging');
    }
    
    document.body.style.userSelect = '';
    
    // Reset état
    this.dragState = {
      isDragging: false,
      startX: 0,
      startY: 0,
      offsetX: 0,
      offsetY: 0,
      element: null
    };
  }
  
  /**
   * ✅ Touch events pour mobile
   */
  handleTouchStart(e) {
    if (e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    const container = e.target.closest('.unified-modal-container');
    if (!container) return;
    
    e.preventDefault();
    
    const rect = container.getBoundingClientRect();
    
    this.dragState = {
      isDragging: true,
      startX: touch.clientX,
      startY: touch.clientY,
      offsetX: touch.clientX - rect.left,
      offsetY: touch.clientY - rect.top,
      element: container
    };
    
    container.style.transition = 'none';
    container.classList.add('dragging');
  }
  
  handleTouchMove(e) {
    if (!this.dragState.isDragging || !this.dragState.element || e.touches.length !== 1) return;
    
    e.preventDefault();
    
    const touch = e.touches[0];
    const newX = touch.clientX - this.dragState.offsetX;
    const newY = touch.clientY - this.dragState.offsetY;
    
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };
    
    const rect = this.dragState.element.getBoundingClientRect();
    const margin = 10;
    
    const constrainedX = Math.max(margin, Math.min(newX, viewport.width - rect.width - margin));
    const constrainedY = Math.max(margin, Math.min(newY, viewport.height - rect.height - margin));
    
    this.dragState.element.style.left = `${constrainedX}px`;
    this.dragState.element.style.top = `${constrainedY}px`;
    this.dragState.element.style.transform = 'none';
  }
  
  handleTouchEnd(e) {
    this.handleDragEnd(e);
  }

  /**
   * ✅ Estimer la taille de la modale
   */
  estimateModalSize(config) {
    const sizeMap = {
      small: { width: 400, height: 300 },
      medium: { width: 600, height: 400 },
      large: { width: 800, height: 500 },
      xlarge: { width: 1000, height: 600 }
    };
    
    const baseSize = sizeMap[config.size] || sizeMap.medium;
    
    // Ajuster selon le contenu
    if (config.inputs && config.inputs.length > 3) {
      baseSize.height += config.inputs.length * 60;
    }
    
    if (config.details && Object.keys(config.details).length > 5) {
      baseSize.height += Object.keys(config.details).length * 30;
    }
    
    if (config.content && config.content.length > 500) {
      baseSize.height += 100;
    }
    
    return baseSize;
  }
  
  /**
   * ✅ Ajuster la position après rendu
   */
  adjustModalAfterRender(container, originalPosition) {
    const rect = container.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };
    
    // Si la modale dépasse en bas
    if (rect.bottom > viewport.height - 20) {
      const newTop = Math.max(20, viewport.height - rect.height - 20);
      container.style.top = `${newTop}px`;
      
      // Si elle dépasse encore, permettre le scroll interne
      if (rect.height > viewport.height - 40) {
        container.style.maxHeight = `${viewport.height - 40}px`;
        const modalForm = container.querySelector('.modal-form');
        if (modalForm) {
          modalForm.style.overflowY = 'auto';
          modalForm.style.maxHeight = `${viewport.height - 140}px`; // 40 (marges) + 60 (header) + 40 (footer)
        }
      }
    }
    
    // Si la modale dépasse à droite
    if (rect.right > viewport.width - 20) {
      const newLeft = Math.max(20, viewport.width - rect.width - 20);
      container.style.left = `${newLeft}px`;
    }
    
    // Ajouter un indicateur si la modale a été repositionnée
    if (originalPosition.strategy !== 'center') {
      const currentTop = parseInt(container.style.top);
      const currentLeft = parseInt(container.style.left);
      
      if (Math.abs(currentTop - originalPosition.top) > 10 || 
          Math.abs(currentLeft - originalPosition.left) > 10) {
        this.addRepositionIndicator(container);
      }
    }
  }
  
  /**
   * ✅ Ajouter un indicateur de repositionnement
   */
  addRepositionIndicator(container) {
    const indicator = document.createElement('div');
    indicator.className = 'modal-reposition-indicator';
    indicator.innerHTML = `
      <span style="
        position: absolute;
        top: -5px;
        right: 30px;
        background: rgba(255, 193, 7, 0.9);
        color: #000;
        font-size: 11px;
        padding: 2px 6px;
        border-radius: 3px;
        font-weight: 500;
        z-index: 1;
      ">Repositionnée</span>
    `;
    
    container.appendChild(indicator);
    
    // Supprimer après 3 secondes
    setTimeout(() => {
      if (indicator.parentNode) {
        indicator.parentNode.removeChild(indicator);
      }
    }, 3000);
  }

  /**
   * ✅ Générer le HTML de la modale
   */
  generateModalHTML(config) {
    let html = `
      <div class="unified-modal-header">
        <h3 class="unified-modal-title">${config.title || ''}</h3>
        <button class="unified-modal-close" data-action="close">×</button>
      </div>
      <div class="modal-form">
    `;

    // Contenu selon le type
    if (config.type === MODAL_TYPES.INFO || config.type === MODAL_TYPES.ERROR || 
        config.type === MODAL_TYPES.SUCCESS || config.type === MODAL_TYPES.WARNING) {
      
      const notificationClass = this.getNotificationClass(config.type);
      html += `
        <div class="${notificationClass}" style="margin-bottom: 15px; text-align: center;">
          ${config.content || ''}
        </div>
      `;
    } else if (config.type === MODAL_TYPES.INPUT) {
      html += `
        <div style="margin-bottom: 15px;">${config.content || ''}</div>
        <form id="modalForm">
          ${this.generateInputsHTML(config.inputs || [])}
        </form>
      `;
    } else if (config.type === MODAL_TYPES.CONFIRMATION) {
      html += `<div class="fc-intro">${config.content || ''}</div>`;
    } else {
      html += config.content || '';
    }

    // Détails
    if (config.details) {
      html += `<div class="details-container">${this.generateDetailsHTML(config.details)}</div>`;
    }

    html += `</div>`;

    // Footer avec boutons
    if (config.buttons && config.buttons.length > 0) {
      html += `<div class="modal-actions">`;
      
      config.buttons.forEach(button => {
        let buttonClass = this.getStandardButtonClass(button.className);
        
        html += `
          <button 
            class="${buttonClass}" 
            data-action="${button.action}"
            ${button.disabled ? 'disabled' : ''}
          >
            ${button.text}
          </button>
        `;
      });
      html += `</div>`;
    }

    return html;
  }

  /**
   * ✅ Convertit les anciennes classes vers les nouvelles standardisées
   */
  getStandardButtonClass(oldClassName) {
    if (!oldClassName) return 'btn-primary';
    
    const classMapping = {
      'primary': 'btn-primary',
      'secondary': 'btn-secondary', 
      'danger': 'btn-danger',
      'success': 'btn-success',
      'modal-action-primary': 'btn-primary',
      'modal-action-secondary': 'btn-secondary',
      'modal-action-danger': 'btn-danger',
      'modal-action-success': 'btn-success'
    };
    
    for (const [oldClass, newClass] of Object.entries(classMapping)) {
      if (oldClassName.includes(oldClass)) {
        return newClass;
      }
    }
    
    return 'btn-primary';
  }

  /**
   * ✅ Classes de notification
   */
  getNotificationClass(type) {
    switch (type) {
      case 'success':
        return 'modal-success';
      case 'error':
        return 'modal-error';
      case 'warning':
        return 'notification warning';
      case 'info':
      default:
        return 'notification info';
    }
  }

  /**
   * ✅ Génère les inputs avec classes existantes
   */
  generateInputsHTML(inputs) {
    return inputs.map(input => {
      const { type = 'text', name, label, value = '', required = false, placeholder = '' } = input;
      
      let inputElement;
      let inputGroupClass = 'input-group';
      
      if (type === 'date') {
        inputGroupClass = 'input-group date-input';
      }
      
      if (type === 'textarea') {
        inputElement = `
          <textarea 
            name="${name}" 
            id="${name}"
            placeholder=" "
            ${required ? 'required' : ''}
          >${value}</textarea>
        `;
      } else if (type === 'select' && input.options) {
        inputElement = `
          <select 
            name="${name}" 
            id="${name}"
            ${required ? 'required' : ''}
          >
            <option value="">${placeholder || 'Choisissez...'}</option>
            ${input.options.map(option => `
              <option value="${option.value}" ${option.value === value ? 'selected' : ''}>
                ${option.label}
              </option>
            `).join('')}
          </select>
        `;
      } else {
        inputElement = `
          <input 
            type="${type}" 
            name="${name}" 
            id="${name}"
            value="${value}"
            placeholder=" "
            ${required ? 'required' : ''}
            ${type === 'number' ? 'step="0.01"' : ''}
          />
        `;
      }
      
      return `
        <div class="${inputGroupClass}">
          ${inputElement}
          ${label ? `<label for="${name}" ${required ? 'class="required"' : ''}>${label}</label>` : ''}
          ${type === 'date' ? '<span class="calendar-icon">📅</span>' : ''}
        </div>
      `;
    }).join('');
  }

  /**
   * ✅ Génère les détails
   */
  generateDetailsHTML(details) {
    if (typeof details === 'string') {
      return `<p>${details}</p>`;
    }
    
    let html = '';
    Object.entries(details).forEach(([key, value]) => {
      html += `
        <div class="info-row">
          <div class="info-label">${key}:</div>
          <div class="info-value">${value}</div>
        </div>
      `;
    });
    
    return html;
  }

  /**
   * ✅ MÉTHODE PRINCIPALE - Show avec positionnement intelligent
   */
  show(config) {
    return new Promise((resolve) => {
      const modalId = `modal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Créer l'overlay
      const overlay = document.createElement('div');
      overlay.className = 'unified-modal-overlay';
      overlay.dataset.modalId = modalId;
      
      // Estimation de la taille de la modale
      const estimatedSize = this.estimateModalSize(config);
      
      // Calculer la position optimale
      const position = this.calculateOptimalPosition(
        config.anchorRef, 
        estimatedSize, 
        { position: config.position || 'smart' }
      );
      
      // Créer le conteneur
      const container = document.createElement('div');
      container.className = `unified-modal-container ${config.size || 'medium'}`;
      container.dataset.modalId = modalId;
      
      // Appliquer la position calculée
      if (position.strategy !== 'center') {
        overlay.style.alignItems = 'flex-start';
        overlay.style.justifyContent = 'flex-start';
        container.style.position = 'absolute';
        container.style.left = `${position.left}px`;
        container.style.top = `${position.top}px`;
        container.style.margin = '0';
      }
      
      // Générer le HTML
      container.innerHTML = this.generateModalHTML(config);
      overlay.appendChild(container);
      
      // Ajouter au DOM
      document.body.appendChild(overlay);
      
      // Initialiser le drag & drop
      this.initializeDragAndDrop(container);
      
      // Vérifier et ajuster la position après rendu
      requestAnimationFrame(() => {
        this.adjustModalAfterRender(container, position);
      });
      
      // Stocker dans la map
      this.activeModals.set(modalId, {
        overlay,
        container,
        resolve,
        config
      });
      
      // Event listeners
      this.attachEventListeners(modalId, config);
      
      // Animations d'apparition
      requestAnimationFrame(() => {
        overlay.classList.add('show');
        container.classList.add('show');
      });
      
      // Focus management
      this.manageFocus(container);
    });
  }

  /**
   * ✅ Attacher les event listeners
   */
  attachEventListeners(modalId, config) {
    const modal = this.activeModals.get(modalId);
    if (!modal) return;

    const { overlay, container, resolve } = modal;

    // Gestionnaire des boutons
    const handleButtonClick = (e) => {
      const action = e.target.dataset.action;
      if (!action) return;

      console.log('🔘 Bouton cliqué - Action:', action, 'Target:', e.target);

      e.preventDefault();
      e.stopPropagation();

      if (action === 'close') {
        console.log('🔘 Fermeture de la modal');
        this.close(modalId, { action: 'close' });
        return;
      }

      // Collecter les données du formulaire si présent
      const form = container.querySelector('#modalForm, #emailForm, #paymentForm');
      let formData = {};
      
      if (form) {
        console.log('🔘 Formulaire trouvé, collecte des données...');
        const formDataObj = new FormData(form);
        for (let [key, value] of formDataObj.entries()) {
          formData[key] = value;
        }
        console.log('🔘 Données formulaire collectées:', formData);
      }

      console.log('🔘 Fermeture modal avec action:', action, 'et données:', formData);
      this.close(modalId, { action, data: formData });
    };

    // Attacher les événements de boutons
    container.addEventListener('click', handleButtonClick);

    // Fermeture par Escape
    const handleEscape = (e) => {
      if (e.key === 'Escape' && config.closeOnEscape !== false) {
        console.log('🔘 Fermeture par Escape');
        this.close(modalId, { action: 'escape' });
      }
    };

    document.addEventListener('keydown', handleEscape);

    // Fermeture par clic sur l'overlay
    const handleOverlayClick = (e) => {
      if (e.target === overlay && config.closeOnOverlayClick !== false) {
        console.log('🔘 Fermeture par clic overlay');
        this.close(modalId, { action: 'overlay' });
      }
    };

    overlay.addEventListener('click', handleOverlayClick);

    // Stocker les handlers pour pouvoir les supprimer
    modal.eventHandlers = {
      handleButtonClick,
      handleEscape,
      handleOverlayClick
    };

    // Appeler onMount si défini
    if (config.onMount && typeof config.onMount === 'function') {
      try {
        console.log('🔘 Appel de onMount');
        config.onMount(container);
      } catch (error) {
        console.error('❌ Erreur dans onMount:', error);
      }
    }
  }

  /**
   * ✅ Gestion du focus
   */
  manageFocus(container) {
    // Focus sur le premier élément focusable
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  }

  /**
   * ✅ Fermer une modale
   */
  close(modalId, result = {}) {
    const modal = this.activeModals.get(modalId);
    if (!modal) return;

    const { overlay, container, resolve, eventHandlers } = modal;

    // Supprimer les event listeners
    if (eventHandlers) {
      container.removeEventListener('click', eventHandlers.handleButtonClick);
      document.removeEventListener('keydown', eventHandlers.handleEscape);
      overlay.removeEventListener('click', eventHandlers.handleOverlayClick);
    }

    // Animation de fermeture
    overlay.classList.add('closing');
    container.classList.add('closing');

    setTimeout(() => {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
      this.activeModals.delete(modalId);
      resolve(result);
    }, 200);
  }

  /**
   * ✅ Fermer toutes les modales
   */
  closeAll() {
    const modalIds = Array.from(this.activeModals.keys());
    modalIds.forEach(id => this.close(id, { action: 'closeAll' }));
  }

  /**
   * ✅ Méthodes de convenance
   */
  custom(config) {
    return this.show({
      type: MODAL_TYPES.CUSTOM,
      ...config
    });
  }

  confirm(options = {}) {
    const {
      title = 'Confirmation',
      message,
      confirmText = 'Confirmer',
      cancelText = 'Annuler',
      type = 'warning',
      anchorRef = null,
      position = MODAL_POSITIONS.SMART,
      details = null,
      size = MODAL_SIZES.MEDIUM
    } = options;

    return this.show({
      type: MODAL_TYPES.CONFIRMATION,
      title,
      content: message,
      size,
      anchorRef,
      position,
      buttons: [
        {
          text: cancelText,
          action: 'cancel',
          className: 'secondary'
        },
        {
          text: confirmText,
          action: 'confirm',
          className: type === 'danger' ? 'danger' : 'primary'
        }
      ],
      details,
      modalClass: `modal-${type}`
    });
  }

  info(message, title = 'Information', anchorRef = null) {
    return this.show({
      type: MODAL_TYPES.INFO,
      title,
      content: message,
      anchorRef,
      size: MODAL_SIZES.MEDIUM,
      buttons: [
        {
          text: 'OK',
          action: 'ok',
          className: 'primary'
        }
      ]
    });
  }

  success(message, title = 'Succès', anchorRef = null) {
    return this.show({
      type: MODAL_TYPES.SUCCESS,
      title,
      content: message,
      anchorRef,
      size: MODAL_SIZES.MEDIUM,
      buttons: [
        {
          text: 'OK',
          action: 'ok',
          className: 'primary'
        }
      ]
    });
  }

  error(message, title = 'Erreur', anchorRef = null) {
    return this.show({
      type: MODAL_TYPES.ERROR,
      title,
      content: message,
      anchorRef,
      size: MODAL_SIZES.MEDIUM,
      buttons: [
        {
          text: 'OK',
          action: 'ok',
          className: 'primary'
        }
      ]
    });
  }

  warning(message, title = 'Attention', anchorRef = null) {
    return this.show({
      type: MODAL_TYPES.WARNING,
      title,
      content: message,
      anchorRef,
      size: MODAL_SIZES.MEDIUM,
      buttons: [
        {
          text: 'OK',
          action: 'ok',
          className: 'primary'
        }
      ]
    });
  }

  prompt(options = {}) {
    const {
      title = 'Saisie',
      message,
      inputs = [],
      confirmText = 'Valider',
      cancelText = 'Annuler',
      anchorRef = null,
      position = MODAL_POSITIONS.SMART,
      size = MODAL_SIZES.MEDIUM
    } = options;

    return this.show({
      type: MODAL_TYPES.INPUT,
      title,
      content: message,
      inputs,
      size,
      anchorRef,
      position,
      buttons: [
        {
          text: cancelText,
          action: 'cancel',
          className: 'secondary'
        },
        {
          text: confirmText,
          action: 'submit',
          className: 'primary'
        }
      ]
    });
  }

  /**
   * ✅ NOUVELLE MÉTHODE: Modale de chargement avec fermeture automatique
   * Affiche une modale de chargement, exécute une tâche async, puis ferme automatiquement
   */
  async showLoading(config, asyncTask) {
    let loadingModalPromise = null;
    
    try {
      // Afficher la modale de chargement (sans attendre sa résolution)
      loadingModalPromise = this.custom({
        ...config,
        buttons: [], // Pas de boutons
        closeOnEscape: false,
        closeOnOverlayClick: false
      });
      
      // Exécuter la tâche async
      const result = await asyncTask();
      
      // Fermer toutes les modales de chargement
      this.closeAll();
      
      // Petit délai pour éviter les conflits visuels
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return result;
      
    } catch (error) {
      // Fermer la modale en cas d'erreur
      this.closeAll();
      await new Promise(resolve => setTimeout(resolve, 100));
      throw error;
    }
  }
}

// Instance globale
const modalSystem = new ModalSystem();

// ✅ EXPORTS NOMMÉS - Maintenant placés à la fin du fichier
export const showCustom = (config) => modalSystem.custom(config);
export const showConfirm = (options) => modalSystem.confirm(options);
export const showInfo = (message, title, anchorRef) => modalSystem.info(message, title, anchorRef);
export const showSuccess = (message, title, anchorRef) => modalSystem.success(message, title, anchorRef);
export const showError = (message, title, anchorRef) => modalSystem.error(message, title, anchorRef);
export const showWarning = (message, title, anchorRef) => modalSystem.warning(message, title, anchorRef);
export const showPrompt = (options) => modalSystem.prompt(options);
export const showLoading = (config, asyncTask) => modalSystem.showLoading(config, asyncTask);

// Export des constantes
export { MODAL_TYPES, MODAL_SIZES, MODAL_POSITIONS, ModalSystem };

// Export par défaut
export default modalSystem;