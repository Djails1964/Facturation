// src/components/dashboard/sections/DashboardCharts.jsx
/**
 * Composant affichant les graphiques du dashboard
 * ✅ Utilise recharts pour visualisations
 * ✅ Responsive et modulaire
 */

import React, { useMemo } from 'react';
import {
  BarChart, Bar, PieChart, Pie, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { formatMontant } from '../../../utils/formatters';
import '../../../styles/components/dashboard/DashboardCharts.css';

/**
 * Tooltip personnalisé pour les graphiques
 */
function CustomTooltip({ active, payload, label, formatter }) {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p className="label">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }}>
            {`${entry.name}: ${formatter(entry.value)}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

/**
 * Graphique d'évolution mensuelle
 */
export function MonthlySalesChart({ data, loading }) {
  if (loading || !data || data.length === 0) {
    return (
      <div className="chart-container">
        <h3>Évolution mensuelle des factures</h3>
        <div className="chart-placeholder">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="chart-container">
      <h3>Évolution mensuelle des factures</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name" 
            tickFormatter={(value) => value.substring(0, 3)}
          />
          <YAxis />
          <Tooltip 
            formatter={(value) => formatMontant(value)}
            contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
          />
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
  );
}

/**
 * Graphique de distribution des états
 */
export function StatusDistributionChart({ data, loading }) {
  if (loading || !data || data.length === 0) {
    return (
      <div className="chart-container">
        <h3>Distribution des états de factures</h3>
        <div className="chart-placeholder">Aucune donnée</div>
      </div>
    );
  }

  const COLORS = ['#800000', '#a06060', '#c08080', '#e0a0a0', '#f0c0c0', '#d4edda', '#dc3545'];

  return (
    <div className="chart-container half-width">
      <h3>Distribution des états</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value }) => `${name}: ${value}`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value) => `${value} factures`}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Graphique de taux de paiement
 */
export function PaymentRateChart({ montantPaye, montantTotal, loading }) {
  if (loading) {
    return (
      <div className="chart-container">
        <h3>Taux de paiement</h3>
        <div className="chart-placeholder">Chargement...</div>
      </div>
    );
  }

  const paymentRate = montantTotal > 0 
    ? Math.round((montantPaye / montantTotal) * 100) 
    : 0;
  
  const data = [
    { name: 'Payé', value: paymentRate },
    { name: 'Impayé', value: 100 - paymentRate }
  ];

  const COLORS = ['#28a745', '#dc3545'];

  return (
    <div className="chart-container half-width">
      <h3>Taux de paiement: {paymentRate}%</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
            startAngle={90}
            endAngle={-270}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `${value}%`} />
        </PieChart>
      </ResponsiveContainer>
      <div className="payment-rate-details">
        <div className="detail-item">
          <span className="detail-label">Payé:</span>
          <span className="detail-value">{formatMontant(montantPaye)} CHF</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Impayé:</span>
          <span className="detail-value">{formatMontant(montantTotal - montantPaye)} CHF</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Composant principal contenant tous les graphiques
 */
export default function DashboardCharts({ stats, loading }) {
  if (!stats) {
    return <div className="dashboard-charts empty">Pas de données pour les graphiques</div>;
  }

  return (
    <div className="dashboard-charts">
      <MonthlySalesChart data={stats.monthlyData} loading={loading} />

      <div className="chart-row">
        <StatusDistributionChart 
          data={stats.statusDistributionChart} 
          loading={loading}
        />
        <PaymentRateChart
          montantPaye={stats.montantPaye}
          montantTotal={stats.montantTotal}
          loading={loading}
        />
      </div>
    </div>
  );
}