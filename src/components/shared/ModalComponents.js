// src/components/shared/ModalComponents.js - VERSION ÉTENDUE

/**
 * Composants réutilisables pour les modales
 * Évite la duplication de code HTML entre les différentes modales
 */

/**
 * Section détails de la facture (utilisée dans toutes les modales)
 */
export const createFactureDetailsSection = (facture, formatMontant, formatDate) => {
    // ✅ CORRECTION: Vérifier que la facture existe et a les propriétés nécessaires
    if (!facture) {
        console.warn('createFactureDetailsSection: facture est undefined');
        return '<div class="details-container"><!-- Détails non disponibles --></div>';
    }

    console.log('📄 createFactureDetailsSection - Données reçues:', facture);

    // ✅ CORRECTION: Vérifier les propriétés optionnelles
    const numeroFacture = facture.numeroFacture || 'N/A';
    const clientNom = facture.client ? `${facture.client.prenom || ''} ${facture.client.nom || ''}`.trim() : 'N/A';
    const dateFacture = facture.dateFacture && formatDate ? formatDate(facture.dateFacture) : (facture.dateFacture || 'N/A');
    const montant = (facture.montantTotal || facture.montantTotal) && formatMontant ? 
        formatMontant(facture.montantTotal || facture.montantTotal) : 
        (facture.montantTotal || facture.montantTotal || 'N/A');
    const etat = facture.etat || 'N/A';

    return `
        <div class="details-container">
            <div class="info-row">
                <div class="info-label">N° Facture:</div>
                <div class="info-value">${numeroFacture}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Client:</div>
                <div class="info-value">${clientNom}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Date facture:</div>
                <div class="info-value">${dateFacture}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Montant:</div>
                <div class="info-value">${montant} CHF</div>
            </div>
            <div class="info-row">
                <div class="info-label">État:</div>
                <div class="info-value">${etat}</div>
            </div>
        </div>
    `;
};

/**
 * Section d'introduction avec titre personnalisé
 */
export const createIntroSection = (title, factureNumber) => {
    return `
        <div class="fc-intro">
            ${title} ${factureNumber ? `n° ${factureNumber}` : ''}
        </div>
    `;
};

/**
 * Section pièce jointe PDF (utilisée dans email et impression)
 */
export const createPieceJointeSection = (pdfExiste, pdfResult, factureData, showPreviewButton = true) => {
    return `
        <div style="margin: 15px 0; padding: 10px; background-color: ${pdfExiste ? '#f8f9fa' : '#f8d7da'}; border: 1px solid ${pdfExiste ? '#e9ecef' : '#f5c6cb'}; border-radius: 4px;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 18px;">${pdfExiste ? '📄' : '❌'}</span>
                    <div>
                        <strong>Fichier PDF:</strong> Facture_${factureData.numeroFacture}.pdf
                        <br>
                        <small style="color: ${pdfExiste ? '#6c757d' : '#721c24'};">
                            ${pdfExiste 
                                ? 'Fichier PDF disponible'
                                : `⚠️ ${pdfResult?.message || 'PDF non trouvé'}`
                            }
                        </small>
                    </div>
                </div>
                ${showPreviewButton ? `
                <button 
                    type="button" 
                    id="previewPdfBtn" 
                    style="
                        padding: 8px 16px; 
                        background-color: ${pdfExiste ? 'var(--color-primary, #721c24)' : '#6c757d'}; 
                        color: white; 
                        border: none; 
                        border-radius: 4px; 
                        cursor: ${pdfExiste ? 'pointer' : 'not-allowed'};
                        font-size: 14px;
                        opacity: ${pdfExiste ? '1' : '0.6'};
                        transition: background-color 0.2s ease;
                    "
                    ${pdfExiste ? `
                        onmouseover="this.style.backgroundColor='#5a1519'"
                        onmouseout="this.style.backgroundColor='var(--color-primary, #721c24)'"
                    ` : 'disabled'}
                >
                    📖 ${pdfExiste ? 'Visualiser' : 'Non disponible'}
                </button>
                ` : ''}
            </div>
        </div>
    `;
};

