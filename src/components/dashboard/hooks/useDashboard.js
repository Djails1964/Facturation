// src/components/dashboard/hooks/useDashboard.js
/**
 * Hook principal pour la gestion des données du dashboard
 * ✅ Normalisation des données API (snake_case → camelCase)
 * ✅ Agrégation et calcul des statistiques
 * ✅ Gestion du cache et des mises à jour
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import FactureService from '../../../services/FactureService';
import { FieldConverter } from '../../../utils/FieldConverter';
import { formatMontant, formatDate } from '../../../utils/formatters';

export const useDashboard = (selectedYear) => {
  const [stats, setStats] = useState(null);
  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const cacheRef = useRef({});
  
  const factureService = useRef(new FactureService()).current;

  /**
   * Normalise les données de factures reçues de l'API
   */
  const normalizeFactures = useCallback((rawFactures) => {
    if (!Array.isArray(rawFactures)) return [];

    return rawFactures.map(facture => {
      // Conversion snake_case → camelCase
      const normalized = FieldConverter.toFrontendFormat(facture, {
        context: 'facture',
        preserveUnknown: true
      });

      // Calcul de l'état d'affichage (logique métier)
      normalized.etatAffichage = calculateEtatAffichage(normalized);

      return normalized;
    });
  }, []);

  /**
   * Calcule l'état d'affichage d'une facture (En retard, Partiellement payée, etc.)
   */
  const calculateEtatAffichage = (facture) => {
    const etat = facture.etat || 'Éditée';
    
    // Si payée, rester à payée
    if (etat === 'Payée') return 'Payée';
    
    // Si annulée, rester à annulée
    if (etat === 'Annulée') return 'Annulée';
    
    // Si c'est envoyée, vérifier le retard
    if (etat === 'Envoyée') {
      const dateEcheance = new Date(facture.dateEcheance);
      const aujourd = new Date();
      return aujourd > dateEcheance ? 'Retard' : 'Envoyée';
    }

    // Si partiellement payée, garder cet état
    if (facture.montantPaye && facture.montantPaye > 0 && facture.montantPaye < facture.montantTotal) {
      return 'Partiellement payée';
    }

    return etat;
  };

  /**
   * Agrège les statistiques depuis les factures
   */
  const aggregateStats = useCallback((facturesData) => {
    const stats = {
      totalFactures: facturesData.length,
      montantTotal: 0,
      montantPaye: 0,
      facturesImpayees: 0,
      statusDistribution: {},
      monthlyData: []
    };

    // Agrégation par état
    facturesData.forEach(facture => {
      const etat = facture.etatAffichage || facture.etat;
      
      stats.montantTotal += facture.montantTotal || 0;
      
      if (etat === 'Payée') {
        stats.montantPaye += facture.montantTotal || 0;
      } else if (etat === 'Partiellement payée') {
        stats.montantPaye += facture.montantPaye || 0;
      }

      if (['Envoyée', 'Retard', 'En attente'].includes(etat)) {
        stats.facturesImpayees++;
      }

      // Distribution des états
      stats.statusDistribution[etat] = (stats.statusDistribution[etat] || 0) + 1;
    });

    // Convertir la distribution en format graphique
    stats.statusDistributionChart = Object.entries(stats.statusDistribution).map(([name, count]) => ({
      name,
      value: count,
      count
    }));

    // Données mensuelles
    stats.monthlyData = generateMonthlySalesData(facturesData, selectedYear);

    return stats;
  }, [selectedYear]);

  /**
   * Génère les données mensuelles pour le graphique
   */
  const generateMonthlySalesData = (facturesData, year) => {
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    const data = [];
    const currentMonth = new Date().getMonth();
    const lastMonth = year === new Date().getFullYear() ? currentMonth : 11;

    for (let i = 0; i <= lastMonth; i++) {
      const monthData = {
        name: months[i],
        facturé: 0,
        payé: 0
      };

      facturesData.forEach(facture => {
        const factureMonth = new Date(facture.dateFacture).getMonth();
        if (factureMonth === i) {
          monthData.facturé += facture.montantTotal || 0;
          
          if (facture.etatAffichage === 'Payée') {
            monthData.payé += facture.montantTotal || 0;
          } else if (facture.etatAffichage === 'Partiellement payée') {
            monthData.payé += facture.montantPaye || 0;
          }
        }
      });

      data.push(monthData);
    }

    return data;
  };

  /**
   * Charge les données du dashboard
   */
  const loadDashboardData = useCallback(async () => {
    // Vérifier le cache
    const cacheKey = `dashboard-${selectedYear}`;
    if (cacheRef.current[cacheKey]) {
      const cached = cacheRef.current[cacheKey];
      setStats(cached.stats);
      setFactures(cached.factures);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('📊 Chargement données dashboard pour', selectedYear);
      
      const facturesRaw = await factureService.chargerFactures(selectedYear);
      const normalized = normalizeFactures(facturesRaw);
      const aggregated = aggregateStats(normalized);

      setFactures(normalized);
      setStats(aggregated);

      // Mettre en cache
      cacheRef.current[cacheKey] = {
        stats: aggregated,
        factures: normalized,
        timestamp: Date.now()
      };

      console.log('✅ Dashboard chargé:', aggregated);
    } catch (err) {
      console.error('❌ Erreur chargement dashboard:', err);
      setError(err.message || 'Erreur lors du chargement du dashboard');
    } finally {
      setLoading(false);
    }
  }, [selectedYear, normalizeFactures, aggregateStats, factureService]);

  /**
   * Rafraîchit les données (vide le cache)
   */
  const refresh = useCallback(() => {
    cacheRef.current = {};
    loadDashboardData();
  }, [loadDashboardData]);

  // Charger au montage et lors du changement d'année
  useEffect(() => {
    loadDashboardData();
  }, [selectedYear, loadDashboardData]);

  return {
    stats,
    factures,
    loading,
    error,
    refresh,
    // Utilitaires
    formatMontant,
    formatDate
  };
};