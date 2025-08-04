// src/components/shared/modals/handlers/DatePickerModalHandler.js
// VERSION COMPLÈTE CORRIGÉE

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
 * VERSION CORRIGÉE COMPLÈTE
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
            // Valider la configuration
            const validation = this.validateConfig(config);
            if (!validation.isValid) {
                await this.showError(validation.error, modalAnchorRef);
                return { action: 'cancel', dates: [] };
            }

            // Afficher la modal de sélection
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
        // ✅ CORRECTION: Destructuration EN PREMIER
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

        // ✅ Diagnostic après destructuration
        console.log('🔍 DIAGNOSTIC CONFIG:', {
            multiSelect: multiSelect,
            context: context,
            initialDatesCount: initialDates.length,
            initialDates: initialDates.map(d => d.toLocaleDateString('fr-CH'))
        });

        // Initialiser correctement les dates sélectionnées
        let selectedDates = [...initialDates];
        
        console.log('📅 Initialisation modal avec dates:', selectedDates.map(d => d.toLocaleDateString('fr-CH')));

        let modalResult = null;

        try {
            modalResult = await this.showCustom({
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
                    console.log('📅 Modal DatePicker montée, container:', container);
                    
                    setTimeout(() => {
                        let workingContainer = container;
                        
                        if (!workingContainer) {
                            console.error('❌ Container null dans onMount, tentative de récupération...');
                            workingContainer = document.querySelector('.unified-modal-content .modal-form') ||
                                            document.querySelector('.unified-modal-container .modal-form') ||
                                            document.querySelector('.modal-form');
                            
                            if (workingContainer) {
                                console.log('✅ Container de fallback trouvé');
                            } else {
                                console.error('❌ Aucun container disponible');
                                return;
                            }
                        }
                        
                        this.setupDatePicker(workingContainer, {
                            initialDates: selectedDates,
                            multiSelect,
                            minDate,
                            maxDate,
                            context,
                            confirmText,
                            onDateSelect: (date) => {
                                try {
                                    console.log('📅 Date sélectionnée dans callback:', date.toLocaleDateString('fr-CH'));

                                    console.log('🔍 AVANT handleDateSelect:', {
                                        selectedDate: date.toLocaleDateString('fr-CH'),
                                        currentDates: selectedDates.map(d => d.toLocaleDateString('fr-CH')),
                                        multiSelect: multiSelect,
                                        context: context
                                    });
                                    
                                    // Utiliser handleDateSelect pour la logique de sélection
                                    const newSelectedDates = this.handleDateSelect(
                                        date, 
                                        selectedDates, 
                                        multiSelect,
                                        context
                                    );

                                    console.log('🔍 APRÈS handleDateSelect:', {
                                        newSelectedDates: newSelectedDates.map(d => d.toLocaleDateString('fr-CH'))
                                    });
                                    
                                    // ✅ CRUCIAL: Mettre à jour la variable de référence
                                    selectedDates = newSelectedDates;
                                    
                                    console.log('📅 Variable selectedDates mise à jour:', selectedDates.map(d => d.toLocaleDateString('fr-CH')));
                                    
                                    this.updateSelectedDatesDisplay(null, selectedDates);
                                    this.updateConfirmButton(null, selectedDates, confirmText);

                                } catch (error) {
                                    console.error('❌ Erreur dans onDateSelect:', error);
                                }
                            }
                        });
                    }, 200);
                }
            });
        } catch (error) {
            console.error('❌ Erreur lors de l\'affichage de la modal:', error);
            return {
                action: 'cancel',
                dates: [],
                count: 0
            };
        }

        console.log('📅 Résultat modal:', modalResult);

        // Retourner le résultat avec les dates sélectionnées finales
        if (modalResult && modalResult.action === 'confirm') {
            return {
                action: 'confirm',
                dates: selectedDates,
                count: selectedDates.length
            };
        }

        return {
            action: 'cancel',
            dates: [],
            count: 0
        };
    }

    /**
     * Créer le contenu HTML de la modal
     */
    createDatePickerContent(config) {
        const { multiSelect, context } = config;
        
        let content = '';

        // Introduction
        const contextConfig = this.getContextConfig(context);
        if (contextConfig.description) {
            content += ModalComponents.createIntroSection(contextConfig.description);
        }

        // Container pour le DatePicker
        content += `
            <div class="modal-form">
                <div id="datepicker-container" style="
                    display: flex;
                    justify-content: center;
                    margin: 20px 0;
                    min-height: 300px;
                ">
                    <!-- Le DatePicker sera inséré ici -->
                </div>
                
                <div id="selected-dates-info" class="details-container" style="
                    margin: 15px 0;
                    padding: 15px;
                    background: #f9f9f9;
                    border: 1px solid #e0e0e0;
                    border-radius: 4px;
                ">
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

        // Aides contextuelles
        if (contextConfig.help) {
            content += ModalComponents.createWarningSection(
                null, 
                contextConfig.help, 
                'info'
            );
        }

        return content;
    }

    /**
     * Configurer le DatePicker dans la modal
     */
    setupDatePicker(container, config) {
        const { 
            initialDates, 
            multiSelect, 
            minDate, 
            maxDate, 
            context,
            onDateSelect 
        } = config;

        console.log('🔧 Setup DatePicker - recherche container...', container);
        
        // Recherche du container
        let datePickerContainer = null;
        
        if (container) {
            datePickerContainer = container.querySelector('#datepicker-container');
        }
        
        if (!datePickerContainer) {
            console.log('🔧 Container non trouvé, recherche dans le document...');
            datePickerContainer = document.querySelector('#datepicker-container');
        }
        
        if (!datePickerContainer) {
            console.error('❌ Container DatePicker non trouvé');
            this.createFallbackInContainer(container, config);
            return;
        }

        console.log('✅ Container DatePicker trouvé:', datePickerContainer);

        // Vider le container et créer le calendrier
        datePickerContainer.innerHTML = '';
        this.renderDatePickerFallback(datePickerContainer, config);

        // Mettre à jour l'affichage initial
        this.updateSelectedDatesDisplay(container, initialDates);
    }

    /**
     * Créer un calendrier de fallback
     */
    createFallbackInContainer(container, config) {
        if (!container) {
            console.error('❌ Aucun container disponible pour le fallback');
            return;
        }

        console.log('🔧 Création d\'un calendrier de fallback dans le container principal');
        
        let fallbackArea = container.querySelector('.datepicker-fallback-area');
        if (!fallbackArea) {
            fallbackArea = document.createElement('div');
            fallbackArea.className = 'datepicker-fallback-area';
            fallbackArea.style.cssText = `
                display: flex;
                justify-content: center;
                margin: 20px 0;
                min-height: 300px;
            `;
            
            const firstChild = container.firstChild;
            if (firstChild) {
                container.insertBefore(fallbackArea, firstChild);
            } else {
                container.appendChild(fallbackArea);
            }
        }

        this.renderDatePickerFallback(fallbackArea, config);
    }

    /**
     * Rendu du calendar fallback
     */
    renderDatePickerFallback(container, config) {
        const { minDate, maxDate, onDateSelect, initialDates = [], multiSelect } = config;
        
        console.log('🔧 Rendu du calendrier fallback, container:', container);
        
        if (!container) {
            console.error('❌ Container null dans renderDatePickerFallback');
            return;
        }
        
        // ✅ CORRECTION: Utiliser le mois/année depuis les attributs s'ils existent
        let currentMonth, currentYear;
        
        // Vérifier si on a déjà des attributs (navigation)
        const existingMonth = container.getAttribute('data-current-month');
        const existingYear = container.getAttribute('data-current-year');
        
        if (existingMonth !== null && existingYear !== null) {
            // Utiliser les valeurs existantes (navigation)
            currentMonth = parseInt(existingMonth);
            currentYear = parseInt(existingYear);
            console.log('📅 Utilisation mois/année depuis navigation:', { year: currentYear, month: currentMonth + 1 });
        } else {
            // Première fois : utiliser la date actuelle ou la date initiale
            const today = new Date();
            currentMonth = today.getMonth();
            currentYear = today.getFullYear();
            
            // Si on a une date initiale, commencer par son mois
            if (initialDates.length > 0) {
                const firstDate = initialDates[0];
                currentMonth = firstDate.getMonth();
                currentYear = firstDate.getFullYear();
                console.log('📅 Calendrier centré sur la date initiale:', { year: currentYear, month: currentMonth + 1 });
            }
        }
        
        console.log('📅 Génération calendrier pour:', { year: currentYear, month: currentMonth });
        
        // Stocker les données dans les attributs
        container.setAttribute('data-multi-select', multiSelect.toString());
        container.setAttribute('data-current-month', currentMonth.toString());
        container.setAttribute('data-current-year', currentYear.toString());
        
        // Noms des mois
        const monthNames = [
            'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
            'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
        ];
        
        // ✅ CORRECTION: Utiliser les dates initiales pour les sélections
        const daysHTML = this.generateSimpleDaysHTML(currentYear, currentMonth, initialDates);
        
        // HTML du calendrier avec navigation
        const calendarHTML = `
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
                <div class="calendar-header" style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                    padding-bottom: 10px;
                    border-bottom: 1px solid #eee;
                ">
                    <button 
                        type="button" 
                        class="nav-month-btn nav-previous"
                        data-direction="-1"
                        style="
                            background: none;
                            border: 1px solid #ddd;
                            border-radius: 4px;
                            padding: 8px 12px;
                            cursor: pointer;
                            font-size: 16px;
                            color: #666;
                            transition: all 0.2s ease;
                        "
                        title="Mois précédent"
                    >
                        ‹
                    </button>
                    
                    <div class="month-year-display" style="
                        font-weight: 600;
                        font-size: 16px;
                        color: var(--color-primary, #800000);
                        user-select: none;
                    ">
                        ${monthNames[currentMonth]} ${currentYear}
                    </div>
                    
                    <button 
                        type="button" 
                        class="nav-month-btn nav-next"
                        data-direction="1"
                        style="
                            background: none;
                            border: 1px solid #ddd;
                            border-radius: 4px;
                            padding: 8px 12px;
                            cursor: pointer;
                            font-size: 16px;
                            color: #666;
                            transition: all 0.2s ease;
                        "
                        title="Mois suivant"
                    >
                        ›
                    </button>
                </div>
                
                <!-- En-têtes des jours -->
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
                <div class="calendar-days-grid" style="
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    gap: 2px;
                    text-align: center;
                    margin-bottom: 15px;
                ">
                    ${daysHTML}
                </div>
                
                <!-- Instructions -->
                <div style="
                    text-align: center;
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
        
        console.log('📅 HTML généré pour le mois:', monthNames[currentMonth], currentYear);
        
        // Insérer le HTML
        try {
            container.innerHTML = calendarHTML;
            console.log('✅ HTML inséré avec succès');
            
            // Initialiser les événements
            setTimeout(() => {
                this.initializeSimpleCalendarEvents(container, config);
            }, 100);
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'insertion HTML:', error);
        }
    }

    /**
     * ✅ CORRECTION CRITIQUE: Générer le HTML des jours SANS décalage timezone
     */
    generateSimpleDaysHTML(year, month, selectedDates = []) {
        console.log('📅 Génération des jours pour:', { year, month, selectedDatesCount: selectedDates.length });
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        // Calculer le premier lundi à afficher
        const startDate = new Date(firstDay);
        const dayOfWeek = firstDay.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        startDate.setDate(firstDay.getDate() + mondayOffset);
        
        let daysHtml = '';
        const today = new Date();
        
        // Date d'aujourd'hui sans heure pour comparaison précise
        const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        
        for (let i = 0; i < 42; i++) { // 6 semaines
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            
            const isCurrentMonth = currentDate.getMonth() === month;
            const isToday = this.isSameDay(currentDate, today);
            const isSelected = selectedDates.some(date => this.isSameDay(date, currentDate));
            
            // Seules les dates STRICTEMENT futures sont interdites
            const currentDateOnly = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
            const isFutureDate = currentDateOnly > todayDateOnly;
            
            // Les dates passées sont autorisées, même des mois précédents
            const isDisabled = isFutureDate;
            
            const dayNum = currentDate.getDate();
            
            // ✅ CORRECTION CRITIQUE: Utiliser DateService au lieu de toISOString()
            const dateStr = DateService.toInputFormat(currentDate);
            
            // Gestion visuelle des dates hors mois courant
            let backgroundColor, textColor;
            if (isSelected) {
                backgroundColor = 'var(--color-primary, #800000)';
                textColor = 'white';
            } else if (!isCurrentMonth) {
                backgroundColor = '#f8f8f8';
                textColor = '#999';
            } else {
                backgroundColor = 'transparent';
                textColor = '#333';
            }
            
            daysHtml += `
                <button 
                    type="button"
                    class="calendar-day-btn"
                    data-date="${dateStr}"
                    data-calendar-button="true"
                    data-is-current-month="${isCurrentMonth}"
                    tabindex="${isDisabled ? '-1' : '0'}"
                    style="
                        padding: 8px 4px;
                        border: none;
                        background: ${backgroundColor};
                        color: ${isDisabled ? '#ccc' : textColor};
                        cursor: ${isDisabled ? 'not-allowed' : 'pointer'};
                        border-radius: 4px;
                        transition: all 0.2s ease;
                        font-size: 13px;
                        min-height: 32px;
                        opacity: ${isDisabled ? '0.4' : '1'};
                        ${isToday && !isSelected ? 'font-weight: 600; border: 2px solid var(--color-primary, #800000);' : ''}
                        ${isFutureDate ? 'text-decoration: line-through;' : ''}
                    "
                    ${isDisabled ? 'disabled' : ''}
                    title="${isFutureDate ? 'Date future non autorisée pour les paiements' : (isCurrentMonth ? '' : 'Date du mois précédent/suivant')}"
                >
                    ${dayNum}
                </button>
            `;
        }
        
        console.log('📅 HTML des jours généré, longueur:', daysHtml.length);
        return daysHtml;
    }

    /**
     * Initialiser les événements du calendrier
     */
    initializeSimpleCalendarEvents(container, config) {
        const { onDateSelect, multiSelect } = config;
        
        console.log('🔧 Initialisation des événements simplifiés');
        console.log('🔧 Configuration multiSelect:', multiSelect);
        console.log('🔧 Contexte:', config.context);
        
        if (!container) {
            console.error('❌ Container null dans initializeSimpleCalendarEvents');
            return;
        }
        
        // Variable pour suivre la sélection en cours
        let isSelecting = false;
        
        setTimeout(() => {
            const dayButtons = container.querySelectorAll('.calendar-day-btn');
            console.log('📅 Boutons trouvés:', dayButtons.length);
            
            dayButtons.forEach((btn, index) => {
                if (btn.disabled) return;
                
                // Supprimer tous les anciens event listeners
                btn.removeEventListener('click', btn._dateClickHandler);
                
                const clickHandler = (e) => {
                    console.log('📅 Clic détecté sur bouton date, preventDefault et stopPropagation');
                    
                    // Protection contre les clics multiples rapides
                    if (isSelecting) {
                        console.log('⚠️ Sélection déjà en cours, ignorer le clic');
                        return false;
                    }
                    
                    isSelecting = true;
                    
                    // CRUCIAL: Empêcher absolument la propagation
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    
                    const dateStr = btn.getAttribute('data-date');
                    
                    // ✅ CORRECTION: Parsing de date sans décalage timezone
                    console.log('📅 Date string depuis bouton:', dateStr);
                    
                    const dateParts = dateStr.split('-');
                    const year = parseInt(dateParts[0]);
                    const month = parseInt(dateParts[1]) - 1; // Mois 0-indexé
                    const day = parseInt(dateParts[2]);
                    const date = new Date(year, month, day);
                    
                    console.log('📅 Parsing détaillé:', {
                        dateStr: dateStr,
                        parsedParts: { year, month: month + 1, day },
                        dateCreated: date,
                        dateLocaleString: date.toLocaleDateString('fr-CH'),
                        dateISOString: date.toISOString(),
                        timezoneOffset: date.getTimezoneOffset()
                    });
                    
                    console.log('📅 Date finale construite:', {
                        dateObject: date,
                        formatteeFrCH: date.toLocaleDateString('fr-CH'),
                        jour: date.getDate(),
                        mois: date.getMonth() + 1,
                        annee: date.getFullYear()
                    });
                    
                    // Vérification stricte des dates futures uniquement
                    const today = new Date();
                    const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                    const currentDateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                    
                    if (currentDateOnly > todayDateOnly) {
                        console.warn('⚠️ Tentative de sélection d\'une date future, ignorée');
                        isSelecting = false;
                        return false;
                    }
                    
                    // MODE SÉLECTION UNIQUE RENFORCÉ pour les paiements
                    if (!multiSelect || config.context === 'payment') {
                        console.log('📅 Mode sélection unique - contexte:', config.context);
                        console.log('📅 Mode sélection unique - DÉSÉLECTION COMPLÈTE de tous les boutons');
                        
                        // Désélectionner TOUS les boutons
                        const allCalendarButtons = document.querySelectorAll('.calendar-day-btn');
                        console.log('📅 Désélection de', allCalendarButtons.length, 'boutons au total');
                        
                        allCalendarButtons.forEach((otherBtn, index) => {
                            const wasSelected = otherBtn.style.backgroundColor && 
                                                otherBtn.style.backgroundColor.includes('800000');
                            
                            if (wasSelected) {
                                console.log('📅 Désélection bouton:', otherBtn.getAttribute('data-date'));
                            }
                            
                            // Réinitialiser le style
                            const isCurrentMonth = otherBtn.getAttribute('data-is-current-month') === 'true';
                            const isDisabled = otherBtn.disabled;
                            
                            if (isDisabled) {
                                otherBtn.style.backgroundColor = '#f5f5f5';
                                otherBtn.style.color = '#ccc';
                            } else if (isCurrentMonth) {
                                otherBtn.style.backgroundColor = 'transparent';
                                otherBtn.style.color = '#333';
                            } else {
                                otherBtn.style.backgroundColor = '#f8f8f8';
                                otherBtn.style.color = '#999';
                            }
                        });
                        
                        // Sélectionner UNIQUEMENT le bouton cliqué
                        btn.style.backgroundColor = 'var(--color-primary, #800000)';
                        btn.style.color = 'white';
                        
                        console.log('📅 Nouvelle sélection unique confirmée:', dateStr);
                        
                    } else {
                        // Mode multi-sélection (pour d'autres contextes)
                        const isCurrentlySelected = btn.style.backgroundColor && btn.style.backgroundColor.includes('800000');
                        if (isCurrentlySelected) {
                            const isCurrentMonth = btn.getAttribute('data-is-current-month') === 'true';
                            btn.style.backgroundColor = isCurrentMonth ? 'transparent' : '#f8f8f8';
                            btn.style.color = isCurrentMonth ? '#333' : '#999';
                        } else {
                            btn.style.backgroundColor = 'var(--color-primary, #800000)';
                            btn.style.color = 'white';
                        }
                    }
                    
                    // Callback avec délai
                    setTimeout(() => {
                        try {
                            if (onDateSelect) {
                                console.log('📅 Appel du callback onDateSelect avec date:', date);
                                onDateSelect(date);
                            }
                        } catch (error) {
                            console.error('❌ Erreur dans le callback onDateSelect:', error);
                        }
                        
                        // ✅ SUPPRIMÉ: Ne plus appeler updateSelectedDatesFromButtons
                        // this.updateSelectedDatesFromButtons(container, config);
                        
                        // Libérer le flag de sélection
                        isSelecting = false;
                    }, 10);
                    
                    return false;
                };
                
                // Stocker le handler
                btn._dateClickHandler = clickHandler;
                
                // Attacher avec capture
                btn.addEventListener('click', clickHandler, true);
                
                // Événements hover améliorés
                const hoverInHandler = (e) => {
                    e.stopPropagation();
                    if (!btn.disabled && !btn.style.backgroundColor.includes('800000')) {
                        const isCurrentMonth = btn.getAttribute('data-is-current-month') === 'true';
                        btn.style.backgroundColor = isCurrentMonth ? '#e9ecef' : '#efefef';
                    }
                };
                
                const hoverOutHandler = (e) => {
                    e.stopPropagation();
                    if (!btn.disabled && !btn.style.backgroundColor.includes('800000')) {
                        const isCurrentMonth = btn.getAttribute('data-is-current-month') === 'true';
                        btn.style.backgroundColor = isCurrentMonth ? 'transparent' : '#f8f8f8';
                    }
                };
                
                btn.addEventListener('mouseover', hoverInHandler);
                btn.addEventListener('mouseout', hoverOutHandler);
                
                btn._hoverInHandler = hoverInHandler;
                btn._hoverOutHandler = hoverOutHandler;
            });
            
            // ✅ AJOUTER: Événements de navigation
            const navButtons = container.querySelectorAll('.nav-month-btn');
            console.log('🔧 Boutons de navigation trouvés:', navButtons.length);

            navButtons.forEach(navBtn => {
                navBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const direction = parseInt(navBtn.getAttribute('data-direction'));
                    console.log('📅 Navigation mois, direction:', direction);
                    
                    // Récupérer mois/année actuels
                    let currentMonth = parseInt(container.getAttribute('data-current-month'));
                    let currentYear = parseInt(container.getAttribute('data-current-year'));
                    
                    console.log('📅 Mois/année actuels avant navigation:', { currentMonth, currentYear });
                    
                    // Calculer nouveau mois/année
                    currentMonth += direction;
                    if (currentMonth > 11) {
                        currentMonth = 0;
                        currentYear++;
                    } else if (currentMonth < 0) {
                        currentMonth = 11;
                        currentYear--;
                    }
                    
                    console.log('📅 Nouveau mois/année calculé:', { year: currentYear, month: currentMonth + 1 });
                    
                    // ✅ CORRECTION: Récupérer les dates actuellement sélectionnées AVANT régénération
                    const currentlySelectedDates = [];
                    const selectedButtons = document.querySelectorAll('.calendar-day-btn[style*="var(--color-primary"]');
                    selectedButtons.forEach(btn => {
                        const dateStr = btn.getAttribute('data-date');
                        if (dateStr) {
                            // Parser la date correctement
                            const dateParts = dateStr.split('-');
                            const year = parseInt(dateParts[0]);
                            const month = parseInt(dateParts[1]) - 1;
                            const day = parseInt(dateParts[2]);
                            currentlySelectedDates.push(new Date(year, month, day));
                        }
                    });
                    
                    console.log('📅 Dates sélectionnées avant navigation:', currentlySelectedDates.map(d => d.toLocaleDateString('fr-CH')));
                    
                    // Mettre à jour les attributs
                    container.setAttribute('data-current-month', currentMonth.toString());
                    container.setAttribute('data-current-year', currentYear.toString());
                    
                    // ✅ CORRECTION: Créer une nouvelle config avec les dates sélectionnées
                    const updatedConfig = {
                        ...config,
                        initialDates: currentlySelectedDates // ✅ Préserver les dates sélectionnées
                    };
                    
                    console.log('📅 Regénération du calendrier avec dates préservées...');
                    
                    // Regénérer le calendrier avec les dates préservées
                    this.renderDatePickerFallback(container, updatedConfig);
                });

                // Effets hover pour les boutons de navigation
                navBtn.addEventListener('mouseover', () => {
                    navBtn.style.backgroundColor = '#f5f5f5';
                    navBtn.style.color = '#333';
                });
                
                navBtn.addEventListener('mouseout', () => {
                    navBtn.style.backgroundColor = 'transparent';
                    navBtn.style.color = '#666';
                });
            });
            
            console.log('✅ Événements initialisés pour', dayButtons.length, 'boutons');
        }, 50);
    }

    /**
     * Méthode simple pour vérifier si deux dates sont identiques
     */
    isSameDay(date1, date2) {
        if (!date1 || !date2) return false;
        return (
            date1.getDate() === date2.getDate() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getFullYear() === date2.getFullYear()
        );
    }

    /**
     * Gérer la sélection d'une date
     */
    handleDateSelect(selectedDate, currentDates, multiSelect, context = null) {
        console.log('📅 handleDateSelect appelé:', {
            selectedDate: selectedDate.toLocaleDateString('fr-CH'),  
            currentDatesCount: currentDates.length,
            multiSelect: multiSelect,
            context: context
        });
        
        // Vérification stricte des dates futures
        const today = new Date();
        const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const selectedDateOnly = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
        
        if (selectedDateOnly > todayDateOnly) {
            console.warn('⚠️ Date future non autorisée pour les paiements');
            return currentDates;
        }
        
        // Pour les paiements, TOUJOURS remplacer par la nouvelle sélection
        if (!multiSelect || context === 'payment') {
            console.log('📅 Mode sélection unique - REMPLACEMENT complet par la nouvelle date');
            console.log('📅 Context:', context, 'MultiSelect:', multiSelect);
            return [selectedDate];
        }

        // Mode multi-sélection (pour d'autres contextes)
        const dateExists = currentDates.some(date => 
            DateService.isSameDay(date, selectedDate)
        );

        if (dateExists) {
            console.log('📅 Date déjà sélectionnée - suppression');
            return currentDates.filter(date => 
                !DateService.isSameDay(date, selectedDate)
            );
        } else {
            console.log('📅 Nouvelle date - ajout à la sélection');
            return [...currentDates, selectedDate];
        }
    }

    /**
     * Mettre à jour l'affichage des dates sélectionnées
     */
    updateSelectedDatesDisplay(container, selectedDates) {
        let displayContainer = container;
        
        if (!displayContainer) {
            console.log('🔧 Container null, recherche dans le document...');
            displayContainer = document.querySelector('.unified-modal-container');
        }
        
        if (!displayContainer) {
            console.warn('⚠️ Aucun container trouvé pour mettre à jour l\'affichage des dates');
            return;
        }
        
        const countElement = displayContainer.querySelector('#selected-count');
        const listElement = displayContainer.querySelector('#selected-list');
        
        if (countElement) {
            countElement.textContent = selectedDates.length;
        }
        
        if (listElement) {
            if (selectedDates.length === 0) {
                listElement.textContent = 'Aucune date sélectionnée';
            } else {
                const formattedDates = selectedDates
                    .sort((a, b) => DateService.compareDatesOnly ? DateService.compareDatesOnly(a, b) : a - b)
                    .map(date => DateService.formatSingleDate ? DateService.formatSingleDate(date) : date.toLocaleDateString('fr-CH'))
                    .join(', ');
                listElement.textContent = formattedDates;
            }
        }
    }

    /**
     * Mettre à jour le bouton de confirmation
     */
    updateConfirmButton(container, selectedDates, confirmText) {
        // Recherche robuste du container
        let buttonContainer = container;
        
        if (!buttonContainer) {
            console.log('🔧 Container null, recherche du bouton dans le document...');
            buttonContainer = document.querySelector('.unified-modal-container');
        }
        
        if (!buttonContainer) {
            console.warn('⚠️ Aucun container trouvé pour le bouton de confirmation');
            return;
        }
        
        const confirmBtn = buttonContainer.querySelector('[data-action="confirm"]');
        if (!confirmBtn) {
            console.warn('⚠️ Bouton de confirmation non trouvé');
            return;
        }
        
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
                // Forcer maxDate à aujourd'hui si le contexte ne permet pas le futur
                config.maxDate = new Date();
            }
        }
        
        return { isValid: true };
    }

    /**
     * Obtenir la configuration selon le contexte
     */
    getContextConfig(context) {
        // Utiliser CONTEXT_CONFIGS si disponible
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