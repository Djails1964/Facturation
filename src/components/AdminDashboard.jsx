import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Settings, 
  Mail, 
  FileText, 
  Database, 
  RefreshCw, 
  AlertTriangle, 
  Server 
} from 'react-feather';
import authService from '../services/authService';
import { backendUrl } from '../utils/urlHelper'; // CORRECTION: Import du helper URL
import '../styles/AdminDashboard.css';
import SectionTitle from './shared/SectionTitle';

const AdminDashboard = ({ userContext }) => {
  const [stats, setStats] = useState({
    utilisateurs: { total: 0, actifs: 0, inactifs: 0 },
    clients: 0,
    factures: 0
  });
  
  const [tentatives, setTentatives] = useState([]);
  const [derniersUtilisateurs, setDerniersUtilisateurs] = useState([]);
  const [systemInfo, setSystemInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Déterminer si nous sommes en mode développement
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // CORRECTION: Utiliser authService.getDashboardData() qui utilise api.js centralisé
        console.log('📊 Récupération données dashboard via authService...');
        const response = await authService.getDashboardData();
        
        console.log('📊 Réponse getDashboardData:', response);
        
        if (response.success && response.data) {
          // Adapter la structure des données à celle retournée par auth-api.php
          const data = response.data;
          
          setStats({
            utilisateurs: data.utilisateurs || { total: 0, actifs: 0, inactifs: 0 },
            clients: data.clients || 0,
            factures: data.factures || 0
          });
          
          setDerniersUtilisateurs(data.derniers_utilisateurs || []);
          setTentatives(data.tentatives || []);
          setSystemInfo(data.systemInfo || {});
        } else {
          throw new Error(response.message || 'Erreur lors du chargement des données');
        }
      } catch (err) {
        console.error('❌ Erreur dashboard:', err);
        setError('Erreur de connexion au serveur: ' + (err.message || 'Erreur inconnue'));
      } finally {
        setLoading(false);
      }
    };
    
    // Vérifier les droits d'accès
    if (userContext?.user?.role !== 'admin') {
      setError('Accès refusé - Droits administrateur requis');
      setLoading(false);
      return;
    }
    
    fetchDashboardData();
  }, [userContext]);
  
  if (loading) {
    return (
      <div className="loading-spinner">
        <RefreshCw size={24} className="spin" />
        <span>Chargement du tableau de bord...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="error-message">
        <AlertTriangle size={24} />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {isDevelopment && (
        <div className="dev-banner">
          <AlertTriangle size={16} />
          <span><strong>Mode développement</strong> - Certaines fonctionnalités ne sont disponibles qu'en développement</span>
        </div>
      )}
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <Users size={24} />
          </div>
          <div className="number">{stats.utilisateurs.total}</div>
          <div className="label">Utilisateurs total</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <Users size={24} color="#28a745" />
          </div>
          <div className="number">{stats.utilisateurs.actifs}</div>
          <div className="label">Utilisateurs actifs</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <Users size={24} color="#dc3545" />
          </div>
          <div className="number">{stats.utilisateurs.inactifs}</div>
          <div className="label">Utilisateurs inactifs</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <Server size={24} />
          </div>
          <div className="number">{systemInfo.phpVersion || 'N/A'}</div>
          <div className="label">Version PHP</div>
        </div>
      </div>
      
      {/* Section des derniers utilisateurs */}
      {derniersUtilisateurs.length > 0 && (
        <>
          <SectionTitle as="h3" compact>Derniers utilisateurs créés</SectionTitle>
          <div className="recent-users">
            <div className="users-grid">
              {derniersUtilisateurs.map(user => (
                <div key={user.id_utilisateur} className="user-card">
                  <div className="user-info">
                    <div className="user-name">
                      {user.prenom} {user.nom}
                    </div>
                    <div className="user-details">
                      @{user.username} - {user.role}
                    </div>
                  </div>
                  <div className={`user-status ${user.compte_actif === 1 ? 'active' : 'inactive'}`}>
                    {user.compte_actif === 1 ? 'Actif' : 'Inactif'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
      
      <SectionTitle as="h3" compact>Fonctions d'administration</SectionTitle>
      
      <div className="admin-links">
        {/* En mode développement, afficher des liens supplémentaires */}
        {isDevelopment && (
          <a 
            href={backendUrl('admin/dev_emails.php')}
            target="_blank" 
            rel="noopener noreferrer"
            className="admin-link"
            onClick={(e) => {
              // Debug pour voir l'URL générée
              console.log('🔗 Lien Emails dev:', backendUrl('admin/dev_emails.php'));
            }}
          >
            <div className="icon-container">
              <Mail size={20} />
            </div>
            <span className="text">Emails de développement</span>
          </a>
        )}
        
        <Link to="/admin/logs" className="admin-link">
          <div className="icon-container">
            <FileText size={20} />
          </div>
          <span className="text">Journaux d'activité</span>
        </Link>
        
        <a 
          href={backendUrl('admin/backup.php')}
          target="_blank" 
          rel="noopener noreferrer"
          className="admin-link"
          onClick={(e) => {
            // Debug pour voir l'URL générée
            console.log('🔗 Lien Sauvegarde:', backendUrl('admin/backup.php'));
          }}
        >
          <div className="icon-container">
            <Database size={20} />
          </div>
          <span className="text">Sauvegarde</span>
        </a>
        
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            window.location.reload();
          }}
          className="admin-link"
        >
          <div className="icon-container">
            <RefreshCw size={20} />
          </div>
          <span className="text">Actualiser</span>
        </a>
      </div>
      
      <SectionTitle as="h3" compact>Activité récente</SectionTitle>
      
      <div className="recent-activity">
        <table className="activity-table">
          <thead>
            <tr>
              <th>Utilisateur</th>
              <th>Adresse IP</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {tentatives.length > 0 ? (
              tentatives.map((tentative, index) => (
                <tr key={index}>
                  <td>{tentative.username}</td>
                  <td>{tentative.ip_address}</td>
                  <td>
                    {tentative.reussite === 1 ? (
                      <span className="badge badge-success">Réussite</span>
                    ) : (
                      <span className="badge badge-danger">Échec</span>
                    )}
                  </td>
                  <td>{tentative.date_tentative}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4">Aucune activité récente</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <SectionTitle as="h3" compact>Informations système</SectionTitle>
      
      <div className="system-info">
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Version PHP :</span>
            {systemInfo.phpVersion || 'Inconnu'}
          </div>
          <div className="info-item">
            <span className="info-label">MySQL Version :</span>
            {systemInfo.dbVersion || 'Inconnu'}
          </div>
          <div className="info-item">
            <span className="info-label">Mode d'application :</span>
            {isDevelopment ? 'Développement' : 'Production'}
          </div>
          <div className="info-item">
            <span className="info-label">Version de l'application :</span>
            {window.APP_CONFIG?.appVersion || userContext?.appConfig?.appVersion || 'Inconnue'}
          </div>
          <div className="info-item">
            <span className="info-label">Serveur :</span>
            {systemInfo.serverSoftware || 'Inconnu'}
          </div>
          <div className="info-item">
            <span className="info-label">Durée de session :</span>
            {systemInfo.sessionLifetime || userContext?.appConfig?.sessionTimeout || '1800'} secondes
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;