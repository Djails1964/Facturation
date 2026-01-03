// src/components/paiements/PaiementForm.jsx
// Version CORRIGÉE - Utilise VRAIMENT usePaiementFormLogic

import React, { useState, useEffect, useRef, useCallback } from 'react';

// Composants partagés
import ConfirmationModal from '../shared/ConfirmationModal';
import GlobalDatePicker from '../../context/GlobalDatePicker';
import { DateProvider } from '../../context/DateContext';

// Sections du formulaire
import PaiementFormHeader from './sections/PaiementFormHeader';
import PaiementFormBadge from './sections/PaiementFormBadge';
import PaiementFormFactureSection from './sections/PaiementFormFactureSection';
import PaiementFormPaiementSection from './sections/PaiementFormPaiementSection';
import PaiementFormSystemInfoSection from './sections/PaiementFormSystemInfoSection';
import PaiementFormActions from './sections/PaiementFormActions';

// Import des hooks personnalisés
import { usePaiementForm } from './hooks/usePaiementForm';
import { usePaiementFormLogic } from './hooks/usePaiementFormLogic';
import { usePaiementFormHandlers } from './hooks/usePaiementFormHandlers';
import { usePaiementFormValidation } from './hooks/usePaiementFormValidation';

// Utilitaires et constantes
import { formatDate as formatDateDisplay, formatDateToYYYYMMDD, formatMontant } from '../../utils/formatters';
import { 
    FORM_MODES, 
    FORM_TITLES, 
    LOADING_MESSAGES, 
    HELP_TEXTS,
    VALIDATION_MESSAGES,
    BUTTON_TEXTS,
    PAIEMENT_ETATS,
    DEFAULT_VALUES
} from '../../constants/paiementConstants';

// Styles
import '../../styles/components/paiements/PaiementForm.css';

