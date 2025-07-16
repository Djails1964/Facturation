import { useState } from 'react';
import { LogOut, Menu, User, BarChart2 } from 'react-feather'; // Supprimer Settings et Users, garder BarChart2
import { Link, useNavigate } from 'react-router-dom';

/**
 * Composant d'en-tête de l'application
 * 
 * @param {Object} props - Propriétés du composant
 * @param {string} props.appName - Nom de l'application
 * @param {string} props.appVersion - Version de l'application
 * @param {Object} props.user - Informations sur l'utilisateur connecté
 * @param {Function} props.onLogout - Fonction de déconnexion
 */
function Header({ appName, appVersion, user, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  
  // Vérifier si l'utilisateur est un admin
  const isAdmin = user && user.role === 'admin';
  
  // Fonction pour basculer l'état du menu mobile
  const toggleMenu = () => {
    setMenuOpen(prev => !prev);
  };

  // Fermer le menu après un clic (mobile)
  const closeMenu = () => {
    setMenuOpen(false);
  };
  
  return (
    <header className="app-header">
      {/* Indicateur de mode développement */}
      {process.env.NODE_ENV === 'development' && (
        <div 
          style={{ 
            backgroundColor: '#ff7700', 
            color: 'white', 
            padding: '5px', 
            textAlign: 'center',
            fontWeight: 'bold',
            fontSize: '14px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}
        >
          MODE DÉVELOPPEMENT - Utiliser uniquement http://localhost:3007
        </div>
      )}
      
      <div className="header-container">
        {/* Logo et nom de l'application */}
        <div className="header-brand">
          <Link to="/" onClick={closeMenu}>
            <h1>{appName}</h1>
            {appVersion && <span className="app-version">v{appVersion}</span>}
          </Link>
        </div>
        
        {/* Bouton de menu mobile */}
        <button className="menu-toggle" onClick={toggleMenu} aria-label="Menu">
          <Menu size={24} />
        </button>
        
        {/* Menu et informations utilisateur */}
        <div className={`header-nav ${menuOpen ? 'menu-open' : ''}`}>
          {/* Informations sur l'utilisateur */}
          <div className="user-info">
            <div className="user-avatar">
              <User size={20} />
            </div>
            <div className="user-details">
              <span className="user-name">{user.nomComplet}</span>
              <span className="user-role">{user.role}</span>
              {process.env.NODE_ENV === 'development' && (
                <span style={{ fontSize: '10px', backgroundColor: '#ff7700', color: 'white', padding: '2px 5px', borderRadius: '3px' }}>
                  DEV
                </span>
              )}
            </div>
          </div>
          
          {/* Actions */}
          <div className="header-actions">
            {/* Tableau de bord admin - visible uniquement pour les administrateurs */}
            {isAdmin && (
              <Link 
                to="/admin/dashboard" 
                onClick={closeMenu} 
                className="header-action-button"
                title="Tableau de bord d'administration"
              >
                <BarChart2 size={20} />
                <span className="action-label">Dashboard</span>
              </Link>
            )}
            
            {/* Bouton de déconnexion */}
            <button 
              className="header-action-button logout-button" 
              onClick={() => {
                closeMenu();
                onLogout();
              }}
              title="Déconnexion"
            >
              <LogOut size={20} />
              <span className="action-label">Déconnexion</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;