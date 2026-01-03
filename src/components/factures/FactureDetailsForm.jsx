import React, { useEffect, useRef } from 'react';
import '../../styles/components/factures/FactureDetailsForm.css';
import { useTraceUpdate } from '../../useTraceUpdate';
import { createLogger } from '../../utils/createLogger';

// Hook principal refactorisé
import { useFactureDetailsForm } from './hooks/useFactureDetailsForm';

// Composants des lignes
import LigneFactureForm from './components/LigneFactureForm';

const log = createLogger("FactureDetailsForm");

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
 * Composant de gestion des détails de facture
 * ✅ REFACTORISÉ : Reçoit tarifData depuis FactureForm
 */
function FactureDetailsForm({ 
    onLignesChange, 
    lignesInitiales = null, 
    isModification = false, 
    client = null, 
    readOnly = false,
    onResetRistourne = null,
    tarifData = null  // ✅ NOUVEAU : Données de tarification depuis FactureGestion
}) {

    log.debug('🔍 Props reçues dans FactureDetailsForm:', {
        lignesInitiales: lignesInitiales?.length || 0,
        lignesInitialesData: lignesInitiales,
        idClient: client?.id,
        readOnly,
        isModification,
        hasTarifData: !!tarifData,
        tarifDataLoaded: tarifData?.isLoaded
    });

    useTraceUpdate({ onLignesChange, client, readOnly, tarifData }, 'FactureDetailsForm');

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
        onResetRistourne,
        tarifData  // ✅ NOUVEAU : Passer tarifData au hook
    );

    log.debug('🔍 État du hook:', {
        lignesCount: lignes?.length || 0,
        lignesData: lignes,
        isLoading,
        isInitialized,
        message,
        servicesCount: services?.length || 0,
        unitesCount: unites?.length || 0
    });

    // Gestion des états de chargement
    if (isLoading) {
        return (
            <div className="fdf_facture-details-form">
                <LoadingSpinner message="Chargement des services et unités..." />
            </div>
        );
    }

    if (message && messageType === 'error') {
        return (
            <div className="fdf_facture-details-form">
                <ErrorMessage message={message} type={messageType} />
            </div>
        );
    }

    // ✅ DEBUG des lignes avant rendu
    log.debug('🎯 Rendu avec lignes:', {
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
                {/* ✅ Utiliser LigneFactureForm */}
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