import React, { useState, useEffect } from 'react';
import PaiementsListe from './components/paiements/PaiementsListe';
import PaiementForm from './components/paiements/PaiementForm';
import ClientService from './services/ClientService';

// Modes du formulaire de paiement
const FORM_MODES = {
    CREATE: 'create',
    EDIT: 'edit', 
    VIEW: 'view'
};

function PaiementGestion({ 
    section = 'liste', 
    paiementId = null, 
    onPaiementCreated = null, 
    onSectionChange = null,
    initialFilter = {}, 
    onRetour = null 
}) {
    // États pour gérer la navigation entre les différentes vues
    const [activeView, setActiveView] = useState(section);
    const [selectedPaiementId, setSelectedPaiementId] = useState(paiementId);
    const [notification, setNotification] = useState({ message: '', type: '' });
    
    // États pour la gestion des clients
    const [clients, setClients] = useState([]);
    const [clientsLoading, setClientsLoading] = useState(false);
    const [clientError, setClientError] = useState(null);

    // Services
    const clientService = new ClientService();

    // Effet pour mettre à jour la vue active quand la prop section change
    useEffect(() => {
        setActiveView(section);
    }, [section]);

    // Effet pour mettre à jour l'ID du paiement sélectionné
    useEffect(() => {
        if (paiementId !== null) {
            setSelectedPaiementId(paiementId);
        }
    }, [paiementId]);

    // Effet pour notifier le parent du changement de section
    useEffect(() => {
        if (onSectionChange) {
            onSectionChange(activeView);
        }
    }, [activeView, onSectionChange]);

    // Charger la liste des clients
    const chargerClients = async () => {
        setClientsLoading(true);
        setClientError(null);
        
        try {
            const clientsData = await clientService.chargerClients();
            setClients(clientsData);
        } catch (error) {
            console.error('Erreur lors du chargement des clients:', error);
            setClientError('Une erreur est survenue lors du chargement des clients: ' + error.message);
        } finally {
            setClientsLoading(false);
        }
    };

    // Charger les clients au montage du composant
    useEffect(() => {
        chargerClients();
    }, []);

    // Gestion du retour à la liste
    const handleRetourListe = (paiementId = null, modified = false, message = '', type = '') => {
        if (paiementId) {
            setSelectedPaiementId(paiementId);
        }
        
        if (message) {
            setNotification({ message, type: type || 'success' });
        }
        
        setActiveView('liste');
    };

    // Gestion de la création de paiement
    const handlePaiementCreated = (paiementId, message = 'Paiement enregistré avec succès') => {
        setSelectedPaiementId(paiementId);
        setNotification({ message, type: 'success' });
        setActiveView('liste');
        
        // Si un gestionnaire externe a été fourni, l'appeler
        if (onPaiementCreated) {
            onPaiementCreated(paiementId);
        }
    };

    // Gestion de la modification de paiement
    const handleModifierPaiement = (paiementId) => {
        setSelectedPaiementId(paiementId);
        setActiveView('modifier');
    };

    // Gestion de l'affichage de paiement
    const handleAfficherPaiement = (paiementId) => {
        setSelectedPaiementId(paiementId);
        setActiveView('afficher');
    };

    // Passer à la vue de création
    const handleNouveauPaiement = () => {
        setActiveView('nouveau');
    };

    // Gestion de la suppression de paiement
    const handlePaiementSupprime = (message = 'Paiement supprimé avec succès') => {
        setNotification({ message, type: 'success' });
    };

    // Rendu conditionnel selon la vue active
    const renderContent = () => {
        switch (activeView) {
            case 'nouveau':
                return (
                    <PaiementForm 
                        mode={FORM_MODES.CREATE}
                        onRetourListe={handleRetourListe} 
                        onPaiementCreated={handlePaiementCreated}
                        clients={clients}
                        clientsLoading={clientsLoading}
                        onRechargerClients={chargerClients}
                    />
                );
            case 'modifier':
                return (
                    <PaiementForm 
                        mode={FORM_MODES.EDIT}
                        paiementId={selectedPaiementId}
                        onRetourListe={handleRetourListe}
                        clients={clients}
                        clientsLoading={clientsLoading}
                        onRechargerClients={chargerClients}
                    />
                );
            case 'afficher':
                return (
                    <PaiementForm 
                        mode={FORM_MODES.VIEW}
                        paiementId={selectedPaiementId}
                        onRetourListe={handleRetourListe}
                        clients={clients}
                        clientsLoading={clientsLoading}
                        onRechargerClients={chargerClients}
                    />
                );
            case 'liste':
            default:
                return (
                    <>
                        {onRetour && (
                            <div className="retour-button-container">
                                <button className="btn-retour" onClick={onRetour}>
                                    ← Retour
                                </button>
                            </div>
                        )}
                        <PaiementsListe 
                            nouveauPaiementId={selectedPaiementId}
                            onModifierPaiement={handleModifierPaiement}
                            onAfficherPaiement={handleAfficherPaiement}
                            onNouveauPaiement={handleNouveauPaiement}
                            notification={notification}
                            onClearNotification={() => setNotification({ message: '', type: '' })}
                            onPaiementSupprime={handlePaiementSupprime}
                            onSetNotification={(message, type) => setNotification({ message, type })}
                            initialFilter={initialFilter}
                        />
                    </>
                );
        }
    };

    return (
        <div className="paiement-gestion-container">
            {renderContent()}
        </div>
    );
}

export { FORM_MODES };
export default PaiementGestion;