/**
 * Contenu de chargement générique
 */
export const createLoadingContent = (message = "Opération en cours...") => {
    return `
        <div class="unified-modal-loading">
            <div class="unified-modal-spinner"></div>
            <div class="unified-modal-loading-text">${message}</div>
        </div>
    `;
};

/**
 * Section d'avertissement générique
 */
export const createWarningSection = (title, message, type = 'warning') => {
    const colors = {
        warning: { bg: '#fff3cd', border: '#ffeeba', text: '#856404' },
        error: { bg: '#f8d7da', border: '#f5c6cb', text: '#721c24' },
        info: { bg: '#d1ecf1', border: '#bee5eb', text: '#0c5460' },
        success: { bg: '#d4edda', border: '#c3e6cb', text: '#155724' }
    };
    
    const color = colors[type] || colors.info;
    
    return `
        <div class="modal-${type}" style="
            margin: 15px 0; 
            padding: 10px; 
            border-radius: 4px; 
            background-color: ${color.bg}; 
            border: 1px solid ${color.border}; 
            color: ${color.text};
        ">
            ${title ? `<strong>${title}</strong><br>` : ''}
            ${message}
        </div>
    `;
};

// ========================================
// ✅ NOUVEAUX COMPOSANTS POUR LES DATES
// ========================================

/**
 * Champ de date avec modal picker
 */
export const createDateInputWithModal = (id, label, value = '', required = true, config = {}) => {
    const {
        readOnly = false,
        multiSelect = false,
        minDate = null,
        maxDate = null,
        context = 'default',
        helpText = null
    } = config;
    
    return `
        <div class="input-group date-input-wrapper">
            <input 
                type="text" 
                name="${id}" 
                id="${id}"
                value="${value}"
                ${required ? 'required' : ''}
                placeholder=" "
                ${readOnly ? 'readonly' : ''}
                data-date-config='${JSON.stringify({
                    multiSelect,
                    minDate: minDate ? minDate.toISOString() : null,
                    maxDate: maxDate ? maxDate.toISOString() : null,
                    context
                })}'
                style="cursor: ${readOnly ? 'default' : 'pointer'};"
            />
            <label for="${id}" ${required ? 'class="required"' : ''}>${label}</label>
            ${!readOnly ? `
                <span 
                    class="date-picker-icon"
                    data-date-trigger="${id}"
                    title="Ouvrir le calendrier"
                    style="
                        position: absolute;
                        right: 12px;
                        top: 50%;
                        transform: translateY(-50%);
                        cursor: pointer;
                        font-size: 16px;
                        color: #666;
                        user-select: none;
                        z-index: 1;
                        transition: color 0.2s ease;
                    "
                    onmouseover="this.style.color='var(--color-primary, #800000)'"
                    onmouseout="this.style.color='#666'"
                >
                    📅
                </span>
            ` : ''}
            ${helpText ? `
                <small style="
                    display: block;
                    margin-top: 5px;
                    color: #666;
                    font-size: 12px;
                ">${helpText}</small>
            ` : ''}
        </div>
    `;
};

/**
 * Section d'information sur les dates sélectionnées
 */
export const createSelectedDatesInfo = (selectedDates = [], title = "Dates sélectionnées") => {
    return `
        <div class="details-container" id="selected-dates-info">
            <div class="info-row">
                <div class="info-label">${title}:</div>
                <div class="info-value" id="selected-count">${selectedDates.length}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Détail:</div>
                <div class="info-value" id="selected-list">
                    ${selectedDates.length === 0 
                        ? 'Aucune date sélectionnée' 
                        : selectedDates.map(date => 
                            typeof date === 'string' ? date : date.toLocaleDateString('fr-CH')
                          ).join(', ')
                    }
                </div>
            </div>
        </div>
    `;
};

/**
 * Container pour DatePicker React
 */
