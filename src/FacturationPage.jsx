// src/FacturationPage.jsx
/**
 * Page principale de facturation avec sections multiples
 * ✅ Intégration du nouveau Dashboard
 * ✅ Intégration de la gestion des Loyers
 */

import { useState, useEffect, useCallback } from 'react';
import ClientGestion from './components/clients/ClientGestion';
import FactureGestion from './components/factures/FactureGestion';
import LocationSalleGestion from './components/locationSalle/LocationSalleGestion';
import LoyerGestion from './components/loyers/LoyerGestion';
import PaiementGestion from './components/paiements/PaiementGestion';
import TarifGestion from './components/tarifs/TarifGestion';
import DashboardWrapper from './components/dashboard/DashboardWrapper';
import GestionUtilisateurs from './components/users/GestionUtilisateurs';
import { GestionParametres } from './components/parametres';
import AdminDashboard from './components/AdminDashboard';
import { useNavigationGuard } from './App';
import { createLogger } from './utils/createLogger';
import { APP_VERSION } from './version';
import './FacturationPage.css';

const FacturationPage = ({ userContext, initialSection = 'factures' }) => {

  const log = createLogger('FacturationPage');

  const [activeSection, setActiveSection] = useState(initialSection);
  const [clientCreatedId, setClientCreatedId] = useState(null);
  const [factureCreatedId, setFactureCreatedId] = useState(null);
  const [factureCreatedAnnee, setFactureCreatedAnnee] = useState(null);
  const [paiementCreatedId, setPaiementCreatedId] = useState(null);
  const [loyerCreatedId, setLoyerCreatedId] = useState(null);
  const [tarifIntegration, setTarifIntegration] = useState({
    selectedService: null,
    selectedTarif: null,
    lastAction: null,
    contextualData: {}
  });

  // Clé pour forcer le remontage de TarifGestion
  const [tarifKey, setTarifKey] = useState(0);

  // Utiliser le guard global
  const { interceptNavigation } = useNavigationGuard();

  // Effet pour mettre à jour la section active quand initialSection change
  useEffect(() => {
    setActiveSection(initialSection);
  }, [initialSection]);

  // Déterminer si l'utilisateur est un admin ou gestionnaire
  const isAdmin = userContext?.user?.role === 'admin';
  const isGestionnaire = userContext?.user?.role === 'gestionnaire';
  const canAccessParams = isAdmin || isGestionnaire;

  const handleClientCreated = (idClient) => {
    setClientCreatedId(idClient);
    setActiveSection('clients');
  };

  const handleFactureCreated = (idFacture) => {
    setFactureCreatedId(idFacture);
    setActiveSection('factures');
  };

  const handlePaiementCreated = (idPaiement) => {
    setPaiementCreatedId(idPaiement);
    setActiveSection('paiements');
  };

  const handleLoyerCreated = (idLoyer) => {
    setLoyerCreatedId(idLoyer);
    setActiveSection('loyers');
  };

  // ✅ Navigation vers les factures après génération depuis un loyer
  // anneeFacture est fourni par useFactureFromLoyer via result.anneeFacture
  const handleFactureCreatedFromLoyer = useCallback((idFacture, anneeFacture) => {
    log.info('➡️ Navigation vers factures après génération depuis loyer, id:', idFacture, 'année:', anneeFacture);
    setFactureCreatedId(idFacture);
    setFactureCreatedAnnee(anneeFacture ?? null);
    setActiveSection('factures');
  }, [log]);

  // Fonction protégée pour changer de section
  const handleSectionChange = (newSection) => {
    interceptNavigation(
      () => {
        log.info('📄 Changement de section:', activeSection, '->', newSection);
        
        // Si on quitte les tarifs, incrémenter la clé pour forcer le remontage au retour
        if (activeSection === 'tarifs' && newSection !== 'tarifs') {
          setTarifKey(prev => prev + 1);
          log.debug('🔑 Clé tarifs incrémentée pour réinitialisation future');
        }
        
        setActiveSection(newSection);
        
        // Reset des IDs quand on change de section
        if (newSection !== 'clients') {
          setClientCreatedId(null);
        }
        if (newSection !== 'factures') {
          setFactureCreatedId(null);
          setFactureCreatedAnnee(null);
        }
        if (newSection !== 'paiements') {
          setPaiementCreatedId(null);
        }
        if (newSection !== 'loyers') {
          setLoyerCreatedId(null);
        }
      },
      `menu-${newSection}`
    );
  };

  const handleTarifIntegrationAction = useCallback((action, data) => {
    log.debug('📄 Action tarif:', action, data);
    
    setTarifIntegration(prev => ({
      ...prev,
      lastAction: action,
      ...data
    }));

    if (action === 'create-facture-from-tarif') {
      log.info('➡️ Navigation vers création facture avec tarif');
      setActiveSection('nouvelle');
    }
  }, []);

  const renderContent = () => {
    switch (activeSection) {
      case 'tarifs':
        return null;
      
      case 'parametres':
        return canAccessParams ? <GestionParametres /> : <div className="content-placeholder">Accès non autorisé</div>;
      
      case 'nouvelle':
        return <FactureGestion
          section="nouveau"
          onFactureCreated={handleFactureCreated}
        />;
      
      case 'factures':
        return <FactureGestion
          key={factureCreatedId ? `facture-${factureCreatedId}` : 'factures-liste'}
          section="liste"
          idFacture={factureCreatedId}
          anneeFacture={factureCreatedAnnee}
          onSectionChange={() => { setFactureCreatedId(null); setFactureCreatedAnnee(null); }}
        />;
      
      case 'nouveau-paiement':
        return <PaiementGestion
          section="nouveau"
          onPaiementCreated={handlePaiementCreated}
        />;
      
      case 'paiements':
        return <PaiementGestion
          section="liste"
          idPaiement={paiementCreatedId}
          onSectionChange={() => setPaiementCreatedId(null)}
        />;

      case 'location-salle':
        return <LocationSalleGestion />;
      
      case 'nouveau-loyer':
        return <LoyerGestion
          section="nouveau"
          onLoyerCreated={handleLoyerCreated}
        />;
      
      case 'loyers':
        return <LoyerGestion
          section="liste"
          idLoyer={loyerCreatedId}
          onSectionChange={() => setLoyerCreatedId(null)}
          onFactureGeneree={handleFactureCreatedFromLoyer}
        />;
      
      case 'clients':
        return <ClientGestion
          section="liste"
          idClient={clientCreatedId}
          onSectionChange={() => setClientCreatedId(null)}
        />;
      
      case 'nouveau-client':
        return <ClientGestion
          section="nouveau"
          onClientCreated={handleClientCreated}
        />;
      
      case 'dashboard':
        return <DashboardWrapper />;
      
      case 'admin_dashboard':
        return isAdmin ? <AdminDashboard userContext={userContext} /> : <div className="content-placeholder">Accès non autorisé</div>;
      
      case 'utilisateurs':
        return canAccessParams ? <GestionUtilisateurs /> : <div className="content-placeholder">Accès non autorisé</div>;
      
      default:
        return <div className="content-placeholder">Sélectionnez une option du menu</div>;
    }
  };

  const getPageTitle = () => {
    return 'Facturation';
  };

  return (
    <div className="facturation-container">
      <div className="facturation-header">
        <h1>{getPageTitle()}</h1>
      </div>
      <div className="facturation-body">
        <div className="facturation-menu">
          <ul>
            {/* Factures */}
            <li
              className={activeSection === 'factures' ? 'active' : ''}
              onClick={() => handleSectionChange('factures')}
              title="Gestion des factures"
            >
              <span className="menu-label">
                <span className="menu-icon">📄</span>
                <span>Factures</span>
              </span>
            </li>
            
            {/* ✅ NOUVEAU: Loyers juste après Factures */}
            <li
              className={activeSection === 'loyers' ? 'active' : ''}
              onClick={() => handleSectionChange('loyers')}
              title="Gestion des loyers"
            >
              <span className="menu-label">
                <span className="menu-icon">🏠</span>
                <span>Loyers</span>
              </span>
            </li>

            {/* Locations de salle */}
            <li
              className={activeSection === 'location-salle' ? 'active' : ''}
              onClick={() => handleSectionChange('location-salle')}
              title="Locations de salle"
            >
              <span className="menu-label">
                <span className="menu-icon">🏢</span>
                <span>Locations salle</span>
              </span>
            </li>
            
            {/* Paiements */}
            <li
              className={activeSection === 'paiements' ? 'active' : ''}
              onClick={() => handleSectionChange('paiements')}
              title="Enregistrement des paiements"
            >
              <span className="menu-label">
                <span className="menu-icon">💳</span>
                <span>Paiements</span>
              </span>
            </li>
            
            {/* Clients */}
            <li
              className={activeSection === 'clients' ? 'active' : ''}
              onClick={() => handleSectionChange('clients')}
              title="Gestion des clients"
            >
              <span className="menu-label">
                <span className="menu-icon">👥</span>
                <span>Clients</span>
              </span>
            </li>

            {/* ✅ Dashboard dans le menu */}
            <li
              className={activeSection === 'dashboard' ? 'active' : ''}
              onClick={() => handleSectionChange('dashboard')}
              title="Vue d'ensemble des statistiques"
            >
              <span className="menu-label">
                <span className="menu-icon">📊</span>
                <span>Dashboard</span>
              </span>
            </li>
            
            {/* Section admin/gestionnaire */}
            {canAccessParams && (
              <>
                <li style={{
                  height: '1px',
                  backgroundColor: '#ddd',
                  margin: '10px 0',
                  pointerEvents: 'none',
                  padding: 0
                }}></li>
                
                <li
                  className={`menu-privileged ${activeSection === 'tarifs' ? 'active' : ''}`}
                  onClick={() => handleSectionChange('tarifs')}
                  title="Gestion des tarifs et prix"
                >
                  <span className="menu-label">
                    <span className="menu-icon">💰</span>
                    <span>Tarifs</span>
                  </span>
                </li>
                
                <li
                  className={`menu-privileged ${activeSection === 'parametres' ? 'active' : ''}`}
                  onClick={() => handleSectionChange('parametres')}
                  title="Configuration de l'application"
                >
                  <span className="menu-label">
                    <span className="menu-icon">⚙️</span>
                    <span>Paramètres</span>
                  </span>
                </li>
                
                <li
                  className={`menu-privileged ${activeSection === 'utilisateurs' ? 'active' : ''}`}
                  onClick={() => handleSectionChange('utilisateurs')}
                  title="Gestion des comptes utilisateur"
                >
                  <span className="menu-label">
                    <span className="menu-icon">👥</span>
                    <span>Utilisateurs</span>
                  </span>
                </li>
              </>
            )}
          </ul>
        </div>
        <div className="facturation-content">
          {/* TarifGestion toujours monté, caché avec display */}
          {canAccessParams && (
            <div className={activeSection === 'tarifs' ? 'tarif-container-visible' : 'tarif-container-hidden'}>
              <TarifGestion 
                key={tarifKey}
                initialSection={tarifIntegration.activeTab || 'services'}
                userContext={userContext}
                onTarifAction={handleTarifIntegrationAction}
                onNavigateToFacture={(idService, tarifId) => {
                  handleTarifIntegrationAction('create-facture-from-tarif', {
                    selectedService: idService,
                    selectedTarif: tarifId
                  });
                }}
                preselectedData={tarifIntegration.contextualData}
              />
            </div>
          )}
          
          {/* Autres sections */}
          {activeSection !== 'tarifs' && renderContent()}
        </div>
      </div>
    </div>
  );
};

export default FacturationPage;