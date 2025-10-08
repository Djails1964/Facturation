// TarifGestion.jsx - Version refactorisée (de 1000+ lignes à ~150 lignes)

import React, { useState, useRef, useEffect } from 'react';
import { useNavigationGuard } from '../../App';

// Hooks personnalisés
import { useTarifGestionState } from './hooks/useTarifGestionState';
import { useTarifNotifications } from './hooks/useTarifNotifications';
import { useTarifModals } from './hooks/useTarifModals';

// Composants modulaires
import TarifTabs from './components/TarifTabs';
import TarifContent from './components/TarifContent';
import TarifNotifications from './components/TarifNotifications';
import TarifAuthorization from './components/TarifAuthorization';

// Services et utilitaires
import { TarifFormService } from './services/TarifFormService';
import { TarifValidationService } from './services/TarifValidationService';

import '../../styles/components/tarifs/TarifGestion.css';

const TarifGestion = ({ 
  initialSection = 'services',
  userContext,
  onTarifAction,
  onNavigateToFacture,
  preselectedData = {}
}) => {

  // ✅ AJOUT: Logs pour tracker le cycle de vie
  console.log('🎬 TarifGestion - RENDER');
  
  useEffect(() => {
    console.log('✅ TarifGestion - MOUNTED');
    return () => {
      console.log('❌ TarifGestion - UNMOUNTED (démontage)');
    };
  }, []);

  // État de base et données
  const gestionState = useTarifGestionState();
  const { interceptNavigation } = useNavigationGuard();
  
  const [activeTab, setActiveTab] = useState(initialSection);
  const [createdIds, setCreatedIds] = useState({
    service: null,
    unite: null,
    typeTarif: null,
    tarif: null,
    tarifSpecial: null
  });

  // Hooks personnalisés pour la logique métier
  const { notifications, addNotification, removeNotification } = useTarifNotifications();
  
  const { 
    handleCreateItem,
    handleEditItem, 
    handleDeleteItem 
  } = useTarifModals({
    gestionState,
    addNotification,
    setCreatedIds,
    onTarifAction
  });

  // Refs pour le positionnement des modales
  const createButtonRef = useRef(null);
  const editButtonRef = useRef(null);
  const deleteButtonRef = useRef(null);

  // Gestion des onglets
  const handleTabChange = (newTab) => {
    interceptNavigation(
      () => {
        console.log('🔄 Changement onglet tarifs:', activeTab, '->', newTab);
        setActiveTab(newTab);
        
        setCreatedIds(prev => ({
          ...prev,
          [activeTab]: null
        }));

        if (onTarifAction) {
          onTarifAction('tab-changed', { 
            from: activeTab, 
            to: newTab 
          });
        }
      },
      `tarif-tab-${newTab}`
    );
  };

  // Actions avancées
  const handleCreateFactureFromTarif = (tarif, type = 'standard') => {
    if (onNavigateToFacture) {
      onNavigateToFacture(tarif.idService, tarif.id);
      addNotification('info', 'Redirection vers la création de facture...', { tarif });
    }
  };

  const handleBulkTarifAction = (action, tarifs) => {
    console.log(`🔄 Action groupée: ${action}`, tarifs);
    
    switch (action) {
      case 'export':
        addNotification('info', `Export de ${tarifs.length} tarifs en cours...`);
        break;
      case 'duplicate':
        addNotification('info', `Duplication de ${tarifs.length} tarifs en cours...`);
        break;
      default:
        break;
    }
  };

  // Rendu conditionnel pour autorisation
  if (!gestionState.isAuthorized && !gestionState.isLoading) {
    return (
      <TarifAuthorization 
        message={gestionState.message}
        onDismissMessage={gestionState.handleDismissMessage}
        onRetryAuthorization={gestionState.handleRetryAuthorization}
        isLoading={gestionState.isLoading}
      />
    );
  }

  // Rendu principal
  return (
    <div className="content-section-container">
      <div className="content-section-title">
        <h2>Gestion des tarifs</h2>
        
        {/* Informations utilisateur en mode dev */}
        {process.env.NODE_ENV === 'development' && gestionState.userInfo && gestionState.isAuthorized && (
          <div style={{ fontSize: '0.8em', color: '#666', marginBottom: '10px' }}>
            Connecté en tant que: <strong>{gestionState.userInfo.username}</strong> (rôle: <strong>{gestionState.userInfo.role}</strong>)
          </div>
        )}
        
        {gestionState.message && (
          <div className={`alert ${gestionState.messageType === 'success' ? 'alert-success' : gestionState.messageType === 'info' ? 'alert-info' : 'alert-danger'}`}>
            {gestionState.message}
            <button 
              type="button" 
              className="close-message" 
              onClick={gestionState.handleDismissMessage}
              aria-label="Fermer"
            >
              &times;
            </button>
          </div>
        )}
      </div>
      
      {/* Notifications */}
      <TarifNotifications 
        notifications={notifications}
        onRemoveNotification={removeNotification}
      />
      <div className="tarif-gestion-container">
      {/* Afficher le loader seulement si pas de données */}
        {gestionState.services.length === 0 ? (
          <div className="loading-container">
            <p>Chargement des données...</p>
          </div>
        ) : (
          <>
            <TarifTabs 
              activeTab={activeTab}
              onTabChange={handleTabChange}
              isAuthorized={gestionState.isAuthorized}
            />
            
            <TarifContent
              activeTab={activeTab}
              gestionState={gestionState}
              createdIds={createdIds}
              
              // Handlers simplifiés
              onCreateItem={handleCreateItem}
              onEditItem={handleEditItem}
              onDeleteItem={handleDeleteItem}
              
              // Actions avancées
              onCreateFacture={handleCreateFactureFromTarif}
              onBulkAction={handleBulkTarifAction}
              
              // Refs pour positionnement
              createButtonRef={createButtonRef}
              editButtonRef={editButtonRef}
              deleteButtonRef={deleteButtonRef}
            />
          </>
        )}
      </div>
      
      {/* Refs cachées pour le positionnement des modales */}
      <div style={{ display: 'none' }}>
        <div ref={createButtonRef} />
        <div ref={editButtonRef} />
        <div ref={deleteButtonRef} />
      </div>
    </div>
  );
};

export default TarifGestion;