export const createDatePickerContainer = (config = {}) => {
    const {
        multiSelect = false,
        showInfo = true,
        initialDates = []
    } = config;
    
    return `
        <div class="modal-form">
            <div id="datepicker-container" style="
                display: flex;
                justify-content: center;
                margin: 20px 0;
                border: 1px solid #ddd;
                border-radius: 4px;
                padding: 15px;
                background: white;
            ">
                <!-- Le DatePicker React sera inséré ici -->
            </div>
            
            ${showInfo ? createSelectedDatesInfo(initialDates) : ''}
        </div>
    `;
};

/**
 * Calendrier HTML de fallback (si React DatePicker ne fonctionne pas)
 */
export const createFallbackCalendar = (year, month, onDateSelect, config = {}) => {
    const {
        minDate = null,
        maxDate = null,
        selectedDates = [],
        multiSelect = false
    } = config;
    
    const today = new Date();
    const monthNames = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    
    return `
        <div class="fallback-calendar" style="
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 15px;
            background: white;
            font-family: inherit;
            max-width: 320px;
            margin: 0 auto;
        ">
            <!-- Header avec navigation -->
            <div style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
                padding-bottom: 10px;
                border-bottom: 1px solid #eee;
            ">
                <button 
                    type="button" 
                    onclick="navigateMonth(-1)"
                    style="
                        background: none;
                        border: 1px solid #ddd;
                        border-radius: 4px;
                        padding: 5px 10px;
                        cursor: pointer;
                        font-size: 14px;
                    "
                >
                    ‹
                </button>
                <div style="
                    font-weight: 600;
                    font-size: 16px;
                    color: var(--color-primary, #800000);
                ">
                    ${monthNames[month]} ${year}
                </div>
                <button 
                    type="button" 
                    onclick="navigateMonth(1)"
                    style="
                        background: none;
                        border: 1px solid #ddd;
                        border-radius: 4px;
                        padding: 5px 10px;
                        cursor: pointer;
                        font-size: 14px;
                    "
                >
                    ›
                </button>
            </div>
            
            <!-- Jours de la semaine -->
            <div style="
                display: grid;
                grid-template-columns: repeat(7, 1fr);
                gap: 2px;
                text-align: center;
                margin-bottom: 10px;
            ">
                <div style="font-weight: 600; padding: 8px; color: #666; font-size: 12px;">L</div>
                <div style="font-weight: 600; padding: 8px; color: #666; font-size: 12px;">M</div>
                <div style="font-weight: 600; padding: 8px; color: #666; font-size: 12px;">M</div>
                <div style="font-weight: 600; padding: 8px; color: #666; font-size: 12px;">J</div>
                <div style="font-weight: 600; padding: 8px; color: #666; font-size: 12px;">V</div>
                <div style="font-weight: 600; padding: 8px; color: #666; font-size: 12px;">S</div>
                <div style="font-weight: 600; padding: 8px; color: #666; font-size: 12px;">D</div>
            </div>
            
            <!-- Grille des jours -->
            <div id="calendar-days" style="
                display: grid;
                grid-template-columns: repeat(7, 1fr);
                gap: 2px;
                text-align: center;
            ">
                <!-- Les jours seront générés dynamiquement -->
            </div>
            
            <!-- Instructions -->
            <div style="
                text-align: center;
                margin-top: 15px;
                font-size: 12px;
                color: #666;
                padding-top: 10px;
                border-top: 1px solid #eee;
            ">
                ${multiSelect 
                    ? 'Cliquez sur les dates pour les sélectionner/désélectionner'
                    : 'Cliquez sur une date pour la sélectionner'
                }
            </div>
        </div>
    `;
};

/**
 * Formulaire de base avec champ email
 */
export const createEmailInput = (id, label, value = '', required = true, disabled = false) => {
    return `
        <div class="input-group">
            <input 
                type="email" 
                name="${id}" 
                id="${id}"
                value="${value}"
                ${required ? 'required' : ''}
                placeholder=" "
                ${disabled ? 'disabled style="opacity: 0.6;"' : ''}
            />
            <label for="${id}" ${required ? 'class="required"' : ''}>${label}</label>
        </div>
    `;
};

