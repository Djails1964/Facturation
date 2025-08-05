// src/components/shared/modals/handlers/DatePickerModalHandler.js
// VERSION NETTOYÉE - Utilise les classes CSS de unified-modals.css

import React from 'react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { registerLocale } from "react-datepicker";
import fr from 'date-fns/locale/fr';
import ModalComponents from '../../../shared/ModalComponents';
import DateService from '../../../../utils/DateService';
import { 
    DATE_LABELS, 
    DATE_VALIDATION_MESSAGES,
    CONTEXT_CONFIGS 
} from '../../../../constants/dateConstants';

// Enregistrer la locale française
registerLocale('fr', fr);

/**
 * Gestionnaire pour la sélection de dates avec modal unifiée
 * VERSION NETTOYÉE - Utilise les classes CSS
 */
export class DatePickerModalHandler {
    constructor(dependencies) {
        this.showCustom = dependencies.showCustom;
        this.showError = dependencies.showError;
        this.showLoading = dependencies.showLoading;
    }

    /**
     * Point d'entrée principal pour afficher le sélecteur de dates
     */
    async handle(config = {}, event = null) {
        const {
            initialDates = [],
            multiSelect = false,
            minDate = null,
            maxDate = new Date(),
            title = DATE_LABELS.SELECT_DATE,
            confirmText = DATE_LABELS.CONFIRM_SELECTION,
            context = 'default',
            anchorRef = null
        } = config;

        console.log('📅 Ouverture du sélecteur de dates:', { 
            multiSelect, 
            initialDates: initialDates.length,
            context 
        });

        const modalAnchorRef = anchorRef || this.createAnchorRef(event);

        try {
            const validation = this.validateConfig(config);
            if (!validation.isValid) {
                await this.showError(validation.error, modalAnchorRef);
                return { action: 'cancel', dates: [] };
            }

            const result = await this.showDateSelectionModal({
                initialDates,
                multiSelect,
                minDate,
                maxDate,
                title,
                confirmText,
                context,
                anchorRef: modalAnchorRef
            });

            console.log('📅 Résultat sélection dates:', result);
            return result;

        } catch (error) {
            console.error('❌ Erreur dans DatePickerModalHandler:', error);
            await this.showError(
                `Erreur lors de la sélection de dates : ${error.message}`,
                modalAnchorRef
            );
            return { action: 'cancel', dates: [] };
        }
    }

    /**
     * Afficher la modal de sélection de dates
     */
    async showDateSelectionModal(config) {
        const { 
            initialDates, 
            multiSelect, 
            minDate, 
            maxDate, 
            title, 
            confirmText, 
            context,
            anchorRef 
        } = config;

        let selectedDates = [...initialDates];
        
        console.log('📅 Initialisation modal avec dates:', selectedDates.map(d => d.toLocaleDateString('fr-CH')));

        try {
            const modalResult = await this.showCustom({
                title,
                size: 'medium',
                position: anchorRef ? 'smart' : 'center',
                anchorRef,
                content: this.createDatePickerContent(config),
                buttons: [
                    {
                        text: "Annuler",
                        action: "cancel",
                        className: "secondary"
                    },
                    {
                        text: confirmText,
                        action: "confirm",
                        className: "primary",
                        disabled: selectedDates.length === 0
                    }
                ],
                onMount: (container) => {
                    setTimeout(() => {
                        let workingContainer = container || document.querySelector('.modal-form');
                        
                        if (workingContainer) {
                            this.setupDatePicker(workingContainer, {
                                initialDates: selectedDates,
                                multiSelect,
                                minDate,
                                maxDate,
                                context,
                                confirmText,
                                onDateSelect: (date) => {
                                    selectedDates = this.handleDateSelect(date, selectedDates, multiSelect, context);
                                    this.updateSelectedDatesDisplay(null, selectedDates);
                                    this.updateConfirmButton(null, selectedDates, confirmText);
                                }
                            });
                        }
                    }, 200);
                }
            });

            if (modalResult && modalResult.action === 'confirm') {
                return { action: 'confirm', dates: selectedDates, count: selectedDates.length };
            }
            return { action: 'cancel', dates: [], count: 0 };

        } catch (error) {
            console.error('❌ Erreur lors de l\'affichage de la modal:', error);
            return { action: 'cancel', dates: [], count: 0 };
        }
    }

