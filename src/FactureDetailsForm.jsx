import React, { useEffect } from 'react';
import './FactureDetailsForm.css';
import { FiChevronDown, FiChevronUp, FiCopy, FiMove, FiTrash, FiClipboard } from 'react-icons/fi';
import LigneFactureResume from './LigneFactureResume';
import { useTraceUpdate } from './useTraceUpdate';
// Hook personnalisé
import { useFactureDetailsForm } from './components/factures/hooks/useFactureDetailsForm';
// Utilitaires
import DateInputField from './components/shared/DateInputField'; // ✅ CHANGEMENT: Import du nouveau composant unifié
// ✅ CORRECTION: Import du formatter centralisé
import { formatMontant } from './utils/formatters';

/**
 * Composant pour l'affichage et l'édition des détails d'une facture (lignes)
 * ✅ MISE À JOUR: Utilise maintenant le système modal unifié pour les dates
 */
function FactureDetailsForm({ 
    onLignesChange, 
    lignesInitiales = null, 
    isModification = false, 
    client = null, 
    readOnly = false,
    onResetRistourne = null
}) {
    useTraceUpdate({ onLignesChange, client, readOnly }, 'FactureDetailsForm');
    console.log('⭐ FactureDetailsForm rendu');
    
    // Utiliser le hook personnalisé pour TOUTE la gestion des lignes
    const {
        // États principaux
        lignes,
        isLoading,
        message,
        messageType,
        totalGeneral,
        tarifInfo,
        
        // Configuration
        services,
        unites,
        unitesByService,
        
        // États de gestion des lignes
        lignesOuvertes,
        focusedFields,
        validationErrors,
        draggingIndex,
        
        // ✅ SUPPRESSION: États du sélecteur de dates (plus nécessaires)
        // showDatePicker,
        // activeLigneIndex,
        // selectedDates,
        
        // Méthodes principales
        ajouterLigne,
        modifierLigne,
        supprimerLigne,
        insertUniteNameInDescription,
        copierLigne,
        
        // Méthodes de validation
        hasErrors,
        getErrorClass,
        
        // Méthodes d'état
        toggleLigneOuverte,
        
        // Méthodes de gestion des champs
        handleFocus,
        handleBlur,
        
        // Méthodes de drag and drop
        handleDragStart,
        handleDragOver,
        handleDrop,
        handleDragEnd,
        
        // ✅ SUPPRESSION: Méthodes du sélecteur de dates (plus nécessaires)
        // openDatePicker,
        // closeDatePicker,
        // handleDateSelect,
        // addSelectedDatesToDescription,
        
        // Références
        prixModifiesManuel,
        
        // Services
        DateService,
    } = useFactureDetailsForm(
        client, 
        readOnly, 
        lignesInitiales, 
        onLignesChange, 
        onResetRistourne
    );

    // ======== FONCTIONS DE RENDU ========

    /**
     * Rend un champ en mode lecture seule
     */
    function renderReadOnlyField(label, value, className = "") {
        // ✅ CORRECTION: Utilisation du formatter centralisé pour tous les prix
        if (label === "Prix unitaire" || label === "Total") {
            if (typeof value === 'number') {
                value = `${formatMontant(value)} CHF`;
            } else if (typeof value === 'string' && value.includes('CHF') && !value.includes(' CHF')) {
                value = value.replace('CHF', ' CHF');
            }
        }
         // Pour le champ Type de service, convertir le code en nom
        if (label === "Type de service" && value) {
            const serviceObj = services.find(s => s.code === value);
            if (serviceObj && serviceObj.nom) {
                value = serviceObj.nom;
            }
        }
        
        // Pour le champ Unité, convertir le code en nom
        if (label === "Unité" && value) {
            const uniteObj = unites.find(u => u.code === value);
            if (uniteObj && uniteObj.nom) {
                value = uniteObj.nom;
            }
        }
        
        return (
            <div className="fdf_readonly-field">
                <label>{label}</label>
                <div className={`fdf_field-value ${className ? 'fdf_' + className : ''}`}>{value}</div>
            </div>
        );
    }
    
    /**
     * Rend le sélecteur de type de service
     */
    function renderServiceTypeSelect(ligne, index) {
        const errorClass = getErrorClass(index, 'serviceType');
        const hasValue = ligne.serviceType !== undefined && ligne.serviceType !== '';
        
        return (
            <div className={`fdf_floating-label-input ${focusedFields[`serviceType-${index}`] ? 'fdf_focused' : ''} ${hasValue ? 'has-value' : ''}`}>
                <select 
                    id={`serviceType-${index}`}
                    value={ligne.serviceType || ''}
                    onChange={(e) => modifierLigne(index, 'serviceType', e.target.value)}
                    onFocus={() => handleFocus(index, 'serviceType')}
                    onBlur={() => handleBlur(index, 'serviceType', ligne.serviceType)}
                    className={`fdf_form-control ${errorClass}`}
                    required
                >
                    <option value="">Sélectionner un service</option>
                    {services
                        .filter(service => service && service.id && service.code && service.nom)
                        .map(service => (
                            <option 
                                key={`service-${service.id}`} 
                                value={service.code}
                            >
                                {service.nom}
                            </option>
                        ))
                    }
                </select>
                <label htmlFor={`serviceType-${index}`}>Type de service <span className="fdf_required">*</span></label>
                {validationErrors[index]?.serviceType && (
                    <div className="fdf_error-message">{validationErrors[index].serviceType}</div>
                )}
            </div>
        );
    }
    
    /**
     * Rend le sélecteur d'unité
     */
    function renderUniteSelect(ligne, index) {
        const errorClass = getErrorClass(index, 'unite');
        const hasValue = ligne.unite !== undefined && ligne.unite !== '';
        
        return (
            <div className={`fdf_floating-label-input ${focusedFields[`unite-${index}`] ? 'fdf_focused' : ''} ${hasValue ? 'has-value' : ''}`}>
                <select
                    id={`unite-${index}`}
                    value={ligne.unite || ''}
                    onChange={(e) => modifierLigne(index, 'unite', e.target.value)}
                    onFocus={() => handleFocus(index, 'unite')}
                    onBlur={() => handleBlur(index, 'unite', ligne.unite)}
                    disabled={!ligne.serviceType}
                    className={`fdf_form-control ${errorClass}`}
                    required
                >
                    <option key="default" value="">Sélectionnez une unité</option>
                    {getUniteOptions(ligne)}
                </select>
                <label htmlFor={`unite-${index}`}>Unité <span className="fdf_required">*</span></label>
                {validationErrors[index]?.unite && (
                    <div className="fdf_error-message">{validationErrors[index].unite}</div>
                )}
            </div>
        );
    }
    
    /**
     * Génère les options pour le sélecteur d'unité
     */
    function getUniteOptions(ligne) {
        // Vérification de sécurité
        if (!ligne || !ligne.serviceType) {
            return fallbackOptions();
        }
        
        // Vérifier si nous avons des unités pré-mappées dans unitesByService
        if (unitesByService && unitesByService[ligne.serviceType] && unitesByService[ligne.serviceType].length > 0) {
            // Vérifier si les valeurs sont des chaînes ou des objets
            const options = unitesByService[ligne.serviceType].map(unite => {
                if (typeof unite === 'string') {
                    // Si c'est une chaîne, trouver l'objet unite correspondant pour obtenir le nom
                    const uniteObj = unites.find(u => u && u.code === unite);
                    return (
                        <option 
                            key={`unite-${unite}`} 
                            value={unite}
                        >
                            {uniteObj?.nom || unite}
                        </option>
                    );
                } else if (typeof unite === 'object' && unite !== null) {
                    // Si c'est un objet, utiliser directement ses propriétés
                    return (
                        <option 
                            key={`unite-${unite.code || unite.id}`} 
                            value={unite.code || unite.id}
                        >
                            {unite.nom || unite.code || unite.id}
                        </option>
                    );
                }
                return null;
            }).filter(option => option !== null);
            
            if (options.length > 0) {
                return options;
            }
        }
        
        // Si aucun mapping n'est disponible, filtrer directement les unités
        if (Array.isArray(unites) && unites.length > 0) {
            const unitesFiltered = unites.filter(u => 
                u && 
                (u.service_id === services.find(s => s.code === ligne.serviceType)?.id ||
                 u.service_code === ligne.serviceType)
            );
            
            if (unitesFiltered.length > 0) {
                return unitesFiltered.map(unite => (
                    <option 
                        key={`unite-${unite.code || unite.id}`} 
                        value={unite.code || unite.id}
                    >
                        {unite.nom || unite.code || unite.id}
                    </option>
                ));
            }
        }
        
        // Option de fallback pour LocationSalle
        if (ligne.serviceType === 'LocationSalle') {
            return [
                <option key="heure" value="Heure">Heure</option>,
                <option key="demijour" value="DemiJour">Demi-journée</option>,
                <option key="jour" value="Jour">Journée</option>,
                <option key="soiree" value="Soiree">Soirée</option>,
                <option key="weekend" value="Weekend">Weekend</option>
            ];
        }
        
        // Fallback général
        return fallbackOptions();
    }

    /**
     * Fonction helper pour fournir des options par défaut
     */
    function fallbackOptions() {
        return [
            <option key="heure" value="Heure">Heure</option>,
            <option key="journee" value="Journee">Journée</option>,
            <option key="forfait" value="Forfait">Forfait</option>
        ];
    }
    
    /**
     * ✅ MISE À JOUR: Rend le champ de description avec le nouveau DateInputField unifié
     */
    function renderDescriptionInput(ligne, index) {
        const errorClass = getErrorClass(index, 'description');
        
        // Déterminer si le bouton doit être désactivé (si aucune unité n'est sélectionnée)
        const isClipboardDisabled = !ligne.unite;
        
        // Calculer le nombre de caractères restants
        const charactersUsed = (ligne.description || '').length;
        const charactersRemaining = 200 - charactersUsed;
        
        // Vérifier si les champs ont des valeurs
        const hasDescriptionValue = ligne.description !== undefined && ligne.description !== '';
        
        return (
            <div className="fdf_description-group">
                {/* Description principale */}
                <div className={`fdf_floating-label-input ${focusedFields[`description-${index}`] ? 'fdf_focused' : ''} ${hasDescriptionValue ? 'has-value' : ''}`}>
                    <input
                        type="text"
                        id={`description-${index}`}
                        value={ligne.description || ''}
                        onChange={(e) => {
                            const newValue = e.target.value.slice(0, 200);
                            modifierLigne(index, 'description', newValue);
                        }}
                        onFocus={() => handleFocus(index, 'description')}
                        onBlur={() => handleBlur(index, 'description', ligne.description)}
                        className={`fdf_form-control ${errorClass}`}
                        placeholder=" "
                        maxLength="200"
                        required
                    />
                    <label htmlFor={`description-${index}`}>Description <span className="fdf_required">*</span></label>
                    
                    {/* Icône Clipboard pour l'aide à la saisie */}
                    <FiClipboard
                        className={`fdf_clipboard-icon ${isClipboardDisabled ? 'fdf_icon-disabled' : ''}`}
                        onClick={() => !isClipboardDisabled && insertUniteNameInDescription(index)}
                        title={isClipboardDisabled ? "Veuillez d'abord sélectionner une unité" : "Copier le nom de l'unité en début de description"}
                    />
                    
                    {validationErrors[index]?.description && (
                        <div className="fdf_error-message">{validationErrors[index].description}</div>
                    )}
                    
                    {/* Compteur de caractères pour description */}
                    <div className="fdf_char-limit-info" style={{
                        position: 'absolute',
                        right: '0',
                        bottom: validationErrors[index]?.description ? '-40px' : '-20px',
                        fontSize: '0.75rem',
                        color: charactersRemaining < 20 ? '#d32f2f' : '#666'
                    }}>
                        {charactersRemaining} caractère{charactersRemaining !== 1 ? 's' : ''} restant{charactersRemaining !== 1 ? 's' : ''}
                    </div>
                </div>
                
                {/* ✅ CHANGEMENT MAJEUR: Utilisation du nouveau DateInputField avec système modal unifié */}
                <DateInputField
                    id={`descriptionDates-${index}`}
                    label="Dates"
                    value={ligne.descriptionDates || ''}
                    onChange={(valueOrEvent) => {
                        // ✅ ADAPTATION: Gestion des deux types de changement
                        if (typeof valueOrEvent === 'string') {
                            // Changement via le modal picker - valeur directe
                            modifierLigne(index, 'descriptionDates', valueOrEvent);
                        } else if (valueOrEvent && valueOrEvent.target) {
                            // Changement manuel - event avec target.value
                            modifierLigne(index, 'descriptionDates', valueOrEvent.target.value);
                        }
                    }}
                    updateQuantity={(formattedDates, count) => {
                        // ✅ MISE À JOUR: Callback pour synchroniser avec la quantité
                        console.log('🔄 Mise à jour quantité depuis DateInputField:', count, 'dates');
                        modifierLigne(index, 'descriptionDates', formattedDates);
                        modifierLigne(index, 'quantite', count);
                        
                        // Mettre à jour l'état focusedFields pour que le label flotte
                        handleFocus(index, 'descriptionDates');
                        
                        // Ajouter la classe has-value au champ de quantité
                        setTimeout(() => {
                            const quantiteInput = document.getElementById(`quantite-${index}`);
                            if (quantiteInput && quantiteInput.parentElement) {
                                quantiteInput.parentElement.classList.add('has-value');
                            }
                        }, 10);
                    }}
                    readOnly={readOnly}
                    maxLength={100}
                    showCharCount={true}
                    multiSelect={true} // Mode multi-sélection pour les factures
                    required={false} // Le champ dates n'est pas obligatoire
                />
            </div>
        );
    }
    
    /**
     * Rend le champ de quantité
     */
    function renderQuantiteInput(ligne, index) {
        const errorClass = getErrorClass(index, 'quantite');
        const hasValue = ligne.quantite !== undefined && ligne.quantite !== '';
        
        return (
            <div className={`fdf_floating-label-input ${focusedFields[`quantite-${index}`] ? 'fdf_focused' : ''} ${hasValue ? 'has-value' : ''}`}>
                <input
                    type="number"
                    id={`quantite-${index}`}
                    value={ligne.quantite}
                    onChange={(e) => modifierLigne(
                        index, 
                        'quantite', 
                        e.target.value === '' ? '' : parseFloat(e.target.value)
                    )}
                    onFocus={() => handleFocus(index, 'quantite')}
                    onBlur={() => handleBlur(index, 'quantite', ligne.quantite)}
                    min="0"
                    step="0.01"
                    className={`fdf_form-control fdf_text-right ${errorClass}`}
                    placeholder=" "
                    required
                />
                <label htmlFor={`quantite-${index}`}>Quantité <span className="fdf_required">*</span></label>
                {validationErrors[index]?.quantite && (
                    <div className="fdf_error-message">{validationErrors[index].quantite}</div>
                )}
            </div>
        );
    }
    
    /**
     * Rend le champ de prix unitaire
     */
    function renderPrixUnitaireInput(ligne, index) {
        const isPriceModified = prixModifiesManuel.current[index];
        const errorClass = getErrorClass(index, 'prixUnitaire');
        const hasValue = ligne.prixUnitaire !== undefined && ligne.prixUnitaire !== '';
        
        return (
            <div className={`fdf_floating-label-input ${focusedFields[`prixUnitaire-${index}`] ? 'fdf_focused' : ''} ${isPriceModified ? 'fdf_price-modified' : ''} ${hasValue ? 'has-value' : ''}`}>
                <input
                    type="number"
                    id={`prixUnitaire-${index}`}
                    value={ligne.prixUnitaire}
                    onChange={(e) => {
                        const newPrice = e.target.value === '' ? '' : parseFloat(e.target.value);
                        modifierLigne(index, 'prixUnitaire', newPrice);
                    }}
                    onFocus={() => handleFocus(index, 'prixUnitaire')}
                    onBlur={() => handleBlur(index, 'prixUnitaire', ligne.prixUnitaire)}
                    min="0"
                    step="0.01"
                    className={`fdf_form-control fdf_text-right ${errorClass}`}
                    placeholder=" "
                    required
                />
                <label htmlFor={`prixUnitaire-${index}`}>Prix unitaire <span className="fdf_required">*</span></label>
                <span className="fdf_currency-suffix">CHF</span>
                {validationErrors[index]?.prixUnitaire && (
                    <div className="fdf_error-message">{validationErrors[index].prixUnitaire}</div>
                )}
            </div>
        );
    }
    
    /**
     * Rend le champ de total en lecture seule
     */
    function renderTotalInput(ligne, index) {
        const hasValue = ligne.total !== undefined && ligne.total !== '' && ligne.total !== 0;
        
        return (
            <div className={`fdf_floating-label-input ${focusedFields[`total-${index}`] ? 'fdf_focused' : 'fdf_filled'} ${hasValue ? 'has-value' : ''}`}>
                <input
                    type="text"
                    id={`total-${index}`}
                    // ✅ CORRECTION: Utilisation du formatter centralisé
                    value={`${formatMontant(ligne.total)} CHF`}
                    readOnly
                    onFocus={() => handleFocus(index, 'total')}
                    onBlur={() => handleBlur(index, 'total', ligne.total)}
                    className="fdf_form-control fdf_text-right"
                    placeholder=" "
                />
                <label htmlFor={`total-${index}`}>Total</label>
            </div>
        );
    }
    
	/**
     * Rend une ligne de détail de facture
     */
    function renderLigneDetail(ligne, index) {
        // Vérifier si la ligne est ouverte
        const isOuverte = lignesOuvertes[index] === true;
        
        // Vérifier si la ligne a des erreurs de validation
        const hasLineErrors = hasErrors(index);
        
        // Obtenir le numéro d'ordre (utiliser l'index + 1 si non défini)
        const noOrdre = ligne.noOrdre || index + 1;
    
        // Obtenir le nom complet du service et de l'unité directement à partir des IDs
        let serviceNom = "";
        let uniteNom = "";
        
        // Rechercher par ID uniquement
        if (ligne.serviceId) {
            const serviceObj = services.find(s => s && s.id === ligne.serviceId);
            if (serviceObj && serviceObj.nom) {
                serviceNom = serviceObj.nom;
            }
        }
        
        if (ligne.uniteId) {
            const uniteObj = unites.find(u => u && u.id === ligne.uniteId);
            if (uniteObj && uniteObj.nom) {
                uniteNom = uniteObj.nom;
            }
        }
        
        // Si la ligne est fermée, afficher le résumé (mode plié)
        if (!isOuverte) {
            return (
                <div 
                    className={`fdf_line-container ${draggingIndex === index ? 'dragging' : ''} ${hasLineErrors ? 'fdf_has-errors' : ''}`}
                    key={index}
                    draggable={!readOnly}
                    onDragStart={(e) => !readOnly && handleDragStart(e, index)}
                    onDragOver={(e) => !readOnly && handleDragOver(e)}
                    onDrop={(e) => !readOnly && handleDrop(e, index)}
                    onDragEnd={(e) => !readOnly && handleDragEnd(e)}
                >
                    {/* Pastille avec numéro d'ordre */}
                    <div 
                        className={`fdf_order-badge ${!readOnly ? 'fdf_draggable' : ''}`}
                        title={!readOnly ? "Glisser pour déplacer" : ""}
                    >
                        {noOrdre}
                        {!readOnly && <FiMove size={8} className="fdf_drag-icon" />}
                    </div>
    
                    <div className="fdf_line-resume-container">
                        {/* Afficher le résumé de la ligne */}
                        <LigneFactureResume 
                            serviceType={serviceNom}
                            unite={uniteNom}
                            description={ligne.description}
                            quantite={ligne.quantite}
                            prixUnitaire={ligne.prixUnitaire}
                            total={ligne.total}
                        />
                        
                        {/* Conteneur unique des boutons - en mode plié, seulement le bouton déplier est visible */}
                        <div className="fdf_actions_container">
                            {/* En mode plié, afficher uniquement le bouton déplier */}
                            <button 
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    toggleLigneOuverte(index);
                                }}
                                className={`fdf_action_btn ${hasLineErrors ? 'fdf_has_error' : ''}`}
                                title={hasLineErrors ? "Cette ligne contient des erreurs" : "Ouvrir pour édition"}
                            >
                                <FiChevronDown strokeWidth={2} />
                            </button>
                        </div>
                    </div>
                    
                    {/* Indicateur d'erreurs (si nécessaire) */}
                    {hasLineErrors && !isOuverte && !readOnly && (
                        <div className="fdf_error-indicator" onClick={() => toggleLigneOuverte(index)}>
                            <span>Champs obligatoires manquants</span>
                        </div>
                    )}
                </div>
            );
        }
        
        // Pour le mode déplié (mode édition ou lecture seule)
        return (
            <div 
                className={`fdf_line-container ${draggingIndex === index ? 'dragging' : ''} ${hasLineErrors ? 'fdf_has-errors' : ''}`}
                key={index}
                draggable={!readOnly}
                onDragStart={(e) => !readOnly && handleDragStart(e, index)}
                onDragOver={(e) => !readOnly && handleDragOver(e)}
                onDrop={(e) => !readOnly && handleDrop(e, index)}
                onDragEnd={(e) => !readOnly && handleDragEnd(e)}
            >
                {/* Pastille avec numéro d'ordre */}
                <div 
                    className={`fdf_order-badge ${!readOnly ? 'fdf_draggable' : ''}`}
                    title={!readOnly ? "Glisser pour déplacer" : ""}
                >
                    {noOrdre}
                    {!readOnly && <FiMove size={8} className="fdf_drag-icon" />}
                </div>
    
                <div className="fdf_line-flex-container">
                    {/* Conteneur unique des boutons - toujours présent */}
                    <div className="fdf_actions_container">
                        {/* En mode édition, montrer tous les boutons */}
                        {!readOnly && (
                            <>
                                {/* Bouton copier - utilise maintenant la méthode du hook */}
                                <button 
                                    onClick={(e) => {
                                        e.preventDefault();
                                        copierLigne(index);
                                    }}
                                    className="fdf_action_btn"
                                    title="Copier la ligne"
                                >
                                    <FiCopy strokeWidth={2} />
                                </button>
    
                                {/* Bouton supprimer */}
                                <button 
                                    onClick={() => supprimerLigne(index)} 
                                    className={`fdf_action_btn ${lignes.length <= 1 ? 'fdf_disabled' : ''}`}
                                    title={lignes.length <= 1 ? "Au moins une ligne est requise" : "Supprimer la ligne"}
                                    disabled={lignes.length <= 1}
                                >
                                    <FiTrash strokeWidth={2} />
                                </button>
                            </>
                        )}
    
                        {/* Bouton plier - toujours présent en mode déplié */}
                        <button 
                            onClick={() => toggleLigneOuverte(index)} 
                            className={`fdf_action_btn ${hasLineErrors ? 'fdf_has_error' : ''}`}
                            title={hasLineErrors ? "Cette ligne contient des erreurs" : "Fermer"}
                        >
                            <FiChevronUp strokeWidth={2} />
                        </button>
                    </div>
                    
                    {/* Contenu de la ligne - différents en mode édition et lecture seule */}
                    {!readOnly ? (
                        <>
                            {/* Première ligne - Type de service et Unité */}
                            <div className="fdf_table-row fdf_equal-columns">
                                <div className="fdf_table-cell fdf_service-col">
                                    {renderServiceTypeSelect(ligne, index)}
                                </div>
                                
                                <div className="fdf_table-cell fdf_unite-col">
                                    {renderUniteSelect(ligne, index)}
                                </div>
                            </div>
                            
                            {/* Deuxième ligne - Description */}
                            <div className="fdf_table-row fdf_description-row">
                                <div className="fdf_table-cell fdf_description-col fdf_full-width">
                                    {renderDescriptionInput(ligne, index)}
                                </div>
                            </div>
                            
                            {/* Troisième ligne - Quantité, Prix unitaire, Total */}
                            <div className="fdf_table-row fdf_numeric-row">
                                <div className="fdf_table-cell fdf_quantity-col">
                                    {renderQuantiteInput(ligne, index)}
                                </div>
                                
                                <div className="fdf_table-cell fdf_price-col">
                                    {renderPrixUnitaireInput(ligne, index)}
                                </div>
                                
                                <div className="fdf_table-cell fdf_total-col">
                                    {renderTotalInput(ligne, index)}
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Type de service et Unité */}
                            <div className="fdf_table-row fdf_equal-columns">
                                <div className="fdf_table-cell fdf_service-col">
                                    {renderReadOnlyField("Type de service", serviceNom)}
                                </div>
                                <div className="fdf_table-cell fdf_unite-col">
                                    {renderReadOnlyField("Unité", uniteNom)}
                                </div>
                            </div>
                            
                            {/* Description */}
                            <div className="fdf_table-row fdf_description-row">
                                <div className="fdf_table-cell fdf_description-col fdf_full-width">
                                    {renderReadOnlyField("Description", ligne.description)}
                                </div>
                            </div>
                            
                            {/* Description Dates (uniquement si présent) */}
                            {ligne.descriptionDates && (
                                <div className="fdf_table-row fdf_description-row">
                                    <div className="fdf_table-cell fdf_description-col fdf_full-width">
                                        {renderReadOnlyField("Dates", ligne.descriptionDates)}
                                    </div>
                                </div>
                            )}
                            
                            {/* Quantité, Prix unitaire, Total */}
                            <div className="fdf_table-row fdf_numeric-row">
                                <div className="fdf_table-cell fdf_quantity-col">
                                    {renderReadOnlyField("Quantité", ligne.quantite, "text-right")}
                                </div>
                                <div className="fdf_table-cell fdf_price-col">
                                    {renderReadOnlyField("Prix unitaire", formatMontant(ligne.prixUnitaire), "text-right")}
                                </div>
                                <div className="fdf_table-cell fdf_total-col">
                                    {renderReadOnlyField("Total", formatMontant(ligne.total), "text-right")}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    }
    
    console.log('⭐ Total général calculé dans FactureDetailsForm:', totalGeneral);
    
    // ======== RENDU PRINCIPAL ========
    return (
        <div className={`fdf_facture-details-form ${readOnly ? 'fdf_readonly-mode' : ''}`}>
            {/* En-tête du formulaire */}
            <div className="fdf_lignes-detail-titre">
                Lignes détail
                {tarifInfo && !readOnly && (
                <span className="fdf_tarif-info-badge">{tarifInfo}</span>
                )}
            </div>
            
            {/* Contenu principal */}
            {isLoading ? (
                <div className="fdf_loading-container">
                    <p>Chargement des services et unités...</p>
                </div>
                ) : message ? (
                    <div className={`fdf_error-message ${messageType}`}>
                        {message}
                    </div>
                ) : readOnly ? (
                    <div className="fdf_table-flex">
                        {/* Lignes de détail en mode lecture */}
                        {lignes.map((ligne, index) => {
                            // Vérifier si la ligne est ouverte
                            const isOuverte = lignesOuvertes[index] === true;
                            
                            // Obtenir le nom complet du service et de l'unité directement à partir des IDs
                            let serviceNom = "";
                            let uniteNom = "";
                            
                            // Rechercher par ID uniquement
                            if (ligne.serviceId) {
                                const serviceObj = services.find(s => s && s.id === ligne.serviceId);
                                if (serviceObj && serviceObj.nom) {
                                    serviceNom = serviceObj.nom;
                                }
                            }
                            
                            if (ligne.uniteId) {
                                const uniteObj = unites.find(u => u && u.id === ligne.uniteId);
                                if (uniteObj && uniteObj.nom) {
                                    uniteNom = uniteObj.nom;
                                }
                            }
                
                            // Obtenir le numéro d'ordre (utiliser l'index + 1 si non défini)
                            const noOrdre = ligne.noOrdre || index + 1;
                            
                            // Si la ligne est fermée, afficher le résumé
                            if (!isOuverte) {
                                return (
                                    <div className="fdf_line-container" key={index}>
                                        {/* Pastille avec numéro d'ordre */}
                                        <div className="fdf_order-badge">
                                            {noOrdre}
                                        </div>
                                        
                                        {/* Utiliser fdf_line-resume-container pour le mode lecture seule aussi */}
                                        <div className="fdf_line-resume-container">
                                            {/* Résumé de la ligne */}
                                            <LigneFactureResume 
                                                serviceType={serviceNom}
                                                unite={uniteNom}
                                                description={ligne.description}
                                                quantite={ligne.quantite}
                                                prixUnitaire={ligne.prixUnitaire}
                                                total={ligne.total}
                                            />
                                            
                                            {/* Bouton pour déplier */}
                                            <div className="fdf_actions_container">
                                                <button 
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        toggleLigneOuverte(index);
                                                    }}
                                                    className="fdf_action_btn"
                                                    title="Voir détails"
                                                >
                                                    <FiChevronDown 
                                                        className="fdf_toggle-icon"
                                                        strokeWidth={2}
                                                    />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }
                            
                            // Si la ligne est ouverte, afficher les détails en mode lecture seule
                            return (
                                <div className="fdf_line-container" key={index}>
                                    {/* Pastille avec numéro d'ordre */}
                                    <div className="fdf_order-badge">
                                        {noOrdre}
                                    </div>
                
                                    <div className="fdf_line-flex-container">
                                        {/* Bouton fermer */}
                                        <div className="fdf_actions_container">
                                            <button 
                                                onClick={() => toggleLigneOuverte(index)} 
                                                className="fdf_action_btn"
                                                title="Fermer"
                                            >
                                                <FiChevronUp 
                                                    className="fdf_toggle-icon"
                                                    strokeWidth={2}
                                                />
                                            </button>
                                        </div>
                                        
                                        {/* Type de service et Unité */}
                                        <div className="fdf_table-row fdf_equal-columns">
                                            <div className="fdf_table-cell fdf_service-col">
                                                {renderReadOnlyField("Type de service", serviceNom)}
                                            </div>
                                            <div className="fdf_table-cell fdf_unite-col">
                                                {renderReadOnlyField("Unité", uniteNom)}
                                            </div>
                                        </div>
                                        
                                        {/* Description */}
                                        <div className="fdf_table-row fdf_description-row">
                                            <div className="fdf_table-cell fdf_description-col fdf_full-width">
                                                {renderReadOnlyField("Description", ligne.description)}
                                            </div>
                                        </div>
                                        
                                        {/* Description Dates (uniquement si présent) */}
                                        {ligne.descriptionDates && (
                                            <div className="fdf_table-row fdf_description-row">
                                                <div className="fdf_table-cell fdf_description-col fdf_full-width">
                                                    {renderReadOnlyField("Dates", ligne.descriptionDates)}
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* Quantité, Prix unitaire, Total */}
                                        <div className="fdf_table-row fdf_numeric-row">
                                            <div className="fdf_table-cell fdf_quantity-col">
                                                {renderReadOnlyField("Quantité", ligne.quantite, "text-right")}
                                            </div>
                                            <div className="fdf_table-cell fdf_price-col">
                                                {renderReadOnlyField("Prix unitaire", formatMontant(ligne.prixUnitaire), "text-right")}
                                            </div>
                                            <div className="fdf_table-cell fdf_total-col">
                                                {renderReadOnlyField("Total", formatMontant(ligne.total), "text-right")}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}                          
                    </div>
                ) : (
                <div className="fdf_table-flex">
                    {/* Lignes de détail */}
                    {lignes.map((ligne, index) => renderLigneDetail(ligne, index))}
                    
                    {/* Bouton Ajouter une ligne (caché en mode lecture seule) */}
                    {!readOnly && (
                        <div className="fdf_ajouter-ligne-container">
                            <button 
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    ajouterLigne();
                                }}
                                className="btn-primary"
                            >
                                + Ajouter une ligne
                            </button>
                        </div>
                    )}
                </div>
            )}
            
            {/* ✅ SUPPRESSION: Ancien modal CustomDatePickerModal remplacé par le système unifié */}
            {/* Le nouveau DateInputField gère directement les modales via DatePickerModalHandler */}
        </div>
    );
}

export default FactureDetailsForm;