/**
 * Champ de texte générique
 */
export const createTextInput = (id, label, value = '', type = 'text', required = true, disabled = false, attributes = '') => {
    return `
        <div class="input-group">
            <input 
                type="${type}" 
                name="${id}" 
                id="${id}"
                value="${value}"
                ${required ? 'required' : ''}
                placeholder=" "
                ${disabled ? 'disabled style="opacity: 0.6;"' : ''}
                ${attributes}
            />
            <label for="${id}" ${required ? 'class="required"' : ''}>${label}</label>
        </div>
    `;
};

/**
 * Zone de texte générique
 */
export const createTextarea = (id, label, value = '', rows = 4, required = true, disabled = false) => {
    return `
        <div class="input-group">
            <textarea 
                name="${id}" 
                id="${id}"
                rows="${rows}"
                ${required ? 'required' : ''}
                placeholder=" "
                ${disabled ? 'disabled style="opacity: 0.6;"' : ''}
            >${value}</textarea>
            <label for="${id}" ${required ? 'class="required"' : ''}>${label}</label>
        </div>
    `;
};

/**
 * Liste déroulante générique
 */
export const createSelect = (id, label, options, selectedValue = '', required = true, disabled = false) => {
    const optionsHtml = options.map(option => {
        const value = typeof option === 'string' ? option : option.value;
        const text = typeof option === 'string' ? option : option.text;
        const selected = value === selectedValue ? 'selected' : '';
        return `<option value="${value}" ${selected}>${text}</option>`;
    }).join('');
    
    return `
        <div class="input-group">
            <select 
                name="${id}" 
                id="${id}" 
                ${required ? 'required' : ''}
                ${disabled ? 'disabled style="opacity: 0.6;"' : ''}
            >
                ${!required ? '<option value="">Sélectionner...</option>' : ''}
                ${optionsHtml}
            </select>
            <label for="${id}" ${required ? 'class="required"' : ''}>${label}</label>
        </div>
    `;
};

/**
 * Section de développement avec bypass
 */
export const createDevBypassSection = (message = "Simuler l'opération sans l'exécuter réellement") => {
    return `
        <div style="margin: 15px 0; padding: 15px; background-color: #e7f3ff; border: 1px solid #b8daff; border-radius: 4px;">
            <h4 style="margin: 0 0 10px 0; color: #004085; font-size: 14px;">
                🛠️ Options de Développement
            </h4>
            <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: #004085; cursor: pointer;">
                <input 
                    type="checkbox" 
                    name="bypassCapture" 
                    id="bypassCapture"
                    style="margin: 0;"
                />
                <span>
                    <strong>Mode simulation</strong>
                    <br>
                    <small style="color: #666;">${message}</small>
                </span>
            </label>
        </div>
    `;
};

/**
 * Boutons modaux standards
 */
export const createModalButtons = (config) => {
    const {
        cancelText = "Annuler",
        submitText = "Confirmer",
        submitDisabled = false,
        submitClass = "primary",
        showCancel = true,
        extraButtons = []
    } = config;
    
    const buttons = [];
    
    if (showCancel) {
        buttons.push({
            text: cancelText,
            action: "cancel",
            className: "secondary"
        });
    }
    
    // Ajouter les boutons supplémentaires
    buttons.push(...extraButtons);
    
    buttons.push({
        text: submitText,
        action: "submit",
        className: submitClass,
        disabled: submitDisabled
    });
    
    return buttons;
};

/**
 * Configuration complète d'une modal simple
 */
