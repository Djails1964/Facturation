import React, { useState, useEffect } from 'react';
import { FiEye, FiEdit, FiTrash2, FiPlus, FiFilter } from 'react-icons/fi';
import PaiementService from '../../services/PaiementService';
import ClientService from '../../services/ClientService';
import '../../styles/components/paiements/PaiementsListe.css';
import { formatMontant, formatDate } from '../../utils/formatters';

function PaiementsListe({ 
    nouveauPaiementId,
    onModifierPaiement,
    onAfficherPaiement,
    onNouveauPaiement,
    notification,
    onClearNotification,
    onPaiementSupprime,
    onSetNotification,
    initialFilter = {}
}) {
    
    // Services
    const paiementService = new PaiementService();
    const clientService = new ClientService();
    
    // États principaux
    const [paiements, setPaiements] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState(null);
    const [paiementSelectionne, setPaiementSelectionne] = useState(null);
    
    // États pour les filtres
    const [filtres, setFiltres] = useState({
        annee: new Date().getFullYear(),
        mois: '',
        methode: '',
        clientId: '',
        ...initialFilter
    });
    const [showFilters, setShowFilters] = useState(false);
    
    // États pour les données de filtrage
    const [anneesOptions, setAnneesOptions] = useState([]);
    const [clients, setClients] = useState([]);
    const [isLoadingClients, setIsLoadingClients] = useState(false);
    
    // États pour les modales
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [paiementToDelete, setPaiementToDelete] = useState(null);
    
    // Charger les données initiales
    useEffect(() => {
        chargerPaiements();
        chargerAnneesDisponibles();
        chargerClients();
    }, []);
    
    // Recharger les paiements quand les filtres changent
    useEffect(() => {
        chargerPaiements();
    }, [filtres]);
    
    // Sélectionner le nouveau paiement créé
    useEffect(() => {
        if (nouveauPaiementId) {
            setPaiementSelectionne(nouveauPaiementId);
        }
    }, [nouveauPaiementId]);
    
    // Charger la liste des paiements
    const chargerPaiements = async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            const options = {
                annee: filtres.annee || undefined,
                mois: filtres.mois || undefined,
                methode: filtres.methode || undefined,
                clientId: filtres.clientId || undefined,
                page: 1,
                limit: 50
            };
            
            const result = await paiementService.chargerPaiements(options);
            setPaiements(result.paiements);
            setPagination(result.pagination);
        } catch (error) {
            console.error('Erreur lors du chargement des paiements:', error);
            setError('Une erreur est survenue lors du chargement des paiements');
        } finally {
            setIsLoading(false);
        }
    };
    
    // Charger les années disponibles
    const chargerAnneesDisponibles = async () => {
        try {
            const annees = await paiementService.getAnneesDisponibles();
            setAnneesOptions(annees);
        } catch (error) {
            console.error('Erreur lors du chargement des années:', error);
        }
    };
    
    // Charger la liste des clients
    const chargerClients = async () => {
        setIsLoadingClients(true);
        try {
            const clientsData = await clientService.chargerClients();
            setClients(clientsData);
        } catch (error) {
            console.error('Erreur lors du chargement des clients:', error);
        } finally {
            setIsLoadingClients(false);
        }
    };
    
    // Gestionnaires de filtres
    const handleFilterChange = (filterName, value) => {
        setFiltres(prev => ({
            ...prev,
            [filterName]: value
        }));
    };
    
    const resetFilters = () => {
        setFiltres({
            annee: new Date().getFullYear(),
            mois: '',
            methode: '',
            clientId: ''
        });
    };
    
    // Gestion de la suppression
    const handleSupprimerPaiement = (paiementId) => {
        const paiement = paiements.find(p => p.id === paiementId);
        if (paiement) {
            setPaiementToDelete(paiement);
            setShowDeleteModal(true);
        }
    };
    
    const confirmerSuppression = async () => {
        if (!paiementToDelete) return;
        
        try {
            const result = await paiementService.deletePaiement(paiementToDelete.id);
            if (result.success) {
                onPaiementSupprime(result.message);
                chargerPaiements(); // Recharger la liste
            } else {
                onSetNotification('Erreur lors de la suppression du paiement', 'error');
            }
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            onSetNotification('Une erreur est survenue lors de la suppression', 'error');
        } finally {
            setShowDeleteModal(false);
            setPaiementToDelete(null);
        }
    };
    
    // Générer les options de mois
    const getMoisOptions = () => {
        return [
            { value: '', label: 'Tous les mois' },
            { value: 1, label: 'Janvier' },
            { value: 2, label: 'Février' },
            { value: 3, label: 'Mars' },
            { value: 4, label: 'Avril' },
            { value: 5, label: 'Mai' },
            { value: 6, label: 'Juin' },
            { value: 7, label: 'Juillet' },
            { value: 8, label: 'Août' },
            { value: 9, label: 'Septembre' },
            { value: 10, label: 'Octobre' },
            { value: 11, label: 'Novembre' },
            { value: 12, label: 'Décembre' }
        ];
    };
    
    // Auto-clear notification
    useEffect(() => {
        if (notification && notification.message) {
            const timer = setTimeout(() => {
                onClearNotification();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [notification, onClearNotification]);
    
    return (
        <div className="content-section-container">
            <div className="content-section-title">
                <h2>Paiements</h2>
                {notification && notification.message && (
                    <div className={`notification ${notification.type}`}>
                        {notification.message}
                        <button onClick={onClearNotification} className="notification-close">×</button>
                    </div>
                )}
            </div>
            
            {/* Filtres */}
            <div className="paiements-filters">
                <button 
                    className="btn-primary"
                    onClick={() => setShowFilters(!showFilters)}
                >
                    <FiFilter size={16} />
                    Filtres
                </button>
                
                {showFilters && (
                    <div className="filters-panel">
                        <div className="filter-row">
                            <div className="input-group">
                                <select 
                                    value={filtres.annee} 
                                    onChange={(e) => handleFilterChange('annee', e.target.value)}
                                >
                                    <option value="">Toutes les années</option>
                                    {anneesOptions.map(annee => (
                                        <option key={annee} value={annee}>{annee}</option>
                                    ))}
                                </select>
                                <label>Année</label>
                            </div>
                            
                            <div className="input-group">
                                <select 
                                    value={filtres.mois} 
                                    onChange={(e) => handleFilterChange('mois', e.target.value)}
                                >
                                    {getMoisOptions().map(mois => (
                                        <option key={mois.value} value={mois.value}>{mois.label}</option>
                                    ))}
                                </select>
                                <label>Mois</label>
                            </div>
                            
                            <div className="input-group">
                                <select 
                                    value={filtres.methode} 
                                    onChange={(e) => handleFilterChange('methode', e.target.value)}
                                >
                                    <option value="">Toutes les méthodes</option>
                                    {paiementService.getMethodesPaiement().map(methode => (
                                        <option key={methode.value} value={methode.value}>{methode.label}</option>
                                    ))}
                                </select>
                                <label>Méthode</label>
                            </div>
                            
                            <div className="input-group">
                                <select 
                                    value={filtres.clientId} 
                                    onChange={(e) => handleFilterChange('clientId', e.target.value)}
                                    disabled={isLoadingClients}
                                >
                                    <option value="">Tous les clients</option>
                                    {clients.map(client => (
                                        <option key={client.id} value={client.id}>
                                            {client.prenom} {client.nom}
                                        </option>
                                    ))}
                                </select>
                                <label>Client</label>
                            </div>
                            
                            <div className="filter-actions">
                                <button onClick={resetFilters} className="btn-secondary">
                                    Réinitialiser
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Contenu principal */}
            <div className="paiements-content">
                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}
                
                {isLoading ? (
                    <div className="loading-message">
                        Chargement des paiements...
                    </div>
                ) : (
                    <>
                        {/* Tableau des paiements */}
                        <div className="paiements-table-container">
                            <div className="paiements-table">
                                <div className="paiements-table-header">
                                    <div className="table-cell">Date</div>
                                    <div className="table-cell">N° Facture</div>
                                    <div className="table-cell">Client</div>
                                    <div className="table-cell">Montant</div>
                                    <div className="table-cell">Méthode</div>
                                    <div className="table-cell"></div>
                                </div>
                                
                                <div className="paiements-table-body">
                                    {paiements.length === 0 ? (
                                        <div className="no-data-message">
                                            Aucun paiement trouvé pour les critères sélectionnés.
                                        </div>
                                    ) : (
                                        paiements.map(paiement => (
                                            <div 
                                                key={paiement.id} 
                                                className={`table-row ${paiementSelectionne === paiement.id ? 'selected' : ''}`}
                                                onClick={() => setPaiementSelectionne(paiement.id)}
                                            >
                                                <div className="table-cell">
                                                    {formatDate(paiement.datePaiement)}
                                                </div>
                                                <div className="table-cell">
                                                    {paiement.numeroFacture}
                                                </div>
                                                <div className="table-cell">
                                                    {paiement.nomClient}
                                                </div>
                                                <div className="table-cell">
                                                    {formatMontant(paiement.montantPaye)} CHF
                                                </div>
                                                <div className="table-cell">
                                                    {paiementService.formatMethodePaiement(paiement.methodePaiement)}
                                                </div>
                                                {/* ✅ CHANGEMENT: Utilisation des classes standardisées */}
                                                <div className="table-cell lf-actions-cell">
                                                    <button 
                                                        className="bouton-action"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onAfficherPaiement(paiement.id);
                                                        }}
                                                        title="Afficher le paiement"
                                                    >
                                                        <FiEye size={16} className="action-view-icon" />
                                                    </button>
                                                    
                                                    <button 
                                                        className="bouton-action"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onModifierPaiement(paiement.id);
                                                        }}
                                                        title="Modifier le paiement"
                                                    >
                                                        <FiEdit size={16} className="action-edit-icon" />
                                                    </button>
                                                    
                                                    <button 
                                                        className="bouton-action"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleSupprimerPaiement(paiement.id);
                                                        }}
                                                        title="Supprimer le paiement"
                                                    >
                                                        <FiTrash2 size={16} className="action-delete-icon" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        {/* Pagination */}
                        {pagination && pagination.total_pages > 1 && (
                            <div className="pagination">
                                <span>
                                    Page {pagination.page_actuelle} sur {pagination.total_pages} 
                                    ({pagination.total_elements} paiement{pagination.total_elements > 1 ? 's' : ''})
                                </span>
                            </div>
                        )}
                    </>
                )}
            </div>
            
            {/* ✅ CHANGEMENT: Utilisation de la classe standardisée pour le bouton flottant */}
            <button 
                className="lf-floating-button"
                onClick={onNouveauPaiement}
                title="Nouveau paiement"
            >
                <span>+</span>
            </button>
            
            {/* Modal de confirmation de suppression */}
            {showDeleteModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Confirmer la suppression</h3>
                        <p>
                            Êtes-vous sûr de vouloir supprimer ce paiement ?
                        </p>
                        {paiementToDelete && (
                            <div className="paiement-details">
                                <p><strong>Date:</strong> {formatDate(paiementToDelete.datePaiement)}</p>
                                <p><strong>Montant:</strong> {formatMontant(paiementToDelete.montantPaye)} CHF</p>
                                <p><strong>Facture:</strong> {paiementToDelete.numeroFacture}</p>
                                <p><strong>Client:</strong> {paiementToDelete.nomClient}</p>
                            </div>
                        )}
                        {/* ✅ CHANGEMENT: Utilisation des classes standardisées pour les boutons de modal */}
                        <div className="modal-actions">
                            <button 
                                onClick={() => setShowDeleteModal(false)}
                                className="btn-secondary"
                            >
                                Annuler
                            </button>
                            <button 
                                onClick={confirmerSuppression}
                                className="btn-danger"
                            >
                                Supprimer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PaiementsListe;