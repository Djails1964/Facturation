import React, { useState, useEffect } from 'react';
import FacturesListe from './FacturesListe';
import FactureForm from './FactureForm'; // ✅ Import simple du composant
import { FORM_MODES } from '../../constants/factureConstants'; // ✅ Import depuis les constantes
import ClientService from '../../services/ClientService';

function FactureGestion({ 
    section = 'liste', 
    idFacture = null, 
    onFactureCreated = null, 
    onSectionChange = null,
    initialFilter = {}, 
    onRetour = null,
    navigationSource = 'liste'  // ✅ NOUVEAU - Track d'où on vient
}) {
    // États pour gérer la navigation entre les différentes vues
    const [activeView, setActiveView] = useState(section);
    const [selectedFactureId, setSelectedFactureId] = useState(idFacture);
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

    // Effet pour mettre à jour l'ID de la facture sélectionnée
    useEffect(() => {
        if (idFacture !== null && idFacture !== undefined) {
            console.log('📌 FactureGestion - idFacture reçue de parent:', idFacture);
            setSelectedFactureId(idFacture);
            // Basculer vers le mode afficher quand on reçoit un ID de la prop
            // Cela se déclenche quand le parent (DashboardWrapper) passe un ID
            setActiveView('afficher');
        }
}, [idFacture]);

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
    const handleRetourListe = (idFacture = null, modified = false, message = '', type = '') => {
        if (idFacture) {
            setSelectedFactureId(idFacture);
        }
        
        if (message) {
            setNotification({ message, type: type || 'success' });
        }
        
        // ✅ Si on vient du dashboard, appeler onRetour pour revenir au dashboard
        if (navigationSource === 'dashboard' && onRetour) {
            console.log('📍 Retour au dashboard');
            onRetour(idFacture, modified, message, type);
        } else {
            // Sinon retourner à la liste
            console.log('📍 Retour à la liste des factures');
            setActiveView('liste');
        }
    };

    // Gestion de la création de facture
    const handleFactureCreated = (idFacture, message = 'Facture créée avec succès') => {
        setSelectedFactureId(idFacture);
        setNotification({ message, type: 'success' });
        setActiveView('liste');
        
        // Si un gestionnaire externe a été fourni, l'appeler
        if (onFactureCreated) {
            onFactureCreated(idFacture);
        }
    };

    // Gestion de la modification de facture
    const handleModifierFacture = (idFacture) => {
        setSelectedFactureId(idFacture);
        setActiveView('modifier');
    };

    // Gestion de l'affichage de facture
        const handleAfficherFacture = (idFacture) => {
        console.log('🔍 FactureGestion.handleAfficherFacture - ID reçu:', idFacture);
        console.log('🔍 FactureGestion.handleAfficherFacture - Type:', typeof idFacture);
        setSelectedFactureId(idFacture);
        console.log('🔍 FactureGestion - selectedFactureId défini à:', idFacture);
        setActiveView('afficher');
        console.log('🔍 FactureGestion - activeView défini à: afficher');
    };

    // Passer à la vue de création
    const handleNouvelleFacture = () => {
        setActiveView('nouveau');
    };

    // Gestion de la suppression de facture
    const handleFactureSupprimee = (message = 'Facture supprimée avec succès') => {
        setNotification({ message, type: 'success' });
    };

    // Rendu conditionnel selon la vue active
    const renderContent = () => {
        switch (activeView) {
            case 'nouveau':
                return (
                    <FactureForm 
                        mode={FORM_MODES.CREATE}
                        onRetourListe={handleRetourListe} 
                        onFactureCreated={handleFactureCreated}
                        clients={clients}
                        clientsLoading={clientsLoading}
                        onRechargerClients={chargerClients}
                    />
                );
            case 'modifier':
                return (
                    <FactureForm 
                        mode={FORM_MODES.EDIT}
                        idFacture={selectedFactureId}
                        onRetourListe={handleRetourListe}
                        clients={clients}
                        clientsLoading={clientsLoading}
                        onRechargerClients={chargerClients}
                    />
                );
            case 'afficher':
                console.log('🔍 FactureGestion RENDU afficher - selectedFactureId:', selectedFactureId);
                return (
                    <FactureForm 
                        mode={FORM_MODES.VIEW}
                        idFacture={selectedFactureId}
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
                        <FacturesListe 
                            nouvelleFactureId={selectedFactureId}
                            onModifierFacture={handleModifierFacture}
                            onAfficherFacture={handleAfficherFacture}
                            onNouvelleFacture={handleNouvelleFacture}
                            notification={notification}
                            onClearNotification={() => setNotification({ message: '', type: '' })}
                            onFactureSupprimee={handleFactureSupprimee}
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
            
            {/* Bouton flottant pour ajouter une nouvelle facture (visible uniquement si on est dans la vue liste) */}
            {activeView === 'liste' && section !== 'nouvelle' && (
                <div className="floating-button" onClick={handleNouvelleFacture}>
                    <span>+</span>
                    <div className="floating-tooltip">Nouvelle facture</div>
                </div>
            )}
        </div>
    );
}

export default FactureGestion;