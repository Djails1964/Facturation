import React from 'react';
import { FiMove } from 'react-icons/fi';

// Composant existant (ne change pas)
import LigneFactureResume from './FactureLigneResume';

// CORRECTION : Import correct depuis FactureUIComponents
import { 
    LigneFactureActions, 
    OrderBadge 
} from '../../shared/FactureUIComponents';

// Composant des champs
import LigneFactureFields from './LigneFactureFields';

/**
 * Composant pour une ligne de facture individuelle
 * VERSION CORRIGÉE - Adaptation aux vraies données
 */
function LigneFactureForm({
    ligne,
    index,
    services,
    unites,
    unitesByService,
    lignesOuvertes,
    focusedFields,
    validationErrors,
    draggingIndex,
    prixModifiesManuel,
    readOnly,
    onModify,
    onToggle,
    onCopy,
    onDelete,
    onInsertUniteName,
    onFocus,
    onBlur,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd,
    hasErrors,
    getErrorClass
}) {
    // États dérivés
    const isOuverte = lignesOuvertes[index] === true;
    const hasLineErrors = hasErrors && typeof hasErrors === 'function' ? hasErrors() : false;
    const noOrdre = ligne.noOrdre || index + 1;
    const isDragging = draggingIndex === index;

    // ✅ CORRECTION : Obtenir les noms complets avec les bons champs
    const serviceNom = getServiceName(ligne.serviceType, services);
    const uniteNom = getUniteName(ligne.unite, unites);

    // Props pour le drag & drop
    const dragProps = readOnly ? {} : {
        draggable: true,
        onDragStart: (e) => onDragStart && onDragStart(e, index),
        onDragOver: onDragOver,
        onDrop: (e) => onDrop && onDrop(e, index),
        onDragEnd: onDragEnd
    };

    // Classes CSS
    const containerClasses = [
        'fdf_line-container',
        isDragging && 'dragging',
        hasLineErrors && 'fdf_has-errors'
    ].filter(Boolean).join(' ');

    // ✅ CORRECTION : Vérification des composants requis
    const ActionsComponent = LigneFactureActions || DefaultActions;
    const OrderComponent = OrderBadge || DefaultOrderBadge;

    return (
        <div className={containerClasses} {...dragProps}>
            <OrderComponent 
                number={noOrdre} 
                draggable={!readOnly}
            />

            {!isOuverte ? (
                // Mode résumé (ligne fermée)
                <div className="fdf_line-resume-container">
                    <LigneFactureResume 
                        serviceType={serviceNom}
                        unite={uniteNom}
                        description={ligne.description}
                        quantite={ligne.quantite}
                        prixUnitaire={ligne.prixUnitaire}
                        total={ligne.total}
                    />
                    
                    <ActionsComponent
                        index={index}
                        readOnly={readOnly}
                        hasErrors={hasLineErrors}
                        canDelete={true}
                        isOpen={false}
                        onToggle={() => onToggle && onToggle(index)}
                        onCopy={() => onCopy && onCopy(index)}
                        onDelete={() => onDelete && onDelete(index)}
                    />

                    {hasLineErrors && !readOnly && (
                        <div className="fdf_error-indicator" onClick={() => onToggle && onToggle(index)}>
                            <span>Champs obligatoires manquants</span>
                        </div>
                    )}
                </div>
            ) : (
                // Mode détaillé (ligne ouverte)
                <div className="fdf_line-flex-container">
                    <ActionsComponent
                        index={index}
                        readOnly={readOnly}
                        hasErrors={hasLineErrors}
                        canDelete={services && services.length > 1} // Logique métier
                        isOpen={true}
                        onCopy={() => onCopy && onCopy(index)}
                        onDelete={() => onDelete && onDelete(index)}
                        onToggle={() => onToggle && onToggle(index)}
                    />
                    
                    <LigneFactureFields
                        ligne={ligne}
                        index={index}
                        services={services || []}
                        unites={unites || []}
                        unitesByService={unitesByService || {}}
                        focusedFields={focusedFields || {}}
                        validationErrors={validationErrors || {}}
                        prixModifiesManuel={prixModifiesManuel || { current: {} }}
                        readOnly={readOnly}
                        serviceNom={serviceNom}
                        uniteNom={uniteNom}
                        onModify={onModify}
                        onInsertUniteName={onInsertUniteName}
                        onFocus={onFocus}
                        onBlur={onBlur}
                        getErrorClass={getErrorClass}
                    />
                </div>
            )}
        </div>
    );
}

// ✅ CORRECTION : Utilitaires adaptés aux vrais champs
function getServiceName(serviceCode, services) {
    if (!serviceCode || !services) return "";
    const serviceObj = services.find(s => s && s.code === serviceCode);
    return serviceObj?.nom || serviceCode;
}

function getUniteName(uniteCode, unites) {
    if (!uniteCode || !unites) return "";
    const uniteObj = unites.find(u => u && u.code === uniteCode);
    return uniteObj?.nom || uniteCode;
}

// ✅ Composants de fallback si les imports ne fonctionnent pas
function DefaultOrderBadge({ number, draggable }) {
    return (
        <div className={`fdf_order-badge ${draggable ? 'draggable' : ''}`}>
            {draggable && <FiMove className="drag-icon" />}
            {number}
        </div>
    );
}

function DefaultActions({ 
    index, 
    readOnly, 
    hasErrors, 
    canDelete, 
    isOpen, 
    onToggle, 
    onCopy, 
    onDelete 
}) {
    if (readOnly) {
        return null;
    }

    return (
        <div className="fdf_line-actions">
            <button 
                className="fdf_btn-small fdf_btn-toggle"
                onClick={onToggle}
                title={isOpen ? "Fermer" : "Ouvrir"}
            >
                {isOpen ? '▲' : '▼'}
            </button>
            
            {isOpen && (
                <>
                    <button 
                        className="fdf_btn-small fdf_btn-copy"
                        onClick={onCopy}
                        title="Copier"
                    >
                        📋
                    </button>
                    
                    {canDelete && (
                        <button 
                            className="fdf_btn-small fdf_btn-delete"
                            onClick={onDelete}
                            title="Supprimer"
                        >
                            🗑️
                        </button>
                    )}
                </>
            )}
            
            {hasErrors && (
                <div className="fdf_error-badge" title="Erreurs de validation">
                    ⚠️
                </div>
            )}
        </div>
    );
}

export default LigneFactureForm;