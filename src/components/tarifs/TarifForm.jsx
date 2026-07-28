import React, { useEffect } from 'react';
import { showConfirm } from '../../utils/modalSystem';
import TarifFormHeader from './sections/TarifFormHeader';
import TarifFormBadge from './sections/TarifFormBadge';
import TarifFormDataSection from './sections/TarifFormDataSection';
import TarifFormActions from './sections/TarifFormActions';
import { useTarifForm } from './hooks/useTarifForm';
import { useTarifFormLogic } from './hooks/useTarifFormLogic';
import { useTarifFormValidation } from './hooks/useTarifFormValidation';
import { useTarifFormHandlers } from './hooks/useTarifFormHandlers';
import { FORM_MODES, FORM_TITLES, LOADING_MESSAGES } from '../../constants/tarifConstants';
import { UNSAVED_CHANGES_CONFIRM_CONFIG, UNSAVED_CHANGES_MESSAGES } from '../../constants/appConstants';
// import '../../styles/components/tarifs/TarifForm.css';

/**
 * Composant TarifForm - Formulaire de gestion des tarifs
 * 
 * ✅ REFACTORISÉ: Reçoit maintenant les données depuis le parent
 * au lieu de les charger lui-même (évite la duplication avec useTarifGestionState)
 * 
 * @param {Object} props
 * @param {string} props.mode - Mode du formulaire (CREATE, EDIT, VIEW)
 * @param {number} props.tarifId - ID du tarif (pour EDIT/VIEW)
 * @param {Function} props.onRetourListe - Callback pour retour à la liste
 * @param {Function} props.onTarifCreated - Callback après création
 * @param {Array} props.services - Services depuis useTarifGestionState
 * @param {Array} props.unites - Unités depuis useTarifGestionState
 * @param {Array} props.typesTarifs - Types tarifs depuis useTarifGestionState
 * @param {Object} props.tarificationService - Service pour les appels API
 * @param {Function} props.loadUnitesByService - Fonction pour charger unités par service
 */
function TarifForm({ 
    mode = FORM_MODES.VIEW, 
    tarifId = null, 
    onRetourListe, 
    onTarifCreated,
    services = [],
    unites = [],
    typesTarifs = [],
    tarificationService,
    loadUnitesByService
}) {
    
    const formState = useTarifForm({ 
        mode, 
        tarifId, 
        onRetourListe, 
        onTarifCreated,
        services,
        unites,
        typesTarifs,
        tarificationService,
        loadUnitesByService
    });
    
    const formLogic = useTarifFormLogic(formState);
    const formValidation = useTarifFormValidation(formState);
    const formHandlers = useTarifFormHandlers(formState, formLogic, formValidation);

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
        </div>
    );
}

export default TarifForm;