import React, { useEffect } from 'react';
import ConfirmationModal from '../shared/ConfirmationModal';
import TarifFormHeader from './sections/TarifFormHeader';
import TarifFormBadge from './sections/TarifFormBadge';
import TarifFormDataSection from './sections/TarifFormDataSection';
import TarifFormActions from './sections/TarifFormActions';
import { useTarifForm } from './hooks/useTarifForm';
import { useTarifFormLogic } from './hooks/useTarifFormLogic';
import { useTarifFormValidation } from './hooks/useTarifFormValidation';
import { useTarifFormHandlers } from './hooks/useTarifFormHandlers';
import { FORM_MODES, FORM_TITLES, LOADING_MESSAGES } from '../../constants/tarifConstants';
// import '../../styles/components/tarifs/TarifForm.css';

function TarifForm({ mode = FORM_MODES.VIEW, tarifId = null, onRetourListe, onTarifCreated }) {
    
    // Hooks personnalisés pour la logique métier
    const formState = useTarifForm({ mode, tarifId, onRetourListe, onTarifCreated });
    const formLogic = useTarifFormLogic(formState);
    const formValidation = useTarifFormValidation(formState);
    const formHandlers = useTarifFormHandlers(formState, formLogic, formValidation);
    
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
            if (mode !== FORM_MODES.VIEW) {
                formState.unregisterGuard(formState.guardId);
                formState.resetChanges();
            }
        };
    }, [mode, formState.guardId]);
    
    // Titre du formulaire
    const getTitre = () => {
        switch (mode) {
            case FORM_MODES.CREATE: return FORM_TITLES.CREATE;
            case FORM_MODES.EDIT: return FORM_TITLES.EDIT;
            case FORM_MODES.VIEW: return FORM_TITLES.VIEW;
            default: return 'Tarif';
        }
    };
    
    // Calculer si le tarif est valide
    const isTarifValid = () => {
        if (!formState.tarif.date_debut) return false;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const dateDebut = new Date(formState.tarif.date_debut);
        const dateFin = formState.tarif.date_fin ? new Date(formState.tarif.date_fin) : null;
        
        dateDebut.setHours(0, 0, 0, 0);
        
        return dateDebut <= today && (!dateFin || dateFin >= today);
    };
    
    // Rendu conditionnel pour le chargement
    if (formState.isLoading) {
        return (
            <div className="content-section-container">
                <TarifFormHeader titre={getTitre()} />
                <div className="tarif-form-container">
                    <p className="loading-message">{LOADING_MESSAGES.LOADING_TARIF}</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="content-section-container">
            <TarifFormHeader titre={getTitre()} />
            
            <form onSubmit={formHandlers.handleSubmit} className="tarif-form">
                <div className="tarif-form-container">
                    
                    <TarifFormBadge isValid={isTarifValid()} />
                    
                    {formState.error && (
                        <div className="notification error">
                            {formState.error}
                        </div>
                    )}
                    
                    <TarifFormDataSection 
                        tarif={formState.tarif}
                        onInputChange={formHandlers.handleInputChange}
                        onOpenDateModal={formHandlers.handleOpenDateModal}
                        services={formState.services}
                        serviceUnites={formState.serviceUnites}
                        typesTarifs={formState.typesTarifs}
                        isReadOnly={formState.isReadOnly}
                        validationErrors={formValidation.validationErrors}
                    />
                    
                    <TarifFormActions 
                        mode={mode}
                        isReadOnly={formState.isReadOnly}
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
                message="Vous avez des modifications non sauvegardées dans le formulaire de tarif. Souhaitez-vous vraiment quitter sans sauvegarder ?"
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
                message="Vous avez des modifications non sauvegardées dans le formulaire de tarif. Souhaitez-vous vraiment quitter sans sauvegarder ?"
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

export default TarifForm;