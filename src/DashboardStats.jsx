// ================== DashboardStats.jsx ==================
import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell 
} from 'recharts';
import FactureService from './services/FactureService';
// ✅ AJOUT: Import des formatters centralisés
import { formatMontant, formatDate, getBadgeClasses, isEtatEnCours } from './utils/formatters';
import './DashboardStats.css';

const DashboardStats = ({ 
  onViewFacture, 
  notification, 
  onClearNotification, 
  onFilterByStatus = () => {} 
}) => {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [facturesData, setFacturesData] = useState([]);
  
  // Initialisation du service Facture
  const factureService = new FactureService();
  
  // Générer les options d'années (année courante - 5 ans)
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let i = 0; i <= 5; i++) {
    yearOptions.push(currentYear - i);
  }

  // Couleurs pour les graphiques
  const COLORS = ['#800000', '#a06060', '#c08080', '#e0a0a0', '#f0c0c0'];
  const STATUS_COLORS = {
    'Payée': '#28a745',
    'Partiellement payée': '#fd7e14',
    'En attente': '#ffc107',
    'Retard': '#dc3545',
    'Éditée': '#17a2b8',
    'Envoyée': '#0056b3',
    'Annulée': '#6c757d'
  };

  // ✅ SIMPLIFIÉ: Fonction pour calculer la distribution des états depuis les données du service
  const calculateStatusDistributionFromFactures = (factures) => {
    const statusCounts = {};
    
    // Compter les occurrences de chaque état d'affichage
    factures.forEach(facture => {
      const etat = facture.etatAffichage || facture.etat;
      statusCounts[etat] = (statusCounts[etat] || 0) + 1;
    });

    // Convertir en format pour le graphique
    const totalFactures = factures.length;
    return Object.entries(statusCounts).map(([etat, count]) => ({
      name: etat,
      value: totalFactures > 0 ? Math.round((count / totalFactures) * 100) : 0,
      count: count
    }));
  };

  // Effet pour gérer les notifications
  useEffect(() => {
    if (notification && notification.message) {
      const timer = setTimeout(() => {
        if (onClearNotification) {
          onClearNotification();
        }
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification, onClearNotification]);

  // Effet pour charger les statistiques et les factures lorsque l'année change
  useEffect(() => {
    loadStatsAndFactures();
  }, [selectedYear]);

  // ✅ NOUVEAU: Fonction pour charger les stats et factures de manière coordonnée
  const loadStatsAndFactures = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Charger les factures d'abord pour avoir les états calculés
      const facturesData = await factureService.chargerFactures(selectedYear);
      setFacturesData(facturesData);

      // Ensuite charger les stats
      const result = await factureService.getStatistiques(selectedYear);
      console.log("Données reçues de l'API:", result);

      if (result.success) {
        const statsData = result.statistiques || {};
        
        // Calculer la distribution réelle des états depuis les factures chargées
        const realStatusDistribution = calculateStatusDistributionFromFactures(facturesData);
        
        const processedStats = {
          ...statsData,
          montantRestant: parseFloat(statsData.montantTotal || 0) - parseFloat(statsData.montantPaye || 0),
          monthlySales: statsData.monthlySales || [],
          // ✅ CORRECTION: Utiliser la distribution calculée depuis les factures réelles
          statusDistribution: realStatusDistribution.length > 0 ? realStatusDistribution : (statsData.statusDistribution || [])
        };
        
        console.log('Distribution des états calculée:', realStatusDistribution);
        setStats(processedStats);
      } else {
        throw new Error(result.message || 'Erreur lors du chargement des statistiques');
      }
    } catch (error) {
      console.error('Erreur:', error);
      setError(`Erreur lors du chargement des statistiques: ${error.message}`);
      
      // En cas d'erreur, utiliser les données fictives comme fallback
      const mockStats = {
        totalFactures: 125,
        montantTotal: 45820,
        montantPaye: 32450,
        facturesImpayees: 43,
        montantRestant: 13370,
        monthlySales: generateMonthlySalesData(selectedYear),
        statusDistribution: generateStatusDistribution()
      };
      
      setStats(mockStats);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ CONSERVÉ: Fonction pour charger les statistiques (utilisée si besoin séparé)
  const loadStats = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await factureService.getStatistiques(selectedYear);
      console.log("Données reçues de l'API:", result);

      if (result.success) {
        const statsData = result.statistiques || {};
        
        const processedStats = {
          ...statsData,
          montantRestant: parseFloat(statsData.montantTotal || 0) - parseFloat(statsData.montantPaye || 0),
          monthlySales: statsData.monthlySales || [],
          statusDistribution: statsData.statusDistribution || []
        };
        
        console.log('Données réelles traitées:', processedStats);
        setStats(processedStats);
      } else {
        throw new Error(result.message || 'Erreur lors du chargement des statistiques');
      }
    } catch (error) {
      console.error('Erreur:', error);
      setError(`Erreur lors du chargement des statistiques: ${error.message}`);
      
      const mockStats = {
        totalFactures: 125,
        montantTotal: 45820,
        montantPaye: 32450,
        facturesImpayees: 43,
        montantRestant: 13370,
        monthlySales: generateMonthlySalesData(selectedYear),
        statusDistribution: generateStatusDistribution()
      };
      
      setStats(mockStats);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ SIMPLIFIÉ: Fonction pour charger les factures (utilisée si besoin séparé)
  const loadFactures = async () => {
    try {
      const facturesData = await factureService.chargerFactures(selectedYear);
      setFacturesData(facturesData);
      
      // Si les stats sont déjà chargées, mettre à jour la distribution
      if (stats && facturesData.length > 0) {
        const newStatusDistribution = calculateStatusDistributionFromFactures(facturesData);
        console.log('Mise à jour distribution depuis loadFactures:', newStatusDistribution);
        setStats(prevStats => ({
          ...prevStats,
          statusDistribution: newStatusDistribution
        }));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des factures:', error);
      // En mode développement, générer des données fictives
      const mockFactures = [];
      for (let i = 1; i <= 10; i++) {
        const facture = {
          id: i,
          numeroFacture: `${selectedYear}.${i.toString().padStart(3, '0')}`,
          dateFacture: `${selectedYear}-${Math.ceil(i/2)}-${i*3}`,
          montantTotal: 1000 + i * 500,
          etat: ['Payée', 'En attente', 'Éditée', 'Envoyée'][i % 4],
          etatAffichage: ['Payée', 'En attente', 'Éditée', 'Retard'][i % 4], // Mock avec retard
          client: {
            prenom: 'Prénom',
            nom: 'Nom'
          }
        };
        mockFactures.push(facture);
      }
      setFacturesData(mockFactures);
    }
  };

  // Fonction pour générer des données mensuelles fictives
  const generateMonthlySalesData = (year) => {
    const data = [];
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    
    // Limiter au mois actuel si l'année est l'année en cours
    const currentMonth = new Date().getMonth();
    const lastMonth = year === currentYear ? currentMonth : 11;
    
    for (let i = 0; i <= lastMonth; i++) {
      // Montant de facturation mensuel (fictif)
      const amount = Math.floor(3000 + Math.random() * 5000);
      const paymentRatio = 0.6 + Math.random() * 0.4; // Entre 60% et 100%
      
      data.push({
        name: months[i],
        facturé: amount,
        payé: Math.floor(amount * paymentRatio)
      });
    }
    
    return data;
  };

  // Fonction pour générer une distribution fictive des états des factures
  const generateStatusDistribution = () => {
    return [
      { name: 'Payée', value: 60, count: 75 },
      { name: 'En attente', value: 18, count: 23 },
      { name: 'Retard', value: 7, count: 9 },
      { name: 'Éditée', value: 5, count: 6 },
      { name: 'Envoyée', value: 8, count: 10 },
      { name: 'Annulée', value: 2, count: 2 }
    ];
  };

  // ✅ MODIFIÉ: Formateur personnalisé pour le tooltip des graphiques utilisant le formatter centralisé
  const customTooltipFormatter = (value, name) => {
    return [`${formatMontant(value)} CHF`, name];
  };

  if (isLoading) {
    return <div className="dashboard-loading">Chargement des statistiques...</div>;
  }

  if (error) {
    return <div className="dashboard-error">{error}</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>Dashboard</h2>
        <div className="dashboard-controls">
          <label htmlFor="yearSelect">Année: </label>
          <select 
            id="yearSelect" 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          >
            {yearOptions.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Affichage des notifications */}
      {notification && notification.message && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
          <button onClick={onClearNotification} className="notification-close">×</button>
        </div>
      )}

      {/* Cartes récapitulatives */}
      <div className="dashboard-cards">
        <div className="stat-card">
          <div className="stat-value">{stats.totalFactures}</div>
          <div className="stat-title">Total factures</div>
        </div>
        
        <div className="stat-card">
          {/* ✅ MODIFIÉ: Utilisation du formatter centralisé */}
          <div className="stat-value">{formatMontant(stats.montantTotal)} CHF</div>
          <div className="stat-title">Facturé (Envoyée + Payée)</div>
        </div>
        
        <div className="stat-card">
          {/* ✅ MODIFIÉ: Utilisation du formatter centralisé */}
          <div className="stat-value">{formatMontant(stats.montantPaye)} CHF</div>
          <div className="stat-title">Montant encaissé</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">{stats.facturesImpayees}</div>
          <div className="stat-title">Factures envoyées (non payées)</div>
        </div>
      </div>

      {/* Tableau des dernières factures */}
      <div className="recent-invoices chart-container">
        <h3>Dernières factures</h3>
        <div className="invoices-table-container">
          <table className="invoices-table">
            <thead>
              <tr>
                <th>Numéro</th>
                <th>Date</th>
                <th>Montant</th>
                <th>État</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {facturesData.slice(0, 5).map(facture => (
                <tr key={facture.id}>
                  <td>{facture.numeroFacture}</td>
                  {/* ✅ MODIFIÉ: Utilisation du formatter centralisé */}
                  <td>{formatDate(facture.dateFacture)}</td>
                  {/* ✅ MODIFIÉ: Utilisation du formatter centralisé */}
                  <td className="montant-cell">{formatMontant(facture.montantTotal)} CHF</td>
                  <td>
                    {/* ✅ MODIFIÉ: Utilisation du helper de badges avec l'état calculé */}
                    <span className={getBadgeClasses(facture.etatAffichage || facture.etat)}>
                      {facture.etatAffichage || facture.etat || 'En attente'}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="btn-view-facture"
                      onClick={() => onViewFacture && onViewFacture(facture.id)}
                    >
                      Voir
                    </button>
                  </td>
                </tr>
              ))}
              {facturesData.length === 0 && (
                <tr>
                  <td colSpan="5" className="no-data">Aucune facture pour cette année</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="dashboard-charts">
        {/* Graphique d'évolution mensuelle */}
        <div className="chart-container">
          <h3>Évolution mensuelle des factures</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={stats.monthlySales}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                tickFormatter={(value) => value.substring(0, 3)} 
              />
              <YAxis />
              <Tooltip formatter={customTooltipFormatter} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="facturé" 
                stroke="#800000" 
                strokeWidth={2} 
                activeDot={{ r: 8 }}
              />
              <Line 
                type="monotone" 
                dataKey="payé" 
                stroke="#28a745" 
                strokeWidth={2} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-row">
          {/* Graphique de distribution des états */}
          <div className="chart-container half-width">
            <h3>Distribution des états</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
              <Pie
                data={stats.statusDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                onClick={(data) => onFilterByStatus(data.name)}
                cursor="pointer"
              >
                  {stats.statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, ""]} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Graphique comparatif facturé vs payé */}
          <div className="chart-container half-width">
            <h3>Facturé vs Encaissé</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={[
                  { 
                    name: 'Montants', 
                    'Facturé (Envoyée + Payée)': stats.montantTotal, 
                    'Encaissé (Payée)': stats.montantPaye 
                  }
                ]}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={customTooltipFormatter} />
                <Legend />
                <Bar dataKey="Facturé (Envoyée + Payée)" fill="#800000" />
                <Bar dataKey="Encaissé (Payée)" fill="#28a745" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;