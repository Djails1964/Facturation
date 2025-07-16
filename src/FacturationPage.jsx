import React, { useState, useEffect } from 'react';
// Remplacer l'import de ParametresForm par ParametresContent
import ParametresContent from './admin/ParametresContent';
import ClientGestion from './ClientGestion';
import FactureGestion from './FactureGestion';
import TarifGestion from './TarifGestion';
import DashboardWrapper from './DashboardWrapper';
import GestionUtilisateurs from './admin/GestionUtilisateurs';
import AdminDashboard from './components/AdminDashboard'; // Importer le composant AdminDashboard
import { APP_VERSION } from './version';
import './FacturationPage.css';

const FacturationPage = ({ userContext, initialSection = 'factures' }) => {
  const [activeSection, setActiveSection] = useState(initialSection);
  
  const [clientCreatedId, setClientCreatedId] = useState(null);
  const [factureCreatedId, setFactureCreatedId] = useState(null);
  
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

  const renderContent = () => {
    switch (activeSection) {
      case 'parametres':
        // Accès pour admin et gestionnaire
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
        // Accès pour admin et gestionnaire
        return canAccessParams ? <TarifGestion /> : <div className="content-placeholder">Accès non autorisé</div>;
      case 'dashboard':
        return <DashboardWrapper />;
      // Ajouter un cas pour le tableau de bord d'administration
      case 'admin_dashboard':
        return isAdmin ? <AdminDashboard userContext={userContext} /> : <div className="content-placeholder">Accès non autorisé</div>;
      case 'utilisateurs':
        // Accès pour admin et gestionnaire
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
              onClick={() => setActiveSection('factures')}
            >
              <span className="menu-label">Factures</span>
            </li>
            <li 
              className={activeSection === 'clients' ? 'active' : ''}
              onClick={() => setActiveSection('clients')}
            >
              <span className="menu-label">Clients</span>
            </li>
            <li 
              className={activeSection === 'dashboard' ? 'active' : ''}
              onClick={() => setActiveSection('dashboard')}
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
                  onClick={() => setActiveSection('tarifs')}
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
                  onClick={() => setActiveSection('parametres')}
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
                  onClick={() => setActiveSection('utilisateurs')}
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