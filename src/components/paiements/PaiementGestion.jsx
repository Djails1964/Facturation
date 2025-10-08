import React, { useState, useEffect } from 'react';
import PaiementsListe from './PaiementsListe';
import PaiementForm from './PaiementForm';
import ClientService from '../../services/ClientService';

// Modes du formulaire de paiement
const FORM_MODES = {
    CREATE: 'create',
    EDIT: 'edit', 
    VIEW: 'view'
};

function PaiementGestion({ 
    section = 'liste', 
    idPaiement = null, 
    onPaiementCreated = null, 
    onSectionChange = null,
    initialFilter = {}, 
    onRetour = null 
}) {
    // États pour gérer la navigation entre les différentes vues
    const [activeView, setActiveView] = useState(section);
    const [selectedPaiementId, setSelectedPaiementId] = useState(idPaiement);
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
        if (idPaiement !== null) {
            setSelectedPaiementId(idPaiement);
        }
    }, [idPaiement]);

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
    const handleRetourListe = (idPaiement = null, modified = false, message = '', type = '') => {
        console.log('📥 PaiementGestion.handleRetourListe appelé avec:', { 
            idPaiement, 
            modified, 
            message, 
            type 
        });
        
        if (idPaiement) {
            console.log('🔄 Mise à jour selectedPaiementId:', idPaiement);
            setSelectedPaiementId(idPaiement);
        }
        
        if (message) {
            console.log('🔔 Définition de la notification:', { message, type: type || 'success' });
            setNotification({ message, type: type || 'success' });
        } else {
            console.log('⚠️ Pas de message de notification');
        }
        
        console.log('🔄 Changement de vue vers liste');
        setActiveView('liste');
    };

    // Gestion de la création de paiement
    const handlePaiementCreated = (idPaiement, message = 'Paiement enregistré avec succès') => {
        setSelectedPaiementId(idPaiement);
        setNotification({ message, type: 'success' });
        setActiveView('liste');
        
        // Si un gestionnaire externe a été fourni, l'appeler
        if (onPaiementCreated) {
            onPaiementCreated(idPaiement);
        }
    };

    // Gestion de la modification de paiement
    const handleModifierPaiement = (idPaiement) => {
        setSelectedPaiementId(idPaiement);
        setActiveView('modifier');
    };

    // Gestion de l'affichage de paiement
    const handleAfficherPaiement = (idPaiement) => {
        console.log('🔍 ID reçu du clic:', idPaiement);
        console.log('🔍 Type de l\'ID:', typeof idPaiement);
        console.log('🔍 ID non vide:', !!idPaiement);
        setSelectedPaiementId(idPaiement);
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
                        idPaiement={selectedPaiementId}
                        onRetourListe={handleRetourListe}
                        clients={clients}
                        clientsLoading={clientsLoading}
                        onRechargerClients={chargerClients}
                    />
                );
            case 'afficher':
                console.log('🎯 ID transmis au formulaire:', selectedPaiementId);
                return (
                    <PaiementForm 
                        mode={FORM_MODES.VIEW}
                        idPaiement={selectedPaiementId}
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
            
            {/* Bouton flottant pour ajouter un nouveau paiement (visible uniquement si on est dans la vue liste) */}
            {activeView === 'liste' && section !== 'nouveau-paiement' && (
                <div className="floating-button" onClick={handleNouveauPaiement}>
                    <span>+</span>
                    <div className="floating-tooltip">Nouveau paiement</div>
                </div>
            )}
        </div>
    );
}

export { FORM_MODES };
export default PaiementGestion;