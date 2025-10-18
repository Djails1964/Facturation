// src/components/dashboard/DashboardWrapper.jsx
/**
 * Composant wrapper pour intégrer DashboardStats avec FactureGestion
 * ✅ CORRIGÉ - Tracking de la source de navigation
 * Permet de revenir au dashboard quand on y vient du dashboard
 */

import React, { useState } from 'react';
import DashboardStats from './DashboardStats';
import FactureGestion from '../factures/FactureGestion';

/**
 * Composant wrapper pour l'intégration Dashboard + Factures
 */
const DashboardWrapper = () => {
    const [activeView, setActiveView] = useState('dashboard');
    const [selectedFactureId, setSelectedFactureId] = useState(null);
    const [navigationSource, setNavigationSource] = useState('dashboard'); // ✅ Track la source
    const [notification, setNotification] = useState({ message: '', type: '' });

    /**
     * Gère la navigation vers les détails d'une facture
     * @param {number} factureId - ID de la facture à afficher
     */
    const handleViewFacture = (factureId) => {
        console.log('📄 Navigation vers facture:', factureId, '- depuis dashboard');
        setSelectedFactureId(factureId);
        setNavigationSource('dashboard'); // ✅ Mémoriser qu'on vient du dashboard
        setActiveView('afficher');
    };

    /**
     * Gère le retour au dashboard
     * @param {number} factureId - ID de la facture (optionnel)
     * @param {boolean} modified - Si la facture a été modifiée
     * @param {string} message - Message de notification
     * @param {string} type - Type de notification (success, error)
     */
    const handleRetourDashboard = (factureId = null, modified = false, message = '', type = '') => {
        console.log('🏠 Retour au dashboard');
        if (message) {
            setNotification({ message, type: type || 'success' });
            
            // Afficher la notification pendant 5 secondes
            setTimeout(() => {
                setNotification({ message: '', type: '' });
            }, 5000);
        }
        setActiveView('dashboard');
        setSelectedFactureId(null);
        setNavigationSource('dashboard');
    };

    /**
     * Gère le filtrage par statut
     * @param {string} status - Statut à filtrer
     */
    const handleFilterByStatus = (status) => {
        console.log(`🔍 Filtrer par statut: ${status}`);
        // Implémenter la logique de filtrage
        // Exemple: rediriger vers liste avec filtre appliqué
    };

    /**
     * Efface la notification
     */
    const handleClearNotification = () => {
        setNotification({ message: '', type: '' });
    };

    /**
     * Rendu conditionnel selon la vue active
     */
    const renderContent = () => {
        // Vue Dashboard
        if (activeView === 'dashboard') {
            return (
                <DashboardStats
                    onViewFacture={handleViewFacture}
                    onFilterByStatus={handleFilterByStatus}
                    notification={notification}
                    onClearNotification={handleClearNotification}
                />
            );
        }

        // Vue Afficher Facture (détail)
        if (activeView === 'afficher') {
            console.log('🔍 Rendu FactureGestion pour VIEW - selectedFactureId:', selectedFactureId);
            return (
                <FactureGestion
                    section="liste"
                    idFacture={selectedFactureId}
                    onRetour={handleRetourDashboard}
                    navigationSource={navigationSource} // ✅ Passer la source
                />
            );
        }

        // Par défaut, revenir au dashboard
        return (
            <DashboardStats
                onViewFacture={handleViewFacture}
                onFilterByStatus={handleFilterByStatus}
                notification={notification}
                onClearNotification={handleClearNotification}
            />
        );
    };

    return (
        <div className="dashboard-wrapper-container">
            {renderContent()}
        </div>
    );
};

export default DashboardWrapper;