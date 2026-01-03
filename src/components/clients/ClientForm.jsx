// src/components/clients/ClientForm.jsx
// Composant principal refactorisé - VERSION FINALE avec architecture unifiée
// ✅ REFACTORISÉ: useClientActions est utilisé dans useClientForm, plus besoin de passer clientService

import React from 'react';
import { FORM_MODES, LOADING_MESSAGES } from '../../constants/clientConstants';
import { getFormContainerClass, getTitreFormulaire, formatNomComplet } from './utils/clientHelpers';

// Hooks
import { useClientForm } from './hooks/useClientForm';
import { useClientValidation } from './hooks/useClientValidation';
import { useClientNavigation } from './hooks/useClientNavigation';

// Sections
import ClientFormHeader from './sections/ClientFormHeader';
import ClientFormLeftSection from './sections/ClientFormLeftSection';
import ClientFormMainSection from './sections/ClientFormMainSection';
import ClientFormActions from './sections/ClientFormActions';
import ClientFormModals from './sections/ClientFormModals';

// Styles
import '../../styles/components/clients/ClientForm.css';

/**
 * Composant principal ClientForm - VERSION MODULAIRE UNIFIÉE
 * ✅ Utilise exclusivement useUnsavedChanges pour la détection des modifications
 * ✅ Architecture modulaire avec sections réutilisables
 * ✅ Système de guard unifié pour toute l'application
 * ✅ useClientActions est utilisé dans useClientForm (plus besoin de passer clientService)
 */
function ClientForm({ 
  mode = FORM_MODES.VIEW, 
  idClient = null, 
  onRetourListe, 
  onClientCreated,
  // ❌ SUPPRIMÉ: clientService = null - useClientActions est utilisé dans useClientForm
  options = {}
}) {
  
  // ================================
  // HOOKS PRINCIPAUX
  // ================================
  
  // ✅ Hook principal avec système unifié de détection des modifications
  // useClientActions est utilisé à l'intérieur de useClientForm
  const clientFormState = useClientForm(mode, idClient);
  
  // Hook de validation spécialisé
  const validation = useClientValidation(clientFormState.client);
  
  // ✅ Hook de navigation simplifié (utilise les données unifiées)
  const navigation = useClientNavigation(
    clientFormState,
    onRetourListe, 
    onClientCreated,
    options.navigation
  );

  // ================================
  // ÉTAT DÉRIVÉ ET UTILITAIRES
  // ================================
  
  const {
    client, isLoading, isSubmitting, error,
    handleChange, toggleTherapeute, isReadOnly,
    fieldErrors, phoneType  // ✅ AJOUT: Extraire fieldErrors et phoneType de useClientForm
  } = clientFormState;

  const { isFormValid } = validation;
  
  const {
    hasUnsavedChanges, showUnsavedModal, showGlobalModal,
    handleRetour, handleSubmitWithNavigation,
    confirmNavigation, cancelNavigation,
    handleConfirmGlobalNavigation, handleCancelGlobalNavigation,
    guardId
  } = navigation;

  // Classes CSS conditionnelles pour les champs
  const getFieldClasses = (fieldName) => {
    const baseClass = 'form-control';
    const errorClass = fieldErrors?.[fieldName] ? ' error' : '';
    const readOnlyClass = isReadOnly ? ' readonly' : '';
    return `${baseClass}${errorClass}${readOnlyClass}`;
  };

  // Titre du formulaire
  const formTitle = getTitreFormulaire(mode, client);
  const clientName = formatNomComplet(client);

  // ================================
  // GESTIONNAIRE DE SOUMISSION SIMPLIFIÉ
  // ================================

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // ✅ Utiliser la fonction de navigation intégrée
      await handleSubmitWithNavigation();
    } catch (error) {
      // L'erreur est gérée par le hook useClientForm
    }
  };

  // ================================
  // RENDU CONDITIONNEL - CHARGEMENT
  // ================================
  
  if (isLoading) {
    return (
      <div className="content-section-container">
        <ClientFormHeader 
          title="Chargement..." 
          loading={true}
        />
        <div className="loading-message">
          {LOADING_MESSAGES.LOADING_CLIENT}
        </div>
      </div>
    );
  }

  // ================================
  // RENDU CONDITIONNEL - ERREUR CRITIQUE
  // ================================
  
  if (error && !client.id && mode !== FORM_MODES.CREATE) {
    return (
      <div className="content-section-container">
        <ClientFormHeader 
          title="Erreur de chargement" 
          error={error}
        />
        <div className="error-message critical">
          {error}
        </div>
        <button 
          className="btn-secondary"
          onClick={handleRetour}
        >
          Retour à la liste
        </button>
      </div>
    );
  }

  // ================================
  // RENDU PRINCIPAL
  // ================================
  
  return (
    <div className={`content-section-container ${getFormContainerClass(mode)}`}>
      
      {/* En-tête du formulaire */}
      <ClientFormHeader 
        title={formTitle}
        mode={mode}
        hasUnsavedChanges={hasUnsavedChanges}
        error={error}
      />

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="client-form">
        <div className="form-content">
          
          {/* Section gauche : Titre et Thérapeute */}
          <ClientFormLeftSection
            client={client}
            handleChange={handleChange}
            toggleTherapeute={toggleTherapeute}
            isReadOnly={isReadOnly}
            getFieldClasses={getFieldClasses}
          />
          
          {/* Section principale : 4 lignes de champs */}
          <ClientFormMainSection
            client={client}
            handleChange={handleChange}
            fieldErrors={fieldErrors}
            phoneType={phoneType}
            isReadOnly={isReadOnly}
            getFieldClasses={getFieldClasses}
          />
          
          {/* Section actions : Boutons */}
          <ClientFormActions
            mode={mode}
            isSubmitting={isSubmitting}
            hasErrors={!isFormValid}
            handleRetour={handleRetour}
            onSubmit={handleSubmit}
            isFormValid={isFormValid}
          />
          
        </div>
      </form>

      {/* ✅ Modales unifiées pour les modifications non sauvegardées */}
      <ClientFormModals
        showUnsavedModal={showUnsavedModal}
        showGlobalModal={showGlobalModal}
        confirmNavigation={confirmNavigation}
        cancelNavigation={cancelNavigation}
        handleConfirmGlobalNavigation={handleConfirmGlobalNavigation}
        handleCancelGlobalNavigation={handleCancelGlobalNavigation}
        hasUnsavedChanges={hasUnsavedChanges}
        clientName={clientName}
        modalOptions={{}}
        navigation={{
          guardId
        }}
        onRetourListe={onRetourListe}
      />
      
    </div>
  );
}

export { ClientForm, FORM_MODES };
export default ClientForm;