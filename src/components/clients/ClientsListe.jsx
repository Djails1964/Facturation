// src/components/clients/ClientsListe.jsx
// ✅ VERSION avec bouton Payer intégré

import React, { useState, useEffect, useCallback } from 'react';
import { FiEdit, FiEye, FiTrash2, FiMail, FiPhone, FiMapPin, FiHome, FiKey } from 'react-icons/fi';
import '../../styles/components/clients/ClientsListe.css';

// ✅ Système modal unifié
import { showConfirm, showLoading, showCustom } from '../../utils/modalSystem';
import ModalComponents from '../shared/ModalComponents';

// ✅ Hooks actions
import { useClientActions } from './hooks/useClientActions';

// ✅ Utilitaires
import { toBoolean, normalizeBooleanFieldsArray } from '../../utils/booleanHelper';
import { createLogger } from '../../utils/createLogger';
import { formatMontant } from '../../utils/formatters';

// ✅ Logger créé une seule fois en dehors du composant
const logger = createLogger('ClientsListe');

/**
 * Icône composite pour indiquer qu'un client a un loyer
 * Colorée selon l'état de paiement agrégé des loyers du client
 */
function RentalIcon({ size = 18, etatPaiement = null }) {
  const etatClass = etatPaiement === 'paye'
    ? 'rental-etat-paye'
    : etatPaiement === 'partiellement_paye'
      ? 'rental-etat-partiel'
      : etatPaiement === 'non_paye'
        ? 'rental-etat-non-paye'
        : '';

  const titre = etatPaiement === 'paye'
    ? 'Loyer(s) entièrement payé(s)'
    : etatPaiement === 'partiellement_paye'
      ? 'Loyer(s) partiellement payé(s)'
      : etatPaiement === 'non_paye'
        ? 'Loyer(s) non payé(s)'
        : 'Client avec loyer';

  return (
    <span
      className={`cl-rental-icon ${etatClass}`}
      title={titre}
      aria-label={titre}
    >
      <FiHome size={size} className="rental-icon-home" />
      <FiKey size={size * 0.55} className="rental-icon-key" />
    </span>
  );
}

