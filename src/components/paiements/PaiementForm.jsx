import React, { useEffect } from 'react';
import { FiCalendar } from 'react-icons/fi';
import ConfirmationModal from '../shared/ConfirmationModal';
import PaiementFormHeader from './sections/PaiementFormHeader';
import PaiementFormBadge from './sections/PaiementFormBadge';
import PaiementFormFactureSection from './sections/PaiementFormFactureSection';
import PaiementFormPaiementSection from './sections/PaiementFormPaiementSection';
import PaiementFormSystemInfoSection from './sections/PaiementFormSystemInfoSection';
import PaiementFormActions from './sections/PaiementFormActions';
import { usePaiementForm } from './hooks/usePaiementForm';
import { usePaiementFormLogic } from './hooks/usePaiementFormLogic';
import { usePaiementFormValidation } from './hooks/usePaiementFormValidation';
import { usePaiementFormHandlers } from './hooks/usePaiementFormHandlers';
import { FORM_MODES, FORM_TITLES, LOADING_MESSAGES, HELP_TEXTS } from '../../constants/paiementConstants';
import DateService from '../../utils/DateService';
import '../../styles/components/paiements/PaiementForm.css';

function PaiementForm({ mode = FORM_MODES.VIEW, idPaiement = null, onRetourListe, onPaiementCreated }) {
    
    console.log('🎨 PaiementForm - Props reçues:', {
        mode,
        idPaiement,
        hasOnRetourListe: !!onRetourListe,
        hasOnPaiementCreated: !!onPaiementCreated
    });

    // Hooks personnalisés pour la logique métier
    const formState = usePaiementForm({ mode, idPaiement, onRetourListe, onPaiementCreated });
    const formLogic = usePaiementFormLogic(formState);
    const formValidation = usePaiementFormValidation(formState);
    const formHandlers = usePaiementFormHandlers(formState, formLogic, formValidation);

    // Debug log
    console.log('🎨 Rendu PaiementForm:', {
        mode,
        idPaiement,
        isLoading: formState.isLoading,
        paiement: formState.paiement, // Développez cet objet
        paiementKeys: Object.keys(formState.paiement || {}),
        paiementValues: formState.paiement,
        error: formState.error
    });
    
    // Enregistrer les guards et événements
    useEffect(() => {
        if (formState.canDetectChanges()) {
            const guardFunction = async () => {
                return formState.hasUnsavedChanges;
            };
            formState.registerGuard(formState.guardId, guardFunction);
            return () => formState.unregisterGuard(formState.guardId);
        }
    }, [formState.canDetectChanges, formState.hasUnsavedChanges, formState.guardId]);
    
    // Intercepter les navigations externes
    useEffect(() => {
        if (formState.canDetectChanges() && formState.hasUnsavedChanges) {
            const handleGlobalNavigation = (event) => {
                if (event.detail && event.detail.source && event.detail.callback) {
                    formState.setGlobalNavigationCallback(() => event.detail.callback);
                    formState.setShowGlobalModal(true);
                }
            };
            window.addEventListener('navigation-blocked', handleGlobalNavigation);
            return () => window.removeEventListener('navigation-blocked', handleGlobalNavigation);
        }
    }, [formState.canDetectChanges, formState.hasUnsavedChanges]);
    
    // Cleanup
    useEffect(() => {
        return () => {
            if (mode !== FORM_MODES.VIEW && !formState.isPaiementAnnule) {
                formState.unregisterGuard(formState.guardId);
                formState.resetChanges();
                formState.setIsFullyInitialized(false);
            }
        };
    }, [mode, formState.guardId]);
    
    // Titre du formulaire
    const getTitre = () => {
        switch (mode) {
            case FORM_MODES.CREATE: return FORM_TITLES.CREATE;
            case FORM_MODES.EDIT: return formState.isPaiementAnnule ? FORM_TITLES.EDIT_CANCELLED : FORM_TITLES.EDIT;
            case FORM_MODES.VIEW: return formState.isPaiementAnnule ? FORM_TITLES.VIEW_CANCELLED : FORM_TITLES.VIEW;
            default: return 'Paiement';
        }
    };
    
    // Rendu conditionnel pour le chargement
    if (formState.isLoading) {
        return (
            <div className="content-section-container">
                <PaiementFormHeader titre={getTitre()} />
                <div className="paiement-form-container">
                    <p className="loading-message">{LOADING_MESSAGES.LOADING_PAIEMENT}</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="content-section-container">
            <PaiementFormHeader titre={getTitre()} />
            
            <form onSubmit={formHandlers.handleSubmit} className="paiement-form">
                <div className="paiement-form-container">
                    
                    <PaiementFormBadge etat={formState.paiement.etat} />
                    
                    {formState.error && (
                        <div className="notification error">
                            {formState.error}
                        </div>
                    )}
                    
                    {formState.isPaiementAnnule && mode !== FORM_MODES.VIEW && (
                        <div className="notification warning">
                            <strong>⚠️ Paiement annulé</strong><br/>
                            {HELP_TEXTS.CANCELLED_WARNING}<br/>
                            Annulé le {DateService.formatSingleDate(formState.paiement.dateAnnulation, 'datetime')}
                        </div>
                    )}
                    
                    <PaiementFormFactureSection 
                        isCreate={formState.isCreate}
                        paiement={formState.paiement}
                        onInputChange={formHandlers.handleInputChange}
                        factures={formState.factures}
                        facturesLoading={formState.facturesLoading}
                        factureSelectionnee={formState.factureSelectionnee}
                    />
                    
                    <PaiementFormPaiementSection 
                        paiement={formState.paiement}
                        onInputChange={formHandlers.handleInputChange}
                        onOpenDateModal={formHandlers.handleOpenDateModal}
                        isReadOnly={formState.isReadOnly}
                        isPaiementAnnule={formState.isPaiementAnnule}
                        paiementService={formState.paiementService}
                    />
                    
                    {(mode === FORM_MODES.VIEW || formState.isEdit) && (
                        <PaiementFormSystemInfoSection 
                            logsInfo={formState.logsInfo}
                            paiement={formState.paiement}
                            logsLoading={formState.logsLoading}
                        />
                    )}

                    <PaiementFormActions 
                        mode={mode}
                        isReadOnly={formState.isReadOnly}
                        isPaiementAnnule={formState.isPaiementAnnule}
                        isSubmitting={formState.isSubmitting}
                        onCancel={formHandlers.handleCancel}
                        isCreate={formState.isCreate}
                    />
                </div>
            </form>

            {/* Modals pour les modifications non sauvegardées */}
            <ConfirmationModal
                isOpen={formState.showUnsavedModal}
                title="Modifications non sauvegardées"
                message="Vous avez des modifications non sauvegardées dans le formulaire de paiement. Souhaitez-vous vraiment quitter sans sauvegarder ?"
                type="warning"
                onConfirm={formState.confirmNavigation}
                onCancel={formState.cancelNavigation}
                confirmText="Quitter sans sauvegarder"
                cancelText="Continuer l'édition"
                singleButton={false}
            />

            <ConfirmationModal
                isOpen={formState.showGlobalModal}
                title="Modifications non sauvegardées"
                message="Vous avez des modifications non sauvegardées dans le formulaire de paiement. Souhaitez-vous vraiment quitter sans sauvegarder ?"
                type="warning"
                onConfirm={formHandlers.handleConfirmGlobalNavigation}
                onCancel={formHandlers.handleCancelGlobalNavigation}
                confirmText="Quitter sans sauvegarder"
                cancelText="Continuer l'édition"
                singleButton={false}
            />
        </div>
    );
}

export default PaiementForm;