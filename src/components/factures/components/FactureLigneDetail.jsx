import React, { useMemo } from 'react';
import { 
    FiMove, 
    FiChevronUp, 
    FiChevronDown, 
    FiCopy, 
    FiTrash2, 
    FiClipboard 
} from 'react-icons/fi';

import GlobalDateInputField from '../../../context/GlobalDateInputField';
import { formatMontant } from '../../../utils/formatters';

// Import du CSS spécifique
import '../../../styles/components/factures/FactureLigneDetail.css';

/**
 * Composant de sélection de service pour une ligne de facture
 */
const ServiceSelect = ({ 
    ligne = {}, 
    index, 
    services = [], // Valeur par défaut pour éviter undefined
    modifierLigne, 
    handleFocus, 
    handleBlur, 
    validationErrors = {} // Valeur par défaut pour éviter undefined
}) => {
    const errorClass = validationErrors[index]?.serviceType ? 'fdf_error-validation' : '';

    return (
        <div className={`fdf_floating-label-input ${ligne.serviceType ? 'has-value' : ''}`}>
            <select
                id={`serviceType-${index}`}
                value={ligne.serviceType || ''}
                onChange={(e) => modifierLigne(index, 'serviceType', e.target.value)}
                onFocus={() => handleFocus && handleFocus(index, 'serviceType')}
                onBlur={() => handleBlur && handleBlur(index, 'serviceType', ligne.serviceType)}
                className={`fdf_form-control ${errorClass}`}
                required
            >
                <option value="">Sélectionner un service</option>
                {Array.isArray(services) && services.map(service => (
                    <option 
                        key={`service-${service.id || index}`} 
                        value={service.code || ''}
                    >
                        {service.nom || 'Service sans nom'}
                    </option>
                ))}
            </select>
            <label htmlFor={`serviceType-${index}`}>
                Type de service <span className="fdf_required">*</span>
            </label>
            {validationErrors[index]?.serviceType && (
                <div className="fdf_error-message">
                    {validationErrors[index].serviceType}
                </div>
            )}
        </div>
    );
};

/**
 * Composant de sélection d'unité pour une ligne de facture
 */
const UniteSelect = ({ 
    ligne = {}, 
    index, 
    unites = [], // Valeur par défaut pour éviter undefined
    unitesByService = {}, // Valeur par défaut pour éviter undefined
    modifierLigne, 
    handleFocus, 
    handleBlur, 
    validationErrors = {} // Valeur par défaut pour éviter undefined
}) => {
    // Générer les options d'unités basées sur le service sélectionné
    const uniteOptions = useMemo(() => {
        // Vérification sécurisée des données
        if (!ligne || !ligne.serviceType) return [];
        
        // S'assurer que unitesByService et unites sont des objets/tableaux valides
        const unitesDisponibles = (unitesByService && unitesByService[ligne.serviceType]) || [];
        
        if (!Array.isArray(unitesDisponibles) || !Array.isArray(unites)) return [];
        
        // CORRECTION LIGNE 214 - S'assurer que les tableaux sont correctement définis
        // et retourner un tableau d'options valide
        return unitesDisponibles
            .map(unite => {
                if (!unite) return null;
                
                const uniteObj = unites.find(u => u && u.code === unite);
                return uniteObj ? (
                    <option 
                        key={`unite-${uniteObj.code || index}`} 
                        value={uniteObj.code || ''}
                    >
                        {uniteObj.nom || 'Unité sans nom'}
                    </option>
                ) : null;
            })
            .filter(Boolean); // Enlever les éléments null ou undefined
    }, [ligne, ligne?.serviceType, unitesByService, unites, index]);

    const errorClass = validationErrors[index]?.unite ? 'fdf_error-validation' : '';

    return (
        <div className={`fdf_floating-label-input ${ligne.unite ? 'has-value' : ''}`}>
            <select
                id={`unite-${index}`}
                value={ligne.unite || ''}
                onChange={(e) => modifierLigne(index, 'unite', e.target.value)}
                onFocus={() => handleFocus && handleFocus(index, 'unite')}
                onBlur={() => handleBlur && handleBlur(index, 'unite', ligne.unite)}
                disabled={!ligne.serviceType}
                className={`fdf_form-control ${errorClass}`}
                required
            >
                <option value="">Sélectionner une unité</option>
                {uniteOptions}
            </select>
            <label htmlFor={`unite-${index}`}>
                Unité <span className="fdf_required">*</span>
            </label>
            {validationErrors[index]?.unite && (
                <div className="fdf_error-message">
                    {validationErrors[index].unite}
                </div>
            )}
        </div>
    );
};

