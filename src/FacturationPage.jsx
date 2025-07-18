import React, { useState, useEffect } from 'react';
import { useGlobalNavigationGuard } from './hooks/useGlobalNavigationGuard';
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

  // ✅ NOUVEAU : Hook de protection globale
  const { interceptNavigation } = useGlobalNavigationGuard();
  
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

  const handleSectionChange = async (newSection) => {
    const navigation = () => {
      setActiveSection(newSection);
      // Réinitialiser les IDs lors du changement de section
      setClientCreatedId(null);
      setFactureCreatedId(null);
    };

    // Vérifier s'il y a des modifications non sauvegardées
    const canNavigate = await interceptNavigation(navigation, `menu-${newSection}`);
    
    if (!canNavigate) {
      console.log(`🚫 Navigation vers ${newSection} bloquée`);
      // La modal sera gérée par le composant qui a des modifications
      return;
    }
  };

  // ✅ MODIFIÉ : Gestionnaires de menu avec protection
  const menuItems = [
    {
      key: 'factures',
      label: 'Factures',
      onClick: () => handleSectionChange('factures')
    },
    {
      key: 'clients', 
      label: 'Clients',
      onClick: () => handleSectionChange('clients')
    },
    {
      key: 'dashboard',
      label: 'Dashboard', 
      onClick: () => handleSectionChange('dashboard')
    }
  ];

  // Menus privilégiés avec protection
  const privilegedMenuItems = canAccessParams ? [
    {
      key: 'tarifs',
      label: 'Tarifs',
      onClick: () => handleSectionChange('tarifs')
    },
    {
      key: 'parametres',
      label: 'Paramètres', 
      onClick: () => handleSectionChange('parametres')
    },
    {
      key: 'utilisateurs',
      label: 'Utilisateurs',
      onClick: () => handleSectionChange('utilisateurs')
    }
  ] : [];

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
            {/* ✅ MODIFIÉ : Utiliser les gestionnaires protégés */}
            {menuItems.map(item => (
              <li
                key={item.key}
                className={activeSection === item.key ? 'active' : ''}
                onClick={item.onClick}
              >
                <span className="menu-label">{item.label}</span>
              </li>
            ))}

            {/* Séparateur et menus privilégiés */}
            {canAccessParams && (
              <>
                <li style={{
                  height: '1px',
                  backgroundColor: '#ddd',
                  margin: '10px 0',
                  pointerEvents: 'none',
                  padding: 0
                }}></li>
                
                {privilegedMenuItems.map(item => (
                  <li
                    key={item.key}
                    className={`menu-privileged ${activeSection === item.key ? 'active' : ''}`}
                    onClick={item.onClick}
                    title={`Gestion ${item.label.toLowerCase()}`}
                  >
                    <span className="menu-label">
                      <span className="menu-icon">
                        {item.key === 'tarifs' && '💰'}
                        {item.key === 'parametres' && '⚙️'}
                        {item.key === 'utilisateurs' && '👥'}
                      </span>
                      <span>{item.label}</span>
                    </span>
                  </li>
                ))}
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