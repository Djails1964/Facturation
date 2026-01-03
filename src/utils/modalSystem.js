import { createLogger } from './createLogger';

const log = createLogger('ModalSystem');

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
    
    // ✅ NOUVEAU: Configuration pour le positionnement intelligent
    this.positionConfig = {
      maxHeightPercent: 0.82, // 82vh maximum
      paddingTop: '3vh',
      paddingSides: '20px',
      mobileMaxHeight: 0.88, // 88vh sur mobile
      mobilePadding: '10px'
    };

    this.boundHandleDragMove = this.handleDragMove.bind(this);
    this.boundHandleDragEnd = this.handleDragEnd.bind(this);

    document.addEventListener('mousemove', this.boundHandleDragMove);
    document.addEventListener('mouseup', this.boundHandleDragEnd);
    
    this.initializePositionSystem();
  }

  /**
   * ✅ NOUVEAU: Initialiser le système de positionnement
   */
  initializePositionSystem() {
    // Écouter les changements de taille de fenêtre
    window.addEventListener('resize', this.handleResize.bind(this));
    window.addEventListener('orientationchange', () => {
      setTimeout(() => this.handleResize(), 100);
    });
    
    log.info('🎯 Système de positionnement intelligent initialisé');
  }

  /**
   * ✅ AMÉLIORÉ: Calculer la position optimale avec corrections
   */
  calculateOptimalPosition(anchorRef, modalSize, config = {}) {
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
      isMobile: window.innerWidth <= 768,
      isTablet: window.innerWidth > 768 && window.innerWidth <= 1024,
      isShortScreen: window.innerHeight <= 600
    };
    
    // ✅ CORRECTION: Ajuster la taille selon les contraintes
    const maxHeight = viewport.height * (viewport.isMobile ? 
      this.positionConfig.mobileMaxHeight : 
      this.positionConfig.maxHeightPercent
    );
    
    const adjustedModalSize = {
      width: Math.min(modalSize.width || 600, viewport.width * 0.9),
      height: Math.min(modalSize.height || 400, maxHeight)
    };
    
    // ✅ POSITION CENTRÉE AMÉLIORÉE (par défaut)
    const paddingTop = viewport.isShortScreen ? 
      viewport.height * 0.02 : 
      parseInt(this.positionConfig.paddingTop) * viewport.height / 100;
    
    const paddingSides = viewport.isMobile ? 
      parseInt(this.positionConfig.mobilePadding) : 
      parseInt(this.positionConfig.paddingSides);
    
    let position = {
      top: paddingTop,
      left: Math.max(paddingSides, (viewport.width - adjustedModalSize.width) / 2),
      width: adjustedModalSize.width,
      height: adjustedModalSize.height,
      maxHeight: maxHeight,
      strategy: 'center-improved',
      needsScrollInside: adjustedModalSize.height >= maxHeight
    };
    
    // ✅ POSITIONNEMENT INTELLIGENT PAR ANCRE (si demandé et possible)
    if (anchorRef && anchorRef.current && config.position === 'smart' && !viewport.isMobile) {
      try {
        const smartPosition = this.calculateSmartPosition(anchorRef, adjustedModalSize, viewport);
        
        // Utiliser la position intelligente si elle est valide
        if (smartPosition && this.isPositionValid(smartPosition, adjustedModalSize, viewport)) {
          position = {
            ...smartPosition,
            width: adjustedModalSize.width,
            height: adjustedModalSize.height,
            maxHeight: maxHeight,
            needsScrollInside: adjustedModalSize.height >= maxHeight
          };
        }
      } catch (error) {
        log.warn('⚠️ Erreur calcul position intelligente, fallback centré:', error);
      }
    }
    
    log.debug('📍 Position calculée:', {
      strategy: position.strategy,
      top: position.top,
      left: position.left,
      width: position.width,
      height: position.height,
      maxHeight: position.maxHeight,
      needsScrollInside: position.needsScrollInside,
      viewport: viewport
    });
    
    return position;
  }

  /**
   * ✅ NOUVEAU: Calcul de position intelligente par rapport à l'ancre
   */
  calculateSmartPosition(anchorRef, modalSize, viewport) {
    const rect = anchorRef.current.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    
    const anchorPos = {
      top: rect.top + scrollTop,
      left: rect.left + scrollLeft,
      right: rect.right + scrollLeft,
      bottom: rect.bottom + scrollTop,
      width: rect.width,
      height: rect.height,
      centerX: rect.left + scrollLeft + rect.width / 2,
      centerY: rect.top + scrollTop + rect.height / 2
    };
    
    const gap = 10;
    const positions = [
      // À droite de l'élément
      {
        top: Math.max(20, anchorPos.centerY - modalSize.height / 2),
        left: anchorPos.right + gap,
        strategy: 'smart-right'
      },
      // En dessous de l'élément
      {
        top: anchorPos.bottom + gap,
        left: Math.max(20, anchorPos.centerX - modalSize.width / 2),
        strategy: 'smart-below'
      },
      // À gauche de l'élément
      {
        top: Math.max(20, anchorPos.centerY - modalSize.height / 2),
        left: anchorPos.left - modalSize.width - gap,
        strategy: 'smart-left'
      },
      // Au dessus de l'élément
      {
        top: anchorPos.top - modalSize.height - gap,
        left: Math.max(20, anchorPos.centerX - modalSize.width / 2),
        strategy: 'smart-above'
      }
    ];
    
    // Tester chaque position
    for (const pos of positions) {
      if (this.isPositionValid(pos, modalSize, viewport)) {
        return pos;
      }
    }
    
    return null; // Aucune position intelligente trouvée
  }

  /**
   * ✅ AMÉLIORÉ: Appliquer la position avec corrections CSS
   */
  applyPosition(overlay, container, position) {
    // ✅ APPLIQUER LES CORRECTIONS CSS
    if (position.strategy === 'center-improved') {
      // Position centrée améliorée
      overlay.style.alignItems = 'flex-start';
      overlay.style.justifyContent = 'center';
      overlay.style.padding = `${position.top}px ${this.positionConfig.paddingSides} 20px ${this.positionConfig.paddingSides}`;
      overlay.style.boxSizing = 'border-box';
      overlay.style.overflowY = 'auto';
      
      container.style.position = 'relative';
      container.style.margin = '0 auto';
    } else {
      // Position intelligente
      overlay.style.alignItems = 'flex-start';
      overlay.style.justifyContent = 'flex-start';
      overlay.style.padding = '0';
      overlay.classList.add('smart-positioned');
      
      container.style.position = 'absolute';
      container.style.left = `${position.left}px`;
      container.style.top = `${position.top}px`;
      container.style.margin = '0';
      container.classList.add('positioned');
    }
    
    // ✅ APPLIQUER LES HAUTEURS MAXIMALES
    container.style.maxHeight = `${position.maxHeight}px`;
    container.style.width = `${position.width}px`;
    
    // ✅ ASSURER LE SCROLL INTERNE SI NÉCESSAIRE
    if (position.needsScrollInside) {
      container.classList.add('height-constrained');
      this.enableInternalScroll(container, position.maxHeight);
    }
    
    log.debug('🎨 Styles appliqués:', {
      strategy: position.strategy,
      overlayPadding: overlay.style.padding,
      containerPosition: container.style.position,
      containerMaxHeight: container.style.maxHeight,
      hasInternalScroll: position.needsScrollInside
    });
  }

  /**
   * ✅ NOUVEAU: Activer le scroll interne
   */
  enableInternalScroll(container, maxHeight) {
    const modalForm = container.querySelector('.modal-form');
    if (!modalForm) return;
    
    // Calculer la hauteur disponible pour le contenu
    const header = container.querySelector('.unified-modal-header');
    const footer = container.querySelector('.modal-actions');
    const headerHeight = header ? header.offsetHeight : 54;
    const footerHeight = footer ? footer.offsetHeight : 54;
    const availableHeight = maxHeight - headerHeight - footerHeight - 30; // 30px pour marges
    
    // Appliquer les styles de scroll
    modalForm.style.overflowY = 'auto';
    modalForm.style.overflowX = 'hidden';
    modalForm.style.flex = '1';
    modalForm.style.minHeight = '0';
    modalForm.style.maxHeight = `${availableHeight}px`;
    
    // Assurer que le footer reste visible
    if (footer) {
      footer.style.flexShrink = '0';
      footer.style.position = 'sticky';
      footer.style.bottom = '0';
      footer.style.zIndex = '10';
      footer.style.minHeight = '54px';
      footer.style.alignItems = 'center';
      footer.style.boxSizing = 'border-box';
    }
    
    // Détecter le scroll et ajouter les indicateurs
    setTimeout(() => {
      this.detectAndHandleScroll(modalForm, container);
    }, 100);
    
    log.debug('📏 Scroll interne activé:', {
      availableHeight,
      headerHeight,
      footerHeight,
      maxContentHeight: availableHeight
    });
  }

  /**
   * ✅ NOUVEAU: Détecter et gérer le scroll
   */
  detectAndHandleScroll(modalForm, container) {
    const hasScroll = modalForm.scrollHeight > modalForm.clientHeight;
    
    container.classList.toggle('has-scrollable-content', hasScroll);
    modalForm.classList.toggle('has-scroll', hasScroll);
    
    if (hasScroll) {
      modalForm.setAttribute('tabindex', '0');
      modalForm.setAttribute('aria-label', 'Contenu scrollable');
      this.addScrollIndicator(container);
    }
    
    log.debug('📊 Scroll détecté:', {
      hasScroll,
      scrollHeight: modalForm.scrollHeight,
      clientHeight: modalForm.clientHeight
    });
  }

  /**
   * ✅ NOUVEAU: Ajouter indicateur de scroll
   */
  addScrollIndicator(container) {
    const footer = container.querySelector('.modal-actions');
    if (!footer || footer.querySelector('.scroll-indicator')) return;
    
    const indicator = document.createElement('div');
    indicator.className = 'scroll-indicator';
    indicator.style.cssText = `
      position: absolute;
      top: -12px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 9px;
      color: #666;
      background: rgba(255, 255, 255, 0.95);
      padding: 1px 6px;
      border-radius: 6px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      opacity: 0.8;
      white-space: nowrap;
      pointer-events: none;
      z-index: 11;
    `;
    indicator.textContent = '↑ Contenu scrollable ci-dessus ↑';
    
    footer.style.position = 'relative';
    footer.appendChild(indicator);
    
    // Animation subtile
    this.animateScrollIndicator(indicator);
  }

  /**
   * ✅ NOUVEAU: Animer l'indicateur de scroll
   */
  animateScrollIndicator(indicator) {
    let opacity = 0.8;
    let direction = 1;
    
    const animate = () => {
      opacity += direction * 0.1;
      if (opacity >= 1) direction = -1;
      if (opacity <= 0.7) direction = 1;
      indicator.style.opacity = opacity;
    };
    
    const interval = setInterval(animate, 2000);
    
    // Nettoyer après 10 secondes
    setTimeout(() => {
      clearInterval(interval);
    }, 10000);
  }

  /**
   * ✅ AMÉLIORÉ: Ajustement post-rendu avec corrections
   */
  adjustModalAfterRender(container, originalPosition) {
    const rect = container.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
      isMobile: window.innerWidth <= 768
    };
    
    let wasAdjusted = false;
    
    // ✅ Vérifier si la modal dépasse en bas
    if (rect.bottom > viewport.height - 20) {
      const newTop = Math.max(20, viewport.height - rect.height - 20);
      container.style.top = `${newTop}px`;
      wasAdjusted = true;
      
      // Si elle dépasse encore, forcer le scroll interne
      if (rect.height > viewport.height - 40) {
        const maxHeight = viewport.height - 40;
        container.style.maxHeight = `${maxHeight}px`;
        this.enableInternalScroll(container, maxHeight);
        wasAdjusted = true;
      }
    }
    
    // ✅ Vérifier si la modal dépasse à droite
    if (rect.right > viewport.width - 20) {
      const newLeft = Math.max(20, viewport.width - rect.width - 20);
      container.style.left = `${newLeft}px`;
      wasAdjusted = true;
    }
    
    // ✅ Sur mobile, forcer les corrections
    if (viewport.isMobile) {
      this.applyMobileCorrections(container);
      wasAdjusted = true;
    }
    
    // ✅ Ajouter un indicateur si repositionnée
    if (wasAdjusted && originalPosition.strategy !== 'center-improved') {
      this.addRepositionIndicator(container);
    }
    
    log.debug('🔧 Ajustement post-rendu:', {
      wasAdjusted,
      finalRect: container.getBoundingClientRect(),
      strategy: originalPosition.strategy
    });
  }

  /**
   * ✅ NOUVEAU: Appliquer les corrections mobiles
   */
  applyMobileCorrections(container) {
    const overlay = container.closest('.unified-modal-overlay');
    
    if (overlay) {
      overlay.style.padding = this.positionConfig.mobilePadding;
    }
    
    container.style.width = `calc(100vw - ${parseInt(this.positionConfig.mobilePadding) * 2}px)`;
    container.style.maxWidth = 'none';
    container.style.maxHeight = `${window.innerHeight * this.positionConfig.mobileMaxHeight}px`;
    
    const modalForm = container.querySelector('.modal-form');
    if (modalForm) {
      modalForm.style.maxHeight = `calc(${window.innerHeight * this.positionConfig.mobileMaxHeight}px - 96px)`;
      modalForm.style.padding = '12px';
    }
    
    const header = container.querySelector('.unified-modal-header');
    if (header) {
      header.style.minHeight = '48px';
      header.style.padding = '12px 15px';
    }
    
    const footer = container.querySelector('.modal-actions');
    if (footer) {
      footer.style.minHeight = '48px';
      footer.style.padding = '10px 15px';
      footer.style.justifyContent = 'center';
    }
    
    log.debug('📱 Corrections mobiles appliquées');
  }

  /**
   * ✅ NOUVEAU: Gérer le redimensionnement
   */
  handleResize() {
    clearTimeout(this.resizeTimeout);
    this.resizeTimeout = setTimeout(() => {
      log.info('📐 Redimensionnement détecté, repositionnement des modales...');
      
      this.activeModals.forEach((modal, modalId) => {
        const { container, config } = modal;
        
        if (container && container.isConnected) {
          // Recalculer et appliquer la position
          const estimatedSize = this.estimateModalSize(config);
          const newPosition = this.calculateOptimalPosition(
            config.anchorRef,
            estimatedSize,
            { position: config.position || 'smart' }
          );
          
          this.applyPosition(modal.overlay, container, newPosition);
          this.adjustModalAfterRender(container, newPosition);
        }
      });
    }, 250);
  }

  /**
   * ✅ MAINTENU: Méthodes drag & drop existantes (inchangées)
   */
  initializeDragAndDrop(container) {
    // ✅ Ne pas activer le drag sur mobile pour éviter les conflits
    if (window.innerWidth <= 768) {
      log.info('📱 Drag & drop désactivé sur mobile');
      return;
    }
    
    const header = container.querySelector('.unified-modal-header');
    if (!header) return;
    
    header.style.cursor = 'move';
    header.style.userSelect = 'none';
    
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
    
    // ✅ IMPORTANT: Attachement correct des événements
    const boundDragStart = this.handleDragStart.bind(this);
    const boundDragMove = this.handleDragMove.bind(this);
    const boundDragEnd = this.handleDragEnd.bind(this);
    
    header.addEventListener('mousedown', boundDragStart);
    
    // ✅ NOUVEAU: Stocker les références pour pouvoir les nettoyer
    container._dragHandlers = {
      boundDragStart,
      boundDragMove,
      boundDragEnd
    };
    
    // ✅ Les événements mousemove et mouseup sont déjà attachés globalement dans le constructeur
    // Pas besoin de les réattacher ici
    
    log.info('🖱️ Drag & drop initialisé pour la modal');
  }

  // ✅ Les méthodes de drag existantes restent inchangées
  handleDragStart(e) {
    if (e.button !== 0) return;
    
    const container = e.target.closest('.unified-modal-container');
    if (!container) return;
    
    e.preventDefault();
    e.stopPropagation(); // ✅ AJOUT: Empêcher la propagation
    
    const rect = container.getBoundingClientRect();
    
    this.dragState = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      element: container,
      hasMoved: false // ✅ NOUVEAU: Tracker si la modal a bougé
    };
    
    container.style.transition = 'none';
    container.style.zIndex = (this.zIndexCounter + 100).toString();
    document.body.style.userSelect = 'none';
    container.classList.add('dragging');
    
    log.debug('🖱️ Début du drag détecté');
  }

  handleDragMove(e) {
    if (!this.dragState.isDragging || !this.dragState.element) return;
    
    e.preventDefault();
    e.stopPropagation(); // ✅ AJOUT: Empêcher la propagation
    
    // ✅ NOUVEAU: Détecter si on a vraiment bougé
    const moveThreshold = 5; // pixels
    const deltaX = Math.abs(e.clientX - this.dragState.startX);
    const deltaY = Math.abs(e.clientY - this.dragState.startY);
    
    if (deltaX > moveThreshold || deltaY > moveThreshold) {
      this.dragState.hasMoved = true;
    }
    
    const newX = e.clientX - this.dragState.offsetX;
    const newY = e.clientY - this.dragState.offsetY;
    
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

  handleDragEnd(e) {
    if (!this.dragState.isDragging) return;
    
    const hasMoved = this.dragState.hasMoved; // ✅ SAUVEGARDER avant reset
    const element = this.dragState.element;
    
    if (element) {
      element.style.transition = '';
      element.classList.remove('dragging');
    }
    
    document.body.style.userSelect = '';
    
    // ✅ NOUVEAU: Si on a bougé, empêcher les clics pendant un court moment
    if (hasMoved && element) {
      log.debug('🚫 Drag terminé avec mouvement - désactivation temporaire des clics');
      
      // Désactiver temporairement les événements de clic
      element.style.pointerEvents = 'none';
      
      // Réactiver après un délai court
      setTimeout(() => {
        if (element && element.isConnected) {
          element.style.pointerEvents = '';
          log.debug('✅ Clics réactivés après drag');
        }
      }, 100);
    }
    
    // ✅ RESET du state
    this.dragState = {
      isDragging: false,
      startX: 0,
      startY: 0,
      offsetX: 0,
      offsetY: 0,
      element: null,
      hasMoved: false
    };
    
    log.debug('🏁 Drag terminé, hasMoved:', hasMoved);
  }


  /**
   * ✅ MAINTENU: Estimation de taille (inchangée mais améliorée)
   */
  estimateModalSize(config) {
    const sizeMap = {
      small: { width: 400, height: 300 },
      medium: { width: 600, height: 400 },
      large: { width: 800, height: 500 },
      xlarge: { width: 1000, height: 600 }
    };
    
    const baseSize = { ...sizeMap[config.size] || sizeMap.medium };
    
    // ✅ Ajustements selon le contenu
    if (config.inputs && config.inputs.length > 3) {
      baseSize.height += config.inputs.length * 60;
    }
    
    if (config.details && Object.keys(config.details).length > 5) {
      baseSize.height += Object.keys(config.details).length * 30;
    }
    
    if (config.content && config.content.length > 500) {
      baseSize.height += Math.min(200, config.content.length / 3);
    }
    
    // ✅ Contraintes de taille selon le viewport
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
      isMobile: window.innerWidth <= 768
    };
    
    if (viewport.isMobile) {
      baseSize.width = Math.min(baseSize.width, viewport.width * 0.95);
      baseSize.height = Math.min(baseSize.height, viewport.height * this.positionConfig.mobileMaxHeight);
    } else {
      baseSize.width = Math.min(baseSize.width, viewport.width * 0.9);
      baseSize.height = Math.min(baseSize.height, viewport.height * this.positionConfig.maxHeightPercent);
    }
    
    return baseSize;
  }

  /**
   * ✅ MAINTENU: Méthodes HTML et utilitaires (inchangées)
   */
  // [Toutes les méthodes generateModalHTML, generateInputsHTML, etc. restent identiques]
  generateModalHTML(config) {

    // ✅ MODIFICATION: Ajouter un indicateur 🎯 en développement uniquement
    const isDev = process.env.NODE_ENV === 'development';
    const unifiedBadge = isDev ? '🎯 ' : '';

    let html = `
      <div class="unified-modal-header">
        <h3 class="unified-modal-title">${unifiedBadge}${config.title || ''}</h3>
        <button class="unified-modal-close" data-action="close">×</button>
      </div>
      <div class="modal-form">
    `;

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

    if (config.details) {
      html += `<div class="details-container">${this.generateDetailsHTML(config.details)}</div>`;
    }

    html += `</div>`;

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

  getNotificationClass(type) {
    switch (type) {
      case 'success': return 'modal-success';
      case 'error': return 'modal-error';
      case 'warning': return 'notification warning';
      case 'info':
      default: return 'notification info';
    }
  }

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
   * ✅ AMÉLIORÉ: Méthode principale show avec positionnement intelligent
   */
  show(config) {
    return new Promise((resolve) => {
      const modalId = `modal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      log.info('🎭 Ouverture modal:', {
        id: modalId,
        type: config.type,
        size: config.size,
        position: config.position,
        hasAnchor: !!config.anchorRef
      });
      
      // ✅ Créer l'overlay avec les bonnes classes
      const overlay = document.createElement('div');
      overlay.className = 'unified-modal-overlay';
      overlay.dataset.modalId = modalId;
      
      // ✅ Estimation de la taille avec les nouvelles contraintes
      const estimatedSize = this.estimateModalSize(config);
      
      // ✅ Calculer la position optimale avec corrections
      const position = this.calculateOptimalPosition(
        config.anchorRef, 
        estimatedSize, 
        { position: config.position || 'center' }
      );
      
      // ✅ Créer le conteneur avec les bonnes classes
      const container = document.createElement('div');
      container.className = `unified-modal-container ${config.size || 'medium'}`;
      container.dataset.modalId = modalId;
      
      // ✅ Marquer si c'est une modal contrainte
      if (position.needsScrollInside) {
        container.classList.add('height-constrained');
      }
      
      // ✅ Générer le HTML
      container.innerHTML = this.generateModalHTML(config);
      overlay.appendChild(container);
      
      // ✅ Ajouter au DOM
      document.body.appendChild(overlay);
      
      // ✅ Appliquer la position calculée APRÈS ajout au DOM
      this.applyPosition(overlay, container, position);
      
      // ✅ Initialiser le drag & drop (si pas mobile)
      this.initializeDragAndDrop(container);
      
      // ✅ Ajustements post-rendu
      requestAnimationFrame(() => {
        this.adjustModalAfterRender(container, position);
      });
      
      // ✅ Stocker dans la map avec config
      this.activeModals.set(modalId, {
        overlay,
        container,
        resolve,
        config: {
          ...config,
          position: position.strategy // Sauvegarder la stratégie utilisée
        }
      });
      
      // ✅ Event listeners
      this.attachEventListeners(modalId, config);
      
      // ✅ Animations d'apparition
      requestAnimationFrame(() => {
        overlay.classList.add('show');
        container.classList.add('show');
        
        // Focus management après animation
        setTimeout(() => {
          this.manageFocus(container);
        }, 100);
      });
      
      log.info('✅ Modal créée avec succès:', {
        id: modalId,
        position: position.strategy,
        size: estimatedSize,
        hasScrollInside: position.needsScrollInside
      });
    });
  }

  /**
   * ✅ MAINTENU: Event listeners (avec améliorations mineures)
   */
  attachEventListeners(modalId, config) {
    const modal = this.activeModals.get(modalId);
    if (!modal) return;

    const { overlay, container } = modal; // ✅ SUPPRIMÉ: resolve (non utilisé)

    // ✅ Gestionnaire de boutons AMÉLIORÉ avec protection drag
    const handleButtonClick = (e) => {
      const action = e.target.dataset.action;
      
      if (!action || !e.target.matches('button[data-action]')) {
        return;
      }

      // ✅ Vérifier si on vient de terminer un drag
      if (this.dragState.isDragging || container.style.pointerEvents === 'none') {
        log.debug('🚫 Clic ignoré - drag en cours ou récemment terminé');
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      log.info('🔘 Action modal:', action, 'sur modal:', modalId);

      e.preventDefault();
      e.stopPropagation();

      const executeAction = () => {
        if (action === 'close') {
          this.close(modalId, { action: 'close' });
          return;
        }

        // Collecter les données du formulaire
        const form = container.querySelector('#modalForm, #emailForm, #paymentForm, form');
        let formData = {};
        
        if (form) {
          const formDataObj = new FormData(form);
          for (let [key, value] of formDataObj.entries()) {
            formData[key] = value;
          }
        }

        this.close(modalId, { action, data: formData });
      };

      if (action === 'close' || action === 'cancel') {
        executeAction();
      } else {
        setTimeout(executeAction, 50);
      }
    };

    // ✅ Fermeture par Escape
    const handleEscape = (e) => {
      if (e.key === 'Escape' && config.closeOnEscape !== false) {
        const activeModal = document.querySelector('.unified-modal-overlay:last-child');
        if (activeModal && activeModal.dataset.modalId === modalId) {
          this.close(modalId, { action: 'escape' });
        }
      }
    };

    // ✅ Fermeture par overlay AMÉLIORÉE
    const handleOverlayClick = (e) => {
      // Ne pas fermer si on vient de draguer
      if (this.dragState.isDragging || container.style.pointerEvents === 'none') {
        log.debug('🚫 Clic overlay ignoré - drag en cours');
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      
      if (e.target === overlay && config.closeOnOverlayClick !== false) {
        setTimeout(() => {
          if (e.target === overlay) {
            this.close(modalId, { action: 'overlay' });
          }
        }, 50);
      }
    };

    // ✅ Attachement des événements avec capture pour les boutons
    container.addEventListener('click', handleButtonClick, true);
    document.addEventListener('keydown', handleEscape);
    overlay.addEventListener('click', handleOverlayClick);

    // Stocker les handlers
    modal.eventHandlers = {
      handleButtonClick,
      handleEscape,
      handleOverlayClick
    };

    // ✅ Appeler onMount avec délai
    if (config.onMount && typeof config.onMount === 'function') {
      setTimeout(() => {
        try {
          config.onMount(container);
        } catch (error) {
          log.error('❌ Erreur dans onMount:', error);
        }
      }, 150);
    }
  }

    /**
     * ✅ MAINTENU: Gestion du focus (inchangée)
     */
    manageFocus(container) {
      const focusableElements = container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    }

    /**
     * ✅ MAINTENU: Fermeture (avec nettoyage amélioré)
     */
    close(modalId, result = {}) {
      const modal = this.activeModals.get(modalId);
      if (!modal) return;

      const { overlay, container, resolve, eventHandlers } = modal;

      log.debug('🚪 Fermeture modal:', modalId, 'avec résultat:', result);

      // ✅ Supprimer les event listeners
      if (eventHandlers) {
        container.removeEventListener('click', eventHandlers.handleButtonClick, true);
        document.removeEventListener('keydown', eventHandlers.handleEscape);
        overlay.removeEventListener('click', eventHandlers.handleOverlayClick);
      }

      // ✅ Animation de fermeture
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
     * ✅ MAINTENU: Utilitaires (inchangés)
     */
    isPositionValid(position, modal, viewport) {
      const margin = 20;
      
      return (
        position.left >= margin &&
        position.top >= margin &&
        position.left + modal.width <= viewport.width - margin &&
        position.top + modal.height <= viewport.height - margin
      );
    }

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
      
      setTimeout(() => {
        if (indicator.parentNode) {
          indicator.parentNode.removeChild(indicator);
        }
      }, 3000);
    }

    closeAll() {
      const modalIds = Array.from(this.activeModals.keys());
      modalIds.forEach(id => this.close(id, { action: 'closeAll' }));
    }

    /**
     * ✅ MAINTENU: Méthodes de convenance (inchangées)
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
     * ✅ AMÉLIORÉ: Modale de chargement avec positionnement
     */
    async showLoading(config, asyncTask) {
      // let loadingModalPromise = null;
      
      try {
        // ✅ Configuration de loading avec positionnement intelligent
        const loadingConfig = {
          type: MODAL_TYPES.CUSTOM,
          title: config.title || "Chargement...",
          content: config.content || this.createLoadingContent(),
          size: config.size || MODAL_SIZES.SMALL,
          position: config.position || MODAL_POSITIONS.CENTER, // Centré pour loading
          anchorRef: config.anchorRef || null,
          buttons: [],
          closeOnEscape: false,
          closeOnOverlayClick: false,
          ...config
        };
        
        // Afficher la modale de chargement
        this.show(loadingConfig);
        
        // Exécuter la tâche async
        const result = await asyncTask();
        
        // Fermer toutes les modales de chargement
        this.closeAll();
        
        // Délai pour éviter les conflits visuels
        await new Promise(resolve => setTimeout(resolve, 100));
        
        return result;
        
      } catch (error) {
        this.closeAll();
        await new Promise(resolve => setTimeout(resolve, 100));
        throw error;
      }
    }

    /**
     * ✅ NOUVEAU: Créer le contenu de loading
     */
    createLoadingContent(message = "Opération en cours...") {
      return `
        <div class="unified-modal-loading">
          <div class="unified-modal-spinner"></div>
          <div class="unified-modal-loading-text">${message}</div>
        </div>
      `;
    }

    /**
     * ✅ NOUVEAUX: Méthodes utilitaires pour debug et configuration
     */
    getActiveModalsInfo() {
      const info = [];
      this.activeModals.forEach((modal, id) => {
        const rect = modal.container.getBoundingClientRect();
        info.push({
          id,
          type: modal.config.type,
          size: modal.config.size,
          position: modal.config.position,
          rect: {
            width: rect.width,
            height: rect.height,
            top: rect.top,
            left: rect.left
          },
          hasScroll: modal.container.classList.contains('has-scrollable-content')
        });
      });
      return info;
    }

    updatePositionConfig(newConfig) {
      this.positionConfig = {
        ...this.positionConfig,
        ...newConfig
      };
      log.debug('⚙️ Configuration positionnement mise à jour:', this.positionConfig);
    }

    // ✅ MÉTHODE DE TEST pour vérifier le positionnement
    testPositioning() {
      const info = {
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
          isMobile: window.innerWidth <= 768
        },
        config: this.positionConfig,
        activeModals: this.getActiveModalsInfo(),
        tests: []
      };

      // Test 1: Vérifier que les modales actives ont la bonne hauteur
      this.activeModals.forEach((modal, id) => {
        const rect = modal.container.getBoundingClientRect();
        const maxHeight = window.innerHeight * (window.innerWidth <= 768 ? 
          this.positionConfig.mobileMaxHeight : 
          this.positionConfig.maxHeightPercent
        );
        
        info.tests.push({
          modalId: id,
          test: 'Hauteur respectée',
          passed: rect.height <= maxHeight + 10, // 10px de tolérance
          details: `${Math.round(rect.height)}px / max ${Math.round(maxHeight)}px`
        });

        // Test 2: Vérifier que les boutons sont visibles
        const footer = modal.container.querySelector('.modal-actions');
        if (footer) {
          const footerRect = footer.getBoundingClientRect();
          const isVisible = footerRect.bottom <= window.innerHeight;
          
          info.tests.push({
            modalId: id,
            test: 'Boutons visibles',
            passed: isVisible,
            details: `Footer bottom: ${Math.round(footerRect.bottom)}px / viewport: ${window.innerHeight}px`
          });
        }
      });

      log.debug('🧪 Test de positionnement:', info);
      return info;
    }
  }

// ✅ Instance globale
const modalSystem = new ModalSystem();

// ✅ EXPORTS - Maintenant avec les améliorations
export const showCustom = (config) => modalSystem.custom(config);
export const showConfirm = (options) => modalSystem.confirm(options);
export const showInfo = (message, title, anchorRef) => modalSystem.info(message, title, anchorRef);
export const showSuccess = (message, title, anchorRef) => modalSystem.success(message, title, anchorRef);
export const showError = (message, title, anchorRef) => modalSystem.error(message, title, anchorRef);
export const showWarning = (message, title, anchorRef) => modalSystem.warning(message, title, anchorRef);
export const showPrompt = (options) => modalSystem.prompt(options);
export const showLoading = (config, asyncTask) => modalSystem.showLoading(config, asyncTask);

// ✅ NOUVEAUX EXPORTS pour debug et contrôle
export const testModalPositioning = () => modalSystem.testPositioning();
export const getActiveModalsInfo = () => modalSystem.getActiveModalsInfo();
export const updateModalConfig = (config) => modalSystem.updatePositionConfig(config);
export const closeAllModals = () => modalSystem.closeAll();

// Export des constantes
export { MODAL_TYPES, MODAL_SIZES, MODAL_POSITIONS, ModalSystem };

// Export par défaut
export default modalSystem;