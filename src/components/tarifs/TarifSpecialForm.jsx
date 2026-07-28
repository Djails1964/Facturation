import React, { useEffect } from 'react';
import { showConfirm } from '../../utils/modalSystem';
import TarifFormHeader from './sections/TarifFormHeader';
import TarifFormBadge from './sections/TarifFormBadge';
import TarifSpecialFormDataSection from './sections/TarifSpecialFormDataSection';
import TarifFormActions from './sections/TarifFormActions';
import { useTarifSpecialForm } from './hooks/useTarifSpecialForm';
import { useTarifSpecialFormLogic } from './hooks/useTarifSpecialFormLogic';
import { useTarifSpecialFormValidation } from './hooks/useTarifSpecialFormValidation';
import { useTarifSpecialFormHandlers } from './hooks/useTarifSpecialFormHandlers';
import { FORM_MODES, LOADING_MESSAGES } from '../../constants/tarifConstants';
import { UNSAVED_CHANGES_CONFIRM_CONFIG, UNSAVED_CHANGES_MESSAGES } from '../../constants/appConstants';
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

    // Intercepter les navigations externes (menu, etc.)
    useEffect(() => {
        if (mode === FORM_MODES.VIEW || !formState.hasUnsavedChanges) return;

        const handleNavigationBlocked = async (event) => {
            if (!event.detail?.callback) return;
            try {
                const result = await showConfirm(
                    UNSAVED_CHANGES_CONFIRM_CONFIG(UNSAVED_CHANGES_MESSAGES.TARIF)
                );
                if (result.action === 'confirm') {
                    formState.resetChanges();
                    event.detail.callback();
                }
            } catch (error) {
                console.error('❌ Erreur modal navigation globale:', error);
            }
        };

        window.addEventListener('navigation-blocked', handleNavigationBlocked);
        return () => window.removeEventListener('navigation-blocked', handleNavigationBlocked);
    }, [mode, formState.hasUnsavedChanges, formState.resetChanges]);

    // Cleanup au démontage
    useEffect(() => {
        return () => {
            if (mode !== FORM_MODES.VIEW) {
                formState.resetChanges();
            }
        };
    }, [mode]);
    
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
        </div>
    );
}

export default TarifSpecialForm;