// src/components/factures/FactureForm.jsx
// ✅ VERSION FINALE COMPLÈTE - Navigation 100% modalSystem

import React, { useState, useEffect } from 'react';
import { useFactureForm } from './hooks/useFactureForm';
import { useFactureInitialization } from './hooks/useFactureInitialization';
import { useFactureNavigation } from './hooks/useFactureNavigation';
import { FactureFormActions } from './services/factureFormActions';
import { FactureStateBanners } from './components/FactureStateBanners';
import { FactureFormButtons } from './components/FactureFormButtons';
import { getTitreFormulaire, getFormContainerClass, getSubmitButtonText } from './utils/factureHelpers';
import { validateFactureLines } from './utils/factureValidation';
import { FORM_MODES } from '../../constants/factureConstants';
import { formatDate, formatMontant } from '../../utils/formatters';
import FactureHeader from './components/FactureHeader';
import FactureDetailsForm from './FactureDetailsForm';
import FactureTotauxDisplay from './components/FactureTotauxDisplay';
import FactureHistoriquePaiements from './components/FactureHistoriquePaiements';
import '../../styles/components/factures/FactureForm.css';

function FactureForm({
  mode = FORM_MODES.VIEW,
  idFacture = null,
  onRetourListe,
  onFactureCreated,
  clients = [],
  clientsLoading = false,
  onRechargerClients = null
}) {

  console.log('📋 FactureForm - Props reçues:', { mode, idFacture, typeIdFacture: typeof idFacture });
  
  // Hook principal du formulaire
  const {
    facture, setFacture, isLoading, setIsLoading, isSubmitting, setIsSubmitting,
    error, setError, clientData, setClientData, clientLoading, setClientLoading,
    isLignesValid, setIsLignesValid, factureService, clientService, tarificationService,
    isReadOnly, isFormValid, getFormData
  } = useFactureForm(mode, idFacture);

  // État pour les modales d'erreur (non liées à la navigation)
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning'
  });

  // Actions métier
  const factureActions = new FactureFormActions(factureService, clientService, tarificationService);

  // Hook d'initialisation
  const {
    isFullyInitialized, initialFormData, setInitialFormData
  } = useFactureInitialization(mode, idFacture, {
    chargerFacture: (id) => factureActions.chargerFacture(id, {
      setIsLoading, setError, setFacture, setIsLignesValid,
      fetchClientDetails: (idClient) => factureActions.fetchClientDetails(idClient, {
        setClientLoading, setClientData
      })
    }),
    fetchProchainNumeroFacture: (annee) => factureActions.fetchProchainNumeroFacture(annee, setFacture),
    chargerClients: () => {},
    setFacture,
    setIsLoading,
    getFormData
  });

  // ✅ Hook de navigation simplifié - 100% modalSystem
  const canDetectChanges = () => !isLoading && !isSubmitting && isFullyInitialized && mode !== FORM_MODES.VIEW;

// 🔍 DEBUG 1 - Initialisation
useEffect(() => {
  console.log('=== INITIALISATION DEBUG ===');
  console.log('initialFormData:', JSON.stringify(initialFormData));
  console.log('facture actuelle:', JSON.stringify(facture));
  console.log('isFullyInitialized:', isFullyInitialized);
}, [initialFormData, facture, isFullyInitialized]);

