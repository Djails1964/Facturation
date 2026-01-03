import React, { useEffect } from 'react';
import ConfirmationModal from '../shared/ConfirmationModal';
import TarifFormHeader from './sections/TarifFormHeader';
import TarifFormBadge from './sections/TarifFormBadge';
import TarifSpecialFormDataSection from './sections/TarifSpecialFormDataSection';
import TarifFormActions from './sections/TarifFormActions';
import { useTarifSpecialForm } from './hooks/useTarifSpecialForm';
import { useTarifSpecialFormLogic } from './hooks/useTarifSpecialFormLogic';
import { useTarifSpecialFormValidation } from './hooks/useTarifSpecialFormValidation';
import { useTarifSpecialFormHandlers } from './hooks/useTarifSpecialFormHandlers';
import { FORM_MODES, FORM_TITLES, LOADING_MESSAGES } from '../../constants/tarifConstants';
// import '../../styles/components/tarifs/TarifForm.css';

function TarifSpecialForm({ 
    mode = FORM_MODES.VIEW, 
    tarifSpecialId = null, 
    onRetourListe, 
    onTarifSpecialCreated,
    clients = [],
    services = [],
    unites = [],
    tarificationService,
    loadUnitesByService  
}) {
    
    // Hooks personnalisés pour la logique métier
    const formState = useTarifSpecialForm({ 
        mode, 
        tarifSpecialId, 
        onRetourListe, 
        onTarifSpecialCreated,
        clients,
        services,
        unites,
        tarificationService,
        loadUnitesByService 
    });
    const formLogic = useTarifSpecialFormLogic(formState);
    const formValidation = useTarifSpecialFormValidation(formState);
    const formHandlers = useTarifSpecialFormHandlers(formState, formLogic, formValidation);
    
    // Enregistrer les guards et événements (même logique que TarifForm)
    useEffect(() => {
        if (formState.canDetectChanges()) {
            const guardFunction = async () => {
                return formState.hasUnsavedChanges;
            };
            formState.registerGuard(formState.guardId, guardFunction);
            return () => formState.unregisterGuard(formState.guardId);
        }
    }, [formState.canDetectChanges, formState.hasUnsavedChanges, formState.guardId]);
    
    // Titre du formulaire
    const getTitre = () => {
        switch (mode) {
            case FORM_MODES.CREATE: return 'Nouveau tarif spécial';
            case FORM_MODES.EDIT: return 'Modifier le tarif spécial';
            case FORM_MODES.VIEW: return 'Détails du tarif spécial';
            default: return 'Tarif spécial';
        }
    };
    
    // Calculer si le tarif spécial est valide
    const isTarifSpecialValid = () => {
        if (!formState.tarifSpecial.date_debut) return false;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const dateDebut = new Date(formState.tarifSpecial.date_debut);
        const dateFin = formState.tarifSpecial.date_fin ? new Date(formState.tarifSpecial.date_fin) : null;
        
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
                    
                    <TarifFormBadge isValid={isTarifSpecialValid()} />
                    
                    {formState.error && (
                        <div className="notification error">
                            {formState.error}
                        </div>
                    )}
                    
                    <TarifSpecialFormDataSection 
                        tarifSpecial={formState.tarifSpecial}
                        onInputChange={formHandlers.handleInputChange}
                        onOpenDateModal={formHandlers.handleOpenDateModal}
                        clients={formState.clients}
                        services={formState.services}
                        serviceUnites={formState.serviceUnites}
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

            {/* Modals identiques à TarifForm */}
            <ConfirmationModal
                isOpen={formState.showUnsavedModal}
                title="Modifications non sauvegardées"
                message="Vous avez des modifications non sauvegardées dans le formulaire de tarif spécial. Souhaitez-vous vraiment quitter sans sauvegarder ?"
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
                message="Vous avez des modifications non sauvegardées dans le formulaire de tarif spécial. Souhaitez-vous vraiment quitter sans sauvegarder ?"
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

export default TarifSpecialForm;