export const createSimpleModalConfig = (title, facture, options = {}) => {
    const {
        intro = "",
        content = "",
        warningMessage = null,
        warningType = "warning",
        showPdf = false,
        pdfInfo = null,
        buttons = null,
        size = "medium"
    } = options;
    
    let modalContent = "";
    
    // Introduction
    if (intro) {
        modalContent += createIntroSection(intro, facture?.numeroFacture);
    }
    
    // Détails de la facture
    if (facture) {
        modalContent += createFactureDetailsSection(facture, options.formatMontant, options.formatDate);
    }
    
    // Section PDF si demandée
    if (showPdf && pdfInfo) {
        modalContent += createPieceJointeSection(pdfInfo.exists, pdfInfo.result, facture, true);
    }
    
    // Contenu personnalisé
    if (content) {
        modalContent += content;
    }
    
    // Avertissement
    if (warningMessage) {
        modalContent += createWarningSection("", warningMessage, warningType);
    }
    
    return {
        title,
        size,
        content: modalContent,
        buttons: buttons || createModalButtons({ submitText: "Confirmer" })
    };
};

// ========================================
// ✅ NOUVELLES CONFIGURATIONS POUR DATES
// ========================================

/**
 * Configuration modal de sélection de date
 */
export const createDatePickerModalConfig = (config = {}) => {
    const {
        title = "Sélectionner une date",
        multiSelect = false,
        initialDates = [],
        context = 'default',
        confirmText = "Confirmer la sélection",
        cancelText = "Annuler",
        size = "medium"
    } = config;
    
    return {
        title,
        size,
        content: createDatePickerContainer({ 
            multiSelect, 
            showInfo: true, 
            initialDates 
        }),
        buttons: createModalButtons({
            cancelText,
            submitText: confirmText,
            submitDisabled: initialDates.length === 0
        })
    };
};

/**
 * Scripts utilitaires pour les modales de dates
 */
