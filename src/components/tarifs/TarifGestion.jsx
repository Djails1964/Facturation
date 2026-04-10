// TarifGestion.jsx - Version refactorisée (de 1000+ lignes à ~150 lignes)

import React, { useState, useRef, useEffect } from 'react';
import { useNavigationGuard } from '../../App';
import { useNotifications } from '../../services/NotificationService';

// Hooks personnalisés
import { useTarifGestionState } from './hooks/useTarifGestionState';
import { useTarifNotifications } from './hooks/useTarifNotifications';
import { useTarifModals } from './hooks/useTarifModals';

// Composants modulaires
import TarifTabs from './components/TarifTabs';
import TarifContent from './components/TarifContent';
import TarifAuthorization from './components/TarifAuthorization';
import { createLogger } from '../../utils/createLogger';

import '../../styles/components/tarifs/TarifGestion.css';
import SectionTitle from '../shared/SectionTitle';

const TarifGestion = ({ 
  initialSection = 'services',
  userContext,
  onTarifAction,
  onNavigateToFacture,
  preselectedData = {}
}) => {

  const log = createLogger('TarifGestion');

  // ✅ AJOUT: Logs pour tracker le cycle de vie
  log.debug('🎬 TarifGestion - RENDER');
  
  useEffect(() => {
    log.debug('✅ TarifGestion - MOUNTED');
    return () => {
      log.debug('❌ TarifGestion - UNMOUNTED (démontage)');
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
  const { showSuccess, showError, showInfo } = useNotifications();
  
  // Transformer les messages de gestionState en notifications du NotificationService
  useEffect(() => {
    if (gestionState.message) {
      const type = gestionState.messageType || 'info';
      
      if (type === 'success') {
        showSuccess(gestionState.message);
      } else if (type === 'error' || type === 'danger') {
        showError(gestionState.message);
      } else {
        showInfo(gestionState.message);
      }
      
      // Effacer le message après l'avoir affiché
      setTimeout(() => {
        gestionState.handleDismissMessage?.();
      }, 100);
    }
  }, [gestionState.message, gestionState.messageType]);
  
  const { 
    handleCreateItem,
    handleEditItem, 
    handleDeleteItem,
    handleUnlinkServiceUnite 
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
        log.debug('🔄 Changement onglet tarifs:', activeTab, '->', newTab);
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
    log.debug(`🔄 Action groupée: ${action}`, tarifs);
    
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
      <SectionTitle>Gestion des tarifs</SectionTitle>
      {/* Informations utilisateur en mode dev */}
      {process.env.NODE_ENV === 'development' && gestionState.userInfo && gestionState.isAuthorized && (
        <div style={{ fontSize: '0.8em', color: 'var(--color-text-light)', marginBottom: '10px' }}>
          Connecté en tant que: <strong>{gestionState.userInfo.username}</strong> (rôle: <strong>{gestionState.userInfo.role}</strong>)
        </div>
      )}
      
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
              onUnlinkServiceUnite={handleUnlinkServiceUnite}
              
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