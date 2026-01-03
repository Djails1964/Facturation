// src/components/clients/ClientsListe.jsx
// ✅ VERSION REFACTORISÉE avec useClientActions au lieu de ClientService direct

import React, { useState, useEffect, useCallback } from 'react';
import { FiEdit, FiEye, FiTrash2, FiMail, FiPhone, FiMapPin } from 'react-icons/fi';
import '../../styles/components/clients/ClientsListe.css';

// ✅ Système modal unifié
import { showConfirm, showLoading, showCustom } from '../../utils/modalSystem';
import ModalComponents from '../shared/ModalComponents';

// ✅ MODIFICATION: Import de useClientActions au lieu de ClientService
import { useClientActions } from './hooks/useClientActions';
import { toBoolean, normalizeBooleanFieldsArray } from '../../utils/booleanHelper';
// ✅ Import de createLogger
import { createLogger } from '../../utils/createLogger';

// ✅ Logger créé une seule fois en dehors du composant pour éviter les re-renders
const logger = createLogger('ClientsListe');

function ClientsListe({ 
    nouveauClientId = null, 
    onModifierClient, 
    onAfficherClient, 
    onClientSupprime, 
    onSetNotification,
    notification = { message: '', type: '' }, 
    onClearNotification 
}) {
    // ✅ Utilisation de useClientActions pour toutes les opérations API
    const {
        chargerClients: chargerClientsApi,
        checkClientDeletable,
        deleteClient,
        isLoading: actionIsLoading,
        error: actionError
    } = useClientActions();

    const [clients, setClients] = useState([]);
    const [clientsNonFiltres, setClientsNonFiltres] = useState([]);
    const [clientSelectionne, setClientSelectionne] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [termeRecherche, setTermeRecherche] = useState('');

    // ✅ Ref pour stocker la fonction chargerClientsApi (évite les dépendances instables)
    const chargerClientsApiRef = React.useRef(chargerClientsApi);
    chargerClientsApiRef.current = chargerClientsApi;
    
    // ✅ Refs pour les autres fonctions de useClientActions
    const checkClientDeletableRef = React.useRef(checkClientDeletable);
    checkClientDeletableRef.current = checkClientDeletable;
    
    const deleteClientRef = React.useRef(deleteClient);
    deleteClientRef.current = deleteClient;

    // Fonction de normalisation des clients
    const normalizeClientsData = React.useCallback((clientsData) => {
        if (!Array.isArray(clientsData)) return clientsData;
        return normalizeBooleanFieldsArray(clientsData, ['estTherapeute']);
    }, []);
    
    // ✅ Charger les clients avec useClientActions - SANS dépendances instables
    const chargerClients = useCallback(async () => {
        setIsLoading(true);
        try {
            logger.info('🔄 Chargement des clients...');
            // Utiliser la ref pour accéder à la fonction la plus récente
            const data = await chargerClientsApiRef.current();
            const normalizedData = normalizeBooleanFieldsArray(data || [], ['estTherapeute']);
            setClientsNonFiltres(normalizedData);
            setClients(normalizedData);
            setError(null);
            logger.info(`✅ ${normalizedData.length} clients chargés`);
        } catch (err) {
            logger.error('❌ Erreur lors du chargement des clients:', err);
            setError('Impossible de charger les clients. Veuillez réessayer.');
        } finally {
            setIsLoading(false);
        }
    }, []); // ✅ Pas de dépendances instables!

    // ✅ Charger les clients une seule fois au montage
    useEffect(() => {
        chargerClients();
    }, [chargerClients]);

    // Recherche client
    const handleRechercheChange = (e) => {
        const terme = e.target.value.toLowerCase();
        setTermeRecherche(e.target.value);

        if (terme === '') {
            setClients(clientsNonFiltres);
        } else {
            const resultats = clientsNonFiltres.filter(client =>
                `${client.prenom} ${client.nom}`.toLowerCase().includes(terme) ||
                (client.email && client.email.toLowerCase().includes(terme)) ||
                (client.telephone && client.telephone.includes(terme)) ||
                (client.localite && client.localite.toLowerCase().includes(terme))
            );
            setClients(resultats);
        }
    };

    const viderRecherche = () => {
        setTermeRecherche('');
        setClients(clientsNonFiltres);
    };

    const modifierClient = (idClient) => {
        if (onModifierClient) {
            onModifierClient(idClient);
        }
    };

    const afficherClient = (idClient) => {
        if (onAfficherClient) {
            onAfficherClient(idClient);
        }
    };

    // ✅ Suppression client avec useClientActions et système modal unifié
    const handleSupprimerClient = async (idClient, event) => {
        if (event) {
            event.stopPropagation();
        }

        const client = clients.find(c => c.id === idClient);
        if (!client) return;

        // Créer anchorRef pour le positionnement
        const anchorRef = React.createRef();
        if (event && event.currentTarget) {
            anchorRef.current = event.currentTarget;
        }

        try {
            // 1. Vérifier si le client a des factures avec useClientActions
            logger.info(`🔍 Vérification de la supprimabilité du client #${idClient}`);
            const checkResult = await showLoading(
                {
                    title: "Vérification...",
                    content: ModalComponents.createLoadingContent("Vérification des factures associées..."),
                    anchorRef,
                    size: 'small',
                    position: 'smart'
                },
                async () => {
                    // ✅ Utilisation de la ref pour checkClientDeletable
                    return await checkClientDeletableRef.current(idClient);
                }
            );

            logger.debug('✅ checkResult:', checkResult);

            // 2. Si le client a des factures, afficher l'erreur
            if (checkResult.aUneFacture === true) {
                logger.warn(`⚠️ Client #${idClient} a des factures, suppression impossible`);
                await showCustom({
                    title: "Suppression impossible",
                    content: ModalComponents.createWarningSection(
                        "⚠️ Client lié à des factures",
                        `Le client "${client.prenom} ${client.nom}" ne peut pas être supprimé car il possède une ou plusieurs facture(s) associée(s).<br><br>Veuillez d'abord supprimer ou réassigner les factures avant de supprimer ce client.`,
                        "error"
                    ),
                    anchorRef,
                    size: 'medium',
                    position: 'smart',
                    buttons: [
                        {
                            text: "Compris",
                            action: "close",
                            className: "primary"
                        }
                    ]
                });
                return;
            }

            // 3. Demander confirmation de suppression
            const confirmResult = await showConfirm({
                title: "Confirmer la suppression",
                message: `Êtes-vous sûr de vouloir supprimer le client "${client.prenom} ${client.nom}" ?\n\n⚠️ Cette action est irréversible.`,
                confirmText: "Supprimer définitivement",
                cancelText: "Annuler",
                type: 'danger',
                anchorRef,
                position: 'smart',
                size: 'medium'
            });

            if (confirmResult.action !== 'confirm') {
                logger.debug('❌ Suppression annulée par l\'utilisateur');
                return;
            }

            // 4. Effectuer la suppression avec useClientActions
            logger.info(`🗑️ Suppression du client #${idClient}`);
            const deleteResult = await showLoading(
                {
                    title: "Suppression en cours...",
                    content: ModalComponents.createLoadingContent("Suppression du client..."),
                    anchorRef,
                    size: 'small',
                    position: 'smart'
                },
                async () => {
                    // ✅ Utilisation de la ref pour deleteClient
                    return await deleteClientRef.current(idClient);
                }
            );

            // 5. Traiter le résultat
            if (deleteResult.success) {
                logger.info(`✅ Client #${idClient} supprimé avec succès`);
                
                // Notifier le succès
                if (onClientSupprime) {
                    onClientSupprime(deleteResult.message || 'Client supprimé avec succès');
                }

                // Recharger la liste
                await chargerClients();
                setClientSelectionne(null);
            } else {
                throw new Error(deleteResult.message || 'Erreur lors de la suppression');
            }

        } catch (error) {
            logger.error('❌ Erreur lors de la suppression du client:', error);
            if (onSetNotification) {
                onSetNotification(
                    'Une erreur est survenue lors de la suppression du client: ' + error.message,
                    'error'
                );
            }
        }
    };

    // Formater l'adresse complète
    const formaterAdresse = (client) => {
        const rue = client.rue || '';
        const numero = client.numero || '';
        const codePostal = client.code_postal || '';
        const localite = client.localite || '';
    
        const adresseParts = [
            rue && numero ? `${rue} ${numero}` : (rue || numero),
            codePostal && localite ? `${codePostal} ${localite}` : (codePostal || localite)
        ].filter(part => part);
    
        return adresseParts.length > 0 ? adresseParts.join(', ') : 'Adresse non renseignée';
    };

    // Afficher les notifications
    const renderNotification = () => {
        if (!notification.message) return null;
        
        const className = notification.type === 'success' 
            ? 'cl-notification cl-notification-success' 
            : 'cl-notification cl-notification-error';
        
        return (
            <div className={className}>
                <span>{notification.message}</span>
                <button 
                    onClick={onClearNotification} 
                    className="cl-notification-close"
                >
                    ×
                </button>
            </div>
        );
    };

    return (
        <div className="content-section-container">
            <div className="content-section-title">
                <h2>Clients ({clients.length})</h2>
            </div>
            
            <div className="cl-clients-table">
                {renderNotification()}
                
                {/* Barre de recherche */}
                <div className="cl-search-container">
                    <div className="cl-search-input-wrapper">
                        <input
                            type="text"
                            id="rechercheClient"
                            value={termeRecherche}
                            onChange={handleRechercheChange}
                            placeholder="Rechercher un client..."
                            className="cl-search-input"
                        />
                        {termeRecherche && (
                            <button 
                                onClick={viderRecherche} 
                                className="cl-clear-search"
                                title="Effacer la recherche"
                            >
                                ×
                            </button>
                        )}
                    </div>
                </div>
                
                {/* Contenu principal - Affichage en grille */}
                {isLoading ? (
                    <div className="cl-loading-message">Chargement des clients...</div>
                ) : error ? (
                    <div className="cl-error-message">{error}</div>
                ) : clients.length === 0 ? (
                    <div className="cl-empty-message">Aucun client trouvé</div>
                ) : (
                    <div className="cl-grid-container">
                        {clients.map(client => (
                            <div 
                                key={client.id}
                                className={`cl-client-card ${clientSelectionne === client.id ? 'selected' : ''}`}
                                onClick={() => setClientSelectionne(client.id)}
                            >
                                <div className="cl-client-header">
                                    <div className="cl-client-name-section">
                                        <h3 className="cl-client-name">
                                            {client.prenom} {client.nom}
                                        </h3>
                                        <div className="cl-client-badge">
                                            {toBoolean(client.estTherapeute) ? 'Thérapeute' : 'Client'}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="cl-client-contact">
                                    {client.email && (
                                        <div className="cl-contact-item">
                                            <FiMail size={16} />
                                            <span>{client.email}</span>
                                        </div>
                                    )}
                                    {client.telephone && (
                                        <div className="cl-contact-item">
                                            <FiPhone size={16} />
                                            <span>{client.telephone}</span>
                                        </div>
                                    )}
                                    <div className="cl-contact-item">
                                        <FiMapPin size={16} />
                                        <span>{formaterAdresse(client)}</span>
                                    </div>
                                </div>
                                
                                <div className="cl-card-actions">
                                    <button 
                                        className="bouton-action"
                                        aria-label="Afficher le client"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            afficherClient(client.id);
                                        }}
                                    >
                                        <FiEye className="action-view-icon" />
                                    </button>

                                    <button 
                                        className="bouton-action"
                                        aria-label="Modifier le client"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            modifierClient(client.id);
                                        }}
                                    >
                                        <FiEdit className="action-edit-icon" />
                                    </button>

                                    <button 
                                        className="bouton-action bouton-supprimer"
                                        aria-label="Supprimer le client"
                                        onClick={(e) => handleSupprimerClient(client.id, e)}
                                    >
                                        <FiTrash2 className="action-delete-icon" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ✅ SUPPRESSION: Plus de <ConfirmationModal /> ici */}
        </div>
    );
}

export default ClientsListe;