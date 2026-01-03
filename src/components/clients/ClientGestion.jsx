// src/components/clients/ClientGestion.jsx
// ✅ REFACTORISÉ: Utilisation de useClientActions au lieu de ClientService direct

import React, { useState, useEffect } from 'react';
import ClientsListe from './ClientsListe';
import { ClientForm, FORM_MODES } from './ClientForm';
// ✅ MODIFICATION: Import de useClientActions au lieu de ClientService
import { useClientActions } from './hooks/useClientActions';
import { toBoolean } from '../../utils/booleanHelper';
// ✅ Import de createLogger (déjà présent selon l'utilisateur)
import { createLogger } from '../../utils/createLogger';

function ClientGestion({ section = 'liste', idClient = null, onClientCreated = null, onSectionChange = null }) {
    // ✅ Initialisation du logger
    const logger = createLogger('ClientGestion');

    // ✅ Utilisation de useClientActions pour les opérations API
    const {
        estTherapeute,
        checkClientDeletable,
        isLoading: actionIsLoading,
        error: actionError
    } = useClientActions();

    const [activeView, setActiveView] = useState(section);
    const [selectedClientId, setSelectedClientId] = useState(idClient);
    const [notification, setNotification] = useState({ message: '', type: '' });

    // Effet pour mettre à jour la vue active quand la prop section change
    useEffect(() => {
        setActiveView(section);
    }, [section]);

    // Effet pour mettre à jour l'ID du client sélectionné quand la prop idClient change
    useEffect(() => {
        if (idClient !== null) {
            setSelectedClientId(idClient);
        }
    }, [idClient]);

    // Notification au parent quand la section change
    useEffect(() => {
        if (onSectionChange) {
            onSectionChange(activeView);
        }
    }, [activeView, onSectionChange]);

    // Fonction pour gérer le retour à la liste des clients
    const handleRetourListe = async (idClient = null, success = false, message = '', type = '') => {
        logger.info('🔄 handleRetourListe appelé avec:', { idClient, success, message, type });
        
        if (idClient) {
            setSelectedClientId(idClient);
        }
        
        // ✅ Gérer correctement les paramètres dans l'ordre
        if (message && message.trim() !== '') {
            const notificationType = type || (success ? 'success' : 'error');
            logger.debug('📢 Notification définie:', { message, type: notificationType });
            setNotification({ message, type: notificationType });
        }
        
        setActiveView('liste');
    };

    // Fonction pour gérer la création réussie d'un client
    const handleClientCreated = async (idClient, message = 'Client créé avec succès') => {
        setSelectedClientId(idClient);
        setNotification({ message, type: 'success' });
        
        // ✅ VÉRIFICATION SÉCURISÉE DU STATUT THÉRAPEUTE AVEC useClientActions
        try {
            const statutTherapeute = await estTherapeute(idClient);
            
            logger.info(`Le client ${idClient} est${statutTherapeute ? '' : ' pas'} thérapeute`);
            
            // Possibilité d'ajouter une logique spécifique selon le statut
            if (statutTherapeute) {
                logger.debug('💚 Client thérapeute créé - actions spéciales possibles');
            }
        } catch (error) {
            logger.error('Erreur lors de la vérification du statut thérapeute', error);
        }
        
        // Si un gestionnaire externe a été fourni, l'appeler et laisser le parent gérer la navigation
        if (onClientCreated) {
            onClientCreated(idClient);
        } else {
            // Comportement par défaut si aucun gestionnaire n'est fourni
            setActiveView('liste');
        }
    };

    // Fonction pour gérer la modification d'un client
    const handleModifierClient = (idClient) => {
        logger.debug('✏️ Modification du client:', idClient);
        setSelectedClientId(idClient);
        setActiveView('modifier');
    };

    // Fonction pour gérer l'affichage d'un client
    const handleAfficherClient = (idClient) => {
        logger.debug('👁️ Affichage du client:', idClient);
        setSelectedClientId(idClient);
        setActiveView('afficher');
    };

    // Fonction pour passer à la vue de création d'un nouveau client
    const handleNouveauClient = () => {
        logger.debug('➕ Création d\'un nouveau client');
        setActiveView('nouveau');
    };

    // Fonction pour gérer les notifications de suppression
    const handleClientSupprime = (message = 'Client supprimé avec succès') => {
        setNotification({ message, type: 'success' });
    };

    // ✅ GESTIONNAIRE AMÉLIORÉ avec useClientActions
    const handleVerifierSuppressionClient = async (idClient) => {
        try {
            const result = await checkClientDeletable(idClient);
            
            // ✅ UTILISATION SÉCURISÉE DU HELPER BOOLÉEN
            const aUneFacture = toBoolean(result.aUneFacture);
            
            logger.debug('✅ Vérification suppression client:', {
                idClient,
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
            logger.error('Erreur lors de la vérification de suppression:', error);
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
                        // ❌ SUPPRIMÉ: clientService - useClientActions est utilisé dans useClientForm
                    />
                );
            case 'modifier':
                return (
                    <ClientForm 
                        mode={FORM_MODES.EDIT}
                        onRetourListe={handleRetourListe}
                        idClient={selectedClientId}
                        // ❌ SUPPRIMÉ: clientService - useClientActions est utilisé dans useClientForm
                    />
                );
            case 'afficher':
                return (
                    <ClientForm 
                        mode={FORM_MODES.VIEW}
                        idClient={selectedClientId}
                        onRetourListe={handleRetourListe}
                        // ❌ SUPPRIMÉ: clientService - useClientActions est utilisé dans useClientForm
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
                        // ❌ SUPPRIMÉ: clientService - useClientActions est utilisé dans ClientsListe
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
                <div className="floating-button" onClick={handleNouveauClient}>
                    <span>+</span>
                    <div className="floating-tooltip">Nouveau client</div>
                </div>
            )}
        </div>
    );
}

export default ClientGestion;