    /**
     * Créer le contenu HTML de la modal - VERSION NETTOYÉE
     */
    createDatePickerContent(config) {
        const { multiSelect, context } = config;
        
        let content = '';

        const contextConfig = this.getContextConfig(context);
        if (contextConfig.description) {
            content += ModalComponents.createIntroSection(contextConfig.description);
        }

        // Container simplifié utilisant les classes CSS
        content += `
            <div class="modal-form">
                <div id="datepicker-container" class="datepicker-container">
                    <!-- Le DatePicker sera inséré ici -->
                </div>
                
                <div id="selected-dates-info" class="selected-dates-info">
                    <div class="info-row">
                        <div class="info-label">Dates sélectionnées:</div>
                        <div class="info-value" id="selected-count">0</div>
                    </div>
                    <div class="info-row">
                        <div class="info-label">Détail:</div>
                        <div class="info-value" id="selected-list">Aucune date sélectionnée</div>
                    </div>
                </div>
            </div>
        `;

        if (contextConfig.help) {
            content += ModalComponents.createWarningSection(null, contextConfig.help, 'info');
        }

        return content;
    }

    /**
     * Configurer le DatePicker dans la modal
     */
    setupDatePicker(container, config) {
        console.log('🔧 Setup DatePicker');
        
        let datePickerContainer = container.querySelector('#datepicker-container') || 
                                document.querySelector('#datepicker-container');
        
        if (!datePickerContainer) {
            this.createFallbackInContainer(container, config);
            return;
        }

        datePickerContainer.innerHTML = '';
        this.renderDatePickerFallback(datePickerContainer, config);
        this.updateSelectedDatesDisplay(container, config.initialDates);
    }

    /**
     * Créer un calendrier de fallback dans le container
     */
    createFallbackInContainer(container, config) {
        if (!container) return;

        let fallbackArea = container.querySelector('.datepicker-fallback-area');
        if (!fallbackArea) {
            fallbackArea = document.createElement('div');
            fallbackArea.className = 'datepicker-fallback-area';
            container.insertBefore(fallbackArea, container.firstChild);
        }

        this.renderDatePickerFallback(fallbackArea, config);
    }

    /**
     * Rendu du calendrier - VERSION NETTOYÉE avec classes CSS
     */
    renderDatePickerFallback(container, config) {
        const { initialDates = [], multiSelect } = config;
        
        if (!container) return;
        
        // Gestion du mois/année
        let currentMonth, currentYear;
        const existingMonth = container.getAttribute('data-current-month');
        const existingYear = container.getAttribute('data-current-year');
        
        if (existingMonth !== null && existingYear !== null) {
            currentMonth = parseInt(existingMonth);
            currentYear = parseInt(existingYear);
        } else {
            const today = new Date();
            currentMonth = today.getMonth();
            currentYear = today.getFullYear();
            
            if (initialDates.length > 0) {
                const firstDate = initialDates[0];
                currentMonth = firstDate.getMonth();
                currentYear = firstDate.getFullYear();
            }
        }
        
        container.setAttribute('data-multi-select', multiSelect.toString());
        container.setAttribute('data-current-month', currentMonth.toString());
        container.setAttribute('data-current-year', currentYear.toString());
        
        const monthNames = [
            'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
            'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
        ];
        
        const daysHTML = this.generateDaysHTML(currentYear, currentMonth, initialDates);
        
        // HTML simplifié utilisant les classes CSS
        const calendarHTML = `
            <div class="fallback-calendar">
                <div class="calendar-header">
                    <button type="button" class="nav-month-btn nav-previous" data-direction="-1" title="Mois précédent">‹</button>
                    <div class="month-year-display">${monthNames[currentMonth]} ${currentYear}</div>
                    <button type="button" class="nav-month-btn nav-next" data-direction="1" title="Mois suivant">›</button>
                </div>
                
                <div class="calendar-weekdays">
                    <div class="calendar-weekday">L</div>
                    <div class="calendar-weekday">M</div>
                    <div class="calendar-weekday">M</div>
                    <div class="calendar-weekday">J</div>
                    <div class="calendar-weekday">V</div>
                    <div class="calendar-weekday">S</div>
                    <div class="calendar-weekday">D</div>
                </div>
                
                <div class="calendar-days-grid">
                    ${daysHTML}
                </div>
                
                <div class="calendar-instructions">
                    ${multiSelect 
                        ? 'Cliquez sur les dates pour les sélectionner/désélectionner'
                        : 'Cliquez sur une date pour la sélectionner'
                    }
                </div>
            </div>
        `;
        
        container.innerHTML = calendarHTML;
        
        setTimeout(() => {
            this.initializeCalendarEvents(container, config);
        }, 100);
    }