function PaiementForm({ 
    mode = FORM_MODES.CREATE, 
    idPaiement = null, 
    onRetourListe = null, 
    onPaiementCreated = null 
}) {
    
    console.log('🎨 PaiementForm - Props reçues:', {
        mode,
        idPaiement,
        hasOnRetourListe: !!onRetourListe,
        hasOnPaiementCreated: !!onPaiementCreated
    });

    // UTILISATION DES HOOKS PERSONNALISÉS
    
    // Hook principal pour l'état du formulaire
    const formState = usePaiementForm({ mode, idPaiement, onRetourListe, onPaiementCreated });
    
    // Hook pour la logique métier (chargement des données, logs, etc.)
    const formLogic = usePaiementFormLogic(formState);
    
    // Hook pour la validation
    const formValidation = usePaiementFormValidation(formState);
    
    // Hook pour les gestionnaires d'événements (passer formValidation en 3ème paramètre)
    const formHandlers = usePaiementFormHandlers(formState, formLogic, formValidation);

    // EXTRACTION DES DONNÉES ET FONCTIONS DEPUIS LES HOOKS
    const {
        paiement,
        factures,
        factureSelectionnee,
        logsInfo,
        isLoading,
        isSubmitting,
        error,
        logsLoading,
        facturesLoading,
        isReadOnly,
        isPaiementAnnule,
        isCreate,
        isEdit,
        isView
    } = formState;

    const {
        chargerPaiement,
        chargerFactures,
        chargerLogsUtilisateur
    } = formLogic;

    const {
        handleInputChange,
        handleFactureChange,
        handleSubmit,
        handleCancel,
        handleAnnulerPaiement,
        handleOpenDateModal
    } = formHandlers;

    // EFFET D'INITIALISATION
    useEffect(() => {
        const initialize = async () => {
            console.log('🚀 Initialisation PaiementForm:', { mode, idPaiement });
            
            try {
                // 1. Charger les factures en mode création
                if (isCreate) {
                    await chargerFactures();
                }
                
                // 2. Charger le paiement et les logs en mode édition/visualisation
                if (idPaiement && (isEdit || isView)) {
                    await chargerFactures();
                    await chargerPaiement();
                    await chargerLogsUtilisateur(idPaiement);
                }
                
                console.log('✅ Initialisation terminée');
                
            } catch (error) {
                console.error('❌ Erreur lors de l\'initialisation:', error);
            }
        };

        initialize();
    }, [mode, idPaiement, isCreate, isEdit, isView]);

    // FONCTION UTILITAIRE POUR LA DATE
    const getTodayDate = useCallback(() => {
        return new Date().toISOString().split('T')[0];
    }, []);

    // CALCUL DU MONTANT RESTANT
    const calculateMontantRestant = useCallback((facture) => {
        if (!facture) return 0;
        
        return facture.montantRestant || 
            (facture.totalAvecRistourne - (facture.montantPayeTotal || 0));
    }, []);

    // GESTION DU TITRE DU FORMULAIRE
    const getTitreFormulaire = () => {
        if (isPaiementAnnule) {
            return isEdit ? FORM_TITLES.EDIT_CANCELLED : FORM_TITLES.VIEW_CANCELLED;
        }
        
        switch (mode) {
            case FORM_MODES.CREATE:
                return FORM_TITLES.CREATE;
            case FORM_MODES.EDIT:
                return FORM_TITLES.EDIT;
            case FORM_MODES.VIEW:
                return FORM_TITLES.VIEW;
            default:
                return FORM_TITLES.VIEW;
        }
    };

    // AFFICHAGE CONDITIONNEL DU CHARGEMENT
    if (isLoading) {
        return (
            <div className="form-container">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>{LOADING_MESSAGES.LOADING_PAIEMENT}</p>
                </div>
            </div>
        );
    }

    // AFFICHAGE CONDITIONNEL DES ERREURS
    if (error) {
        return (
            <div className="form-container">
                <div className="error-container">
                    <h2>Erreur</h2>
                    <p className="error-message">{error}</p>
                    {onRetourListe && (
                        <button 
                            className="btn-primary"
                            onClick={onRetourListe}
                        >
                            Retour à la liste
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // RENDU PRINCIPAL DU COMPOSANT
    console.log('🔍 DEBUG PaiementForm - logsInfo:', logsInfo);
    console.log('🔍 DEBUG PaiementForm - factureSelectionnee:', factureSelectionnee);
    
    return (
        <DateProvider>
            <div className="form-container">
                <form onSubmit={handleSubmit} className="paiement-form">
                    
                    {/* En-tête du formulaire */}
                    <PaiementFormHeader 
                        titre={getTitreFormulaire()}
                        idPaiement={idPaiement}
                    />

                    {/* Badge d'état (si paiement annulé) */}
                    {isPaiementAnnule && (
                        <PaiementFormBadge 
                            type="cancelled"
                            message={HELP_TEXTS.CANCELLED_WARNING}
                        />
                    )}

                    {/* Section de sélection de facture */}
                    <PaiementFormFactureSection
                        isCreate={isCreate}
                        paiement={paiement}
                        onInputChange={handleInputChange}
                        factures={factures}
                        facturesLoading={facturesLoading}
                        factureSelectionnee={factureSelectionnee}
                    />

                    {/* Section des détails du paiement - Affichée seulement si facture sélectionnée en création */}
                    {(!isCreate || factureSelectionnee) && (
                        <PaiementFormPaiementSection
                            paiement={paiement}
                            onInputChange={handleInputChange}
                            onOpenDateModal={handleOpenDateModal}
                            isReadOnly={isReadOnly}
                            isPaiementAnnule={isPaiementAnnule}
                            factureSelectionnee={factureSelectionnee}
                            isCreate={isCreate}
                        />
                    )}

                    {/* Section des informations système et logs */}
                    {!isCreate && (
                        <PaiementFormSystemInfoSection
                            logsInfo={logsInfo}
                            paiement={paiement}
                            logsLoading={logsLoading}
                        />
                    )}

                    {/* Actions du formulaire */}
                    <PaiementFormActions
                        mode={mode}
                        isSubmitting={isSubmitting}
                        isReadOnly={isReadOnly}
                        isPaiementAnnule={isPaiementAnnule}
                        isCreate={isCreate}
                        onCancel={handleCancel}
                        onAnnulerPaiement={handleAnnulerPaiement}
                        isFormValid={formValidation.isFormValid()}
                    />

                </form>

                {/* Modal de sélection de date */}
                <GlobalDatePicker />
            </div>
        </DateProvider>
    );
}

export default PaiementForm;