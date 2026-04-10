import React from 'react';
import { FiMove } from 'react-icons/fi';
import { createLogger } from '../../../utils/createLogger';
import {
    CopyActionButton,
    DeleteActionButton,
    ToggleActionButton,
} from '../../ui/buttons/ActionButtons';

// Composant existant (ne change pas)
import LigneFactureResume from './LigneFactureResume';


// Composant des champs avec nouvelle approche
import LigneFactureFields from './LigneFactureFields';

const log = createLogger("LigneFactureForm");

// Empêche la propagation et la soumission du formulaire parent
const stopEvent = (e) => { e.stopPropagation(); e.preventDefault(); };

/**
 * Utilitaires pour l'extraction des données depuis les objets enrichis
 * COHÉRENT avec LigneFactureFields
 */
const EnrichedDataExtractor = {
    /**
     * Extrait le nom d'affichage d'un service depuis l'objet enrichi
     */
    getServiceDisplayName: (ligne) => {
        if (ligne.service && typeof ligne.service === 'object') {
            return ligne.service.nomService || ligne.service.codeService || ligne.service.nom || 'Service inconnu';
        }
        if (ligne.serviceType) {
            return ligne.serviceType;
        }
        return 'Service non défini';
    },

    /**
     * Extrait le nom d'affichage d'une unité depuis l'objet enrichi
     */
    getUniteDisplayName: (ligne) => {
         log.debug("Extraction de l'unité pour la ligne:", ligne);
         log.debug("Type de l'unité:", typeof ligne.unite, ligne.unite);
        if (ligne.unite && typeof ligne.unite === 'object') {
            return ligne.unite.nomUnite || ligne.unite.codeUnite || 'Unité inconnue';
        }
        if (typeof ligne.unite === 'string') {
            return ligne.unite;
        }
        return 'Unité non définie';
    },

    /**
     * Vérifie si la ligne a des objets enrichis valides
     */
    hasEnrichedData: (ligne) => {
        const hasService = ligne.service && typeof ligne.service === 'object';
        const hasUnite = ligne.unite && typeof ligne.unite === 'object';
        return hasService || hasUnite;
    },

    /**
     * Prépare les données pour l'affichage en mode résumé
     */
    prepareForResume: (ligne) => {
        return {
            serviceType: EnrichedDataExtractor.getServiceDisplayName(ligne),
            unite: EnrichedDataExtractor.getUniteDisplayName(ligne),
            description: ligne.description,
            quantite: ligne.quantite,
            prixUnitaire: ligne.prixUnitaire,
            totalLigne: ligne.totalLigne
        };
    }
};

/**
 * Composant pour une ligne de facture individuelle
 * VERSION CORRIGÉE - Préservation complète des objets enrichis
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

    // NOUVELLE APPROCHE : Extraction des noms via les utilitaires cohérents
    const serviceNom = EnrichedDataExtractor.getServiceDisplayName(ligne);
    const uniteNom = EnrichedDataExtractor.getUniteDisplayName(ligne);

    // Debug pour vérifier la cohérence des données
     log.debug(`Ligne ${index} - Service: ${serviceNom}, Unité: ${uniteNom}`, {
        hasEnrichedData: EnrichedDataExtractor.hasEnrichedData(ligne),
        serviceType: typeof ligne.service,
        uniteType: typeof ligne.unite,
        serviceObj: ligne.service,
        uniteObj: ligne.unite
    });

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


    return (
        <div className={containerClasses} {...dragProps}>
            <OrderBadge number={noOrdre} draggable={!readOnly} />

            {!isOuverte ? (
                // Mode résumé (ligne fermée) - UTILISE LES OBJETS ENRICHIS
                <div className="fdf_line-resume-container">
                    <LigneFactureResume 
                        {...EnrichedDataExtractor.prepareForResume(ligne)}
                    />
                    
                    <div className="fdf_actions_container">
                        {!readOnly && (
                            <>
                                <CopyActionButton tooltip="Copier" onClick={(e) => { stopEvent(e); onCopy && onCopy(index); }} />
                                <DeleteActionButton tooltip="Supprimer" onClick={(e) => { stopEvent(e); onDelete && onDelete(index); }} />
                            </>
                        )}
                        <ToggleActionButton
                            isOpen={false}
                            className={hasLineErrors ? 'fdf_has_error' : ''}
                            tooltip={hasLineErrors ? 'Erreurs de validation' : 'Ouvrir pour édition'}
                            onClick={(e) => { stopEvent(e); onToggle && onToggle(index); }}
                        />
                    </div>

                    {hasLineErrors && !readOnly && (
                        <div className="fdf_error-indicator" onClick={(e) => { stopEvent(e); onToggle && onToggle(index); }}>
                            <span>Champs obligatoires manquants</span>
                        </div>
                    )}
                </div>
            ) : (
                // Mode détaillé (ligne ouverte) - PRÉSERVE LES OBJETS ENRICHIS
                <div className="fdf_line-flex-container">
                    <div className="fdf_actions_container">
                        {!readOnly && (
                            <>
                                <CopyActionButton tooltip="Copier" onClick={(e) => { stopEvent(e); onCopy && onCopy(index); }} />
                                <DeleteActionButton
                                    disabled={!(services && services.length > 1)}
                                    tooltip={services && services.length > 1 ? 'Supprimer' : 'Au moins une ligne requise'}
                                    onClick={(e) => { stopEvent(e); onDelete && onDelete(index); }}
                                />
                            </>
                        )}
                        <ToggleActionButton
                            isOpen={true}
                            className={hasLineErrors ? 'fdf_has_error' : ''}
                            tooltip={hasLineErrors ? 'Erreurs de validation' : 'Fermer'}
                            onClick={(e) => { stopEvent(e); onToggle && onToggle(index); }}
                        />
                    </div>
                    
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

// Fonctions de compatibilité (gardées pour la transition)
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

// Composants de fallback si les imports ne fonctionnent pas
// OrderBadge inliné (remplace FactureUIComponents.OrderBadge)
function OrderBadge({ number, draggable }) {
    const classes = [
        'fdf_order-badge',
        draggable && 'fdf_draggable'
    ].filter(Boolean).join(' ');
    return (
        <div className={classes} title={draggable ? "Glisser pour déplacer" : ""}>
            {number}
            {draggable && <FiMove size={8} className="fdf_drag-icon" />}
        </div>
    );
}


export default LigneFactureForm;