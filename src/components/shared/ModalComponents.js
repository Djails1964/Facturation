// src/components/shared/ModalComponents.js
//
// Composants réutilisables pour les modales.
// Utilise formatters, dateHelpers et dateConstants pour tous les traitements de dates.

import { formatDate }         from '../../utils/formatters';
import { toIsoString }        from '../../utils/dateHelpers';
import { DATE_LABELS }        from '../../constants/dateConstants';

// ─── Icône calendrier SVG (FiCalendar — identique au design system) ────────────
// Utilisée dans tous les champs date des modales HTML.
const CALENDAR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
    viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
</svg>`;

/**
 * HTML d'une icône calendrier cliquable pour les champs date des modales HTML.
 * Utilise la classe .calendar-icon du design system (actionButtons.css + forms.css).
 * @param {string} triggerId  ID de l'input à déclencher via data-date-trigger
 * @returns {string} HTML string
 */
export const createCalendarIcon = (triggerId) => `
    <div class="calendar-icon" data-date-trigger="${triggerId}"
         title="${DATE_LABELS.OPEN_CALENDAR}"
         style="position:absolute;right:10px;top:60%;transform:translateY(-50%);cursor:pointer;z-index:3;pointer-events:auto;color:var(--color-primary);display:flex;align-items:center;">
        ${CALENDAR_SVG}
    </div>`;

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
        <div class="notification ${pdfExiste ? 'info' : 'error'}" style="margin: 15px 0;">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
                <div style="display:flex;align-items:center;gap:8px;">
                    <span>${pdfExiste ? '📄' : '❌'}</span>
                    <div>
                        <strong>Fichier PDF :</strong> Facture_${factureData.numeroFacture}.pdf<br>
                        <small>${pdfExiste
                            ? 'Fichier PDF disponible'
                            : `⚠️ ${pdfResult?.message || 'PDF non trouvé'}`
                        }</small>
                    </div>
                </div>
                ${showPreviewButton ? `
                <button type="button" id="previewPdfBtn"
                    class="btn-primary${pdfExiste ? '' : ' ff-button-disabled'}"
                    ${pdfExiste ? '' : 'disabled'}
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
 * Section d'avertissement générique.
 * Utilise les variables CSS de variables.css (--color-*-bg, --color-*-text, --color-*-border).
 */
export const createWarningSection = (title, message, type = 'warning') => {
    const cssClass = {
        warning: 'notification warning',
        error:   'notification error',
        info:    'notification info',
        success: 'notification success',
    }[type] || 'notification info';

    return `
        <div class="${cssClass}">
            ${title ? `<strong>${title}</strong><br>` : ''}
            ${message}
        </div>
    `;
};

// ========================================
// ✅ NOUVEAUX COMPOSANTS POUR LES DATES
// ========================================

/**
 * Champ de date avec icône calendrier pour les modales HTML.
 * Utilise la classe .input-group.date-input du design system (forms.css).
 *
 * @param {string}  id       Nom + ID du champ (utilisé par data-date-trigger)
 * @param {string}  label    Label affiché
 * @param {string}  value    Valeur ISO 'YYYY-MM-DD' ou display 'DD.MM.YYYY'
 * @param {boolean} required Champ obligatoire
 * @param {Object}  config   { readOnly, helpText }
 * @returns {string} HTML string
 */
export const createDateInputWithModal = (id, label, value = '', required = true, config = {}) => {
    const { readOnly = false, helpText = null } = config;

    // Normaliser la valeur : accepte ISO ou display, affiche toujours DD.MM.YYYY
    const displayValue = value ? formatDate(value, 'date') : '';
    // Valeur ISO pour le champ caché (utilisé par useTarifModals/GenericPaymentModalHandler)
    const isoValue = value ? (toIsoString(new Date(value)) || value) : toIsoString(new Date());

    return `
        <div class="input-group date-input">
            <div style="position:relative;padding-top:18px;">
                <input
                    type="text"
                    name="${id}"
                    id="${id}"
                    value="${displayValue}"
                    data-iso="${isoValue}"
                    ${required ? 'required' : ''}
                    placeholder=" "
                    ${readOnly ? 'readonly' : ''}
                    style="padding-right:${readOnly ? '0' : '2.5rem'};width:100%;box-sizing:border-box;"
                    autocomplete="off"
                />
                <label for="${id}" ${required ? 'class="required"' : ''}>${label}</label>
                ${!readOnly ? createCalendarIcon(id) : ''}
            </div>
            ${helpText ? `<small class="field-description">${helpText}</small>` : ''}
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
 * Champ de mot de passe avec label flottant
 * @param {string} id - ID du champ
 * @param {string} label - Label du champ
 * @param {string} value - Valeur par défaut
 * @param {boolean} required - Si le champ est requis
 * @param {boolean} disabled - Si le champ est désactivé
 * @returns {string} HTML du champ password
 */
export const createPasswordInput = (id, label, value = '', required = true, disabled = false) => {
    return `
        <div class="input-group">
            <input 
                type="password" 
                name="${id}" 
                id="${id}"
                value="${value}"
                ${required ? 'required' : ''}
                placeholder=" "
                ${disabled ? 'disabled style="opacity: 0.6;"' : ''}
                autocomplete="new-password"
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

    const includeEmptyOption = !selectedValue || selectedValue === '';
    
    return `
        <div class="input-group">
            <select 
                name="${id}" 
                id="${id}" 
                ${required ? 'required' : ''}
                ${disabled ? 'disabled style="opacity: 0.6;"' : ''}
            >
                ${includeEmptyOption ? '<option value="">Sélectionner...</option>' : ''}  // ✅ Option vide si aucune sélection
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
        <div class="notification info" style="margin:15px 0;">
            <h4 style="margin:0 0 8px 0;font-size:14px;">🛠️ Options de Développement</h4>
            <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;">
                <input type="checkbox" name="bypassCapture" id="bypassCapture" style="margin:0;" />
                <span>
                    <strong>Mode simulation</strong><br>
                    <small style="color:var(--color-text-light,#666);">${message}</small>
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





// Export par défaut avec toutes les fonctions
export default {
    createFactureDetailsSection,
    createIntroSection,
    createPieceJointeSection,
    createLoadingContent,
    createWarningSection,
    createEmailInput,
    createPasswordInput,
    createTextInput,
    createTextarea,
    createSelect,
    createDevBypassSection,
    createModalButtons,
    createSimpleModalConfig,
    createCalendarIcon,
    createDateInputWithModal,
};