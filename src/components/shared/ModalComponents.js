// src/components/factures/modals/content/shared/ModalComponents.js

/**
 * Composants réutilisables pour les modales de factures
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

    // ✅ CORRECTION: Vérifier les propriétés optionnelles
    const numeroFacture = facture.numeroFacture || 'N/A';
    const clientNom = facture.client ? `${facture.client.prenom || ''} ${facture.client.nom || ''}`.trim() : 'N/A';
    const dateFacture = facture.dateFacture && formatDate ? formatDate(facture.dateFacture) : (facture.dateFacture || 'N/A');
    const montant = (facture.montantTotal || facture.totalFacture) && formatMontant ? 
        formatMontant(facture.montantTotal || facture.totalFacture) : 
        (facture.montantTotal || facture.totalFacture || 'N/A');
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
        modalContent += createIntroSection(intro, facture.numeroFacture);
    }
    
    // Détails de la facture
    modalContent += createFactureDetailsSection(facture, options.formatMontant, options.formatDate);
    
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
    createTextInput,
    createTextarea,
    createSelect,
    createDevBypassSection,
    createModalButtons,
    createSimpleModalConfig
};