export const createDatePickerScripts = () => {
    return `
        <script>
            // Variables globales pour le calendrier
            let currentMonth = new Date().getMonth();
            let currentYear = new Date().getFullYear();
            let selectedDates = [];
            let multiSelectMode = false;
            
            // Navigation dans le calendrier
            function navigateMonth(direction) {
                currentMonth += direction;
                if (currentMonth > 11) {
                    currentMonth = 0;
                    currentYear++;
                } else if (currentMonth < 0) {
                    currentMonth = 11;
                    currentYear--;
                }
                generateCalendarDays();
            }
            
            // Gestion des clics sur les dates
            function handleDateClick(button) {
                const dateStr = button.getAttribute('data-date');
                const date = new Date(dateStr);
                
                if (multiSelectMode) {
                    const index = selectedDates.findIndex(d => d.toDateString() === date.toDateString());
                    if (index >= 0) {
                        selectedDates.splice(index, 1);
                        button.style.backgroundColor = 'transparent';
                        button.style.color = '#333';
                    } else {
                        selectedDates.push(date);
                        button.style.backgroundColor = 'var(--color-primary, #800000)';
                        button.style.color = 'white';
                    }
                } else {
                    // Désélectionner toutes les autres dates
                    document.querySelectorAll('[data-date]').forEach(btn => {
                        btn.style.backgroundColor = 'transparent';
                        btn.style.color = '#333';
                    });
                    
                    selectedDates = [date];
                    button.style.backgroundColor = 'var(--color-primary, #800000)';
                    button.style.color = 'white';
                }
                
                updateSelectedDatesDisplay();
                updateConfirmButton();
            }
            
            // Mettre à jour l'affichage des dates sélectionnées
            function updateSelectedDatesDisplay() {
                const countElement = document.getElementById('selected-count');
                const listElement = document.getElementById('selected-list');
                
                if (countElement) {
                    countElement.textContent = selectedDates.length;
                }
                
                if (listElement) {
                    if (selectedDates.length === 0) {
                        listElement.textContent = 'Aucune date sélectionnée';
                    } else {
                        const formattedDates = selectedDates
                            .sort((a, b) => a - b)
                            .map(date => date.toLocaleDateString('fr-CH'))
                            .join(', ');
                        listElement.textContent = formattedDates;
                    }
                }
            }
            
            // Mettre à jour le bouton de confirmation
            function updateConfirmButton() {
                const confirmBtn = document.querySelector('[data-action="confirm"]');
                if (confirmBtn) {
                    const hasSelection = selectedDates.length > 0;
                    confirmBtn.disabled = !hasSelection;
                    
                    if (hasSelection) {
                        const baseText = confirmBtn.textContent.replace(/\\s*\\(\\d+\\)\\s*$/, '');
                        confirmBtn.textContent = baseText + ' (' + selectedDates.length + ')';
                    }
                }
            }
            
            // Générer les jours du calendrier
            function generateCalendarDays() {
                const container = document.getElementById('calendar-days');
                if (!container) return;
                
                const firstDay = new Date(currentYear, currentMonth, 1);
                const lastDay = new Date(currentYear, currentMonth + 1, 0);
                const startDate = new Date(firstDay);
                startDate.setDate(firstDay.getDate() - firstDay.getDay() + 1);
                
                let daysHtml = '';
                const today = new Date();
                
                for (let i = 0; i < 42; i++) {
                    const currentDate = new Date(startDate);
                    currentDate.setDate(startDate.getDate() + i);
                    
                    const isCurrentMonth = currentDate.getMonth() === currentMonth;
                    const isToday = currentDate.toDateString() === today.toDateString();
                    const isSelected = selectedDates.some(d => d.toDateString() === currentDate.toDateString());
                    
                    const dayButton = document.createElement('button');
                    dayButton.type = 'button';
                    dayButton.setAttribute('data-date', currentDate.toISOString().split('T')[0]);
                    dayButton.onclick = function() { handleDateClick(this); };
                    dayButton.textContent = currentDate.getDate();
                    dayButton.disabled = !isCurrentMonth;
                    
                    // Styles
                    dayButton.style.padding = '8px 4px';
                    dayButton.style.border = 'none';
                    dayButton.style.background = isSelected ? 'var(--color-primary, #800000)' : (isCurrentMonth ? 'transparent' : '#f5f5f5');
                    dayButton.style.color = isSelected ? 'white' : (isCurrentMonth ? '#333' : '#999');
                    dayButton.style.cursor = isCurrentMonth ? 'pointer' : 'default';
                    dayButton.style.borderRadius = '4px';
                    dayButton.style.transition = 'all 0.2s ease';
                    dayButton.style.fontSize = '13px';
                    dayButton.style.minHeight = '32px';
                    
                    if (isToday) {
                        dayButton.style.fontWeight = '600';
                        dayButton.style.border = '2px solid var(--color-primary, #800000)';
                    }
                    
                    // Events hover
                    if (isCurrentMonth) {
                        dayButton.addEventListener('mouseover', function() {
                            if (!this.style.backgroundColor.includes('800000')) {
                                this.style.backgroundColor = '#e9ecef';
                            }
                        });
                        
                        dayButton.addEventListener('mouseout', function() {
                            if (!this.style.backgroundColor.includes('800000')) {
                                this.style.backgroundColor = isCurrentMonth ? 'transparent' : '#f5f5f5';
                            }
                        });
                    }
                    
                    container.appendChild(dayButton);
                }
                
                // Mettre à jour le header
                const monthNames = [
                    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
                ];
                const headerElement = container.parentElement.querySelector('.fallback-calendar > div:first-child > div:nth-child(2)');
                if (headerElement) {
                    headerElement.textContent = monthNames[currentMonth] + ' ' + currentYear;
                }
            }
        </script>
    `;
};

// Export par défaut avec toutes les fonctions
export default {
    createFactureDetailsSection,
    createIntroSection,
    createPieceJointeSection,
    createLoadingContent,
    createWarningSection,
    createEmailInput,
    createTextInput,
    createTextarea,
    createSelect,
    createDevBypassSection,
    createModalButtons,
    createSimpleModalConfig,
    // ✅ Nouvelles fonctions pour les dates
    createDateInputWithModal,
    createSelectedDatesInfo,
    createDatePickerContainer,
    createFallbackCalendar,
    createDatePickerModalConfig,
    createDatePickerScripts
};