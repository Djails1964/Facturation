import React, { useState } from 'react';
import { useFactureForm } from './components/factures/hooks/useFactureForm';
import { useFactureInitialization } from './components/factures/hooks/useFactureInitialization';
import { useFactureNavigation } from './components/factures/hooks/useFactureNavigation';
import { FactureFormActions } from './components/factures/services/factureFormActions';
import { FactureStateBanners } from './components/factures/components/FactureStateBanners';
import { FactureFormButtons } from './components/factures/components/FactureFormButtons';
import { FactureFormModals } from './components/factures/components/FactureFormModals';
import { getTitreFormulaire, getFormContainerClass, getSubmitButtonText } from './components/factures/utils/factureHelpers';
import { validateFactureLines } from './components/factures/utils/factureValidation';
import { FORM_MODES } from './constants/factureConstants';
// ✅ AJOUT: Import des formatters
import { formatDate, formatMontant } from './utils/formatters';
import FactureHeader from './FactureHeader';
import FactureDetailsForm from './FactureDetailsForm';
import FactureTotauxDisplay from './FactureTotauxDisplay';
import FactureHistoriquePaiements from './FactureHistoriquePaiements';
import './FactureForm.css';

function FactureForm({
  mode = FORM_MODES.VIEW,
  factureId = null,
  onRetourListe,
  onFactureCreated,
  clients = [],
  clientsLoading = false,
  onRechargerClients = null
}) {
  // Hook principal du formulaire
  const {
    facture, setFacture, isLoading, setIsLoading, isSubmitting, setIsSubmitting,
    error, setError, clientData, setClientData, clientLoading, setClientLoading,
    isLignesValid, setIsLignesValid, factureService, clientService,
    isReadOnly, isFormValid, getFormData
  } = useFactureForm(mode, factureId);

  // État pour les modales d'erreur
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning'
  });

  // Actions métier
  const factureActions = new FactureFormActions(factureService, clientService);

  // Hook d'initialisation
  const {
    isFullyInitialized, initialFormData, setInitialFormData
  } = useFactureInitialization(mode, factureId, {
    chargerFacture: (id) => factureActions.chargerFacture(id, {
      setIsLoading, setError, setFacture, setIsLignesValid,
      fetchClientDetails: (clientId) => factureActions.fetchClientDetails(clientId, {
        setClientLoading, setClientData
      })
    }),
    fetchProchainNumeroFacture: (annee) => factureActions.fetchProchainNumeroFacture(annee, setFacture),
    chargerClients: () => {}, // Implémentation si nécessaire
    setFacture,
    setIsLoading,
    getFormData
  });

  // Hook de navigation
  const canDetectChanges = () => !isLoading && !isSubmitting && isFullyInitialized && mode !== FORM_MODES.VIEW;
  
  const {
    hasUnsavedChanges, showUnsavedModal, confirmNavigation, cancelNavigation,
    showGlobalModal, setShowGlobalModal, globalNavigationCallback, 
    setGlobalNavigationCallback, handleSuccessfulSave, guardId, unregisterGuard
  } = useFactureNavigation(mode, factureId, initialFormData, getFormData, canDetectChanges);

  // Gestionnaires pour les changements de formulaire
  const handleNumeroFactureChange = (value) => {
    if (isReadOnly) return;
    setFacture(prev => ({ ...prev, numeroFacture: value }));
  };

  const handleDateFactureChange = (value) => {
    if (isReadOnly) return;
    setFacture(prev => ({ ...prev, dateFacture: value }));
  };

  const handleClientChange = (value) => {
    if (isReadOnly) return;
    setFacture(prev => ({ ...prev, clientId: value }));
    factureActions.fetchClientDetails(value, { setClientLoading, setClientData });
  };

  const handleLignesChange = (lignes) => {
    if (isReadOnly || !lignes?.length) return;

    const validite = validateFactureLines(lignes);
    setIsLignesValid(validite);

    const lignesFormatees = lignes.map((ligne, index) => ({
      id: ligne.id || null,
      description: ligne.description,
      descriptionDates: ligne.descriptionDates || '',
      unite: ligne.unite || '',
      quantite: parseFloat(ligne.quantite) || 0,
      prixUnitaire: parseFloat(ligne.prixUnitaire) || 0,
      total: parseFloat(ligne.total) || 0,
      serviceId: ligne.serviceId || null,
      uniteId: ligne.uniteId || null,
      noOrdre: ligne.noOrdre || index + 1
    }));

    const totalBrut = lignesFormatees.reduce((sum, ligne) => sum + ligne.total, 0);

    setFacture(prev => ({
      ...prev,
      lignes: lignesFormatees,
      totalFacture: totalBrut,
      totalAvecRistourne: Math.max(0, totalBrut - (prev.ristourne || 0))
    }));
  };

  const handleRistourneChange = (totauxData) => {
    if (isReadOnly) return;
    const nouvelleRistourne = totauxData.ristourne || 0;
    setFacture(prev => ({
      ...prev,
      ristourne: nouvelleRistourne,
      totalAvecRistourne: Math.max(0, prev.totalFacture - nouvelleRistourne)
    }));
  };

  const resetRistourne = () => {
    setFacture(prev => ({
      ...prev,
      ristourne: 0,
      totalAvecRistourne: prev.totalFacture
    }));
  };

  // Gestionnaires d'événements principaux
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation de base
    if (!facture.numeroFacture || !facture.clientId || !facture.lignes?.length || !isFormValid) {
      setConfirmModal({
        isOpen: true,
        title: 'Formulaire incomplet',
        message: 'Veuillez compléter tous les champs obligatoires.',
        type: 'warning'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const factureData = {
        numeroFacture: facture.numeroFacture,
        dateFacture: facture.dateFacture || new Date().toISOString().split('T')[0],
        clientId: facture.clientId,
        totalFacture: facture.totalFacture,
        ristourne: facture.ristourne || 0,
        lignes: facture.lignes
      };

      const result = await factureActions.submitFacture(factureData, mode, factureId);
      
      if (result?.success) {
        const newFactureId = result.id || facture.id;
        const message = mode === FORM_MODES.CREATE ? 'Facture créée avec succès' : 'Facture modifiée avec succès';
        handleSuccessfulSave(newFactureId, message, { onFactureCreated, onRetourListe });
      } else {
        throw new Error(result?.message || 'Une erreur est survenue');
      }
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      setConfirmModal({
        isOpen: true,
        title: 'Erreur',
        message: error.message || 'Une erreur est survenue lors de l\'enregistrement',
        type: 'warning'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (mode === FORM_MODES.VIEW) {
      if (onRetourListe) {
        onRetourListe(null, false, '', '');
      }
      return;
    }

    if (!hasUnsavedChanges) {
      unregisterGuard(guardId);
      if (onRetourListe) {
        onRetourListe(null, false, '', '');
      }
      return;
    }

    // Utiliser le système de navigation avec protection
    // La logique sera gérée par les modales
  };

  // Fermeture des modales d'erreur
  const handleCloseConfirmModal = () => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
  };

  // Rendu conditionnel pour le chargement/erreur
  if (isLoading) {
    return (
      <div className="content-section-container">
        <div className="content-section-title">
          <h2>{getTitreFormulaire(mode)}</h2>
        </div>
        <div className={getFormContainerClass(mode)}>
          <p className="ff-loading-message">Chargement des données de la facture...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="content-section-container">
        <div className="content-section-title">
          <h2>{getTitreFormulaire(mode)}</h2>
        </div>
        <div className={getFormContainerClass(mode)}>
          <p className="ff-error-message">{error}</p>
          <div className="ff-facture-actions">
            <button type="button" className="ff-button-retour" onClick={() => onRetourListe(null, false)}>
              Retour à la liste
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Rendu principal
  return (
    <div className="content-section-container">
      <div className="content-section-title">
        <h2>{getTitreFormulaire(mode)}</h2>
      </div>

      <FactureStateBanners 
        mode={mode} 
        facture={facture} 
        // ✅ CORRECTION: Utilisation du formatter centralisé
        formatDate={formatDate} 
      />

      <form onSubmit={handleSubmit} className="ff-formulaire-facture">
        <div className={getFormContainerClass(mode)}>
          <FactureHeader
            numeroFacture={facture.numeroFacture}
            dateFacture={facture.dateFacture}
            clientId={facture.clientId}
            clients={clients}
            readOnly={isReadOnly}
            clientsLoading={clientsLoading}
            onNumeroFactureChange={handleNumeroFactureChange}
            onDateFactureChange={handleDateFactureChange}
            onClientChange={handleClientChange}
            documentPath={facture.documentPath}
            mode={mode}
            etat={facture.etat}
            etatAffichage={facture.etatAffichage} // ✅ AJOUT: Passage de etatAffichage
            factureId={factureId || facture.id}
            factureData={facture}
          />
          
          {clientData && (
            <>
              <div className="ff-facture-details-container">
                <FactureDetailsForm
                  onLignesChange={handleLignesChange}
                  lignesInitiales={facture.lignes}
                  client={clientData}
                  readOnly={isReadOnly}
                  isModification={mode === FORM_MODES.EDIT}
                  preserveExistingLines={mode === FORM_MODES.EDIT}
                  onResetRistourne={resetRistourne}
                />
              </div>
              
              <div className="ff-facture-totals-container">
                <FactureTotauxDisplay
                  lignes={facture.lignes}
                  ristourneInitiale={facture.ristourne}
                  readOnly={isReadOnly}
                  onChange={handleRistourneChange}
                />
              </div>
            </>
          )}

          {isReadOnly && (
            <FactureHistoriquePaiements
              etat={facture.etat}
              factureId={factureId || facture.id}
              // ✅ CORRECTION: Utilisation des formatters centralisés
              formatMontant={formatMontant}
              formatDate={formatDate}
            />
          )}

          <FactureFormButtons
            mode={mode}
            isSubmitting={isSubmitting}
            isFormValid={isFormValid}
            getSubmitButtonText={getSubmitButtonText}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </div>
      </form>

      <FactureFormModals
        showUnsavedModal={showUnsavedModal}
        showGlobalModal={showGlobalModal}
        confirmNavigation={confirmNavigation}
        cancelNavigation={cancelNavigation}
        onConfirmGlobal={() => {
          setShowGlobalModal(false);
          unregisterGuard(guardId);
          if (globalNavigationCallback) globalNavigationCallback();
        }}
        onCancelGlobal={() => {
          setShowGlobalModal(false);
          setGlobalNavigationCallback(null);
        }}
        confirmModal={confirmModal}
        onCloseConfirmModal={handleCloseConfirmModal}
      />
    </div>
  );
}

export { FactureForm };
export default FactureForm;