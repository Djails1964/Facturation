import React, { useState } from 'react';
import DashboardStats from './DashboardStats';
import FactureGestion from './components/factures/FactureGestion';

/**
 * Composant wrapper pour intégrer DashboardStats avec FactureGestion
 * Permet de naviguer entre le dashboard et les factures sélectionnées
 */
const DashboardWrapper = () => {
    const [activeView, setActiveView] = useState('dashboard');
    const [selectedFactureId, setSelectedFactureId] = useState(null);
    const [notification, setNotification] = useState({ message: '', type: '' });

    // Fonction pour gérer la navigation vers les détails d'une facture
    const handleViewFacture = (factureId) => {
        setSelectedFactureId(factureId);
        setActiveView('afficher');
    };

    // Fonction pour gérer le retour au dashboard
    const handleRetourDashboard = (factureId = null, modified = false, message = '', type = '') => {
        if (message) {
            setNotification({ message, type: type || 'success' });
        }
        setActiveView('dashboard');
    };

    const handleFilterByStatus = (status) => {
        // ✅ MODIFIÉ: Amélioration de la logique de filtrage
        console.log(`Filtrer par statut : ${status}`);
        // Ici vous pourriez implémenter une navigation vers la liste des factures
        // avec un filtre appliqué sur l'état sélectionné
        // Exemple : setActiveView('liste') avec un paramètre de filtre
    };

    // Rendu conditionnel selon la vue active
    const renderContent = () => {
        switch (activeView) {
            case 'afficher':
                return (
                    <FactureGestion 
                        section="afficher" 
                        factureId={selectedFactureId}
                        onSectionChange={(section) => {
                            if (section === 'liste') {
                                // Intercepter le retour à la liste pour revenir au dashboard à la place
                                handleRetourDashboard();
                            }
                        }}
                    />
                );
            case 'dashboard':
            default:
                return (
                    <DashboardStats
                        onFilterByStatus={handleFilterByStatus}
                        onViewFacture={handleViewFacture}
                        notification={notification}
                        onClearNotification={() => setNotification({ message: '', type: '' })}
                    />
                );
        }
    };

    return (
        <div className="dashboard-wrapper-container">
            {renderContent()}
        </div>
    );
};

export default DashboardWrapper;