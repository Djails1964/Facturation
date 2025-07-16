import React, { useState, useEffect } from 'react';
import ClientsListe from './ClientsListe';
import { ClientForm, FORM_MODES } from './ClientForm';
import ClientService from './services/ClientService';
import { toBoolean } from './utils/booleanHelper'; // ✅ IMPORT du helper

// Créer une instance unique du service de clients
const clientService = new ClientService();

function ClientGestion({ section = 'liste', clientId = null, onClientCreated = null, onSectionChange = null }) {
    const [activeView, setActiveView] = useState(section);
    const [selectedClientId, setSelectedClientId] = useState(clientId);
    const [notification, setNotification] = useState({ message: '', type: '' });

    // Effet pour mettre à jour la vue active quand la prop section change
    useEffect(() => {
        setActiveView(section);
    }, [section]);

    // Effet pour mettre à jour l'ID du client sélectionné quand la prop clientId change
    useEffect(() => {
        if (clientId !== null) {
            setSelectedClientId(clientId);
        }
    }, [clientId]);

    // Notification au parent quand la section change
    useEffect(() => {
        if (onSectionChange) {
            onSectionChange(activeView);
        }
    }, [activeView, onSectionChange]);

    // Fonction pour gérer le retour à la liste des clients
    const handleRetourListe = async (clientId = null, message = '', type = '') => {
        if (clientId) {
            setSelectedClientId(clientId);
        }
        if (message) {
            setNotification({ message, type: type || 'success' });
        }
        setActiveView('liste');
    };

    // Fonction pour gérer la création réussie d'un client
    const handleClientCreated = async (clientId, message = 'Client créé avec succès') => {
        setSelectedClientId(clientId);
        setNotification({ message, type: 'success' });
        
        // ✅ VÉRIFICATION SÉCURISÉE DU STATUT THÉRAPEUTE AVEC LE HELPER
        try {
            const estTherapeute = await clientService.estTherapeute(clientId);
            const statutTherapeute = toBoolean(estTherapeute);
            
            console.log(`Le client ${clientId} est${statutTherapeute ? '' : ' pas'} thérapeute`);
            
            // Possibilité d'ajouter une logique spécifique selon le statut
            if (statutTherapeute) {
                console.log('💚 Client thérapeute créé - actions spéciales possibles');
            }
        } catch (error) {
            console.error('Erreur lors de la vérification du statut thérapeute', error);
        }
        
        // Si un gestionnaire externe a été fourni, l'appeler et laisser le parent gérer la navigation
        if (onClientCreated) {
            onClientCreated(clientId);
        } else {
            // Comportement par défaut si aucun gestionnaire n'est fourni
            setActiveView('liste');
        }
    };

    // Fonction pour gérer la modification d'un client
    const handleModifierClient = (clientId) => {
        setSelectedClientId(clientId);
        setActiveView('modifier');
    };

    // Fonction pour gérer l'affichage d'un client
    const handleAfficherClient = (clientId) => {
        setSelectedClientId(clientId);
        setActiveView('afficher');
    };

    // Fonction pour passer à la vue de création d'un nouveau client
    const handleNouveauClient = () => {
        setActiveView('nouveau');
    };

    // Fonction pour gérer les notifications de suppression
    const handleClientSupprime = (message = 'Client supprimé avec succès') => {
        setNotification({ message, type: 'success' });
    };

    // ✅ GESTIONNAIRE AMÉLIORÉ avec utilisation du helper booléen
    const handleVerifierSuppressionClient = async (clientId) => {
        try {
            const result = await clientService.checkClientDeletable(clientId);
            
            // ✅ UTILISATION SÉCURISÉE DU HELPER BOOLÉEN
            const aUneFacture = toBoolean(result.aUneFacture);
            
            console.log('✅ DEBUG - Vérification suppression client:', {
                clientId,
                aUneFacture,
                resultBrut: result.aUneFacture,
                resultNormalise: aUneFacture
            });
            
            if (aUneFacture) {
                setNotification({
                    message: 'Impossible de supprimer ce client : il a des factures associées.',
                    type: 'error'
                });
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('Erreur lors de la vérification de suppression:', error);
            setNotification({
                message: 'Erreur lors de la vérification de suppression du client.',
                type: 'error'
            });
            return false;
        }
    };

    // Rendu conditionnel selon la vue active
    const renderContent = () => {
        switch (activeView) {
            case 'nouveau':
                return (
                    <ClientForm 
                        mode={FORM_MODES.CREATE}
                        onRetourListe={handleRetourListe} 
                        onClientCreated={handleClientCreated}
                        clientService={clientService} // Passer le service au formulaire
                    />
                );
            case 'modifier':
                return (
                    <ClientForm 
                        mode={FORM_MODES.EDIT}
                        onRetourListe={handleRetourListe}
                        clientId={selectedClientId}
                        clientService={clientService} // Passer le service au formulaire
                    />
                );
            case 'afficher':
                return (
                    <ClientForm 
                        mode={FORM_MODES.VIEW}
                        clientId={selectedClientId}
                        onRetourListe={handleRetourListe}
                        clientService={clientService} // Passer le service au formulaire
                    />
                );
            case 'liste':
            default:
                return (
                    <ClientsListe 
                        nouveauClientId={selectedClientId}
                        onModifierClient={handleModifierClient}
                        onAfficherClient={handleAfficherClient}
                        onClientSupprime={handleClientSupprime}
                        notification={notification}
                        onClearNotification={() => setNotification({ message: '', type: '' })}
                        onSetNotification={(message, type) => setNotification({ message, type })}
                        clientService={clientService} // Passer le service à la liste
                        onVerifierSuppressionClient={handleVerifierSuppressionClient}
                    />
                );
        }
    };

    return (
        <div className="client-gestion-container">
            {renderContent()}
            
            {/* Bouton flottant pour ajouter un nouveau client (visible uniquement si on est dans la vue liste) */}
            {activeView === 'liste' && section !== 'nouveau-client' && (
                <div className="cl-floating-button" onClick={handleNouveauClient}>
                    <span>+</span>
                    <div className="cl-floating-tooltip">Nouveau client</div>
                </div>
            )}
        </div>
    );
}

export default ClientGestion;