/**
 * Composant de saisie de description avec compteur de caractères
 */
const DescriptionInput = ({ 
    ligne = {}, 
    index, 
    modifierLigne, 
    handleFocus, 
    handleBlur, 
    insertUniteNameInDescription, 
    validationErrors = {} // Valeur par défaut pour éviter undefined
}) => {
    const charactersUsed = (ligne.description || '').length;
    const charactersRemaining = 200 - charactersUsed;
    const isClipboardDisabled = !ligne.unite;
    const errorClass = validationErrors[index]?.description ? 'fdf_error-validation' : '';

    return (
        <div className="fdf_description-group">
            <div className={`fdf_floating-label-input ${ligne.description ? 'has-value' : ''}`}>
                <input
                    type="text"
                    id={`description-${index}`}
                    value={ligne.description || ''}
                    onChange={(e) => {
                        const newValue = e.target.value.slice(0, 200);
                        modifierLigne(index, 'description', newValue);
                    }}
                    onFocus={() => handleFocus && handleFocus(index, 'description')}
                    onBlur={() => handleBlur && handleBlur(index, 'description', ligne.description)}
                    className={`fdf_form-control ${errorClass}`}
                    placeholder=" "
                    maxLength="200"
                    required
                />
                <label htmlFor={`description-${index}`}>
                    Description <span className="fdf_required">*</span>
                </label>

                <FiClipboard
                    className={`fdf_clipboard-icon ${isClipboardDisabled ? 'fdf_icon-disabled' : ''}`}
                    onClick={() => !isClipboardDisabled && insertUniteNameInDescription && insertUniteNameInDescription(index)}
                    title={isClipboardDisabled ? "Veuillez d'abord sélectionner une unité" : "Copier le nom de l'unité en FAUX de description"}
                />

                {validationErrors[index]?.description && (
                    <div className="fdf_error-message">
                        {validationErrors[index].description}
                    </div>
                )}

                <div 
                    className="fdf_char-limit-info" 
                    style={{
                        color: charactersRemaining < 20 ? '#d32f2f' : '#666'
                    }}
                >
                    {charactersRemaining} caractère{charactersRemaining !== 1 ? 's' : ''} restant{charactersRemaining !== 1 ? 's' : ''}
                </div>
            </div>
        </div>
    );
};

/**
 * Composant principal de détail de ligne de facture
 */
