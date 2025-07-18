import React, { useState, useEffect } from 'react';
import ParametresContent from './admin/ParametresContent';
import ClientGestion from './ClientGestion';
import FactureGestion from './FactureGestion';
import TarifGestion from './TarifGestion';
import DashboardWrapper from './DashboardWrapper';
import GestionUtilisateurs from './admin/GestionUtilisateurs';
import AdminDashboard from './components/AdminDashboard';
import { useNavigationGuard } from './App'; // Import du contexte global
import { APP_VERSION } from './version';
import './FacturationPage.css';

const FacturationPage = ({ userContext, initialSection = 'factures' }) => {
  const [activeSection, setActiveSection] = useState(initialSection);
  const [clientCreatedId, setClientCreatedId] = useState(null);
  const [factureCreatedId, setFactureCreatedId] = useState(null);

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

  const handleClientCreated = (clientId) => {
    setClientCreatedId(clientId);
    setActiveSection('clients');
  };

  const handleFactureCreated = (factureId) => {
    setFactureCreatedId(factureId);
    setActiveSection('factures');
  };

  // Fonction protégée pour changer de section
  const handleSectionChange = (newSection) => {
    interceptNavigation(
      () => {
        console.log('🔄 Changement de section:', activeSection, '->', newSection);
        setActiveSection(newSection);
        
        // Reset des IDs quand on change de section
        if (newSection !== 'clients') {
          setClientCreatedId(null);
        }
        if (newSection !== 'factures') {
          setFactureCreatedId(null);
        }
      },
      `menu-${newSection}`
    );
  };

  // Fonction utilitaire pour obtenir le nom lisible d'une section
  const getSectionName = (section) => {
    const sectionNames = {
      'factures': 'Factures',
      'clients': 'Clients',
      'nouvelle': 'Nouvelle facture',
      'nouveau-client': 'Nouveau client',
      'tarifs': 'Tarifs',
      'parametres': 'Paramètres',
      'utilisateurs': 'Utilisateurs',
      'dashboard': 'Dashboard',
      'admin_dashboard': 'Dashboard Admin'
    };
    return sectionNames[section] || section;
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'parametres':
        return canAccessParams ? <ParametresContent /> : <div className="content-placeholder">Accès non autorisé</div>;
      
      case 'nouvelle':
        return <FactureGestion
          section="nouveau"
          onFactureCreated={handleFactureCreated}
        />;
      
      case 'factures':
        return <FactureGestion
          section="liste"
          factureId={factureCreatedId}
          onSectionChange={() => setFactureCreatedId(null)}
        />;
      
      case 'clients':
        return <ClientGestion
          section="liste"
          clientId={clientCreatedId}
          onSectionChange={() => setClientCreatedId(null)}
        />;
      
      case 'nouveau-client':
        return <ClientGestion
          section="nouveau"
          onClientCreated={handleClientCreated}
        />;
      
      case 'tarifs':
        return canAccessParams ? <TarifGestion /> : <div className="content-placeholder">Accès non autorisé</div>;
      
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

  // Détermine quel titre afficher en fonction de la section active
  const getPageTitle = () => {
    switch(activeSection) {
      case 'utilisateurs':
        return 'Gestion des utilisateurs';
      case 'parametres':
        return 'Paramètres';
      case 'tarifs':
        return 'Gestion des tarifs';
      case 'admin_dashboard':
        return 'Tableau de bord d\'administration';
      default:
        return 'Facturation';
    }
  };

  return (
    <div className="facturation-container">
      <div className="facturation-header">
        <h1>{getPageTitle()}</h1>
      </div>
      <div className="facturation-body">
        <div className="facturation-menu">
          <ul>
            <li
              className={activeSection === 'factures' ? 'active' : ''}
              onClick={() => handleSectionChange('factures')}
            >
              <span className="menu-label">Factures</span>
            </li>
            <li
              className={activeSection === 'clients' ? 'active' : ''}
              onClick={() => handleSectionChange('clients')}
            >
              <span className="menu-label">Clients</span>
            </li>
            <li
              className={activeSection === 'dashboard' ? 'active' : ''}
              onClick={() => handleSectionChange('dashboard')}
            >
              <span className="menu-label">Dashboard</span>
            </li>
            
            {/* Séparateur visuel pour les menus privilégiés */}
            {canAccessParams && (
              <>
                {/* Ligne de séparation */}
                <li style={{
                  height: '1px',
                  backgroundColor: '#ddd',
                  margin: '10px 0',
                  pointerEvents: 'none',
                  padding: 0
                }}></li>
                
                {/* Menu Tarifs - Visible pour Admin et Gestionnaire */}
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
                
                {/* Menu Paramètres - Visible pour Admin et Gestionnaire */}
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
                
                {/* Menu Utilisateurs - Visible pour Admin et Gestionnaire */}
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
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default FacturationPage;