function ClientsListe({ 
    nouveauidClient = null, 
    onModifierClient, 
    onAfficherClient, 
    onClientSupprime, 
    onSetNotification,
    notification = { message: '', type: '' }, 
    onClearNotification 
}) {
    // ============================================================
    // HOOKS & STATE
    // ============================================================
    
    // ✅ Hooks actions clients
    const {
        chargerClients: chargerClientsApi,
        checkClientDeletable,
        deleteClient,
        isLoading: actionIsLoading,
        error: actionError
    } = useClientActions();

    // States
    const [clients, setClients] = useState([]);
    const [clientsNonFiltres, setClientsNonFiltres] = useState([]);
    const [clientSelectionne, setClientSelectionne] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [termeRecherche, setTermeRecherche] = useState('');

    // ✅ Refs pour les fonctions de useClientActions (évite les dépendances instables)
    const chargerClientsApiRef = React.useRef(chargerClientsApi);
    chargerClientsApiRef.current = chargerClientsApi;
    
    const checkClientDeletableRef = React.useRef(checkClientDeletable);
    checkClientDeletableRef.current = checkClientDeletable;
    
    const deleteClientRef = React.useRef(deleteClient);
    deleteClientRef.current = deleteClient;

    // ============================================================
    // FONCTIONS DE BASE (Chargement, recherche, navigation)
    // ============================================================

    // Fonction de normalisation des clients
    const normalizeClientsData = React.useCallback((clientsData) => {
        if (!Array.isArray(clientsData)) return clientsData;
        // Normaliser les booléens et mapper loyer_etat_paiement → loyerEtatPaiement
        const normalized = normalizeBooleanFieldsArray(clientsData, ['estTherapeute']);
        return normalized.map(cl => ({
            ...cl,
            loyerEtatPaiement: cl.loyerEtatPaiement || null
        }));
    }, []);
    
    // ✅ Charger les clients
    const chargerClients = useCallback(async () => {
        setIsLoading(true);
        try {
            logger.info('📄 Chargement des clients...');
            const data = await chargerClientsApiRef.current();
            const normalizedData = normalizeClientsData(data || []);
            logger.debug('🔍 CLIENTS:', normalizedData.map(c => ({nom: c.nom, type: typeof c.estTherapeute})));
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
    }, []);

    // ✅ Charger les clients au montage
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

    // Vider la recherche
    const viderRecherche = () => {
        setTermeRecherche('');
        setClients(clientsNonFiltres);
    };

    // Navigation
    const afficherClient = (idClient) => {
        if (onAfficherClient) {
            onAfficherClient(idClient);
        }
    };

    const modifierClient = (idClient) => {
        if (onModifierClient) {
            onModifierClient(idClient);
        }
    };

    // ============================================================
    // SUPPRESSION CLIENT
    // ============================================================

    const handleSupprimerClient = async (idClient, event) => {
        if (event) {
            event.stopPropagation();
        }

        const anchorRef = React.createRef();
        if (event && event.currentTarget) {
            anchorRef.current = event.currentTarget;
        }

        try {
            logger.info(`🗑️ Tentative de suppression du client #${idClient}`);

            // 1. Vérifier si le client a des factures
            const checkResult = await showLoading(
                {
                    title: "Vérification...",
                    content: ModalComponents.createLoadingContent("Vérification des factures..."),
                    anchorRef,
                    size: 'small',
                    position: 'smart'
                },
                async () => {
                    return await checkClientDeletableRef.current(idClient);
                }
            );

            logger.debug('Résultat vérification:', checkResult);

            // 2. Si le client a des factures, bloquer la suppression
            if (checkResult.aUneFacture) {
                logger.warn(`⚠️ Client #${idClient} a des factures, suppression bloquée`);
                
                await showCustom({
                    title: "Suppression impossible",
                    content: ModalComponents.createSimpleModalContent({
                        intro: "Ce client ne peut pas être supprimé car il possède des factures.",
                        warningMessage: "Veuillez d'abord supprimer toutes les factures associées à ce client.",
                        warningType: "warning"
                    }),
                    buttons: ModalComponents.createModalButtons({
                        submitText: "OK",
                        showCancel: false
                    }),
                    anchorRef,
                    position: 'smart'
                });
                return;
            }

            // 3. Demander confirmation
            const confirmed = await showConfirm({
                title: "Confirmer la suppression",
                content: ModalComponents.createSimpleModalContent({
                    intro: `Êtes-vous sûr de vouloir supprimer ce client ?`,
                    warningMessage: "Cette action est irréversible.",
                    warningType: "error"
                }),
                buttons: ModalComponents.createModalButtons({
                    cancelText: "Annuler",
                    submitText: "Supprimer",
                    submitClass: "danger"
                }),
                anchorRef,
                position: 'smart'
            });

            if (!confirmed) {
                logger.info('❌ Suppression annulée par l\'utilisateur');
                return;
            }

            // 4. Supprimer le client
            const deleteResult = await showLoading(
                {
                    title: "Suppression en cours...",
                    content: ModalComponents.createLoadingContent("Suppression du client..."),
                    anchorRef,
                    size: 'small',
                    position: 'smart'
                },
                async () => {
                    return await deleteClientRef.current(idClient);
                }
            );

            // 5. Traiter le résultat
            if (deleteResult.success) {
                logger.info(`✅ Client #${idClient} supprimé avec succès`);
                
                if (onClientSupprime) {
                    onClientSupprime(deleteResult.message || 'Client supprimé avec succès');
                }

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

    // ============================================================
    // UTILITAIRES
    // ============================================================

    // Formater l'adresse complète
    const formaterAdresse = (client) => {
        const rue = client.rue || '';
        const numero = client.numero || '';
        const codePostal = client.codePostal || '';
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

    // ============================================================
    // RENDER
    // ============================================================

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
                                aria-label="Effacer la recherche"
                            >
                                ×
                            </button>
                        )}
                    </div>
                </div>

                {/* Liste des clients */}
                {isLoading ? (
                    <div className="cl-loading-message">Chargement des clients...</div>
                ) : error ? (
                    <div className="cl-error-message">{error}</div>
                ) : clients.length === 0 ? (
                    <div className="cl-empty-message">
                        {termeRecherche ? 'Aucun client ne correspond à votre recherche.' : 'Aucun client enregistré.'}
                    </div>
                ) : (
                    <div className="cl-grid-container">
                        {clients.map(client => (
                            <div 
                                key={client.idClient}
                                className={`cl-client-card ${clientSelectionne === client.idClient ? 'selected' : ''}`}
                                onClick={() => setClientSelectionne(client.idClient)}
                                data-therapist={toBoolean(client.estTherapeute)}
                            >
                                <div className="cl-client-header">
                                    <div className="cl-client-name-section">
                                        <h3 className="cl-client-name">
                                            {client.prenom} {client.nom}
                                            {client.loyerEtatPaiement && <RentalIcon etatPaiement={client.loyerEtatPaiement} />}
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
                                
                                {/* ✅ BOUTONS D'ACTION */}
                                <div className="cl-card-actions">
                                    {/* Bouton Afficher */}
                                    <button 
                                        className="bouton-action"
                                        aria-label="Afficher le client"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            afficherClient(client.idClient);
                                        }}
                                    >
                                        <FiEye className="action-view-icon" />
                                    </button>

                                    {/* Bouton Modifier */}
                                    <button 
                                        className="bouton-action"
                                        aria-label="Modifier le client"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            modifierClient(client.idClient);
                                        }}
                                    >
                                        <FiEdit className="action-edit-icon" />
                                    </button>

                                    {/* Bouton Supprimer */}
                                    <button 
                                        className="bouton-action bouton-supprimer"
                                        aria-label="Supprimer le client"
                                        onClick={(e) => handleSupprimerClient(client.idClient, e)}
                                    >
                                        <FiTrash2 className="action-delete-icon" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ClientsListe;