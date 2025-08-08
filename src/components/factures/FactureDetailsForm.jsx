import React, { useEffect, useRef } from 'react';
import '../../styles/components/factures/FactureDetailsForm.css';
import { useTraceUpdate } from '../../useTraceUpdate';

// Hook principal refactorisé
import { useFactureDetailsForm } from './hooks/useFactureDetailsForm';

// Composants des lignes
import LigneFactureForm from './components/LigneFactureForm';

// Composants simples intégrés
function LoadingSpinner({ message = "Chargement..." }) {
    return (
        <div className="fdf_loading-container">
            <p>{message}</p>
        </div>
    );
}

function ErrorMessage({ message, type = 'error' }) {
    return (
        <div className={`fdf_error-message ${type}`}>
            {message}
        </div>
    );
}

function FactureHeader({ title, tarifInfo, readOnly }) {
    return (
        <div className="fdf_lignes-detail-titre">
            {title}
            {tarifInfo && !readOnly && (
                <span className="fdf_tarif-info-badge">{tarifInfo}</span>
            )}
        </div>
    );
}

function AddLineButton({ onAdd, disabled = false }) {
    return (
        <div className="fdf_ajouter-ligne-container">
            <button 
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onAdd();
                }}
                className="btn-primary"
                disabled={disabled}
            >
                + Ajouter une ligne
            </button>
        </div>
    );
}

/**
 * Composant simple pour afficher une ligne - REMPLACÉ par LigneFactureForm
 */
function LigneSimple({ ligne, index, readOnly, onToggle, onSupprimer, onCopier }) {
    const isOpen = false; // Pour l'instant, gardons simple

    return (
        <div className={`fdf_line-container ${isOpen ? 'fdf_line-open' : ''}`}>
            <div className="fdf_order-badge">{index + 1}</div>
            
            <div className="fdf_line-resume-container">
                <div className="fdf_line-content">
                    <div className="fdf_line-service">
                        <strong>{ligne.serviceType || 'Service non défini'}</strong>
                        {ligne.unite && <span className="fdf_unite">({ligne.unite})</span>}
                    </div>
                    
                    <div className="fdf_line-description">
                        {ligne.description || 'Description non définie'}
                    </div>
                    
                    <div className="fdf_line-amounts">
                        <span className="fdf_quantite">Qté: {ligne.quantite || 0}</span>
                        <span className="fdf_prix">Prix: {ligne.prixUnitaire || 0} CHF</span>
                        <span className="fdf_total"><strong>Total: {ligne.total || 0} CHF</strong></span>
                    </div>
                </div>
                
                {!readOnly && (
                    <div className="fdf_line-actions">
                        <button 
                            className="fdf_btn-small fdf_btn-edit"
                            onClick={() => onToggle && onToggle(index)}
                            title="Modifier"
                        >
                            ✏️
                        </button>
                        <button 
                            className="fdf_btn-small fdf_btn-copy"
                            onClick={() => onCopier && onCopier(index)}
                            title="Copier"
                        >
                            📋
                        </button>
                        <button 
                            className="fdf_btn-small fdf_btn-delete"
                            onClick={() => onSupprimer && onSupprimer(index)}
                            title="Supprimer"
                        >
                            🗑️
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

/**
 * VERSION CORRIGÉE pour éliminer la boucle infinie
 */
function FactureDetailsForm({ 
    onLignesChange, 
    lignesInitiales = null, 
    isModification = false, 
    client = null, 
    readOnly = false,
    onResetRistourne = null
}) {

    console.log('🔍 Props reçues dans FactureDetailsForm:', {
        lignesInitiales: lignesInitiales?.length || 0,
        lignesInitialesData: lignesInitiales,
        clientId: client?.id,
        readOnly,
        isModification
    });

    useTraceUpdate({ onLignesChange, client, readOnly }, 'FactureDetailsForm');

    const {
        // États principaux
        lignes,
        isLoading,
        message,
        messageType,
        totalGeneral,
        tarifInfo,
        isInitialized,
        
        // Configuration
        services,
        unites,
        unitesByService,
        
        // États UI
        lignesOuvertes,
        focusedFields,
        validationErrors,
        draggingIndex,
        prixModifiesManuel,
        
        // Méthodes
        ajouterLigne,
        modifierLigne,
        supprimerLigne,
        copierLigne,
        toggleLigneOuverte,
        insertUniteNameInDescription,
        handleFocus,
        handleBlur,
        handleDragStart,
        handleDragOver,
        handleDrop,
        handleDragEnd,
        hasErrors,
        getErrorClass
        
    } = useFactureDetailsForm(
        client, 
        readOnly, 
        lignesInitiales, 
        onLignesChange, 
        onResetRistourne
    );

    console.log('🔍 État du hook:', {
        lignesCount: lignes?.length || 0,
        lignesData: lignes,
        isLoading,
        isInitialized,
        message
    });

    // Gestion des états de chargement
    if (isLoading) {
        return (
            <div className="fdf_facture-details-form">
                <LoadingSpinner message="Chargement des services et unités..." />
            </div>
        );
    }

    if (message) {
        return (
            <div className="fdf_facture-details-form">
                <ErrorMessage message={message} type={messageType} />
            </div>
        );
    }

    // ✅ CORRECTION : Debug des lignes avant rendu
    console.log('🎯 Rendu avec lignes:', {
        count: lignes?.length || 0,
        lignes: lignes,
        isInitialized
    });

    return (
        <div className={`fdf_facture-details-form ${readOnly ? 'fdf_readonly-mode' : ''}`}>
            <FactureHeader 
                title="Lignes détail" 
                tarifInfo={tarifInfo} 
                readOnly={readOnly} 
            />
            
            <div className="fdf_table-flex">
                {/* ✅ CORRECTION : Utiliser LigneFactureForm au lieu de LigneSimple */}
                {!lignes || lignes.length === 0 ? (
                    <div className="fdf_no-lines">
                        <p>
                            {isInitialized 
                                ? 'Aucune ligne trouvée' 
                                : 'Initialisation en cours...'
                            }
                        </p>
                    </div>
                ) : (
                    // ✅ Rendu des lignes avec le vrai composant LigneFactureForm
                    lignes.map((ligne, index) => (
                        <LigneFactureForm 
                            key={`ligne-${ligne.id || index}`}
                            ligne={ligne}
                            index={index}
                            services={services || []}
                            unites={unites || []}
                            unitesByService={unitesByService || {}}
                            lignesOuvertes={lignesOuvertes || {}}
                            focusedFields={focusedFields || {}}
                            validationErrors={validationErrors || {}}
                            draggingIndex={draggingIndex}
                            prixModifiesManuel={prixModifiesManuel || { current: {} }}
                            readOnly={readOnly}
                            onModify={modifierLigne}
                            onToggle={toggleLigneOuverte}
                            onCopy={copierLigne}
                            onDelete={supprimerLigne}
                            onInsertUniteName={() => insertUniteNameInDescription(index)}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                            onDragStart={handleDragStart}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            onDragEnd={handleDragEnd}
                            hasErrors={() => hasErrors(index)}
                            getErrorClass={(field) => getErrorClass(index, field)}
                        />
                    ))
                )}
                
                {!readOnly && (
                    <AddLineButton 
                        onAdd={ajouterLigne}
                        disabled={isLoading}
                    />
                )}
            </div>

        </div>
    );
}

export default FactureDetailsForm;