// 🔍 DEBUG 2 - Comparaison détaillée
useEffect(() => {
  console.log('=== COMPARAISON DEBUG ===');
  if (initialFormData && facture) {
    const keys = Object.keys(initialFormData);
    keys.forEach(key => {
      const initial = initialFormData[key];
      const current = facture[key];
      
      if (JSON.stringify(initial) !== JSON.stringify(current)) {
        console.log(`❌ Différence sur "${key}":`, {
          initial: initial,
          current: current,
          typeInitial: typeof initial,
          typeCurrent: typeof current
        });
      }
    });
    
    // Vérification spéciale pour les lignes (array)
    if (Array.isArray(initialFormData.lignes) && Array.isArray(facture.lignes)) {
      console.log('Comparaison lignes:', {
        lengthInitial: initialFormData.lignes.length,
        lengthCurrent: facture.lignes.length,
        equal: JSON.stringify(initialFormData.lignes) === JSON.stringify(facture.lignes)
      });
    }
  }
}, [initialFormData, facture]);
useEffect(() => {
  const currentData = canDetectChanges() ? getFormData() : {};
  console.log('🔍 currentData pour détection:', {
    hasLignes: currentData.lignes !== undefined,
    lignesCount: currentData.lignes?.length,
    currentData: currentData
  });
}, [facture, canDetectChanges, getFormData]);
  
  const {
    hasUnsavedChanges,
    requestNavigation,
    handleSuccessfulSave,
    guardId,
    unregisterGuard
  } = useFactureNavigation(mode, idFacture, initialFormData, getFormData, canDetectChanges);

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
    setFacture(prev => ({ ...prev, idClient: value }));
    factureActions.fetchClientDetails(value, { setClientLoading, setClientData });
  };

  const handleLignesChange = (nouvLignes) => {
    console.log('🔍 handleLignesChange appelé:', nouvLignes);
    if (isReadOnly) return;
    
    const validationResult = validateFactureLines(nouvLignes);
    console.log('✅ Validation:', validationResult);
    
    setIsLignesValid(validationResult);
    
    if (validationResult) {
      // ✅ CORRECTION : Utiliser totalLigne au lieu de montant
      const total = nouvLignes.reduce((acc, ligne) => acc + (parseFloat(ligne.totalLigne) || 0), 0);
      
      setFacture(prev => ({
        ...prev,
        lignes: nouvLignes,
        totalFacture: total,  // Total brut
        totalAvecRistourne: Math.max(0, total - (prev.ristourne || 0))  // Total net
      }));
      
      console.log('✅ Facture mise à jour - Total brut:', total);
    }
  }

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
    if (isReadOnly) return;
    setFacture(prev => ({ ...prev, ristourne: 0 }));
  };

  // ✅ Gestionnaire de retour/annulation avec protection via modalSystem
  const handleCancel = () => {
    if (hasUnsavedChanges && mode !== FORM_MODES.VIEW) {
      // requestNavigation affiche automatiquement la modal via modalSystem
      requestNavigation(() => {
        unregisterGuard(guardId);
        if (onRetourListe) {
          onRetourListe();
        }
      });
    } else {
      if (guardId) {
        unregisterGuard(guardId);
      }
      if (onRetourListe) {
        onRetourListe();
      }
    }
  };

  // Gestionnaire de soumission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid || isReadOnly) return;

    try {
      setIsSubmitting(true);
      
      // Construction du clientNom
      let clientNom = 'Client inconnu';
      
      if (clientData && clientData.prenom && clientData.nom) {
        clientNom = `${clientData.prenom} ${clientData.nom}`;
      } else if (facture.client && facture.client.prenom && facture.client.nom) {
        clientNom = `${facture.client.prenom} ${facture.client.nom}`;
      } else if (facture.idClient && clients && clients.length > 0) {
        const clientTrouve = clients.find(c => c.id === facture.idClient);
        if (clientTrouve && clientTrouve.prenom && clientTrouve.nom) {
          clientNom = `${clientTrouve.prenom} ${clientTrouve.nom}`;
        }
      }

      // ✅ Construction de l'objet factureData
      const factureData = {
        numeroFacture: facture.numeroFacture,
        dateFacture: facture.dateFacture || new Date().toISOString().split('T')[0],
        idClient: facture.idClient,
        montantTotal: facture.totalFacture,  // ✅ Total brut
        ristourne: facture.ristourne || 0,   // ✅ Ristourne
        lignes: facture.lignes,
        clientNom: clientNom
      };

      console.log('📤 Données envoyées à submitFacture:', factureData);
      console.log('📊 Détails financiers:', {
        totalBrut: facture.totalFacture,
        ristourne: facture.ristourne,
        totalNet: facture.totalAvecRistourne
      });

      const result = await factureActions.submitFacture(factureData, mode, idFacture);
      
      if (result?.success) {
        const newFactureId = result.id || facture.id;
        const numeroFacture = result.numeroFacture || facture.numeroFacture;
        const message = mode === FORM_MODES.CREATE 
          ? `Facture ${numeroFacture} créée avec succès`
          : `Facture ${numeroFacture} modifiée avec succès`;

        handleSuccessfulSave(newFactureId, message, {
          onFactureCreated,
          onRetourListe
        });
      }
    } catch (err) {
      console.error('Erreur lors de la soumission:', err);
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fermer la modale de confirmation (pour erreurs métier)
  const handleCloseConfirmModal = () => {
    setConfirmModal({
      isOpen: false,
      title: '',
      message: '',
      type: 'warning'
    });
  };

  // Affichage du chargement
  if (isLoading) {
    return (
      <div className="form-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Chargement en cours...</p>
        </div>
      </div>
    );
  }

  // Affichage des erreurs
  if (error) {
    return (
      <div className="form-container">
        <div className="error-container">
          <h2>Erreur</h2>
          <p className="error-message">{error}</p>
          <button className="btn-primary" onClick={handleCancel}>
            Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={getFormContainerClass(mode)}>
      <form onSubmit={handleSubmit} className="formulaire-facture">
        <div className={getFormContainerClass(mode)}>
          
          {/* En-tête avec titre */}
          <h2 className="form-title">{getTitreFormulaire(mode, facture)}</h2>

          {/* ✅ Bandeaux d'état (Annulée, Payée) */}
          <FactureStateBanners mode={mode} facture={facture} />

          {/* Header de la facture */}
          <FactureHeader
            numeroFacture={facture.numeroFacture}
            dateFacture={facture.dateFacture}
            idClient={facture.idClient}
            clients={clients}
            readOnly={isReadOnly}
            clientsLoading={clientsLoading}
            onNumeroFactureChange={handleNumeroFactureChange}
            onDateFactureChange={handleDateFactureChange}
            onClientChange={handleClientChange}
            documentPath={facture.documentPath}
            mode={mode}
            etat={facture.etat}
            etatAffichage={facture.etatAffichage}
            idFacture={idFacture || facture.id}
            factureData={facture}
          />
          
          {/* Détails de la facture si client chargé */}
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

          {/* Historique des paiements en mode lecture seule */}
          {isReadOnly && (
            <FactureHistoriquePaiements
              etat={facture.etat}
              idFacture={idFacture || facture.id}
              formatMontant={formatMontant}
              formatDate={formatDate}
            />
          )}

          {/* ✅ Boutons d'action avec le composant dédié */}
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

      {/* ✅ Plus de FactureFormModals ! Tout géré par modalSystem dans les hooks */}
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
          <div>canDetectChanges: {canDetectChanges() ? 'Oui' : 'Non'}</div>
        </div>
      )}
    </div>
  );
}

export { FactureForm };
export default FactureForm;