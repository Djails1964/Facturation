import React, { useState } from 'react';
import { useFactureForm } from './hooks/useFactureForm';
import { useFactureInitialization } from './hooks/useFactureInitialization';
import { useFactureNavigation } from './hooks/useFactureNavigation';
import { FactureFormActions } from './services/factureFormActions';
import { FactureStateBanners } from './components/FactureStateBanners';
import { FactureFormButtons } from './components/FactureFormButtons';
import { FactureFormModals } from './components/FactureFormModals';
import { getTitreFormulaire, getFormContainerClass, getSubmitButtonText } from './utils/factureHelpers';
import { validateFactureLines } from './utils/factureValidation';
import { FORM_MODES } from '../../constants/factureConstants';
// ✅ AJOUT: Import des formatters
import { formatDate, formatMontant } from '../../utils/formatters';
import FactureHeader from './components/FactureHeader';
import FactureDetailsForm from './FactureDetailsForm';
import FactureTotauxDisplay from './components/FactureTotauxDisplay';
import FactureHistoriquePaiements from './components/FactureHistoriquePaiements';
import '../../styles/components/factures/FactureForm.css';

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
        // ✅ CORRECTION: Construction du client_nom avec les données disponibles
        let client_nom = 'Client inconnu';
        
        // Option 1: Utiliser clientData si disponible (cas normal)
        if (clientData && clientData.prenom && clientData.nom) {
          client_nom = `${clientData.prenom} ${clientData.nom}`;
          console.log('✅ Client_nom construit depuis clientData:', client_nom);
        }
        // Option 2: Utiliser facture.client si disponible (cas de chargement de facture existante)
        else if (facture.client && facture.client.prenom && facture.client.nom) {
          client_nom = `${facture.client.prenom} ${facture.client.nom}`;
          console.log('✅ Client_nom construit depuis facture.client:', client_nom);
        }
        // Option 3: Chercher dans la liste des clients par ID
        else if (facture.clientId && clients && clients.length > 0) {
          const clientTrouve = clients.find(c => c.id === facture.clientId);
          if (clientTrouve && clientTrouve.prenom && clientTrouve.nom) {
            client_nom = `${clientTrouve.prenom} ${clientTrouve.nom}`;
            console.log('✅ Client_nom construit depuis liste clients:', client_nom);
          }
        }

        const factureData = {
          // Champs principaux
          numeroFacture: facture.numeroFacture,
          numero_facture: facture.numeroFacture, // ✅ AJOUT: Support backend
          dateFacture: facture.dateFacture || new Date().toISOString().split('T')[0],
          clientId: facture.clientId,
          totalFacture: facture.totalFacture,
          montantTotal: facture.totalFacture, // ✅ AJOUT: Support backend
          ristourne: facture.ristourne || 0,
          lignes: facture.lignes,
          
          // ✅ AJOUT PRINCIPAL: Informations client pour le logging backend
          client_nom: client_nom
        };

        console.log('🔍 Données envoyées à submitFacture:', factureData);

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

  // ✅ CORRECTION : Fonction handleCancel avec callback différé
  const handleCancel = () => {
    console.log('🔄 handleCancel appelé - Mode:', mode, 'hasUnsavedChanges:', hasUnsavedChanges);
    
    // Si en mode lecture seule, retour direct
    if (mode === FORM_MODES.VIEW) {
      console.log('📖 Mode lecture - retour direct');
      if (onRetourListe) {
        onRetourListe(null, false, '', '');
      }
      return;
    }

    // Si pas de changements non sauvegardés, retour direct
    if (!hasUnsavedChanges) {
      console.log('✅ Pas de changements - retour direct');
      unregisterGuard(guardId);
      if (onRetourListe) {
        onRetourListe(null, false, '', '');
      }
      return;
    }

    // ✅ CORRECTION : Bloquer complètement la navigation et afficher la modal
    console.log('⚠️ Changements détectés - modal seulement, PAS de navigation');
    
    // Afficher la modal SANS exécuter de navigation
    setShowGlobalModal(true);
    
    // ✅ CORRECTION : Ne pas appeler setGlobalNavigationCallback ici
    // On va configurer la navigation directement dans onConfirmGlobal
  };

  // Fermeture des modales d'erreur
  const handleCloseConfirmModal = () => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
  };

  // ✅ AJOUT : Debug des changements (temporaire)
  React.useEffect(() => {
    if (isFullyInitialized && mode !== FORM_MODES.VIEW) {
      console.log('🔍 Détection changements:', {
        hasUnsavedChanges,
        canDetectChanges: canDetectChanges(),
        isFullyInitialized,
        mode,
        factureData: getFormData()
      });
    }
  }, [hasUnsavedChanges, isFullyInitialized, mode, facture]);

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
          console.log('✅ Modal confirmée - navigation vers liste');
          setShowGlobalModal(false);
          unregisterGuard(guardId);
          
          // ✅ CORRECTION : Navigation directe sans callback
          if (onRetourListe) {
            onRetourListe(null, false, '', '');
          }
        }}
        onCancelGlobal={() => {
          console.log('❌ Modal annulée - reste sur formulaire');
          setShowGlobalModal(false);
          // Pas de setGlobalNavigationCallback(null) car on ne l'utilise plus
        }}
        confirmModal={confirmModal}
        onCloseConfirmModal={handleCloseConfirmModal}
      />

      {/* ✅ DEBUG : Affichage temporaire pour diagnostiquer */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          position: 'fixed',
          bottom: '10px',
          right: '10px',
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '10px',
          borderRadius: '4px',
          fontSize: '12px',
          zIndex: 9999
        }}>
          <div>Mode: {mode}</div>
          <div>hasUnsavedChanges: {hasUnsavedChanges ? 'Oui' : 'Non'}</div>
          <div>isFullyInitialized: {isFullyInitialized ? 'Oui' : 'Non'}</div>
          <div>showGlobalModal: {showGlobalModal ? 'Oui' : 'Non'}</div>
          <div>canDetectChanges: {canDetectChanges() ? 'Oui' : 'Non'}</div>
        </div>
      )}
    </div>
  );
}

export { FactureForm };
export default FactureForm;