    /**
     * Générer le HTML des jours - VERSION NETTOYÉE avec classes CSS
     */
    generateDaysHTML(year, month, selectedDates = []) {
        const firstDay = new Date(year, month, 1);
        const startDate = new Date(firstDay);
        const dayOfWeek = firstDay.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        startDate.setDate(firstDay.getDate() + mondayOffset);
        
        let daysHtml = '';
        const today = new Date();
        const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        
        for (let i = 0; i < 42; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            
            const isCurrentMonth = currentDate.getMonth() === month;
            const isToday = this.isSameDay(currentDate, today);
            const isSelected = selectedDates.some(date => this.isSameDay(date, currentDate));
            
            const currentDateOnly = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
            const isFutureDate = currentDateOnly > todayDateOnly;
            const isDisabled = isFutureDate;
            
            const dayNum = currentDate.getDate();
            const dateStr = DateService.toInputFormat(currentDate);
            
            // Classes CSS au lieu de styles inline
            let buttonClasses = ['calendar-day-btn'];
            if (isSelected) buttonClasses.push('selected-date');
            if (!isCurrentMonth) buttonClasses.push('not-current-month');
            if (isToday && !isSelected) buttonClasses.push('today');
            if (isFutureDate) buttonClasses.push('future-date');
            
            daysHtml += `
                <button 
                    type="button"
                    class="${buttonClasses.join(' ')}"
                    data-date="${dateStr}"
                    data-calendar-button="true"
                    data-is-current-month="${isCurrentMonth}"
                    data-is-selected="${isSelected}"
                    tabindex="${isDisabled ? '-1' : '0'}"
                    ${isDisabled ? 'disabled' : ''}
                    title="${isFutureDate ? 'Date future non autorisée pour les paiements' : (isCurrentMonth ? '' : 'Date du mois précédent/suivant')}"
                >
                    ${dayNum}
                </button>
            `;
        }
        
        return daysHtml;
    }