const FactureLigneDetail = ({
    ligne = {}, // Valeur par défaut pour éviter undefined
    index,
    services = [], // Valeur par défaut pour éviter undefined
    unites = [], // Valeur par défaut pour éviter undefined
    unitesByService = {}, // Valeur par défaut pour éviter undefined
    lignesOuvertes = {}, // Valeur par défaut pour éviter undefined
    focusedFields = {}, // Valeur par défaut pour éviter undefined
    validationErrors = {}, // Valeur par défaut pour éviter undefined
    modifierLigne = () => {}, // Fonction vide par défaut
    supprimerLigne = () => {}, // Fonction vide par défaut
    toggleLigneOuverte = () => {}, // Fonction vide par défaut
    handleFocus = () => {}, // Fonction vide par défaut
    handleBlur = () => {}, // Fonction vide par défaut
    insertUniteNameInDescription = () => {}, // Fonction vide par défaut
    onCopierLigne = () => {}, // Fonction vide par défaut
    readOnly = false,
    draggingIndex = null
}) => {
    // Calculs et états dérivés
    const isOuverte = lignesOuvertes[index] === true;
    const hasLineErrors = validationErrors[index] && Object.keys(validationErrors[index] || {}).length > 0;
    const canSupprimerLigne = index > 0;
    const totalLigne = parseFloat(ligne.quantite || 0) * parseFloat(ligne.prixUnitaire || 0);

    // Rendu des actions
    const renderActions = () => (
        <div className="fdf_actions_container">
            {!readOnly && (
                <>
                    <button 
                        onClick={() => {
                            const ligneCopie = { 
                                ...ligne, 
                                id: undefined, 
                                noOrdre: undefined
                            };
                            
                            if (typeof onCopierLigne === 'function') {
                                onCopierLigne(ligneCopie);
                            }
                        }}
                        className="fdf_action_btn"
                        title="Copier la ligne"
                    >
                        <FiCopy strokeWidth={2} />
                    </button>

                    <button 
                        onClick={() => canSupprimerLigne && supprimerLigne(index)}
                        className={`fdf_action_btn ${!canSupprimerLigne ? 'fdf_disabled' : ''}`}
                        disabled={!canSupprimerLigne}
                        title={!canSupprimerLigne ? "Au moins une ligne est requise" : "Supprimer la ligne"}
                    >
                        <FiTrash2 strokeWidth={2} />
                    </button>
                </>
            )}

            <button 
                onClick={() => toggleLigneOuverte(index)}
                className={`fdf_action_btn ${hasLineErrors ? 'fdf_has_error' : ''}`}
                title={hasLineErrors ? "Cette ligne contient des erreurs" : "Fermer"}
            >
                {isOuverte ? <FiChevronUp strokeWidth={2} /> : <FiChevronDown strokeWidth={2} />}
            </button>
        </div>
    );

    return (
        <div 
            className={`fdf_line-container 
                ${draggingIndex === index ? 'dragging' : ''} 
                ${hasLineErrors ? 'fdf_has-errors' : ''}`}
            draggable={!readOnly}
        >
            {/* Pastille de numéro d'ordre */}
            <div 
                className={`fdf_order-badge ${!readOnly ? 'fdf_draggable' : ''}`}
                title={!readOnly ? "Glisser pour déplacer" : ""}
            >
                {ligne.noOrdre || index + 1}
                {!readOnly && <FiMove size={8} className="fdf_drag-icon" />}
            </div>

            <div className="fdf_line-flex-container">
                {/* Actions */}
                {renderActions()}

                {/* Contenu de la ligne */}
                <div className="fdf_table-row fdf_service-col">
                    <ServiceSelect
                        ligne={ligne}
                        index={index}
                        services={services}
                        modifierLigne={modifierLigne}
                        handleFocus={handleFocus}
                        handleBlur={handleBlur}
                        validationErrors={validationErrors}
                    />

                    <UniteSelect
                        ligne={ligne}
                        index={index}
                        unites={unites}
                        unitesByService={unitesByService}
                        modifierLigne={modifierLigne}
                        handleFocus={handleFocus}
                        handleBlur={handleBlur}
                        validationErrors={validationErrors}
                    />
                </div>

                {/* Description */}
                <div className="fdf_table-row fdf_description-row">
                    <DescriptionInput
                        ligne={ligne}
                        index={index}
                        modifierLigne={modifierLigne}
                        handleFocus={handleFocus}
                        handleBlur={handleBlur}
                        insertUniteNameInDescription={insertUniteNameInDescription}
                        validationErrors={validationErrors}
                    />

                    {/* Champ des dates */}
                    <GlobalDateInputField
                        id={`descriptionDates-${index}`}
                        label="Dates"
                        value={ligne.descriptionDates || ''}
                        onChange={(e) => modifierLigne(index, 'descriptionDates', e.target.value)}
                        updateQuantity={(formattedDates, count) => {
                            modifierLigne(index, 'descriptionDates', formattedDates);
                            // Mise à jour séparée de la quantité pour déclencher le recalcul du total
                            setTimeout(() => {
                                modifierLigne(index, 'quantite', count);
                            }, 50); // Petit délai pour s'assurer que les dates sont mises à jour en premier
                        }}
                        readOnly={readOnly}
                        maxLength={100}
                    />
                </div>

                {/* Ligne numérique : Quantité, Prix, Total */}
                <div className="fdf_table-row fdf_numeric-row">
                    {/* Composants pour quantité, prix, total à implémenter de manière similaire */}
                    <div className={`fdf_floating-label-input ${ligne.quantite ? 'has-value' : ''}`}>
                        <input
                            type="number"
                            id={`quantite-${index}`}
                            value={ligne.quantite || ''}
                            onChange={(e) => modifierLigne(
                                index, 
                                'quantite', 
                                e.target.value === '' ? '' : parseFloat(e.target.value)
                            )}
                            min="0"
                            step="0.01"
                            className={`fdf_form-control fdf_text-right ${validationErrors[index]?.quantite ? 'fdf_error-validation' : ''}`}
                            required
                        />
                        <label htmlFor={`quantite-${index}`}>
                            Quantité <span className="fdf_required">*</span>
                        </label>
                        {validationErrors[index]?.quantite && (
                            <div className="fdf_error-message">
                                {validationErrors[index].quantite}
                            </div>
                        )}
                    </div>

                    <div className={`fdf_floating-label-input ${ligne.prixUnitaire ? 'has-value' : ''}`}>
                        <input
                            type="number"
                            id={`prixUnitaire-${index}`}
                            value={ligne.prixUnitaire || ''}
                            onChange={(e) => modifierLigne(
                                index, 
                                'prixUnitaire', 
                                e.target.value === '' ? '' : parseFloat(e.target.value)
                            )}
                            min="0"
                            step="0.01"
                            className={`fdf_form-control fdf_text-right ${validationErrors[index]?.prixUnitaire ? 'fdf_error-validation' : ''}`}
                            required
                        />
                        <label htmlFor={`prixUnitaire-${index}`}>
                            Prix unitaire <span className="fdf_required">*</span>
                        </label>
                        <span className="fdf_currency-suffix">CHF</span>
                        {validationErrors[index]?.prixUnitaire && (
                            <div className="fdf_error-message">
                                {validationErrors[index].prixUnitaire}
                            </div>
                        )}
                    
                    </div>

                    <div className={`fdf_floating-label-input ${ligne.total ? 'has-value' : ''}`}>
                        <input
                            type="text"
                            id={`total-${index}`}
                            value={`${formatMontant(totalLigne)} CHF`}
                            readOnly
                            className="fdf_form-control fdf_text-right"
                        />
                        <label htmlFor={`total-${index}`}>Total</label>
                    </div>
                </div>

                {/* Indication des erreurs globales */}
                {hasLineErrors && (
                    <div className="fdf_error-summary">
                        {Object.entries(validationErrors[index] || {}).map(([champ, message]) => (
                            <div 
                                key={champ} 
                                className="fdf_error-indicator"
                            >
                                {message}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// Optimisation des performances avec React.memo et comparaison personnalisée
export default React.memo(FactureLigneDetail, (prevProps, nextProps) => {
    // Liste des props critiques à comparer
    const criticalProps = [
        'ligne', 
        'index', 
        'lignesOuvertes', 
        'validationErrors', 
        'readOnly',
        'draggingIndex'
    ];

    // Vérifier que les props sont définies avant comparaison
    if (!prevProps || !nextProps) return false;

    // Comparaison approfondie des props critiques
    return criticalProps.every(prop => {
        // Si une prop n'est pas définie dans l'un des objets, traiter comme différente
        if (prevProps[prop] === undefined && nextProps[prop] === undefined) return true;
        if (prevProps[prop] === undefined || nextProps[prop] === undefined) return false;

        // Comparaison spécifique pour les objets complexes
        if (prop === 'ligne') {
            const prevLigne = prevProps[prop] || {};
            const nextLigne = nextProps[prop] || {};
            return [
                'serviceType', 
                'unite', 
                'description', 
                'descriptionDates', 
                'quantite', 
                'prixUnitaire', 
                'total'
            ].every(key => prevLigne[key] === nextLigne[key]);
        }

        // Comparaison standard pour les autres props
        return prevProps[prop] === nextProps[prop];
    });
});