// src/components/clients/ClientForm.jsx
// Composant principal refactorisé - VERSION FINALE avec architecture unifiée

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
 */
function ClientForm({ 
  mode = FORM_MODES.VIEW, 
  idClient = null, 
  onRetourListe, 
  onClientCreated,
  clientService = null,
  options = {}
}) {
  
  // ================================
  // HOOKS PRINCIPAUX
  // ================================
  
  // ✅ Hook principal avec système unifié de détection des modifications
  const clientFormState = useClientForm(mode, idClient, clientService);
  
  // Hook de validation spécialisé
  const validation = useClientValidation(clientFormState.client);
  
  // ✅ Hook de navigation simplifié (utilise les données unifiées)
  const navigation = useClientNavigation(
    clientFormState, // Contient maintenant hasUnsavedChanges, etc.
    onRetourListe, 
    onClientCreated,
    options.navigation
  );

  // ================================
  // ÉTAT DÉRIVÉ ET UTILITAIRES
  // ================================
  
  const {
    client, isLoading, isSubmitting, error,
    handleChange, toggleTherapeute, isReadOnly
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
    const errorClass = validation.fieldErrors?.[fieldName] ? ' error' : '';
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
    
    console.log('📤 Soumission du formulaire ClientForm modulaire unifié');
    
    try {
      // ✅ Utiliser la fonction de navigation intégrée
      await handleSubmitWithNavigation();
    } catch (error) {
      console.error('❌ Erreur lors de la soumission:', error);
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
        <div className="error-container">
          <p className="error-message">{error}</p>
          <div className="error-actions">
            <button 
              className="btn-primary" 
              onClick={() => window.location.reload()}
            >
              Recharger la page
            </button>
            <button 
              className="btn-secondary" 
              onClick={handleRetour}
            >
              Retour à la liste
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ================================
  // RENDU PRINCIPAL DU FORMULAIRE
  // ================================
  
  return (
    <div className="content-section-container">
      
      {/* En-tête avec titre et indicateurs de statut */}
      <ClientFormHeader 
        title={formTitle}
        loading={isLoading}
        error={error}
        hasUnsavedChanges={hasUnsavedChanges}
        showStatusIndicators={true}
      />
      
      {/* Formulaire principal */}
      <form onSubmit={handleSubmit} className="formulaire-client">
        <div className={getFormContainerClass(mode)}>
          
          {/* Section gauche : Thérapeute + Titre */}
          <ClientFormLeftSection
            client={client}
            handleChange={handleChange}
            toggleTherapeute={toggleTherapeute}
            isReadOnly={isReadOnly}
            fieldErrors={validation.fieldErrors}
            getFieldClasses={getFieldClasses}
          />
          
          {/* Section principale : 4 lignes de champs */}
          <ClientFormMainSection
            client={client}
            handleChange={handleChange}
            fieldErrors={validation.fieldErrors}
            phoneType={validation.phoneType}
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
        // Props pour navigation directe via modal system
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