    /**
     * Initialiser les événements du calendrier - VERSION NETTOYÉE
     */
    initializeCalendarEvents(container, config) {
        if (!container) return;
        
        const { onDateSelect, multiSelect } = config;
        let isSelecting = false;
        
        setTimeout(() => {
            const dayButtons = container.querySelectorAll('.calendar-day-btn');
            
            dayButtons.forEach((btn) => {
                if (btn.disabled) return;
                
                const clickHandler = (e) => {
                    if (isSelecting) return false;
                    isSelecting = true;
                    
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    
                    const dateStr = btn.getAttribute('data-date');
                    const dateParts = dateStr.split('-');
                    const date = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
                    
                    // Vérification des dates futures
                    const today = new Date();
                    const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                    const currentDateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                    
                    if (currentDateOnly > todayDateOnly) {
                        isSelecting = false;
                        return false;
                    }
                    
                    // Gestion de la sélection avec classes CSS
                    if (!multiSelect || config.context === 'payment') {
                        // Désélectionner tous les boutons
                        document.querySelectorAll('.calendar-day-btn').forEach(otherBtn => {
                            otherBtn.classList.remove('selected-date');
                            otherBtn.setAttribute('data-is-selected', 'false');
                        });
                        
                        // Sélectionner le bouton cliqué
                        btn.classList.add('selected-date');
                        btn.setAttribute('data-is-selected', 'true');
                    } else {
                        // Mode multi-sélection
                        const isCurrentlySelected = btn.classList.contains('selected-date');
                        if (isCurrentlySelected) {
                            btn.classList.remove('selected-date');
                            btn.setAttribute('data-is-selected', 'false');
                        } else {
                            btn.classList.add('selected-date');
                            btn.setAttribute('data-is-selected', 'true');
                        }
                    }
                    
                    setTimeout(() => {
                        if (onDateSelect) onDateSelect(date);
                        isSelecting = false;
                    }, 10);
                    
                    return false;
                };
                
                btn.addEventListener('click', clickHandler, true);
            });
            
            // Événements de navigation
            const navButtons = container.querySelectorAll('.nav-month-btn');
            navButtons.forEach(navBtn => {
                navBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const direction = parseInt(navBtn.getAttribute('data-direction'));
                    let currentMonth = parseInt(container.getAttribute('data-current-month'));
                    let currentYear = parseInt(container.getAttribute('data-current-year'));
                    
                    currentMonth += direction;
                    if (currentMonth > 11) {
                        currentMonth = 0;
                        currentYear++;
                    } else if (currentMonth < 0) {
                        currentMonth = 11;
                        currentYear--;
                    }
                    
                    // Préserver les dates sélectionnées
                    const currentlySelectedDates = [];
                    const selectedButtons = document.querySelectorAll('.calendar-day-btn.selected-date');
                    selectedButtons.forEach(btn => {
                        const dateStr = btn.getAttribute('data-date');
                        if (dateStr) {
                            const dateParts = dateStr.split('-');
                            const year = parseInt(dateParts[0]);
                            const month = parseInt(dateParts[1]) - 1;
                            const day = parseInt(dateParts[2]);
                            currentlySelectedDates.push(new Date(year, month, day));
                        }
                    });
                    
                    container.setAttribute('data-current-month', currentMonth.toString());
                    container.setAttribute('data-current-year', currentYear.toString());
                    
                    const updatedConfig = { ...config, initialDates: currentlySelectedDates };
                    this.renderDatePickerFallback(container, updatedConfig);
                });
            });
        }, 50);
    }

    /**
     * Utilitaires
     */
    isSameDay(date1, date2) {
        if (!date1 || !date2) return false;
        return (
            date1.getDate() === date2.getDate() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getFullYear() === date2.getFullYear()
        );
    }

    handleDateSelect(selectedDate, currentDates, multiSelect, context = null) {
        const today = new Date();
        const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const selectedDateOnly = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
        
        if (selectedDateOnly > todayDateOnly) {
            return currentDates;
        }
        
        if (!multiSelect || context === 'payment') {
            return [selectedDate];
        }

        const dateExists = currentDates.some(date => DateService.isSameDay(date, selectedDate));
        if (dateExists) {
            return currentDates.filter(date => !DateService.isSameDay(date, selectedDate));
        } else {
            return [...currentDates, selectedDate];
        }
    }

    updateSelectedDatesDisplay(container, selectedDates) {
        const displayContainer = container || document.querySelector('.unified-modal-container');
        if (!displayContainer) return;
        
        const countElement = displayContainer.querySelector('#selected-count');
        const listElement = displayContainer.querySelector('#selected-list');
        
        if (countElement) countElement.textContent = selectedDates.length;
        
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

    updateConfirmButton(container, selectedDates, confirmText) {
        const buttonContainer = container || document.querySelector('.unified-modal-container');
        if (!buttonContainer) return;
        
        const confirmBtn = buttonContainer.querySelector('[data-action="confirm"]');
        if (!confirmBtn) return;
        
        const hasSelection = selectedDates.length > 0;
        confirmBtn.disabled = !hasSelection;
        
        if (hasSelection) {
            const baseText = confirmText || 'Confirmer la sélection';
            confirmBtn.textContent = `${baseText} (${selectedDates.length})`;
        } else {
            confirmBtn.textContent = confirmText || 'Confirmer la sélection';
        }
    }

    /**
     * Valider la configuration
     */
    validateConfig(config) {
        const { minDate, maxDate, context } = config;
        
        if (minDate && maxDate && minDate > maxDate) {
            return {
                isValid: false,
                error: DATE_VALIDATION_MESSAGES.RANGE_ERROR || "Erreur de plage de dates"
            };
        }
        
        if (context) {
            const contextConfig = this.getContextConfig(context);
            if (!contextConfig.ALLOW_FUTURE && !maxDate) {
                config.maxDate = new Date();
            }
        }
        
        return { isValid: true };
    }

    /**
     * Obtenir la configuration selon le contexte
     */
    getContextConfig(context) {
        const baseConfig = CONTEXT_CONFIGS && CONTEXT_CONFIGS[context.toUpperCase()] ? 
            CONTEXT_CONFIGS[context.toUpperCase()] : {};
        
        const configs = {
            payment: {
                ...baseConfig,
                TITLE: "Sélectionner la date de paiement",
                CONFIRM_TEXT: "Confirmer cette date",
                description: "Sélectionnez la date du paiement",
                help: "Les dates futures ne sont pas autorisées pour les paiements.",
                ALLOW_FUTURE: false
            },
            invoice: {
                ...baseConfig,
                TITLE: "Sélectionner la date de facturation", 
                CONFIRM_TEXT: "Confirmer cette date",
                description: "Sélectionnez la date de facturation",
                help: "Vous pouvez sélectionner une date future pour la facturation.",
                ALLOW_FUTURE: true
            },
            default: {
                ...baseConfig,
                TITLE: "Sélectionner une date",
                CONFIRM_TEXT: "Confirmer la sélection",
                description: "Sélectionnez une date",
                help: null,
                ALLOW_FUTURE: true
            }
        };
        
        return configs[context] || configs.default;
    }

    /**
     * Créer une référence d'ancrage pour le positionnement
     */
    createAnchorRef(event) {
        if (!event) return null;
        const anchorRef = React.createRef();
        if (event.currentTarget) {
            anchorRef.current = event.currentTarget;
        }
        return anchorRef;
    }
}

export default DatePickerModalHandler;