import React, { useState, useEffect, useCallback } from 'react';
import { FiEdit, FiEye, FiTrash2, FiMail, FiPhone, FiMapPin, FiSlack } from 'react-icons/fi';
import '../../styles/components/clients/ClientsListe.css';
import ConfirmationModal from '../shared/ConfirmationModal';
import ClientService from '../../services/ClientService';
import { toBoolean, normalizeBooleanFieldsArray } from '../../utils/booleanHelper'; // ✅ IMPORT du helper

function ClientsListe({ 
    nouveauClientId = null, 
    onModifierClient, 
    onAfficherClient, 
    onClientSupprime, 
    onSetNotification,
    notification = { message: '', type: '' }, 
    onClearNotification 
}) {
    const [clients, setClients] = useState([]);
    const [clientsNonFiltres, setClientsNonFiltres] = useState([]);
    const [clientSelectionne, setClientSelectionne] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [termeRecherche, setTermeRecherche] = useState('');
    const [clientService] = useState(() => new ClientService());

    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {},
        type: 'warning',
        details: null,
        singleButton: false
    });

    // ✅ FONCTION DE NORMALISATION DES CLIENTS
    const normalizeClientsData = React.useCallback((clientsData) => {
        if (!Array.isArray(clientsData)) return clientsData;
        return normalizeBooleanFieldsArray(clientsData, ['estTherapeute']);
    }, []);
    
    // Effet pour sélectionner automatiquement le nouveau client une fois les clients chargés
    useEffect(() => {
        if (nouveauClientId && clients.length > 0) {
            const idToSelect = parseInt(nouveauClientId);
            const clientExists = clients.some(client => client.id === idToSelect);
            
            if (clientExists) {
                setClientSelectionne(idToSelect);
                
                setTimeout(() => {
                    const element = document.querySelector(`.cl-client-card.cl-selected`);
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }, 100);
            }
        }
    }, [nouveauClientId, clients]);
    
    // ✅ FONCTION DE RECHERCHE SIMPLIFIÉE (TRI SUPPRIMÉ)
    const appliquerRechercheEtTri = React.useCallback(() => {
        let clientsFiltres = [...clientsNonFiltres];
        
        // Appliquer la recherche sur tous les champs si un terme est saisi
        if (termeRecherche.trim()) {
            const termeBas = termeRecherche.toLowerCase();
            clientsFiltres = clientsFiltres.filter(client => {
                // Recherche dans tous les champs du client
                return Object.values(client).some(value => {
                    // Vérifier que la valeur est une string ou un nombre avant de chercher
                    if (value === null || value === undefined) return false;
                    return String(value).toLowerCase().includes(termeBas);
                });
            });
        }
        
        setClients(clientsFiltres);
    }, [clientsNonFiltres, termeRecherche]); // ✅ SUPPRESSION DE triDirection DES DÉPENDANCES

    // ✅ EFFET AVEC DÉPENDANCE CORRECTE
    useEffect(() => {
        appliquerRechercheEtTri();
    }, [appliquerRechercheEtTri]);

    // Effet pour effacer la notification après un certain temps
    useEffect(() => {
        if (notification.message) {
            const timer = setTimeout(() => {
                if (onClearNotification) onClearNotification();
            }, 5000); // La notification disparaît après 5 secondes
            return () => clearTimeout(timer);
        }
    }, [notification, onClearNotification]);

    const chargerClients = useCallback(async () => {
        setIsLoading(true);
        setError(null);
    
        try {
            // Utiliser le service client pour charger les clients
            const clientsData = await clientService.chargerClients();
            
            // ✅ NORMALISATION PRÉVENTIVE DES DONNÉES CLIENTS
            const normalizedClients = normalizeClientsData(clientsData);
            
            console.log('Clients avant normalisation:', clientsData.slice(0, 2));
            console.log('Clients après normalisation:', normalizedClients.slice(0, 2));
            
            setClientsNonFiltres(normalizedClients);
            setClients(normalizedClients);
        } catch (error) {
            console.error('Erreur lors du chargement des clients:', error);
            setError('Une erreur est survenue lors du chargement des clients');
        } finally {
            setIsLoading(false);
        }
    }, [clientService, normalizeClientsData]);

    // Charger les clients au chargement initial
    useEffect(() => {
        chargerClients();
    }, [chargerClients]);


    const handleRechercheChange = (e) => {
        setTermeRecherche(e.target.value);
        // Ne pas effacer la sélection lors de la recherche
        // pour garder le nouveau client sélectionné si besoin
    };

    const handleSelectionClient = (clientId) => {
        setClientSelectionne(clientId === clientSelectionne ? null : clientId);
    };

    const viderRecherche = () => {
        setTermeRecherche('');
    };

    const afficherClient = (clientId) => {
        if (!clientId) return;
        
        // Si onAfficherClient a été fourni, l'utiliser
        if (onAfficherClient) {
            onAfficherClient(clientId);
        } else {
            // Comportement par défaut: redirection
            window.location.href = `client-detail.php?id=${clientId}`;
        }
    };

    const modifierClient = (clientId) => {
        if (!clientId) return;
        
        // Au lieu de rediriger, appeler la fonction du parent si elle existe
        if (onModifierClient) {
            onModifierClient(clientId);
        } else {
            // Conserver le comportement par défaut pour la compatibilité
            window.location.href = `client-modification.php?id=${clientId}`;
        }
    };

    const openConfirmModal = (title, message, onConfirm, type = 'warning', details = null, singleButton = false) => {
        setConfirmModal({
            isOpen: true,
            title,
            message,
            onConfirm,
            type,
            details,
            singleButton
        });
    };
    
    const closeConfirmModal = () => {
        setConfirmModal({
            ...confirmModal,
            isOpen: false
        });
    };

    // Fonction pour supprimer un client
    const supprimerClient = async (clientId) => {
        console.log('🗑️ DEBUG - supprimerClient appelé avec ID:', clientId);
        
        if (!clientId) return;
        
        // 🔧 CORRECTION: Comparaison compatible avec les types
        const client = clients.find(c => String(c.id) === String(clientId));
        
        if (!client) {
            console.log('❌ DEBUG - Client non trouvé pour ID:', clientId);
            return;
        }
        
        console.log('✅ DEBUG - Client trouvé:', client);
    
        // Préparer les détails du client à afficher dans la modal
        const clientDetails = {
            client: `${client.prenom} ${client.nom}`
        };
    
        try {
            console.log('🔍 DEBUG - Appel checkClientDeletable pour ID:', clientId);
        
            // Utiliser le service client pour vérifier si le client peut être supprimé
            const checkResult = await clientService.checkClientDeletable(clientId);
        
            console.log('✅ DEBUG - Résultat checkClientDeletable:', checkResult);
            
            // ✅ UTILISATION SÉCURISÉE DU HELPER BOOLÉEN
            if (toBoolean(checkResult.aUneFacture)) {
                // Le client est lié à une facture, afficher une modal d'erreur
                openConfirmModal(
                    'Suppression impossible',
                    'Ce client ne peut pas être supprimé car il est lié à une ou plusieurs factures.',
                    () => {
                        closeConfirmModal();
                    },
                    'info',
                    {
                        client: clientDetails.client,
                        hasBilling: true,
                        singleButton: true
                    },
                    true
                );
            } else {
                // Le client n'est pas lié à des factures, on peut afficher la modale de confirmation
                openConfirmModal(
                    'Confirmer la suppression',
                    'Êtes-vous sûr de vouloir supprimer ce client ?',
                    async () => {
                        try {
                            // Appel au service client pour supprimer le client
                            const result = await clientService.deleteClient(clientId);
                            
                            if (result.success) {
                                // Notifier le parent de la suppression réussie
                                if (onClientSupprime) {
                                    onClientSupprime(result.message);
                                }
                                
                                // Recharger la liste des clients
                                await chargerClients();
                                setClientSelectionne(null);
                            } else {
                                throw new Error(result.message || 'Erreur lors de la suppression');
                            }
                        } catch (error) {
                            console.error('Erreur:', error);
                            // Notifier le parent de l'erreur
                            if (onSetNotification) {
                                onSetNotification('Une erreur est survenue lors de la suppression du client: ' + error.message, 'error');
                            }
                        } finally {
                            // Fermer la modal
                            closeConfirmModal();
                        }
                    },
                    'danger', // Type 'danger' pour la modal de suppression
                    clientDetails // Passer les détails du client
                );
            }
        } catch (error) {
            console.error('❌ DEBUG - Erreur dans checkClientDeletable:', error);
            console.error('Erreur lors de la vérification des factures:', error);
            // Notifier le parent de l'erreur
            if (onSetNotification) {
                onSetNotification('Une erreur est survenue lors de la vérification des factures: ' + error.message, 'error');
            }
        }
    };

    // Formater l'adresse complète
    const formaterAdresse = (client) => {
        // Vérifier que chaque champ existe et n'est pas undefined
        const rue = client.rue || '';
        const numero = client.numero || '';
        const codePostal = client.code_postal || '';
        const localite = client.localite || '';
    
        // Construire l'adresse uniquement avec les champs non vides
        const adresseParts = [
            rue && numero ? `${rue} ${numero}` : (rue || numero),
            codePostal && localite ? `${codePostal} ${localite}` : (codePostal || localite)
        ].filter(part => part); // Supprimer les parties vides
    
        return adresseParts.length > 0 ? adresseParts.join(', ') : 'Adresse non renseignée';
    };

    // Composant pour afficher les notifications
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
                                className={`cl-client-card ${clientSelectionne === client.id ? 'cl-selected' : ''}`}
                                onClick={() => handleSelectionClient(client.id)}
                                data-client-id={client.id}
                                // ✅ UTILISATION SÉCURISÉE DU HELPER BOOLÉEN
                                data-therapist={toBoolean(client.estTherapeute) ? "true" : "false"}
                            >
                                <div className="cl-client-header">
                                    <div className="cl-client-info">
                                        <div className="cl-client-name">
                                            {String(client.prenom || '')} {String(client.nom || '')}
                                            {/* ✅ UTILISATION SÉCURISÉE DU HELPER BOOLÉEN */}
                                            {toBoolean(client.estTherapeute) && (
                                                <span className="cl-therapist-icon" title="Thérapeute">
                                                    <FiSlack size={16} color="#22c55e" />
                                                </span>
                                            )}
                                        </div>
                                        <div className="cl-client-type">
                                            {/* ✅ UTILISATION SÉCURISÉE DU HELPER BOOLÉEN */}
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
                                        className="bouton-action"
                                        aria-label="Supprimer le client"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            supprimerClient(client.id);
                                        }}
                                    >
                                        <FiTrash2 className="action-delete-icon" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                onConfirm={confirmModal.onConfirm}
                onCancel={closeConfirmModal}
                type={confirmModal.type}
                confirmText="Confirmer"
                cancelText="Annuler"
                details={confirmModal.details}
                singleButton={confirmModal.singleButton}
            />
        </div>
    );
}

export default ClientsListe;